function ComplaintTable({ complaints }) {

  const urgencyColor = (urgency) => {
    if (urgency === "High") return "bg-red-500/20 text-red-400";
    if (urgency === "Medium") return "bg-yellow-500/20 text-yellow-400";
    return "bg-green-500/20 text-green-400";
  };

  const statusColor = (status) => {
    if (status === "Pending") return "bg-orange-500/20 text-orange-400";
    if (status === "In Progress") return "bg-blue-500/20 text-blue-400";
    return "bg-green-500/20 text-green-400";
  };

  const emotionColor = (emotion) => {
    if (emotion === "Angry") return "bg-red-500/20 text-red-400";
    if (emotion === "Frustrated") return "bg-yellow-500/20 text-yellow-400";
    if (emotion === "Calm") return "bg-green-500/20 text-green-400";
    return "bg-gray-500/20 text-gray-300";
  };

  const sortedComplaints = [...complaints].sort((a, b) => {
    const priority = { High: 1, Medium: 2, Low: 3 };
    return priority[a.urgency] - priority[b.urgency];
  });

  return (
    <div className="bg-[#111827] rounded-xl shadow-md overflow-hidden border border-white/10">

      <table className="w-full text-left text-sm text-gray-300">

        <thead className="bg-[#1F2937] text-gray-400 uppercase text-xs">
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
                ${c.urgency === "High" ? "bg-red-900/20" : ""}
                ${c.urgency === "Medium" ? "bg-yellow-900/20" : ""}
                ${c.urgency === "Low" ? "bg-green-900/20" : ""}
              `}
            >
              <td className="p-4 font-medium">{c.callerNo}</td>

              <td className="p-4">{c.location}</td>

              <td className="p-4">{c.issueType}</td>

              {/* URGENCY WITH BLINK DOT */}
              <td className="p-4 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${urgencyColor(
                    c.urgency
                  )}`}
                >
                  {c.urgency}
                </span>

                {c.urgency === "High" && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </td>

              {/* EMOTION BADGE */}
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${emotionColor(
                    c.emotion
                  )}`}
                >
                  {c.emotion}
                </span>
              </td>

              {/* STATUS BADGE */}
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(
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