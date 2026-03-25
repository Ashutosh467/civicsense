import mongoose from "mongoose";

const officerSchema = new mongoose.Schema({
  officerId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  area: { type: String, default: "" },
  department: { type: String, default: "General" },
  phone: { type: String, default: "" },
  email: { type: String, default: "", unique: true, sparse: true },
  password: { type: String, default: "" },
  approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
  isAvailable: { type: Boolean, default: true },
  activeComplaintsCount: { type: Number, default: 0 },
  currentLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  lastSeen: { type: Date, default: Date.now }
});

officerSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
officerSchema.set('toJSON', { virtuals: true });

const Officer = mongoose.model("Officer", officerSchema);
export default Officer;
