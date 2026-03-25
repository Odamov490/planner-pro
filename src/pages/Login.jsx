import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Login(){

  const { login, register, loginWithGoogle } = useContext(AuthContext);

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);

  const handleLogin = async () => {
    if(!email || !password) return alert("Email va password kiriting");

    try {
      setLoading(true);
      await login(email,password);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if(!email || !password) return alert("Email va password kiriting");

    try {
      setLoading(true);
      await register(email,password);
      alert("Ro‘yxatdan o‘tdingiz ✅");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-indigo-200">

      <div className="bg-white p-8 rounded-2xl shadow-xl w-80 space-y-4">

        <h1 className="text-2xl font-bold text-center text-blue-600">
          🔐 Login
        </h1>

        <input
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          {loading ? "Kuting..." : "Login"}
        </button>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 rounded"
        >
          Register
        </button>

        <button
          onClick={loginWithGoogle}
          className="w-full bg-red-500 text-white py-2 rounded"
        >
          🔴 Google orqali kirish
        </button>

      </div>

    </div>
  );
}