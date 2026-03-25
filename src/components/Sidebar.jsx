import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar(){

  const { user, logout } = useContext(AuthContext);

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-white to-blue-50 shadow-2xl p-6 flex flex-col justify-between fixed left-0 top-0">

      <div>
        <h1 className="text-3xl font-extrabold mb-10 text-blue-600 tracking-wide">
          📘 Reja
        </h1>

        <nav className="flex flex-col gap-3">
          <Link 
            to="/" 
            className="px-4 py-3 rounded-xl text-gray-700 font-medium 
            hover:bg-blue-100 hover:text-blue-600 
            hover:scale-105 transition duration-300 shadow-sm hover:shadow-md"
          >
            Dashboard
          </Link>

          <Link 
            to="/tasks" 
            className="px-4 py-3 rounded-xl text-gray-700 font-medium 
            hover:bg-blue-100 hover:text-blue-600 
            hover:scale-105 transition duration-300 shadow-sm hover:shadow-md"
          >
            Vazifalar
          </Link>

          <Link 
            to="/calendar" 
            className="px-4 py-3 rounded-xl text-gray-700 font-medium 
            hover:bg-blue-100 hover:text-blue-600 
            hover:scale-105 transition duration-300 shadow-sm hover:shadow-md"
          >
            Kalendar
          </Link>
        </nav>
      </div>

      {/* 🔥 USER PANEL */}
      <div className="border-t pt-4 text-center">

        {/* AVATAR */}
        <img
          src={user?.photoURL || "https://i.pravatar.cc/100"}
          className="w-12 h-12 rounded-full mx-auto mb-2"
        />

        {/* NAME */}
        <p className="text-sm font-semibold text-gray-700">
          {user?.displayName || "User"}
        </p>

        {/* EMAIL */}
        <p className="text-xs text-gray-400 mb-2">
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