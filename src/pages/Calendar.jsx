import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";

export default function Calendar(){

 const {tasks} = useContext(TaskContext);

 // 📅 BUGUN
 const today = new Date().toISOString().split("T")[0];

 // 📊 GROUP BY DATE
 const grouped = {};

 tasks.forEach(t => {
  if (!t.date) return;

  if (!grouped[t.date]) grouped[t.date] = [];
  grouped[t.date].push(t);
 });

 // 📅 SORT DATES
 const sortedDates = Object.keys(grouped).sort();

 return (
  <div className="max-w-5xl mx-auto space-y-6">

   {/* HEADER */}
   <div>
     <h1 className="text-3xl font-extrabold text-blue-600">
       📅 Kalendar
     </h1>
     <p className="text-gray-500">Sana bo‘yicha vazifalar</p>
   </div>

   {/* EMPTY */}
   {sortedDates.length === 0 && (
     <div className="text-gray-400 text-center mt-10">
       Vazifalar mavjud emas
     </div>
   )}

   {/* DATE BLOCKS */}
   <div className="space-y-6">

     {sortedDates.map(date => {

       const isToday = date === today;

       return (
         <div key={date} className="bg-white rounded-2xl shadow p-4">

           {/* DATE HEADER */}
           <div className="flex justify-between items-center mb-3">

             <h2 className={`font-bold text-lg ${isToday ? "text-blue-600" : ""}`}>
               {date}
               {isToday && " (Bugun)"}
             </h2>

             <span className="text-sm text-gray-400">
               {grouped[date].length} ta vazifa
             </span>

           </div>

           {/* TASKS */}
           <div className="space-y-2">

             {grouped[date].map(task => (

               <div
                 key={task.id}
                 className={`p-3 rounded-xl border flex justify-between items-center
                 ${task.completed ? "bg-gray-100 line-through text-gray-400" : "bg-blue-50"}`}
               >

                 <div>
                   <p className="font-medium">{task.title}</p>

                   <div className="text-xs text-gray-500 flex gap-2 mt-1">
                     {task.priority && <span>⚡ {task.priority}</span>}
                     {task.category && <span>📂 {task.category}</span>}
                   </div>
                 </div>

                 <div className={`text-sm font-semibold ${
                   task.completed ? "text-green-500" : "text-red-400"
                 }`}>
                   {task.completed ? "✔" : "⏳"}
                 </div>

               </div>

             ))}

           </div>

         </div>
       );

     })}

   </div>

  </div>
 )
}