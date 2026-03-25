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
        await saveUser(currentUser); // 🔥 MUHIM
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔐 EMAIL LOGIN
  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    await saveUser(res.user);
    return res;
  };

  // 🆕 REGISTER
  const register = async (email, password) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await saveUser(res.user);
    return res;
  };

  // 🔴 GOOGLE LOGIN
  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, provider);
    await saveUser(res.user); // 🔥 MUHIM
    return res;
  };

  // 🚪 LOGOUT
  const logout = () => {
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