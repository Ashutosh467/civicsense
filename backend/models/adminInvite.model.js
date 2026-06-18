import mongoose from "mongoose";
import crypto from "crypto";

const adminInviteSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    label: {
      type: String,
      default: "",
    },
    invitedName: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

const AdminInvite = mongoose.model("AdminInvite", adminInviteSchema);
export default AdminInvite;
