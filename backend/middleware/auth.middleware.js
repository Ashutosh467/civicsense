import jwt from "jsonwebtoken";
import Officer from "../models/officer.model.js";
import User from "../models/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not set in environment variables. Refusing to start without it.",
  );
}

/**
 * Verifies the JWT sent by the officer dashboard.
 * Expects header: Authorization: Bearer <token>
 * On success, attaches the officer document to req.officer
 */
export const protectOfficer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Not authorized. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ error: "Not authorized. Invalid or expired token." });
    }

    const officer = await Officer.findOne({ officerId: decoded.officerId });
    if (!officer) {
      return res
        .status(401)
        .json({ error: "Not authorized. Officer no longer exists." });
    }

    if (officer.approvalStatus !== "approved") {
      return res.status(403).json({ error: "Account not approved." });
    }

    req.officer = officer;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Use after protectOfficer. Ensures the officerId in the URL/body
 * matches the officer the token belongs to.
 */
export const ownsResourceOrAdmin = (paramName = "officerId") => {
  return (req, res, next) => {
    const targetId = req.params[paramName] || req.body[paramName];

    if (req.officer.officerId !== targetId) {
      return res
        .status(403)
        .json({ error: "Forbidden. You can only access your own resources." });
    }

    next();
  };
};

/**
 * Verifies the JWT for the admin dashboard (User model).
 * Accepts BOTH "admin" and "superadmin" roles.
 */
export const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Not authorized. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ error: "Not authorized. Invalid or expired token." });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Not authorized. Account no longer exists." });
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      return res
        .status(403)
        .json({ error: "Forbidden. Admin access required." });
    }

    if (user.isActive === false) {
      return res
        .status(403)
        .json({ error: "This account has been deactivated." });
    }

    req.admin = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Stricter than protectAdmin — only "superadmin" passes.
 */
export const protectSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Not authorized. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ error: "Not authorized. Invalid or expired token." });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Not authorized. Account no longer exists." });
    }

    if (user.role !== "superadmin") {
      return res
        .status(403)
        .json({ error: "Forbidden. Super Admin access required." });
    }

    if (user.isActive === false) {
      return res
        .status(403)
        .json({ error: "This account has been deactivated." });
    }

    req.admin = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
