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

 // 🔥 NEW: bulk input
 const [bulkText,setBulkText]=useState("");

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

 // 🔥 BULK ADD FUNCTION
 const handleBulkAdd = () => {
  if(!bulkText) return notify("Tasklarni kiriting ❗");
  if(!category) return notify("Kategoriya tanlang ❗");
  if(!priority) return notify("Muhimlik tanlang ❗");

  const lines = bulkText.split("\n").filter(line => line.trim() !== "");

  lines.forEach(line => {
    addTask(line.trim(), date, priority, category);
  });

  notify(`${lines.length} ta vazifa qo‘shildi 🚀`);
  setBulkText("");
 };

 // 🔍 FILTER
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

 const done = tasks.filter(t => t.completed).length;
 const percent = tasks.length ? (done / tasks.length) * 100 : 0;

 return (
  <div className="max-w-4xl mx-auto">

   <h1 className="text-3xl font-extrabold mb-6 text-blue-600">
     Vazifalar
   </h1>

   {/* SEARCH */}
   <input
     value={search}
     onChange={(e)=>setSearch(e.target.value)}
     placeholder="🔍 Qidirish..."
     className="w-full p-3 rounded-xl border mb-4"
   />

   {/* PROGRESS */}
   <div className="mb-6">
     <div className="w-full bg-gray-200 h-3 rounded-full">
       <div 
         className="bg-blue-500 h-3 rounded-full"
         style={{width: percent + "%"}}
       ></div>
     </div>
     <p className="text-sm">{done} / {tasks.length}</p>
   </div>

   {/* FILTER */}
   <div className="flex gap-2 mb-6 flex-wrap">
     <select onChange={(e)=>setFilter(e.target.value)} className="p-2 border rounded">
       <option value="all">Hammasi</option>
       <option value="done">Bajarilgan</option>
       <option value="active">Bajarilmagan</option>
     </select>

     <select onChange={(e)=>setCategory(e.target.value)} className="p-2 border rounded">
       <option value="">Kategoriya</option>
       <option>Ish</option>
       <option>O‘qish</option>
       <option>Shaxsiy</option>
     </select>
   </div>

   {/* ADD SINGLE */}
   <div className="bg-white p-4 rounded-xl shadow mb-6">
     <input 
       className="w-full p-2 border mb-2"
       value={title}
       onChange={e=>setTitle(e.target.value)}
       placeholder="Vazifa..."
     />

     <div className="flex gap-2 flex-wrap">
       <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="p-2 border"/>

       <select value={priority} onChange={(e)=>setPriority(e.target.value)} className="p-2 border">
         <option value="">Muhimlik *</option>
         <option value="high">Yuqori</option>
         <option value="medium">O‘rta</option>
         <option value="low">Past</option>
       </select>

       <select value={category} onChange={(e)=>setCategory(e.target.value)} className="p-2 border">
         <option value="">Kategoriya *</option>
         <option>Ish</option>
         <option>O‘qish</option>
         <option>Shaxsiy</option>
       </select>
     </div>

     <button onClick={handleAdd} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
       Qo‘shish
     </button>
   </div>

   {/* 🔥 BULK ADD */}
   <div className="bg-white p-4 rounded-xl shadow mb-6">
     <h2 className="font-semibold mb-2">🔥 Bir nechta vazifa qo‘shish</h2>

     <textarea
       value={bulkText}
       onChange={(e)=>setBulkText(e.target.value)}
       placeholder={`Masalan:
Task 1
Task 2
Task 3`}
       className="w-full p-2 border rounded mb-2 h-32"
     />

     <button 
       onClick={handleBulkAdd}
       className="bg-green-500 text-white px-4 py-2 rounded hover:scale-105 transition"
     >
       🚀 Hammasini qo‘shish
     </button>
   </div>

   {/* TASK LIST */}
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