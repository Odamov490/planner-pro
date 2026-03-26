import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Login(){

  const { loginWithGoogle } = useContext(AuthContext);

  // 🔥 Cursor glow
  useEffect(()=>{
    const move = (e)=>{
      const light = document.getElementById("cursorLight");
      if(light){
        light.style.left = e.clientX - 120 + "px";
        light.style.top = e.clientY - 120 + "px";
      }
    };
    window.addEventListener("mousemove", move);
    return ()=>window.removeEventListener("mousemove", move);
  },[]);

  return (
    <div className="h-screen flex items-center justify-center bg-[#020617] overflow-hidden relative text-white">

      {/* 🔥 Cursor light */}
      <div 
        id="cursorLight"
        className="fixed w-[250px] h-[250px] bg-blue-500/20 blur-[140px] pointer-events-none z-0"
      ></div>

      {/* 🔥 Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617]" />

      {/* 🔥 Floating shapes */}
      <motion.div 
        animate={{ y: [0, -60, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute w-72 h-72 bg-purple-600/20 blur-3xl rounded-full top-[-50px] left-[-50px]"
      />

      <motion.div 
        animate={{ y: [0, 60, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute w-72 h-72 bg-blue-600/20 blur-3xl rounded-full bottom-[-50px] right-[-50px]"
      />

      {/* 🔥 Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, rotateX: 20 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.7 }}
        whileHover={{ rotateY: 6 }}
        className="relative w-[380px] h-[420px] rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-10"
      >

        {/* 🔥 Gradient border glow */}
        <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-70">
          <div className="w-full h-full bg-[#020617] rounded-2xl"></div>
        </div>

        {/* 🔥 Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">

          {/* 🔥 LOGO */}
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent mb-2">
            ⚡ Planner
          </h1>

          <p className="text-gray-400 text-sm mb-8 text-center">
            Smart planning starts here
          </p>

          {/* 🔥 GOOGLE BUTTON */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={loginWithGoogle}
            className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-blue-500/40 transition"
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