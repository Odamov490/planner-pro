import {useContext} from "react";
import {TaskContext} from "../context/TaskContext";

export default function Dashboard(){
 const {tasks}=useContext(TaskContext);
 const done=tasks.filter(t=>t.completed).length;

 return (
  <div>
   <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
   <div className="grid grid-cols-2 gap-4">
    <div className="bg-white p-4 rounded shadow">Jami: {tasks.length}</div>
    <div className="bg-white p-4 rounded shadow">Bajarildi: {done}</div>
   </div>
  </div>
 )
}
