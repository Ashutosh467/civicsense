import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API } from "../services/api";
import { AlertTriangle, MapPin, Navigation, Car, AlertCircle } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons via Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom Icons
const userIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41]
});

const yellowIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41]
});

// Center on India 
const defaultCenter = [20.5937, 78.9629];

const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.5 });
    }, [center, zoom, map]);
    return null;
};

export default function MapPage() {
    const [complaints, setComplaints] = useState([]);
    const [geocodedComplaints, setGeocodedComplaints] = useState([]);
    const [userLoc, setUserLoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [route, setRoute] = useState(null);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [locError, setLocError] = useState(null);

    const routerState = useLocation().state;
    const targetLocation = routerState?.targetLocation;

    useEffect(() => {
        // 1. Get Live Data
        const fetchMapData = async () => {
            try {
                const res = await fetch(`${API}/api/complaint`);
                const data = await res.json();
                setComplaints(data);
            } catch (err) {
                console.error("Map data not reachable", err);
            }
        };
        fetchMapData();

        // 2. Get Geolocation
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
                (err) => setLocError("Allow location access to route to incidents (defaults to India).")
            );
        }
    }, []);

    useEffect(() => {
        // 3. Geocode Complaint Strings (Limited simple geocoding)
        const geocodeIncidents = async () => {
            if (!complaints.length) {
                setLoading(false);
                return;
            }

            const parsed = [];
            // To bypass severe rate limiting, we do them sequentially with a small delay
            for (let i = 0; i < complaints.length; i++) {
                const c = complaints[i];
                if (c.status?.toLowerCase() === 'resolved') continue;

                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(c.location + ", India")}&limit=1`);
                    const data = await res.json();
                    if (data && data.length > 0) {
                        parsed.push({
                            ...c,
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon)
                        });
                    }
                } catch (e) {
                    console.warn(`Geocode failed for ${c.location}`);
                }
                await new Promise(r => setTimeout(r, 600)); // Rate limit compliance
            }
            setGeocodedComplaints(parsed);
            setLoading(false);
        };

        if (complaints.length > 0 && geocodedComplaints.length === 0) {
            geocodeIncidents();
        }
    }, [complaints]);

    // Handle routing request
    const fetchRoute = async (incident) => {
        if (!userLoc) return;
        try {
            setSelectedIncident(incident);
            // OSRM requires format: lon,lat
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc[1]},${userLoc[0]};${incident.lng},${incident.lat}?overview=full&geometries=geojson`);
            const data = await res.json();

            if (data.routes && data.routes.length > 0) {
                const r = data.routes[0];
                // OSRM geojson returns lon,lat. Leaflet needs lat,lon
                const swappedCoords = r.geometry.coordinates.map(c => [c[1], c[0]]);
                setRoute({
                    distance: (r.distance / 1000).toFixed(1) + " km",
                    duration: Math.ceil(r.duration / 60) + " mins",
                    path: swappedCoords
                });
            }
        } catch (e) {
            console.error("Routing error", e);
        }
    };

    // Auto-route if redirected from Dashboard Hotspots
    useEffect(() => {
        if (geocodedComplaints.length > 0 && targetLocation && userLoc && !route) {
            const target = geocodedComplaints.find(c => c.location === targetLocation);
            if (target) {
                fetchRoute(target);
            }
        }
    }, [geocodedComplaints, targetLocation, userLoc, route]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        Live Spatial Tracking
                    </h1>
                    <p className="text-gray-400 mt-1">Real-world geography mapped from unstructured incident text.</p>
                </div>
                {route && (
                    <div className="bg-[#1E293B] border border-indigo-500/30 p-3 rounded-xl flex items-center gap-4 text-sm animate-pulse-slow shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                        <div className="flex items-center gap-2"><Navigation className="w-5 h-5 text-indigo-400" /> <span className="text-white font-bold">{route.distance}</span> away</div>
                        <div className="flex items-center gap-2"><Car className="w-5 h-5 text-green-400" /> <span className="text-white font-bold">{route.duration}</span> ETA</div>
                    </div>
                )}
            </div>

            {locError && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" /> {locError}
                </div>
            )}

            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-1 relative h-[650px] shadow-2xl overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 z-[1000] bg-[#0F172A]/80 backdrop-blur-sm flex flex-col items-center justify-center text-indigo-400 font-medium">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                        Connecting to Nominatim Satellites & Geocoding...
                    </div>
                )}

                <MapContainer
                    center={userLoc || defaultCenter}
                    zoom={userLoc ? 12 : 5}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%', borderRadius: '1rem', background: '#0F172A' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {userLoc && <ChangeView center={userLoc} zoom={13} />}
                    {route && route.path.length > 0 && <ChangeView center={route.path[0]} zoom={12} />}

                    {/* User Location Marker */}
                    {userLoc && (
                        <Marker position={userLoc} icon={userIcon}>
                            <Popup className="text-slate-900 border-none rounded-xl">
                                <div className="font-bold">Your Command Vehicle</div>
                                <div className="text-xs text-gray-500 mt-1">Live Officer Tracking Enabled</div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Complaint Tracking Markers */}
                    {geocodedComplaints.map(c => (
                        <Marker
                            key={c.id}
                            position={[c.lat, c.lng]}
                            icon={c.urgency?.toLowerCase() === 'high' ? redIcon : yellowIcon}
                        >
                            <Popup className="text-slate-900">
                                <div className="font-bold text-base mb-1">{c.issueType}</div>
                                <div className="text-xs text-gray-600 mb-2 truncate max-w-[200px]">{c.summary}</div>
                                <div className={`text-xs font-bold mb-3 ${c.urgency?.toLowerCase() === 'high' ? 'text-red-600' : 'text-yellow-600'}`}>
                                    {c.urgency?.toUpperCase()} PRIORITY
                                </div>
                                <button
                                    onClick={() => fetchRoute(c)}
                                    disabled={!userLoc}
                                    className="w-full bg-indigo-600 disabled:bg-gray-400 text-white font-semibold py-1.5 rounded disabled:cursor-not-allowed transition hover:bg-indigo-700"
                                >
                                    {userLoc ? "Dispatch Route" : "Awaiting User Location"}
                                </button>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Render Route Polyline */}
                    {route && (
                        <Polyline
                            positions={route.path}
                            pathOptions={{ color: '#4F46E5', weight: 6, opacity: 0.8, lineCap: 'round', dashArray: '1, 10' }}
                        />
                    )}

                </MapContainer>

                <div className="absolute top-4 right-4 bg-[#0F172A] border border-white/10 p-4 rounded-xl text-sm z-[400] shadow-xl">
                    <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-400" /> Tracking Key
                    </h3>
                    <div className="flex items-center gap-2 mb-2 text-gray-300">
                        <div className="w-3 h-3 rounded-full bg-blue-500" /> Officer Position
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-gray-300">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> High Threat
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-3 h-3 rounded-full bg-yellow-400" /> Active Report
                    </div>
                </div>
            </div>
        </div>
    );
}
