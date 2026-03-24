import {createContext,useState,useEffect} from "react";
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export const TaskContext=createContext();

export function TaskProvider({children}){
 const [tasks,setTasks]=useState([]);

 useEffect(()=>{
  const unsub = onSnapshot(collection(db,"tasks"),(snapshot)=>{
    setTasks(snapshot.docs.map(doc=>({
      id:doc.id,
      ...doc.data()
    })))
  })
  return ()=>unsub()
 },[])

 const addTask = async (title,date,priority,category)=>{
  await addDoc(collection(db,"tasks"),{
    title,
    date,
    priority,
    category,
    completed:false,
    created:new Date()
  })
 }

 const deleteTask = async (id)=>{
  await deleteDoc(doc(db,"tasks",id))
 }

 const toggleTask = async (id)=>{
  const task = tasks.find(t=>t.id===id)
  await updateDoc(doc(db,"tasks",id),{
    completed: !task.completed
  })
 }

 return (
  <TaskContext.Provider value={{tasks,addTask,deleteTask,toggleTask}}>
    {children}
  </TaskContext.Provider>
 )
}
