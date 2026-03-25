import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Login(){

  const { loginWithGoogle } = useContext(AuthContext);

  // 🔥 Cursor light effect
  useEffect(()=>{
    const move = (e)=>{
      const light = document.getElementById("cursorLight");
      if(light){
        light.style.left = e.clientX - 100 + "px";
        light.style.top = e.clientY - 100 + "px";
      }
    };
    window.addEventListener("mousemove", move);
    return ()=>window.removeEventListener("mousemove", move);
  },[]);

  return (
    <div className="h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden relative">

      {/* 🔥 Cursor glow */}
      <div 
        id="cursorLight"
        className="fixed w-[200px] h-[200px] bg-blue-500 opacity-20 blur-[120px] pointer-events-none z-0"
      ></div>

      {/* 🔥 Floating shapes */}
      <motion.div 
        animate={{ y: [0, -40, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute w-40 h-40 bg-purple-500 opacity-30 blur-3xl rounded-full top-10 left-10"
      />

      <motion.div 
        animate={{ y: [0, 50, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute w-40 h-40 bg-blue-500 opacity-30 blur-3xl rounded-full bottom-10 right-10"
      />

      {/* 🔥 Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.6 }}
        whileHover={{ rotateY: 6 }}
        className="relative w-[380px] h-[420px] rounded-xl bg-[#1c1c1c] overflow-hidden shadow-2xl z-10"
      >

        {/* 🔥 Animated border */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin opacity-70"></div>
          <div className="absolute inset-[4px] bg-[#1c1c1c] rounded-xl"></div>
        </div>

        {/* 🔥 Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6">

          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-bold mb-4"
          >
            🚀 Planner Pro
          </motion.h1>

          <p className="text-gray-400 text-sm mb-8 text-center">
            Smart planning starts here
          </p>

          {/* 🔥 GOOGLE LOGIN BUTTON */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={loginWithGoogle}
            className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-xl shadow-lg hover:shadow-blue-500/50 transition"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
            />
            Google orqali kirish
          </motion.button>

          {/* 🔥 Footer */}
          <p className="text-xs text-gray-500 mt-6 text-center">
            🔐 Xavfsiz kirish Google orqali
          </p>

        </div>

      </motion.div>

    </div>
  );
}