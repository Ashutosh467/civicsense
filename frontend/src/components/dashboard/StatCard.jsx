import CountUp from "react-countup";

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-[#111827] p-6 rounded-xl border border-white/10 shadow-md hover:scale-105 transition">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-400 text-sm">{title}</h3>
        <span className="text-xl">{icon}</span>
      </div>

      <h2 className={`text-3xl font-bold ${color}`}>
        <CountUp end={value} duration={1.5} />
      </h2>
    </div>
  );
}

export default StatCard;