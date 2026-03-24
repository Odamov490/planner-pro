import {useState,useContext} from "react";
import {TaskContext} from "../context/TaskContext";
import TaskCard from "../components/TaskCard";

export default function Tasks(){
 const [title,setTitle]=useState("");
 const {tasks,addTask,deleteTask,toggleTask}=useContext(TaskContext);

 return (
  <div>
   <h1 className="text-2xl font-bold mb-4">Tasks</h1>

   <div className="flex gap-2 mb-4">
    <input className="border p-2 rounded w-full" value={title}
     onChange={(e)=>setTitle(e.target.value)} placeholder="New task..."/>
    <button className="bg-blue-500 text-white px-4 rounded"
     onClick={()=>{addTask(title);setTitle("")}}>Add</button>
   </div>

   <div className="space-y-3">
    {tasks.map(t=>(
     <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask}/>
    ))}
   </div>
  </div>
 )
}
