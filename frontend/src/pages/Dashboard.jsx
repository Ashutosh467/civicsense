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
  const [pendingOfficers, setPendingOfficers] = useState([]);
  const [isOfficersExpanded, setIsOfficersExpanded] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: "", area: "", department: "PWD", phone: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [filter, setFilter] = useState("All");
  const [deleteModal, setDeleteModal] = useState({ open: false, type: "", id: "", name: "" });

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
    const fetchData = () => {
      fetch(`${API}/api/complaint`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => { if (data && Array.isArray(data)) setComplaints(data); })
        .catch((err) => console.error("Backend not reachable", err));
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    socket.connect();
    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    socket.on("newComplaint", (data) => setComplaints((prev) => [data, ...prev]));
    socket.on("complaintAssigned", (data) => {
      setComplaints((prev) => prev.map((c) => {
        const cid = c.id || c._id;
        if (cid === data.complaintId) return { ...c, status: "assigned", assignedTo: data.officerId };
        return c;
      }));
      fetchOfficers();
    });
    socket.on("complaintResolved", (data) => {
      setComplaints((prev) => prev.map((c) => {
        const cid = c.id || c._id;
        const updatedId = data.id || data._id;
        return cid === updatedId ? { ...c, ...data } : c;
      }));
      fetchOfficers();
    });
    return () => { clearInterval(interval); socket.disconnect(); };
  }, []);

  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter((c) => c.status?.toLowerCase() === "pending").length;
  const resolvedCount = complaints.filter((c) => c.status?.toLowerCase() === "resolved").length;
  const highUrgencyCount = complaints.filter((c) => c.urgency?.toLowerCase() === "high").length;
  const angryComplaints = complaints.filter((c) => c.emotion?.toLowerCase() === "angry");
  const angryCount = angryComplaints.length;
  const alertLocation = angryCount >= 3 ? angryComplaints[0].location : null;
  const locationCounts = {};
  complaints.forEach((c) => {
    const locKey = c.translatedLocation || c.location || "Unknown";
    locationCounts[locKey] = (locationCounts[locKey] || 0) + 1;
  });
  const patternLocation = Object.keys(locationCounts).find((loc) => locationCounts[loc] >= 5);
  const uniqueLocations = new Set();
  complaints.forEach((c) => {
    if (c.status?.toLowerCase() !== "resolved") {
      uniqueLocations.add(c.translatedLocation || c.location || "Unknown");
    }
  });
  const affectedRegionsCount = uniqueLocations.size;

  const activeComplaints = complaints.filter((c) => c.status?.toLowerCase() !== "resolved");
  const resolvedComplaints = complaints.filter((c) => c.status?.toLowerCase() === "resolved");
  const escalatedComplaints = complaints.filter(c => c.status === "escalated");

  const confirmDelete = (type, id, name) => {
    setDeleteModal({ open: true, type, id, name });
  };

  const handleDelete = async () => {
    const { type, id } = deleteModal;
    try {
      const url = type === "complaint"
        ? `${API}/api/complaint/${id}/archive`
        : `${API}/api/officer/${id}/archive`;
      const res = await fetch(url, { method: "PATCH" });
      if (res.ok) {
        toast.success(`${type === "complaint" ? "Complaint" : "Officer"} archived successfully`);
        if (type === "complaint") setComplaints(prev => prev.filter(c => (c.id || c._id) !== id));
        else fetchOfficers();
      } else {
        toast.error("Archive failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setDeleteModal({ open: false, type: "", id: "", name: "" });
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "active", label: `Active (${activeComplaints.length})`, icon: "⚡" },
    { id: "resolved", label: `Resolved (${resolvedComplaints.length})`, icon: "✅" },
    { id: "officers", label: `Officers (${officers.length})`, icon: "👮" },
  ];

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">Confirm Archive</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to archive <span className="text-white font-medium">"{deleteModal.name}"</span>? It will be hidden from the dashboard but kept in the database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, type: "", id: "", name: "" })}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white py-2.5 rounded-xl text-sm font-bold transition"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {alertLocation && (
        <div className="bg-red-600 text-white p-3 rounded-lg animate-pulse">
          🚨 Alert: {angryCount} angry callers detected from {alertLocation}
        </div>
      )}
      {patternLocation && (
        <div className="bg-yellow-500 text-black p-3 rounded-lg">
          ⚠ Pattern detected: Multiple complaints from {patternLocation}
        </div>
      )}

      {/* Pending Officer Approvals */}
      {pendingOfficers.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
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
                        {existingAreas.map((area, i) => <option key={i} value={area} />)}
                      </datalist>
                      {existingAreas.length > 0 && (
                        <p className="text-gray-500 text-[10px] mt-1 pl-1">{existingAreas.length} existing area{existingAreas.length > 1 ? "s" : ""} available</p>
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

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-900/50 border border-white/10 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-4">
            <StatCard title="Total Calls" value={totalComplaints} icon="📞" color="text-cyan-400" />
            <StatCard title="Total Complaints" value={totalComplaints} icon="📋" color="text-purple-400" />
            <StatCard title="Pending Cases" value={pendingCount} icon="⏳" color="text-orange-400" />
            <StatCard title="Resolved Cases" value={resolvedCount} icon="✅" color="text-green-400" />
            <StatCard title="Affected Regions" value={affectedRegionsCount} icon="📍" color="text-red-400" />
          </div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <AIConversation complaint={complaints[0]} />
            </div>
            <div className="col-span-4">
              <LocationInsights complaints={complaints} officers={officers} />
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE COMPLAINTS TAB */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {escalatedComplaints.length > 0 && (
            <div className="mt-6 mb-6">
              <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                🚨 Escalated Complaints — No Action Taken
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {escalatedComplaints.length}
                </span>
              </h2>
              <div className="space-y-3">
                {escalatedComplaints.map(c => (
                  <div key={c._id} className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{c.translatedIssue || c.issueType}</p>
                      <p className="text-red-300 text-sm">{c.translatedLocation || c.location}</p>
                      <p className="text-red-400 text-xs mt-1">
                        Officer ID: <span className="font-mono">{c.assignedTo}</span> &nbsp;·&nbsp;
                        Department: {c.department} &nbsp;·&nbsp;
                        Escalated: {c.escalatedAt ? new Date(c.escalatedAt).toLocaleString() : "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAutoAssign(c._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
                    >
                      🔄 Re-Assign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Active Complaints</h2>
            <div className="flex gap-2">
              {["All", "High", "Medium", "Low"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    filter === type ? "bg-cyan-500 text-white" : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400">Auto-sorted by urgency</p>
          <ComplaintTable
            complaints={
              filter === "All"
                ? activeComplaints
                : activeComplaints.filter((c) => c.urgency?.toLowerCase() === filter.toLowerCase())
            }
            officers={officers}
          />
        </div>
      )}

      {/* RESOLVED COMPLAINTS TAB */}
      {activeTab === "resolved" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">Resolved Complaints</h2>
            <p className="text-xs text-gray-400">Archive to remove from dashboard permanently</p>
          </div>
          <div className="bg-[#111827] rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#1F2937] text-gray-400 uppercase text-xs sticky top-0">
                <tr>
                  <th className="p-4">Issue</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Urgency</th>
                  <th className="p-4">Resolved At</th>
                  <th className="p-4">Officer</th>
                  <th className="p-4">Photo Proof</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {resolvedComplaints.length === 0 && (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">No resolved complaints yet</td></tr>
                )}
                {resolvedComplaints.map((c) => {
                  const cid = c.id || c._id;
                  return (
                    <tr key={cid} className="border-t border-white/5 hover:bg-white/5 transition">
                      <td className="p-4 font-medium text-white">{c.translatedIssue || c.issueType}</td>
                      <td className="p-4 text-gray-400">{c.translatedLocation || c.location}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          c.urgency?.toLowerCase() === "high" ? "bg-red-500/20 text-red-400" :
                          c.urgency?.toLowerCase() === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-green-500/20 text-green-400"
                        }`}>{c.urgency}</span>
                      </td>
                      <td className="p-4 text-gray-400 text-xs">
                        {c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : "—"}
                      </td>
                      <td className="p-4 text-gray-400 text-xs">
                        {(() => {
                          const officer = officers.find(o => o.officerId === c.assignedTo);
                          return officer ? (
                            <div>
                              <p className="text-white text-xs font-medium">{officer.name}</p>
                              <p className="text-gray-500 text-[10px]">{officer.department}</p>
                            </div>
                          ) : (c.assignedTo || "—");
                        })()}
                      </td>
                      <td className="p-4">
                        {c.resolutionPhoto ? (
                          <a
                            href={c.resolutionPhoto}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-lg hover:bg-cyan-500/30 transition font-medium"
                          >
                            📷 View Proof
                          </a>
                        ) : (
                          <span className="text-gray-600 text-xs">No photo</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => confirmDelete("complaint", cid, c.translatedIssue || c.issueType)}
                          className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/30 transition font-medium"
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OFFICERS TAB */}
      {activeTab === "officers" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-white font-semibold text-lg">Officer Management</h2>
            <button
              onClick={fetchOfficers}
              className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition text-white"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Add Officer Form */}
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
                  setNewOfficer({ name: "", area: "", department: "PWD", phone: "" });
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
              <input required value={newOfficer.name} onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="Officer Name" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Area</label>
              <input required value={newOfficer.area} onChange={(e) => setNewOfficer({ ...newOfficer, area: e.target.value })}
                className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="Jurisdiction Area" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Department</label>
              <select value={newOfficer.department} onChange={(e) => setNewOfficer({ ...newOfficer, department: e.target.value })}
                className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
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
              <input required value={newOfficer.phone} onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" placeholder="Phone Number" />
            </div>
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-lg transition">
              Create
            </button>
          </form>

          {/* Officers Table */}
          <div className="bg-[#111827] rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#1F2937] text-gray-400 uppercase text-xs">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Area</th>
                  <th className="p-3">Active</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Portal</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((o) => (
                  <tr key={o.officerId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 font-medium text-white">
                      {o.name}
                      {o.phone && <span className="text-xs text-gray-400 font-normal ml-2">({o.phone})</span>}
                    </td>
                    <td className="p-3">{o.department}</td>
                    <td className="p-3">{o.area}</td>
                    <td className="p-3">
                      <span className="bg-slate-700 text-white px-2 py-0.5 rounded text-xs">{o.activeComplaintsCount}</span>
                    </td>
                    <td className="p-3">
                      {o.isAvailable
                        ? <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded text-xs">Available</span>
                        : <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded text-xs">Offline</span>}
                    </td>
                    <td className="p-3">
                      <a href={`/officer/${o.officerId}`} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline text-xs">
                        Open ↗
                      </a>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => confirmDelete("officer", o.officerId, o.name)}
                        className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/30 transition font-medium"
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
                {officers.length === 0 && (
                  <tr><td colSpan="7" className="p-6 text-center text-gray-500">No officers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
