import { NavLink } from "react-router-dom";

function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0F172A] text-white">


      {/* ===== Sidebar ===== */}
      <div className="w-64 bg-[#0F172A] p-6 space-y-8 border-r border-white/10">

        <div>
          <h1 className="text-2xl font-bold text-cyan-400">
            CivicCall
          </h1>
          <p className="text-xs text-gray-400 tracking-widest">
            OFFICER COMMAND CENTER
          </p>
        </div>

        <nav className="space-y-4 text-sm mt-8">

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10'}`}
          >
            📊 Dashboard
          </NavLink>

          <NavLink
            to="/map"
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10'}`}
          >
            📍 Location Map
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10'}`}
          >
            📋 Reports
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10'}`}
          >
            ⚙ Settings
          </NavLink>

        </nav>

        <div className="mt-10">
          <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
            ● LIVE
          </span>
        </div>

      </div>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 p-8">
        {children}
      </div>

    </div>
  );
}

export default MainLayout;