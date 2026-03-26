import { API } from "../services/api";
import StatCard from "../components/dashboard/StatCard";
import LocationInsights from "../components/dashboard/LocationInsights";
import AIConversation from "../components/dashboard/AIConversation";
import { useEffect, useState } from "react";
import { socket } from "../services/socket";
import toast from "react-hot-toast";

import ComplaintTable from "../components/ComplaintTable";

import OverviewCard from "../components/OverviewCard";

function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [isOfficersExpanded, setIsOfficersExpanded] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: "", area: "", department: "PWD", phone: "" });

  const [pendingOfficers, setPendingOfficers] = useState([]);

  const fetchOfficers = async () => {
    try {
      const res = await fetch(`${API}/api/officer`);
      const data = await res.json();
      setOfficers(Array.isArray(data) ? data.filter(o => o.approvalStatus === "approved" || !o.approvalStatus) : []);
    } catch (err) {
      console.error("Failed to fetch officers", err);
    }
  };

  const fetchPendingOfficers = async () => {
    try {
      const res = await fetch(`${API}/api/officer/auth/pending`);
      const data = await res.json();
      setPendingOfficers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch pending officers", err);
    }
  };

  const handleOfficerApproval = async (officerId, action, area, department) => {
    try {
      const res = await fetch(`${API}/api/officer/${officerId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, area, department }),
      });
      if (res.ok) {
        toast.success(`Officer ${action}d successfully`);
        fetchPendingOfficers();
        fetchOfficers();
      }
    } catch (err) {
      toast.error("Failed to update officer status");
    }
  };

  useEffect(() => {
    fetchOfficers();
    fetchPendingOfficers();
  }, []);

  useEffect(() => {
    // 🔥 FUNCTION TO FETCH DATA
    const fetchData = () => {
      fetch(`${API}/api/complaint`, {
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data)) {
            console.log("Fetched from backend:", data);
            setComplaints(data);
          }
        })
        .catch((err) => console.error("Backend not reachable", err));
    };

    // 🔹 FIRST LOAD
    fetchData();

    // 🔁 AUTO REFRESH EVERY 5 SEC
    const interval = setInterval(fetchData, 5000);

    // 🔥 SOCKET CONNECTION
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    // 🔥 REALTIME UPDATE
    socket.on("newComplaint", (data) => {
      setComplaints((prev) => [data, ...prev]);
    });

    socket.on("complaintAssigned", (data) => {
      setComplaints((prev) =>
        prev.map((c) => {
          const cid = c.id || c._id;
          if (cid === data.complaintId) {
            return { ...c, status: "assigned", assignedTo: data.officerId };
          }
          return c;
        })
      );
      fetchOfficers();
    });

    socket.on("complaintResolved", (data) => {
      setComplaints((prev) =>
        prev.map((c) => {
          const cid = c.id || c._id;
          const updatedId = data.id || data._id;
          return cid === updatedId ? { ...c, ...data } : c;
        })
      );
      fetchOfficers();
    });

    // 🔥 CLEANUP
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  // 🔹 EXISTING LOGIC (UNCHANGED)

  const [filter, setFilter] = useState("All");

  const totalComplaints = complaints.length;

  const pendingCount = complaints.filter(
    (c) => c.status?.toLowerCase() === "pending"
  ).length;

  const resolvedCount = complaints.filter(
    (c) => c.status?.toLowerCase() === "resolved"
  ).length;

  const highUrgencyCount = complaints.filter(
    (c) => c.urgency?.toLowerCase() === "high"
  ).length;

  const totalCalls = totalComplaints;

  const angryComplaints = complaints.filter((c) => c.emotion?.toLowerCase() === "angry");

  const angryCount = angryComplaints.length;

  const alertLocation = angryCount >= 3 ? angryComplaints[0].location : null;

  const locationCounts = {};

  complaints.forEach((c) => {
    const locKey = c.translatedLocation || c.location || "Unknown";
    locationCounts[locKey] = (locationCounts[locKey] || 0) + 1;
  });

  const patternLocation = Object.keys(locationCounts).find(
    (loc) => locationCounts[loc] >= 5,
  );

  const uniqueLocations = new Set();
  complaints.forEach((c) => {
    if (c.status?.toLowerCase() !== 'resolved') {
      const locKey = c.translatedLocation || c.location || "Unknown";
      uniqueLocations.add(locKey);
    }
  });
  const affectedRegionsCount = uniqueLocations.size;

  return (
    <div className="space-y-6">
      {/* Angry Caller Alert */}
      {alertLocation && (
        <div className="bg-red-600 text-white p-3 rounded-lg mb-4 animate-pulse">
          🚨 Alert: {angryCount} angry callers detected from {alertLocation}
        </div>
      )}

      {/* Pattern Detection Warning */}
      {patternLocation && (
        <div className="bg-yellow-500 text-black p-3 rounded-lg mb-4">
          ⚠ Pattern detected: Multiple complaints from {patternLocation}
        </div>
      )}

      <h1 className="text-3xl font-bold">Officer Dashboard</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT SIDE */}
        <div className="col-span-8 space-y-6">
          {/* System Overview */}
          <div className="grid grid-cols-5 gap-6">
            <StatCard
              title="Total Calls"
              value={totalCalls}
              icon="📞"
              color="text-cyan-400"
            />

            <StatCard
              title="Total Complaints"
              value={totalComplaints}
              icon="📋"
              color="text-purple-400"
            />

            <StatCard
              title="Pending Cases"
              value={pendingCount}
              icon="⏳"
              color="text-orange-400"
            />

            <StatCard
              title="Resolved Cases"
              value={resolvedCount}
              icon="✅"
              color="text-green-400"
            />

            <StatCard
              title="Affected Regions"
              value={affectedRegionsCount}
              icon="📍"
              color="text-red-400"
            />
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex gap-3 mb-4">
            {["All", "High", "Medium", "Low"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition
                ${
                  filter === type
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400 mb-2">Auto-sorted by urgency</p>

          <ComplaintTable
            complaints={
              filter === "All"
                ? complaints
                : complaints.filter(
                    (c) => c.urgency?.toLowerCase() === filter.toLowerCase(),
                  )
            }
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="col-span-4 space-y-6">
          {pendingOfficers.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                <h3 className="text-orange-400 font-semibold text-sm">
                  {pendingOfficers.length} Officer{pendingOfficers.length > 1 ? "s" : ""} Awaiting Approval
                </h3>
              </div>
              <div className="space-y-3">
                {pendingOfficers.map((o) => {
                  const existingAreas = [...new Set(officers.filter(of => of.area && of.area !== "Unassigned").map(of => of.area))];
                  return (
                    <div key={o.officerId} className="bg-slate-900/50 rounded-lg px-3 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{o.name}</p>
                          <p className="text-gray-400 text-xs">{o.email}</p>
                        </div>
                        <button
                          onClick={() => handleOfficerApproval(o.officerId, "reject")}
                          className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/30 transition font-medium"
                        >
                          Reject
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <input
                            type="text"
                            list={`areas-${o.officerId}`}
                            placeholder="Assign Area (e.g. Sector 12)"
                            defaultValue={o.area === "Unassigned" ? "" : o.area}
                            onChange={(e) => {
                              setPendingOfficers(prev =>
                                prev.map(p => p.officerId === o.officerId ? { ...p, _area: e.target.value } : p)
                              );
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500 placeholder:text-gray-600"
                          />
                          <datalist id={`areas-${o.officerId}`}>
                            {existingAreas.map((area, i) => (
                              <option key={i} value={area} />
                            ))}
                          </datalist>
                          {existingAreas.length > 0 && (
                            <p className="text-gray-500 text-[10px] mt-1 pl-1">
                              {existingAreas.length} existing area{existingAreas.length > 1 ? "s" : ""} available
                            </p>
                          )}
                        </div>
                        <select
                          defaultValue={o.department === "Unassigned" ? "" : o.department}
                          onChange={(e) => {
                            setPendingOfficers(prev =>
                              prev.map(p => p.officerId === o.officerId ? { ...p, _department: e.target.value } : p)
                            );
                          }}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500"
                        >
                          <option value="">Select Department</option>
                          <option value="PWD">PWD</option>
                          <option value="Municipal Corporation">Municipal Corporation</option>
                          <option value="Water Department">Water Department</option>
                          <option value="Electricity Board">Electricity Board</option>
                          <option value="Police">Police</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handleOfficerApproval(o.officerId, "approve", o._area, o._department)}
                        className="w-full text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition font-medium"
                      >
                        ✓ Approve & Assign
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <LocationInsights complaints={complaints} officers={officers} />
          <AIConversation complaint={complaints[0]} />
        </div>
      </div>

      {/* OFFICER MANAGEMENT SECTION */}
      <div className="bg-[#111827] rounded-xl shadow-md border border-white/10 overflow-hidden mt-8">
        <button
          onClick={() => setIsOfficersExpanded(!isOfficersExpanded)}
          className="w-full bg-[#1F2937] p-4 text-left font-bold flex justify-between items-center text-white"
        >
          <span>👮 Officer Management</span>
          <span>{isOfficersExpanded ? "▲ Collapse" : "▼ Expand"}</span>
        </button>

        {isOfficersExpanded && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">
                Add New Officer
              </h2>
              <button
                onClick={fetchOfficers}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition text-white"
              >
                ↻ Refresh List
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch(`${API}/api/officer`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newOfficer),
                  });
                  if (res.ok) {
                    setNewOfficer({
                      name: "",
                      area: "",
                      department: "PWD",
                      phone: "",
                    });
                    fetchOfficers();
                    toast.success("Officer created!");
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
              className="flex flex-wrap gap-4 items-end bg-[#1E293B] p-4 rounded-xl border border-white/5"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Name</label>
                <input
                  required
                  value={newOfficer.name}
                  onChange={(e) =>
                    setNewOfficer({ ...newOfficer, name: e.target.value })
                  }
                  className="bg-[#0F172A] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Officer Name"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Area</label>
                <input
                  required
                  value={newOfficer.area}
                  onChange={(e) =>
                    setNewOfficer({ ...newOfficer, area: e.target.value })
                  }
                  className="bg-[#0F172A] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Jurisdiction Area"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Department</label>
                <select
                  value={newOfficer.department}
                  onChange={(e) =>
                    setNewOfficer({ ...newOfficer, department: e.target.value })
                  }
                  className="bg-[#0F172A] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option>PWD</option>
                  <option>Fire Department</option>
                  <option>Police</option>
                  <option>Municipal Corporation</option>
                  <option>Water Board</option>
                  <option>Electricity Board</option>
                  <option>Health Department</option>
                  <option>Traffic Police</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Phone</label>
                <input
                  required
                  value={newOfficer.phone}
                  onChange={(e) =>
                    setNewOfficer({ ...newOfficer, phone: e.target.value })
                  }
                  className="bg-[#0F172A] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Phone Number"
                />
              </div>
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded transition"
              >
                Create
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#0F172A] border-b border-white/10">
                  <tr>
                    <th className="p-3">Officer ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Area</th>
                    <th className="p-3">Active Complaints</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Portal</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map((o) => (
                    <tr
                      key={o.officerId}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-3 font-mono text-xs text-gray-400">
                        {o.officerId}
                      </td>
                      <td className="p-3 font-medium text-white">{o.name}</td>
                      <td className="p-3">{o.department}</td>
                      <td className="p-3">{o.area}</td>
                      <td className="p-3">
                        <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-xs">
                          {o.activeComplaintsCount}
                        </span>
                      </td>
                      <td className="p-3">
                        {o.isAvailable ? (
                          <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded text-xs">
                            Available
                          </span>
                        ) : (
                          <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded text-xs">
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <a
                          href={`/officer/${o.officerId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 flex items-center gap-1 hover:underline"
                        >
                          Open ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                  {officers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-gray-500">
                        No officers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
