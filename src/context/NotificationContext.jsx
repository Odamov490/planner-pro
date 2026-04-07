import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { db, auth } from "../firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, writeBatch,
  serverTimestamp, orderBy,
} from "firebase/firestore";

export const NotificationContext = createContext();

export const NOTIF_TYPES = {
  task_assigned:  { icon:"📋", label:"Yangi vazifa",    color:"#6366f1", bg:"#eef2ff" },
  task_completed: { icon:"✅", label:"Bajarildi",        color:"#16a34a", bg:"#f0fdf4" },
  task_overdue:   { icon:"⚠️", label:"Muddati o'tdi",   color:"#ef4444", bg:"#fef2f2" },
  team_invite:    { icon:"👥", label:"Jamoa taklifi",    color:"#f59e0b", bg:"#fffbeb" },
  team_task:      { icon:"🏢", label:"Jamoa vazifasi",   color:"#8b5cf6", bg:"#f5f3ff" },
  task_accepted:  { icon:"👍", label:"Qabul qilindi",    color:"#0ea5e9", bg:"#f0f9ff" },
  task_rejected:  { icon:"👎", label:"Rad etildi",       color:"#dc2626", bg:"#fff5f5" },
  comment:        { icon:"💬", label:"Yangi izoh",       color:"#0284c7", bg:"#e0f2fe" },
  reminder:       { icon:"⏰", label:"Eslatma",          color:"#f97316", bg:"#fff7ed" },
  system:         { icon:"🔔", label:"Tizim xabari",     color:"#6b7280", bg:"#f9fafb" },
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    let unsub = null;
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (unsub) unsub();
      if (!user) { setNotifications([]); setLoading(false); return; }
      setLoading(true);
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("created", "desc")
      );
      unsub = onSnapshot(q, snap => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, () => setLoading(false));
    });
    return () => { unsubAuth(); if (unsub) unsub(); };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback(async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true, readAt: serverTimestamp() });
  }, []);

  const markAllAsRead = useCallback(async () => {
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n =>
      batch.update(doc(db, "notifications", n.id), { read: true, readAt: serverTimestamp() })
    );
    await batch.commit();
  }, [notifications]);

  const deleteNotification = useCallback(async (id) => {
    await deleteDoc(doc(db, "notifications", id));
  }, []);

  const deleteReadNotifications = useCallback(async () => {
    const batch = writeBatch(db);
    notifications.filter(n => n.read).forEach(n => batch.delete(doc(db, "notifications", n.id)));
    await batch.commit();
  }, [notifications]);

  const deleteAllNotifications = useCallback(async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => batch.delete(doc(db, "notifications", n.id)));
    await batch.commit();
  }, [notifications]);

  const sendNotification = useCallback(async ({
    userId, type = "system", text,
    taskId = null, teamId = null, teamName = null,
  }) => {
    if (!userId || !text) return;
    await addDoc(collection(db, "notifications"), {
      userId, fromEmail: auth.currentUser?.email || "",
      fromUid: auth.currentUser?.uid || "",
      type, text, taskId, teamId, teamName,
      read: false, created: serverTimestamp(),
    });
  }, []);

  const stats = {
    total:  notifications.length,
    unread: unreadCount,
    read:   notifications.length - unreadCount,
    byType: notifications.reduce((acc, n) => ({ ...acc, [n.type]: (acc[n.type] || 0) + 1 }), {}),
  };

  return (
    <NotificationContext.Provider value={{
      notifications, loading, unreadCount, stats, NOTIF_TYPES,
      markAsRead, markAllAsRead,
      deleteNotification, deleteReadNotifications, deleteAllNotifications,
      sendNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
