import React from 'react';

export default function Legend() {
    return (
        <div className="absolute bottom-6 left-6 z-[500] bg-[#111827]/90 backdrop-blur-sm border border-slate-700 p-4 rounded-xl shadow-xl pointer-events-none">
            <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Legend</h4>
            <div className="space-y-3 text-sm text-slate-200">
                <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-[#E24B4A] shadow-[0_0_10px_rgba(226,75,74,0.6)] animate-pulse"></span>
                    <span className="font-semibold text-sm">RED = High urgency</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-[#EF9F27] border border-[#ef9f27]/50"></span>
                    <span className="font-semibold text-sm">ORANGE = Medium urgency</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-[#639922] border border-[#639922]/50"></span>
                    <span className="font-semibold text-sm">GREEN = Low urgency</span>
                </div>
            </div>
        </div>
    );
}
