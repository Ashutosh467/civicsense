export default function LocationInsights({ complaints, officers = [] }) {
  // Build performance stats per officer from complaints data
  const officerStats = officers.map((officer) => {
    const assigned = complaints.filter(
      (c) => c.assignedTo === officer.officerId,
    );
    const resolved = assigned.filter((c) => c.status === "resolved");

    // Average resolution time in hours
    const resolutionTimes = resolved
      .filter((c) => c.resolvedAt && c.assignedAt)
      .map((c) => {
        const diff = new Date(c.resolvedAt) - new Date(c.assignedAt);
        return diff / (1000 * 60 * 60); // convert ms to hours
      });

    const avgTime = resolutionTimes.length
      ? Math.round(
          resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length,
        )
      : null;

    const resolveRate = assigned.length
      ? Math.round((resolved.length / assigned.length) * 100)
      : 0;

    return {
      name: officer.name,
      department: officer.department,
      area: officer.area,
      isAvailable: officer.isAvailable,
      assigned: assigned.length,
      resolved: resolved.length,
      active: officer.activeComplaintsCount || 0,
      resolveRate,
      avgTime,
    };
  });

  // Sort by resolved count descending
  const sorted = [...officerStats].sort((a, b) => b.resolved - a.resolved);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-slate-900 text-white rounded-xl p-6 border border-white/10 shadow-lg h-[340px] flex flex-col">
      <h2 className="mb-4 font-semibold text-lg flex items-center gap-2">
        🏆 Officer Performance
      </h2>

      {sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          No officer data available
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {sorted.map((o, i) => (
            <div
              key={i}
              className="bg-slate-800 rounded-lg p-3 border border-white/5"
            >
              {/* Officer name + status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{medals[i] || "👤"}</span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">
                      {o.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {o.department} · {o.area}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    o.isAvailable
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {o.isAvailable ? "Available" : "Busy"}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                <span>✅ {o.resolved} resolved</span>
                <span>📋 {o.assigned} assigned</span>
                <span>⚡ {o.active} active</span>
                {o.avgTime !== null && <span>⏱ ~{o.avgTime}h avg</span>}
              </div>

              {/* Resolution rate bar */}
              <div className="w-full bg-slate-700 h-1.5 rounded-full">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    o.resolveRate >= 70
                      ? "bg-green-500"
                      : o.resolveRate >= 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${o.resolveRate}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {o.resolveRate}% resolution rate
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
