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
    <div className="max-w-5xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-3">

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            🔔 Bildirishnomalar
          </h1>
          <p className="text-sm text-gray-400">
            Barcha yangilanishlar va topshiriqlar
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2 flex-wrap">

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition shadow"
            >
              Hammasini o‘qildi
            </button>
          )}

          <button
            onClick={deleteReadNotifications}
            className="px-4 py-2 bg-yellow-100 text-yellow-700 text-sm rounded-lg hover:bg-yellow-200 transition"
          >
            O‘qilganlarni o‘chirish
          </button>

          <button
            onClick={deleteAllNotifications}
            className="px-4 py-2 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition"
          >
            Hammasini tozalash
          </button>

        </div>

      </div>

      {/* STATS */}
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">

        <p className="text-sm text-gray-500">
          Jami: <span className="font-semibold">{notifications.length}</span>
        </p>

        <p className="text-sm text-gray-500">
          O‘qilmagan: <span className="font-semibold text-blue-600">{unreadCount}</span>
        </p>

      </div>

      {/* EMPTY */}
      {notifications.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <p className="text-gray-400 text-lg">🔕 Bildirishnoma yo‘q</p>
          <p className="text-sm text-gray-300 mt-1">
            Sizga kelgan barcha xabarlar shu yerda chiqadi
          </p>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-3">

        {notifications.map(n => (
          <div
            key={n.id}
            className={`p-4 rounded-xl shadow flex justify-between items-center transition hover:shadow-lg

            ${n.read 
              ? "bg-gray-50" 
              : "bg-blue-50 border-l-4 border-blue-500"
            }`}
          >

            {/* TEXT */}
            <div className="flex-1">

              <p className={`text-sm ${!n.read && "font-semibold text-gray-800"}`}>
                {n.text}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {n.created?.seconds
                  ? new Date(n.created.seconds * 1000).toLocaleString()
                  : ""}
              </p>

            </div>

            {/* ACTION */}
            <div className="flex items-center gap-2">

              {!n.read && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  Yangi
                </span>
              )}

              {!n.read && (
                <button
                  onClick={()=>markAsRead(n.id)}
                  className="text-blue-500 text-sm hover:underline"
                >
                  O‘qildi
                </button>
              )}

            </div>

          </div>
        ))}

      </div>

      {/* FOOTER */}
      {unreadCount > 0 && (
        <div className="text-center text-xs text-gray-400">
          Sizda {unreadCount} ta yangi bildirishnoma bor
        </div>
      )}

    </div>
  );
}

    {/* tugadi */}