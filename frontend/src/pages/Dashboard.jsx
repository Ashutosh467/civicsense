import { API } from "../services/api";
import StatCard from "../components/dashboard/StatCard";
import LocationInsights from "../components/dashboard/LocationInsights";
import AIConversation from "../components/dashboard/AIConversation";
import LocationMap from "../components/dashboard/LocationMap";
import { useEffect, useState } from "react";
import { socket } from "../services/socket";

import ComplaintTable from "../components/ComplaintTable";
import dummyComplaints from "../data/dummyComplaints";

import OverviewCard from "../components/OverviewCard";


function Dashboard() {
 const [complaints, setComplaints] = useState(dummyComplaints);  
 useEffect(() => {
  socket.connect();

  socket.on("newComplaint", (data) => {
    setComplaints((prev) => [data, ...prev]);
  });

  return () => {
    socket.disconnect();
  };
}, []);
  const simulateComplaint = () => {
  const newComplaint = {
    id: Date.now(),
    callerNo: "9111122222",
    issueType: "Road Damage",
    location: "Sector 18",
    urgency: "High",
    emotion: "Angry",
    summary: "Large pothole causing traffic",
    status: "Pending",
    time: "Now",
  };

  setComplaints((prev) => [newComplaint, ...prev]);
 };
 const [filter, setFilter] = useState("All");
  const totalComplaints = complaints.length;

const pendingCount = complaints.filter(
  (c) => c.status === "Pending"
).length;

const resolvedCount = complaints.filter(
  (c) => c.status === "Resolved"
).length;

const highUrgencyCount = complaints.filter(
  (c) => c.urgency === "High"
).length;

const totalCalls = totalComplaints + 12; 
 const angryComplaints = complaints.filter(c => c.emotion === "Angry");

const angryCount = angryComplaints.length;

const alertLocation =
  angryCount >= 3 ? angryComplaints[0].location : null;
  const locationCounts = {};

complaints.forEach(c => {
  locationCounts[c.location] =
    (locationCounts[c.location] || 0) + 1;
});

const patternLocation = Object.keys(locationCounts).find(
  loc => locationCounts[loc] >= 5
);
 
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

    <h1 className="text-3xl font-bold">
      Officer Dashboard
    </h1>

      {/* Overview Cards */}
  
<button
  onClick={simulateComplaint}
  className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
  Simulate Incoming Complaint
</button>

<div className="grid grid-cols-12 gap-6">

  {/* LEFT SIDE */}
  <div className="col-span-8 space-y-6">

    {/* System Overview */}
   <div className="grid grid-cols-4 gap-6">
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
      {/* Auto Sort Label */}
      <p className="text-xs text-gray-400 mb-2">
      Auto-sorted by urgency
      </p>
      <ComplaintTable
        complaints={
        filter === "All"
        ? complaints
        : complaints.filter((c) => c.urgency === filter)
     }
  />

    </div>

     {/* RIGHT SIDE */}
   <div className="col-span-4 space-y-6">
   <LocationMap />
   <LocationInsights complaints={complaints} />
   <AIConversation />
   </div>

    </div>
    </div>
  );
}

export default Dashboard;