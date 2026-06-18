import Complaint from "../models/complaint.model.js";
import Officer from "../models/officer.model.js";
import { getIO } from "../sockets/socket.js";
import axios from "axios";

export const startEscalationJob = () => {
  console.log("⏰ Escalation job started — checking every 15 minutes");

  const check = async () => {
    try {
      const now = new Date();

      const activeComplaints = await Complaint.find({
        status: { $in: ["assigned", "in_progress"] },
        deadline: { $ne: null },
        isArchived: { $ne: true },
      });

      console.log(
        `🔍 Checking ${activeComplaints.length} active complaints...`,
      );

      for (const complaint of activeComplaints) {
        const deadline = new Date(complaint.deadline);
        const assignedAt = new Date(complaint.assignedAt || complaint.time);
        const totalTime = deadline - assignedAt;
        const elapsed = now - assignedAt;
        const percentElapsed = (elapsed / totalTime) * 100;
        const hoursRemaining = (deadline - now) / (1000 * 60 * 60);

        console.log(
          `📋 Complaint ${complaint._id}: ${percentElapsed.toFixed(0)}% elapsed, ${hoursRemaining.toFixed(1)}h remaining`,
        );

        // ─── 30% REMINDER ───
        if (percentElapsed >= 30 && !complaint.reminderSent30) {
          complaint.reminderSent30 = true;
          complaint.deadlineStatus = "warning";
          await complaint.save();

          if (complaint.assignedTo) {
            const officer = await Officer.findOne({
              officerId: complaint.assignedTo,
            });
            if (officer?.phone) {
              await axios
                .post(
                  `${process.env.TWILIO_SERVICE_URL}/sms/officer-reminder`,
                  {
                    officerPhone: officer.phone,
                    officerName: officer.name,
                    issueType: complaint.translatedIssue || complaint.issueType,
                    location:
                      complaint.translatedLocation || complaint.location,
                    hoursRemaining: hoursRemaining.toFixed(1),
                    reminderType: "30percent",
                  },
                  {
                    headers: { "x-internal-key": process.env.INTERNAL_SECRET },
                  },
                )
                .catch((err) =>
                  console.error("30% reminder SMS failed:", err.message),
                );
            }
          }
          console.log(`⚠️ 30% reminder sent for complaint ${complaint._id}`);
        }

        // ─── 60% WARNING ───
        if (percentElapsed >= 60 && !complaint.reminderSent60) {
          complaint.reminderSent60 = true;
          complaint.deadlineStatus = "critical";
          await complaint.save();

          if (complaint.assignedTo) {
            const officer = await Officer.findOne({
              officerId: complaint.assignedTo,
            });
            if (officer?.phone) {
              await axios
                .post(
                  `${process.env.TWILIO_SERVICE_URL}/sms/officer-reminder`,
                  {
                    officerPhone: officer.phone,
                    officerName: officer.name,
                    issueType: complaint.translatedIssue || complaint.issueType,
                    location:
                      complaint.translatedLocation || complaint.location,
                    hoursRemaining: hoursRemaining.toFixed(1),
                    reminderType: "60percent",
                  },
                  {
                    headers: { "x-internal-key": process.env.INTERNAL_SECRET },
                  },
                )
                .catch((err) =>
                  console.error("60% warning SMS failed:", err.message),
                );
            }
          }

          try {
            getIO().emit("complaintWarning", {
              complaintId: complaint._id,
              message: `⚠️ Complaint at 60% deadline — ${hoursRemaining.toFixed(1)}h remaining`,
              issueType: complaint.issueType,
              location: complaint.location,
            });
          } catch (e) {
            console.error("Socket error:", e.message);
          }

          console.log(`🚨 60% warning sent for complaint ${complaint._id}`);
        }

        // ─── 80% AUTO REASSIGN ───
        if (percentElapsed >= 80 && !complaint.reminderSent80) {
          complaint.reminderSent80 = true;
          await complaint.save();

          const currentOfficerId = complaint.assignedTo;
          const newOfficer = await Officer.findOne({
            isAvailable: true,
            officerId: { $ne: currentOfficerId },
            department: complaint.department,
          });

          if (newOfficer) {
            // Penalize old officer ONCE here only
            if (currentOfficerId) {
              const oldOfficer = await Officer.findOne({
                officerId: currentOfficerId,
              });
              if (oldOfficer) {
                oldOfficer.trustScore = Math.max(
                  0,
                  (oldOfficer.trustScore || 70) - 10,
                );
                oldOfficer.totalEscalated =
                  (oldOfficer.totalEscalated || 0) + 1;
                oldOfficer.activeComplaintsCount = Math.max(
                  0,
                  oldOfficer.activeComplaintsCount - 1,
                );
                await oldOfficer.save();
              }
            }

            // Assign to new officer and mark reassigned
            complaint.assignedTo = newOfficer.officerId;
            complaint.assignedAt = new Date(); // ✅ reset assignedAt so 100% block measures from reassignment
            complaint.status = "assigned";
            // ✅ reset reminder flags for new officer's fresh deadline window
            complaint.reminderSent30 = false;
            complaint.reminderSent60 = false;
            await complaint.save();

            newOfficer.activeComplaintsCount += 1;
            await newOfficer.save();

            if (newOfficer.phone) {
              await axios
                .post(
                  `${process.env.TWILIO_SERVICE_URL}/sms/officer-assigned`,
                  {
                    officerPhone: newOfficer.phone,
                    officerName: newOfficer.name,
                    issueType: complaint.translatedIssue || complaint.issueType,
                    location:
                      complaint.translatedLocation || complaint.location,
                    officerId: newOfficer.officerId,
                  },
                  {
                    headers: { "x-internal-key": process.env.INTERNAL_SECRET },
                  },
                )
                .catch((err) =>
                  console.error("Reassign SMS failed:", err.message),
                );
            }

            try {
              getIO().emit("complaintReassigned", {
                complaintId: complaint._id,
                newOfficerId: newOfficer.officerId,
                newOfficerName: newOfficer.name,
                reason: "Auto reassigned at 80% deadline",
              });
            } catch (e) {
              console.error("Socket error:", e.message);
            }

            console.log(
              `🔄 Auto reassigned complaint ${complaint._id} to ${newOfficer.name}`,
            );
          } else {
            // No officer available — escalate immediately
            console.log(
              `⚠️ No officer available for reassignment — escalating complaint ${complaint._id}`,
            );
            complaint.status = "escalated";
            complaint.escalatedAt = now;
            complaint.deadlineStatus = "breached";
            await complaint.save();

            try {
              getIO().emit("complaintEscalated", complaint.toJSON());
            } catch (e) {
              console.error("Socket error:", e.message);
            }
          }
        }

        // ─── 100% DEADLINE BREACHED — ESCALATE ───
        // ✅ Only runs if complaint was NOT already reassigned at 80%
        // (reminderSent80 = true + assignedAt was reset means new officer is handling it)
        if (now > deadline && complaint.deadlineStatus !== "breached") {
          complaint.status = "escalated";
          complaint.escalatedAt = now;
          complaint.deadlineStatus = "breached";
          await complaint.save();

          // ✅ Only penalize if this officer was the ORIGINAL one (not reassigned)
          // We know it's the original if reminderSent80 is false
          if (complaint.assignedTo && !complaint.reminderSent80) {
            const officer = await Officer.findOne({
              officerId: complaint.assignedTo,
            });
            if (officer) {
              officer.trustScore = Math.max(0, (officer.trustScore || 70) - 15);
              officer.totalEscalated = (officer.totalEscalated || 0) + 1;
              officer.activeComplaintsCount = Math.max(
                0,
                officer.activeComplaintsCount - 1,
              );
              await officer.save();

              if (officer.phone) {
                await axios
                  .post(
                    `${process.env.TWILIO_SERVICE_URL}/sms/officer-escalated`,
                    {
                      officerPhone: officer.phone,
                      officerName: officer.name,
                      issueType:
                        complaint.translatedIssue || complaint.issueType,
                      location:
                        complaint.translatedLocation || complaint.location,
                    },
                    {
                      headers: {
                        "x-internal-key": process.env.INTERNAL_SECRET,
                      },
                    },
                  )
                  .catch((err) =>
                    console.error("Escalation SMS failed:", err.message),
                  );
              }
            }
          }

          complaint.isPublic = true;
          await complaint.save();

          try {
            getIO().emit("complaintEscalated", complaint.toJSON());
          } catch (e) {
            console.error("Socket error:", e.message);
          }

          console.log(
            `🚨 Complaint ${complaint._id} ESCALATED — deadline breached`,
          );
        }
      }
    } catch (err) {
      console.error("Escalation job error:", err.message);
    }
  };

  check();
  setInterval(check, 15 * 60 * 1000);
};
