export default function LocationInsights({ complaints }) {

  const areas = [
    { name: "Sector 12", value: 88 },
    { name: "Koregaon", value: 65 },
    { name: "Baner", value: 21 },
  ];
   const highUrgency = complaints.filter(
  c => c.urgency === "High"
  ).length;

  const stressScore = complaints.length
  ? Math.round((highUrgency / complaints.length) * 100)
  : 0;
  return (
    <div className="bg-slate-900 text-white rounded-xl p-6 border border-white/10 shadow-lg">

      <h2 className="mb-6 font-semibold text-lg">📍 Location Insights</h2>

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

      <div className="mt-8">

        <h3 className="text-sm text-gray-400 mb-3">
          Civic Stress Score
        </h3>

        <div className="w-full bg-gray-700 rounded-full h-3">
          <div className="bg-red-500 h-3 rounded-full w-[80%] animate-pulse"></div>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          High civic stress detected
        </p>

      </div>

    </div>
  );
}