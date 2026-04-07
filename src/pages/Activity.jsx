import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

function Activity() {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "activity_logs"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(data);
    });

    return () => unsub();
  }, [user]);

  return (
    <div className="p-5 text-white">
      <h1 className="text-2xl font-bold mb-4">📊 Faoliyat logi</h1>

      <div className="flex flex-col gap-2">
        {logs.map(log => (
          <div key={log.id} className="bg-gray-800 p-3 rounded">
            <p className="text-sm">
              <b>{log.userEmail}</b> — {log.action}
            </p>
            <p className="text-xs text-gray-400">
              {log.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Activity;