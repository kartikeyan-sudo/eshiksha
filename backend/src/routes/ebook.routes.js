const express = require("express");
const multer = require("multer");
const { randomUUID } = require("crypto");
const { pool } = require("../db/pool");
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const { uploadBuffer, getObjectSignedUrl, getObjectBuffer, deleteObject } = require("../utils/s3");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function mapEbookWithCover(row) {
  const coverUrl = await getObjectSignedUrl(row.cover_key, 60 * 60);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    fileKey: row.file_key,
    coverKey: row.cover_key,
    previewPages: row.preview_pages,
    category: row.category,
    tags: row.tags || [],
    isFree: row.is_free,
    viewsCount: row.views_count || 0,
    averageRating: Number(row.average_rating || 0),
    ratingsCount: Number(row.ratings_count || 0),
    coverUrl,
  };
}

router.post(
  "/upload",
  authenticate,
  authorizeAdmin,
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const { title, description, price, preview_pages, category, tags, is_free } = req.body;
    const pdf = req.files?.pdf?.[0];
    const cover = req.files?.cover?.[0];

    const parsedPrice = Number(price);
    const parsedPreviewPages = Number(preview_pages);

    if (!title || !description || Number.isNaN(parsedPrice) || Number.isNaN(parsedPreviewPages) || !pdf || !cover) {
      return res.status(400).json({ message: "All fields and files are required" });
    }

    const fileId = randomUUID();
    const pdfExtension = (pdf.originalname.split(".").pop() || "pdf").toLowerCase();
    const coverExtension = (cover.originalname.split(".").pop() || "jpg").toLowerCase();
    const pdfKey = `ebook/${fileId}.${pdfExtension}`;
    const coverKey = `covers/${fileId}.${coverExtension}`;

    await uploadBuffer({
      key: pdfKey,
      buffer: pdf.buffer,
      contentType: pdf.mimetype || "application/pdf",
    });

    await uploadBuffer({
      key: coverKey,
      buffer: cover.buffer,
      contentType: cover.mimetype || "image/jpeg",
    });

    const normalizedCategory = (category || "General").trim() || "General";
    const normalizedTags = String(tags || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const isFree = String(is_free || "false") === "true";

    const created = await pool.query(
      `
      INSERT INTO ebooks (title, description, price, file_key, cover_key, preview_pages, category, tags, is_free)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, title, description, price, file_key, cover_key, preview_pages, category, tags, is_free, views_count, 0::float AS average_rating, 0::int AS ratings_count
      `,
      [title, description, parsedPrice, pdfKey, coverKey, parsedPreviewPages, normalizedCategory, normalizedTags, isFree],
    );

    const ebook = await mapEbookWithCover(created.rows[0]);
    return res.status(201).json({ message: "Ebook uploaded", ebook });
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : "";
    const onlyFree = String(req.query.free || "false") === "true";

    const conditions = [];
    const values = [];

    if (query) {
      values.push(`%${query}%`);
      conditions.push(`(e.title ILIKE $${values.length} OR e.description ILIKE $${values.length})`);
    }

    if (category) {
      values.push(category);
      conditions.push(`e.category = $${values.length}`);
    }

    if (tag) {
      values.push(tag);
      conditions.push(`$${values.length} = ANY(e.tags)`);
    }

    if (onlyFree) {
      conditions.push("e.is_free = TRUE");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.description,
        e.price,
        e.file_key,
        e.cover_key,
        e.preview_pages,
        e.category,
        e.tags,
        e.is_free,
        e.views_count,
        COALESCE(AVG(er.rating), 0)::float AS average_rating,
        COUNT(er.id)::int AS ratings_count
      FROM ebooks e
      LEFT JOIN ebook_ratings er ON er.ebook_id = e.id
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.id DESC
      `,
      values,
    );

    const ebooks = await Promise.all(result.rows.map(mapEbookWithCover));
    return res.json(ebooks);
  }),
);

router.get(
  "/trending",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.description,
        e.price,
        e.file_key,
        e.cover_key,
        e.preview_pages,
        e.category,
        e.tags,
        e.is_free,
        e.views_count,
        COALESCE(AVG(er.rating), 0)::float AS average_rating,
        COUNT(er.id)::int AS ratings_count,
        COUNT(p.id)::int AS purchases_count
      FROM ebooks e
      LEFT JOIN ebook_ratings er ON er.ebook_id = e.id
      LEFT JOIN purchases p ON p.ebook_id = e.id
      GROUP BY e.id
      ORDER BY purchases_count DESC, e.views_count DESC, average_rating DESC, e.id DESC
      LIMIT 8
      `,
    );

    const ebooks = await Promise.all(result.rows.map(mapEbookWithCover));
    return res.json(ebooks);
  }),
);

