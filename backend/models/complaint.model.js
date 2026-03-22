import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
    callerNo: { type: String, default: "Unknown" },
    issueType: { type: String, default: "General" },
    location: { type: String, default: "Unknown" },
    urgency: { type: String, default: "low" },
    emotion: { type: String, default: "neutral" },
    summary: { type: String, default: "" },
    status: { type: String, default: "pending" },
    time: { type: Date, default: Date.now }
});

complaintSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
complaintSchema.set('toJSON', { virtuals: true });

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
