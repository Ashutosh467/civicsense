import { MapPin } from "lucide-react";

export default function LocationMap({ complaints = [] }) {
  const uniqueLocations = new Set();
  complaints.forEach((c) => {
    if (c.status?.toLowerCase() !== 'resolved') {
      const loc = c.location || "Unknown";
      uniqueLocations.add(loc);
    }
  });

  const count = uniqueLocations.size;

  return (
    <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 relative flex flex-col items-center justify-center text-center h-[180px]">
      <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-3">
        <MapPin className="w-6 h-6 text-cyan-400" />
      </div>
      <h2 className="text-gray-400 font-medium mb-1 text-sm tracking-wide uppercase">Affected Regions</h2>
      <div className="text-4xl font-extrabold text-white">{count}</div>
      <p className="text-xs text-gray-500 mt-2">Active geographic zones requiring attention</p>
    </div>
  );
}