import { useContext, useState } from "react";
import { TeamContext } from "../context/TeamContext";
import { motion } from "framer-motion";

export default function Teams(){

  const {
    teams,
    createTeam,
    renameTeam,
    deleteTeam,
    addMemberByEmail
  } = useContext(TeamContext);

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-blue-600">
        👥 Jamoalar
      </h1>

      {/* SEARCH */}
      <input
        placeholder="🔍 Qidirish..."
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        className="w-full p-3 border rounded-xl"
      />

      {/* CREATE */}
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
          placeholder="Yangi jamoa..."
          className="border p-3 rounded-xl w-full"
        />
        <button
          onClick={()=>{
            createTeam(name);
            setName("");
          }}
          className="bg-blue-600 text-white px-5 rounded-xl hover:scale-105 transition"
        >
          + Yaratish
        </button>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {filtered.map(team => (

          <motion.div
            key={team.id}
            whileHover={{ scale: 1.03 }}
            className="bg-white p-5 rounded-2xl shadow space-y-3 border"
          >

            {/* NAME */}
            <div className="flex justify-between items-center">

              <p className="font-semibold text-lg">
                {team.name}
              </p>

              <button
                onClick={()=>deleteTeam(team.id)}
                className="text-red-500 text-sm"
              >
                O‘chirish
              </button>

            </div>

            {/* MEMBERS */}
            <p className="text-sm text-gray-400">
              👥 {team.members.length} ta a’zo
            </p>

            {/* ADD USER */}
            <div className="flex gap-2">

              <input
                placeholder="Email..."
                onChange={(e)=>team.tempEmail = e.target.value}
                className="border p-2 rounded w-full text-sm"
              />

              <button
                onClick={()=>addMemberByEmail(team.id, team.tempEmail)}
                className="bg-green-500 text-white px-3 rounded"
              >
                Qo‘sh
              </button>

            </div>

            {/* RENAME */}
            <button
              onClick={()=>{
                const newName = prompt("Yangi nom:");
                if(newName) renameTeam(team.id, newName);
              }}
              className="text-blue-500 text-sm"
            >
              ✏️ Nomni o‘zgartirish
            </button>

          </motion.div>

        ))}

      </div>

    </div>
  );
}