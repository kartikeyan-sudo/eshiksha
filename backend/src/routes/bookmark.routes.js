const express = require("express");
const { pool } = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { ebookId, pageNumber } = req.body;

    if (!Number.isInteger(ebookId) || !Number.isInteger(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const ebookExists = await pool.query("SELECT id FROM ebooks WHERE id = $1", [ebookId]);
    if (ebookExists.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const created = await pool.query(
      `
      INSERT INTO bookmarks (user_id, ebook_id, page_number)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, ebook_id, page_number) DO NOTHING
      RETURNING id, user_id, ebook_id, page_number, created_at
      `,
      [req.user.id, ebookId, pageNumber],
    );

    if (created.rowCount === 0) {
      const existing = await pool.query(
        `
        SELECT id, user_id, ebook_id, page_number, created_at
        FROM bookmarks
        WHERE user_id = $1 AND ebook_id = $2 AND page_number = $3
        `,
        [req.user.id, ebookId, pageNumber],
      );

      const row = existing.rows[0];
      return res.json({
        message: "Bookmark already exists",
        bookmark: {
          id: row.id,
          userId: row.user_id,
          ebookId: row.ebook_id,
          pageNumber: row.page_number,
          createdAt: row.created_at,
        },
      });
    }

    const row = created.rows[0];
    return res.status(201).json({
      message: "Bookmark added",
      bookmark: {
        id: row.id,
        userId: row.user_id,
        ebookId: row.ebook_id,
        pageNumber: row.page_number,
        createdAt: row.created_at,
      },
    });
  }),
);

router.get(
  "/:ebookId",
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.ebookId);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const result = await pool.query(
      `
      SELECT id, user_id, ebook_id, page_number, created_at
      FROM bookmarks
      WHERE user_id = $1 AND ebook_id = $2
      ORDER BY page_number ASC
      `,
      [req.user.id, ebookId],
    );

    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        ebookId: row.ebook_id,
        pageNumber: row.page_number,
        createdAt: row.created_at,
      })),
    );
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const bookmarkId = Number(req.params.id);
    if (!Number.isInteger(bookmarkId)) {
      return res.status(400).json({ message: "Invalid bookmark id" });
    }

    const deleted = await pool.query(
      `
      DELETE FROM bookmarks
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [bookmarkId, req.user.id],
    );

    if (deleted.rowCount === 0) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    return res.json({ message: "Bookmark removed" });
  }),
);

module.exports = { bookmarkRoutes: router };
