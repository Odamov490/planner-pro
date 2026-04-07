import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

export default function Notifications() {
  const context = useContext(NotificationContext);

  // 🔒 PROTECTION (white screen oldini oladi)
  if (!context) {
    return (
      <div className="text-center p-10 text-red-500">
        Context topilmadi
      </div>
    );
  }

  const {
    notifications = [],
    markAsRead = () => {},
    markAllAsRead = () => {},
    deleteReadNotifications = () => {},
    deleteAllNotifications = () => {},
    unreadCount = 0,
  } = context;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">🔔 Bildirishnomalar</h1>

        <div className="flex gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Hammasini o‘qildi
            </button>
          )}

          <button
            onClick={deleteReadNotifications}
            className="bg-yellow-200 px-3 py-1 rounded"
          >
            O‘qilganlarni o‘chirish
          </button>

          <button
            onClick={deleteAllNotifications}
            className="bg-red-200 px-3 py-1 rounded"
          >
            Tozalash
          </button>
        </div>
      </div>

      {/* EMPTY */}
      {notifications.length === 0 && (
        <div className="text-center text-gray-400">
          Bildirishnoma yo‘q
        </div>
      )}

      {/* LIST */}
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`p-3 rounded shadow flex justify-between items-center
          ${n.read ? "bg-gray-100" : "bg-blue-100"}`}
        >
          <div>
            <p className={!n.read ? "font-bold" : ""}>
              {n.text || "Matn yo‘q"}
            </p>

            <p className="text-xs text-gray-500">
              {n.created?.seconds
                ? new Date(n.created.seconds * 1000).toLocaleString()
                : ""}
            </p>
          </div>

          {!n.read && (
            <button
              onClick={() => markAsRead(n.id)}
              className="text-blue-600"
            >
              O‘qildi
            </button>
          )}
        </div>
      ))}

      {/* FOOTER */}
      {unreadCount > 0 && (
        <p className="text-center text-sm text-gray-500">
          {unreadCount} ta yangi bildirishnoma
        </p>
      )}
    </div>
  );
}