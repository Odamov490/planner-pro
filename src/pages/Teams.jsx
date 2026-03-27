import { useContext, useState } from "react";
import { TeamContext } from "../context/TeamContext";
import { motion } from "framer-motion";

export default function Teams(){

  const { teams, createTeam } = useContext(TeamContext);
  const [name, setName] = useState("");

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <h1 className="text-3xl font-bold text-blue-600">
        👥 Jamoalar
      </h1>

      {/* CREATE */}
      <div className="bg-white p-4 rounded-2xl shadow flex gap-3">

        <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
          placeholder="Jamoa nomi..."
          className="flex-1 border p-3 rounded-xl"
        />

        <button
          onClick={()=>{
            if(!name.trim()) return;
            createTeam(name);
            setName("");
          }}
          className="bg-blue-600 text-white px-4 rounded-xl"
        >
          Yaratish
        </button>

      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {teams.map(team=>(
          <motion.div
            key={team.id}
            whileHover={{ scale: 1.03 }}
            className="bg-white p-4 rounded-2xl shadow"
          >
            <p className="font-semibold">{team.name}</p>
            <p className="text-sm text-gray-400">
              👥 {team.members.length} ta a’zo
            </p>
          </motion.div>
        ))}

      </div>

    </div>
  );
}