import { useState, useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import { notify } from "../utils/notify";

export default function Tasks(){

 const [input,setInput]=useState("");
 const [date,setDate]=useState("");
 const [priority,setPriority]=useState("");
 const [category,setCategory]=useState("");

 const [search,setSearch]=useState("");
 const [filter,setFilter]=useState("all");

 const {
   tasks,
   addTask,
   toggleTask,
   deleteTask,
   editTask
 } = useContext(TaskContext);

 // 🔥 ADD
 const handleAdd = async () => {

  if(!input.trim()) return notify("Vazifa yozing ❗");

  const lines = input
    .split("\n")
    .map(l => l.trim())
    .filter(l => l);

  await Promise.all(
    lines.map(line => addTask(line, date, priority, category))
  );

  notify(`${lines.length} ta vazifa qo‘shildi 🚀`);

  setInput("");
 };

 // 🔥 ENTER
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
  });

 // 📅 GROUP
 const groupedTasks = {};
 filteredTasks.forEach(t=>{
  const d = t.date || "Sanasiz";
  if(!groupedTasks[d]) groupedTasks[d]=[];
  groupedTasks[d].push(t);
 });

 // 🔥 BUGUN / ERTAGA LOGIC
 const today = new Date();
 const todayStr = today.toISOString().split("T")[0];

 const tomorrow = new Date();
 tomorrow.setDate(today.getDate() + 1);
 const tomorrowStr = tomorrow.toISOString().split("T")[0];

 // 🔥 SORT DATES (MUHIM)
 const sortedDates = Object.keys(groupedTasks).sort((a, b) => {

  if (a === todayStr) return -1;
  if (b === todayStr) return 1;

  if (a === tomorrowStr) return -1;
  if (b === tomorrowStr) return 1;

  return new Date(a) - new Date(b);
 });

 const done = tasks.filter(t => t.completed).length;
 const percent = tasks.length ? (done / tasks.length) * 100 : 0;

 return (
  <div className="max-w-4xl mx-auto">

   {/* TITLE */}
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
         className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full"
         style={{width: percent + "%"}}
       ></div>
     </div>
     <p className="text-sm mt-1">
       {done} / {tasks.length} bajarildi
     </p>
   </div>

   {/* FILTER */}
   <div className="flex gap-2 mb-6">
     <select 
       onChange={(e)=>setFilter(e.target.value)} 
       className="p-2 border rounded-xl"
     >
       <option value="all">Hammasi</option>
       <option value="done">Bajarilgan</option>
       <option value="active">Bajarilmagan</option>
     </select>
   </div>

   {/* ADD BLOCK */}
   <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 space-y-4">

     <div className="flex gap-3 flex-wrap">

       <input 
         type="date"
         value={date}
         onChange={(e)=>setDate(e.target.value)}
         className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400"
       />

       <select 
         value={priority}
         onChange={(e)=>setPriority(e.target.value)}
         className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400"
       >
         <option value="">Muhimlik *</option>
         <option value="high">🔴 Yuqori</option>
         <option value="medium">🟡 O‘rta</option>
         <option value="low">🟢 Past</option>
       </select>

       <select 
         value={category}
         onChange={(e)=>setCategory(e.target.value)}
         className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400"
       >
         <option value="">Kategoriya *</option>
         <option>Ish</option>
         <option>O‘qish</option>
         <option>Shaxsiy</option>
       </select>

     </div>

     {date && priority && category && (
       <div className="space-y-3">

         <textarea
           value={input}
           onChange={(e)=>setInput(e.target.value)}
           onKeyDown={handleKeyDown}
           placeholder="✍️ Vazifa yozing..."
           className="w-full p-4 border rounded-xl min-h-[120px] focus:ring-2 focus:ring-blue-400"
         />

         <button
           onClick={handleAdd}
           className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:scale-105 transition"
         >
           ➕ Qo‘shish
         </button>

       </div>
     )}

   </div>

   {/* TASK LIST */}
   <div className="space-y-6">

    {sortedDates.map(date=>(
      <div key={date} className="bg-white p-4 rounded-2xl shadow">

        {/* HEADER */}
        <div className="flex justify-between mb-3 border-b pb-2">
          <h2 className={`font-bold ${
            date === todayStr
              ? "text-red-500"
              : date === tomorrowStr
              ? "text-orange-500"
              : "text-blue-600"
          }`}>
            📅 {date === todayStr 
                ? "Bugun" 
                : date === tomorrowStr 
                ? "Ertaga" 
                : date}
          </h2>

          <span className="text-sm text-gray-400">
            {groupedTasks[date].length} ta
          </span>
        </div>

        {/* TASKS */}
        <div className="space-y-3">
          {groupedTasks[date]
            .sort((a,b)=> new Date(b.created) - new Date(a.created))
            .map(t=>(
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