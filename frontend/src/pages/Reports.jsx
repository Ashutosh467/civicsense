import { useState, useEffect } from "react";
import { API } from "../services/api";
import { FileText, ArrowDownToLine } from "lucide-react";

export default function Reports() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API}/api/complaint`);
        const data = await res.json();
        setComplaints(data);
      } catch (err) {
        console.error("Reports API error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const resolved = complaints.filter(
    (c) => c.status?.toLowerCase() === "resolved",
  );
  const pending = complaints.filter(
    (c) => c.status?.toLowerCase() !== "resolved",
  );
  const highUrgency = complaints.filter(
    (c) => c.urgency?.toLowerCase() === "high",
  );

  const downloadCSV = (data, filename) => {
    if (data.length === 0) return;
    const headers = [
      "ID",
      "Caller",
      "Location",
      "Issue",
      "Urgency",
      "Status",
      "Department",
      "Reported At",
      "Resolved At",
    ];
    const rows = data.map((c) => [
      c.id,
      c.callerNo || "Unknown",
      `"${c.translatedLocation || c.location || "Unknown"}"`,
      `"${c.translatedIssue || c.issue || c.issueType || "General"}"`,
      c.urgency,
      c.status,
      c.department || "",
      new Date(c.time).toLocaleString(),
      c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : "—",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `civicsense_${filename}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TableSection = ({ title, data, color, icon, filename }) => (
    <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}
          >
            {data.length}
          </span>
        </div>
        <button
          onClick={() => downloadCSV(data, filename)}
          disabled={data.length === 0}
          className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-xl transition shadow-lg shadow-purple-500/20 text-sm"
        >
          <ArrowDownToLine className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 animate-pulse text-sm">
          Querying database...
        </p>
      ) : data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">
          No {title.toLowerCase()} complaints found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#0F172A] border-b border-white/10">
              <tr>
                <th className="p-3">DATE</th>
                <th className="p-3">CALLER</th>
                <th className="p-3">LOCATION</th>
                <th className="p-3">ISSUE</th>
                <th className="p-3">URGENCY</th>
                <th className="p-3">DEPARTMENT</th>
                {filename === "resolved" && (
                  <th className="p-3">RESOLVED AT</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="p-3 whitespace-nowrap">
                    {new Date(c.time).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-gray-400">
                    {c.callerNo || "Unknown"}
                  </td>
                  <td className="p-3">
                    {c.translatedLocation || c.location || "Unknown"}
                  </td>
                  <td className="p-3">
                    {c.translatedIssue || c.issue || c.issueType || "General"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        c.urgency?.toLowerCase() === "high"
                          ? "bg-red-500/20 text-red-400"
                          : c.urgency?.toLowerCase() === "medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {c.urgency || "low"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">{c.department || "—"}</td>
                  {filename === "resolved" && (
                    <td className="p-3 text-gray-400 whitespace-nowrap">
                      {c.resolvedAt
                        ? new Date(c.resolvedAt).toLocaleDateString()
                        : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Intelligence Reports
        </h1>
        <p className="text-gray-400 mt-1">
          Structured civic incident data split by resolution status.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-cyan-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">{complaints.length}</h3>
          <p className="text-gray-400 text-sm">Total Incidents</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-green-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">{resolved.length}</h3>
          <p className="text-gray-400 text-sm">Resolved</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-yellow-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">{pending.length}</h3>
          <p className="text-gray-400 text-sm">Pending / Active</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-red-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">
            {highUrgency.length}
          </h3>
          <p className="text-gray-400 text-sm">High Priority</p>
        </div>
      </div>

      {/* Resolved Table */}
      <TableSection
        title="Resolved Complaints"
        data={resolved}
        color="bg-green-500/20 text-green-400"
        icon="✅"
        filename="resolved"
      />

      {/* Pending Table */}
      <TableSection
        title="Pending & Active Complaints"
        data={pending}
        color="bg-yellow-500/20 text-yellow-400"
        icon="⏳"
        filename="pending"
      />
    </div>
  );
}
