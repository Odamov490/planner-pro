import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { db, auth } from "../firebase";
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, where, writeBatch, serverTimestamp, getDoc
} from "firebase/firestore";

export const TaskContext = createContext();

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const dedupe = (arr) =>
  arr.filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);

const sortNew = (arr) =>
  [...arr].sort((a, b) => {
    const ta = a.created?.toDate?.() ?? new Date(a.created ?? 0);
    const tb = b.created?.toDate?.() ?? new Date(b.created ?? 0);
    return tb - ta;
  });

const MAX_UNDO = 20;

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════
export function TaskProvider({ children }) {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Undo stack
  const undoStack = useRef([]);
  const pushUndo = (action) => {
    undoStack.current = [action, ...undoStack.current].slice(0, MAX_UNDO);
  };

  // ══════════════════════════════════════════════════════════════
  // REALTIME LISTENER — muammo tuzatildi
  //
  // Muammo nima edi?
  //   incomingData va outgoingData closure ichida "let" bilan
  //   e'lon qilingan. Har safar onAuthStateChanged ishlaganda
  //   yangi scope yaratiladi va eski o'zgaruvchilar yo'qoladi.
  //   Lekin onSnapshot callbacklari eski scope'dagi o'zgaruvchilarga
  //   murojaat qiladi — bu "stale closure" muammosi.
  //   Natijada merge() ba'zan bo'sh array'ni ko'radi.
  //
  // Yechim:
  //   useRef bilan closure'dan mustaqil xotira saqlaymiz.
  //   Ref obyektiga yozilgan qiymat hamma snapshot'da bir xil.
  // ══════════════════════════════════════════════════════════════
  const storeRef = useRef({ incoming: [], outgoing: [], team: [] });

  useEffect(() => {
    const subs = [];   // barcha unsubscribe funksiyalar

    const rebuild = () => {
      const { incoming, outgoing, team } = storeRef.current;
      const merged = dedupe([...incoming, ...outgoing, ...team]);
      setTasks(sortNew(merged));
      setLoading(false);
    };

    const unsubAuth = auth.onAuthStateChanged((user) => {
      // Eski listenerlarni bekor qilish
      subs.forEach(fn => fn());
      subs.length = 0;
      storeRef.current = { incoming: [], outgoing: [], team: [] };

      if (!user) {
        setTasks([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      // ── 1. Menga topshirilgan vazifalar ──
      subs.push(
        onSnapshot(
          query(collection(db, "tasks"), where("assignedTo", "==", user.uid)),
          (snap) => {
            storeRef.current.incoming = snap.docs.map(d => ({
              id: d.id, ...d.data(), direction: "incoming",
            }));
            rebuild();
          },
          (err) => console.error("incoming listener:", err)
        )
      );

      // ── 2. Men yaratgan vazifalar ──
      subs.push(
        onSnapshot(
          query(collection(db, "tasks"), where("userId", "==", user.uid)),
          (snap) => {
            storeRef.current.outgoing = snap.docs.map(d => ({
              id: d.id, ...d.data(), direction: "outgoing",
            }));
            rebuild();
          },
          (err) => console.error("outgoing listener:", err)
        )
      );

      // ── 3. Jamoa vazifalarim ──
      // teamMemberIds array'da user.uid bo'lgan vazifalar
      subs.push(
        onSnapshot(
          query(collection(db, "tasks"), where("teamMemberIds", "array-contains", user.uid)),
          (snap) => {
            storeRef.current.team = snap.docs.map(d => ({
              id: d.id, ...d.data(), direction: "team",
            }));
            rebuild();
          },
          (err) => console.error("team listener:", err)
        )
      );
    });

    return () => {
      unsubAuth();
      subs.forEach(fn => fn());
    };
  }, []);

  // ══════════════════════════════════════════════════════════════
  // ➕ ADD TASK
  // ══════════════════════════════════════════════════════════════
  const addTask = useCallback(async ({
    title,
    date          = "",
    priority      = "medium",
    category      = "",
    assignedTo    = null,
    assignedEmail = null,
    teamId        = null,    // NEW: jamoa ID
    teamName      = null,    // NEW: jamoa nomi
    teamMemberIds = [],      // NEW: jamoa a'zolari UID'lari
    note          = "",
    tags          = [],
    repeat        = "none",
    reminderAt    = null,
    color         = "",
  } = {}) => {
    if (!title?.trim()) return null;
    const user = auth.currentUser;
    if (!user) return null;

    const toUid   = assignedTo    ?? user.uid;
    const toEmail = assignedEmail ?? user.email;

    // Jamoa vazifasida barcha a'zolar + creator qo'shiladi
    const allMemberIds = teamId
      ? [...new Set([...teamMemberIds, user.uid])]
      : [user.uid, toUid].filter(Boolean);

    const docRef = await addDoc(collection(db, "tasks"), {
      title:          title.trim(),
      date,
      priority,
      category,
      note,
      tags,
      repeat,
      reminderAt,
      color,
      completed:      false,
      completedAt:    null,
      archived:       false,
      pinned:         false,
      subtasks:       [],
      attachments:    [],
      viewCount:      0,
      userId:         user.uid,
      createdByEmail: user.email,
      assignedTo:     toUid,
      assignedEmail:  toEmail,
      teamId:         teamId   ?? null,
      teamName:       teamName ?? null,
      teamMemberIds:  [...new Set(allMemberIds)],
      created:        serverTimestamp(),
      updatedAt:      serverTimestamp(),
    });

    // Notification — boshqaga yoki jamoaga topshirilganda
    if (teamId) {
      // Jamoa a'zolariga bildirishnoma
      const notifList = teamMemberIds.filter(uid => uid !== user.uid);
      await Promise.all(notifList.map(uid =>
        addDoc(collection(db, "notifications"), {
          userId:    uid,
          fromEmail: user.email,
          taskId:    docRef.id,
          teamId,
          teamName,
          text:      `${user.email} "${teamName}" jamoasiga vazifa berdi: "${title.trim()}"`,
          type:      "team_task",
          read:      false,
          created:   serverTimestamp(),
        })
      ));
    } else if (toUid !== user.uid) {
      await addDoc(collection(db, "notifications"), {
        userId:    toUid,
        fromEmail: user.email,
        taskId:    docRef.id,
        text:      `${user.email} sizga vazifa berdi: "${title.trim()}"`,
        type:      "task_assigned",
        read:      false,
        created:   serverTimestamp(),
      });
    }

    pushUndo({ type: "ADD", taskId: docRef.id });
    return docRef.id;
  }, []);

  // ── addTasks (bulk) ──
  const addTasks = useCallback(async (list) => {
    return Promise.all(list.map(item => addTask(item)));
  }, [addTask]);

  // ══════════════════════════════════════════════════════════════
  // CRUD
  // ══════════════════════════════════════════════════════════════
  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const nowDone = !task.completed;
    pushUndo({ type: "TOGGLE", taskId: id, was: task.completed });
    await updateDoc(doc(db, "tasks", id), {
      completed:   nowDone,
      completedAt: nowDone ? serverTimestamp() : null,
      updatedAt:   serverTimestamp(),
    });
  }, [tasks]);

  const deleteTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    pushUndo({ type: "DELETE", snapshot: task });
    await deleteDoc(doc(db, "tasks", id));
  }, [tasks]);

  const deleteTasks = useCallback(async (ids) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, "tasks", id)));
    await batch.commit();
  }, []);

  const completeTasks = useCallback(async (ids) => {
    const batch = writeBatch(db);
    ids.forEach(id => batch.update(doc(db, "tasks", id), {
      completed:   true,
      completedAt: serverTimestamp(),
      updatedAt:   serverTimestamp(),
    }));
    await batch.commit();
  }, []);

  const editTask = useCallback(async (id, newTitle) => {
    if (!newTitle?.trim()) return;
    const task = tasks.find(t => t.id === id);
    pushUndo({ type: "EDIT", taskId: id, was: task?.title });
    await updateDoc(doc(db, "tasks", id), {
      title:     newTitle.trim(),
      updatedAt: serverTimestamp(),
    });
  }, [tasks]);

  const updateTask = useCallback(async (id, fields = {}) => {
    await updateDoc(doc(db, "tasks", id), {
      ...fields,
      updatedAt: serverTimestamp(),
    });
  }, []);

  const pinTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await updateDoc(doc(db, "tasks", id), {
      pinned:    !task.pinned,
      updatedAt: serverTimestamp(),
    });
  }, [tasks]);

  const archiveTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await updateDoc(doc(db, "tasks", id), {
      archived:  !task.archived,
      updatedAt: serverTimestamp(),
    });
  }, [tasks]);

  const duplicateTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const { id: _id, created, completedAt, direction, ...rest } = task;
    return addTask({ ...rest, title: rest.title + " (nusxa)" });
  }, [tasks, addTask]);

  // ── UNDO ──
  const undo = useCallback(async () => {
    const action = undoStack.current.shift();
    if (!action) return;
    if (action.type === "ADD")
      await deleteDoc(doc(db, "tasks", action.taskId));
    if (action.type === "DELETE" && action.snapshot) {
      const { id, direction, ...rest } = action.snapshot;
      await addDoc(collection(db, "tasks"), rest);
    }
    if (action.type === "TOGGLE") {
      const task = tasks.find(t => t.id === action.taskId);
      if (task) await updateDoc(doc(db, "tasks", action.taskId), {
        completed: action.was, completedAt: action.was ? serverTimestamp() : null,
      });
    }
    if (action.type === "EDIT")
      await updateDoc(doc(db, "tasks", action.taskId), { title: action.was });
  }, [tasks]);

  const canUndo = undoStack.current.length > 0;

  // ── SUBTASKS ──
  const addSubtask = useCallback(async (taskId, text) => {
    if (!text?.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = [...(task.subtasks ?? []), {
      id: Date.now(), text: text.trim(), completed: false, createdAt: Date.now(),
    }];
    await updateDoc(doc(db, "tasks", taskId), { subtasks: updated, updatedAt: serverTimestamp() });
  }, [tasks]);

  const toggleSubtask = useCallback(async (taskId, subId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = (task.subtasks ?? []).map(s =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    await updateDoc(doc(db, "tasks", taskId), { subtasks: updated, updatedAt: serverTimestamp() });
  }, [tasks]);

  const deleteSubtask = useCallback(async (taskId, subId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await updateDoc(doc(db, "tasks", taskId), {
      subtasks:  (task.subtasks ?? []).filter(s => s.id !== subId),
      updatedAt: serverTimestamp(),
    });
  }, [tasks]);

  const editSubtask = useCallback(async (taskId, subId, newText) => {
    if (!newText?.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = (task.subtasks ?? []).map(s =>
      s.id === subId ? { ...s, text: newText.trim() } : s
    );
    await updateDoc(doc(db, "tasks", taskId), { subtasks: updated, updatedAt: serverTimestamp() });
  }, [tasks]);

  const reorderSubtasks = useCallback(async (taskId, newOrder) => {
    await updateDoc(doc(db, "tasks", taskId), { subtasks: newOrder, updatedAt: serverTimestamp() });
  }, []);

  // ── TAGS ──
  const addTag = useCallback(async (taskId, tag) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !tag?.trim()) return;
    const tags = [...new Set([...(task.tags ?? []), tag.trim()])];
    await updateDoc(doc(db, "tasks", taskId), { tags, updatedAt: serverTimestamp() });
  }, [tasks]);

  const removeTag = useCallback(async (taskId, tag) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await updateDoc(doc(db, "tasks", taskId), {
      tags: (task.tags ?? []).filter(t => t !== tag),
      updatedAt: serverTimestamp(),
    });
  }, [tasks]);

  const allTags = [...new Set(tasks.flatMap(t => t.tags ?? []))].sort();

  // ── STATS ──
  const todayStr = new Date().toISOString().split("T")[0];
  const stats = {
    total:        tasks.filter(t => !t.archived).length,
    done:         tasks.filter(t => t.completed && !t.archived).length,
    active:       tasks.filter(t => !t.completed && !t.archived).length,
    pinned:       tasks.filter(t => t.pinned).length,
    overdue:      tasks.filter(t => !t.completed && t.date && t.date < todayStr).length,
    today:        tasks.filter(t => t.date === todayStr && !t.completed).length,
    highPriority: tasks.filter(t => t.priority === "high" && !t.completed).length,
    incoming:     tasks.filter(t => t.direction === "incoming").length,
    outgoing:     tasks.filter(t => t.direction === "outgoing").length,
    team:         tasks.filter(t => t.direction === "team").length,
    percent:      tasks.length
      ? Math.round(tasks.filter(t => t.completed).length / tasks.length * 100)
      : 0,
    byCategory: tasks.reduce((acc, t) => {
      const c = t.category || "Boshqa";
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    }, {}),
    byPriority: {
      high:   tasks.filter(t => t.priority === "high").length,
      medium: tasks.filter(t => t.priority === "medium").length,
      low:    tasks.filter(t => t.priority === "low").length,
    },
  };

  return (
    <TaskContext.Provider value={{
      tasks, loading, stats, allTags, canUndo,
      addTask, addTasks,
      toggleTask, deleteTask, deleteTasks, completeTasks,
      editTask, updateTask,
      pinTask, archiveTask, duplicateTask, undo,
      addSubtask, toggleSubtask, deleteSubtask, editSubtask, reorderSubtasks,
      addTag, removeTag,
    }}>
      {children}
    </TaskContext.Provider>
  );
}
