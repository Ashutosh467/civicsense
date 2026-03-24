export default function LocationInsights({ complaints }) {

  const locationCounts = {};
  complaints.forEach((c) => {
    const locationKey = c.translatedLocation || c.location;
    if (locationKey) {
      locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
    }
  });

  const areas = Object.entries(locationCounts)
    .map(([name, count]) => ({
      name,
      value: Math.round((count / (complaints.length || 1)) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3); // top 3 locations

  const highUrgency = complaints.filter((c) => c.urgency === "High").length;
  const stressScore = complaints.length
    ? Math.round((highUrgency / complaints.length) * 100)
    : 0;

  return (
    <div className="bg-slate-900 text-white rounded-xl p-6 border border-white/10 shadow-lg h-[340px] flex flex-col justify-between">

      <div>
        <h2 className="mb-4 font-semibold text-lg flex items-center gap-2">📍 Location Insights</h2>

        {/* AREA PROGRESS BARS */}
        {areas.map((a, i) => (
          <div key={i} className="mb-5">

            <div className="flex justify-between text-sm mb-2">
              <span>{a.name}</span>
              <span>{a.value}%</span>
            </div>

            <div className="w-full bg-slate-700 h-2 rounded">
              <div
                className="h-2 rounded bg-gradient-to-r from-red-500 to-yellow-400"
                style={{ width: `${stressScore}%` }}
              />
            </div>

          </div>
        ))}

        {/* ============================= */}
        {/* Civic Stress Score Section */}
        {/* ============================= */}

        <div className="mt-4 pt-4 border-t border-white/10">
          <h3 className="text-sm text-gray-400 mb-3">Civic Stress Score</h3>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${stressScore > 50 ? "bg-red-500 animate-pulse" : "bg-yellow-500"
                }`}
              style={{ width: `${stressScore}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {stressScore > 50
              ? "High civic stress detected"
              : "Normal civic stress levels"}
          </p>
        </div>

      </div>
    </div>
  );
}