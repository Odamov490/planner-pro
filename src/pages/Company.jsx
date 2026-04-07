import { useState, useEffect, useContext } from "react";
import { auth, db } from "../firebase";
import {
  doc, getDoc, setDoc, collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, serverTimestamp, query, where,
} from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import CompanyEditor from "../components/CompanyEditor";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const PROJECT_STATUSES = {
  active:    { label: "Faol",      color: "#22c55e", bg: "#f0fdf4", icon: "🟢" },
  paused:    { label: "To'xtatilgan", color: "#f59e0b", bg: "#fffbeb", icon: "🟡" },
  completed: { label: "Tugallangan", color: "#6366f1", bg: "#eff6ff", icon: "✅" },
};

const POSITION_COLORS = [
  "#6366f1","#0ea5e9","#22c55e","#f59e0b",
  "#ef4444","#ec4899","#8b5cf6","#14b8a6",
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const initials = (name) =>
  name?.split("@")[0]?.slice(0, 2)?.toUpperCase() || "??";

const fmtDate = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" });
};

const pickColor = (str) =>
  POSITION_COLORS[
    (str || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % POSITION_COLORS.length
  ];

// ═══════════════════════════════════════════════════════════════
// MINI COMPONENTS
// ═══════════════════════════════════════════════════════════════
const Avatar = ({ name, avatar, size = 36, color = "#6366f1" }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: avatar ? "transparent" : color + "25",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.35, fontWeight: 800, color,
    border: `2px solid ${color}30`, overflow: "hidden",
  }}>
    {avatar
      ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      : initials(name)}
  </div>
);

const StatusBadge = ({ status }) => {
  const s = PROJECT_STATUSES[status] || PROJECT_STATUSES.active;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 999,
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 700,
      border: `1px solid ${s.color}30`,
    }}>
      {s.icon} {s.label}
    </span>
  );
};

const Toast = ({ msg, type = "success", onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 500, padding: "11px 22px", borderRadius: 999,
      background: type === "error" ? "#fef2f2" : "#f0fdf4",
      border: `1px solid ${type === "error" ? "#fecaca" : "#bbf7d0"}`,
      color: type === "error" ? "#dc2626" : "#16a34a",
      fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      animation: "toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {type === "error" ? "✕ " : "✓ "}{msg}
    </div>
  );
};

const Modal = ({ visible, onClose, title, width = 480, children }) => {
  useEffect(() => {
    if (!visible) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [visible, onClose]);

  if (!visible) return null;
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: width,
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
        animation: "popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)",
          flexShrink: 0,
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.1)",
            background: "#f9fafb", cursor: "pointer", fontSize: 15, color: "#6b7280",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>
        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
      }}>{label}</label>
    )}
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props} style={{
    width: "100%", padding: "10px 14px",
    border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10,
    fontSize: 14, color: "#1a1a1a", background: "#fafafa",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
    transition: "border-color 0.15s",
    ...props.style,
  }}
    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
    onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
  />
);

