import { createContext, useState, useEffect } from "react";
import { db, auth } from "../firebase";
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

  useEffect(() => {

    let unsubIncoming = null;
    let unsubOutgoing = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {

      // ❌ logout
      if (!user) {
        setTasks([]);
        if (unsubIncoming) unsubIncoming();
        if (unsubOutgoing) unsubOutgoing();
        return;
      }

      // 🔵 MENGA BERILGAN
      const qIncoming = query(
        collection(db, "tasks"),
        where("assignedTo", "==", user.uid)
      );

      // 🟡 MEN BERGAN
      const qOutgoing = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid)
      );

      // eski listenerlarni tozalash
      if (unsubIncoming) unsubIncoming();
      if (unsubOutgoing) unsubOutgoing();

      // 📥 incoming
      unsubIncoming = onSnapshot(qIncoming, (snapshot) => {
        const dataIncoming = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: "incoming"
        }));

        setTasks(prev => {
          const outgoing = prev.filter(t => t.type === "outgoing");
          return [...outgoing, ...dataIncoming];
        });
      });

      // 📤 outgoing
      unsubOutgoing = onSnapshot(qOutgoing, (snapshot) => {
        const dataOutgoing = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: "outgoing"
        }));

        setTasks(prev => {
          const incoming = prev.filter(t => t.type === "incoming");
          return [...incoming, ...dataOutgoing];
        });
      });

    });

    return () => {
      unsubscribeAuth();
      if (unsubIncoming) unsubIncoming();
      if (unsubOutgoing) unsubOutgoing();
    };

  }, []);

  // ➕ ADD TASK
  const addTask = async (title, date, priority, category, assignedUser=null) => {

    if (!title) return;

    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "tasks"), {
      title,
      date,
      priority,
      category,
      completed: false,

      userId: user.uid, // kim yaratdi
      createdByEmail: user.email, // 🔥 kim berdi

      assignedTo: assignedUser || user.uid, // kimga berildi

      subtasks: [],
      created: new Date()
    });
  };

  // 🔁 TOGGLE TASK
  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    await updateDoc(doc(db, "tasks", id), {
      completed: !task.completed
    });
  };

  // ❌ DELETE TASK
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
      {
        id: Date.now(),
        text,
        completed: false
      }
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
      s.id === subId
        ? { ...s, completed: !s.completed }
        : s
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
      s.id === subId
        ? { ...s, text: newText }
        : s
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