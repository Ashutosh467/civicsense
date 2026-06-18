import AdminInvite from "../models/adminInvite.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables.");
}

const INVITE_VALID_HOURS = 72; // invite link expires after 3 days

/**
 * SUPERADMIN ONLY.
 * Generates a new invite link. The actual token is never guessable -
 * it's a long random string created by the AdminInvite model itself.
 */
export const createInvite = async (req, res) => {
  try {
    const { label, invitedName } = req.body;

    const expiresAt = new Date(
      Date.now() + INVITE_VALID_HOURS * 60 * 60 * 1000,
    );

    const invite = await AdminInvite.create({
      label: label || "",
      invitedName: invitedName || "",
      createdBy: req.admin.id,
      expiresAt,
    });

    res.status(201).json({
      message: "Invite created",
      token: invite.token,
      label: invite.label,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * SUPERADMIN ONLY.
 * Lists all invites (used and unused) for visibility/audit purposes.
 */
export const getInvites = async (req, res) => {
  try {
    const invites = await AdminInvite.find().sort({ createdAt: -1 });
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUBLIC, but token-gated.
 * The invited person lands here from their unique link and sets
 * their own name/password. Token must be valid, unused, and unexpired.
 */
export const acceptInvite = async (req, res) => {
  try {
    const { token, name, password, email } = req.body;

    if (!token || !name || !password || !email) {
      return res
        .status(400)
        .json({ error: "Token, name, email and password are required." });
    }

    const invite = await AdminInvite.findOne({ token });

    if (!invite) {
      return res.status(404).json({ error: "Invalid invite link." });
    }
    if (invite.used) {
      return res
        .status(410)
        .json({ error: "This invite link has already been used." });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(410).json({ error: "This invite link has expired." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: invite.role,
    });

    invite.used = true;
    invite.usedBy = newAdmin._id;
    await invite.save();

    const tokenJwt = jwt.sign(
      { id: newAdmin._id, role: newAdmin.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
      token: tokenJwt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
