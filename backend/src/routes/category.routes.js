const express = require("express");
const { pool } = require("../db/pool");
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();
const DEFAULT_CATEGORY_ICON = "book";

// Public: list all categories
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.icon,
        c.description,
        c.created_at,
        COUNT(e.id)::int AS ebook_count
      FROM categories c
      LEFT JOIN ebooks e ON LOWER(e.category) = LOWER(c.name)
      GROUP BY c.id
      ORDER BY c.name ASC
      `,
    );

    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        description: row.description,
        ebookCount: row.ebook_count,
        createdAt: row.created_at,
      })),
    );
  }),
);

// Admin: create category
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    const { name, icon, description } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const normalizedName = name.trim();
    const normalizedIcon = typeof icon === "string" && icon.trim() ? icon.trim() : DEFAULT_CATEGORY_ICON;
    const normalizedDesc = (description || "").trim();

    const existing = await pool.query("SELECT id FROM categories WHERE LOWER(name) = LOWER($1)", [normalizedName]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "Category already exists" });
    }

    const created = await pool.query(
      `
      INSERT INTO categories (name, icon, description)
      VALUES ($1, $2, $3)
      RETURNING id, name, icon, description, created_at
      `,
      [normalizedName, normalizedIcon, normalizedDesc],
    );

    return res.status(201).json({
      message: "Category created",
      category: {
        id: created.rows[0].id,
        name: created.rows[0].name,
        icon: created.rows[0].icon,
        description: created.rows[0].description,
        ebookCount: 0,
        createdAt: created.rows[0].created_at,
      },
    });
  }),
);

// Admin: update category
router.patch(
  "/:id",
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    const categoryId = Number(req.params.id);
    const { name, icon, description } = req.body;

    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const fields = [];
    const values = [];

    if (name && typeof name === "string" && name.trim()) {
      const nextName = name.trim();
      const existing = await pool.query(
        "SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id <> $2",
        [nextName, categoryId],
      );

      if (existing.rowCount > 0) {
        return res.status(409).json({ message: "Category name already exists" });
      }

      values.push(nextName);
      fields.push(`name = $${values.length}`);
    }

    if (icon && typeof icon === "string" && icon.trim()) {
      values.push(icon.trim());
      fields.push(`icon = $${values.length}`);
    }

    if (description !== undefined && typeof description === "string") {
      values.push(description.trim());
      fields.push(`description = $${values.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(categoryId);
    const updated = await pool.query(
      `UPDATE categories SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id, name, icon, description, created_at`,
      values,
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const category = updated.rows[0];
    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM ebooks WHERE LOWER(category) = LOWER($1)",
      [category.name],
    );

    return res.json({
      message: "Category updated",
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon,
        description: category.description,
        ebookCount: countResult.rows[0]?.total || 0,
        createdAt: category.created_at,
      },
    });
  }),
);

// Admin: delete category
router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const deleted = await pool.query("DELETE FROM categories WHERE id = $1 RETURNING id", [categoryId]);

    if (deleted.rowCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json({ message: "Category deleted" });
  }),
);

module.exports = { categoryRoutes: router };
