import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "123456",
  appId: "123456"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
