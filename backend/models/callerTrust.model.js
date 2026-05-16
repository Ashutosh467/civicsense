import mongoose from "mongoose";

const callerTrustSchema = new mongoose.Schema({
  // Identity
  phone: { type: String, required: true, unique: true },

  // Trust Score
  trustScore: { type: Number, default: 50 }, // starts at 50/100

  // Complaint History
  totalComplaints: { type: Number, default: 0 }, // total complaints made
  genuineComplaints: { type: Number, default: 0 }, // verified real complaints
  fakeComplaints: { type: Number, default: 0 }, // officer found nothing
  exaggeratedComplaints: { type: Number, default: 0 }, // issue found but exaggerated

  // Blacklist
  blacklisted: { type: Boolean, default: false },
  blacklistedAt: { type: Date, default: null },
  blacklistReason: { type: String, default: "" },

  // Warnings
  warningCount: { type: Number, default: 0 },
  lastWarningAt: { type: Date, default: null },

  // Pattern Detection
  lastComplaintAt: { type: Date, default: null },
  complaintsLastHour: { type: Number, default: 0 }, // spam detection
  lastHourWindow: { type: Date, default: null }, // window start time

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto update updatedAt
callerTrustSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if caller is spamming
callerTrustSchema.methods.isSpamming = function () {
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);

  // Reset counter if window expired
  if (!this.lastHourWindow || this.lastHourWindow < oneHourAgo) {
    this.complaintsLastHour = 0;
    this.lastHourWindow = now;
  }

  return this.complaintsLastHour >= 3; // more than 3 complaints per hour = spam
};

// Method to update trust score
callerTrustSchema.methods.updateTrustScore = function (outcome) {
  switch (outcome) {
    case "genuine":
      this.trustScore = Math.min(100, this.trustScore + 10);
      this.genuineComplaints += 1;
      break;
    case "fake":
      this.trustScore = Math.max(0, this.trustScore - 20);
      this.fakeComplaints += 1;
      this.warningCount += 1;
      this.lastWarningAt = new Date();
      break;
    case "exaggerated":
      this.trustScore = Math.max(0, this.trustScore - 5);
      this.exaggeratedComplaints += 1;
      break;
    case "confirmed":
      this.trustScore = Math.min(100, this.trustScore + 5);
      break;
  }

  // Auto blacklist if 3+ fake complaints
  if (this.fakeComplaints >= 3) {
    this.blacklisted = true;
    this.blacklistedAt = new Date();
    this.blacklistReason = "3 or more fake complaints registered";
  }

  return this;
};

callerTrustSchema.virtual("trustLevel").get(function () {
  if (this.trustScore >= 70) return "high";
  if (this.trustScore >= 40) return "medium";
  return "low";
});

callerTrustSchema.set("toJSON", { virtuals: true });

const CallerTrust = mongoose.model("CallerTrust", callerTrustSchema);
export default CallerTrust;
