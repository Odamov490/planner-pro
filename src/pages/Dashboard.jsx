import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";

export default function Dashboard(){

 const {tasks}=useContext(TaskContext);

 const done = tasks.filter(t=>t.completed).length;
 const active = tasks.length - done;

 // 🔥 PRIORITY COUNT
 const high = tasks.filter(t=>t.priority==="high").length;
 const medium = tasks.filter(t=>t.priority==="medium").length;
 const low = tasks.filter(t=>t.priority==="low").length;

 // 🔥 CATEGORY COUNT
 const categories = {};
 tasks.forEach(t=>{
  if(!t.category) return;
  categories[t.category] = (categories[t.category] || 0) + 1;
 });

 return (
  <div className="space-y-6">

   {/* HEADER */}
   <div>
     <h1 className="text-3xl font-extrabold text-blue-600">
       📊 Dashboard
     </h1>
     <p className="text-gray-500">Umumiy statistik ma’lumotlar</p>
   </div>

   {/* 🔥 STATS CARDS */}
   <div className="grid md:grid-cols-4 gap-4">

     <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
       <p className="text-gray-500 text-sm">Jami vazifalar</p>
       <h2 className="text-2xl font-bold">{tasks.length}</h2>
     </div>

     <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
       <p className="text-gray-500 text-sm">Bajarilgan</p>
       <h2 className="text-2xl font-bold text-green-500">{done}</h2>
     </div>

     <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
       <p className="text-gray-500 text-sm">Bajarilmagan</p>
       <h2 className="text-2xl font-bold text-red-500">{active}</h2>
     </div>

     <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
       <p className="text-gray-500 text-sm">Progress</p>
       <h2 className="text-2xl font-bold">
         {tasks.length ? Math.round((done/tasks.length)*100) : 0}%
       </h2>
     </div>

   </div>

   {/* 📊 PROGRESS BAR */}
   <div className="bg-white p-5 rounded-2xl shadow">
     <p className="mb-2 font-medium">Umumiy bajarilish</p>
     <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
       <div 
         className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 transition-all"
         style={{width: `${tasks.length ? (done/tasks.length)*100 : 0}%`}}
       ></div>
     </div>
   </div>

   {/* 🔥 PRIORITY */}
   <div className="grid md:grid-cols-3 gap-4">

     <div className="bg-white p-5 rounded-2xl shadow">
       <p className="text-gray-500">🔴 Yuqori</p>
       <h2 className="text-xl font-bold">{high}</h2>
     </div>

     <div className="bg-white p-5 rounded-2xl shadow">
       <p className="text-gray-500">🟡 O‘rta</p>
       <h2 className="text-xl font-bold">{medium}</h2>
     </div>

     <div className="bg-white p-5 rounded-2xl shadow">
       <p className="text-gray-500">🟢 Past</p>
       <h2 className="text-xl font-bold">{low}</h2>
     </div>

   </div>

   {/* 🔥 CATEGORY LIST */}
   <div className="bg-white p-5 rounded-2xl shadow">
     <h2 className="font-semibold mb-3">📂 Kategoriyalar</h2>

     <div className="space-y-2">
       {Object.keys(categories).length===0 && (
         <p className="text-gray-400">Ma’lumot yo‘q</p>
       )}

       {Object.entries(categories).map(([cat,count])=>(
         <div key={cat} className="flex justify-between border-b pb-1">
           <span>{cat}</span>
           <span className="font-semibold">{count}</span>
         </div>
       ))}
     </div>

   </div>

  </div>
 )
}