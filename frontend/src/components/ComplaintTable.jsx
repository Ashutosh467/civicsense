import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { API } from "../services/api";
import { useEffect, useState } from "react";

// ✅ Deadline Timer Component
function DeadlineTimer({ deadline, deadlineStatus }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [color, setColor] = useState("text-gray-400");

  useEffect(() => {
    if (!deadline) return;

    const update = () => {
      const now = new Date();
      const end = new Date(deadline);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("BREACHED");
        setColor("text-red-500 animate-pulse font-bold");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours < 1) {
        setColor("text-red-400 animate-pulse font-bold");
      } else if (hours < 6) {
        setColor("text-orange-400 font-semibold");
      } else if (hours < 24) {
        setColor("text-yellow-400");
      } else {
        setColor("text-green-400");
      }

      setTimeLeft(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline)
    return <span className="text-gray-600 text-xs">No deadline</span>;

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-xs ${color}`}>⏱ {timeLeft}</span>
      {deadlineStatus === "critical" && (
        <span className="text-[10px] text-orange-400 animate-pulse">
          ⚠ Critical
        </span>
      )}
      {deadlineStatus === "breached" && (
        <span className="text-[10px] text-red-500 animate-pulse">
          🚨 Breached
        </span>
      )}
    </div>
  );
}

function ComplaintTable({ complaints, officers = [] }) {
  const navigate = useNavigate();

  const urgencyColor = (urgency) => {
    const u = urgency?.toLowerCase();
    if (u === "high") return "bg-red-500/20 text-red-400";
    if (u === "medium") return "bg-yellow-500/20 text-yellow-400";
    return "bg-green-500/20 text-green-400";
  };

  const statusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") return "bg-orange-500/20 text-orange-400";
    if (s === "in_progress" || s === "assigned")
      return "bg-blue-500/20 text-blue-400";
    if (s === "escalated") return "bg-red-500/20 text-red-400";
    return "bg-green-500/20 text-green-400";
  };

  const emotionColor = (emotion) => {
    const e = emotion?.toLowerCase();
    if (e === "angry") return "bg-red-500/20 text-red-400";
    if (e === "frustrated") return "bg-yellow-500/20 text-yellow-400";
    if (e === "distressed") return "bg-purple-500/20 text-purple-400";
    if (e === "calm") return "bg-green-500/20 text-green-400";
    return "bg-gray-500/20 text-gray-300";
  };

  const rowBg = (c) => {
    if (c.deadlineStatus === "breached")
      return "bg-red-900/30 border-red-500/20";
    if (c.deadlineStatus === "critical")
      return "bg-orange-900/20 border-orange-500/20";
    if (c.urgency?.toLowerCase() === "high") return "bg-red-900/20";
    if (c.urgency?.toLowerCase() === "medium") return "bg-yellow-900/20";
    return "bg-green-900/10";
  };

  const sortedComplaints = [...complaints].sort((a, b) => {
    // Sort by urgency score first
    const scoreA = a.urgencyScore || 0;
    const scoreB = b.urgencyScore || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    // Then by deadline
    const priority = { high: 1, medium: 2, low: 3 };
    return (
      (priority[a.urgency?.toLowerCase()] || 4) -
      (priority[b.urgency?.toLowerCase()] || 4)
    );
  });

  return (
    <div className="bg-[#111827] rounded-xl shadow-md border border-white/10 h-[600px] overflow-y-auto custom-scrollbar relative">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="bg-[#1F2937] text-gray-400 uppercase text-xs sticky top-0 z-10 shadow-md">
          <tr>
            <th className="p-4">Phone</th>
            <th className="p-4">Location</th>
            <th className="p-4">Issue</th>
            <th className="p-4">Urgency</th>
            <th className="p-4">Deadline</th>
            <th className="p-4">Emotion</th>
            <th className="p-4">Status</th>
            <th className="p-4">Officer</th>
          </tr>
        </thead>

        <tbody>
          {sortedComplaints.map((c) => (
            <tr
              key={c.id || c._id}
              className={`border-t border-white/5 transition duration-300 ${rowBg(c)}`}
            >
              {/* PHONE */}
              <td className="p-4 font-medium">{c.callerNo}</td>

              {/* LOCATION */}
              <td
                className="p-4 cursor-pointer group"
                onClick={() =>
                  navigate("/map", {
                    state: {
                      targetLocation: c.translatedLocation || c.location,
                    },
                  })
                }
              >
                <div className="flex items-center gap-2 group-hover:text-cyan-400 transition">
                  <MapPin className="w-4 h-4 text-gray-500 group-hover:text-cyan-400" />
                  <span className="group-hover:underline decoration-cyan-400/50 underline-offset-4">
                    {c.translatedLocation || c.location}
                  </span>
                </div>
              </td>

              {/* ISSUE */}
              <td className="p-4" title={c.summary}>
                <div className="font-medium text-gray-200">
                  {c.translatedIssue || c.issueType}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {!c.isEnglish && c.detectedLanguage && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EEEDFE] text-[#534AB7]">
                      {c.detectedLanguage}→EN
                    </span>
                  )}
                  {c.department && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F1EFE8] text-[#5F5E5A]">
                      {c.department}
                    </span>
                  )}
                </div>
              </td>

              {/* URGENCY + AI SCORE */}
              <td className="p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${urgencyColor(c.urgency)}`}
                    >
                      {c.urgency?.toUpperCase() || "UNKNOWN"}
                    </span>
                    {c.urgency?.toLowerCase() === "high" && (
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  {c.urgencyScore !== undefined && (
                    <span className="text-[10px] text-gray-400">
                      AI Score:{" "}
                      <span
                        className={`font-bold ${
                          c.urgencyScore >= 8
                            ? "text-red-400"
                            : c.urgencyScore >= 6
                              ? "text-orange-400"
                              : c.urgencyScore >= 4
                                ? "text-yellow-400"
                                : "text-green-400"
                        }`}
                      >
                        {c.urgencyScore?.toFixed(1)}/10
                      </span>
                    </span>
                  )}
                  {c.audioOverride && (
                    <span className="text-[10px] text-red-400 animate-pulse">
                      🎙 Audio Emergency
                    </span>
                  )}
                  {c.isDuplicate && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 animate-pulse border border-red-500/50">
                      CLUSTER
                    </span>
                  )}
                </div>
              </td>

              {/* DEADLINE TIMER */}
              <td className="p-4">
                <DeadlineTimer
                  deadline={c.deadline}
                  deadlineStatus={c.deadlineStatus}
                />
                {c.deadlineHours && (
                  <span className="text-[10px] text-gray-600 mt-0.5 block">
                    {c.deadlineHours}h total
                  </span>
                )}
              </td>

              {/* EMOTION */}
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${emotionColor(c.emotion)}`}
                >
                  {c.emotion}
                </span>
              </td>

              {/* STATUS */}
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(c.status)}`}
                >
                  {c.status}
                </span>
              </td>

              {/* OFFICER */}
              <td className="p-4">
                {(c.status?.toLowerCase() === "assigned" ||
                  c.status?.toLowerCase() === "in_progress") && (
                  <div className="flex flex-col items-start gap-1">
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded font-medium">
                      {(() => {
                        const officer = officers.find(
                          (o) => o.officerId === c.assignedTo,
                        );
                        return officer ? officer.name : c.assignedTo;
                      })()}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {(() => {
                        const officer = officers.find(
                          (o) => o.officerId === c.assignedTo,
                        );
                        return officer
                          ? `${officer.department} • Trust: ${officer.trustScore || 70}`
                          : "";
                      })()}
                    </span>
                  </div>
                )}
                {c.status?.toLowerCase() === "pending" && (
                  <span className="text-[10px] text-orange-400 animate-pulse">
                    ⏳ Assigning...
                  </span>
                )}
                {c.status?.toLowerCase() === "resolved" && (
                  <span className="text-green-400 border border-green-500/30 bg-green-500/10 text-xs px-2 py-1 rounded">
                    Resolved ✓
                  </span>
                )}
                {c.status?.toLowerCase() === "escalated" && (
                  <span className="text-red-400 border border-red-500/30 bg-red-500/10 text-xs px-2 py-1 rounded animate-pulse">
                    🚨 Escalated
                  </span>
                )}
              </td>
            </tr>
          ))}
          {sortedComplaints.length === 0 && (
            <tr>
              <td colSpan="8" className="p-8 text-center text-gray-500">
                No complaints found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ComplaintTable;
