import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "../services/api";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  Car,
  AlertCircle,
  X,
  Layers,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.heat";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const defaultCenter = [20.5937, 78.9629];
const geocodeCache = {};

const getColor = (urgency) => {
  switch (urgency?.toUpperCase()) {
    case "HIGH":
      return "#E24B4A";
    case "MEDIUM":
      return "#EF9F27";
    case "LOW":
      return "#639922";
    default:
      return "#639922";
  }
};

const getRadius = (count) => Math.min(12 + count * 4, 30);

const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [bounds, map]);
  return null;
};

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const HeatLayer = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const heat = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 10,
      gradient: {
        0.2: "#639922",
        0.5: "#EF9F27",
        0.8: "#E24B4A",
        1.0: "#7B0000",
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);
  return null;
};

const createClusterCustomIcon = function (cluster) {
  const markers = cluster.getAllChildMarkers();
  let hasHigh = false;
  let hasMedium = false;
  let totalCount = 0;

  markers.forEach((marker) => {
    const urgency = marker.options.urgency || (marker.options.pathOptions && marker.options.pathOptions.urgency) || "LOW";
    const count = marker.options.count || (marker.options.pathOptions && marker.options.pathOptions.count) || 1;
    totalCount += count;
    if (urgency === "HIGH") hasHigh = true;
    if (urgency === "MEDIUM") hasMedium = true;
  });

  let color = "#639922"; // default LOW GREEN
  if (hasHigh) color = "#E24B4A"; // RED
  else if (hasMedium) color = "#EF9F27"; // ORANGE

  return L.divIcon({
    html: `<div style="background-color: #1E293B; color: white; border: 2px solid ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 0 10px ${color}80;"><span>${totalCount}</span></div>`,
    className: "custom-marker-cluster",
    iconSize: L.point(36, 36, true),
  });
};

