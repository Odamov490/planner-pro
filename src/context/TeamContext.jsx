import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { db, auth } from "../firebase";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, arrayUnion, arrayRemove,
  serverTimestamp, getDoc, getDocs, writeBatch
} from "firebase/firestore";

export const TeamContext = createContext();

// ═══════════════════════════════════════════════════════════════
// TEAM ROLES
// ═══════════════════════════════════════════════════════════════
export const ROLES = {
  owner:  { label:"Egasi",     color:"#f59e0b", bg:"#fffbeb" },
  admin:  { label:"Admin",     color:"#6366f1", bg:"#eff6ff" },
  member: { label:"A'zo",      color:"#22c55e", bg:"#f0fdf4" },
  viewer: { label:"Kuzatuvchi",color:"#9ca3af", bg:"#f9fafb" },
};

export function TeamProvider({ children }) {
  const [teams,   setTeams]   = useState([]);
  const [loading, setLoading] = useState(true);

  // ── REALTIME ──
  useEffect(() => {
    let unsub = null;
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (unsub) unsub();
      if (!user) { setTeams([]); setLoading(false); return; }
      setLoading(true);

      // Teams where user is a member (memberIds array contains uid)
      const q = query(
        collection(db, "teams"),
        where("memberIds", "array-contains", user.uid)
      );

      unsub = onSnapshot(q, snap => {
        setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    });

    return () => { unsubAuth(); if (unsub) unsub(); };
  }, []);

  // ── CREATE TEAM ──
  const createTeam = useCallback(async ({ name, description="", color="#6366f1", icon="👥" }) => {
    if (!name?.trim()) return null;
    const user = auth.currentUser;
    if (!user) return null;

    const ref = await addDoc(collection(db, "teams"), {
      name:        name.trim(),
      description: description.trim(),
      color,
      icon,
      ownerId:     user.uid,
      ownerEmail:  user.email,
      memberIds:   [user.uid],
      members: [{
        uid:         user.uid,
        email:       user.email,
        displayName: user.displayName || user.email?.split("@")[0],
        role:        "owner",
        joinedAt:    new Date().toISOString(),
        avatar:      user.photoURL || null,
      }],
      tasks:       [],
      pinnedMsg:   "",
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    });

    return ref.id;
  }, []);

  // ── RENAME TEAM ──
  const renameTeam = useCallback(async (teamId, newName, description) => {
    if (!newName?.trim()) return;
    const upd = { name: newName.trim(), updatedAt: serverTimestamp() };
    if (description !== undefined) upd.description = description;
    await updateDoc(doc(db, "teams", teamId), upd);
  }, []);

  // ── UPDATE TEAM ──
  const updateTeam = useCallback(async (teamId, fields) => {
    await updateDoc(doc(db, "teams", teamId), { ...fields, updatedAt: serverTimestamp() });
  }, []);

  // ── DELETE TEAM ──
  const deleteTeam = useCallback(async (teamId) => {
    const user = auth.currentUser;
    if (!user) return;
    const team = teams.find(t => t.id === teamId);
    if (team?.ownerId !== user.uid) return; // only owner
    await deleteDoc(doc(db, "teams", teamId));
  }, [teams]);

  // ── ADD MEMBER BY EMAIL ──
  const addMemberByEmail = useCallback(async (teamId, email, role="member") => {
    if (!email?.trim()) return { ok:false, msg:"Email kiriting" };
    const team = teams.find(t => t.id === teamId);
    if (!team) return { ok:false, msg:"Jamoa topilmadi" };

    // Check already member
    if (team.members?.some(m => m.email === email.trim())) {
      return { ok:false, msg:"Bu foydalanuvchi allaqachon a'zo" };
    }

    // Find user in "users" collection
    const q    = query(collection(db, "users"), where("email", "==", email.trim()));
    const snap = await getDocs(q);
    if (snap.empty) return { ok:false, msg:"Foydalanuvchi topilmadi" };

    const userData = snap.docs[0].data();
    const newMember = {
      uid:         userData.uid || snap.docs[0].id,
      email:       userData.email,
      displayName: userData.displayName || userData.email?.split("@")[0],
      role,
      joinedAt:    new Date().toISOString(),
      avatar:      userData.photoURL || null,
    };

    await updateDoc(doc(db, "teams", teamId), {
      members:   arrayUnion(newMember),
      memberIds: arrayUnion(newMember.uid),
      updatedAt: serverTimestamp(),
    });

    // Notification
    await addDoc(collection(db, "notifications"), {
      userId:    newMember.uid,
      fromEmail: auth.currentUser?.email,
      type:      "team_invite",
      text:      `${auth.currentUser?.email} sizni "${team.name}" jamoasiga qo'shdi`,
      read:      false,
      created:   serverTimestamp(),
    });

    return { ok:true, msg:`${email} qo'shildi` };
  }, [teams]);

  // ── REMOVE MEMBER ──
  const removeMember = useCallback(async (teamId, memberUid) => {
    const user = auth.currentUser;
    if (!user) return;
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    // Only owner or admin can remove; can't remove owner
    const me = team.members?.find(m => m.uid === user.uid);
    if (!me || (me.role !== "owner" && me.role !== "admin")) return;

    const toRemove = team.members?.find(m => m.uid === memberUid);
    if (!toRemove || toRemove.role === "owner") return;

    await updateDoc(doc(db, "teams", teamId), {
      members:   arrayRemove(toRemove),
      memberIds: arrayRemove(memberUid),
      updatedAt: serverTimestamp(),
    });
  }, [teams]);

  // ── CHANGE ROLE ──
  const changeRole = useCallback(async (teamId, memberUid, newRole) => {
    const user = auth.currentUser;
    if (!user) return;
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    const me = team.members?.find(m => m.uid === user.uid);
    if (me?.role !== "owner") return;

    const updatedMembers = (team.members || []).map(m =>
      m.uid === memberUid ? { ...m, role: newRole } : m
    );
    await updateDoc(doc(db, "teams", teamId), {
      members:   updatedMembers,
      updatedAt: serverTimestamp(),
    });
  }, [teams]);

  // ── LEAVE TEAM ──
  const leaveTeam = useCallback(async (teamId) => {
    const user = auth.currentUser;
    if (!user) return;
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    if (team.ownerId === user.uid) return; // owner can't leave, must delete

    const me = team.members?.find(m => m.uid === user.uid);
    if (!me) return;

    await updateDoc(doc(db, "teams", teamId), {
      members:   arrayRemove(me),
      memberIds: arrayRemove(user.uid),
      updatedAt: serverTimestamp(),
    });
  }, [teams]);

  // ── PIN MESSAGE ──
  const pinMessage = useCallback(async (teamId, msg) => {
    await updateDoc(doc(db, "teams", teamId), {
      pinnedMsg: msg,
      updatedAt: serverTimestamp(),
    });
  }, []);

  // ── STATS per team ──
  const getTeamStats = useCallback(async (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return null;
    const q    = query(collection(db, "tasks"), where("teamId", "==", teamId));
    const snap = await getDocs(q);
    const tks  = snap.docs.map(d => d.data());
    return {
      total:    tks.length,
      done:     tks.filter(t=>t.completed).length,
      overdue:  tks.filter(t=>!t.completed&&t.date&&t.date<new Date().toISOString().split("T")[0]).length,
      members:  team.members?.length || 0,
    };
  }, [teams]);

  const currentUser = auth.currentUser;

  return (
    <TeamContext.Provider value={{
      teams, loading, currentUser,
      createTeam, renameTeam, updateTeam, deleteTeam,
      addMemberByEmail, removeMember, changeRole,
      leaveTeam, pinMessage, getTeamStats,
      ROLES,
    }}>
      {children}
    </TeamContext.Provider>
  );
}
