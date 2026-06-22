import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API } from "../services/api";
import {
  UserCircle,
  Bell,
  Shield,
  LogOut,
  UserPlus,
  Users,
  Ban,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

const authHeaders = () => {
  const token = localStorage.getItem("civicsense_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function Settings() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const isSuperAdmin = user?.role === "superadmin";

  const [adminInvites, setAdminInvites] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [inviteForm, setInviteForm] = useState({
    invitedName: "",
    email: "",
    label: "",
  });
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const fetchAdminInvites = async () => {
    try {
      const res = await fetch(`${API}/api/admin-invite/`, {
        headers: { ...authHeaders() },
      });
      const data = await res.json();
      setAdminInvites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch admin invites", err);
    }
  };

  const fetchAdminList = async () => {
    try {
      const res = await fetch(`${API}/api/admin-invite/admins`, {
        headers: { ...authHeaders() },
      });
      const data = await res.json();
      setAdminList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch admin list", err);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdminInvites();
      fetchAdminList();
    }
  }, [isSuperAdmin]);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setIsCreatingInvite(true);
    try {
      const res = await fetch(`${API}/api/admin-invite/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invite");

      const inviteLink = `${window.location.origin}/admin-setup?token=${data.token}`;
      await navigator.clipboard.writeText(inviteLink).catch(() => {});
      toast.success(
        data.emailSent
          ? "Invite created and emailed!"
          : "Invite created! Link copied to clipboard.",
      );
      setInviteForm({ invitedName: "", email: "", label: "" });
      fetchAdminInvites();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleToggleActive = async (admin) => {
    const newStatus = !admin.isActive;
    const confirmMsg = newStatus
      ? `Reactivate ${admin.name}'s account?`
      : `Deactivate ${admin.name}'s account? They will be logged out and unable to log back in until reactivated.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(
        `${API}/api/admin-invite/admins/${admin._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ isActive: newStatus }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      toast.success(data.message);
      fetchAdminList();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Platform Settings
        </h1>
        <p className="text-gray-400 mt-1">
          Manage your profile and system access.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
              <UserCircle className="w-12 h-12 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {user?.name || "Admin"}
            </h2>
            <p className="text-sm text-indigo-400">
              {user?.email || "admin@civicsense.gov"}
            </p>
            <div
              className={`mt-4 px-3 py-1 text-xs font-semibold rounded-full border ${
                isSuperAdmin
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  : "bg-green-500/10 text-green-400 border-green-500/20"
              }`}
            >
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" /> Account Security
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ""}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2 text-gray-300 opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2 text-gray-300 opacity-70 cursor-not-allowed"
                />
              </div>
              <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition cursor-not-allowed opacity-50">
                Change Password (Contact Admin)
              </button>
            </div>
          </div>

          <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" /> Preferences
            </h3>

            <div className="flex items-center justify-between p-4 bg-[#0F172A] rounded-xl border border-white/5">
              <div>
                <h4 className="font-semibold text-white">
                  Live AI Dashboard Alerts
                </h4>
                <p className="text-xs text-gray-400">
                  Receive socket updates dynamically
                </p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? "bg-indigo-500" : "bg-gray-700"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notifications ? "left-7" : "left-1"}`}
                />
              </button>
            </div>
          </div>

          {isSuperAdmin && (
            <>
              {/* Invite New Admin */}
              <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" /> Invite New
                  Admin
                </h3>
                <form
                  onSubmit={handleCreateInvite}
                  className="flex flex-wrap gap-3 items-end"
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                    <label className="text-xs text-gray-400">
                      Name (for your reference)
                    </label>
                    <input
                      required
                      value={inviteForm.invitedName}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          invitedName: e.target.value,
                        })
                      }
                      className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g. Priya Sharma"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                    <label className="text-xs text-gray-400">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          email: e.target.value,
                        })
                      }
                      className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      placeholder="priya@example.com"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                    <label className="text-xs text-gray-400">
                      Label (optional)
                    </label>
                    <input
                      value={inviteForm.label}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, label: e.target.value })
                      }
                      className="bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g. Patna Control Room"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreatingInvite}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    {isCreatingInvite ? "Creating..." : "Create Invite"}
                  </button>
                </form>
                <p className="text-gray-500 text-xs mt-3">
                  Invite links expire after 72 hours and can only be used once.
                  The invite is emailed automatically to the address you enter.
                </p>

                {adminInvites.length > 0 && (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="bg-[#0F172A] text-gray-400 uppercase text-xs">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Label</th>
                          <th className="p-2">Sent</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminInvites.map((inv) => (
                          <tr key={inv._id} className="border-t border-white/5">
                            <td className="p-2 text-white">
                              {inv.invitedName || "—"}
                            </td>
                            <td className="p-2 text-gray-400">
                              {inv.label || "—"}
                            </td>
                            <td className="p-2 text-gray-400 text-xs">
                              {inv.createdAt
                                ? new Date(inv.createdAt).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="p-2">
                              {inv.used ? (
                                <span className="text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded text-xs">
                                  ✓ Used
                                </span>
                              ) : (
                                <span className="text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded text-xs">
                                  ⏳ Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Admin List */}
              <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" /> Admin Accounts
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-[#0F172A] text-gray-400 uppercase text-xs">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminList.map((admin) => (
                        <tr key={admin._id} className="border-t border-white/5">
                          <td className="p-2 text-white font-medium">
                            {admin.name}
                          </td>
                          <td className="p-2 text-gray-400">{admin.email}</td>
                          <td className="p-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                admin.role === "superadmin"
                                  ? "bg-purple-500/10 text-purple-400"
                                  : "bg-blue-500/10 text-blue-400"
                              }`}
                            >
                              {admin.role}
                            </span>
                          </td>
                          <td className="p-2">
                            {admin.isActive === false ? (
                              <span className="text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded text-xs">
                                Deactivated
                              </span>
                            ) : (
                              <span className="text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded text-xs">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            {admin.role === "superadmin" ||
                            admin._id === user?.id ? (
                              <span className="text-gray-600 text-xs">—</span>
                            ) : (
                              <button
                                onClick={() => handleToggleActive(admin)}
                                className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg border transition font-medium ${
                                  admin.isActive === false
                                    ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                                }`}
                              >
                                {admin.isActive === false ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />{" "}
                                    Reactivate
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3 h-3" /> Deactivate
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-semibold py-3 px-6 rounded-xl transition"
            >
              <LogOut className="w-5 h-5" /> End Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
