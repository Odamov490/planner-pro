import { useContext, useState } from "react";
import { TaskContext } from "../context/TaskContext";

export default function Calendar(){

 const {tasks} = useContext(TaskContext);

 const [currentDate, setCurrentDate] = useState(new Date());

 // 📅 Helper functions
 const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0).getDate();
 };

 const getFirstDay = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
 };

 const daysInMonth = getDaysInMonth(currentDate);
 const firstDay = getFirstDay(currentDate);

 const monthNames = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"
 ];

 // 🔄 NAVIGATION
 const prevMonth = () => {
  setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1));
 };

 const nextMonth = () => {
  setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1));
 };

 // 📊 TASKS BY DATE
 const getTasksByDate = (day) => {
  const d = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  return tasks.filter(t => t.date === d);
 };

 return (
  <div className="max-w-5xl mx-auto space-y-6">

   {/* HEADER */}
   <div className="flex justify-between items-center">
     <h1 className="text-3xl font-bold text-blue-600">📅 Kalendar</h1>

     <div className="flex gap-2">
       <button onClick={prevMonth} className="px-3 py-1 bg-gray-200 rounded">⬅</button>
       <button onClick={nextMonth} className="px-3 py-1 bg-gray-200 rounded">➡</button>
     </div>
   </div>

   {/* MONTH */}
   <h2 className="text-xl font-semibold text-center">
     {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
   </h2>

   {/* WEEK DAYS */}
   <div className="grid grid-cols-7 text-center font-medium text-gray-500">
     <div>Yak</div>
     <div>Dush</div>
     <div>Sesh</div>
     <div>Chor</div>
     <div>Pays</div>
     <div>Jum</div>
     <div>Shan</div>
   </div>

   {/* CALENDAR GRID */}
   <div className="grid grid-cols-7 gap-2">

     {/* EMPTY CELLS */}
     {[...Array(firstDay)].map((_,i)=>(
       <div key={i}></div>
     ))}

     {/* DAYS */}
     {[...Array(daysInMonth)].map((_,i)=>{
       const day = i+1;
       const dayTasks = getTasksByDate(day);

       return (
         <div key={day} className="bg-white p-2 rounded-xl shadow min-h-[100px] hover:shadow-md transition">

           <div className="font-bold text-sm mb-1">{day}</div>

           {/* TASKS */}
           <div className="space-y-1">
             {dayTasks.slice(0,3).map(t=>(
               <div key={t.id} className="text-xs bg-blue-100 px-1 rounded truncate">
                 {t.title}
               </div>
             ))}

             {dayTasks.length > 3 && (
               <div className="text-xs text-gray-400">
                 +{dayTasks.length - 3} yana
               </div>
             )}
           </div>

         </div>
       );
     })}

   </div>

  </div>
 )
}