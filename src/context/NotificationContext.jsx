import { createContext, useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc
} from "firebase/firestore";

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {

    let unsubscribe = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {

      if (!user) {
        setNotifications([]);
        if (unsubscribe) unsubscribe();
        return;
      }

      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid)
      );

      if (unsubscribe) unsubscribe();

      unsubscribe = onSnapshot(q, (snapshot) => {

        let data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 🔥 SORT (ENG YANGI TEPADA)
        data = data.sort((a, b) => {
          const aTime = a.created?.seconds || 0;
          const bTime = b.created?.seconds || 0;
          return bTime - aTime;
        });

        console.log("NOTIFICATIONS:", data);

        setNotifications(data);
      });

    });

    return () => {
      unsubscribeAuth();
      if (unsubscribe) unsubscribe();
    };

  }, []);

  // 🔥 BITTA O‘QILDI
  const markAsRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), {
      read: true
    });
  };

  // 🔥 HAMMASINI O‘QILDI
  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);

    for (let n of unread) {
      await updateDoc(doc(db, "notifications", n.id), {
        read: true
      });
    }
  };

  // 🗑 FAQAT O‘QILGANLARNI O‘CHIRISH
  const deleteReadNotifications = async () => {
    const readOnes = notifications.filter(n => n.read);

    for (let n of readOnes) {
      await deleteDoc(doc(db, "notifications", n.id));
    }
  };

  // 🗑 HAMMASINI O‘CHIRISH
  const deleteAllNotifications = async () => {
    for (let n of notifications) {
      await deleteDoc(doc(db, "notifications", n.id));
    }
  };

  // 🔄 REFRESH (UI TRIGGER)
  const refreshNotifications = () => {
    setNotifications(prev => [...prev]);
  };

  // 📊 COUNTLAR (PRO LEVEL)
  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      markAsRead,
      markAllAsRead,

      deleteReadNotifications,   // 🗑в
      deleteAllNotifications,    // 🗑 

      refreshNotifications,      // 🔄

      unreadCount,               // 📊
      readCount                  // 📊
    }}>
      {children}
    </NotificationContext.Provider>
  );
}// 🗑в