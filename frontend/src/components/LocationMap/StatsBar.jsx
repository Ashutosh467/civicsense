export default function StatsBar({ zones }) {
    const totalZones = zones.length;
    const highUrgency = zones.filter(z => z.urgency === 'High').length;
    const officersDeployed = zones.reduce((acc, z) => acc + z.officers, 0);
    const avgResponse = totalZones > 0
        ? Math.round(zones.reduce((acc, z) => acc + z.avgResponse, 0) / totalZones)
        : 0;

    return (
        <div className="bg-[#111827] border-b border-slate-800 p-4 shrink-0 z-10 relative">
            <div className="grid grid-cols-4 gap-4 max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2.5 rounded-lg text-blue-400 border border-blue-500/20 flex-shrink-0">
                        📍
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Affected Zones</p>
                        <p className="text-lg font-bold text-white">{totalZones}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-red-500/20 p-2.5 rounded-lg text-red-400 border border-red-500/20 flex-shrink-0">
                        🚨
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">High Urgency</p>
                        <p className="text-lg font-bold text-red-400">{highUrgency}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-cyan-500/20 p-2.5 rounded-lg text-cyan-400 border border-cyan-500/20 flex-shrink-0">
                        👮
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Officers Deployed</p>
                        <p className="text-lg font-bold text-cyan-400">{officersDeployed}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2.5 rounded-lg text-green-400 border border-green-500/20 flex-shrink-0">
                        ⚡
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg Response Time</p>
                        <p className="text-lg font-bold text-green-400">{avgResponse} min</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
