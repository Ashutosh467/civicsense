import { Link } from "react-router-dom";
import {
  ShieldCheck,
  MapPin,
  Activity,
  Zap,
  Phone,
  Brain,
  UserCheck,
  CheckCircle,
  Clock,
  Globe,
  TrendingUp,
  Bell,
  Flame,
  Droplets,
  Bolt,
  HeartPulse,
  Car,
  Trash2,
  Scale,
} from "lucide-react";

const STATS = [
  { value: "12,000+", label: "Complaints Processed" },
  { value: "7", label: "Government Departments" },
  { value: "< 2 min", label: "Avg AI Processing Time" },
  { value: "94%", label: "Resolution Rate" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Phone,
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
    title: "Citizen Calls",
    desc: "A citizen dials the CivicCall helpline in any Indian language — Hindi, Punjabi, Tamil, Telugu, or English. No app needed.",
  },
  {
    step: "02",
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    title: "AI Processes the Call",
    desc: "Whisper AI transcribes the audio. Llama 3.3 extracts the issue, location, urgency, and emotion. A 4-dimension score is calculated in under 2 minutes.",
  },
  {
    step: "03",
    icon: UserCheck,
    color: "text-orange-400",
    bg: "bg-orange-500/20",
    title: "Officer Auto-Assigned",
    desc: "The nearest available officer in the right department is automatically assigned. They receive an SMS instantly with complaint details and a deadline.",
  },
  {
    step: "04",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/20",
    title: "Resolved with Proof",
    desc: "The officer resolves the complaint and uploads a photo as proof. The citizen receives an SMS confirmation and can accept or dispute the resolution.",
  },
];

const DEPARTMENTS = [
  {
    icon: Flame,
    color: "text-red-400",
    bg: "bg-red-500/20",
    name: "Fire Department",
    desc: "Building fires, gas leaks, rescues, explosions",
  },
  {
    icon: Scale,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    name: "Law & Order",
    desc: "Theft, harassment, missing persons, traffic accidents",
  },
  {
    icon: Car,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    name: "Roads & Infrastructure",
    desc: "Potholes, road damage, bridge repair, blocked roads",
  },
  {
    icon: Droplets,
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
    name: "Water & Sanitation",
    desc: "No water supply, pipeline burst, sewage overflow",
  },
  {
    icon: Bolt,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    name: "Electricity",
    desc: "Power cuts, transformer blast, fallen electric wires",
  },
  {
    icon: HeartPulse,
    color: "text-pink-400",
    bg: "bg-pink-500/20",
    name: "Health",
    desc: "No doctor, ambulance, food poisoning, dirty hospital",
  },
  {
    icon: Trash2,
    color: "text-green-400",
    bg: "bg-green-500/20",
    name: "Municipal Services",
    desc: "Garbage, stray animals, encroachment, park maintenance",
  },
];

