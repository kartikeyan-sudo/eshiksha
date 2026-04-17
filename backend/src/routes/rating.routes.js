const express = require("express");
const { pool } = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();

router.get(
  "/:ebookId",
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.ebookId);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const [summaryResult, reviewsResult] = await Promise.all([
      pool.query(
        `
        SELECT
          COALESCE(AVG(rating), 0)::float AS average_rating,
          COUNT(*)::int AS total_ratings
        FROM ebook_ratings
        WHERE ebook_id = $1
        `,
        [ebookId],
      ),
      pool.query(
        `
        SELECT er.id, er.user_id, er.ebook_id, er.rating, er.review, er.created_at, er.updated_at, u.email
        FROM ebook_ratings er
        JOIN users u ON u.id = er.user_id
        WHERE er.ebook_id = $1
        ORDER BY er.updated_at DESC
        LIMIT 20
        `,
        [ebookId],
      ),
    ]);

    return res.json({
      averageRating: Number(summaryResult.rows[0].average_rating || 0),
      totalRatings: summaryResult.rows[0].total_ratings,
      reviews: reviewsResult.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        ebookId: row.ebook_id,
        rating: row.rating,
        review: row.review,
        userEmail: row.email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  }),
);

router.get(
  "/:ebookId/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.ebookId);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const result = await pool.query(
      `
      SELECT id, user_id, ebook_id, rating, review, created_at, updated_at
      FROM ebook_ratings
      WHERE ebook_id = $1 AND user_id = $2
      `,
      [ebookId, req.user.id],
    );

    if (result.rowCount === 0) {
      return res.json({ rating: null });
    }

    const row = result.rows[0];
    return res.json({
      rating: {
        id: row.id,
        userId: row.user_id,
        ebookId: row.ebook_id,
        rating: row.rating,
        review: row.review,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  }),
);

router.post(
  "/:ebookId",
  authenticate,
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.ebookId);
    const rating = Number(req.body?.rating);
    const review = typeof req.body?.review === "string" ? req.body.review.trim() : "";

    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
    }

    const ebookExists = await pool.query("SELECT id FROM ebooks WHERE id = $1", [ebookId]);
    if (ebookExists.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const upserted = await pool.query(
      `
      INSERT INTO ebook_ratings (user_id, ebook_id, rating, review)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, ebook_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        review = EXCLUDED.review,
        updated_at = NOW()
      RETURNING id, user_id, ebook_id, rating, review, created_at, updated_at
      `,
      [req.user.id, ebookId, rating, review],
    );

    const row = upserted.rows[0];
    return res.status(201).json({
      message: "Rating saved",
      rating: {
        id: row.id,
        userId: row.user_id,
        ebookId: row.ebook_id,
        rating: row.rating,
        review: row.review,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  }),
);

module.exports = { ratingRoutes: router };
