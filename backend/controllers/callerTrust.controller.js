import CallerTrust from "../models/callerTrust.model.js";

/*
=============================
GET CALLER TRUST
=============================
*/
export const getCallerTrust = async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    let caller = await CallerTrust.findOne({ phone });

    // If first time caller — create with default score
    if (!caller) {
      caller = await CallerTrust.create({ phone });
    }

    res.json(caller);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
=============================
TRACK NEW COMPLAINT
=============================
*/
export const trackComplaint = async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    let caller = await CallerTrust.findOne({ phone });

    if (!caller) {
      caller = await CallerTrust.create({ phone });
    }

    // Check spam — more than 3 complaints in 1 hour
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    if (!caller.lastHourWindow || caller.lastHourWindow < oneHourAgo) {
      caller.complaintsLastHour = 0;
      caller.lastHourWindow = now;
    }

    caller.complaintsLastHour += 1;
    caller.totalComplaints += 1;
    caller.lastComplaintAt = now;

    const isSpamming = caller.complaintsLastHour > 3;

    await caller.save();

    res.json({
      isSpamming,
      trustScore: caller.trustScore,
      trustLevel:
        caller.trustScore >= 70
          ? "high"
          : caller.trustScore >= 40
            ? "medium"
            : "low",
      blacklisted: caller.blacklisted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
=============================
UPDATE TRUST SCORE
(called by officer after visiting location)
=============================
*/
export const updateCallerTrust = async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const { outcome } = req.body;
    // outcome: 'genuine' | 'fake' | 'exaggerated' | 'confirmed'

    let caller = await CallerTrust.findOne({ phone });
    if (!caller) {
      caller = await CallerTrust.create({ phone });
    }

    caller.updateTrustScore(outcome);
    await caller.save();

    res.json({
      message: "Trust score updated",
      trustScore: caller.trustScore,
      blacklisted: caller.blacklisted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
=============================
BLACKLIST CALLER
(manual admin action)
=============================
*/
export const blacklistCaller = async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const { reason } = req.body;

    let caller = await CallerTrust.findOne({ phone });
    if (!caller) {
      caller = await CallerTrust.create({ phone });
    }

    caller.blacklisted = true;
    caller.blacklistedAt = new Date();
    caller.blacklistReason = reason || "Manually blacklisted by admin";
    await caller.save();

    res.json({ message: "Caller blacklisted", phone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
