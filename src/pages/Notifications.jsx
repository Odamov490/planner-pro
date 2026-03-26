import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

export default function Notifications(){

  const { 
    notifications, 
    markAsRead, 
    markAllAsRead,
    deleteReadNotifications,
    deleteAllNotifications,
    unreadCount
  } = useContext(NotificationContext);

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h1 className="text-3xl font-bold text-blue-600">
          🔔 Bildirishnomalar
        </h1>

        {/* ACTIONS */}
        <div className="flex gap-2 flex-wrap">

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm bg-blue-100 px-3 py-1 rounded-lg hover:bg-blue-200 transition"
            >
              Hammasini o‘qildi
            </button>
          )}

          <button
            onClick={deleteReadNotifications}
            className="text-sm bg-yellow-100 px-3 py-1 rounded-lg hover:bg-yellow-200 transition"
          >
            O‘qilganlarni o‘chirish
          </button>

          <button
            onClick={deleteAllNotifications}
            className="text-sm bg-red-100 px-3 py-1 rounded-lg hover:bg-red-200 transition"
          >
            Hammasini o‘chirish
          </button>

        </div>
      </div>

      {/* EMPTY */}
      {notifications.length === 0 && (
        <p className="text-gray-400 text-center mt-10">
          Bildirishnoma yo‘q
        </p>
      )}

      {/* LIST */}
      <div className="space-y-3">

        {notifications.map(n => (
          <div
            key={n.id}
            className={`p-4 rounded-xl shadow flex justify-between items-center transition
            ${n.read 
              ? "bg-gray-100" 
              : "bg-blue-50 border-l-4 border-blue-500"
            }`}
          >

            <div>
              <p className="text-sm">{n.text}</p>

              <p className="text-xs text-gray-400 mt-1">
                {n.created?.seconds
                  ? new Date(n.created.seconds * 1000).toLocaleString()
                  : ""}
              </p>
            </div>

            {!n.read && (
              <button
                onClick={()=>markAsRead(n.id)}
                className="text-blue-500 text-sm hover:underline"
              >
                O‘qildi
              </button>
            )}

          </div>
        ))}

      </div>

      {/* FOOTER */}
      {unreadCount > 0 && (
        <p className="text-xs text-gray-400">
          {unreadCount} ta o‘qilmagan
        </p>
      )}

    </div>
  );
}