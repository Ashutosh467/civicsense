import React, { useEffect, useState } from "react";
import 'leaflet/dist/leaflet.css';
import { API } from "../services/api";
import { socket } from "../services/socket";
import StatChips from "../components/LocationMap/StatChips";
import FilterBar from "../components/LocationMap/FilterBar";
import LiveMap from "../components/LocationMap/LiveMap";

const geocodeCache = {};

export default function LocationMap() {
    const [complaints, setComplaints] = useState([]);
    const [zones, setZones] = useState([]);
    const [filter, setFilter] = useState("All");
    const [isLoading, setIsLoading] = useState(false);
    const [hasZeroMarkers, setHasZeroMarkers] = useState(false);

    useEffect(() => {
        const fetchData = () => {
            fetch(`${API}/api/complaint`, { cache: "no-store" })
                .then((res) => res.json())
                .then((data) => {
                    if (data && Array.isArray(data)) setComplaints(data);
                })
                .catch((err) => console.error(err));
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

    useEffect(() => {
        let isCancelled = false;

        const processGeocoding = async () => {
            const grouped = {};

            complaints.forEach((c) => {
                if (c.status === "Resolved" || !c.location) return;

                if (!grouped[c.location]) {
                    grouped[c.location] = {
                        location: c.location,
                        count: 0,
                        urgency: "LOW",
                        issues: [],
                        lat: null,
                        lng: null,
                    };
                }

                grouped[c.location].count += 1;
                if (c.issue) grouped[c.location].issues.push(c.issue);

                const levels = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                const currentUrgency = c.urgency?.toUpperCase() || "LOW";
                if (levels[currentUrgency] > levels[grouped[c.location].urgency]) {
                    grouped[c.location].urgency = currentUrgency;
                }
            });

            const zonesArray = Object.values(grouped);
            const readyZones = [];

            setIsLoading(true);
            setHasZeroMarkers(false);

            for (let i = 0; i < zonesArray.length; i++) {
                if (isCancelled) break;
                const zone = zonesArray[i];

                if (geocodeCache[zone.location]) {
                    if (geocodeCache[zone.location].lat !== null) {
                        zone.lat = geocodeCache[zone.location].lat;
                        zone.lng = geocodeCache[zone.location].lng;
                        readyZones.push(zone);
                    }
                } else {
                    try {
                        await new Promise((r) => setTimeout(r, 300));
                        const res = await fetch(`http://localhost:10000/api/geocode?location=${encodeURIComponent(zone.location)}`);
                        const data = await res.json();

                        if (data && data.lat !== null && data.lon !== null) {
                            const lat = data.lat;
                            const lng = data.lon;
                            geocodeCache[zone.location] = { lat, lng };
                            zone.lat = lat;
                            zone.lng = lng;
                            readyZones.push(zone);

                            setZones((prev) => {
                                if (prev.find(p => p.location === zone.location)) return prev;
                                return [...prev, zone];
                            });
                        } else {
                            geocodeCache[zone.location] = { lat: null, lng: null };
                        }
                    } catch (error) {
                        console.error("Geocoding failed for", zone.location);
                    }
                }
            }

            if (!isCancelled) {
                setIsLoading(false);
                setZones([...readyZones]);
                if (readyZones.length === 0 && zonesArray.length > 0) {
                    setHasZeroMarkers(true);
                }
            }
        };

        if (complaints.length > 0) {
            processGeocoding();
        } else {
            setIsLoading(false);
        }

        return () => { isCancelled = true; };
    }, [complaints]);

    const totalLocations = zones.length;
    const highZones = zones.filter((z) => z.urgency === "HIGH").length;
    const mediumZones = zones.filter((z) => z.urgency === "MEDIUM").length;

    const visibleZones = filter === "All"
        ? zones
        : zones.filter((z) => z.urgency.toUpperCase() === filter.toUpperCase());

    return (
        <div className="flex flex-col bg-[#0b1120] text-white p-6 space-y-4 h-full min-h-screen">
            <div className="flex justify-between items-center w-full">
                <h1 className="text-3xl font-bold">Location Map</h1>
                <StatChips total={totalLocations} high={highZones} medium={mediumZones} />
            </div>

            <FilterBar filter={filter} setFilter={setFilter} />

            <div className="w-full relative rounded-xl overflow-hidden border border-slate-700 shadow-2xl" style={{ height: "calc(100vh - 120px)" }}>
                {isLoading && complaints.length > 0 && (
                    <div className="absolute inset-0 z-[1000] bg-[#0b1120]/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-cyan-400 font-bold animate-pulse text-xl">Geocoding locations...</div>
                    </div>
                )}
                {!isLoading && hasZeroMarkers && (
                    <div className="absolute inset-0 z-[1000] bg-[#0b1120]/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                        <div className="text-red-400 font-bold text-xl px-6 py-4 bg-[#111827] border border-red-500 rounded-lg pointer-events-auto">
                            Could not locate complaints on map. Please check your connection.
                        </div>
                    </div>
                )}
                <LiveMap zones={visibleZones} />
            </div>
        </div>
    );
}
