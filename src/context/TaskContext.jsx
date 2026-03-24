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

  const getUserId = () => {
    let id = localStorage.getItem("userId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("userId", id);
    }
    return id;
  };

  const userId = getUserId();

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
      localStorage.setItem("tasks", JSON.stringify(data));
    });

    return () => unsubscribe();

  }, [userId]);

  // ➕ ADD
  const addTask = async (title, date, priority, category) => {
    if (!title) return;

    await addDoc(collection(db, "tasks"), {
      title,
      date,
      priority,
      category,
      completed: false,
      userId,
      subtasks: [],
      created: new Date()
    });
  };

  // 🔁 TOGGLE
  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    await updateDoc(doc(db, "tasks", id), {
      completed: !task.completed
    });
  };

  // ❌ DELETE
  const deleteTask = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  // ✏️ EDIT TASK
  const editTask = async (id, newTitle) => {
    if (!newTitle.trim()) return;

    await updateDoc(doc(db, "tasks", id), {
      title: newTitle
    });
  };

  // ➕ ADD SUBTASK
  const addSubtask = async (taskId, text) => {
    if (!text.trim()) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updated = [
      ...(task.subtasks || []),
      { id: Date.now(), text, completed: false }
    ];

    await updateDoc(doc(db, "tasks", taskId), {
      subtasks: updated
    });
  };

  // 🔁 TOGGLE SUBTASK
  const toggleSubtask = async (taskId, subId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updated = (task.subtasks || []).map(s =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );

    await updateDoc(doc(db, "tasks", taskId), {
      subtasks: updated
    });
  };

  // ❌ DELETE SUBTASK
  const deleteSubtask = async (taskId, subId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updated = (task.subtasks || []).filter(s => s.id !== subId);

    await updateDoc(doc(db, "tasks", taskId), {
      subtasks: updated
    });
  };

  // ✏️ EDIT SUBTASK
  const editSubtask = async (taskId, subId, newText) => {
    if (!newText.trim()) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updated = (task.subtasks || []).map(s =>
      s.id === subId ? { ...s, text: newText } : s
    );

    await updateDoc(doc(db, "tasks", taskId), {
      subtasks: updated
    });
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      toggleTask,
      deleteTask,
      editTask,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      editSubtask
    }}>
      {children}
    </TaskContext.Provider>
  );
}