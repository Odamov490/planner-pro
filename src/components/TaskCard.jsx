export default function TaskCard({task,onToggle,onDelete}){
 return (
  <div className="flex justify-between items-center bg-white p-4 rounded shadow">
   <div className="flex items-center gap-3">
    <input type="checkbox" checked={task.completed} onChange={()=>onToggle(task.id)}/>
    <span className={task.completed?"line-through text-gray-400":""}>{task.title}</span>
   </div>
   <button onClick={()=>onDelete(task.id)} className="text-red-500">Delete</button>
  </div>
 )
}
