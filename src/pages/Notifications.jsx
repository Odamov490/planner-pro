import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

export default function Notifications(){

  const { notifications, markAsRead } = useContext(NotificationContext);

  const unread = notifications.filter(n => !n.read);

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-blue-600">
        🔔 Bildirishnomalar
      </h1>

      {/* EMPTY */}
      {notifications.length === 0 && (
        <p className="text-gray-400">Bildirishnoma yo‘q</p>
      )}

      {/* LIST */}
      <div className="space-y-3">

        {notifications.map(n => (
          <div
            key={n.id}
            className={`p-4 rounded-xl shadow flex justify-between items-center transition
            ${n.read ? "bg-gray-100" : "bg-blue-50 border-l-4 border-blue-500"}`}
          >

            <div>
              <p className="text-sm">{n.text}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.created?.seconds * 1000).toLocaleString()}
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
      {unread.length > 0 && (
        <p className="text-xs text-gray-400">
          {unread.length} ta o‘qilmagan
        </p>
      )}

    </div>
  );
}