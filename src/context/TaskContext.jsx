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

      if (!user) {
        setTasks([]);
        if (unsubIncoming) unsubIncoming();
        if (unsubOutgoing) unsubOutgoing();
        return;
      }

      const qIncoming = query(
        collection(db, "tasks"),
        where("assignedTo", "==", user.uid)
      );

      const qOutgoing = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid)
      );

      if (unsubIncoming) unsubIncoming();
      if (unsubOutgoing) unsubOutgoing();

      let incomingData = [];
      let outgoingData = [];

      const merge = () => {
        const merged = [...incomingData, ...outgoingData];

        // 🔥 duplicate remove
        const unique = merged.filter(
          (v, i, arr) => arr.findIndex(x => x.id === v.id) === i
        );

        // 🔥 sort (new first)
        unique.sort((a, b) => new Date(b.created) - new Date(a.created));

        setTasks(unique);
      };

      // 📥 incoming
      unsubIncoming = onSnapshot(qIncoming, (snapshot) => {
        incomingData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: "incoming"
        }));
        merge();
      });

      // 📤 outgoing
      unsubOutgoing = onSnapshot(qOutgoing, (snapshot) => {
        outgoingData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: "outgoing"
        }));
        merge();
      });

    });

    return () => {
      unsubscribeAuth();
      if (unsubIncoming) unsubIncoming();
      if (unsubOutgoing) unsubOutgoing();
    };

  }, []);

  // ➕ ADD TASK
  const addTask = async (title, date, priority, category, assignedUser=null, assignedEmail=null) => {

    if (!title) return;

    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "tasks"), {
      title,
      date,
      priority,
      category,
      completed: false,

      userId: user.uid,
      createdByEmail: user.email,

      assignedTo: assignedUser || user.uid,
      assignedEmail: assignedEmail || user.email, // 🔥 MUHIM

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

  // ✏️ EDIT
  const editTask = async (id, newTitle) => {
    if (!newTitle.trim()) return;

    await updateDoc(doc(db, "tasks", id), {
      title: newTitle
    });
  };

  // ➕ SUBTASK
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

  // 🔁 SUB TOGGLE
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

  // ❌ SUB DELETE
  const deleteSubtask = async (taskId, subId) => {

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updated = (task.subtasks || []).filter(s => s.id !== subId);

    await updateDoc(doc(db, "tasks", taskId), {
      subtasks: updated
    });
  };

  // ✏️ SUB EDIT
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