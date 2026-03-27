import { createContext, useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  arrayUnion
} from "firebase/firestore";

export const TeamContext = createContext();

export function TeamProvider({ children }) {

  const [teams, setTeams] = useState([]);

  useEffect(() => {

    let unsubscribe;

    const unsubAuth = auth.onAuthStateChanged((user) => {

      if (!user) return;

      const q = query(
        collection(db, "teams"),
        where("members", "array-contains", user.uid)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTeams(data);
      });

    });

    return () => {
      if (unsubscribe) unsubscribe();
      unsubAuth();
    };

  }, []);

  // ➕ CREATE TEAM
  const createTeam = async (name) => {
    const user = auth.currentUser;
    if (!user || !name) return;

    await addDoc(collection(db, "teams"), {
      name,
      ownerId: user.uid,
      members: [user.uid],
      created: new Date()
    });
  };

  // 👤 ADD MEMBER
  const addMember = async (teamId, userId) => {
    await updateDoc(doc(db, "teams", teamId), {
      members: arrayUnion(userId)
    });
  };

  return (
    <TeamContext.Provider value={{
      teams,
      createTeam,
      addMember
    }}>
      {children}
    </TeamContext.Provider>
  );
}