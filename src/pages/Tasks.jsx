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

 // 🔥 USERS
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

 // ➕ ADD
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
      selectedUser?.email
    ))
  );

  notify(`${lines.length} ta vazifa qo‘shildi 🚀`);

  setInput("");
  setSuggestion("");
  setSelectedUser(null);
  setEmailInput("");
 };

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

   {/* 🔥 CONTROL CENTER */}
   <div className="bg-white p-6 rounded-2xl shadow border space-y-5">

     <div className="flex justify-between items-center border-b pb-3">
       <h2 className="font-bold text-gray-700 text-lg">
         ⚙️ Boshqaruv paneli
       </h2>
       <span className="text-xs text-gray-400">Smart</span>
     </div>

     {/* 👤 ASSIGN */}
     <div>
       <p className="text-sm text-gray-600 mb-1">
         Kimga topshiriq berasiz
       </p>

       <div className="flex gap-2">
         <input
           value={emailInput}
           onChange={(e)=>{
             setEmailInput(e.target.value);
             setSelectedUser(null);
           }}
           placeholder="Email yozing..."
           className="w-full px-4 py-3 border rounded-lg"
         />

         <button
           onClick={()=>setShowUsers(prev=>!prev)}
           className="px-4 bg-black text-white rounded-lg"
         >
           Tanlash
         </button>
       </div>

       {emailInput && (
         <div className="border mt-2 rounded-lg max-h-40 overflow-y-auto">
           {filteredUsers.map(u=>(
             <div
               key={u.uid}
               onClick={()=>{
                 setSelectedUser(u);
                 setEmailInput(u.email);
               }}
               className="p-2 hover:bg-gray-100 cursor-pointer"
             >
               {u.email}
             </div>
           ))}
         </div>
       )}

       {showUsers && (
         <div className="border mt-2 rounded-lg max-h-40 overflow-y-auto">
           {users.map(u=>(
             <div
               key={u.uid}
               onClick={()=>{
                 setSelectedUser(u);
                 setEmailInput(u.email);
                 setShowUsers(false);
               }}
               className="p-2 hover:bg-gray-100 cursor-pointer"
             >
               {u.email}
             </div>
           ))}
         </div>
       )}

       {selectedUser && (
         <p className="text-green-600 text-sm mt-1">
           Tanlandi: {selectedUser.email}
         </p>
       )}
     </div>

     {/* 🔍 SEARCH */}
     <input
       value={search}
       onChange={(e)=>setSearch(e.target.value)}
       placeholder="🔍 Vazifa qidirish..."
       className="w-full px-4 py-3 border rounded-lg"
     />

     {/* 📊 PROGRESS */}
     <div>
       <div className="w-full bg-gray-200 h-2 rounded-full">
         <div 
           className="bg-black h-2 rounded-full"
           style={{width: percent+"%"}}
         />
       </div>
       <p className="text-xs mt-1">{done}/{tasks.length}</p>
     </div>

     {/* FILTER */}
     <div className="flex gap-2">
       <button onClick={()=>setFilter("all")} className="px-3 py-2 border rounded">Hammasi</button>
       <button onClick={()=>setFilter("done")} className="px-3 py-2 border rounded">Bajarilgan</button>
       <button onClick={()=>setFilter("active")} className="px-3 py-2 border rounded">Faol</button>
     </div>

   </div>

   {/* ADD PANEL */}
   <div className="bg-white p-5 rounded-2xl shadow border space-y-4">

     {/* DATE */}
     <div className="flex justify-between items-center border-b pb-3">
       <span className="text-sm text-gray-600">📅 Sana</span>
       <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="border px-2 py-1 rounded"/>
     </div>

     {/* PRIORITY */}
     <div className="grid grid-cols-3 gap-2">
       <button onClick={()=>setPriority("high")} className={`border p-2 ${priority==="high" && "bg-gray-200 font-bold"}`}>🔴 Yuqori</button>
       <button onClick={()=>setPriority("medium")} className={`border p-2 ${priority==="medium" && "bg-gray-200 font-bold"}`}>🟡 O‘rta</button>
       <button onClick={()=>setPriority("low")} className={`border p-2 ${priority==="low" && "bg-gray-200 font-bold"}`}>🟢 Past</button>
     </div>

     {/* CATEGORY */}
     <div className="grid grid-cols-3 gap-2">
       <button onClick={()=>setCategory("Ish")} className={`border p-2 ${category==="Ish" && "bg-gray-200 font-bold"}`}>💼 Ish</button>
       <button onClick={()=>setCategory("O‘qish")} className={`border p-2 ${category==="O‘qish" && "bg-gray-200 font-bold"}`}>📚 O‘qish</button>
       <button onClick={()=>setCategory("Shaxsiy")} className={`border p-2 ${category==="Shaxsiy" && "bg-gray-200 font-bold"}`}>🏠 Shaxsiy</button>
     </div>

     {/* INPUT */}
     {date && priority && category && (
       <>
         <textarea
           value={input}
           onChange={(e)=>setInput(e.target.value)}
           onKeyDown={handleKeyDown}
           className="w-full p-3 border rounded"
           placeholder="✍️ Vazifa yozing..."
         />

         {suggestion && (
           <div className="text-gray-400 text-sm">
             🤖 {suggestion}
           </div>
         )}

         <button
           onClick={handleAdd}
           className="w-full bg-blue-500 text-white py-3 rounded"
         >
           Qo‘shish
         </button>
       </>
     )}

   </div>

   {/* TASKS */}
   {sortedDates.map(date=>(
     <div key={date} className="bg-white p-4 rounded-2xl shadow">
       <h2 className="font-bold text-blue-600 mb-2">📅 {date}</h2>

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
   ))}

  </div>
 )
}