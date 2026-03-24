import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API } from "../services/api";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  Car,
  AlertCircle,
  X,
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

export default function MapPage() {
  const [complaints, setComplaints] = useState([]);
  const [zones, setZones] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);
  const [locError, setLocError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [routeBounds, setRouteBounds] = useState(null);

  const routerState = useLocation().state;
  const targetLocation = routerState?.targetLocation;

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const res = await fetch(`${API}/api/complaint`);
        const data = await res.json();
        if (Array.isArray(data)) setComplaints(data);
      } catch (err) {
        console.error("Map data not reachable", err);
        setLoading(false);
      }
    };
    fetchMapData();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        () =>
          setLocError("Allow location access to get directions to incidents."),
      );
    }
  }, []);

  useEffect(() => {
    if (!complaints.length) {
      setLoading(false);
      return;
    }

    const geocodeAll = async () => {
      setLoading(true);

      const grouped = {};
      complaints.forEach((c) => {
        if (c.status?.toLowerCase() === "resolved" || !c.location) return;
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
        const u = c.urgency?.toUpperCase() || "LOW";
        if ((levels[u] || 1) > (levels[grouped[c.location].urgency] || 1)) {
          grouped[c.location].urgency = u;
        }
      });

      const zonesArray = Object.values(grouped);
      const readyZones = [];

      for (let i = 0; i < zonesArray.length; i++) {
        const zone = zonesArray[i];

        if (geocodeCache[zone.location]) {
          if (geocodeCache[zone.location].lat !== null) {
            zone.lat = geocodeCache[zone.location].lat;
            zone.lng = geocodeCache[zone.location].lng;
            readyZones.push({ ...zone });
          }
          continue;
        }

        try {
          await new Promise((r) => setTimeout(r, 300));
          const res = await fetch(
            `http://localhost:10000/api/geocode?location=${encodeURIComponent(zone.location)}`,
          );
          const data = await res.json();
          if (data && data.lat !== null && data.lon !== null) {
            geocodeCache[zone.location] = { lat: data.lat, lng: data.lon };
            zone.lat = data.lat;
            zone.lng = data.lon;
            readyZones.push({ ...zone });
          } else {
            geocodeCache[zone.location] = { lat: null, lng: null };
          }
        } catch (e) {
          console.warn(`Geocode failed for ${zone.location}`);
          geocodeCache[zone.location] = { lat: null, lng: null };
        }
      }

      setZones(readyZones);
      setLoading(false);
    };

    geocodeAll();
  }, [complaints]);

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
      : zones.filter((z) => z.urgency.toUpperCase() === filter.toUpperCase());

  const highCount = zones.filter((z) => z.urgency === "HIGH").length;
  const medCount = zones.filter((z) => z.urgency === "MEDIUM").length;

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

          {visibleZones.map((zone, idx) => (
            <CircleMarker
              key={idx}
              center={[zone.lat, zone.lng]}
              radius={getRadius(zone.count)}
              pathOptions={{
                color: getColor(zone.urgency),
                fillColor: getColor(zone.urgency),
                fillOpacity: 0.8,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div
                    style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}
                  >
                    {zone.location}
                  </div>
                  <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
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
                      style={{ fontSize: 11, color: "#666", marginBottom: 8 }}
                    >
                      {[...new Set(zone.issues)].slice(0, 3).join(", ")}
                    </div>
                  )}
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
