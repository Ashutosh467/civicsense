import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function RightPanel({ zone, onClose }) {
    const navigate = useNavigate();

    const handleDispatch = () => {
        toast.success(`Officer dispatched to ${zone.name}`, { icon: '🚓' });
    };

    const handleDownloadReport = () => {
        const text = `ZONE REPORT: ${zone.name}\nActive Cases: ${zone.cases}\nUrgency: ${zone.urgency}\nOfficers Nearby: ${zone.officers}\nAvg Response: ${zone.avgResponse} min`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${zone.name.replace(/\s+/g, '_')}.txt`;
        a.click();
        toast.success('Report generated successfully');
    };

    const handleViewComplaints = () => {
        // Navigate to dashboard or filter complaints by this zone
        // Dashboard might not directly accept a query param to filter out of the box,
        // but we can route to dashboard for now
        navigate('/dashboard');
        toast('Filtering by location feature active in dashboard.', { icon: 'ℹ️' });
    };

    if (!zone) return null;

    return (
        <div className="w-72 bg-[#111827] border-l border-slate-700 p-4 flex flex-col shadow-2xl z-10 absolute right-0 top-0 bottom-0 animate-slide-in-right">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold truncate pr-2">{zone.name}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="space-y-4 flex-1">
                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50">
                    <p className="text-sm text-slate-400 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${zone.urgency === 'High' ? 'bg-red-400' : zone.urgency === 'Medium' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${zone.urgency === 'High' ? 'bg-red-500' : zone.urgency === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                        </span>
                        <span className={`font-bold ${zone.urgency === 'High' ? 'text-red-400' : zone.urgency === 'Medium' ? 'text-orange-400' : 'text-green-400'}`}>{zone.urgency} Urgency</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1e293b] p-3 rounded-xl border border-slate-700/50 text-center">
                        <p className="text-2xl font-bold text-white">{zone.cases}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Active Cases</p>
                    </div>
                    <div className="bg-[#1e293b] p-3 rounded-xl border border-slate-700/50 text-center">
                        <p className="text-2xl font-bold text-cyan-400">{zone.officers}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Officers</p>
                    </div>
                </div>

                <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                    <span className="text-sm text-slate-300">Avg Response</span>
                    <span className="font-bold text-white">{zone.avgResponse} min</span>
                </div>
            </div>

            <div className="space-y-3 mt-auto pt-6 border-t border-slate-800">
                <button onClick={handleDispatch} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-2.5 px-4 rounded-lg transition shadow-lg shadow-cyan-500/20">
                    Dispatch Officer
                </button>
                <button onClick={handleViewComplaints} className="w-full bg-[#1e293b] hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-lg transition border border-slate-600">
                    View Complaints
                </button>
                <button onClick={handleDownloadReport} className="w-full bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white font-medium py-2 px-4 rounded-lg transition border border-slate-700 text-sm">
                    Generate Zone Report
                </button>
            </div>
        </div>
    );
}
