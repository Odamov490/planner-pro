import { useContext, useState } from "react";
import { TeamContext } from "../context/TeamContext";
import { motion } from "framer-motion";

export default function Teams(){

  const { teams, createTeam } = useContext(TeamContext);
  const [name, setName] = useState("");

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* 🔥 HEADER */}
      <h1 className="text-3xl font-bold text-blue-600">
        👥 Jamoalar
      </h1>

      {/* 🔥 CREATE TEAM */}
      <div className="bg-white p-4 rounded-2xl shadow flex gap-3">

        <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
          placeholder="Jamoa nomini kiriting..."
          className="flex-1 border p-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
        />

        <button
          onClick={()=>{
            if(!name.trim()) return;
            createTeam(name);
            setName("");
          }}
          className="bg-blue-600 text-white px-5 rounded-xl hover:bg-blue-700 transition"
        >
          ➕ Yaratish
        </button>

      </div>

      {/* 🔥 EMPTY */}
      {teams.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          Siz hali jamoa yaratmagansiz
        </div>
      )}

      {/* 🔥 TEAM LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {teams.map(team => (
          <motion.div
            key={team.id}
            whileHover={{ scale: 1.03 }}
            className="bg-white p-5 rounded-2xl shadow border space-y-2"
          >

            <p className="text-lg font-semibold">
              {team.name}
            </p>

            <p className="text-sm text-gray-400">
              👥 A’zolar: {team.members?.length || 0}
            </p>

            <p className="text-xs text-gray-300">
              🕒 {team.created?.seconds 
                ? new Date(team.created.seconds * 1000).toLocaleString()
                : ""}
            </p>

          </motion.div>
        ))}

      </div>

    </div>
  );
}