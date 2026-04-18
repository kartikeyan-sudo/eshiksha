const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { pool } = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../utils/async-handler");
const { env } = require("../config/env");

const router = express.Router();

const razorpayClient = env.razorpayKeyId && env.razorpayKeySecret
  ? new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    })
  : null;

function ensureRazorpayConfigured(res) {
  if (!razorpayClient) {
    res.status(503).json({ message: "Razorpay is not configured on server" });
    return false;
  }

  return true;
}

router.get(
  "/settings",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT value FROM settings WHERE key = 'allow_already_paid'"
    );
    const allowAlreadyPaid = result.rowCount > 0 && result.rows[0].value === "true";
    res.json({ allowAlreadyPaid });
  })
);

router.post(
  "/:ebookId/create-order",
  authenticate,
  asyncHandler(async (req, res) => {
    if (!ensureRazorpayConfigured(res)) {
      return;
    }

    const ebookId = Number(req.params.ebookId);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const ebookResult = await pool.query(
      "SELECT id, title, price, is_free FROM ebooks WHERE id = $1",
      [ebookId],
    );

    if (ebookResult.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const ebook = ebookResult.rows[0];

    const purchaseResult = await pool.query(
      "SELECT id, status FROM purchases WHERE user_id = $1 AND ebook_id = $2",
      [req.user.id, ebookId],
    );

    if (purchaseResult.rowCount > 0) {
      if (purchaseResult.rows[0].status === "payment_review") {
        return res.json({
          message: "Ebook payment is currently under review",
          alreadyPurchased: false,
          inReview: true,
        });
      }
      return res.json({
        message: "Ebook already purchased",
        alreadyPurchased: true,
      });
    }

    if (ebook.is_free || Number(ebook.price) <= 0) {
      await pool.query(
        `
        INSERT INTO purchases (user_id, ebook_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, ebook_id) DO NOTHING
        `,
        [req.user.id, ebookId],
      );

      return res.json({
        message: "Free ebook unlocked",
        isFree: true,
      });
    }

    const amountPaise = Math.round(Number(ebook.price) * 100);
    const receipt = `ebook_${ebookId}_user_${req.user.id}_${Date.now()}`;

    const order = await razorpayClient.orders.create({
      amount: amountPaise,
      currency: env.razorpayCurrency,
      receipt,
      notes: {
        userId: String(req.user.id),
        ebookId: String(ebookId),
      },
    });

    await pool.query(
      `
      INSERT INTO payment_transactions (user_id, ebook_id, order_id, amount, currency, status, gateway_payload)
      VALUES ($1, $2, $3, $4, $5, 'created', $6::jsonb)
      ON CONFLICT (order_id)
      DO UPDATE SET
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        status = 'created',
        gateway_payload = EXCLUDED.gateway_payload,
        updated_at = NOW()
      `,
      [
        req.user.id,
        ebookId,
        order.id,
        Number(ebook.price),
        env.razorpayCurrency,
        JSON.stringify(order),
      ],
    );

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.razorpayKeyId,
      ebook: {
        id: ebook.id,
        title: ebook.title,
        price: Number(ebook.price),
      },
    });
  }),
);

router.post(
  "/:ebookId/already-paid",
  authenticate,
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.ebookId);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const settingsResult = await pool.query(
      "SELECT value FROM settings WHERE key = 'allow_already_paid'"
    );
    const allowAlreadyPaid = settingsResult.rowCount > 0 && settingsResult.rows[0].value === "true";
    if (!allowAlreadyPaid) {
      return res.status(403).json({ message: "Already paid feature disabled" });
    }

    const purchaseResult = await pool.query(
      "SELECT id FROM purchases WHERE user_id = $1 AND ebook_id = $2",
      [req.user.id, ebookId],
    );

    if (purchaseResult.rowCount > 0) {
      return res.json({ message: "Ebook already purchased or in review", alreadyPurchased: true });
    }

    await pool.query(
      `INSERT INTO purchases (user_id, ebook_id, status)
       VALUES ($1, $2, 'payment_review')
       ON CONFLICT (user_id, ebook_id) DO NOTHING`,
      [req.user.id, ebookId],
    );

    return res.json({ message: "Payment in review", success: true });
  })
);

router.post(
  "/:ebookId/verify",
  authenticate,
  asyncHandler(async (req, res) => {
    if (!ensureRazorpayConfigured(res)) {
      return;
    }

    const ebookId = Number(req.params.ebookId);
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};

    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const txResult = await pool.query(
      "SELECT id FROM payment_transactions WHERE order_id = $1 AND user_id = $2 AND ebook_id = $3",
      [orderId, req.user.id, ebookId],
    );

    if (txResult.rowCount === 0) {
      return res.status(400).json({ message: "Invalid payment order" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", env.razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      await pool.query(
        `
        UPDATE payment_transactions
        SET status = 'failed', signature = $2, gateway_payload = $3::jsonb, updated_at = NOW()
        WHERE order_id = $1
        `,
        [orderId, signature, JSON.stringify(req.body || {})],
      );

      return res.status(400).json({ message: "Payment signature verification failed" });
    }

    const created = await pool.query(
      `
      INSERT INTO purchases (user_id, ebook_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, ebook_id) DO NOTHING
      RETURNING id, user_id, ebook_id
      `,
      [req.user.id, ebookId],
    );

    await pool.query(
      `
      UPDATE payment_transactions
      SET payment_id = $2, status = 'verified', signature = $3, gateway_payload = $4::jsonb, updated_at = NOW()
      WHERE order_id = $1
      `,
      [orderId, paymentId, signature, JSON.stringify(req.body || {})],
    );

    return res.status(201).json({
      message: created.rowCount > 0 ? "Purchase successful" : "Ebook already purchased",
      purchase: created.rows[0] || null,
      verified: true,
    });
  }),
);

router.post(
  "/:ebookId",
  authenticate,
  asyncHandler(async (req, res) => {
    const ebookId = Number(req.params.ebookId);
    if (!Number.isInteger(ebookId)) {
      return res.status(400).json({ message: "Invalid ebook id" });
    }

    const ebookResult = await pool.query("SELECT id, is_free, price FROM ebooks WHERE id = $1", [ebookId]);
    if (ebookResult.rowCount === 0) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    const ebook = ebookResult.rows[0];
    if (!ebook.is_free && Number(ebook.price) > 0) {
      return res.status(400).json({ message: "Paid ebook purchase must be completed through Razorpay" });
    }

    const created = await pool.query(
      `
      INSERT INTO purchases (user_id, ebook_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, ebook_id) DO NOTHING
      RETURNING id, user_id, ebook_id
      `,
      [req.user.id, ebookId],
    );

    if (created.rowCount === 0) {
      return res.json({ message: "Ebook already purchased" });
    }

    return res.status(201).json({
      message: "Purchase successful",
      purchase: created.rows[0],
    });
  }),
);

module.exports = { purchaseRoutes: router };
