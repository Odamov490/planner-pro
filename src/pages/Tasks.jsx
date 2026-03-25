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

   {/* USER ASSIGN */}
   <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border">

     <p className="font-semibold mb-2">👤 Vazifani kimga berasiz?</p>

     <div className="flex gap-2">
       <input
         value={emailInput}
         onChange={(e)=>{
           setEmailInput(e.target.value);
           setSelectedUser(null);
         }}
         placeholder="Email yozing..."
         className="w-full p-3 border rounded-xl"
       />

       <button
         onClick={()=>setShowUsers(prev=>!prev)}
         className="px-3 bg-blue-500 text-white rounded-xl"
       >
         📋
       </button>
     </div>

     {/* AUTOCOMPLETE */}
     {emailInput && (
       <div className="bg-white border mt-2 rounded-xl max-h-40 overflow-y-auto shadow">

         {filteredUsers.map(u=>(
           <div
             key={u.uid}
             onClick={()=>{
               setSelectedUser(u);
               setEmailInput(u.email);
             }}
             className="p-2 hover:bg-blue-100 cursor-pointer"
           >
             {u.email}
           </div>
         ))}

       </div>
     )}

     {/* FULL LIST */}
     {showUsers && (
       <div className="bg-white border mt-2 rounded-xl max-h-40 overflow-y-auto shadow">

         {users.map(u=>(
           <div
             key={u.uid}
             onClick={()=>{
               setSelectedUser(u);
               setEmailInput(u.email);
               setShowUsers(false);
             }}
             className="p-2 hover:bg-blue-100 cursor-pointer"
           >
             {u.email}
           </div>
         ))}

       </div>
     )}

     {selectedUser && (
       <div className="mt-2 bg-green-100 text-green-700 px-3 py-1 rounded-xl inline-block">
         ✅ {selectedUser.email}
       </div>
     )}

   </div>

   {/* SEARCH */}
   <input
     value={search}
     onChange={(e)=>setSearch(e.target.value)}
     placeholder="🔍 Qidirish..."
     className="w-full p-3 rounded-xl border"
   />

   {/* PROGRESS */}
   <div>
     <div className="w-full bg-gray-200 h-3 rounded-full">
       <div 
         className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3"
         style={{width: percent+"%"}}
       />
     </div>
     <p className="text-sm mt-1">{done}/{tasks.length}</p>
   </div>

   {/* FILTER */}
   <select 
     onChange={(e)=>setFilter(e.target.value)} 
     className="p-2 border rounded-xl"
   >
     <option value="all">Hammasi</option>
     <option value="done">Bajarilgan</option>
     <option value="active">Bajarilmagan</option>
   </select>

   {/* ADD */}
   <div className="bg-white p-6 rounded-2xl shadow space-y-3">

     <div className="flex gap-2 flex-wrap">

       <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="p-2 border rounded-xl"/>

       <select value={priority} onChange={(e)=>setPriority(e.target.value)} className="p-2 border rounded-xl">
         <option value="">Muhimlik</option>
         <option value="high">🔴</option>
         <option value="medium">🟡</option>
         <option value="low">🟢</option>
       </select>

       <select value={category} onChange={(e)=>setCategory(e.target.value)} className="p-2 border rounded-xl">
         <option value="">Kategoriya</option>
         <option>Ish</option>
         <option>O‘qish</option>
         <option>Shaxsiy</option>
       </select>

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