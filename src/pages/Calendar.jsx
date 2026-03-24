import {useContext} from "react";
import {TaskContext} from "../context/TaskContext";

export default function Calendar(){
 const {tasks}=useContext(TaskContext);

 return (
  <div>
   <h1 className="text-2xl font-bold mb-4">Kalendar</h1>
   <div className="grid grid-cols-3 gap-4">
    {tasks.map(t=>(
     <div key={t.id} className="bg-white p-3 rounded shadow">
      <p>{t.title}</p>
      <small>{t.date}</small>
     </div>
    ))}
   </div>
  </div>
 )
}
