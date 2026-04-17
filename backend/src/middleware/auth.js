const { verifyToken } = require("../utils/jwt");
const { pool } = require("../db/pool");

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

async function authenticate(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = verifyToken(token);

    const userResult = await pool.query(
      "SELECT id, role, is_blocked, is_active FROM users WHERE id = $1",
      [req.user.id],
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = userResult.rows[0];
    if (user.is_blocked) {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Your account is inactive" });
    }

    req.user = {
      ...req.user,
      role: user.role,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function authorizeAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
}

module.exports = {
  authenticate,
  authorizeAdmin,
};
