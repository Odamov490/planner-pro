import { useContext } from "react";
import { TaskContext } from "../context/TaskContext";
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";

export default function Dashboard(){

 const {tasks}=useContext(TaskContext);

 const done = tasks.filter(t=>t.completed).length;
 const active = tasks.length - done;

 // 🔥 SUBTASK STATS
 let totalSub = 0;
 let doneSub = 0;

 tasks.forEach(t=>{
  if(t.subtasks){
    totalSub += t.subtasks.length;
    doneSub += t.subtasks.filter(s=>s.completed).length;
  }
 });

 const subPercent = totalSub ? Math.round((doneSub/totalSub)*100) : 0;

 // 🔥 PRIORITY
 const high = tasks.filter(t=>t.priority==="high").length;
 const medium = tasks.filter(t=>t.priority==="medium").length;
 const low = tasks.filter(t=>t.priority==="low").length;

 const pieData = [
  { name: "Yuqori", value: high },
  { name: "O‘rta", value: medium },
  { name: "Past", value: low },
 ];

 const COLORS = ["#ef4444","#facc15","#22c55e"];

 // 🔥 CATEGORY
 const categories = {};
 tasks.forEach(t=>{
  if(!t.category) return;
  categories[t.category] = (categories[t.category] || 0) + 1;
 });

 const categoryData = Object.entries(categories).map(([name,value])=>({
  name,
  value
 }));

 // 🔥 DATE ACTIVITY
 const dateStats = {};
 tasks.forEach(t=>{
  if(!t.date) return;
  dateStats[t.date] = (dateStats[t.date] || 0) + 1;
 });

 const dateData = Object.entries(dateStats).map(([date,count])=>({
  date,
  count
 }));

 return (
  <div className="space-y-6">

   {/* HEADER */}
   <div>
     <h1 className="text-3xl font-extrabold text-blue-600">
       📊 Dashboard
     </h1>
     <p className="text-gray-500">AI Planner Analytics</p>
   </div>

   {/* STATS */}
   <div className="grid md:grid-cols-4 gap-4">

     <Card title="Jami vazifa" value={tasks.length}/>
     <Card title="Bajarilgan" value={done} color="text-green-500"/>
     <Card title="Bajarilmagan" value={active} color="text-red-500"/>
     <Card 
       title="Progress" 
       value={`${tasks.length ? Math.round((done/tasks.length)*100) : 0}%`} 
     />

   </div>

   {/* PROGRESS */}
   <div className="bg-white p-5 rounded-2xl shadow">
     <p className="mb-2 font-medium">Task progress</p>

     <div className="w-full bg-gray-200 h-4 rounded-full">
       <div
         className="bg-blue-500 h-4"
         style={{width:`${tasks.length ? (done/tasks.length)*100 : 0}%`}}
       />
     </div>

     <p className="mt-2 text-sm text-gray-500">
       {done} / {tasks.length}
     </p>
   </div>

   {/* SUBTASK PROGRESS */}
   <div className="bg-white p-5 rounded-2xl shadow">
     <p className="mb-2 font-medium">Subtask progress</p>

     <div className="w-full bg-gray-200 h-4 rounded-full">
       <div
         className="bg-green-500 h-4"
         style={{width:`${subPercent}%`}}
       />
     </div>

     <p className="mt-2 text-sm text-gray-500">
       {doneSub} / {totalSub}
     </p>
   </div>

   {/* CHARTS */}
   <div className="grid md:grid-cols-2 gap-6">

     {/* PIE */}
     <div className="bg-white p-5 rounded-2xl shadow">
       <h2 className="font-semibold mb-3">Priority taqsimoti</h2>

       <ResponsiveContainer width="100%" height={250}>
         <PieChart>
           <Pie data={pieData} dataKey="value" outerRadius={80}>
             {pieData.map((entry, index)=>(
               <Cell key={index} fill={COLORS[index]} />
             ))}
           </Pie>
           <Tooltip/>
         </PieChart>
       </ResponsiveContainer>
     </div>

     {/* CATEGORY */}
     <div className="bg-white p-5 rounded-2xl shadow">
       <h2 className="font-semibold mb-3">Kategoriya</h2>

       <ResponsiveContainer width="100%" height={250}>
         <BarChart data={categoryData}>
           <CartesianGrid strokeDasharray="3 3"/>
           <XAxis dataKey="name"/>
           <YAxis/>
           <Tooltip/>
           <Bar dataKey="value" />
         </BarChart>
       </ResponsiveContainer>
     </div>

   </div>

   {/* ACTIVITY */}
   <div className="bg-white p-5 rounded-2xl shadow">
     <h2 className="font-semibold mb-3">Kunlik aktivlik</h2>

     <ResponsiveContainer width="100%" height={250}>
       <BarChart data={dateData}>
         <CartesianGrid strokeDasharray="3 3"/>
         <XAxis dataKey="date"/>
         <YAxis/>
         <Tooltip/>
         <Bar dataKey="count"/>
       </BarChart>
     </ResponsiveContainer>
   </div>

   {/* CATEGORY LIST */}
   <div className="bg-white p-5 rounded-2xl shadow">
     <h2 className="font-semibold mb-3">📂 Kategoriyalar</h2>

     <div className="space-y-2">
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

// 🔥 CARD COMPONENT
function Card({title,value,color=""}){
 return (
  <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
    <p className="text-gray-500 text-sm">{title}</p>
    <h2 className={`text-2xl font-bold ${color}`}>{value}</h2>
  </div>
 );
}