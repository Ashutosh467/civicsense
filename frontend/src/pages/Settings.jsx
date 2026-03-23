import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserCircle, Bell, Shield, LogOut } from "lucide-react";

export default function Settings() {
    const { user, logout } = useAuth();
    const [notifications, setNotifications] = useState(true);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                    Platform Settings
                </h1>
                <p className="text-gray-400 mt-1">Manage your officer profile and system preferences.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                            <UserCircle className="w-12 h-12 text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">{user?.name || "Officer"}</h2>
                        <p className="text-sm text-indigo-400">{user?.email || "officer@civicsense.gov"}</p>
                        <div className="mt-4 px-3 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full border border-green-500/20">
                            Active Clearance
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
                                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    disabled
                                    value={user?.name || ""}
                                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-4 py-2 text-gray-300 opacity-70 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
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
                                <h4 className="font-semibold text-white">Live AI Dashboard Alerts</h4>
                                <p className="text-xs text-gray-400">Receive socket updates dynamically</p>
                            </div>
                            <button
                                onClick={() => setNotifications(!notifications)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-indigo-500' : 'bg-gray-700'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notifications ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

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
