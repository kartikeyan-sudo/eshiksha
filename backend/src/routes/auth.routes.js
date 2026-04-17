const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db/pool");
const { authenticate } = require("../middleware/auth");
const { signToken } = require("../utils/jwt");
const { asyncHandler } = require("../utils/async-handler");

const router = express.Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await pool.query(
      `
      INSERT INTO users (email, password, role, is_blocked, is_active)
      VALUES ($1, $2, 'user', FALSE, TRUE)
      RETURNING id, email, role, is_blocked, is_active
      `,
      [email, hashedPassword],
    );

    const user = created.rows[0];
    const token = signToken(user);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await pool.query("SELECT id, email, password, role, is_blocked, is_active FROM users WHERE email = $1", [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    if (user.is_blocked) {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Your account is inactive" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      message: "Login successful",
      token,
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

router.post(
  "/admin-login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await pool.query("SELECT id, email, password, role, is_blocked, is_active FROM users WHERE email = $1", [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Not an admin account" });
    }

    if (user.is_blocked) {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Your account is inactive" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      message: "Admin login successful",
      token,
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
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT id, email, role, is_blocked, is_active FROM users WHERE id = $1",
      [req.user.id],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = result.rows[0];
    return res.json({
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

module.exports = { authRoutes: router };
