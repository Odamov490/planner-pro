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

 const sortedDates = Object.keys(grouped).sort((a,b)=> new Date(a)-new Date(b));

 // ⏰ DEADLINE
 const getDaysLeft = (date)=>{
  const diff = (new Date(date) - new Date())/(1000*60*60*24);
  return Math.floor(diff);
 };

 return (
  <div className="max-w-5xl mx-auto space-y-6">

   {/* HEADER */}
   <h1 className="text-3xl font-bold text-blue-600">📅 Kalendar</h1>

   {/* 📌 TODAY */}
   <div className="bg-blue-50 p-4 rounded-2xl shadow">
     <h2 className="font-bold mb-2">📌 Bugungi vazifalar</h2>

     {tasks.filter(t=>t.date===today).length===0 && (
       <p className="text-gray-400">Bugun vazifa yo‘q</p>
     )}

     {tasks.filter(t=>t.date===today).map(t=>(
       <div key={t.id} className="p-3 bg-white rounded mb-2">

         {/* TASK */}
         <p className={t.completed ? "line-through text-gray-400" : ""}>
           {t.title}
         </p>

         {/* SUBTASKS */}
         {t.subtasks?.length > 0 && (
           <div className="ml-4 mt-2 space-y-1 text-sm">
             {t.subtasks.map(s=>(
               <div 
                 key={s.id}
                 className={s.completed ? "line-through text-gray-400" : ""}
               >
                 ▸ {s.text}
               </div>
             ))}
           </div>
         )}

       </div>
     ))}
   </div>

   {/* 📅 LIST */}
   {sortedDates.map(date=>{

     const isToday = date===today;

     return (
       <div key={date} className="bg-white p-4 rounded-2xl shadow">

         {/* DATE HEADER */}
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
         <div className="space-y-3">
           {grouped[date].map(task=>{

             const daysLeft = getDaysLeft(task.date);
             const isLate = daysLeft < 0;

             return (
               <div 
                 key={task.id}
                 className={`p-3 rounded-xl 
                 ${task.completed ? "bg-gray-100" : ""}
                 ${isLate ? "bg-red-100" : "bg-blue-50"}`}
               >

                 {/* MAIN TASK */}
                 <div className="flex justify-between">

                   <p className={task.completed ? "line-through text-gray-400" : ""}>
                     {task.title}
                   </p>

                   <span>
                     {task.completed ? "✔" : "⏳"}
                   </span>

                 </div>

                 {/* SUBTASKS */}
                 {task.subtasks?.length > 0 && (
                   <div className="ml-4 mt-2 space-y-1 text-sm">

                     {task.subtasks.map(s=>(
                       <div 
                         key={s.id}
                         className={s.completed ? "line-through text-gray-400" : ""}
                       >
                         ▸ {s.text}
                       </div>
                     ))}

                   </div>
                 )}

                 {/* INFO */}
                 <div className="text-xs flex gap-2 mt-2">

                   {task.priority==="high" && <span className="text-red-500">🔴 Yuqori</span>}
                   {task.priority==="medium" && <span className="text-yellow-500">🟡 O‘rta</span>}
                   {task.priority==="low" && <span className="text-green-500">🟢 Past</span>}

                   {!task.completed && (
                     <span className="text-gray-400">
                       {isLate ? "Kechikdi ❗" : `${daysLeft} kun qoldi`}
                     </span>
                   )}

                 </div>

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

         <div className="space-y-3 max-h-60 overflow-y-auto">

           {grouped[selectedDate].map(t=>(

             <div key={t.id} className="p-3 bg-gray-100 rounded">

               <p className={t.completed ? "line-through text-gray-400" : ""}>
                 {t.title}
               </p>

               {/* SUBTASKS */}
               {t.subtasks?.length > 0 && (
                 <div className="ml-4 mt-2 text-sm space-y-1">
                   {t.subtasks.map(s=>(
                     <div 
                       key={s.id}
                       className={s.completed ? "line-through text-gray-400" : ""}
                     >
                       ▸ {s.text}
                     </div>
                   ))}
                 </div>
               )}

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