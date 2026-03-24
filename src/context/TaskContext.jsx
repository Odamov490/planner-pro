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

  // 🔥 localStorage (saqlab qolamiz)
  const [tasks, setTasks] = useState(
    () => JSON.parse(localStorage.getItem("tasks")) || []
  );

  // 🔥 USER ID
  const getUserId = () => {
    let id = localStorage.getItem("userId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("userId", id);
    }
    return id;
  };

  const userId = getUserId();

  // 🔄 Firebase realtime (asosiy source)
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
      localStorage.setItem("tasks", JSON.stringify(data)); // backup
    });

    return () => unsubscribe();

  }, [userId]);

  // ➕ ADD TASK (Firebase + local backup)
  const addTask = async (title, date, priority, category) => {
    if (!title) return;

    const newTask = {
      title,
      date,
      priority,
      category,
      completed: false,
      userId: userId,
      created: new Date()
    };

    // Firebase
    await addDoc(collection(db, "tasks"), newTask);

    // Local fallback (tez chiqishi uchun)
    setTasks(prev => [...prev, { id: Date.now(), ...newTask }]);
  };

  // 🔁 TOGGLE
  const toggleTask = async (id) => {

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      // Firebase update
      await updateDoc(doc(db, "tasks", id), {
        completed: !task.completed
      });
    } catch {
      // fallback (agar local id bo‘lsa)
      setTasks(tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
    }
  };

  // ❌ DELETE
  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      toggleTask,
      deleteTask
    }}>
      {children}
    </TaskContext.Provider>
  );
}