const Btn = ({ onClick, disabled, children, variant = "primary", style: s = {} }) => {
  const variants = {
    primary: { background: "#1a1a1a", color: "#fff", border: "none" },
    outline: { background: "transparent", color: "#6b7280", border: "1px solid rgba(0,0,0,0.12)" },
    danger:  { background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" },
    success: { background: "#f0fdf4", color: "#22c55e", border: "1px solid #bbf7d0" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 18px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", fontSize: 13, fontWeight: 600,
      opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
      ...v, ...s,
    }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
    >{children}</button>
  );
};

// ═══════════════════════════════════════════════════════════════
// ADD MEMBER MODAL
// ═══════════════════════════════════════════════════════════════
const AddMemberModal = ({ visible, onClose, onAdd, companyId }) => {
  const [email,    setEmail]    = useState("");
  const [position, setPosition] = useState("");
  const [role,     setRole]     = useState("member");
  const [busy,     setBusy]     = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (email.trim().length < 2) { setSuggestions([]); return; }
    const q = email.toLowerCase();
    setSuggestions(
      allUsers.filter((u) =>
        u.email?.toLowerCase().includes(q) ||
        (u.displayName || "").toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }, [email, allUsers]);

  const handlePick = (user) => {
    setSelected(user);
    setEmail(user.email);
    setSuggestions([]);
  };

  const submit = async () => {
    const targetEmail = selected?.email || email.trim();
    if (!targetEmail || !position.trim()) return;
    setBusy(true);
    await onAdd({ email: targetEmail, position, role, user: selected });
    setBusy(false);
    setEmail(""); setPosition(""); setSelected(null);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="A'zo qo'shish" width={440}>
      <Field label="Foydalanuvchi">
        <div style={{ position: "relative" }}>
          <Input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSelected(null); }}
            placeholder="Email yoki ism yozing…"
          />
          {suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 400,
              background: "#fff", border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.13)",
              overflow: "hidden", animation: "popIn 0.15s ease",
            }}>
              {suggestions.map((u) => (
                <div
                  key={u.id}
                  onMouseDown={() => handlePick(u)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px", cursor: "pointer",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f3ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <Avatar name={u.displayName || u.email} avatar={u.photoURL} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
                      {u.displayName || u.email?.split("@")[0]}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{u.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Field>

      <Field label="Lavozim">
        <Input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Masalan: Frontend Developer"
        />
      </Field>

      <Field label="Rol">
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{
          width: "100%", padding: "10px 14px", borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.12)", fontSize: 14,
          fontFamily: "inherit", background: "#fafafa", color: "#374151",
          outline: "none", cursor: "pointer",
        }}>
          <option value="admin">Admin</option>
          <option value="member">A'zo</option>
          <option value="viewer">Kuzatuvchi</option>
        </select>
      </Field>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="outline" onClick={onClose}>Bekor</Btn>
        <Btn onClick={submit} disabled={!email.trim() || !position.trim() || busy}>
          {busy ? "Qo'shilmoqda…" : "+ Qo'shish"}
        </Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// ADD PROJECT MODAL
// ═══════════════════════════════════════════════════════════════
const AddProjectModal = ({ visible, onClose, onAdd, editData }) => {
  const [name,   setName]   = useState(editData?.name || "");
  const [desc,   setDesc]   = useState(editData?.description || "");
  const [status, setStatus] = useState(editData?.status || "active");
  const [busy,   setBusy]   = useState(false);

  useEffect(() => {
    if (editData) {
      setName(editData.name || "");
      setDesc(editData.description || "");
      setStatus(editData.status || "active");
    } else {
      setName(""); setDesc(""); setStatus("active");
    }
  }, [editData, visible]);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await onAdd({ name, description: desc, status });
    setBusy(false);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose}
      title={editData ? "Loyihani tahrirlash" : "Yangi loyiha"} width={440}>
      <Field label="Loyiha nomi">
        <Input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Masalan: Planner v2.0"
          onKeyDown={(e) => e.key === "Enter" && submit()} />
      </Field>

      <Field label="Tavsif (ixtiyoriy)">
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder="Loyiha haqida qisqacha..." rows={3}
          style={{
            width: "100%", padding: "10px 14px",
            border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10,
            fontSize: 14, fontFamily: "inherit", resize: "vertical",
            outline: "none", background: "#fafafa", boxSizing: "border-box",
          }}
        />
      </Field>

      <Field label="Holat">
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(PROJECT_STATUSES).map(([k, v]) => (
            <button key={k} onClick={() => setStatus(k)} style={{
              flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
              fontFamily: "inherit", fontSize: 12, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
              background: status === k ? v.bg : "#f3f4f6",
              color: status === k ? v.color : "#9ca3af",
              outline: status === k ? `2px solid ${v.color}40` : "none",
            }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </Field>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="outline" onClick={onClose}>Bekor</Btn>
        <Btn onClick={submit} disabled={!name.trim() || busy}>
          {busy ? "Saqlanmoqda…" : editData ? "✓ Saqlash" : "+ Yaratish"}
        </Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// MEMBER CARD
// ═══════════════════════════════════════════════════════════════
const MemberCard = ({ member, isAdmin, onRemove, onChangeRole, accentColor }) => {
  const color = pickColor(member.position);
  const isMe = member.uid === auth.currentUser?.uid;

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "16px 18px",
      border: isMe ? `1px solid ${accentColor}30` : "1px solid rgba(0,0,0,0.07)",
      background: isMe ? accentColor + "05" : "#fff",
      display: "flex", alignItems: "center", gap: 12,
      transition: "all 0.2s",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <Avatar name={member.displayName || member.email} avatar={member.avatar} size={42} color={color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: "#1a1a1a",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {member.displayName || member.email?.split("@")[0]}
          </span>
          {isMe && <span style={{ fontSize: 10, color: "#9ca3af" }}>(Siz)</span>}
          {member.role === "admin" && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: "#6366f1",
              background: "#eff6ff", padding: "1px 6px", borderRadius: 6,
              border: "1px solid #c7d2fe",
            }}>ADMIN</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: color, fontWeight: 600 }}>{member.position}</div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>{member.email}</div>
      </div>
      {isAdmin && !isMe && (
        <div style={{ display: "flex", gap: 6 }}>
          <select
            value={member.role}
            onChange={(e) => onChangeRole(member.uid, e.target.value)}
            style={{
              padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
              border: "1px solid rgba(0,0,0,0.1)", background: "#f9fafb",
              color: "#374151", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <option value="admin">Admin</option>
            <option value="member">A'zo</option>
            <option value="viewer">Kuzatuvchi</option>
          </select>
          <button onClick={() => onRemove(member.uid)} style={{
            width: 28, height: 28, borderRadius: 8, border: "none",
            background: "#fef2f2", color: "#ef4444", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>✕</button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROJECT CARD
// ═══════════════════════════════════════════════════════════════
const ProjectCard = ({ project, isAdmin, onEdit, onDelete, onStatusChange }) => {
  const s = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.active;

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "18px 20px",
      border: "1px solid rgba(0,0,0,0.07)",
      transition: "all 0.2s",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}15`;
        e.currentTarget.style.borderColor = s.color + "30";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", marginBottom: 4 }}>
            {project.name}
          </div>
          {project.description && (
            <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
              {project.description}
            </div>
          )}
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.createdAt && (
        <div style={{ fontSize: 11, color: "#d1d5db", marginBottom: 12 }}>
          📅 {fmtDate(project.createdAt)}
        </div>
      )}

      {isAdmin && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {Object.entries(PROJECT_STATUSES).map(([k, v]) => (
            k !== project.status && (
              <button key={k} onClick={() => onStatusChange(project.id, k)} style={{
                padding: "4px 10px", borderRadius: 8, border: "none",
                fontFamily: "inherit", fontSize: 10, fontWeight: 700,
                background: v.bg, color: v.color, cursor: "pointer",
                transition: "opacity 0.15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {v.icon} {v.label}
              </button>
            )
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => onEdit(project)} style={{
            width: 28, height: 28, borderRadius: 8, border: "none",
            background: "#f3f4f6", color: "#6b7280", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>✏️</button>
          <button onClick={() => onDelete(project.id)} style={{
            width: 28, height: 28, borderRadius: 8, border: "none",
            background: "#fef2f2", color: "#ef4444", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>🗑</button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Company() {
  const { currentUser } = useContext(AuthContext);
  const uid = auth.currentUser?.uid;

  // Company data
  const [company,  setCompany]  = useState(null);
  const [members,  setMembers]  = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // UI state
  const [tab,           setTab]           = useState("info");
  const [toast,         setToast]         = useState(null);
  const [showEditor,    setShowEditor]    = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddProject,setShowAddProject]= useState(false);
  const [editProject,   setEditProject]   = useState(null);
  const [search,        setSearch]        = useState("");

  const companyId = company?.id;
  const isAdmin   = members.find((m) => m.uid === uid)?.role === "admin" || company?.adminId === uid;

  // ── LOAD COMPANY ──
  useEffect(() => {
    if (!uid) return;
    const userRef = doc(db, "users", uid);
    const unsub = onSnapshot(userRef, async (snap) => {
      const cId = snap.data()?.companyId;
      if (!cId) { setLoading(false); return; }
      const cSnap = await getDoc(doc(db, "companies", cId));
      if (cSnap.exists()) setCompany({ id: cId, ...cSnap.data() });
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  // ── LOAD MEMBERS ──
  useEffect(() => {
    if (!companyId) return;
    const unsub = onSnapshot(collection(db, "companies", companyId, "members"), (snap) => {
      setMembers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [companyId]);

  // ── LOAD PROJECTS ──
  useEffect(() => {
    if (!companyId) return;
    const unsub = onSnapshot(collection(db, "companies", companyId, "projects"), (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [companyId]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── CREATE COMPANY ──
  const handleCreateCompany = async (data) => {
    const ref = await addDoc(collection(db, "companies"), {
      ...data,
      adminId: uid,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "users", uid), { companyId: ref.id });
    await setDoc(doc(db, "companies", ref.id, "members", uid), {
      uid,
      email: auth.currentUser?.email,
      displayName: auth.currentUser?.displayName,
      avatar: auth.currentUser?.photoURL || null,
      role: "admin",
      position: "Egasi",
      joinedAt: new Date().toISOString(),
    });
    showToast("Kompaniya yaratildi!");
  };

  // ── UPDATE COMPANY ──
  const handleUpdateCompany = async (data) => {
    if (!companyId) return;
    await updateDoc(doc(db, "companies", companyId), data);
    setCompany((prev) => ({ ...prev, ...data }));
    showToast("O'zgarishlar saqlandi");
  };

  // ── ADD MEMBER ──
  const handleAddMember = async ({ email, position, role, user }) => {
    if (!companyId) return;
    // find user by email
    const usersSnap = await import("firebase/firestore").then(({ getDocs, query, where, collection }) =>
      getDocs(query(collection(db, "users"), where("email", "==", email)))
    );
    if (usersSnap.empty) { showToast("Foydalanuvchi topilmadi", "error"); return; }
    const userDoc = usersSnap.docs[0];
    const userData = userDoc.data();
    const memberId = userDoc.id;

    await setDoc(doc(db, "companies", companyId, "members", memberId), {
      uid: memberId,
      email,
      displayName: userData.displayName || null,
      avatar: userData.photoURL || null,
      position,
      role,
      joinedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, "users", memberId), { companyId });
    showToast(`${email} qo'shildi`);
  };

  // ── REMOVE MEMBER ──
  const handleRemoveMember = async (memberId) => {
    if (!companyId || !window.confirm("A'zoni o'chirishga ishonchingiz komilmi?")) return;
    await deleteDoc(doc(db, "companies", companyId, "members", memberId));
    await updateDoc(doc(db, "users", memberId), { companyId: null });
    showToast("A'zo o'chirildi");
  };

  // ── CHANGE ROLE ──
  const handleChangeRole = async (memberId, newRole) => {
    if (!companyId) return;
    await updateDoc(doc(db, "companies", companyId, "members", memberId), { role: newRole });
    showToast("Rol yangilandi");
  };

  // ── ADD/EDIT PROJECT ──
  const handleSaveProject = async ({ name, description, status }) => {
    if (!companyId) return;
    if (editProject) {
      await updateDoc(doc(db, "companies", companyId, "projects", editProject.id), { name, description, status });
      showToast("Loyiha yangilandi");
    } else {
      await addDoc(collection(db, "companies", companyId, "projects"), {
        name, description, status, createdAt: serverTimestamp(),
      });
      showToast("Loyiha yaratildi");
    }
    setEditProject(null);
  };

  // ── DELETE PROJECT ──
  const handleDeleteProject = async (projectId) => {
    if (!companyId || !window.confirm("Loyihani o'chirishga ishonchingiz komilmi?")) return;
    await deleteDoc(doc(db, "companies", companyId, "projects", projectId));
    showToast("Loyiha o'chirildi");
  };

  // ── STATUS CHANGE ──
  const handleStatusChange = async (projectId, status) => {
    if (!companyId) return;
    await updateDoc(doc(db, "companies", companyId, "projects", projectId), { status });
  };

  // ── FILTERED ──
  const filteredMembers = members.filter((m) =>
    (m.displayName || m.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.position || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredProjects = projects.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── STATS ──
  const activeProjects    = projects.filter((p) => p.status === "active").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;

  // ══════════════════════════════════════════════
  // NO COMPANY STATE
  // ══════════════════════════════════════════════
  if (!loading && !company) {
    return (
      <div style={{
        minHeight: "100vh", background: "#f8f7f4",
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        <CompanyEditor
          visible={showEditor}
          onClose={() => setShowEditor(false)}
          onSave={handleCreateCompany}
          isNew
        />
        <div style={{
          background: "#fff", borderRadius: 28, padding: "52px 48px",
          textAlign: "center", maxWidth: 480, width: "100%",
          boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.07)",
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏢</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#1a1a1a", marginBottom: 10, marginTop: 0 }}>
            Kompaniya yo'q
          </h2>
          <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 28, lineHeight: 1.6 }}>
            Kompaniyangizni yarating va jamoa a'zolarini qo'shing
          </p>
          <button onClick={() => setShowEditor(true)} style={{
            padding: "14px 32px", borderRadius: 14, border: "none",
            background: "#1a1a1a", color: "#fff",
            fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >+ Kompaniya yaratish</button>
        </div>

        <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.9) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-12px) scale(0.95)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}`}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // LOADING
  // ══════════════════════════════════════════════
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#f8f7f4",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{ textAlign: "center", color: "#9ca3af" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div>Yuklanmoqda…</div>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "info",     label: "🏢 Ma'lumotlar" },
    { id: "members",  label: `👥 A'zolar (${members.length})` },
    { id: "projects", label: `📁 Loyihalar (${projects.length})` },
  ];

  // ══════════════════════════════════════════════
  // MAIN VIEW
  // ══════════════════════════════════════════════
  return (
    <div style={{
      minHeight: "100vh", background: "#f8f7f4",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
    }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <CompanyEditor
        visible={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleUpdateCompany}
        initialData={company}
      />

      <AddMemberModal
        visible={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={handleAddMember}
        companyId={companyId}
      />

      <AddProjectModal
        visible={showAddProject || !!editProject}
        onClose={() => { setShowAddProject(false); setEditProject(null); }}
        onAdd={handleSaveProject}
        editData={editProject}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
            borderRadius: 24, padding: "28px 32px", color: "#fff",
            position: "relative", overflow: "hidden",
          }}>
            {[{ s: 180, r: -40, t: -40 }, { s: 120, l: -30, b: -30 }].map((c, i) => (
              <div key={i} style={{
                position: "absolute", width: c.s, height: c.s, borderRadius: "50%",
                background: "#fff", opacity: 0.04,
                right: c.r, top: c.t, left: c.l, bottom: c.b,
              }} />
            ))}
            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {company?.logo ? (
                  <img src={company.logo} alt="" style={{ width: 56, height: 56, borderRadius: 16, objectFit: "cover" }} />
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: "rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                  }}>🏢</div>
                )}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>
                    Kompaniya
                  </div>
                  <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                    {company?.name}
                  </h1>
                  {company?.description && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, marginBottom: 0 }}>
                      {company.description}
                    </p>
                  )}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => setShowEditor(true)} style={{
                  padding: "11px 20px", borderRadius: 12, border: "none",
                  background: "rgba(255,255,255,0.12)", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", transition: "all 0.15s",
                  backdropFilter: "blur(8px)",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                >✏️ Tahrirlash</button>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Jami a'zolar",       value: members.length,   icon: "👥", color: "#6366f1" },
            { label: "Faol loyihalar",      value: activeProjects,   icon: "🚀", color: "#22c55e" },
            { label: "Tugallangan",         value: completedProjects, icon: "✅", color: "#0ea5e9" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: 16, padding: "16px 20px", flex: 1, minWidth: 140,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: s.color + "15",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20,
          background: "#fff", borderRadius: 14, padding: 6,
          border: "1px solid rgba(0,0,0,0.07)",
        }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "9px 12px", borderRadius: 10, border: "none",
              cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
              background: tab === t.id ? "#1a1a1a" : "transparent",
              color: tab === t.id ? "#fff" : "#9ca3af",
              transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── SEARCH ── (members & projects tabida) */}
        {(tab === "members" || tab === "projects") && (
          <div style={{
            background: "#fff", borderRadius: 14, padding: "12px 16px", marginBottom: 16,
            border: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: 10, alignItems: "center",
          }}>
            <span style={{ color: "#9ca3af", fontSize: 16 }}>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "members" ? "A'zo qidirish…" : "Loyiha qidirish…"}
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 14, color: "#1a1a1a", fontFamily: "inherit",
                background: "transparent",
              }}
            />
            {(tab === "members" && isAdmin) && (
              <Btn onClick={() => setShowAddMember(true)} style={{ padding: "7px 14px" }}>
                + A'zo qo'shish
              </Btn>
            )}
            {(tab === "projects" && isAdmin) && (
              <Btn onClick={() => setShowAddProject(true)} style={{ padding: "7px 14px" }}>
                + Loyiha
              </Btn>
            )}
          </div>
        )}

        {/* ── INFO TAB ── */}
        {tab === "info" && (
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 32px",
            border: "1px solid rgba(0,0,0,0.07)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { label: "Kompaniya nomi", value: company?.name },
                { label: "Admin",          value: members.find((m) => m.role === "admin")?.email || "—" },
                { label: "A'zolar soni",   value: `${members.length} ta` },
                { label: "Yaratilgan",     value: fmtDate(company?.createdAt) || "—" },
              ].map((r) => (
                <div key={r.label} style={{
                  background: "#f9fafb", borderRadius: 12, padding: "16px 18px",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>{r.value}</div>
                </div>
              ))}
            </div>

            {company?.description && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Tavsif
                </div>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>
                  {company.description}
                </p>
              </div>
            )}

            {company?.website && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Veb-sayt
                </div>
                <a href={company.website} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: "#6366f1", fontWeight: 600 }}>
                  {company.website}
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {tab === "members" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredMembers.length === 0 ? (
              <div style={{
                background: "#fff", borderRadius: 20, padding: "48px 20px",
                textAlign: "center", border: "1px solid rgba(0,0,0,0.07)",
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
                <p style={{ fontSize: 14, color: "#9ca3af" }}>
                  {search ? "A'zo topilmadi" : "Hali a'zolar yo'q"}
                </p>
              </div>
            ) : filteredMembers.map((m) => (
              <MemberCard
                key={m.uid}
                member={m}
                isAdmin={isAdmin}
                onRemove={handleRemoveMember}
                onChangeRole={handleChangeRole}
                accentColor="#6366f1"
              />
            ))}
          </div>
        )}

        {/* ── PROJECTS TAB ── */}
        {tab === "projects" && (
          <div>
            {filteredProjects.length === 0 ? (
              <div style={{
                background: "#fff", borderRadius: 20, padding: "48px 20px",
                textAlign: "center", border: "1px solid rgba(0,0,0,0.07)",
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
                <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>
                  {search ? "Loyiha topilmadi" : "Hali loyihalar yo'q"}
                </p>
                {!search && isAdmin && (
                  <button onClick={() => setShowAddProject(true)} style={{
                    padding: "12px 24px", borderRadius: 12, border: "none",
                    background: "#1a1a1a", color: "#fff",
                    fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}>+ Loyiha yaratish</button>
                )}
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 14,
              }}>
                {filteredProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    isAdmin={isAdmin}
                    onEdit={(proj) => setEditProject(proj)}
                    onDelete={handleDeleteProject}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>
    </div>
  );
}
