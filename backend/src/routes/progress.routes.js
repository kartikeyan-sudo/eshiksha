const express = require("express");
const { pool } = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();

router.use(authenticate);

router.post(
  "/update",
  asyncHandler(async (req, res) => {
    const { ebookId, lastPage, progressPercent } = req.body;

    if (!Number.isInteger(ebookId) || !Number.isInteger(lastPage) || lastPage < 1) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const normalizedProgress = Number.isInteger(progressPercent)
      ? Math.max(0, Math.min(100, progressPercent))
      : 0;

    const ebookExists = await pool.query("SELECT id FROM ebooks WHERE id = $1", [ebookId]);
    if (ebookExists.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const result = await pool.query(
      `
      INSERT INTO reading_progress (user_id, ebook_id, last_page, progress_percent, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, ebook_id)
      DO UPDATE
      SET
        last_page = EXCLUDED.last_page,
        progress_percent = EXCLUDED.progress_percent,
        updated_at = NOW()
      RETURNING id, user_id, ebook_id, last_page, progress_percent, updated_at
      `,
      [req.user.id, ebookId, lastPage, normalizedProgress],
    );

    const row = result.rows[0];
    return res.json({
      message: "Reading progress updated",
      progress: {
        id: row.id,
        userId: row.user_id,
        ebookId: row.ebook_id,
        lastPage: row.last_page,
        progressPercent: row.progress_percent,
        updatedAt: row.updated_at,
      },
    });
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `
      SELECT id, user_id, ebook_id, last_page, progress_percent, updated_at
      FROM reading_progress
      WHERE user_id = $1
      ORDER BY updated_at DESC
      `,
      [req.user.id],
    );

    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        ebookId: row.ebook_id,
        lastPage: row.last_page,
        progressPercent: row.progress_percent,
        updatedAt: row.updated_at,
      })),
    );
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
      SELECT id, user_id, ebook_id, last_page, progress_percent, updated_at
      FROM reading_progress
      WHERE user_id = $1 AND ebook_id = $2
      `,
      [req.user.id, ebookId],
    );

    if (result.rowCount === 0) {
      return res.json({
        progress: {
          userId: req.user.id,
          ebookId,
          lastPage: 1,
          progressPercent: 0,
          updatedAt: null,
        },
      });
    }

    const row = result.rows[0];
    return res.json({
      progress: {
        id: row.id,
        userId: row.user_id,
        ebookId: row.ebook_id,
        lastPage: row.last_page,
        progressPercent: row.progress_percent,
        updatedAt: row.updated_at,
      },
    });
  }),
);

module.exports = { progressRoutes: router };
