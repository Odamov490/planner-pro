import {useState,useContext} from "react";
import {TaskContext} from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import {notify} from "../utils/notify";

export default function Tasks(){

 const [title,setTitle]=useState("");
 const [date,setDate]=useState("");

 // 🔥 NEW STATES
 const [search,setSearch]=useState("");
 const [filter,setFilter]=useState("all");
 const [priority,setPriority]=useState("low");
 const [category,setCategory]=useState("Ish");

 const {tasks,addTask,toggleTask,deleteTask}=useContext(TaskContext);

 const handleAdd=()=>{
  addTask(title,date,priority,category); // extra param (agar context qabul qilmasa ham ishlayveradi)
  notify("Yangi vazifa qo‘shildi");
  setTitle(""); 
  setDate("");
 };

 // 🔍 SEARCH + FILTER
 const filteredTasks = tasks
  .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
  .filter(t => {
    if(filter==="done") return t.completed;
    if(filter==="active") return !t.completed;
    return true;
  });

 // 📊 PROGRESS
 const done = tasks.filter(t => t.completed).length;
 const percent = tasks.length ? (done / tasks.length) * 100 : 0;

 return (
  <div>

   <h1 className="text-2xl font-bold mb-4">Vazifalar</h1>

   {/* 🔍 SEARCH */}
   <input
     value={search}
     onChange={(e)=>setSearch(e.target.value)}
     placeholder="Qidirish..."
     className="border p-2 rounded w-full mb-3"
   />

   {/* 📊 PROGRESS BAR */}
   <div className="mb-4">
     <div className="w-full bg-gray-200 h-3 rounded">
       <div 
         className="bg-blue-500 h-3 rounded transition-all"
         style={{width: percent + "%"}}
       ></div>
     </div>
     <p className="text-sm text-gray-500 mt-1">
       {done} / {tasks.length} bajarildi
     </p>
   </div>

   {/* 🎯 FILTER + CATEGORY + PRIORITY */}
   <div className="flex gap-2 mb-4 flex-wrap">

     <select onChange={(e)=>setFilter(e.target.value)} className="border p-2 rounded">
       <option value="all">Hammasi</option>
       <option value="done">Bajarilgan</option>
       <option value="active">Bajarilmagan</option>
     </select>

     <select onChange={(e)=>setPriority(e.target.value)} className="border p-2 rounded">
       <option value="low">Past</option>
       <option value="medium">O‘rta</option>
       <option value="high">Yuqori</option>
     </select>

     <select onChange={(e)=>setCategory(e.target.value)} className="border p-2 rounded">
       <option>Ish</option>
       <option>O‘qish</option>
       <option>Shaxsiy</option>
     </select>

   </div>

   {/* ➕ ADD TASK */}
   <div className="flex gap-2 mb-4 flex-wrap">
    <input className="border p-2 rounded flex-1 min-w-[200px]" value={title}
     onChange={e=>setTitle(e.target.value)} placeholder="Vazifa..."/>

    <input type="date" value={date} onChange={e=>setDate(e.target.value)}
     className="border p-2 rounded"/>

    <button onClick={handleAdd}
     className="bg-blue-500 text-white px-4 rounded hover:scale-105 transition">
     Qo‘shish
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