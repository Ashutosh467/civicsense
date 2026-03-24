import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import Legend from './Legend';

const MapStyles = () => (
    <style>{`
    .leaflet-popup-content-wrapper, .leaflet-popup-tip {
      background-color: #1e293b !important;
      color: white !important;
      border: 1px solid #334155;
    }
    .leaflet-container a.leaflet-popup-close-button { color: #94a3b8 !important; }
    .map-tiles { filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7); }
    
    .ripple-marker {
      position: relative;
      background: #E24B4A;
      border-radius: 50%;
      height: 100%; width: 100%;
    }
    .ripple-marker::after {
      content: "";
      position: absolute;
      top: -6px; left: -6px; right: -6px; bottom: -6px;
      border-radius: 50%;
      border: 3px solid #E24B4A;
      animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.4); opacity: 0; }
    }
  `}</style>
);

function RouteFitter({ routeCoords }) {
    const map = useMap();
    useEffect(() => {
        if (routeCoords.length > 0) {
            map.fitBounds(routeCoords, { padding: [50, 50] });
        }
    }, [routeCoords, map]);
    return null;
}

export default function LiveMap({ zones }) {
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeCoords, setRouteCoords] = useState([]);

    const handleGetDirections = (lat, lng) => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        const toastId = toast.loading("Locating officer & calculating route...");

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const oLat = pos.coords.latitude;
                const oLng = pos.coords.longitude;
                try {
                    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${lng},${lat}?overview=full&geometries=geojson`);
                    const data = await res.json();
                    if (data && data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
                        setRouteCoords(coordinates);
                        setRouteInfo({
                            distance: (route.distance / 1000).toFixed(1),
                            time: Math.round(route.duration / 60)
                        });
                        toast.success("Route generated", { id: toastId });
                    } else {
                        throw new Error("No route found");
                    }
                } catch (err) {
                    toast.error("Failed to generate route from OSRM", { id: toastId });
                }
            },
            (err) => {
                toast.error("Please allow location access to use directions", { id: toastId });
            }
        );
    };

    return (
        <div className="w-full h-full relative">
            <MapStyles />
            <MapContainer center={[20.5937, 78.9629]} zoom={5} className="w-full h-full z-0" zoomControl={true}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                    className="map-tiles"
                />
                <RouteFitter routeCoords={routeCoords} />

                {zones.map((zone) => {
                    const isHigh = zone.urgency === 'HIGH';
                    const color = isHigh ? '#E24B4A' : zone.urgency === 'MEDIUM' ? '#EF9F27' : '#639922';
                    const radius = Math.min(30, 12 + ((zone.count - 1) * 4));

                    if (isHigh) {
                        const pulseIcon = L.divIcon({
                            className: '',
                            html: `<div class="ripple-marker" style="width: ${radius * 2}px; height: ${radius * 2}px;"></div>`,
                            iconSize: [radius * 2, radius * 2],
                            iconAnchor: [radius, radius]
                        });

                        return (
                            <Marker key={zone.location} position={[zone.lat, zone.lng]} icon={pulseIcon}>
                                <Popup className="custom-popup">
                                    <PopupContent zone={zone} color={color} onDirections={() => handleGetDirections(zone.lat, zone.lng)} />
                                </Popup>
                            </Marker>
                        );
                    } else {
                        return (
                            <CircleMarker
                                key={zone.location}
                                center={[zone.lat, zone.lng]}
                                radius={radius}
                                pathOptions={{ color: color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
                            >
                                <Popup className="custom-popup">
                                    <PopupContent zone={zone} color={color} onDirections={() => handleGetDirections(zone.lat, zone.lng)} />
                                </Popup>
                            </CircleMarker>
                        );
                    }
                })}

                {routeCoords.length > 0 && (
                    <Polyline positions={routeCoords} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8, dashArray: '10, 10' }} />
                )}
            </MapContainer>

            <Legend />

            {routeInfo && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-[#1e293b] text-white p-4 rounded-xl shadow-2xl border border-blue-500/50 flex items-center gap-6">
                    <div className="flex gap-5">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Distance</p>
                            <p className="font-bold text-xl">{routeInfo.distance} km</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Est. Time</p>
                            <p className="font-bold text-xl text-green-400">{routeInfo.time} min</p>
                        </div>
                    </div>
                    <button onClick={() => { setRouteCoords([]); setRouteInfo(null); }} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-red-500/50">
                        Clear Route
                    </button>
                </div>
            )}
        </div>
    );
}

const PopupContent = ({ zone, color, onDirections }) => (
    <div className="min-w-[220px] font-sans p-1">
        <h3 className="font-bold text-lg mb-2 text-white tracking-wide">{zone.location}</h3>
        <div className="flex justify-between items-center mb-3 bg-[#0f172a] p-2 rounded-lg border border-slate-700">
            <span className="text-sm text-slate-300">Total Cases: <strong className="text-white text-base ml-1">{zone.count}</strong></span>
            <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider text-black" style={{ backgroundColor: color }}>
                {zone.urgency}
            </span>
        </div>
        <div className="mb-4">
            <p className="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-widest">Reported Issues</p>
            <ul className="text-xs space-y-1.5 max-h-[100px] overflow-y-auto pl-3 text-slate-200" style={{ listStyleType: 'circle', scrollbarWidth: 'thin' }}>
                {zone.issues.slice(0, 5).map((issue, idx) => (
                    <li key={idx} className="line-clamp-2">{issue}</li>
                ))}
                {zone.issues.length > 5 && <li className="text-slate-500 italic mt-1 font-semibold">+{zone.issues.length - 5} more issues...</li>}
            </ul>
        </div>
        <button onClick={onDirections} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            Get Directions
        </button>
    </div>
);
