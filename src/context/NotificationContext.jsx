import { createContext, useState, useEffect } from "react";

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // 🔹 demo data (test uchun)
  useEffect(() => {
    const demo = [
      {
        id: 1,
        text: "Yangi topshiriq qo‘shildi",
        read: false,
        created: { seconds: Math.floor(Date.now() / 1000) },
      },
      {
        id: 2,
        text: "Hisobot saqlandi",
        read: true,
        created: { seconds: Math.floor(Date.now() / 1000) - 5000 },
      },
    ];

    setNotifications(demo);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteReadNotifications = () => {
    setNotifications(prev =>
      prev.filter(n => !n.read)
    );
  };

  const deleteAllNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (text) => {
    const newItem = {
      id: Date.now(),
      text,
      read: false,
      created: { seconds: Math.floor(Date.now() / 1000) },
    };

    setNotifications(prev => [newItem, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteReadNotifications,
        deleteAllNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};