router.get(
  "/:id/related",
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.id);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const requestedLimit = Number(req.query.limit);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 12)
      : 4;

    const sourceResult = await pool.query("SELECT category FROM ebooks WHERE id = $1", [ebookId]);
    if (sourceResult.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const sourceCategory = sourceResult.rows[0].category;

    const relatedResult = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.description,
        e.price,
        e.file_key,
        e.cover_key,
        e.preview_pages,
        e.category,
        e.tags,
        e.is_free,
        e.views_count,
        COALESCE(AVG(er.rating), 0)::float AS average_rating,
        COUNT(er.id)::int AS ratings_count
      FROM ebooks e
      LEFT JOIN ebook_ratings er ON er.ebook_id = e.id
      WHERE e.id <> $1 AND LOWER(e.category) = LOWER($2)
      GROUP BY e.id
      ORDER BY average_rating DESC, e.views_count DESC, e.id DESC
      LIMIT $3
      `,
      [ebookId, sourceCategory, limit],
    );

    const related = await Promise.all(relatedResult.rows.map(mapEbookWithCover));
    return res.json(related);
  }),
);

router.post(
  "/:id/view",
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.id);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    await pool.query("UPDATE ebooks SET views_count = views_count + 1 WHERE id = $1", [ebookId]);
    return res.json({ message: "View tracked" });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.id);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const result = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.description,
        e.price,
        e.file_key,
        e.cover_key,
        e.preview_pages,
        e.category,
        e.tags,
        e.is_free,
        e.views_count,
        COALESCE(AVG(er.rating), 0)::float AS average_rating,
        COUNT(er.id)::int AS ratings_count
      FROM ebooks e
      LEFT JOIN ebook_ratings er ON er.ebook_id = e.id
      WHERE e.id = $1
      GROUP BY e.id
      `,
      [ebookId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const ebook = await mapEbookWithCover(result.rows[0]);

    if (req.headers.authorization?.startsWith("Bearer ")) {
      try {
        const token = req.headers.authorization.slice(7);
        const { verifyToken } = require("../utils/jwt");
        const user = verifyToken(token);

        const purchaseResult = await pool.query(
          "SELECT id FROM purchases WHERE user_id = $1 AND ebook_id = $2",
          [user.id, ebookId],
        );

        ebook.hasPurchased = purchaseResult.rowCount > 0;
      } catch {
        ebook.hasPurchased = false;
      }
    } else {
      ebook.hasPurchased = false;
    }

    return res.json(ebook);
  }),
);

router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.id);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const result = await pool.query(
      "SELECT id, file_key, cover_key FROM ebooks WHERE id = $1",
      [ebookId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const ebook = result.rows[0];

    try {
      await deleteObject(ebook.file_key);
      await deleteObject(ebook.cover_key);
    } catch {
      return res.status(500).json({ message: "Failed to delete files from S3. DB record kept intact." });
    }

    await pool.query("DELETE FROM ebooks WHERE id = $1", [ebookId]);
    return res.json({ message: "Ebook deleted successfully" });
  }),
);

router.get(
  "/:id/access",
  authenticate,
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.id);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const ebookResult = await pool.query(
      "SELECT id, file_key, preview_pages, is_free FROM ebooks WHERE id = $1",
      [ebookId],
    );

    if (ebookResult.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const purchaseResult = await pool.query(
      "SELECT id, status FROM purchases WHERE user_id = $1 AND ebook_id = $2",
      [req.user.id, ebookId],
    );

    const hasValidPurchase = purchaseResult.rowCount > 0 && purchaseResult.rows[0].status === 'completed';
    const isPaymentReview = purchaseResult.rowCount > 0 && purchaseResult.rows[0].status === 'payment_review';
    const hasAccess = hasValidPurchase || ebookResult.rows[0].is_free;
    const ebook = ebookResult.rows[0];
    const pdfUrl = `${req.protocol}://${req.get("host")}/api/ebooks/${ebookId}/stream`;

    return res.json({
      hasAccess,
      isPaymentReview,
      previewPages: ebook.preview_pages,
      pdfUrl,
    });
  }),
);

router.get(
  "/:id/stream",
  authenticate,
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.id);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const ebookResult = await pool.query(
      "SELECT id, file_key, is_free FROM ebooks WHERE id = $1",
      [ebookId],
    );

    if (ebookResult.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const ebook = ebookResult.rows[0];
    const pdfBuffer = await getObjectBuffer(ebook.file_key);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(pdfBuffer.length));
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "no-store");
    return res.send(pdfBuffer);
  }),
);

router.get(
  "/:id/download",
  authenticate,
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.id);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const ebookResult = await pool.query(
      "SELECT id, file_key, is_free FROM ebooks WHERE id = $1",
      [ebookId],
    );

    if (ebookResult.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const purchaseResult = await pool.query(
      "SELECT id FROM purchases WHERE user_id = $1 AND ebook_id = $2",
      [req.user.id, ebookId],
    );

    if (purchaseResult.rowCount === 0 && !ebookResult.rows[0].is_free) {
      return res.status(403).json({ message: "Purchase required to download" });
    }

    const ebook = ebookResult.rows[0];
    const fileName = `${ebookId}.pdf`;
    const pdfBuffer = await getObjectBuffer(ebook.file_key);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(pdfBuffer.length));
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
    res.setHeader("Cache-Control", "no-store");
    return res.send(pdfBuffer);
  }),
);

module.exports = { ebookRoutes: router };
