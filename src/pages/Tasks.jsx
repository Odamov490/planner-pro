import { createContext, useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

export const TaskContext = createContext();

export function TaskProvider({ children }) {

  const [tasks, setTasks] = useState([]);

  // 🔥 USER ID (HAR USER UCHUN ALOHIDA)
  const getUserId = () => {
    let id = localStorage.getItem("userId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("userId", id);
    }
    return id;
  };

  const userId = getUserId();

  // 📥 FAqat o‘z tasklarini olish
  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });

    return () => unsub();
  }, []);

  // ➕ ADD TASK
  const addTask = async (title, date, priority, category) => {
    await addDoc(collection(db, "tasks"), {
      title,
      date,
      priority,
      category,
      completed: false,
      userId: userId, // 🔥 MUHIM
      created: new Date()
    });
  };

  // ❌ DELETE
  const deleteTask = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  // 🔁 TOGGLE
  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);

    await updateDoc(doc(db, "tasks", id), {
      completed: !task.completed
    });
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }}>
      {children}
    </TaskContext.Provider>
  );
}