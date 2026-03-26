import Officer from "../models/officer.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "civicsense_super_secret_key_123";

export const officerSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required" });

    const existing = await Officer.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const officerId = "officer_" + Date.now();

    const officer = new Officer({
      officerId,
      name,
      email,
      password: hashedPassword,
      area: "Unassigned",
      department: "Unassigned",
      phone: "",
      approvalStatus: "pending",
    });

    await officer.save();
    res.status(201).json({ message: "Signup successful. Await admin approval." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const officerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const officer = await Officer.findOne({ email });
    if (!officer)
      return res.status(401).json({ error: "Invalid credentials" });

    if (officer.approvalStatus === "pending")
      return res.status(403).json({ error: "Your account is pending admin approval." });

    if (officer.approvalStatus === "rejected")
      return res.status(403).json({ error: "Your account has been rejected. Contact admin." });

    const isMatch = await bcrypt.compare(password, officer.password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { officerId: officer.officerId, role: "officer" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      officer: {
        officerId: officer.officerId,
        name: officer.name,
        area: officer.area,
        department: officer.department,
        phone: officer.phone,
        email: officer.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveOfficer = async (req, res) => {
  try {
    const { officerId } = req.params;
    const { action, area, department } = req.body;
    const officer = await Officer.findOne({ officerId });
    if (!officer)
      return res.status(404).json({ error: "Officer not found" });

    officer.approvalStatus = action === "approve" ? "approved" : "rejected";
    if (action === "approve") {
      if (area && area.trim()) officer.area = area.trim();
      if (department && department.trim()) officer.department = department.trim();
    }
    await officer.save();
    res.status(200).json({ message: `Officer ${action}d successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingOfficers = async (req, res) => {
  try {
    const pending = await Officer.find({ approvalStatus: "pending" });
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
