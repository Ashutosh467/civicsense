import React from 'react';

export default function FilterBar({ filter, setFilter }) {
    const options = ["All", "High", "Medium", "Low"];

    return (
        <div className="flex gap-3 bg-[#111827] p-3 rounded-xl border border-slate-800 shadow-md">
            {options.map((opt) => (
                <button
                    key={opt}
                    onClick={() => setFilter(opt)}
                    className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${filter === opt
                            ? "bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)]"
                            : "bg-[#1e293b] text-slate-400 hover:text-white hover:bg-slate-700"
                        }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}
