export default function ZoneList({ zones, selectedZone, onSelectZone, filter, setFilter }) {
    const filteredZones = filter === 'All'
        ? zones
        : zones.filter(z => z.urgency.toLowerCase() === filter.toLowerCase());

    // Sort by urgency: High -> Medium -> Low
    const urgencyWeight = { High: 3, Medium: 2, Low: 1 };
    const sortedZones = [...filteredZones].sort((a, b) => {
        if (urgencyWeight[b.urgency] !== urgencyWeight[a.urgency]) {
            return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
        }
        return b.cases - a.cases;
    });

    return (
        <div className="w-80 bg-[#111827] border-r border-slate-700 flex flex-col h-full">
            <div className="p-4 border-b border-slate-700">
                <h2 className="text-xl font-bold mb-3">Affected Zones</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                    {['All', 'High', 'Medium', 'Low'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === f ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 #111827' }}>
                {sortedZones.map(zone => (
                    <div
                        key={zone.name}
                        onClick={() => onSelectZone(zone)}
                        className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedZone?.name === zone.name
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : 'border-slate-700/50 bg-[#1e293b] hover:border-slate-500'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-sm truncate pr-2">{zone.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${zone.urgency === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    zone.urgency === 'Medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                        'bg-green-500/20 text-green-400 border border-green-500/30'
                                }`}>
                                {zone.urgency}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span>{zone.cases} Active Cases</span>
                            <span>{zone.officers} Officers</span>
                        </div>
                        {/* Volume indicator bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                            {zone.highCount > 0 && <div className="bg-red-500 h-full" style={{ width: `${(zone.highCount / zone.cases) * 100}%` }}></div>}
                            {zone.mediumCount > 0 && <div className="bg-orange-500 h-full" style={{ width: `${(zone.mediumCount / zone.cases) * 100}%` }}></div>}
                            {zone.lowCount > 0 && <div className="bg-green-500 h-full" style={{ width: `${(zone.lowCount / zone.cases) * 100}%` }}></div>}
                        </div>
                    </div>
                ))}
                {sortedZones.length === 0 && (
                    <div className="p-4 text-center text-slate-500 text-sm">
                        No zones match the current filter.
                    </div>
                )}
            </div>
        </div>
    );
}
