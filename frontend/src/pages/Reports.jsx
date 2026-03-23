import { useState, useEffect } from "react";
import { API } from "../services/api";
import { Download, FileText, ArrowDownToLine } from "lucide-react";

export default function Reports() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await fetch(`${API}/api/complaint`);
                const data = await res.json();
                setComplaints(data);
            } catch (err) {
                console.error("Reports API error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const downloadCSV = () => {
        if (complaints.length === 0) return;

        const headers = ["ID", "Location", "Category", "Urgency", "Status", "Reported At"];
        const rows = complaints.map(c => [
            c.id,
            c.location,
            c.issueType,
            c.urgency,
            c.status,
            new Date(c.time).toLocaleString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `civicsense_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center bg-[#1E293B] border border-white/5 p-6 rounded-2xl">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        Intelligence Reports
                    </h1>
                    <p className="text-gray-400 mt-1">Export your structured civic incident data for external review.</p>
                </div>

                <button
                    onClick={downloadCSV}
                    className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold py-2.5 px-5 rounded-xl transition shadow-lg shadow-purple-500/20"
                >
                    <ArrowDownToLine className="w-5 h-5" /> Export CSV
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <FileText className="w-10 h-10 text-cyan-400 mb-3" />
                    <h3 className="text-2xl font-bold text-white">{complaints.length}</h3>
                    <p className="text-gray-400 text-sm">Total Processed Incidents</p>
                </div>
                <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <FileText className="w-10 h-10 text-red-400 mb-3" />
                    <h3 className="text-2xl font-bold text-white">
                        {complaints.filter(c => c.urgency?.toLowerCase() === 'high').length}
                    </h3>
                    <p className="text-gray-400 text-sm">Escalated Priority 1</p>
                </div>
                <div className="bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <FileText className="w-10 h-10 text-green-400 mb-3" />
                    <h3 className="text-2xl font-bold text-white">
                        {complaints.filter(c => c.status?.toLowerCase() === 'resolved').length}
                    </h3>
                    <p className="text-gray-400 text-sm">Successfully Resolved</p>
                </div>
            </div>

            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Chronological Export Preview</h3>
                {loading ? (
                    <p className="text-gray-400 animate-pulse">Querying database...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-[#0F172A] border-b border-white/10">
                                <tr>
                                    <th className="p-3 rounded-tl-lg">DATE</th>
                                    <th className="p-3">LOCATION</th>
                                    <th className="p-3">ISSUE</th>
                                    <th className="p-3 rounded-tr-lg">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.slice(0, 10).map((c) => (
                                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="p-3">{new Date(c.time).toLocaleDateString()}</td>
                                        <td className="p-3">{c.location}</td>
                                        <td className="p-3">{c.issueType}</td>
                                        <td className="p-3">{c.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {complaints.length > 10 && (
                            <p className="text-center text-sm text-gray-500 mt-4">+ {complaints.length - 10} more rows unlisted. Export to view all.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
