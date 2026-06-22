import AdminInvite from "../models/adminInvite.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendAdminInviteEmail } from "../services/emailService.js";
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
    const { label, invitedName, email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: "Email is required to send the invite." });
    }

    const expiresAt = new Date(
      Date.now() + INVITE_VALID_HOURS * 60 * 60 * 1000,
    );
    const invite = await AdminInvite.create({
      label: label || "",
      invitedName: invitedName || "",
      invitedEmail: email,
      createdBy: req.admin.id,
      expiresAt,
    });

    const inviteLink = `${process.env.FRONTEND_URL}/admin-setup?token=${invite.token}`;

    let emailSent = false;
    try {
      await sendAdminInviteEmail(email, invitedName || "there", inviteLink);
      emailSent = true;
    } catch (emailErr) {
      console.error("Admin invite email failed:", emailErr.message);
      // Fail open: the invite still exists and the link is returned below,
      // so the Super Admin can send it manually if the email didn't go out.
    }

    res.status(201).json({
      message: emailSent
        ? "Invite created and emailed"
        : "Invite created, but email failed to send",
      token: invite.token,
      inviteLink,
      label: invite.label,
      expiresAt: invite.expiresAt,
      emailSent,
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

/**
 * SUPERADMIN ONLY.
 * Lists every admin/superadmin account, so the Super Admin can see
 * who has access and manage them.
 */
export const getAdminList = async (req, res) => {
  try {
    const admins = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * SUPERADMIN ONLY.
 * Deactivates (or reactivates) an admin account. This blocks login and
 * invalidates their access immediately via protectAdmin's isActive check -
 * it does NOT delete the account or its history.
 */
export const setAdminActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be true or false." });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ error: "Admin account not found." });
    }

    // Safety: a Super Admin can never deactivate themselves through this
    // endpoint - prevents accidentally locking yourself out with no
    // other Super Admin able to reverse it.
    if (target._id.toString() === req.admin.id.toString()) {
      return res
        .status(400)
        .json({ error: "You cannot deactivate your own account." });
    }

    // Safety: never allow deactivating another superadmin through this
    // endpoint. Demoting/deactivating a fellow Super Admin is sensitive
    // enough that it should stay a manual, deliberate database action.
    if (target.role === "superadmin") {
      return res
        .status(403)
        .json({ error: "Super Admin accounts cannot be deactivated here." });
    }

    target.isActive = isActive;
    await target.save();

    res.json({
      message: `Admin ${isActive ? "reactivated" : "deactivated"} successfully.`,
      admin: {
        id: target._id,
        name: target.name,
        email: target.email,
        isActive: target.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
