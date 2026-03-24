import {useState,useContext} from "react";
import {TaskContext} from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import {notify} from "../utils/notify";

export default function Tasks(){
 const [title,setTitle]=useState("");
 const [date,setDate]=useState("");
 const {tasks,addTask,toggleTask,deleteTask}=useContext(TaskContext);

 const handleAdd=()=>{
  addTask(title,date);
  notify("Yangi vazifa qo‘shildi");
  setTitle(""); setDate("");
 };

 return (
  <div>
   <h1 className="text-2xl font-bold mb-4">Vazifalar</h1>

   <div className="flex gap-2 mb-4">
    <input className="border p-2 rounded w-full" value={title}
     onChange={e=>setTitle(e.target.value)} placeholder="Vazifa..."/>
    <input type="date" value={date} onChange={e=>setDate(e.target.value)}
     className="border p-2 rounded"/>
    <button onClick={handleAdd}
     className="bg-blue-500 text-white px-4 rounded">Qo‘shish</button>
   </div>

   <div className="space-y-3">
    {tasks.map(t=>(
     <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask}/>
    ))}
   </div>
  </div>
 )
}
