import {createContext,useState,useEffect} from "react";

export const TaskContext=createContext();

export function TaskProvider({children}){
 const [tasks,setTasks]=useState(()=>JSON.parse(localStorage.getItem("tasks"))||[]);

 useEffect(()=>{localStorage.setItem("tasks",JSON.stringify(tasks))},[tasks]);

 const addTask=(title,date)=>{
  if(!title) return;
  setTasks([...tasks,{id:Date.now(),title,date,completed:false}]);
 };

 const toggleTask=(id)=>setTasks(tasks.map(t=>t.id===id?{...t,completed:!t.completed}:t));
 const deleteTask=(id)=>setTasks(tasks.filter(t=>t.id!==id));

 return <TaskContext.Provider value={{tasks,addTask,toggleTask,deleteTask}}>
  {children}
 </TaskContext.Provider>
}
