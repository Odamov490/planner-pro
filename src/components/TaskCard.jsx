import {motion} from "framer-motion";

export default function TaskCard({task,onToggle,onDelete}){
 return (
  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
   className="flex justify-between items-center bg-white p-4 rounded shadow">
   <div className="flex items-center gap-3">
    <input type="checkbox" checked={task.completed} onChange={()=>onToggle(task.id)}/>
    <span className={task.completed?"line-through text-gray-400":""}>
      {task.title}
    </span>
   </div>
   <button onClick={()=>onDelete(task.id)} className="text-red-500">O‘chirish</button>
  </motion.div>
 )
}
