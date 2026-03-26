import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar(){

  const { user, logout } = useContext(AuthContext);

  const linkClass = ({isActive}) =>
    `px-4 py-3 rounded-xl text-sm font-medium transition duration-300 flex items-center gap-2
    ${isActive 
      ? "bg-blue-500 text-white shadow-md" 
      : "text-gray-700 hover:bg-blue-100 hover:text-blue-600 hover:scale-[1.02]"
    }`;

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-white to-blue-50 shadow-2xl p-6 flex flex-col justify-between fixed left-0 top-0 overflow-y-auto">

      {/* TOP */}
      <div>

        {/* LOGO */}
        <h1 className="text-3xl font-extrabold mb-8 text-blue-600 tracking-wide">
          📘 Reja
        </h1>

        {/* 📊 ASOSIY */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">ASOSIY</p>

          <nav className="flex flex-col gap-2">
            <NavLink to="/" className={linkClass}>📊 Dashboard</NavLink>
            <NavLink to="/tasks" className={linkClass}>📝 Vazifalar</NavLink>
            <NavLink to="/calendar" className={linkClass}>📅 Kalendar</NavLink>
          </nav>
        </div>

        {/* 👥 JAMOA */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">JAMOA</p>

          <nav className="flex flex-col gap-2">
            <NavLink to="/team" className={linkClass}>👥 Jamoa</NavLink>
            <NavLink to="/company" className={linkClass}>🏢 Kompaniya</NavLink>
            <NavLink to="/invites" className={linkClass}>📨 Takliflar</NavLink>
          </nav>
        </div>

        {/* 📥 TOPSHIRIQLAR */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">TOPSHIRIQLAR</p>

          <nav className="flex flex-col gap-2">
            <NavLink to="/incoming" className={linkClass}>📥 Menga berilgan</NavLink>
            <NavLink to="/outgoing" className={linkClass}>📤 Men bergan</NavLink>
          </nav>
        </div>

        {/* 🧠 SHAXSIY */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">SHAXSIY</p>

          <nav className="flex flex-col gap-2">
            <NavLink to="/journal" className={linkClass}>📝 Kundalik</NavLink>
            <NavLink to="/notifications" className={linkClass}>🔔 Bildirishnomalar</NavLink>
          </nav>
        </div>

        {/* ⚙️ TIZIM */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">TIZIM</p>

          <nav className="flex flex-col gap-2">
            <NavLink to="/activity" className={linkClass}>🧭 Faoliyat log</NavLink>
            <NavLink to="/settings" className={linkClass}>⚙️ Sozlamalar</NavLink>
          </nav>
        </div>

      </div>

      {/* 🔥 USER PANEL */}
      <div className="border-t pt-4 text-center">

        {/* AVATAR */}
        <img
          src={user?.photoURL || "https://i.pravatar.cc/100"}
          className="w-12 h-12 rounded-full mx-auto mb-2 border"
        />

        {/* NAME */}
        <p className="text-sm font-semibold text-gray-700">
          {user?.displayName || "User"}
        </p>

        {/* EMAIL */}
        <p className="text-xs text-gray-400 mb-2 break-all">
          {user?.email}
        </p>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="text-red-500 text-sm hover:underline"
        >
          Logout
        </button>

        <div className="text-xs text-gray-300 mt-3">
          © 2026 Planner
        </div>

      </div>

    </div>
  );
}