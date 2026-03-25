import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Login(){

  const { loginWithGoogle } = useContext(AuthContext);

  return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden relative">

      {/* 🔥 BACKGROUND LIGHT EFFECT */}
      <div className="absolute w-[500px] h-[500px] bg-purple-500 opacity-30 blur-[150px] top-[-100px] left-[-100px] animate-pulse"></div>
      <div className="absolute w-[400px] h-[400px] bg-blue-500 opacity-30 blur-[150px] bottom-[-100px] right-[-100px] animate-pulse"></div>

      {/* 🔥 CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateX: 30 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.6 }}
        whileHover={{ rotateY: 5 }}
        className="relative w-[380px] h-[420px] rounded-xl bg-[#1c1c1c] overflow-hidden shadow-2xl"
      >

        {/* 🔥 ANIMATED BORDER */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin opacity-70"></div>
          <div className="absolute inset-[4px] bg-[#1c1c1c] rounded-xl"></div>
        </div>

        {/* 🔥 CONTENT */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6">

          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-bold mb-4"
          >
            🚀 Planner Pro
          </motion.h1>

          <p className="text-gray-400 text-sm mb-8 text-center">
            Vazifalaringni professional boshqar
          </p>

          {/* 🔥 GOOGLE BUTTON */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={loginWithGoogle}
            className="flex items-center gap-3 bg-white text-black px-5 py-3 rounded-xl shadow-lg hover:shadow-blue-500/50 transition"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
            />
            Google orqali kirish
          </motion.button>

          {/* 🔥 GLOW EFFECT */}
          <div className="absolute w-[200px] h-[200px] bg-blue-500 opacity-20 blur-[100px] bottom-0"></div>

        </div>

      </motion.div>

    </div>
  );
}