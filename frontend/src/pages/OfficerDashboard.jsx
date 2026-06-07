import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../services/api";
import { socket } from "../services/socket";
import toast from "react-hot-toast";
import { Navigation, CheckCircle, MapPin } from "lucide-react";

export default function OfficerDashboard() {
  const { officerId: paramId } = useParams();
  const navigate = useNavigate();
  const [officerId, setOfficerId] = useState(paramId || localStorage.getItem("officerId") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gpsGranted, setGpsGranted] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionPhoto, setResolutionPhoto] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (officerId.trim()) {
      localStorage.setItem("officerId", officerId.trim());
      setIsLoggedIn(true);
      navigate(`/officer/${officerId.trim()}`, { replace: true });
    }
  };

  const requestGPS = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      toast.error("GPS not supported on this device");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await fetch(`${API}/api/officer/${officerId}/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          setGpsGranted(true);
          localStorage.setItem("gpsGranted", "true");
          toast.success("Location access granted ✅");
        } catch (err) {
          console.error("Location update failed:", err);
        }
        setGpsLoading(false);
      },
      (err) => {
        console.error("GPS error:", err);
        toast.error("Location access denied. You must allow location to use dashboard.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setPhotoPreview(base64);
      setIsUploadingPhoto(true);
      try {
        const res = await fetch(`${API}/api/upload/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo: base64, complaintId: resolvingId }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setResolutionPhoto(data.url);
          toast.success("Photo uploaded ✅");
        } else {
          setResolutionPhoto(base64);
        }
      } catch (err) {
        setResolutionPhoto(base64);
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (paramId) {
      setOfficerId(paramId);
      localStorage.setItem("officerId", paramId);
      setIsLoggedIn(true);
    } else if (localStorage.getItem("officerId")) {
      setOfficerId(localStorage.getItem("officerId"));
      setIsLoggedIn(true);
      if (!paramId) navigate(`/officer/${localStorage.getItem("officerId")}`, { replace: true });
    }
    if (localStorage.getItem("gpsGranted") === "true") {
      setGpsGranted(true);
    }
  }, [paramId, navigate]);

  const fetchComplaints = async () => {
    if (!officerId) return;
    try {
      const res = await fetch(`${API}/api/officer/${officerId}/complaints`);
      const data = await res.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !officerId || !gpsGranted) return;

    fetchComplaints();

    // Auto GPS update every 5 minutes
    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await fetch(`${API}/api/officer/${officerId}/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          }).catch(console.error);
        },
        (err) => console.error("GPS update error:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
    sendLocation();
    const gpsInterval = setInterval(sendLocation, 5 * 60 * 1000);

    socket.connect();
    socket.emit("joinOfficerRoom", officerId);

    const handleNewAssignment = () => {
      fetchComplaints();
      toast("New complaint assigned!", { icon: "🚨", duration: 5000 });
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("CivicCall", { body: "New complaint assigned!" });
      }
    };

    socket.on("newAssignment", handleNewAssignment);
    socket.on("complaintResolved", (data) => {
      setComplaints(prev => prev.map(c => {
        const cid = c.id || c._id;
        const uid = data.id || data._id;
        return cid === uid ? { ...c, ...data } : c;
      }));
    });

    return () => {
      socket.off("newAssignment", handleNewAssignment);
      socket.off("complaintResolved");
      clearInterval(gpsInterval);
    };
  }, [isLoggedIn, officerId, gpsGranted]);

  const handleResolve = async (complaintId) => {
    if (!resolutionNote.trim()) {
      toast.error("Resolution note is required");
      return;
    }
    try {
      const res = await fetch(`${API}/api/officer/${complaintId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officerId, resolutionNote, resolutionPhoto })
      });
      if (res.ok) {
        toast.success("Marked as resolved!");
        setResolvingId(null);
        setResolutionNote("");
        setResolutionPhoto("");
        setPhotoPreview("");
        fetchComplaints();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to resolve");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  // ─── LOGIN SCREEN ───
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4 text-white">
        <div className="bg-[#1E293B] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            CivicCall<br/><span className="text-cyan-400 text-lg">Field Officer Portal</span>
          </h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input required value={officerId} onChange={e => setOfficerId(e.target.value)}
              placeholder="Enter Officer ID"
              className="bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
            />
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition">
              Enter Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── GPS PERMISSION SCREEN ───
  if (!gpsGranted) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4 text-white">
        <div className="bg-[#1E293B] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-xl text-center">
          <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Location Access Required</h2>
          <p className="text-gray-400 mb-2">
            CivicCall needs your location to assign complaints to the nearest officer.
          </p>
          <p className="text-red-400 text-sm mb-8 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            ⚠️ You cannot access the dashboard without enabling location. This ensures complaints reach the right officer.
          </p>
          <button
            onClick={requestGPS}
            disabled={gpsLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <MapPin className="w-5 h-5" />
            {gpsLoading ? "Getting your location..." : "Allow Location Access"}
          </button>
          <p className="text-gray-600 text-xs mt-4">
            Your location is only used for complaint assignment and updated every 5 minutes while on duty.
          </p>
        </div>
      </div>
    );
  }

  const activeCount = complaints.filter(c => c.status !== "resolved").length;
  const today = new Date().toDateString();
  const resolvedToday = complaints.filter(c =>
    c.status === "resolved" && new Date(c.resolvedAt || c.time).toDateString() === today
  ).length;

  return (
    <div className="min-h-screen bg-[#0b1120] text-gray-300 pb-12">
      <div className="bg-[#1E293B] border-b border-white/5 sticky top-0 z-10 px-4 py-4 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-white">CivicCall <span className="text-cyan-400">Officer</span></h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Live
          </span>
          <div className="text-xs bg-[#0F172A] px-2 py-1 rounded text-gray-400 border border-white/5">
            ID: {officerId}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5 text-center">
            <div className="text-2xl font-bold text-orange-400">{activeCount}</div>
            <div className="text-[10px] text-gray-400 uppercase">Active</div>
          </div>
          <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5 text-center">
            <div className="text-2xl font-bold text-green-400">{resolvedToday}</div>
            <div className="text-[10px] text-gray-400 uppercase">Resolved Today</div>
          </div>
          <div className="bg-[#1E293B] p-3 rounded-xl border border-white/5 text-center">
            <div className="text-2xl font-bold text-cyan-400">{complaints.length}</div>
            <div className="text-[10px] text-gray-400 uppercase">Total Assigned</div>
          </div>
        </div>

        <div className="space-y-4">
          {complaints.length === 0 && (
            <div className="text-center text-gray-500 mt-10">No complaints assigned yet.</div>
          )}
          {complaints.map(c => {
            const urgencyColor = c.urgency?.toLowerCase() === "high"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : c.urgency?.toLowerCase() === "medium"
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              : "bg-green-500/20 text-green-400 border border-green-500/30";
            const isResolved = c.status === "resolved";
            const cid = c.id || c._id;

            return (
              <div key={cid} className={`bg-[#1E293B] rounded-xl p-4 border transition ${isResolved ? "border-green-500/20 opacity-70" : "border-white/10"}`}>
                {c.status === "escalated" && (
                  <div className="bg-red-500/20 border border-red-500 rounded-lg px-3 py-2 text-red-400 text-sm font-semibold mb-3">
                    ⚠️ Escalated — Resolve immediately
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-white text-lg leading-tight">{c.translatedIssue || c.issueType}</h3>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${urgencyColor}`}>{c.urgency}</span>
                    {c.urgencyScore !== undefined && (
                      <span className="text-[10px] text-gray-400">
                        AI: <span className={`font-bold ${c.urgencyScore >= 8 ? "text-red-400" : c.urgencyScore >= 6 ? "text-orange-400" : "text-yellow-400"}`}>
                          {c.urgencyScore?.toFixed(1)}/10
                        </span>
                      </span>
                    )}
                    {c.audioOverride && <span className="text-[10px] text-red-400 animate-pulse">🎙 Emergency</span>}
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-2">{new Date(c.time).toLocaleString()}</p>

                {c.deadline && (
                  <div className={`mb-4 px-3 py-2 rounded-lg border ${
                    new Date(c.deadline) - new Date() < 3600000
                      ? "bg-red-500/20 border-red-500/50 text-red-400"
                      : new Date(c.deadline) - new Date() < 21600000
                      ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                      : "bg-blue-500/20 border-blue-500/50 text-blue-400"
                  }`}>
                    <p className="text-xs font-bold">⏱ Resolve by: {new Date(c.deadline).toLocaleString()}</p>
                    <p className="text-xs mt-0.5">
                      {(() => {
                        const diff = new Date(c.deadline) - new Date();
                        if (diff <= 0) return "🚨 DEADLINE BREACHED";
                        const hours = Math.floor(diff / 3600000);
                        const mins = Math.floor((diff % 3600000) / 60000);
                        return hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
                      })()}
                    </p>
                  </div>
                )}

                <div className="bg-[#0F172A] rounded-lg p-3 mb-4 border border-white/5 relative">
                  <div className="text-sm text-gray-300 pr-10">{c.translatedLocation || c.location}</div>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.translatedLocation || c.location)}`}
                    target="_blank" rel="noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600/20 text-indigo-400 p-2 rounded-lg hover:bg-indigo-600/40 transition">
                    <Navigation className="w-5 h-5" />
                  </a>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="bg-gray-700/50 text-gray-300 text-[11px] px-2 py-1 rounded border border-white/5">{c.department}</span>
                  <span className={`text-[11px] px-2 py-1 rounded border font-bold ${isResolved ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
                    {c.status?.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                {!isResolved && resolvingId !== cid && (
                  <button onClick={() => setResolvingId(cid)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition">
                    <CheckCircle className="w-5 h-5" /> Mark Resolved
                  </button>
                )}

                {resolvingId === cid && (
                  <div className="bg-[#0F172A] p-4 rounded-lg border border-indigo-500/30 mt-2">
                    <label className="text-xs text-gray-400 mb-1 block">Resolution Note</label>
                    <textarea autoFocus
                      className="w-full bg-[#1E293B] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-green-500 focus:outline-none mb-2"
                      rows="3" placeholder="Describe what action was taken..."
                      value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                    />
                    <label className="text-xs text-gray-400 mb-1 block">📷 Resolution Photo (recommended)</label>
                    <div className="mb-3">
                      <input type="file" accept="image/*" capture="environment"
                        onChange={handlePhotoUpload} className="hidden" id={`photo-${cid}`} />
                      <label htmlFor={`photo-${cid}`}
                        className="w-full flex items-center justify-center gap-2 bg-[#1E293B] border border-dashed border-indigo-500/40 hover:border-indigo-500 text-indigo-400 text-sm py-3 rounded-lg cursor-pointer transition">
                        📷 {isUploadingPhoto ? "Uploading..." : photoPreview ? "Photo Uploaded ✅" : "Tap to take photo or upload"}
                      </label>
                      {photoPreview && <img src={photoPreview} alt="proof" className="mt-2 w-full rounded-lg border border-white/10 max-h-40 object-cover" />}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setResolvingId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm">Cancel</button>
                      <button onClick={() => handleResolve(cid)} disabled={isUploadingPhoto}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                        {isUploadingPhoto ? "Uploading..." : "Submit"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