export default function MapPage() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [zones, setZones] = useState([]);
  const zonesRef = useRef([]);
  const [userLoc, setUserLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [route, setRoute] = useState(null);
  const [locError, setLocError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [routeBounds, setRouteBounds] = useState(null);
  const [viewMode, setViewMode] = useState("Incidents"); // 'Incidents' or 'Heatmap'
  const [lastUpdated, setLastUpdated] = useState(0);

  const routerState = useLocation().state;
  const targetLocation = routerState?.targetLocation;

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const res = await fetch(`${API}/api/complaint`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setComplaints(data);
          setLastUpdated(0);
        }
      } catch (err) {
        console.error("Map data not reachable", err);
        if (firstLoad) setLoading(false);
      }
    };

    fetchMapData();
    const intervalId = setInterval(fetchMapData, 30000);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        () =>
          setLocError("Allow location access to get directions to incidents."),
      );
    }

    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timerId = setInterval(() => {
      setLastUpdated((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!complaints.length) {
      if (firstLoad) setLoading(false);
      return;
    }

    const geocodeAll = async () => {
      if (zonesRef.current.length === 0 && firstLoad) setLoading(true);

      const grouped = {};
      complaints.forEach((c) => {
        if (c.status?.toLowerCase() === "resolved" || !c.location) return;
        
        const locKey = c.translatedLocation || c.location; // Use translated if available
        
        if (!grouped[locKey]) {
          grouped[locKey] = {
            location: locKey,
            count: 0,
            urgency: "LOW",
            issues: [],
            lat: null,
            lng: null,
          };
        }
        grouped[locKey].count += 1;
        
        const issueKey = c.translatedIssue || c.issue || c.issueType;
        if (issueKey) grouped[locKey].issues.push(issueKey);
        
        const levels = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const u = c.urgency?.toUpperCase() || "LOW";
        if ((levels[u] || 1) > (levels[grouped[locKey].urgency] || 1)) {
          grouped[locKey].urgency = u;
        }
      });

      const zonesArray = Object.values(grouped);
      let currentZones = [...zonesRef.current];
      let changed = false;

      for (let i = 0; i < zonesArray.length; i++) {
        const zone = zonesArray[i];

        const existingZone = currentZones.find((z) => z.location === zone.location);
        if (existingZone) {
          if (existingZone.count !== zone.count || existingZone.urgency !== zone.urgency) {
            existingZone.count = zone.count;
            existingZone.urgency = zone.urgency;
            existingZone.issues = zone.issues;
            changed = true;
          }
          continue;
        }

        if (geocodeCache[zone.location]) {
          if (geocodeCache[zone.location].lat !== null) {
            zone.lat = geocodeCache[zone.location].lat;
            zone.lng = geocodeCache[zone.location].lng;
            currentZones.push({ ...zone });
            changed = true;
          }
          continue;
        }

        try {
          await new Promise((r) => setTimeout(r, 100));
          const res = await fetch(
            `http://localhost:10000/api/geocode?location=${encodeURIComponent(zone.location)}`,
          );
          const data = await res.json();
          if (data && data.lat !== null && data.lon !== null) {
            geocodeCache[zone.location] = { lat: data.lat, lng: data.lon };
            zone.lat = data.lat;
            zone.lng = data.lon;
            currentZones.push({ ...zone });
            changed = true;
          } else {
            geocodeCache[zone.location] = { lat: null, lng: null };
          }
        } catch (e) {
          console.warn(`Geocode failed for ${zone.location}`);
          geocodeCache[zone.location] = { lat: null, lng: null };
        }
      }

      if (changed || (firstLoad && currentZones.length > 0)) {
        zonesRef.current = currentZones;
        setZones(currentZones);
      }

      if (firstLoad) {
        setLoading(false);
        setFirstLoad(false);
      }
    };

    geocodeAll();
  }, [complaints, firstLoad]);

  useEffect(() => {
    if (zones.length > 0 && targetLocation && userLoc && !route) {
      const target = zones.find((z) => z.location === targetLocation);
      if (target) fetchRoute(target);
    }
  }, [zones, targetLocation, userLoc]);

  const fetchRoute = async (zone) => {
    if (!userLoc) {
      alert("Please allow location access in your browser to use directions.");
      return;
    }
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLoc[1]},${userLoc[0]};${zone.lng},${zone.lat}?overview=full&geometries=geojson`,
      );
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const r = data.routes[0];
        const path = r.geometry.coordinates.map((c) => [c[1], c[0]]);
        setRoute({
          distance: (r.distance / 1000).toFixed(1) + " km",
          duration: Math.ceil(r.duration / 60) + " mins",
          path,
          to: zone.location,
        });
        setRouteBounds([
          [userLoc[0], userLoc[1]],
          [zone.lat, zone.lng],
        ]);
      }
    } catch (e) {
      console.error("Routing error", e);
    }
  };

  const clearRoute = () => {
    setRoute(null);
    setRouteBounds(null);
  };

  const visibleZones =
    filter === "All"
      ? zones
      : zones.filter((z) => z.urgency?.toUpperCase() === filter.toUpperCase());

  const highCount = zones.filter((z) => z.urgency === "HIGH").length;
  const medCount = zones.filter((z) => z.urgency === "MEDIUM").length;
  const lowCount = zones.filter((z) => z.urgency === "LOW").length;

  const maxDensity = Math.max(...zones.map((z) => z.count), 1);
  const heatmapPoints = zones.map((z) => [z.lat, z.lng, z.count / maxDensity]);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Live Spatial Tracking
          </h1>
          <p className="text-gray-400 mt-1">
            Real-world geography mapped from unstructured incident text.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 bg-[#1E293B] border border-white/10 rounded-xl p-1">
            {["Incidents", "Heatmap"].map((f) => (
              <button
                key={f}
                onClick={() => setViewMode(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === f ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-2 bg-[#1E293B] border border-white/10 rounded-xl p-1">
            {["All", "High", "Medium", "Low"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  filter === f
                    ? f === "All"
                      ? "bg-indigo-600 text-white"
                      : f === "High"
                        ? "bg-red-600 text-white"
                        : f === "Medium"
                          ? "bg-yellow-500 text-white"
                          : "bg-green-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="bg-[#1E293B] border border-white/10 rounded-xl px-3 py-1.5 text-sm text-center">
              <div className="text-gray-400 text-xs">Zones</div>
              <div className="text-white font-bold">{zones.length}</div>
            </div>
            <div className="bg-[#1E293B] border border-red-500/30 rounded-xl px-3 py-1.5 text-sm text-center">
              <div className="text-red-400 text-xs">High</div>
              <div className="text-white font-bold">{highCount}</div>
            </div>
            <div className="bg-[#1E293B] border border-yellow-500/30 rounded-xl px-3 py-1.5 text-sm text-center">
              <div className="text-yellow-400 text-xs">Medium</div>
              <div className="text-white font-bold">{medCount}</div>
            </div>
            <div className="bg-[#1E293B] border border-green-500/30 rounded-xl px-3 py-1.5 text-sm text-center">
              <div className="text-green-400 text-xs">Low</div>
              <div className="text-white font-bold">{lowCount}</div>
            </div>
          </div>
        </div>
      </div>

      {locError && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-3 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {locError}
        </div>
      )}

      {route && (
        <div className="bg-[#1E293B] border border-indigo-500/30 p-3 rounded-xl flex items-center justify-between gap-4 text-sm shadow-[0_0_20px_rgba(79,70,229,0.15)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-400" />
              <span className="text-gray-400">To:</span>
              <span className="text-white font-semibold">{route.to}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-green-400" />
              <span className="text-white font-bold">{route.distance}</span>
              <span className="text-gray-400">·</span>
              <span className="text-white font-bold">{route.duration}</span>
            </div>
          </div>
          <button
            onClick={clearRoute}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-3 py-1 text-xs transition"
          >
            <X className="w-3 h-3" /> Clear Route
          </button>
        </div>
      )}

      <div
        className="bg-[#1E293B] border border-white/5 rounded-2xl relative shadow-2xl overflow-hidden"
        style={{ height: "calc(100vh - 240px)" }}
      >
        <div className="absolute top-4 right-4 bg-[#0F172A]/80 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-lg text-xs text-gray-400 z-[400] shadow-xl">
          Last updated: {lastUpdated} seconds ago
        </div>

        {loading && (
          <div className="absolute inset-0 z-[1000] bg-[#0F172A]/85 backdrop-blur-sm flex flex-col items-center justify-center text-indigo-400 font-medium gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <span>Geocoding complaint locations...</span>
          </div>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={5}
          scrollWheelZoom={true}
          style={{
            height: "100%",
            width: "100%",
            borderRadius: "1rem",
            background: "#0F172A",
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
          />

          {userLoc && !route && <ChangeView center={userLoc} zoom={12} />}
          {routeBounds && <FitBounds bounds={routeBounds} />}

          {viewMode === "Heatmap" ? (
            <HeatLayer points={heatmapPoints} />
          ) : (
            <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon}>
              {visibleZones.map((zone) => (
                <CircleMarker
                  key={zone.location}
                  center={[zone.lat, zone.lng]}
                  radius={getRadius(zone.count)}
                  pathOptions={{
                    color: getColor(zone.urgency),
                    fillColor: getColor(zone.urgency),
                    fillOpacity: 0.8,
                    weight: 2,
                    urgency: zone.urgency,
                    count: zone.count,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          marginBottom: 4,
                        }}
                      >
                        {zone.location}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#555",
                          marginBottom: 6,
                        }}
                      >
                        {zone.count} active complaint{zone.count > 1 ? "s" : ""}
                      </div>
                      <div
                        style={{
                          display: "inline-block",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          marginBottom: 8,
                          background:
                            zone.urgency === "HIGH"
                              ? "#FCEBEB"
                              : zone.urgency === "MEDIUM"
                                ? "#FAEEDA"
                                : "#EAF3DE",
                          color:
                            zone.urgency === "HIGH"
                              ? "#A32D2D"
                              : zone.urgency === "MEDIUM"
                                ? "#854F0B"
                                : "#3B6D11",
                        }}
                      >
                        {zone.urgency} URGENCY
                      </div>
                      {zone.issues.length > 0 && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#666",
                            marginBottom: 8,
                          }}
                        >
                          {[...new Set(zone.issues)].slice(0, 3).join(", ")}
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          // Dashboard.jsx needs to read location.state.filterLocation
                          navigate("/dashboard", {
                            state: { filterLocation: zone.location },
                          });
                        }}
                        style={{
                          width: "100%",
                          background: "white",
                          color: "#333",
                          border: "1px solid #ccc",
                          borderRadius: 6,
                          padding: "7px 0",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                          marginBottom: 8,
                        }}
                      >
                        View in Dashboard
                      </button>

                      <button
                        onClick={() => fetchRoute(zone)}
                        style={{
                          width: "100%",
                          background: "#4F46E5",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          padding: "7px 0",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: userLoc ? "pointer" : "not-allowed",
                          opacity: userLoc ? 1 : 0.5,
                        }}
                      >
                        {userLoc
                          ? "🧭 Get Directions"
                          : "Allow location for directions"}
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MarkerClusterGroup>
          )}

          {route && (
            <Polyline
              positions={route.path}
              pathOptions={{
                color: "#4F46E5",
                weight: 6,
                opacity: 0.85,
                lineCap: "round",
                dashArray: "1, 10",
              }}
            />
          )}
        </MapContainer>

        <div className="absolute bottom-4 left-4 bg-[#0F172A]/90 border border-white/10 p-3 rounded-xl text-xs z-[400] shadow-xl">
          <div className="font-bold text-white mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-indigo-400" /> Legend
          </div>
          <div className="flex items-center gap-2 mb-1.5 text-gray-300">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "#E24B4A" }}
            />{" "}
            High urgency
          </div>
          <div className="flex items-center gap-2 mb-1.5 text-gray-300">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "#EF9F27" }}
            />{" "}
            Medium urgency
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "#639922" }}
            />{" "}
            Low urgency
          </div>
        </div>
      </div>
    </div>
  );
}
