import { useEffect, useState, useMemo } from "react";
import { API } from "../services/api";
import { socket } from "../services/socket";
import StatsBar from "../components/LocationMap/StatsBar";
import ZoneList from "../components/LocationMap/ZoneList";
import RightPanel from "../components/LocationMap/RightPanel";
import LiveMap from "../components/LocationMap/LiveMap";
import Legend from "../components/LocationMap/Legend";
import { processComplaintsIntoZones } from "../components/LocationMap/utils";

export default function LocationMap() {
    const [complaints, setComplaints] = useState([]);
    const [selectedZone, setSelectedZone] = useState(null);
    const [viewMode, setViewMode] = useState("Incidents"); // Incidents, Heatmap, Officers
    const [zoneFilter, setZoneFilter] = useState("All");

    useEffect(() => {
        // Replicating Dashboard's data source exactly
        const fetchData = () => {
            fetch(`${API}/api/complaint`, { cache: "no-store" })
                .then((res) => res.json())
                .then((data) => {
                    if (data && Array.isArray(data)) {
                        setComplaints(data);
                    }
                })
                .catch((err) => console.error("Backend not reachable", err));
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);

        socket.connect();
        socket.on("newComplaint", (data) => {
            setComplaints((prev) => [data, ...prev]);
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, []);

    // Compute aggregated zones dynamically
    const zones = useMemo(() => processComplaintsIntoZones(complaints), [complaints]);

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-[#0b1120] text-white">
            {/* Stats bar - Top */}
            <StatsBar zones={zones} />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Panel: Zone List */}
                <ZoneList
                    zones={zones}
                    selectedZone={selectedZone}
                    onSelectZone={setSelectedZone}
                    filter={zoneFilter}
                    setFilter={setZoneFilter}
                />

                {/* Center: Live Map Area */}
                <div className="flex-1 relative bg-[#0b1120]">
                    {/* View Mode Toggle */}
                    <div className="absolute top-4 right-4 z-[400] bg-[#1e293b] rounded-lg p-1 flex shadow-lg border border-slate-700">
                        {['Incidents', 'Heatmap', 'Officers'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === mode ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <LiveMap
                        zones={zones}
                        selectedZone={selectedZone}
                        onZoneSelect={setSelectedZone}
                        viewMode={viewMode}
                    />

                    <Legend />
                </div>

                {/* Right Panel: Detail slide-in */}
                <div
                    className={`absolute right-0 top-0 bottom-0 z-[500] transform transition-transform duration-300 ${selectedZone ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    <RightPanel zone={selectedZone} onClose={() => setSelectedZone(null)} />
                </div>
            </div>
        </div>
    );
}
