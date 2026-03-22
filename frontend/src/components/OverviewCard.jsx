function OverviewCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
      
      <span className="text-gray-500 text-sm">
        {title}
      </span>

      <span className={`text-3xl font-bold mt-2 ${color}`}>
        {value}
      </span>

    </div>
  );
}

export default OverviewCard;