import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/" },
    { name: "Vazifalar", path: "/tasks" },
    { name: "Kalendar", path: "/calendar" },
  ];

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-white to-blue-50 shadow-2xl p-6 flex flex-col justify-between">

      {/* Logo */}
      <div>
        <h1 className="text-3xl font-extrabold mb-10 text-blue-600 tracking-wide">
          📘 Reja
        </h1>

        {/* Menu */}
        <nav className="flex flex-col gap-3">
          {menu.map((item, index) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={index}
                to={item.path}
                className={`px-4 py-3 rounded-xl font-medium transition duration-300 
                ${
                  active
                    ? "bg-blue-500 text-white shadow-lg scale-105"
                    : "text-gray-700 hover:bg-blue-100 hover:text-blue-600 hover:scale-105"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="text-sm text-gray-400 mt-10">
        © 2026 Planner
      </div>
    </div>
  );
}