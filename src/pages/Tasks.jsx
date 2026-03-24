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

  // 🔥 HAR USER UCHUN ALOHIDA ID
  const getUserId = () => {
    let id = localStorage.getItem("userId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("userId", id);
    }
    return id;
  };

  const userId = getUserId();

  // 📥 FAQAT O‘Z TASKLARINI OLISH
  useEffect(() => {

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(data);
    });

    return () => unsubscribe();

  }, [userId]);

  // ➕ ADD TASK
  const addTask = async (title, date, priority, category) => {
    try {
      await addDoc(collection(db, "tasks"), {
        title,
        date,
        priority,
        category,
        completed: false,
        userId: userId, // 🔥 MUHIM
        created: new Date()
      });
    } catch (err) {
      console.error("Add error:", err);
    }
  };

  // ❌ DELETE TASK
  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // 🔁 TOGGLE TASK
  const toggleTask = async (id) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      await updateDoc(doc(db, "tasks", id), {
        completed: !task.completed
      });
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        deleteTask,
        toggleTask
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}