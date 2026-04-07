import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCVm4VznQRFwTg-8WHnSNPcF2gfGtDETLI",
  authDomain: "planner-pro-2b9bb.firebaseapp.com",
  projectId: "planner-pro-2b9bb",
  storageBucket: "planner-pro-2b9bb.firebasestorage.app",
  messagingSenderId: "137649098638",
  appId: "1:137649098638:web:6ab3b6c4523d0604021edf"
};

const app = initializeApp(firebaseConfig);

// 🔥 DATABASE
export const db = getFirestore(app);

// 🔥 AUTH
export const auth = getAuth(app);

// 🔥 GOOGLE PROVIDER
export const provider = new GoogleAuthProvider();


export const storage = getStorage(app);