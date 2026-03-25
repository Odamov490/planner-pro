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

 // 🔥 SUBTASK
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

 // 🔥 DATE
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
  <div className="space-y-8">

   {/* HEADER */}
   <div>
     <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
       📊 Dashboard
     </h1>
     <p className="text-gray-500">AI Planner Analytics</p>
   </div>

   {/* CARDS */}
   <div className="grid md:grid-cols-4 gap-6">

     <Card title="Jami" value={tasks.length} color="from-blue-500 to-indigo-500"/>
     <Card title="Bajarilgan" value={done} color="from-green-400 to-green-600"/>
     <Card title="Bajarilmagan" value={active} color="from-red-400 to-red-600"/>
     <Card title="Progress" value={`${tasks.length ? Math.round((done/tasks.length)*100) : 0}%`} color="from-purple-400 to-purple-600"/>

   </div>

   {/* PROGRESS */}
   <GlassCard title="Task progress">
     <Progress percent={tasks.length ? (done/tasks.length)*100 : 0} color="bg-blue-500"/>
     <p className="text-sm text-gray-500 mt-2">{done}/{tasks.length}</p>
   </GlassCard>

   {/* SUBTASK */}
   <GlassCard title="Subtask progress">
     <Progress percent={subPercent} color="bg-green-500"/>
     <p className="text-sm text-gray-500 mt-2">{doneSub}/{totalSub}</p>
   </GlassCard>

   {/* CHARTS */}
   <div className="grid md:grid-cols-2 gap-6">

     {/* PIE */}
     <GlassCard title="Priority taqsimoti">
       <ResponsiveContainer width="100%" height={250}>
         <PieChart>
           <Pie data={pieData} dataKey="value" outerRadius={80}>
             {pieData.map((_,i)=>(
               <Cell key={i} fill={COLORS[i]} />
             ))}
           </Pie>
           <Tooltip/>
         </PieChart>
       </ResponsiveContainer>
     </GlassCard>

     {/* CATEGORY */}
     <GlassCard title="Kategoriya">
       <ResponsiveContainer width="100%" height={250}>
         <BarChart data={categoryData}>
           <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
           <XAxis dataKey="name" stroke="#6b7280"/>
           <YAxis stroke="#6b7280"/>
           <Tooltip/>
           <Bar dataKey="value" fill="#3b82f6" radius={[6,6,0,0]}/>
         </BarChart>
       </ResponsiveContainer>
     </GlassCard>

   </div>

   {/* ACTIVITY */}
   <GlassCard title="Kunlik aktivlik">
     <ResponsiveContainer width="100%" height={250}>
       <BarChart data={dateData}>
         <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
         <XAxis dataKey="date" stroke="#6b7280"/>
         <YAxis stroke="#6b7280"/>
         <Tooltip/>
         <Bar dataKey="count" fill="#22c55e" radius={[6,6,0,0]}/>
       </BarChart>
     </ResponsiveContainer>
   </GlassCard>

  </div>
 )
}

/* 💎 COMPONENTS */

function Card({title,value,color}){
 return (
  <div className={`p-6 rounded-2xl text-white shadow-lg bg-gradient-to-r ${color}`}>
    <p className="text-sm opacity-80">{title}</p>
    <h2 className="text-3xl font-bold">{value}</h2>
  </div>
 );
}

function GlassCard({title,children}){
 return (
  <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/40">
    <h2 className="font-semibold mb-3">{title}</h2>
    {children}
  </div>
 );
}

function Progress({percent,color}){
 return (
  <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
    <div
      className={`${color} h-4 transition-all`}
      style={{width:`${percent}%`}}
    />
  </div>
 );
}