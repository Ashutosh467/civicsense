import mongoose from "mongoose";
import crypto from "crypto";

const officerInviteSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    name: { type: String, required: true },
    area: { type: String, default: "" },
    department: { type: String, default: "" },
    phone: { type: String, default: "" },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedByOfficerId: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

const OfficerInvite = mongoose.model("OfficerInvite", officerInviteSchema);
export default OfficerInvite;
