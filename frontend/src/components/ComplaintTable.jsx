import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";

function ComplaintTable({ complaints }) {
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
    if (s === "in progress") return "bg-blue-500/20 text-blue-400";
    return "bg-green-500/20 text-green-400";
  };

  const emotionColor = (emotion) => {
    const e = emotion?.toLowerCase();
    if (e === "angry") return "bg-red-500/20 text-red-400";
    if (e === "frustrated") return "bg-yellow-500/20 text-yellow-400";
    if (e === "calm") return "bg-green-500/20 text-green-400";
    return "bg-gray-500/20 text-gray-300";
  };

  const sortedComplaints = [...complaints].sort((a, b) => {
    const priority = { high: 1, medium: 2, low: 3 };
    const pA = priority[a.urgency?.toLowerCase()] || 4;
    const pB = priority[b.urgency?.toLowerCase()] || 4;
    return pA - pB;
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
            <th className="p-4">Emotion</th>
            <th className="p-4">Status</th>
            <th className="p-4">Time</th>
          </tr>
        </thead>

        <tbody>
          {sortedComplaints.map((c) => (
            <tr
              key={c.id}
              className={`
                border-t border-white/5 transition duration-300
                ${c.urgency?.toLowerCase() === "high" ? "bg-red-900/20" : ""}
                ${c.urgency?.toLowerCase() === "medium" ? "bg-yellow-900/20" : ""}
                ${c.urgency?.toLowerCase() === "low" ? "bg-green-900/20" : ""}
              `}
            >
              <td className="p-4 font-medium">{c.callerNo}</td>

              <td
                className="p-4 cursor-pointer group"
                onClick={() => navigate('/map', { state: { targetLocation: c.translatedLocation || c.location } })}
              >
                <div className="flex items-center gap-2 group-hover:text-cyan-400 transition">
                  <MapPin className="w-4 h-4 text-gray-500 group-hover:text-cyan-400" />
                  <span className="group-hover:underline decoration-cyan-400/50 underline-offset-4">
                    {c.translatedLocation || c.location}
                  </span>
                </div>
              </td>

              <td className="p-4" title={c.summary}>
                <div className="font-medium text-gray-200">{c.translatedIssue || c.issueType}</div>
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

              {/* URGENCY WITH BLINK DOT */}
              <td className="p-4 flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${urgencyColor(
                    c.urgency
                  )}`}
                >
                  {c.urgency?.toUpperCase() || "UNKNOWN"}
                </span>

                {c.urgency?.toLowerCase() === "high" && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
                {c.isDuplicate && (
                   <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 animate-pulse border border-red-500/50">
                     CLUSTER
                   </span>
                )}
              </td>

              {/* EMOTION BADGE */}
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${emotionColor(
                    c.emotion
                  )}`}
                >
                  {c.emotion}
                </span>
              </td>

              {/* STATUS BADGE */}
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(
                    c.status
                  )}`}
                >
                  {c.status}
                </span>
              </td>

              <td className="p-4 text-gray-400">{c.time}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

export default ComplaintTable;