import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
    callerNo: { type: String, default: "Unknown" },
    issueType: { type: String, default: "General" },
    location: { type: String, default: "Unknown" },
    urgency: { type: String, default: "low" },
    emotion: { type: String, default: "neutral" },
    summary: { type: String, default: "" },
    status: { type: String, default: "pending" },
    time: { type: Date, default: Date.now },
    department: { type: String, default: "Municipal Corporation" },
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
    resolutionNote: { type: String, default: "" },
    resolutionPhoto: { type: String, default: "" },
    citizenConfirmed: { type: Boolean, default: null }
});

complaintSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
complaintSchema.set('toJSON', { virtuals: true });

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
