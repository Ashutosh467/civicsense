import mongoose from "mongoose";
import { DEPARTMENTS } from "../constants/departments.js";

const officerSchema = new mongoose.Schema({
  // Basic Info
  officerId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  area: { type: String, default: "" },
  department: {
    type: String,
    enum: DEPARTMENTS,
    default: "Municipal Services",
  },
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
  // Officer Performance
  trustScore: { type: Number, default: 70 },
  totalResolved: { type: Number, default: 0 },
  totalFake: { type: Number, default: 0 },
  totalEscalated: { type: Number, default: 0 },
  averageResolutionHours: { type: Number, default: 0 },
  warningCount: { type: Number, default: 0 },
});

officerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

officerSchema.set("toJSON", { virtuals: true });

const Officer = mongoose.model("Officer", officerSchema);
export default Officer;
