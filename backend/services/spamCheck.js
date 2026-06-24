import CallerTrust from "../models/callerTrust.model.js";

export const checkAndTrackSpam = async (phone) => {
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);

  let caller = await CallerTrust.findOne({ phone });

  if (!caller) {
    caller = await CallerTrust.create({
      phone,
      complaintsLastHour: 1,
      lastHourWindow: now,
      lastComplaintAt: now,
    });
    return { isSpam: false, blacklisted: false, trustScore: caller.trustScore };
  }

  if (caller.blacklisted) {
    return {
      isSpam: true,
      blacklisted: true,
      reason: caller.blacklistReason,
      trustScore: caller.trustScore,
    };
  }

  if (!caller.lastHourWindow || caller.lastHourWindow < oneHourAgo) {
    caller.complaintsLastHour = 0;
    caller.lastHourWindow = now;
  }

  caller.complaintsLastHour += 1;
  caller.lastComplaintAt = now;
  caller.totalComplaints += 1;
  await caller.save();

  const isSpam = caller.complaintsLastHour > 3;
  return { isSpam, blacklisted: false, trustScore: caller.trustScore };
};
