export default function Legend() {
    return (
        <div className="absolute bottom-6 left-6 z-[400] bg-[#1e293b]/95 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-2xl">
            <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Legend</h4>
            <div className="space-y-3 text-sm text-slate-200">
                <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    </span>
                    <span className="font-medium">High Urgency</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-orange-400"></span>
                    <span className="font-medium">Medium Urgency</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-green-500 border border-green-400"></span>
                    <span className="font-medium">Low Urgency</span>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-700/80">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    <span className="font-medium">Officer Unit</span>
                </div>
            </div>
        </div>
    );
}
