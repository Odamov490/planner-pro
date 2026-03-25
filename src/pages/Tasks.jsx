import { useState, useContext, useEffect } from "react";
import { TaskContext } from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import { notify } from "../utils/notify";
import { getSuggestion } from "../utils/ai";

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Tasks(){

 const [input,setInput]=useState("");
 const [suggestion,setSuggestion]=useState("");

 const [date,setDate]=useState("");
 const [priority,setPriority]=useState("");
 const [category,setCategory]=useState("");

 const [search,setSearch]=useState("");
 const [filter,setFilter]=useState("all");

 const [users,setUsers]=useState([]);
 const [emailInput,setEmailInput]=useState("");
 const [selectedUser,setSelectedUser]=useState(null);
 const [showUsers,setShowUsers]=useState(false);

 const {
   tasks,
   addTask,
   toggleTask,
   deleteTask,
   editTask
 } = useContext(TaskContext);

 // 🔥 USERS FETCH
 useEffect(()=>{
  const unsub = onSnapshot(collection(db,"users"),(snap)=>{
    setUsers(snap.docs.map(d=>d.data()));
  });
  return ()=>unsub();
 },[]);

 const filteredUsers = users.filter(u =>
  u.email?.toLowerCase().includes(emailInput.toLowerCase())
 );

 // 🤖 AI
 useEffect(() => {

  if(input.length < 3){
    setSuggestion("");
    return;
  }

  const t = setTimeout(async()=>{
    const res = await getSuggestion(input);
    setSuggestion(res);
  },400);

  return ()=>clearTimeout(t);

 }, [input]);

 // ➕ ADD (🔥 FIX QILINDI)
 const handleAdd = async () => {

  if(!input.trim()) return notify("Vazifa yozing ❗");

  const lines = input
    .split("\n")
    .map(l => l.trim())
    .filter(l => l);

  await Promise.all(
    lines.map(line => addTask(
      line,
      date,
      priority,
      category,
      selectedUser?.uid,
      selectedUser?.email // 🔥 ENG MUHIM FIX
    ))
  );

  notify(`${lines.length} ta vazifa qo‘shildi 🚀`);

  setInput("");
  setSuggestion("");
  setSelectedUser(null);
  setEmailInput("");
 };

 // ⌨️
 const handleKeyDown = (e) => {

  if(e.key==="Enter" && !e.shiftKey){
    e.preventDefault();
    handleAdd();
  }

  if(e.key==="Tab" && suggestion){
    e.preventDefault();
    setInput(suggestion);
    setSuggestion("");
  }
 };

 // 🔍 FILTER
 const filteredTasks = tasks
  .filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
  .filter(t => {
    if(filter==="done") return t.completed;
    if(filter==="active") return !t.completed;
    return true;
  });

 // 📅 GROUP
 const groupedTasks = {};
 filteredTasks.forEach(t=>{
  const d = t.date || "Sanasiz";
  if(!groupedTasks[d]) groupedTasks[d]=[];
  groupedTasks[d].push(t);
 });

 const sortedDates = Object.keys(groupedTasks).sort();

    const done = tasks.filter(t => t.completed).length;
    const percent = tasks.length ? (done / tasks.length) * 100 : 0;

   return (
   <div className="max-w-4xl mx-auto space-y-6">

   <h1 className="text-3xl font-extrabold text-blue-600">
     Vazifalar
   </h1>

   {/* 🔥 SMART CONTROL PANEL */}
<div className="bg-white p-6 rounded-2xl shadow border space-y-6">

  {/* HEADER */}
  <div className="flex justify-between items-center border-b pb-3">
    <h2 className="text-lg font-bold text-gray-700">
      ⚙️ Boshqaruv paneli
    </h2>

    {/* FILTER */}
    <select 
      value={filter}
      onChange={(e)=>setFilter(e.target.value)} 
      className="px-3 py-2 border rounded-lg text-sm bg-gray-50 hover:bg-white transition"
    >
      <option value="all">Hammasi</option>
      <option value="done">Bajarilgan</option>
      <option value="active">Faol</option>
    </select>
  </div>

  {/* 👤 ASSIGN + DATE */}
  <div className="grid md:grid-cols-2 gap-4">

    {/* ASSIGN */}
    <div>
      <p className="text-sm text-gray-500 mb-1">
        👤 Kimga topshiriq berasiz
      </p>

      <div className="flex gap-2">
        <input
          value={emailInput}
          onChange={(e)=>{
            setEmailInput(e.target.value);
            setSelectedUser(null);
          }}
          placeholder="Email yozing..."
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        />

        <button
          onClick={()=>setShowUsers(prev=>!prev)}
          className="px-4 bg-black text-white rounded-lg hover:opacity-80 transition"
        >
          Tanlash
        </button>
      </div>

      {/* AUTOCOMPLETE */}
      {emailInput && (
        <div className="bg-white border mt-2 rounded-lg max-h-40 overflow-y-auto shadow">
          {filteredUsers.map(u=>(
            <div
              key={u.uid}
              onClick={()=>{
                setSelectedUser(u);
                setEmailInput(u.email);
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {u.email}
            </div>
          ))}
        </div>
      )}

      {/* FULL LIST */}
      {showUsers && (
        <div className="bg-white border mt-2 rounded-lg max-h-40 overflow-y-auto shadow">
          {users.map(u=>(
            <div
              key={u.uid}
              onClick={()=>{
                setSelectedUser(u);
                setEmailInput(u.email);
                setShowUsers(false);
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {u.email}
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="text-xs text-green-600 mt-1 font-medium">
          ✅ Tanlandi: {selectedUser.email}
        </div>
      )}
    </div>

    {/* DATE */}
    <div>
      <p className="text-sm text-gray-500 mb-1">
        📅 Vazifa sanasi
      </p>

      <input
        type="date"
        value={date}
        onChange={(e)=>setDate(e.target.value)}
        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
      />
    </div>

  </div>

  {/* 🔍 SEARCH */}
  <div>
    <p className="text-sm text-gray-500 mb-1">
      🔍 Qidiruv
    </p>

    <input
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
      placeholder="Vazifa nomini yozing..."
      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
    />
  </div>

  {/* 📊 PROGRESSsss */}
  <div>
    <div className="flex justify-between text-xs text-gray-500 mb-1">
      <span>Bajarilish</span>
      <span>{done}/{tasks.length}</span>
    </div>

    <div className="w-full bg-gray-200 h-2 rounded-full">
      <div 
        className="bg-black h-2 rounded-full transition-all"
        style={{width: percent+"%"}}
      />
    </div>


  {/* ⚡ PRIORITY */}
  <div className="space-y-2 border-b pb-3">
    <p className="text-sm font-medium text-gray-600">
      ⚡ Muhimlik darajasini tanlang
    </p>

    <div className="grid grid-cols-3 gap-2">

      <button
        onClick={()=>setPriority("high")}
        className={`p-3 border text-sm transition
          ${priority==="high"
            ? "border-black bg-gray-100 font-semibold"
            : "hover:bg-gray-50"}
        `}
      >
        🔴 Yuqori
        <p className="text-xs text-gray-400">Shoshilinch vazifa</p>
      </button>

      <button
        onClick={()=>setPriority("medium")}
        className={`p-3 border text-sm transition
          ${priority==="medium"
            ? "border-black bg-gray-100 font-semibold"
            : "hover:bg-gray-50"}
        `}
      >
        🟡 O‘rta
        <p className="text-xs text-gray-400">Oddiy vazifa</p>
      </button>

      <button
        onClick={()=>setPriority("low")}
        className={`p-3 border text-sm transition
          ${priority==="low"
            ? "border-black bg-gray-100 font-semibold"
            : "hover:bg-gray-50"}
        `}
      >
        🟢 Past
        <p className="text-xs text-gray-400">Keyin qilish mumkin</p>
      </button>

    </div>
  </div>

  {/* 📂 CATEGORY */}
  <div className="space-y-2">
    <p className="text-sm font-medium text-gray-600">
      📂 Vazifa turi
    </p>

    <div className="grid grid-cols-3 gap-2">

      <button
        onClick={()=>setCategory("Ish")}
        className={`p-3 border text-sm transition
          ${category==="Ish"
            ? "border-black bg-gray-100 font-semibold"
            : "hover:bg-gray-50"}
        `}
      >
        💼 Ish
        <p className="text-xs text-gray-400">Ishga oid</p>
      </button>

      <button
        onClick={()=>setCategory("O‘qish")}
        className={`p-3 border text-sm transition
          ${category==="O‘qish"
            ? "border-black bg-gray-100 font-semibold"
            : "hover:bg-gray-50"}
        `}
      >
        📚 O‘qish
        <p className="text-xs text-gray-400">Ta’lim / dars</p>
      </button>

      <button
        onClick={()=>setCategory("Shaxsiy")}
        className={`p-3 border text-sm transition
          ${category==="Shaxsiy"
            ? "border-black bg-gray-100 font-semibold"
            : "hover:bg-gray-50"}
        `}
      >
        🏠 Shaxsiy
        <p className="text-xs text-gray-400">Kundalik ishlar</p>
      </button>

    </div>
  </div>

</div>

     {date && priority && category && (
       <>
         <textarea
           value={input}
           onChange={(e)=>setInput(e.target.value)}
           onKeyDown={handleKeyDown}
           className="w-full p-3 border rounded-xl"
           placeholder="✍️ Vazifa yozing..."
         />

         {suggestion && (
           <div className="text-gray-400 text-sm">
             🤖 {suggestion}
           </div>
         )}

         <button
           onClick={handleAdd}
           className="w-full bg-blue-500 text-white py-3 rounded-xl"
         >
           ➕ Qo‘shish
         </button>
       </>
     )}

   </div>

   {/* TASKS */}
   {sortedDates.map(date=>(
     <div key={date} className="bg-white p-4 rounded-2xl shadow">

       <h2 className="font-bold text-blue-600 mb-2">
         📅 {date}
       </h2>

       <div className="space-y-2">
         {groupedTasks[date].map(t=>(
           <TaskCard
             key={t.id}
             task={t}
             onToggle={toggleTask}
             onDelete={deleteTask}
             onEdit={editTask}
           />
         ))}
       </div>

     </div>
   ))}

  </div>
 )
}