const FEATURES = [
  {
    icon: Zap,
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
    title: "Real-time Ingestion",
    desc: "Calls are processed the moment they end. No manual entry, no delays. The dashboard updates live via Socket.IO.",
  },
  {
    icon: Activity,
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    title: "Autonomous AI Triage",
    desc: "4-dimension urgency scoring across life risk, spread rate, impact scale, and infrastructure risk. Panic detection overrides everything.",
  },
  {
    icon: MapPin,
    color: "text-green-400",
    bg: "bg-green-500/20",
    title: "Location Heatmaps",
    desc: "Interactive Leaflet maps show exactly where complaints are clustering. Identify hotspots before they become crises.",
  },
  {
    icon: Clock,
    color: "text-orange-400",
    bg: "bg-orange-500/20",
    title: "Smart Deadlines",
    desc: "Every complaint gets a dynamic deadline based on its AI urgency score. Officers get SMS reminders at 30%, 60%, and auto-reassignment at 80%.",
  },
  {
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    title: "Multi-language Support",
    desc: "Citizens can call in Hindi, Punjabi, Tamil, Telugu, or English. AI translates and normalizes everything into structured English data.",
  },
  {
    icon: TrendingUp,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    title: "Officer Trust Scoring",
    desc: "Officers who miss deadlines or get escalated complaints have their trust score reduced. Top performers are prioritized for assignments.",
  },
  {
    icon: Bell,
    color: "text-pink-400",
    bg: "bg-pink-500/20",
    title: "Escalation Engine",
    desc: "If no action is taken, complaints auto-escalate to admin with full audit trail. Nothing falls through the cracks.",
  },
  {
    icon: ShieldCheck,
    color: "text-teal-400",
    bg: "bg-teal-500/20",
    title: "Spam & Fraud Protection",
    desc: "Caller trust scores and blacklisting prevent spam calls from wasting officer time. Duplicate complaints are clustered automatically.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 overflow-hidden relative selection:bg-cyan-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* NAVBAR */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10 border-b border-white/5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
            CivicCall
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            to="/officer-login"
            className="px-4 py-2 text-sm font-medium text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 rounded-full transition"
          >
            Officer Login
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
          >
            Admin Login
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2.5 text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-full transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <main className="container mx-auto px-6 pt-32 pb-24 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          Live AI Processing Now Active
        </div>

        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-tight">
          Next-Gen{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Civic Intelligence
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Citizens call. AI listens. Officers act. CivicCall transforms voice
          complaints into structured, tracked, and resolved civic actions — in
          any Indian language, in real time.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-24">
          <Link
            to="/signup"
            className="px-8 py-4 text-base font-semibold bg-white hover:bg-gray-100 text-slate-900 rounded-full transition shadow-xl hover:scale-105 duration-300"
          >
            Access Dashboard
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-4 text-base font-semibold bg-slate-800/50 hover:bg-slate-800 border border-white/10 rounded-full transition text-white"
          >
            See How It Works
          </a>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-32">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="text-3xl font-extrabold text-white mb-1">
                {s.value}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="mb-32 text-left max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-3">
              The Process
            </p>
            <h2 className="text-4xl font-extrabold text-white">
              How CivicCall Works
            </h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              From a phone call to a resolved complaint — fully automated, fully
              accountable.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.step}
                className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition group"
              >
                <div className="flex items-start gap-5">
                  <div
                    className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition`}
                  >
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Step {step.step}
                    </p>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mb-32 text-left max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Capabilities
            </p>
            <h2 className="text-4xl font-extrabold text-white">
              Everything Built In
            </h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              No third-party dashboards. No manual workflows. Every feature is
              purpose-built for civic complaint management.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition group cursor-default"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition`}
                >
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* DEPARTMENTS */}
        <section className="mb-32 text-left max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Coverage
            </p>
            <h2 className="text-4xl font-extrabold text-white">
              7 Government Departments
            </h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">
              AI automatically routes every complaint to the correct department
              — no human sorting needed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEPARTMENTS.map((d) => (
              <div
                key={d.name}
                className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition group flex items-start gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${d.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition`}
                >
                  <d.icon className={`w-5 h-5 ${d.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    {d.name}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {d.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-32 max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-cyan-600/5 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-4xl font-extrabold text-white mb-4">
                Ready to modernize your city?
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Join the platform that turns citizen calls into government
                action — automatically, accountably, and in real time.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/signup"
                  className="px-8 py-4 text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-full transition shadow-xl hover:scale-105 duration-300"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/officer-login"
                  className="px-8 py-4 text-base font-semibold bg-slate-800/80 hover:bg-slate-800 border border-white/10 rounded-full transition text-white"
                >
                  Officer Portal
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#080e1a]">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
                <span className="text-lg font-bold text-white">CivicCall</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                AI-powered civic complaint management for India. Built to make
                government accountable, one call at a time.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
                Platform
              </h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link to="/signup" className="hover:text-cyan-400 transition">
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/officer-login"
                    className="hover:text-cyan-400 transition"
                  >
                    Officer Portal
                  </Link>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-cyan-400 transition"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-cyan-400 transition"
                  >
                    Features
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
                Access
              </h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link to="/login" className="hover:text-cyan-400 transition">
                    Admin Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/officer-login"
                    className="hover:text-cyan-400 transition"
                  >
                    Officer Login
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-cyan-400 transition">
                    Create Account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs">
              &copy; {new Date().getFullYear()} CivicCall. Built for a smarter,
              more accountable India.
            </p>
            <p className="text-gray-600 text-xs">
              Powered by Groq · Whisper · Twilio · MongoDB
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
