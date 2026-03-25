import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Login(){

  const { login, register, loginWithGoogle } = useContext(AuthContext);

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

  const handleLogin = async () => {
    try {
      await login(email,password);
    } catch {
      alert("Login xato ❌");
    }
  };

  const handleRegister = async () => {
    try {
      await register(email,password);
      alert("Ro‘yxatdan o‘tdingiz ✅");
    } catch {
      alert("Xatolik ❌");
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

        {/* LOGIN */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-2 rounded hover:scale-105 transition"
        >
          Login
        </button>

        {/* REGISTER */}
        <button
          onClick={handleRegister}
          className="w-full bg-green-500 text-white py-2 rounded hover:scale-105 transition"
        >
          Register
        </button>

        {/* GOOGLE LOGIN */}
        <button
          onClick={loginWithGoogle}
          className="w-full bg-red-500 text-white py-2 rounded flex items-center justify-center gap-2 hover:scale-105 transition"
        >
          🔴 Google orqali kirish
        </button>

      </div>

    </div>
  );
}