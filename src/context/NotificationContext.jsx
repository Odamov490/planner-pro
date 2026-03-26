import { createContext, useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc
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

      // 🔥 ORDERBY OLIB TASHLANDI (index muammo yo‘q)
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

        // 🔥 FRONTEND SORT (ENG YANGILARI TEPADA)
        data = data.sort((a, b) => {
          const aTime = a.created?.seconds || 0;
          const bTime = b.created?.seconds || 0;
          return bTime - aTime;
        });

        console.log("NOTIFICATIONS:", data); // 🔥 debug

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