import { createContext, useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  orderBy
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
        where("userId", "==", user.uid),
        orderBy("created", "desc")
      );

      if (unsubscribe) unsubscribe();

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setNotifications(data);
      });

    });

    return () => {
      unsubscribeAuth();
      if (unsubscribe) unsubscribe();
    };

  }, []);

  // 🔥 BIRTA O‘QILDI
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

  return (
    <NotificationContext.Provider value={{
      notifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}