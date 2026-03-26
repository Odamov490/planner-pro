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
        light.style.left = e.clientX - 150 + "px";
        light.style.top = e.clientY - 150 + "px";
      }
    };
    window.addEventListener("mousemove", move);
    return ()=>window.removeEventListener("mousemove", move);
  },[]);

  return (
    <div className="h-screen flex items-center justify-center bg-black overflow-hidden relative text-white">

      {/* 🔥 CURSOR LIGHT */}
      <div 
        id="cursorLight"
        className="fixed w-[300px] h-[300px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-[160px] pointer-events-none z-0"
      />

      {/* 🔥 BACKGROUND GRID */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* 🔥 FLOATING BLOBS */}
      <motion.div 
        animate={{ y: [0, -80, 0], x:[0,40,0] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute w-[400px] h-[400px] bg-blue-500/20 blur-[140px] rounded-full top-[-100px] left-[-100px]"
      />

      <motion.div 
        animate={{ y: [0, 80, 0], x:[0,-40,0] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute w-[400px] h-[400px] bg-purple-500/20 blur-[140px] rounded-full bottom-[-100px] right-[-100px]"
      />

      {/* 🔥 MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateX: 30 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.7 }}
        whileHover={{ rotateY: 8, scale:1.03 }}
        className="relative w-[400px] h-[450px] rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] z-10 overflow-hidden"
      >

        {/* 🔥 ANIMATED BORDER */}
        <div className="absolute inset-0 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-70 animate-[spin_6s_linear_infinite]" />
          <div className="absolute inset-[2px] bg-black rounded-2xl" />
        </div>

        {/* 🔥 SHIMMER EFFECT */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shine_3s_infinite]" />

        {/* 🔥 CONTENT */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">

          {/* 🔥 LOGO */}
          <motion.h1 
            animate={{ opacity:[0.6,1,0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent mb-2"
          >
            ⚡ Planner
          </motion.h1>

          <p className="text-gray-400 text-sm mb-8 text-center">
            Smart planning starts here
          </p>

          {/* 🔥 GOOGLE BUTTON */}
          <motion.button
            whileHover={{ scale: 1.12, boxShadow:"0 0 30px rgba(59,130,246,0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={loginWithGoogle}
            className="relative flex items-center gap-3 px-6 py-3 rounded-xl font-medium text-white overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-90" />
            <div className="absolute inset-0 blur-md opacity-50 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

            <span className="relative flex items-center gap-3">
              <img 
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5 bg-white rounded-full p-[2px]"
              />
              Google orqali kirish
            </span>
          </motion.button>

          {/* 🔥 FOOTER */}
          <p className="text-xs text-gray-500 mt-6 text-center">
            🔐 Xavfsiz kirish Google orqali
          </p>

        </div>

      </motion.div>

      {/* 🔥 CUSTOM KEYFRAMES */}
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

    </div>
  );
}