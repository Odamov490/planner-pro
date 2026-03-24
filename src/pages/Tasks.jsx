import {useState,useContext} from "react";
import {TaskContext} from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import {notify} from "../utils/notify";

export default function Tasks(){

 const [title,setTitle]=useState("");
 const [date,setDate]=useState("");

 const [search,setSearch]=useState("");
 const [filter,setFilter]=useState("all");
 const [priority,setPriority]=useState("");
 const [category,setCategory]=useState("");

 const {tasks,addTask,toggleTask,deleteTask}=useContext(TaskContext);

 const handleAdd=()=>{
  if(!title) return notify("Vazifa nomini kiriting ❗");
  if(!category) return notify("Kategoriya tanlang ❗");
  if(!priority) return notify("Muhimlik darajasini tanlang ❗");

  addTask(title,date,priority,category);
  notify("Yangi vazifa qo‘shildi ✅");

  setTitle(""); 
  setDate("");
  setPriority("");
  setCategory("");
 };

 // 🔍 SEARCH + FILTER + CATEGORY FILTER
 const filteredTasks = tasks
  .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
  .filter(t => {
    if(filter==="done") return t.completed;
    if(filter==="active") return !t.completed;
    return true;
  })
  .filter(t => {
    if(category) return t.category === category;
    return true;
  });

 // 📊 PROGRESS
 const done = tasks.filter(t => t.completed).length;
 const percent = tasks.length ? (done / tasks.length) * 100 : 0;

 return (
  <div className="max-w-4xl mx-auto">

   {/* TITLE */}
   <h1 className="text-3xl font-extrabold mb-6 text-blue-600">
     Vazifalar
   </h1>

   {/* 🔍 SEARCH */}
   <input
     value={search}
     onChange={(e)=>setSearch(e.target.value)}
     placeholder="🔍 Qidirish..."
     className="w-full p-3 rounded-xl border mb-4 focus:ring-2 focus:ring-blue-400 outline-none"
   />

   {/* 📊 PROGRESS */}
   <div className="mb-6">
     <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
       <div 
         className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 transition-all duration-500"
         style={{width: percent + "%"}}
       ></div>
     </div>
     <p className="text-sm text-gray-500 mt-1">
       {done} / {tasks.length} bajarildi
     </p>
   </div>

   {/* 🎯 FILTERS */}
   <div className="flex gap-2 mb-6 flex-wrap">

     <select onChange={(e)=>setFilter(e.target.value)}
       className="p-2 rounded-lg border">
       <option value="all">Hammasi</option>
       <option value="done">Bajarilgan</option>
       <option value="active">Bajarilmagan</option>
     </select>

     <select onChange={(e)=>setCategory(e.target.value)}
       className="p-2 rounded-lg border">
       <option value="">Kategoriya (filter)</option>
       <option>Ish</option>
       <option>O‘qish</option>
       <option>Shaxsiy</option>
     </select>

   </div>

   {/* ➕ ADD FORM */}
   <div className="bg-white p-4 rounded-2xl shadow-lg mb-6 space-y-3">

     <input 
       className="w-full p-3 border rounded-xl"
       value={title}
       onChange={e=>setTitle(e.target.value)}
       placeholder="✍️ Vazifa yozing..."
     />

     <div className="flex gap-2 flex-wrap">

       <input 
         type="date" 
         value={date}
         onChange={e=>setDate(e.target.value)}
         className="p-2 border rounded-lg"
       />

       {/* PRIORITY (majburiy) */}
       <select value={priority} onChange={(e)=>setPriority(e.target.value)}
         className="p-2 border rounded-lg">
         <option value="">Muhimlik *</option>
         <option value="high">🔴 Yuqori</option>
         <option value="medium">🟡 O‘rta</option>
         <option value="low">🟢 Past</option>
       </select>

       {/* CATEGORY (majburiy) */}
       <select value={category} onChange={(e)=>setCategory(e.target.value)}
         className="p-2 border rounded-lg">
         <option value="">Kategoriya *</option>
         <option>Ish</option>
         <option>O‘qish</option>
         <option>Shaxsiy</option>
       </select>

     </div>

     <button 
       onClick={handleAdd}
       className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:scale-105 transition"
     >
       ➕ Qo‘shish
     </button>

   </div>

   {/* 📋 TASK LIST */}
   <div className="space-y-3">
    {filteredTasks.map(t=>(
     <TaskCard 
       key={t.id} 
       task={t} 
       onToggle={toggleTask} 
       onDelete={deleteTask}
     />
    ))}
   </div>

  </div>
 )
}