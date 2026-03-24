import { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";

export default function Calendar(){

 const {tasks} = useContext(TaskContext);

 const today = new Date().toISOString().split("T")[0];

 const [selectedDate,setSelectedDate]=useState(null);

 // 📊 GROUP
 const grouped = {};
 tasks.forEach(t=>{
  if(!t.date) return;
  if(!grouped[t.date]) grouped[t.date]=[];
  grouped[t.date].push(t);
 });

 const sortedDates = Object.keys(grouped).sort();

 // ⏰ DEADLINE
 const getDaysLeft = (date)=>{
  const diff = (new Date(date) - new Date())/(1000*60*60*24);
  return Math.floor(diff);
 };

 return (
  <div className="max-w-5xl mx-auto space-y-6">

   {/* HEADER */}
   <h1 className="text-3xl font-bold text-blue-600">📅 Kalendar</h1>

   {/* 📌 TODAY BLOCK */}
   <div className="bg-blue-50 p-4 rounded-2xl shadow">
     <h2 className="font-bold mb-2">📌 Bugungi vazifalar</h2>

     {tasks.filter(t=>t.date===today).length===0 && (
       <p className="text-gray-400">Bugun vazifa yo‘q</p>
     )}

     {tasks.filter(t=>t.date===today).map(t=>(
       <div key={t.id} className="p-2 bg-white rounded mb-2">
         {t.title}
       </div>
     ))}
   </div>

   {/* 📅 LIST */}
   {sortedDates.map(date=>{

     const isToday = date===today;

     return (
       <div key={date} className="bg-white p-4 rounded-2xl shadow">

         {/* DATE */}
         <div 
           onClick={()=>setSelectedDate(date)}
           className={`cursor-pointer flex justify-between mb-3 ${
             isToday && "text-blue-600 font-bold"
           }`}
         >
           <span>{date} {isToday && "(Bugun)"}</span>
           <span>{grouped[date].length} ta</span>
         </div>

         {/* TASKS */}
         <div className="space-y-2">
           {grouped[date].map(task=>{

             const daysLeft = getDaysLeft(task.date);
             const isLate = daysLeft < 0;

             return (
               <div 
                 key={task.id}
                 className={`p-3 rounded-xl flex justify-between items-center
                 ${task.completed ? "bg-gray-100 line-through" : ""}
                 ${isLate ? "bg-red-100" : "bg-blue-50"}`}
               >

                 <div>
                   <p>{task.title}</p>

                   {/* PRIORITY */}
                   <div className="text-xs flex gap-2 mt-1">

                     {task.priority==="high" && <span className="text-red-500">🔴 Yuqori</span>}
                     {task.priority==="medium" && <span className="text-yellow-500">🟡 O‘rta</span>}
                     {task.priority==="low" && <span className="text-green-500">🟢 Past</span>}

                     {/* ⏰ COUNTDOWN */}
                     {!task.completed && (
                       <span className="text-gray-400">
                         {isLate ? "Kechikdi ❗" : `${daysLeft} kun qoldi`}
                       </span>
                     )}

                   </div>
                 </div>

                 <span>
                   {task.completed ? "✔" : "⏳"}
                 </span>

               </div>
             )
           })}
         </div>

       </div>
     )
   })}

   {/* 🔥 MODAL */}
   {selectedDate && (
     <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

       <div className="bg-white p-6 rounded-xl w-96">

         <h2 className="font-bold mb-3">{selectedDate}</h2>

         <div className="space-y-2 max-h-60 overflow-y-auto">

           {grouped[selectedDate].map(t=>(
             <div key={t.id} className="p-2 bg-gray-100 rounded">
               {t.title}
             </div>
           ))}

         </div>

         <button
           onClick={()=>setSelectedDate(null)}
           className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
         >
           Yopish
         </button>

       </div>

     </div>
   )}

  </div>
 )
}