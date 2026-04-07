import { createContext, useEffect, useState } from "react";
import { auth, provider, db } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { logActivity, LOG_ACTIONS } from "../utils/logActivity";

export const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 💾 USERNI FIRESTOREGA SAQLASH
  const saveUser = async (user) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: new Date()
      }, { merge: true });
    } catch (err) {
      console.error("User saqlashda xato:", err);
    }
  };

  // 🔥 USER HOLATINI KUZATISH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await saveUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🔐 EMAIL LOGIN
  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    await saveUser(res.user);
    await logActivity({ action: LOG_ACTIONS.LOGIN, detail: "Email orqali kirdi", page: "login" });
    return res;
  };

  // 🆕 REGISTER
  const register = async (email, password) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await saveUser(res.user);
    await logActivity({ action: LOG_ACTIONS.LOGIN, detail: "Yangi hisob yaratdi", page: "login" });
    return res;
  };

  // 🔴 GOOGLE LOGIN
  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, provider);
    await saveUser(res.user);
    await logActivity({ action: LOG_ACTIONS.LOGIN, detail: "Google orqali kirdi", page: "login" });
    return res;
  };

  // 🚪 LOGOUT — logActivity signOut DAN OLDIN
  const logout = async () => {
    await logActivity({ action: LOG_ACTIONS.LOGOUT, detail: "Tizimdan chiqdi", page: "login" });
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      loginWithGoogle,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
