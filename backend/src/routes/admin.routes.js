const express = require("express");
const { pool } = require("../db/pool");
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();
const ORDER_STATUSES = new Set(["pending", "completed", "delivered"]);

router.use(authenticate, authorizeAdmin);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT id, email, role, is_blocked, is_active FROM users ORDER BY id DESC",
    );

    return res.json(
      result.rows.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isBlocked: user.is_blocked,
        isActive: user.is_active,
      })),
    );
  }),
);

router.patch(
  "/users/:id/block",
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.id);
    const { isBlocked } = req.body;

    if (!Number.isInteger(userId) || typeof isBlocked !== "boolean") {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const updated = await pool.query(
      "UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, email, role, is_blocked, is_active",
      [isBlocked, userId],
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = updated.rows[0];
    return res.json({
      message: "User block status updated",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isBlocked: user.is_blocked,
        isActive: user.is_active,
      },
    });
  }),
);

router.patch(
  "/users/:id/active",
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.id);
    const { isActive } = req.body;

    if (!Number.isInteger(userId) || typeof isActive !== "boolean") {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const updated = await pool.query(
      "UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, role, is_blocked, is_active",
      [isActive, userId],
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = updated.rows[0];
    return res.json({
      message: "User active status updated",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isBlocked: user.is_blocked,
        isActive: user.is_active,
      },
    });
  }),
);

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const [
      { rows: usersRows },
      { rows: activeUsersRows },
      { rows: ebooksRows },
      { rows: purchasesRows },
      { rows: revenueRows },
      { rows: topSellingRows },
      { rows: todayRevenueRows },
      { rows: recentTxRows },
      { rows: totalSalesRows },
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM users"),
      pool.query("SELECT COUNT(*)::int AS total FROM users WHERE is_active = TRUE"),
      pool.query("SELECT COUNT(*)::int AS total FROM ebooks"),
      pool.query("SELECT COUNT(*)::int AS total FROM purchases"),
      pool.query(
        `
        SELECT COALESCE(SUM(e.price), 0)::float AS total_revenue
        FROM purchases p
        JOIN ebooks e ON e.id = p.ebook_id
        `,
      ),
      pool.query(
        `
        SELECT e.id, e.title, COUNT(p.id)::int AS purchases_count
        FROM ebooks e
        LEFT JOIN purchases p ON p.ebook_id = e.id
        GROUP BY e.id
        ORDER BY purchases_count DESC, e.id DESC
        LIMIT 5
        `,
      ),
      // Today's revenue
      pool.query(
        `
        SELECT COALESCE(SUM(pt.amount), 0)::float AS today_revenue
        FROM payment_transactions pt
        WHERE pt.status = 'verified'
          AND pt.created_at >= CURRENT_DATE
        `,
      ),
      // Recent transactions (last 10)
      pool.query(
        `
        SELECT
          pt.amount,
          pt.created_at,
          u.email AS user_email,
          e.title AS ebook_title
        FROM payment_transactions pt
        INNER JOIN users u ON u.id = pt.user_id
        INNER JOIN ebooks e ON e.id = pt.ebook_id
        WHERE pt.status = 'verified'
        ORDER BY pt.created_at DESC
        LIMIT 10
        `,
      ),
      // Total verified sales count
      pool.query(
        "SELECT COUNT(*)::int AS total FROM payment_transactions WHERE status = 'verified'",
      ),
    ]);

    const totalUsers = usersRows[0].total;
    const totalPurchases = purchasesRows[0].total;
    const conversionRate = totalUsers > 0 ? Number(((totalPurchases / totalUsers) * 100).toFixed(2)) : 0;

    return res.json({
      totalUsers,
      activeUsers: activeUsersRows[0].total,
      totalEbooks: ebooksRows[0].total,
      totalPurchases,
      totalRevenue: Number(revenueRows[0].total_revenue || 0),
      conversionRate,
      topSellingEbooks: topSellingRows.map((row) => ({
        id: row.id,
        title: row.title,
        purchasesCount: row.purchases_count,
      })),
      todayRevenue: Number(todayRevenueRows[0].today_revenue || 0),
      totalSales: totalSalesRows[0].total,
      recentTransactions: recentTxRows.map((row) => ({
        amount: Number(row.amount),
        userEmail: row.user_email,
        ebookTitle: row.ebook_title,
        createdAt: row.created_at,
      })),
    });
  }),
);

router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const statusFilter = typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : "";
    const searchQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(req.query.pageSize || "20"), 10) || 20));

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

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM purchases p
      INNER JOIN users u ON u.id = p.user_id
      INNER JOIN ebooks e ON e.id = p.ebook_id
      ${whereClause}
      `,
      values,
    );

    const total = countResult.rows[0]?.total || 0;
    const offset = (page - 1) * pageSize;

    values.push(pageSize);
    values.push(offset);

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
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
      `,
      values,
    );

    const items = result.rows.map((row) => ({
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

    return res.json({
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  }),
);

router.patch(
  "/orders/:id/status",
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

module.exports = { adminRoutes: router };
