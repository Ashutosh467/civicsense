import OfficerInvite from "../models/officerInvite.model.js";
import Officer from "../models/officer.model.js";
import { geocodeArea } from "../services/geocodeService.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables.");
}

const INVITE_VALID_HOURS = 72;

export const createOfficerInvite = async (req, res) => {
  try {
    const { name, area, department, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Officer name is required." });
    }

    const expiresAt = new Date(
      Date.now() + INVITE_VALID_HOURS * 60 * 60 * 1000,
    );

    const invite = await OfficerInvite.create({
      name,
      area: area || "",
      department: department || "",
      phone: phone || "",
      createdBy: req.admin.id,
      expiresAt,
    });

    // Build the link the officer will actually click
    const inviteLink = `${process.env.FRONTEND_URL}/officer-setup?token=${invite.token}`;

    // Send it directly to the officer's phone via the Twilio service,
    // same internal-key pattern used elsewhere (e.g. auto-assign SMS).
    if (phone) {
      axios
        .post(
          `${process.env.TWILIO_SERVICE_URL}/sms/officer-invite`,
          {
            officerPhone: phone,
            officerName: name,
            inviteLink,
          },
          { headers: { "x-internal-key": process.env.INTERNAL_SECRET } },
        )
        .catch((err) =>
          console.error("Officer invite SMS error:", err.message),
        );
    }

    res.status(201).json({
      message: "Officer invite created",
      token: invite.token,
      inviteLink,
      name: invite.name,
      expiresAt: invite.expiresAt,
      smsSent: Boolean(phone),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOfficerInvites = async (req, res) => {
  try {
    const invites = await OfficerInvite.find().sort({ createdAt: -1 });
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptOfficerInvite = async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res
        .status(400)
        .json({ error: "Token, email and password are required." });
    }

    const invite = await OfficerInvite.findOne({ token });

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

    const existing = await Officer.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An officer account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const officerId = "officer_" + Date.now();

    let coords = null;
    if (invite.area) {
      coords = await geocodeArea(invite.area);
    }

    const newOfficer = await Officer.create({
      officerId,
      name: invite.name,
      area: invite.area,
      department: invite.department,
      phone: invite.phone,
      email,
      password: hashedPassword,
      approvalStatus: "approved",
      currentLocation: coords
        ? { lat: coords.lat, lng: coords.lng }
        : { lat: null, lng: null },
    });

    invite.used = true;
    invite.usedByOfficerId = officerId;
    await invite.save();

    const tokenJwt = jwt.sign(
      { officerId: newOfficer.officerId, role: "officer" },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Officer account created successfully",
      officer: {
        officerId: newOfficer.officerId,
        name: newOfficer.name,
        area: newOfficer.area,
        department: newOfficer.department,
        phone: newOfficer.phone,
        email: newOfficer.email,
      },
      token: tokenJwt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
