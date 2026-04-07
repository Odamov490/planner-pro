import { createContext, useState, useEffect } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // 🔹 demo uchun boshlang‘ich data
  useEffect(() => {
    const demo = [
      {
        id: 1,
        text: "Yangi topshiriq qo‘shildi",
        read: false,
        created: { seconds: Date.now() / 1000 },
      },
      {
        id: 2,
        text: "Hisobot muvaffaqiyatli saqlandi",
        read: true,
        created: { seconds: Date.now() / 1000 - 5000 },
      },
    ];
    setNotifications(demo);
  }, []);

  // 🔹 unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // 🔹 bitta o‘qildi qilish
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // 🔹 hammasini o‘qildi
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  // 🔹 faqat o‘qilganlarni o‘chirish
  const deleteReadNotifications = () => {
    setNotifications(prev =>
      prev.filter(n => !n.read)
    );
  };

  // 🔹 hammasini o‘chirish
  const deleteAllNotifications = () => {
    setNotifications([]);
  };

  // 🔹 yangi notification qo‘shish (bonus)
  const addNotification = (text) => {
    const newItem = {
      id: Date.now(),
      text,
      read: false,
      created: { seconds: Date.now() / 1000 },
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