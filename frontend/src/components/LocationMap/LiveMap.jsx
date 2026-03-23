import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Map controller to handle flying to selected zones
function MapController({ selectedZone }) {
    const map = useMap();
    useEffect(() => {
        if (selectedZone) {
            map.flyTo([selectedZone.lat, selectedZone.lng], 14, { duration: 1.2 });
        }
    }, [selectedZone, map]);
    return null;
}

// Controller specifically intended for the Heatmap layer
function HeatmapLayer({ zones }) {
    const map = useMap();
    useEffect(() => {
        if (!L.heatLayer || zones.length === 0) return;

        // Create data points [lat, lng, intensity]
        // Max intensity value depends on number of cases
        const heatPoints = zones.map(z => [z.lat, z.lng, z.cases * 10]);

        const layer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: { 0.4: 'green', 0.6: 'orange', 1.0: 'red' }
        }).addTo(map);

        return () => {
            map.removeLayer(layer);
        };
    }, [map, zones]);

    return null;
}

// Custom Icon for Officers
const officerIconHtml = `<div style="width: 16px; height: 16px; border-radius: 50%; background-color: #3b82f6; border: 2px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>`;
const OfficerIcon = L.divIcon({
    html: officerIconHtml,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

export default function LiveMap({ zones, selectedZone, onZoneSelect, viewMode }) {
    // Generate dummy offiers around active zones for the 'Officers' view
    const officers = useMemo(() => {
        return zones.flatMap((zone, zIdx) => {
            // Create random offset officers near each zone based on the zone's random officer count
            return Array.from({ length: zone.officers }).map((_, i) => ({
                id: `off-${zIdx}-${i}`,
                name: `Officer Unit ${zIdx}-${i + 1}`,
                lat: zone.lat + (Math.random() - 0.5) * 0.02,
                lng: zone.lng + (Math.random() - 0.5) * 0.02,
                status: Math.random() > 0.4 ? 'Patrolling' : 'Responding'
            }));
        });
    }, [zones]);

    return (
        <>
            <style>{`
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background-color: #1e293b !important;
          color: white !important;
          border: 1px solid #334155;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #94a3b8 !important;
        }
      `}</style>
            <MapContainer
                center={[40.7128, -74.0060]} // Default center (NYC)
                zoom={11}
                className="w-full h-full z-0"
                zoomControl={true}
            >
                {/* Dark CartoDB Tiles (No API Key Required) */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
                />

                <MapController selectedZone={selectedZone} />

                {/* Primary Incidents View */}
                {viewMode === 'Incidents' && zones.map(zone => {
                    const isHigh = zone.urgency === 'High';
                    const isMedium = zone.urgency === 'Medium';
                    const rawColor = isHigh ? '#ef4444' : isMedium ? '#f97316' : '#22c55e';

                    return (
                        <CircleMarker
                            key={zone.name}
                            center={[zone.lat, zone.lng]}
                            // Base radius on number of cases, cap it between 10 and 40
                            radius={Math.max(10, Math.min(zone.cases * 4, 40))}
                            pathOptions={{
                                color: rawColor,
                                fillColor: rawColor,
                                fillOpacity: 0.6,
                                weight: 2,
                                className: isHigh ? 'animate-pulse' : ''
                            }}
                            eventHandlers={{
                                click: () => onZoneSelect(zone)
                            }}
                        >
                            <Popup className="bg-[#1e293b] border-slate-700 text-white">
                                <div className="p-1 min-w-[180px]">
                                    <h3 className="font-bold text-lg mb-1">{zone.name}</h3>
                                    <p className="text-sm">Active Cases: <strong>{zone.cases}</strong></p>
                                    <p className="text-sm">
                                        Urgency: <strong style={{ color: rawColor }}>{zone.urgency}</strong>
                                    </p>
                                    <p className="text-sm mt-2 text-slate-300 text-xs">Click panel for details</p>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}

                {/* Heatmap overlay view */}
                {viewMode === 'Heatmap' && (
                    <HeatmapLayer zones={zones} />
                )}

                {/* Officers markers view */}
                {viewMode === 'Officers' && officers.map(off => (
                    <Marker key={off.id} position={[off.lat, off.lng]} icon={OfficerIcon}>
                        <Popup>
                            <div className="bg-[#1e293b] p-2 rounded text-white font-sans">
                                <p className="font-bold text-sm">{off.name}</p>
                                <p className="text-xs text-slate-400">Status: {off.status}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

            </MapContainer>
        </>
    );
}
