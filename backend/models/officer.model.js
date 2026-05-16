import mongoose from "mongoose";

const officerSchema = new mongoose.Schema({
  // Basic Info
  officerId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  area: { type: String, default: "" },
  department: { type: String, default: "General" },
  phone: { type: String, default: "" },
  email: { type: String, default: "", sparse: true },
  password: { type: String, default: "" },
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved",
  },
  isAvailable: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  activeComplaintsCount: { type: Number, default: 0 },
  currentLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  lastSeen: { type: Date, default: Date.now },

  // ✅ NEW — Officer Performance
  trustScore: { type: Number, default: 70 }, // 0-100 reliability
  totalResolved: { type: Number, default: 0 }, // total resolved
  totalFake: { type: Number, default: 0 }, // times nothing found
  totalEscalated: { type: Number, default: 0 }, // times escalated
  averageResolutionHours: { type: Number, default: 0 }, // avg time to resolve
  warningCount: { type: Number, default: 0 }, // warnings received
});

officerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

officerSchema.set("toJSON", { virtuals: true });

const Officer = mongoose.model("Officer", officerSchema);
export default Officer;
