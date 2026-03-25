import { useState, useContext, useEffect } from "react";
import { TaskContext } from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import { notify } from "../utils/notify";
import { getSuggestion } from "../utils/ai";

export default function Tasks(){

 const [input,setInput]=useState("");

 const [suggestions,setSuggestions]=useState([]);
 const [activeIndex,setActiveIndex]=useState(0);

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

 // 🤖 AI SUGGEST (tezlashtirilgan)
 useEffect(()=>{

  if(input.length < 3){
    setSuggestions([]);
    return;
  }

  const t = setTimeout(async()=>{

    const res = await getSuggestion(input);

    setSuggestions(res);
    setActiveIndex(0);

  },300);

  return ()=>clearTimeout(t);

 },[input]);

 // ➕ ADD
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
  setSuggestions([]);
 };

 // ⌨️ KEYBOARD CONTROL
 const handleKeyDown = (e) => {

  // ENTER
  if(e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    handleAdd();
  }

  // TAB → AI qabul qilish
  if(e.key === "Tab" && suggestions.length){
    e.preventDefault();
    setInput(suggestions[activeIndex]);
    setSuggestions([]);
  }

  // ↓
  if(e.key === "ArrowDown"){
    e.preventDefault();
    setActiveIndex(prev => (prev + 1) % suggestions.length);
  }

  // ↑
  if(e.key === "ArrowUp"){
    e.preventDefault();
    setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
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

 const today = new Date();
 const todayStr = today.toISOString().split("T")[0];

 const tomorrow = new Date();
 tomorrow.setDate(today.getDate() + 1);
 const tomorrowStr = tomorrow.toISOString().split("T")[0];

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

   <h1 className="text-3xl font-extrabold mb-6 text-blue-600">
     Vazifalar
   </h1>

   <input
     value={search}
     onChange={(e)=>setSearch(e.target.value)}
     placeholder="🔍 Qidirish..."
     className="w-full p-3 rounded-xl border mb-4"
   />

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
         className="p-3 border rounded-xl"
       />

       <select 
         value={priority}
         onChange={(e)=>setPriority(e.target.value)}
         className="p-3 border rounded-xl"
       >
         <option value="">Muhimlik *</option>
         <option value="high">🔴 Yuqori</option>
         <option value="medium">🟡 O‘rta</option>
         <option value="low">🟢 Past</option>
       </select>

       <select 
         value={category}
         onChange={(e)=>setCategory(e.target.value)}
         className="p-3 border rounded-xl"
       >
         <option value="">Kategoriya *</option>
         <option>Ish</option>
         <option>O‘qish</option>
         <option>Shaxsiy</option>
       </select>

     </div>

     {date && priority && category && (
       <div className="space-y-2">

         {/* 👻 GHOST INPUT */}
         <div className="relative">

          {suggestions.length > 0 && (
            <div className="absolute inset-0 p-4 text-gray-400 pointer-events-none whitespace-pre-wrap">
              {input}
              <span className="opacity-50">
                {suggestions[activeIndex]?.slice(input.length)}
              </span>
            </div>
          )}

          <textarea
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="✍️ Vazifa yozing..."
            className="w-full p-4 border rounded-xl min-h-[120px] bg-transparent relative z-10"
          />

         </div>

         {/* 🤖 VARIANTS */}
         {suggestions.length > 0 && (
           <div className="bg-white border rounded-xl shadow p-2 space-y-1">

            {suggestions.map((s,i)=>(
              <div
                key={i}
                className={`p-2 rounded cursor-pointer ${
                  i===activeIndex ? "bg-blue-100" : ""
                }`}
                onClick={()=>setInput(s)}
              >
                🤖 {s}
              </div>
            ))}

           </div>
         )}

         <button
           onClick={handleAdd}
           className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl"
         >
           ➕ Qo‘shish
         </button>

         {/* 🤖 AUTO PLAN */}
         <button
           onClick={async()=>{
            const res = await getSuggestion("Bugungi kun uchun 5 ta vazifa tuz");

            await Promise.all(
              res.map(r => addTask(r, date, priority, category))
            );

            notify("AI reja tuzdi 🤖");
           }}
           className="w-full bg-green-500 text-white py-2 rounded-xl"
         >
           🤖 Kunlik reja tuz
         </button>

       </div>
     )}

   </div>

   <div className="space-y-6">

    {sortedDates.map(date=>(
      <div key={date} className="bg-white p-4 rounded-2xl shadow">

        <div className="flex justify-between mb-3 border-b pb-2">
          <h2 className="font-bold text-blue-600">
            📅 {date}
          </h2>
          <span className="text-sm text-gray-400">
            {groupedTasks[date].length} ta
          </span>
        </div>

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
 );
}