import { motion } from "framer-motion";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Login(){

  const { loginWithGoogle } = useContext(AuthContext);

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 relative overflow-hidden">

      {/* 🔥 BACKGROUND SHAPES */}
      <div className="absolute w-96 h-96 bg-purple-400 opacity-30 rounded-full blur-3xl top-10 left-10 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-blue-400 opacity-30 rounded-full blur-3xl bottom-10 right-10 animate-pulse"></div>

      {/* 🔥 CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-10 w-[420px] text-white text-center"
      >

        <h1 className="text-3xl font-bold mb-3">🚀 Planner Pro</h1>
        <p className="text-sm text-gray-200 mb-6">
          Vazifalaringni professional boshqar
        </p>

        {/* GOOGLE BUTTON */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl shadow-lg"
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            className="w-5 h-5"
          />
          Google orqali kirish
        </motion.button>

      </motion.div>

    </div>
  );
}