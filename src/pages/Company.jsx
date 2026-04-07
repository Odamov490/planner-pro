import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

function Company() {
  const { user } = useContext(AuthContext);

  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");

  // 📥 Load companies
  const loadCompanies = useCallback(() => {
    if (!user) return;

    const q = query(
      collection(db, "companies"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCompanies(data);
    });

    return unsub;
  }, [user]);

  useEffect(() => {
    const unsub = loadCompanies();
    return () => unsub && unsub();
  }, [loadCompanies]);

  // ➕ Add company
  const addCompany = async () => {
    if (!name.trim()) return;

    await addDoc(collection(db, "companies"), {
      name,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    setName("");
  };

  return (
    <div className="p-5 text-white">
      <h1 className="text-2xl font-bold mb-4">🏢 Company</h1>

      {/* ADD */}
      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Company name..."
          className="px-3 py-2 text-black rounded w-64"
        />
        <button
          onClick={addCompany}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-2">
        {companies.map((c) => (
          <div
            key={c.id}
            className="bg-gray-800 px-3 py-2 rounded"
          >
            {c.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Company;