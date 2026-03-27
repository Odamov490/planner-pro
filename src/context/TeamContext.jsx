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
  arrayUnion,
  arrayRemove,
  deleteDoc,
  getDocs
} from "firebase/firestore";

export const TeamContext = createContext();

export function TeamProvider({ children }) {

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    const unsubAuth = auth.onAuthStateChanged((user) => {

      if (!user) {
        setTeams([]);
        return;
      }

      const q = query(
        collection(db, "teams"),
        where("members", "array-contains", user.uid)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {

        let data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 🔥 SORT (yangilari tepada)
        data = data.sort((a,b)=> b.created?.seconds - a.created?.seconds);

        setTeams(data);
        setLoading(false);
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

  // ✏️ RENAME
  const renameTeam = async (id, name) => {
    await updateDoc(doc(db, "teams", id), { name });
  };

  // ❌ DELETE TEAM
  const deleteTeam = async (id) => {
    await deleteDoc(doc(db, "teams", id));
  };

  // 👤 ADD MEMBER BY EMAIL
  const addMemberByEmail = async (teamId, email) => {
    const snap = await getDocs(collection(db, "users"));

    const userDoc = snap.docs.find(d => d.data().email === email);

    if (!userDoc) return alert("User topilmadi ❌");

    await updateDoc(doc(db, "teams", teamId), {
      members: arrayUnion(userDoc.data().uid)
    });

    alert("Qo‘shildi ✅");
  };

  // ❌ REMOVE MEMBER
  const removeMember = async (teamId, userId) => {
    await updateDoc(doc(db, "teams", teamId), {
      members: arrayRemove(userId)
    });
  };

  // 📊 COUNT
  const totalTeams = teams.length;

  return (
    <TeamContext.Provider value={{
      teams,
      loading,
      totalTeams,

      createTeam,
      renameTeam,
      deleteTeam,

      addMemberByEmail,
      removeMember
    }}>
      {children}
    </TeamContext.Provider>
  );
}