const express = require("express");
const { pool } = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { getObjectSignedUrl } = require("../utils/s3");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `
      SELECT e.id, e.title, e.description, e.price, e.file_key, e.cover_key, e.preview_pages
      FROM purchases p
      INNER JOIN ebooks e ON p.ebook_id = e.id
      WHERE p.user_id = $1
      ORDER BY p.id DESC
      `,
      [req.user.id],
    );

    const ebooks = await Promise.all(
      result.rows.map(async (row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        price: Number(row.price),
        fileKey: row.file_key,
        coverKey: row.cover_key,
        previewPages: row.preview_pages,
        coverUrl: await getObjectSignedUrl(row.cover_key, 60 * 60),
      })),
    );

    return res.json(ebooks);
  }),
);

module.exports = { libraryRoutes: router };
