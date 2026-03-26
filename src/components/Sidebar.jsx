import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar(){

  const { user, logout } = useContext(AuthContext);

  const linkClass = ({isActive}) =>
    `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group
    ${isActive
      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
      : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
    }`;

  return (
    <div className="w-64 h-screen backdrop-blur-xl bg-white/80 border-r shadow-xl p-5 flex flex-col justify-between fixed left-0 top-0">

      {/* TOP */}
      <div>

        {/* LOGO */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            ⚡ Planner
          </h1>
        </div>

        {/* MENU */}
        <div className="space-y-6">

          {/* ASOSIY */}
          <div>
            <p className="text-xs text-gray-400 mb-2">ASOSIY</p>
            <div className="space-y-2">
              <NavLink to="/" className={linkClass}>
                <span>📊 Dashboard</span>
              </NavLink>

              <NavLink to="/tasks" className={linkClass}>
                <span>📝 Vazifalar</span>
              </NavLink>

              <NavLink to="/calendar" className={linkClass}>
                <span>📅 Kalendar</span>
              </NavLink>
            </div>
          </div>

          {/* JAMOA */}
          <div>
            <p className="text-xs text-gray-400 mb-2">JAMOA</p>
            <div className="space-y-2">
              <NavLink to="/team" className={linkClass}>
                <span>👥 Jamoa</span>
              </NavLink>

              <NavLink to="/company" className={linkClass}>
                <span>🏢 Kompaniya</span>
              </NavLink>

              <NavLink to="/invites" className={linkClass}>
                <span>📨 Takliflar</span>
              </NavLink>
            </div>
          </div>

          {/* TASK FLOW */}
          <div>
            <p className="text-xs text-gray-400 mb-2">TOPSHIRIQLAR</p>
            <div className="space-y-2">
              <NavLink to="/incoming" className={linkClass}>
                <span>📥 Menga berilgan</span>
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">3</span>
              </NavLink>

              <NavLink to="/outgoing" className={linkClass}>
                <span>📤 Men bergan</span>
              </NavLink>
            </div>
          </div>

          {/* PERSONAL */}
          <div>
            <p className="text-xs text-gray-400 mb-2">SHAXSIY</p>
            <div className="space-y-2">
              <NavLink to="/journal" className={linkClass}>
                <span>📝 Kundalik</span>
              </NavLink>

              <NavLink to="/notifications" className={linkClass}>
                <span>🔔 Bildirishnomalar</span>
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  2
                </span>
              </NavLink>
            </div>
          </div>

          {/* SYSTEM */}
          <div>
            <p className="text-xs text-gray-400 mb-2">TIZIM</p>
            <div className="space-y-2">
              <NavLink to="/activity" className={linkClass}>
                <span>🧭 Faoliyat log</span>
              </NavLink>

              <NavLink to="/settings" className={linkClass}>
                <span>⚙️ Sozlamalar</span>
              </NavLink>
            </div>
          </div>

        </div>

      </div>

      {/* USER PANEL */}
      <div className="mt-6 pt-4 border-t">

        <div className="flex items-center gap-3">

          <img
            src={user?.photoURL || "https://i.pravatar.cc/100"}
            className="w-10 h-10 rounded-full border"
          />

          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700">
              {user?.displayName || "User"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email}
            </p>
          </div>

        </div>

        <button
          onClick={logout}
          className="mt-3 w-full text-sm text-red-500 hover:bg-red-50 py-2 rounded-lg transition"
        >
          Logout
        </button>

        <p className="text-center text-xs text-gray-300 mt-2">
          © 2026 Planner
        </p>

      </div>

    </div>
  );
}