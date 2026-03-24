import { API } from "../services/api";
import StatCard from "../components/dashboard/StatCard";
import LocationInsights from "../components/dashboard/LocationInsights";
import AIConversation from "../components/dashboard/AIConversation";
import { useEffect, useState } from "react";
import { socket } from "../services/socket";

import ComplaintTable from "../components/ComplaintTable";

import OverviewCard from "../components/OverviewCard";

function Dashboard() {
  const [complaints, setComplaints] = useState([]);

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
                ${filter === type
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
                : complaints.filter((c) => c.urgency?.toLowerCase() === filter.toLowerCase())
            }
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="col-span-4 space-y-6">
          <LocationInsights complaints={complaints} />
          <AIConversation complaint={complaints[0]} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
