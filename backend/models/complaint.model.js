import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  // Basic Info
  callerNo: { type: String, default: "Unknown" },
  issueType: { type: String, default: "General" },
  location: { type: String, default: "Unknown" },
  urgency: { type: String, default: "low" },
  emotion: { type: String, default: "neutral" },
  summary: { type: String, default: "" },
  status: { type: String, default: "pending" },
  time: { type: Date, default: Date.now },
  department: { type: String, default: "Municipal Services" },
  isDuplicate: { type: Boolean, default: false },
  clusterSize: { type: Number, default: 1 },
  detectedLanguage: { type: String, default: "English" },
  isEnglish: { type: Boolean, default: true },
  translatedIssue: { type: String, default: "" },
  translatedLocation: { type: String, default: "" },
  issue: { type: String, default: "" },

  // Officer Assignment & Resolution
  assignedTo: { type: String, default: null },
  assignedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
  escalatedAt: { type: Date, default: null },
  resolutionNote: { type: String, default: "" },
  resolutionPhoto: { type: String, default: "" },
  citizenConfirmed: { type: Boolean, default: null },
  isArchived: { type: Boolean, default: false },
  disputeReason: { type: String, default: "" },

  // ✅ NEW — AI Urgency Scoring
  urgencyScore: { type: Number, default: 5 }, // 0-10 AI score
  aiConfidence: { type: Number, default: 70 }, // 0-100 confidence
  audioEmotionScore: { type: Number, default: 0 }, // 0-10 panic level
  audioOverride: { type: Boolean, default: false }, // true if panic overrode score

  // ✅ NEW — Dynamic Deadline
  deadlineHours: { type: Number, default: 72 }, // hours to resolve
  deadline: { type: Date, default: null }, // exact deadline datetime
  deadlineStatus: {
    type: String,
    enum: ["active", "warning", "critical", "breached"],
    default: "active",
  },

  // ✅ NEW — Reminder Tracking
  reminderSent30: { type: Boolean, default: false }, // 30% reminder sent
  reminderSent60: { type: Boolean, default: false }, // 60% reminder sent
  reminderSent80: { type: Boolean, default: false }, // 80% auto reassign done

  // ✅ NEW — Trust & Community
  trustScoreAtTime: { type: Number, default: 50 }, // caller trust when complained
  isPublic: { type: Boolean, default: false }, // visible to community
  upvotes: { type: Number, default: 0 }, // community upvotes
  upvotedBy: [{ type: String }], // phone numbers who upvoted
});

complaintSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

complaintSchema.set("toJSON", { virtuals: true });

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
