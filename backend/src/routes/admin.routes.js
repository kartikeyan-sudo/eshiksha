const express = require("express");
const PDFDocument = require("pdfkit");
const { pool } = require("../db/pool");
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();
const ORDER_STATUSES = new Set(["pending", "completed", "delivered"]);
const LOG_TABLES = {
  readingProgress: "reading_progress",
  bookmarks: "bookmarks",
  notes: "notes",
};

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

router.get(
  "/db/stats",
  asyncHandler(async (_req, res) => {
    const [
      users,
      purchases,
      payments,
      readingProgress,
      bookmarks,
      notes,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM users"),
      pool.query("SELECT COUNT(*)::int AS total FROM purchases"),
      pool.query("SELECT COUNT(*)::int AS total FROM payment_transactions"),
      pool.query("SELECT COUNT(*)::int AS total FROM reading_progress"),
      pool.query("SELECT COUNT(*)::int AS total FROM bookmarks"),
      pool.query("SELECT COUNT(*)::int AS total FROM notes"),
    ]);

    return res.json({
      users: users.rows[0].total,
      purchases: purchases.rows[0].total,
      paymentTransactions: payments.rows[0].total,
      readingProgress: readingProgress.rows[0].total,
      bookmarks: bookmarks.rows[0].total,
      notes: notes.rows[0].total,
    });
  }),
);

router.delete(
  "/db/users/:id",
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (req.user?.id === userId) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    const existing = await pool.query("SELECT id, email, role FROM users WHERE id = $1", [userId]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (existing.rows[0].role === "admin") {
      const adminCount = await pool.query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin'");
      if ((adminCount.rows[0]?.total || 0) <= 1) {
        return res.status(400).json({ message: "Cannot delete the last admin account" });
      }
    }

    const deleted = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id, email", [userId]);

    return res.json({
      message: "User and related data deleted",
      user: deleted.rows[0],
    });
  }),
);

router.get(
  "/db/users-export.pdf",
  asyncHandler(async (_req, res) => {
    const users = await pool.query(
      "SELECT id, email, role, is_active, is_blocked FROM users ORDER BY id ASC",
    );

    const doc = new PDFDocument({ margin: 36, size: "A4" });
    const chunks = [];

    const pdfBufferPromise = new Promise((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    doc.fontSize(18).text("EShikhsha - User Export", { align: "left" });
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor("#555").text(`Generated at: ${new Date().toISOString()}`);
    doc.fillColor("#000").moveDown(1);

    doc.fontSize(11).text("ID", 36, doc.y, { width: 45 });
    doc.text("Email", 82, doc.y - 11, { width: 250 });
    doc.text("Role", 335, doc.y - 11, { width: 70 });
    doc.text("Active", 410, doc.y - 11, { width: 60 });
    doc.text("Blocked", 470, doc.y - 11, { width: 60 });
    doc.moveDown(0.5);
    doc.moveTo(36, doc.y).lineTo(560, doc.y).strokeColor("#ccc").stroke();

    users.rows.forEach((user) => {
      if (doc.y > 760) {
        doc.addPage();
      }

      doc.moveDown(0.4);
      doc.fontSize(10).fillColor("#000").text(String(user.id), 36, doc.y, { width: 45 });
      doc.text(user.email, 82, doc.y - 10, { width: 250 });
      doc.text(user.role, 335, doc.y - 10, { width: 70 });
      doc.text(user.is_active ? "Yes" : "No", 410, doc.y - 10, { width: 60 });
      doc.text(user.is_blocked ? "Yes" : "No", 470, doc.y - 10, { width: 60 });
    });

    doc.end();
    const pdfBuffer = await pdfBufferPromise;

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=eshiksha-users-${date}.pdf`);
    return res.send(pdfBuffer);
  }),
);

router.delete(
  "/db/orders",
  asyncHandler(async (req, res) => {
    const beforeDate = typeof req.body?.beforeDate === "string" ? req.body.beforeDate.trim() : "";
    const cutoffDate = beforeDate ? new Date(beforeDate) : null;

    if (beforeDate && Number.isNaN(cutoffDate?.getTime())) {
      return res.status(400).json({ message: "Invalid beforeDate value" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let deletedPurchases;
      let deletedPayments;

      if (cutoffDate) {
        deletedPurchases = await client.query("DELETE FROM purchases WHERE created_at < $1", [cutoffDate.toISOString()]);
        deletedPayments = await client.query("DELETE FROM payment_transactions WHERE created_at < $1", [cutoffDate.toISOString()]);
      } else {
        deletedPurchases = await client.query("DELETE FROM purchases");
        deletedPayments = await client.query("DELETE FROM payment_transactions");
      }

      await client.query("COMMIT");

      return res.json({
        message: "Order history cleared",
        deleted: {
          purchases: deletedPurchases.rowCount || 0,
          paymentTransactions: deletedPayments.rowCount || 0,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }),
);

router.delete(
  "/db/logs",
  asyncHandler(async (req, res) => {
    const target = typeof req.body?.target === "string" ? req.body.target : "all";

    const targets = target === "all"
      ? Object.values(LOG_TABLES)
      : [LOG_TABLES[target]];

    if (!targets[0]) {
      return res.status(400).json({
        message: "Invalid target. Use readingProgress, bookmarks, notes, or all",
      });
    }

    const deleted = {};
    for (const tableName of targets) {
      const result = await pool.query(`DELETE FROM ${tableName}`);
      deleted[tableName] = result.rowCount || 0;
    }

    return res.json({
      message: "Logs cleared",
      deleted,
    });
  }),
);

module.exports = { adminRoutes: router };
