import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Login(){

  const { loginWithGoogle } = useContext(AuthContext);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 via-indigo-200 to-purple-200">

      <div className="bg-white/80 backdrop-blur-lg p-10 rounded-3xl shadow-2xl w-96 text-center space-y-6">

        {/* LOGO */}
        <div className="text-4xl">📘</div>

        {/* TITLE */}
        <h1 className="text-3xl font-extrabold text-gray-800">
          Planner Pro
        </h1>

        <p className="text-gray-500 text-sm">
          Vazifalaringni boshqarishni boshlang
        </p>

        {/* GOOGLE BUTTON */}
        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-3 rounded-xl shadow hover:shadow-lg hover:scale-105 transition"
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            className="w-5 h-5"
          />
          <span className="font-medium text-gray-700">
            Google orqali kirish
          </span>
        </button>

        {/* FOOTER */}
        <p className="text-xs text-gray-400 mt-4">
          🔐 Xavfsiz kirish Google orqali
        </p>

      </div>

    </div>
  );
}