import { useState, useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import { notify } from "../utils/notify";

export default function Tasks(){

 const [input,setInput]=useState("");
 const [date,setDate]=useState("");

 const [search,setSearch]=useState("");
 const [filter,setFilter]=useState("all");
 const [priority,setPriority]=useState("");
 const [category,setCategory]=useState("");

 const {
   tasks,
   addTask,
   toggleTask,
   deleteTask,
   editTask,
   addSubtask,
   toggleSubtask
 } = useContext(TaskContext);

 // 🔥 SMART ADD (ENTER + MULTI)
 const handleAdd = async () => {

  if(!input.trim()) return notify("Vazifa yozing ❗");
  if(!category) return notify("Kategoriya tanlang ❗");
  if(!priority) return notify("Muhimlik tanlang ❗");

  const lines = input
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l !== "");

  await Promise.all(
    lines.map(line => addTask(line, date, priority, category))
  );

  notify(`${lines.length} ta vazifa qo‘shildi 🚀`);

  setInput("");
  setDate("");
  setPriority("");
  setCategory("");
 };

 // 🔥 ENTER BOSILGANDA
 const handleKeyDown = (e) => {
  if(e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    handleAdd();
  }
 };

 // 🔍 FILTER
 const filteredTasks = tasks
  .filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
  .filter(t => {
    if(filter==="done") return t.completed;
    if(filter==="active") return !t.completed;
    return true;
  })
  .filter(t => {
    if(category) return t.category === category;
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

 const today = new Date().toISOString().split("T")[0];

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
     <p className="text-sm mt-1">
       {done} / {tasks.length} bajarildi
     </p>
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

   {/* 🔥 SMART INPUT */}
   <div className="bg-white p-4 rounded-xl shadow mb-6 space-y-3">

     <textarea
       value={input}
       onChange={(e)=>setInput(e.target.value)}
       onKeyDown={handleKeyDown}
       placeholder={`✍️ Vazifa yozing...

Shift + Enter → yangi qator
Enter → qo‘shish`}
       className="w-full p-3 border rounded-xl min-h-[120px]"
     />

     <div className="flex gap-2 flex-wrap">

       <input 
         type="date" 
         value={date}
         onChange={e=>setDate(e.target.value)}
         className="p-2 border rounded"
       />

       <select value={priority} onChange={(e)=>setPriority(e.target.value)} className="p-2 border rounded">
         <option value="">Muhimlik *</option>
         <option value="high">🔴 Yuqori</option>
         <option value="medium">🟡 O‘rta</option>
         <option value="low">🟢 Past</option>
       </select>

       <select value={category} onChange={(e)=>setCategory(e.target.value)} className="p-2 border rounded">
         <option value="">Kategoriya *</option>
         <option>Ish</option>
         <option>O‘qish</option>
         <option>Shaxsiy</option>
       </select>

     </div>

     <button 
       onClick={handleAdd}
       className="w-full bg-blue-500 text-white py-3 rounded-xl"
     >
       ➕ Qo‘shish
     </button>

   </div>

   {/* TASK LIST */}
   <div className="space-y-6">

    {sortedDates.map(date=>(
      <div key={date} className="bg-white p-4 rounded-2xl shadow">

        <div className="flex justify-between mb-3 border-b pb-2">
          <h2 className={`font-bold ${date===today ? "text-red-500" : "text-blue-600"}`}>
            📅 {date} {date===today && "(Bugun)"}
          </h2>
          <span className="text-sm text-gray-400">
            {groupedTasks[date].length} ta
          </span>
        </div>

        <div className="space-y-3">
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

  </div>
 )
}