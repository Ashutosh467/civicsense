import Complaint from "../models/complaint.model.js";
import Officer from "../models/officer.model.js";
import { getIO } from "../sockets/socket.js";
import axios from "axios";

export const startEscalationJob = () => {
  console.log("⏰ Escalation job started — checking every hour");

  const check = async () => {
    try {
      const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
      const overdue = await Complaint.find({
        status: "assigned",
        assignedAt: { $lt: cutoff },
      });

      for (const complaint of overdue) {
        complaint.status = "escalated";
        complaint.escalatedAt = new Date();
        await complaint.save();

        const io = getIO();
        io.emit("complaintEscalated", complaint.toJSON());

        if (complaint.assignedTo) {
          const officer = await Officer.findOne({ officerId: complaint.assignedTo });
          if (officer?.phone) {
            axios.post(
              `${process.env.TWILIO_SERVICE_URL}/sms/officer-escalated`,
              {
                officerPhone: officer.phone,
                officerName: officer.name,
                issueType: complaint.translatedIssue || complaint.issueType,
                location: complaint.translatedLocation || complaint.location,
              },
              { headers: { "x-internal-key": process.env.INTERNAL_SECRET } }
            ).catch(err => console.error("Escalation SMS error:", err.message));
          }
        }

        console.log(`🚨 Escalated complaint ${complaint._id} — was assigned to ${complaint.assignedTo}`);
      }

      if (overdue.length > 0) {
        console.log(`🚨 ${overdue.length} complaint(s) escalated to admin`);
      }
    } catch (err) {
      console.error("Escalation job error:", err.message);
    }
  };

  check();
  setInterval(check, 60 * 60 * 1000);
};
