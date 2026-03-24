import React from 'react';

export default function StatChips({ total, high, medium }) {
    return (
        <div className="flex gap-4">
            <div className="bg-[#1e293b] px-4 py-2 rounded-lg border border-slate-700 flex flex-col items-center">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Affected Locations</span>
                <span className="text-xl font-bold text-white">{total}</span>
            </div>
            <div className="bg-[#1e293b] px-4 py-2 rounded-lg border border-slate-700 flex flex-col items-center">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">High Urgency Zones</span>
                <span className="text-xl font-bold text-[#E24B4A]">{high}</span>
            </div>
            <div className="bg-[#1e293b] px-4 py-2 rounded-lg border border-slate-700 flex flex-col items-center">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Medium Urgency Zones</span>
                <span className="text-xl font-bold text-[#EF9F27]">{medium}</span>
            </div>
        </div>
    );
}
