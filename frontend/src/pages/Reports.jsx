import { useState, useEffect } from "react";
import { API } from "../services/api";
import { FileText, ArrowDownToLine, Users } from "lucide-react";

const authHeaders = () => {
  const token = localStorage.getItem("civicsense_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Returns YYYY-MM-DD for a given Date, in local time
const toDateInput = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getPresetRange = (preset) => {
  const today = new Date();
  if (preset === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6); // last 7 days inclusive
    return { from: toDateInput(start), to: toDateInput(today) };
  }
  if (preset === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateInput(start), to: toDateInput(today) };
  }
  return { from: "", to: "" };
};

export default function Reports() {
  const [activePreset, setActivePreset] = useState("week");
  const [dateRange, setDateRange] = useState(getPresetRange("week"));

  const [resolvedOnTime, setResolvedOnTime] = useState([]);
  const [resolvedAfterEscalation, setResolvedAfterEscalation] = useState([]);
  const [officerRoster, setOfficerRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaintsReport = async (from, to) => {
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`${API}/api/reports/complaints?${params}`, {
        headers: { ...authHeaders() },
      });
      const data = await res.json();
      setResolvedOnTime(
        Array.isArray(data.resolvedOnTime) ? data.resolvedOnTime : [],
      );
      setResolvedAfterEscalation(
        Array.isArray(data.resolvedAfterEscalation)
          ? data.resolvedAfterEscalation
          : [],
      );
    } catch (err) {
      console.error("Failed to fetch complaints report", err);
    }
  };

  const fetchOfficerRoster = async (from, to) => {
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`${API}/api/reports/officers?${params}`, {
        headers: { ...authHeaders() },
      });
      const data = await res.json();
      setOfficerRoster(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch officer roster", err);
    }
  };

  const fetchAll = async (from, to) => {
    setLoading(true);
    await Promise.all([
      fetchComplaintsReport(from, to),
      fetchOfficerRoster(from, to),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll(dateRange.from, dateRange.to);
  }, []);

  const applyPreset = (preset) => {
    setActivePreset(preset);
    if (preset === "custom") return;
    const range = getPresetRange(preset);
    setDateRange(range);
    fetchAll(range.from, range.to);
  };

  const applyCustomRange = () => {
    fetchAll(dateRange.from, dateRange.to);
  };

  const downloadCSV = (data, filename, columns) => {
    if (data.length === 0) return;
    const headers = columns.map((c) => c.label);
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = c.value(row);
        return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
      }),
    );
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
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

  const onTimeColumns = [
    { label: "Caller", value: (r) => r.callerNo },
    { label: "Issue", value: (r) => r.issue },
    { label: "Department", value: (r) => r.department },
    { label: "Location", value: (r) => r.location },
    {
      label: "Resolved At",
      value: (r) => new Date(r.resolvedAt).toLocaleString(),
    },
    { label: "Resolved By (Officer ID)", value: (r) => r.resolvedByOfficerId },
  ];

  const escalatedColumns = [
    ...onTimeColumns,
    {
      label: "Escalated From (Officer ID)",
      value: (r) => r.escalatedFromOfficerId,
    },
  ];

  const officerColumns = [
    { label: "Name", value: (r) => r.name },
    { label: "Officer ID", value: (r) => r.officerId },
    { label: "Phone", value: (r) => r.phone },
    {
      label: "Invite Sent At",
      value: (r) =>
        r.inviteSentAt ? new Date(r.inviteSentAt).toLocaleString() : "N/A",
    },
    {
      label: "Setup Completed At",
      value: (r) =>
        r.setupCompletedAt
          ? new Date(r.setupCompletedAt).toLocaleString()
          : "N/A",
    },
    {
      label: "Date Joined",
      value: (r) =>
        r.dateJoined ? new Date(r.dateJoined).toLocaleDateString() : "N/A",
    },
  ];

  const ComplaintTableSection = ({
    title,
    data,
    color,
    icon,
    filename,
    columns,
    showEscalatedFrom,
  }) => (
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
          onClick={() => downloadCSV(data, filename, columns)}
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
          No {title.toLowerCase()} found in this date range.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#0F172A] border-b border-white/10">
              <tr>
                <th className="p-3">CALLER</th>
                <th className="p-3">ISSUE</th>
                <th className="p-3">DEPARTMENT</th>
                <th className="p-3">LOCATION</th>
                <th className="p-3">RESOLVED AT</th>
                <th className="p-3">RESOLVED BY</th>
                {showEscalatedFrom && <th className="p-3">ESCALATED FROM</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="p-3 text-gray-400">{c.callerNo}</td>
                  <td className="p-3">{c.issue}</td>
                  <td className="p-3 text-gray-400">{c.department}</td>
                  <td className="p-3">{c.location}</td>
                  <td className="p-3 text-gray-400 whitespace-nowrap">
                    {new Date(c.resolvedAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="text-white text-xs font-medium">
                      {c.resolvedByOfficerName}
                    </span>
                    <span className="text-gray-500 text-[10px] block">
                      {c.resolvedByOfficerId}
                    </span>
                  </td>
                  {showEscalatedFrom && (
                    <td className="p-3">
                      <span className="text-orange-400 text-xs font-medium">
                        {c.escalatedFromOfficerName}
                      </span>
                      <span className="text-gray-500 text-[10px] block">
                        {c.escalatedFromOfficerId}
                      </span>
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
          Structured civic incident and officer roster data.
        </p>
      </div>

      {/* Date Range Controls */}
      <div className="bg-[#1E293B] border border-white/5 p-4 rounded-2xl flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-400 font-medium">Date Range:</span>
        {["week", "month", "custom"].map((preset) => (
          <button
            key={preset}
            onClick={() => applyPreset(preset)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activePreset === preset
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            {preset === "week"
              ? "This Week"
              : preset === "month"
                ? "This Month"
                : "Custom Range"}
          </button>
        ))}
        {activePreset === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
              className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
              className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={applyCustomRange}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-green-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">
            {resolvedOnTime.length}
          </h3>
          <p className="text-gray-400 text-sm">Resolved On Time</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-orange-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">
            {resolvedAfterEscalation.length}
          </h3>
          <p className="text-gray-400 text-sm">Resolved After Escalation</p>
        </div>
        <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <Users className="w-8 h-8 text-cyan-400 mb-2" />
          <h3 className="text-2xl font-bold text-white">
            {officerRoster.length}
          </h3>
          <p className="text-gray-400 text-sm">Officers in Roster</p>
        </div>
      </div>

      {/* Complaints Section */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-3">📋 Complaints</h2>
        <div className="space-y-4">
          <ComplaintTableSection
            title="Resolved On Time"
            data={resolvedOnTime}
            color="bg-green-500/20 text-green-400"
            icon="✅"
            filename="resolved_on_time"
            columns={onTimeColumns}
            showEscalatedFrom={false}
          />
          <ComplaintTableSection
            title="Resolved After Escalation"
            data={resolvedAfterEscalation}
            color="bg-orange-500/20 text-orange-400"
            icon="🔄"
            filename="resolved_after_escalation"
            columns={escalatedColumns}
            showEscalatedFrom={true}
          />
        </div>
      </div>

      {/* Officers Section */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-3">👮 Officers</h2>
        <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Officer Roster</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-cyan-500/20 text-cyan-400">
                {officerRoster.length}
              </span>
            </div>
            <button
              onClick={() =>
                downloadCSV(officerRoster, "officer_roster", officerColumns)
              }
              disabled={officerRoster.length === 0}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-xl transition shadow-lg shadow-purple-500/20 text-sm"
            >
              <ArrowDownToLine className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {loading ? (
            <p className="text-gray-400 animate-pulse text-sm">
              Querying database...
            </p>
          ) : officerRoster.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No officers found in this date range.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#0F172A] border-b border-white/10">
                  <tr>
                    <th className="p-3">NAME</th>
                    <th className="p-3">OFFICER ID</th>
                    <th className="p-3">PHONE</th>
                    <th className="p-3">INVITE SENT AT</th>
                    <th className="p-3">SETUP COMPLETED AT</th>
                    <th className="p-3">DATE JOINED</th>
                  </tr>
                </thead>
                <tbody>
                  {officerRoster.map((o) => (
                    <tr
                      key={o.officerId}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="p-3 font-medium text-white">{o.name}</td>
                      <td className="p-3 text-gray-400 font-mono text-xs">
                        {o.officerId}
                      </td>
                      <td className="p-3 text-gray-400">{o.phone || "—"}</td>
                      <td className="p-3 text-gray-400 whitespace-nowrap">
                        {o.inviteSentAt
                          ? new Date(o.inviteSentAt).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="p-3 text-gray-400 whitespace-nowrap">
                        {o.setupCompletedAt
                          ? new Date(o.setupCompletedAt).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="p-3 text-gray-400 whitespace-nowrap">
                        {o.dateJoined
                          ? new Date(o.dateJoined).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
