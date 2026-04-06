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
  <div className="space-y-8">

   {/* HEADER */}
   <div>
     <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
       📊 Dashboard
     </h1>
     <p className="text-gray-500">Umumiy statistik ma’lumotlar</p>
   </div>

   {/* 🔥 STATS CARDS */}
   <div className="grid md:grid-cols-4 gap-4">

     <StatCard title="Jami vazifalar" value={tasks.length}/>
     <StatCard title="Bajarilgan" value={done} color="text-green-500"/>
     <StatCard title="Bajarilmagan" value={active} color="text-red-500"/>
     <StatCard 
       title="Progress" 
       value={`${tasks.length ? Math.round((done/tasks.length)*100) : 0}%`} 
     />

   </div>

   {/* 📊 PROGRESS BAR */}
   <GlassCard title="Umumiy bajarilish">
     <Progress percent={tasks.length ? (done/tasks.length)*100 : 0} color="bg-blue-500"/>
     <p className="mt-2 text-sm text-gray-500">{done} / {tasks.length}</p>
   </GlassCard>

   {/* 🔥 SUBTASK PROGRESS */}
   <GlassCard title="Subtask progress">
     <Progress percent={subPercent} color="bg-green-500"/>
     <p className="mt-2 text-sm text-gray-500">{doneSub} / {totalSub}</p>
   </GlassCard>

   {/* 🔥 PRIORITY CARDS */}
   <div className="grid md:grid-cols-3 gap-4">

     <StatCard title="🔴 Yuqori" value={high}/>
     <StatCard title="🟡 O‘rta" value={medium}/>
     <StatCard title="🟢 Past" value={low}/>

   </div>

   {/* 📊 CHARTS */}
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

   {/* 🔥 ACTIVITY */}
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

   {/* 🔥 CATEGORY LIST (ESKI KODING QAYTDI) */}
   <GlassCard title="📂 Kategoriyalar">

     {Object.keys(categories).length===0 && (
       <p className="text-gray-400">Ma’lumot yo‘q</p>
     )}

     <div className="space-y-2">
       {Object.entries(categories).map(([cat,count])=>(
         <div key={cat} className="flex justify-between border-b pb-1">
           <span>{cat}</span>
           <span className="font-semibold">{count}</span>
         </div>
       ))}
     </div>

   </GlassCard>

  </div>
 )
}

/* COMPONENTS */

function StatCard({title,value,color=""}){
 return (
  <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
    <p className="text-gray-500 text-sm">{title}</p>
    <h2 className={`text-2xl font-bold ${color}`}>{value}</h2>
  </div>
 );
}

function GlassCard({title,children}){
 return (
  <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/40">
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