import { Link } from "react-router-dom";
import { ShieldCheck, MapPin, Activity, Zap } from "lucide-react";

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#0b1120] text-slate-200 overflow-hidden relative selection:bg-cyan-500/30">

            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Navbar */}
            <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-cyan-400" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
                        CivicCall
                    </span>
                </div>
                <div className="flex gap-3 items-center">
                    <Link to="/officer-login" className="px-4 py-2 text-sm font-medium text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 rounded-full transition">
                        Officer Login
                    </Link>
                    <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition">
                        Admin Login
                    </Link>
                    <Link to="/signup" className="px-5 py-2.5 text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-full transition shadow-cyan-500/20">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="container mx-auto px-6 pt-32 pb-24 text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-8 animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    Live AI Processing Now Active
                </div>

                <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-tight">
                    Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Civic Intelligence</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                    Monitor your city in real-time. CivicCall transforms fragmented crisis reports into
                    live structured dashboards using artificial intelligence and geospatial tracking.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/signup" className="px-8 py-4 text-base font-semibold bg-white hover:bg-gray-100 text-slate-900 rounded-full transition shadow-xl shadow-white/10 hover:scale-105 duration-300">
                        Access Dashboard
                    </Link>
                    <a href="#features" className="px-8 py-4 text-base font-semibold bg-slate-800/50 hover:bg-slate-800 border border-white/10 rounded-full backdrop-blur-md transition text-white">
                        Explore Features
                    </a>
                </div>

                {/* Feature Cards Showcase */}
                <div id="features" className="grid md:grid-cols-3 gap-6 mt-32 text-left max-w-5xl mx-auto">

                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition group cursor-default">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                            <Zap className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Real-time Ingestion</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            Connect Twilio or Webhooks. Our system processes calls instantly without relying on manual entry.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition group cursor-default">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                            <Activity className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Autonomous AI Triage</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            Automatically assigns urgency levels and emotion tags to callers, pinpointing highest-risk assets immediately.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition group cursor-default">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition shrink-0">
                            <MapPin className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Location Heatmaps</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            Visualize precisely where stress is aggregating by reading interactive spatial mapping metrics seamlessly.
                        </p>
                    </div>

                </div>
            </main>

        </div>
    );
}
