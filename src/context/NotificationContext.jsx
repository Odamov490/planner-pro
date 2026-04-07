import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { db, auth } from "../firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, writeBatch,
  serverTimestamp, orderBy,
} from "firebase/firestore";

export const NotificationContext = createContext();

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION TYPES — bg field qo'shildi (Notifications.jsx uchun zarur)
// ═══════════════════════════════════════════════════════════════
export const NOTIF_TYPES = {
  task_assigned:  { icon: "📋", label: "Yangi vazifa",      color: "#6366f1", bg: "#eef2ff" },
  task_completed: { icon: "✅", label: "Vazifa bajarildi",   color: "#22c55e", bg: "#f0fdf4" },
  task_overdue:   { icon: "⚠️", label: "Muddati o'tdi",     color: "#ef4444", bg: "#fef2f2" },
  team_invite:    { icon: "👥", label: "Jamoa taklifi",      color: "#f59e0b", bg: "#fffbeb" },
  team_task:      { icon: "🏢", label: "Jamoa vazifasi",     color: "#8b5cf6", bg: "#f5f3ff" },
  task_accepted:  { icon: "👍", label: "Qabul qilindi",      color: "#16a34a", bg: "#f0fdf4" },
  task_rejected:  { icon: "👎", label: "Rad etildi",         color: "#dc2626", bg: "#fef2f2" },
  comment:        { icon: "💬", label: "Yangi izoh",         color: "#0ea5e9", bg: "#f0f9ff" },
  reminder:       { icon: "⏰", label: "Eslatma",            color: "#f97316", bg: "#fff7ed" },
  system:         { icon: "🔔", label: "Tizim xabari",       color: "#6b7280", bg: "#f9fafb" },
};

// ═══════════════════════════════════════════════════════════════
// EMAIL via EmailJS
// ═══════════════════════════════════════════════════════════════
const sendEmailNotification = async ({ toEmail, toName, subject, message, fromName = "Planner App" }) => {
  const SERVICE_ID  = import.meta.env?.VITE_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = import.meta.env?.VITE_EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY  = import.meta.env?.VITE_EMAILJS_PUBLIC_KEY;
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) return;
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:  SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id:     PUBLIC_KEY,
        template_params: {
          to_email:  toEmail,
          to_name:   toName || toEmail?.split("@")[0],
          from_name: fromName,
          subject,
          message,
          reply_to:  "noreply@planner.app",
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);

  // ── REALTIME LISTENER ──
  useEffect(() => {
    let unsub = null;
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (unsub) { unsub(); unsub = null; }
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("created", "desc")
      );
      unsub = onSnapshot(q,
        snap => {
          setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        err => {
          console.error("Notifications listener error:", err);
          setLoading(false);
        }
      );
    });
    return () => { unsubAuth(); if (unsub) unsub(); };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback(async (id) => {
    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true, readAt: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach(n =>
      batch.update(doc(db, "notifications", n.id), {
        read: true, readAt: serverTimestamp(),
      })
    );
    try { await batch.commit(); } catch (e) { console.error(e); }
  }, [notifications]);

  const deleteNotification = useCallback(async (id) => {
    try { await deleteDoc(doc(db, "notifications", id)); }
    catch (e) { console.error(e); }
  }, []);

  const deleteReadNotifications = useCallback(async () => {
    const read = notifications.filter(n => n.read);
    if (!read.length) return;
    const batch = writeBatch(db);
    read.forEach(n => batch.delete(doc(db, "notifications", n.id)));
    try { await batch.commit(); } catch (e) { console.error(e); }
  }, [notifications]);

  const deleteAllNotifications = useCallback(async () => {
    if (!notifications.length) return;
    const batch = writeBatch(db);
    notifications.forEach(n => batch.delete(doc(db, "notifications", n.id)));
    try { await batch.commit(); } catch (e) { console.error(e); }
  }, [notifications]);

  const sendNotification = useCallback(async ({
    userId,
    userEmail,
    type = "system",
    text,
    taskId    = null,
    teamId    = null,
    teamName  = null,
    sendEmail = false,
    emailSubject = null,
  }) => {
    if (!userId || !text) return;
    try {
      await addDoc(collection(db, "notifications"), {
        userId,
        fromEmail: auth.currentUser?.email || "",
        fromUid:   auth.currentUser?.uid   || "",
        type,
        text,
        taskId,
        teamId,
        teamName,
        read:    false,
        created: serverTimestamp(),
      });
      if (sendEmail && userEmail) {
        const cfg = NOTIF_TYPES[type] || NOTIF_TYPES.system;
        await sendEmailNotification({
          toEmail:  userEmail,
          subject:  emailSubject || `${cfg.icon} ${cfg.label} — Planner`,
          message:  text,
          fromName: auth.currentUser?.email?.split("@")[0] || "Planner",
        });
      }
    } catch (e) { console.error(e); }
  }, []);

  const markTypeAsRead = useCallback(async (type) => {
    const targets = notifications.filter(n => n.type === type && !n.read);
    if (!targets.length) return;
    const batch = writeBatch(db);
    targets.forEach(n =>
      batch.update(doc(db, "notifications", n.id), {
        read: true, readAt: serverTimestamp(),
      })
    );
    try { await batch.commit(); } catch (e) { console.error(e); }
  }, [notifications]);

  const stats = {
    total:  notifications.length,
    unread: unreadCount,
    read:   notifications.length - unreadCount,
    byType: notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {}),
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      loading,
      unreadCount,
      stats,
      NOTIF_TYPES,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteReadNotifications,
      deleteAllNotifications,
      sendNotification,
      markTypeAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
