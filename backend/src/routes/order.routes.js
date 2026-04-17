const express = require("express");
const { pool } = require("../db/pool");
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();
const ORDER_STATUSES = new Set(["pending", "completed", "delivered"]);

// User: get own orders
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.ebook_id,
        p.status,
        p.created_at,
        e.title AS ebook_title,
        e.price AS amount,
        e.cover_key,
        tx.payment_id,
        tx.order_id AS razorpay_order_id
      FROM purchases p
      INNER JOIN ebooks e ON e.id = p.ebook_id
      LEFT JOIN LATERAL (
        SELECT pt.payment_id, pt.order_id
        FROM payment_transactions pt
        WHERE pt.user_id = p.user_id
          AND pt.ebook_id = p.ebook_id
        ORDER BY pt.created_at DESC
        LIMIT 1
      ) tx ON TRUE
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC, p.id DESC
      `,
      [req.user.id],
    );

    const { getObjectSignedUrl } = require("../utils/s3");

    const orders = await Promise.all(
      result.rows.map(async (row) => ({
        id: row.id,
        ebookId: row.ebook_id,
        ebookTitle: row.ebook_title,
        amount: Number(row.amount),
        status: row.status,
        paymentId: row.payment_id || null,
        razorpayOrderId: row.razorpay_order_id || null,
        coverUrl: await getObjectSignedUrl(row.cover_key, 60 * 60),
        createdAt: row.created_at,
      })),
    );

    return res.json(orders);
  }),
);

// Admin: get all orders
router.get(
  "/admin",
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    const statusFilter = typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : "";
    const searchQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const conditions = [];
    const values = [];

    if (statusFilter && ORDER_STATUSES.has(statusFilter)) {
      values.push(statusFilter);
      conditions.push(`p.status = $${values.length}`);
    }

    if (searchQuery) {
      values.push(`%${searchQuery}%`);
      conditions.push(`(u.email ILIKE $${values.length} OR e.title ILIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.ebook_id,
        p.user_id,
        p.status,
        p.created_at,
        u.email AS user_email,
        e.title AS ebook_title,
        e.price AS amount,
        tx.payment_id,
        tx.order_id AS razorpay_order_id
      FROM purchases p
      INNER JOIN users u ON u.id = p.user_id
      INNER JOIN ebooks e ON e.id = p.ebook_id
      LEFT JOIN LATERAL (
        SELECT pt.payment_id, pt.order_id
        FROM payment_transactions pt
        WHERE pt.user_id = p.user_id
          AND pt.ebook_id = p.ebook_id
        ORDER BY pt.created_at DESC
        LIMIT 1
      ) tx ON TRUE
      ${whereClause}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT 200
      `,
      values,
    );

    const orders = result.rows.map((row) => ({
      id: row.id,
      ebookId: row.ebook_id,
      userId: row.user_id,
      userEmail: row.user_email,
      ebookTitle: row.ebook_title,
      amount: Number(row.amount),
      status: row.status,
      paymentId: row.payment_id || null,
      razorpayOrderId: row.razorpay_order_id || null,
      createdAt: row.created_at,
    }));

    return res.json(orders);
  }),
);

// Admin: update order status
router.patch(
  "/:id/status",
  authenticate,
  authorizeAdmin,
  asyncHandler(async (req, res) => {
    const orderId = Number(req.params.id);
    const status = typeof req.body?.status === "string" ? req.body.status.trim().toLowerCase() : "";

    if (!Number.isInteger(orderId)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    if (!ORDER_STATUSES.has(status)) {
      return res.status(400).json({ message: "Invalid status. Must be pending, completed, or delivered" });
    }

    const updated = await pool.query(
      "UPDATE purchases SET status = $1 WHERE id = $2 RETURNING id, status",
      [status, orderId],
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({
      message: "Order status updated",
      order: updated.rows[0],
    });
  }),
);

module.exports = { orderRoutes: router };
