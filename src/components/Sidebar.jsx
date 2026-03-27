import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { TaskContext } from "../context/TaskContext";
import { NotificationContext } from "../context/NotificationContext"; // 🔥 QO‘SHILDI

export default function Sidebar(){

  const { user, logout } = useContext(AuthContext);
  const { tasks } = useContext(TaskContext);
  const { notifications } = useContext(NotificationContext); // 🔥 QO‘SHILDI

  // 🔥 INCOMING COUNT
  const incomingCount = tasks.filter(
    t => t.assignedTo === user?.uid && !t.completed
  ).length;

  // 🔥 NOTIFICATION COUNT
  const unreadCount = notifications.filter(n => !n.read).length;

  const linkClass = ({isActive}) =>
    `relative flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group

    ${isActive
      ? "bg-blue-50 text-blue-600"
      : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
    }

    before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2
    before:w-1 before:h-6 before:rounded-full
    ${isActive ? "before:bg-blue-500" : "before:bg-transparent"}
  `;

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-white via-blue-50 to-indigo-50 border-r shadow-lg p-4 flex flex-col justify-between fixed left-0 top-0 overflow-y-auto">

      <div>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ⚡ Planner
          </h1>
        </div>

        <div className="space-y-4">

          {/* ASOSIY */}
          <div>
            <p className="text-xs text-gray-400 mb-1 px-1">ASOSIY</p>
            <div className="flex flex-col gap-1">

              <NavLink to="/" className={linkClass}>
                <span className="flex items-center gap-2 group-hover:translate-x-1 transition">
                  📊 Dashboard
                </span>
              </NavLink>

              <NavLink to="/tasks" className={linkClass}>
                <span className="flex items-center gap-2 group-hover:translate-x-1 transition">
                  📝 Vazifalar
                </span>
              </NavLink>

              <NavLink to="/calendar" className={linkClass}>
                <span className="flex items-center gap-2 group-hover:translate-x-1 transition">
                  📅 Kalendar
                </span>
              </NavLink>

            </div>
          </div>

          {/* JAMOA */}
          <div>
            <p className="text-xs text-gray-400 mb-1 px-1">JAMOA</p>
            <div className="flex flex-col gap-1">

              <NavLink to="/team" className={linkClass}>
                <span className="flex items-center gap-2 group-hover:translate-x-1 transition">
                  👥 Jamoa
                </span>
              </NavLink>

              <NavLink to="/teams" className={linkClass}>
                <span className="flex items-center gap-2 group-hover:translate-x-1 transition">
                  👥 Jamoalar
                </span>
              </NavLink>

              <NavLink to="/company" className={linkClass}>
                <span className="flex items-center gap-2 group-hover:translate-x-1 transition">
                  🏢 Kompaniya
                </span>
              </NavLink>

              <NavLink to="/invites" className={linkClass}>
                <span className="flex items-center gap-2 group-hover:translate-x-1 transition">
                  📨 Takliflar
                </span>
              </NavLink>

            </div>
          </div>

          {/* TOPSHIRIQLAR */}
          <div>
            <p className="text-xs text-gray-400 mb-1 px-1">TOPSHIRIQLAR</p>
            <div className="flex flex-col gap-1">

              <NavLink to="/incoming" className={linkClass}>
                <span className="flex items-center gap-2">
                  📥 Menga berilgan
                </span>

                {incomingCount > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse shadow">
                    {incomingCount > 9 ? "9+" : incomingCount}
                  </span>
                )}
              </NavLink>

              <NavLink to="/outgoing" className={linkClass}>
                <span className="flex items-center gap-2">
                  📤 Men bergan
                </span>
              </NavLink>

            </div>
          </div>

          {/* SHAXSIY */}
          <div>
            <p className="text-xs text-gray-400 mb-1 px-1">SHAXSIY</p>
            <div className="flex flex-col gap-1">

              <NavLink to="/journal" className={linkClass}>
                <span className="flex items-center gap-2">
                  📝 Kundalik
                </span>
              </NavLink>

              {/* 🔥 NOTIFICATION REAL */}
              <NavLink to="/notifications" className={linkClass}>
                <span className="flex items-center gap-2">
                  🔔 Bildirishnomalar
                </span>

                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse shadow">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </NavLink>

            </div>
          </div>

          {/* TIZIM */}
          <div>
            <p className="text-xs text-gray-400 mb-1 px-1">TIZIM</p>
            <div className="flex flex-col gap-1">

              <NavLink to="/activity" className={linkClass}>
                <span className="flex items-center gap-2">
                  🧭 Faoliyat log
                </span>
              </NavLink>

              <NavLink to="/settings" className={linkClass}>
                <span className="flex items-center gap-2">
                  ⚙️ Sozlamalar
                </span>
              </NavLink>

            </div>
          </div>

        </div>

      </div>

      {/* USER PANEL */}
      <div className="pt-4 border-t">

        <div className="flex items-center gap-3">

          <img
            src={user?.photoURL || "https://i.pravatar.cc/100"}
            className="w-10 h-10 rounded-full border shadow-sm"
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