import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { db, auth } from "../firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, writeBatch,
  serverTimestamp, orderBy, getDocs,
} from "firebase/firestore";

export const NotificationContext = createContext();

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION TYPES — tizim bo'ylab standartlashtirilgan
// ═══════════════════════════════════════════════════════════════
export const NOTIF_TYPES = {
  task_assigned:  { icon: "📋", label: "Yangi vazifa",      color: "#6366f1" },
  task_completed: { icon: "✅", label: "Vazifa bajarildi",   color: "#22c55e" },
  task_overdue:   { icon: "⚠️", label: "Muddati o'tdi",     color: "#ef4444" },
  team_invite:    { icon: "👥", label: "Jamoa taklifi",      color: "#f59e0b" },
  team_task:      { icon: "🏢", label: "Jamoa vazifasi",     color: "#8b5cf6" },
  task_accepted:  { icon: "👍", label: "Qabul qilindi",      color: "#16a34a" },
  task_rejected:  { icon: "👎", label: "Rad etildi",         color: "#dc2626" },
  comment:        { icon: "💬", label: "Yangi izoh",         color: "#0ea5e9" },
  reminder:       { icon: "⏰", label: "Eslatma",            color: "#f97316" },
  system:         { icon: "🔔", label: "Tizim xabari",       color: "#6b7280" },
};

// ═══════════════════════════════════════════════════════════════
// EMAIL via EmailJS (free plan: 200 email/oy)
// emailjs.com da ro'yxatdan o'tib, SERVICE_ID, TEMPLATE_ID,
// PUBLIC_KEY ni .env ga yozing:
//   VITE_EMAILJS_SERVICE_ID=service_xxx
//   VITE_EMAILJS_TEMPLATE_ID=template_xxx
//   VITE_EMAILJS_PUBLIC_KEY=xxx
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

  // ── COMPUTED ──
  const unreadCount = notifications.filter(n => !n.read).length;

  // ─── MARK ONE AS READ ──
  const markAsRead = useCallback(async (id) => {
    await updateDoc(doc(db, "notifications", id), {
      read: true, readAt: serverTimestamp(),
    });
  }, []);

  // ─── MARK ALL AS READ ──
  const markAllAsRead = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, "notifications", n.id), {
        read: true, readAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }, [notifications]);

  // ─── DELETE ONE ──
  const deleteNotification = useCallback(async (id) => {
    await deleteDoc(doc(db, "notifications", id));
  }, []);

  // ─── DELETE READ ──
  const deleteReadNotifications = useCallback(async () => {
    const batch = writeBatch(db);
    notifications.filter(n => n.read).forEach(n => {
      batch.delete(doc(db, "notifications", n.id));
    });
    await batch.commit();
  }, [notifications]);

  // ─── DELETE ALL ──
  const deleteAllNotifications = useCallback(async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => batch.delete(doc(db, "notifications", n.id)));
    await batch.commit();
  }, [notifications]);

  // ─── SEND NOTIFICATION (boshqa user'ga) + email ──
  const sendNotification = useCallback(async ({
    userId,          // qabul qiluvchi uid
    userEmail,       // qabul qiluvchi email (email yuborish uchun)
    type = "system", // NOTIF_TYPES kalit
    text,
    taskId   = null,
    teamId   = null,
    teamName = null,
    sendEmail = false, // email ham yuborsinmi?
    emailSubject = null,
  }) => {
    if (!userId || !text) return;

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

    // Email yuborish
    if (sendEmail && userEmail) {
      const cfg = NOTIF_TYPES[type] || NOTIF_TYPES.system;
      await sendEmailNotification({
        toEmail:  userEmail,
        subject:  emailSubject || `${cfg.icon} ${cfg.label} — Planner`,
        message:  text,
        fromName: auth.currentUser?.email?.split("@")[0] || "Planner",
      });
    }
  }, []);

  // ─── MARK SINGLE BY TYPE READ ──
  const markTypeAsRead = useCallback(async (type) => {
    const batch = writeBatch(db);
    notifications
      .filter(n => n.type === type && !n.read)
      .forEach(n => batch.update(doc(db, "notifications", n.id), { read: true, readAt: serverTimestamp() }));
    await batch.commit();
  }, [notifications]);

  // ─── STATS ──
  const stats = {
    total:    notifications.length,
    unread:   unreadCount,
    read:     notifications.length - unreadCount,
    byType:   notifications.reduce((acc, n) => {
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

// Convenience hook
export const useNotifications = () => useContext(NotificationContext);
