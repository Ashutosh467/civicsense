import Officer from "../models/officer.model.js";

export const softDeleteOfficer = async (req, res) => {
  try {
    const { officerId } = req.params;
    const officer = await Officer.findOne({ officerId });
    if (!officer) return res.status(404).json({ error: "Officer not found" });
    officer.isArchived = true;
    // ADDED: also mark unavailable so any query that filters on isAvailable alone
    // (without isArchived) still correctly excludes this officer going forward.
    officer.isAvailable = false;
    await officer.save();
    res.json({ message: "Officer archived successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
