import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../firebase";
import { updateProfile, signOut } from "firebase/auth";

function Settings() {
  const { user } = useContext(AuthContext);

  const [name, setName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);

  // ✅ Profilni yangilash
  const updateUser = async () => {
    try {
      setLoading(true);
      await updateProfile(auth.currentUser, {
        displayName: name,
      });
      alert("Saqlandi ✅");
    } catch (e) {
      alert("Xatolik ❌");
    } finally {
      setLoading(false);
    }
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="p-6 text-white max-w-xl">
      <h1 className="text-2xl font-bold mb-6">⚙️ Sozlamalar</h1>

      {/* PROFILE */}
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">👤 Profil</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ismingiz..."
          className="w-full p-2 rounded text-black mb-2"
        />

        <button
          onClick={updateUser}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          {loading ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </div>

      {/* INFO */}
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">📧 Email</h2>
        <p className="text-gray-300">{user?.email}</p>
      </div>

      {/* LOGOUT */}
      <div className="bg-gray-800 p-4 rounded">
        <h2 className="font-semibold mb-2">🚪 Hisob</h2>

        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded"
        >
          Chiqish
        </button>
      </div>
    </div>
  );
}

export default Settings;