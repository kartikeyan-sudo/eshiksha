const express = require("express");
const { pool } = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { ebookId, pageNumber, content } = req.body;

    if (!Number.isInteger(ebookId) || !Number.isInteger(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Note content is required" });
    }

    const ebookExists = await pool.query("SELECT id FROM ebooks WHERE id = $1", [ebookId]);
    if (ebookExists.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const created = await pool.query(
      `
      INSERT INTO notes (user_id, ebook_id, page_number, content, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, user_id, ebook_id, page_number, content, created_at, updated_at
      `,
      [req.user.id, ebookId, pageNumber, content.trim()],
    );

    const row = created.rows[0];
    return res.status(201).json({
      message: "Note added",
      note: {
        id: row.id,
        userId: row.user_id,
        ebookId: row.ebook_id,
        pageNumber: row.page_number,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
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
      SELECT id, user_id, ebook_id, page_number, content, created_at, updated_at
      FROM notes
      WHERE user_id = $1 AND ebook_id = $2
      ORDER BY page_number ASC, id DESC
      `,
      [req.user.id, ebookId],
    );

    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        ebookId: row.ebook_id,
        pageNumber: row.page_number,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    );
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const noteId = Number(req.params.id);
    if (!Number.isInteger(noteId)) {
      return res.status(400).json({ message: "Invalid note id" });
    }

    const deleted = await pool.query(
      `
      DELETE FROM notes
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [noteId, req.user.id],
    );

    if (deleted.rowCount === 0) {
      return res.status(404).json({ message: "Note not found" });
    }

    return res.json({ message: "Note removed" });
  }),
);

module.exports = { noteRoutes: router };
