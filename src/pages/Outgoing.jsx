import { useContext, useState, useMemo, useEffect, useCallback } from "react";
import { TaskContext } from "../context/TaskContext";
import { AuthContext } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import { db, auth } from "../firebase";
import {
  collection, addDoc, onSnapshot, query,
  where, serverTimestamp, orderBy,
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// HELPERS  (Incoming.jsx bilan aynan bir xil)
// ═══════════════════════════════════════════════════════════════
const todayStr = () => new Date().toISOString().split("T")[0];

const daysLeft = (d) => {
  if (!d) return null;
  return Math.round(
    (new Date(`${d}T00:00:00`) - new Date(`${todayStr()}T00:00:00`)) / 864e5
  );
};

const fmtDate = (d) => {
  if (!d) return null;
  return new Date(`${d}T00:00:00`).toLocaleDateString("uz-UZ", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const timeAgo = (ts) => {
  if (!ts) return "";
  const sec = Math.floor(
    (Date.now() - (ts?.toMillis?.() ?? new Date(ts).getTime())) / 1000
  );
  if (sec < 60)    return "hozirgina";
  if (sec < 3600)  return `${Math.floor(sec / 60)} daqiqa oldin`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} soat oldin`;
  return `${Math.floor(sec / 86400)} kun oldin`;
};

// ═══════════════════════════════════════════════════════════════
// STYLE TOKENS  (Incoming.jsx bilan aynan bir xil)
// ═══════════════════════════════════════════════════════════════
const card = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 20,
  padding: "22px 24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const pill = (active, color = "#1a1a1a") => ({
  padding: "7px 15px", borderRadius: 999, border: "none",
  cursor: "pointer", fontFamily: "inherit",
  fontSize: 13, fontWeight: 600,
  background: active ? color : "#f3f4f6",
  color:      active ? "#fff" : "#6b7280",
  transition: "all 0.15s",
});

const PRIORITY_CFG = {
  high:   { color: "#ef4444", bg: "#fef2f2", label: "Yuqori", icon: "🔴" },
  medium: { color: "#f59e0b", bg: "#fffbeb", label: "O'rta",  icon: "🟡" },
  low:    { color: "#22c55e", bg: "#f0fdf4", label: "Past",   icon: "🟢" },
};

// Qabul qiluvchining holati (Incoming qabul/rad qildi)
const RESP_CFG = {
  pending:  { label: "Ko'rmagan",     color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  accepted: { label: "Qabul qildi",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  rejected: { label: "Rad etdi",      color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

// ═══════════════════════════════════════════════════════════════
// FIREBASE HOOKS
// ═══════════════════════════════════════════════════════════════

// Qabul qiluvchilar javoblari — real-time tinglash
function useRecipientResponses(myUid) {
  const [responses, setResponses] = useState({}); // { taskId: state }

  useEffect(() => {
    if (!myUid) return;
    // Men yuborgan vazifalarga qabul qiluvchi javoblari
    const q = query(
      collection(db, "task_responses"),
      where("assignerId", "==", myUid)
    );
    const unsub = onSnapshot(q, snap => {
      const m = {};
      snap.docs.forEach(d => {
        const data = d.data();
        m[data.taskId] = data.state;
      });
      setResponses(m);
    });
    return () => unsub();
  }, [myUid]);

  return responses;
}

// Outgoing task'lar uchun izohlar
function useOutgoingComments(myUid) {
  const [comments, setComments] = useState({});

  useEffect(() => {
    if (!myUid) return;
    // Bu yerda outgoing task izohlarini creator ham ko'radi
    const q = query(
      collection(db, "task_comments"),
      where("creatorId", "==", myUid),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      const m = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (!m[data.taskId]) m[data.taskId] = [];
        m[data.taskId].push({ id: d.id, ...data });
      });
      setComments(m);
    });
    return () => unsub();
  }, [myUid]);

  const addComment = useCallback(async (taskId, text) => {
    if (!myUid || !text?.trim()) return;
    await addDoc(collection(db, "task_comments"), {
      taskId,
      userId:    myUid,
      creatorId: myUid,
      userEmail: auth.currentUser?.email || "",
      text:      text.trim(),
      createdAt: serverTimestamp(),
    });
  }, [myUid]);

  return { comments, addComment };
}

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS  (Incoming.jsx bilan aynan bir xil)
// ═══════════════════════════════════════════════════════════════

const Avatar = ({ email, photo, size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: photo ? "transparent" : "#eff6ff",
    border: "2px solid #e0e7ff", overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.35, fontWeight: 800, color: "#6366f1",
  }}>
    {photo
      ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
      : (email || "?").slice(0, 2).toUpperCase()
    }
  </div>
);

const StatCard = ({ label, value, color, icon, sub }) => (
  <div style={{
    background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: 16, padding: "16px 18px",
    display: "flex", flexDirection: "column", gap: 5,
    flex: 1, minWidth: 110, position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", right: -12, top: -12,
      width: 52, height: 52, borderRadius: "50%", background: color + "12",
    }}/>
    <span style={{ fontSize: 22 }}>{icon}</span>
    <span style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
    {sub && <span style={{ fontSize: 10, color, fontWeight: 700 }}>{sub}</span>}
  </div>
);

const DeadlineChip = ({ date, completed }) => {
  if (!date) return null;
  const dl = daysLeft(date);
  let color = "#9ca3af", bg = "#f9fafb", text = fmtDate(date);
  if (completed)     { color = "#22c55e"; bg = "#f0fdf4"; text = "✓ Bajarildi"; }
  else if (dl < 0)   { color = "#ef4444"; bg = "#fef2f2"; text = `${Math.abs(dl)} kun kechikdi`; }
  else if (dl === 0) { color = "#6366f1"; bg = "#eff6ff"; text = "Bugun!"; }
  else if (dl === 1) { color = "#f59e0b"; bg = "#fffbeb"; text = "Ertaga"; }
  else if (dl <= 3)  { color = "#f97316"; bg = "#fff7ed"; text = `${dl} kun qoldi`; }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 9px",
      borderRadius: 999, background: bg, color,
      border: `1px solid ${color}30`, whiteSpace: "nowrap",
    }}>{text}</span>
  );
};

// Qabul qiluvchining holati badge
const RespPill = ({ state }) => {
  const c = RESP_CFG[state] || RESP_CFG.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 10px",
      borderRadius: 999, background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
    }}>{c.label}</span>
  );
};

// Progress bar
const ProgressBar = ({ pct, color, height = 4 }) => (
  <div style={{ background: "#f3f4f6", borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(pct, 100)}%`, height: "100%",
      background: color, borderRadius: 99,
      transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
    }}/>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// COMMENT SECTION  (Incoming.jsx bilan aynan bir xil)
// ═══════════════════════════════════════════════════════════════
const CommentSection = ({ taskId, comments, onAdd }) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const taskComments = comments[taskId] || [];

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    await onAdd(taskId, text);
    setText("");
    setBusy(false);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: "pointer",
        fontSize: 12, fontWeight: 600, color: "#6b7280", padding: "4px 0",
        fontFamily: "inherit",
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {taskComments.length > 0 ? `${taskComments.length} ta izoh` : "Izoh qo'shish"}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          {taskComments.map(c => (
            <div key={c.id} style={{
              background: "#f9fafb", borderRadius: 10, padding: "8px 12px",
              marginBottom: 6, border: "1px solid rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1" }}>
                  {c.userEmail?.split("@")[0] || "Siz"}
                </span>
                <span style={{ fontSize: 10, color: "#d1d5db" }}>{timeAgo(c.createdAt)}</span>
              </div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{c.text}</div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Izohingizni yozing…"
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.1)", fontSize: 13,
                outline: "none", fontFamily: "inherit", color: "#1a1a1a",
                background: "#fff", transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"}
            />
            <button onClick={submit} disabled={!text.trim() || busy} style={{
              padding: "8px 16px", borderRadius: 10, border: "none",
              background: text.trim() ? "#6366f1" : "#f3f4f6",
              color: text.trim() ? "#fff" : "#9ca3af",
              fontSize: 13, fontWeight: 700,
              cursor: text.trim() ? "pointer" : "default",
              fontFamily: "inherit", transition: "all 0.15s",
            }}>
              {busy ? "…" : "Yuborish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// OUTGOING CARD  (Incoming.jsx IncomingCard bilan aynan bir xil tuzilma)
// ═══════════════════════════════════════════════════════════════
const OutgoingCard = ({
  task, recipientState, onDelete, comments, onAddComment,
}) => {
  const dl     = daysLeft(task.date);
  const isOver = !task.completed && task.date && task.date < todayStr();
  const isSoon = !task.completed && dl !== null && dl >= 0 && dl <= 2;

  const borderColor =
    recipientState === "accepted" ? "#bbf7d0" :
    recipientState === "rejected" ? "#fecaca" :
    isOver                        ? "#fecaca" :
    isSoon                        ? "#fde68a" :
    "rgba(0,0,0,0.08)";

  const headerBg =
    task.completed              ? "linear-gradient(135deg,#f0fdf4,#fff)" :
    recipientState === "rejected" ? "linear-gradient(135deg,#fff5f5,#fff)" :
    "#fff";

  return (
    <div
      style={{
        background: headerBg,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.2s, transform 0.2s",
        fontFamily: "inherit",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.09)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.05)";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* ── TOP STRIP ── */}
      <div style={{
        padding: "11px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(0,0,0,0.06)", gap: 8, flexWrap: "wrap",
        background: "rgba(0,0,0,0.01)",
      }}>
        {/* Left meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>

          {/* Qabul qiluvchi javob holati */}
          <RespPill state={recipientState}/>

          {isOver && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca",
            }}>⚠ Kechikkan</span>
          )}
          {isSoon && !isOver && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              background: "#fffbeb", color: "#f59e0b", border: "1px solid #fde68a",
            }}>⏰ Muddat yaqin</span>
          )}

          <DeadlineChip date={task.date} completed={task.completed}/>

          {task.teamName && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
            }}>👥 {task.teamName}</span>
          )}

          {/* Ko'rsatish: jamoa yoki shaxs */}
          {task.teamId ? (
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{
                fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999,
                background:"#ede9fe", color:"#7c3aed", border:"1px solid #ddd6fe",
              }}>👥 {task.teamName}</span>
              {(task.teamMemberIds||[]).length > 0 && (
                <span style={{ fontSize:10, color:"#9ca3af" }}>
                  {(task.teamMemberIds||[]).length} a'zo
                </span>
              )}
            </div>
          ) : task.assignedEmail ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Avatar email={task.assignedEmail} size={18}/>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                <b style={{ color: "#374151", fontWeight: 700 }}>
                  {task.assignedEmail.split("@")[0]}
                </b>{" "}ga yuborildi
              </span>
            </div>
          ) : null}
        </div>

        {/* Right — delete button */}
        <button
          onClick={() => onDelete(task.id)}
          style={{
            padding: "4px 10px", borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.2)",
            background: "#fff5f5", color: "#ef4444",
            fontSize: 11, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff5f5"}
        >✕ O'chirish</button>
      </div>

      {/* ── TASK CARD ── */}
      <div style={{ padding: "2px 8px" }}>
        <TaskCard
          task={task}
          onToggle={() => {}}
          onDelete={() => {}}
          onEdit={() => {}}
        />
      </div>

      {/* ── COMMENTS ── */}
      <div style={{ padding: "0 18px 14px" }}>
        <CommentSection
          taskId={task.id}
          comments={comments}
          onAdd={onAddComment}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// RECIPIENT GROUP HEADER  (Incoming.jsx SenderGroup bilan mos)
// ═══════════════════════════════════════════════════════════════
const RecipientGroup = ({ email, tasks, responses }) => {
  const done     = tasks.filter(t => t.completed).length;
  const total    = tasks.length;
  const pct      = total ? Math.round((done / total) * 100) : 0;
  const accepted = tasks.filter(t => responses[t.id] === "accepted").length;
  const isTeam   = email?.startsWith("👥");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      {isTeam ? (
        <div style={{
          width:28, height:28, borderRadius:"50%", flexShrink:0,
          background:"#ede9fe", border:"2px solid #ddd6fe",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
        }}>👥</div>
      ) : (
        <Avatar email={email} size={28}/>
      )}
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
        {isTeam ? email : email?.split("@")[0]}
      </span>
      {!isTeam && <span style={{ fontSize: 11, color: "#9ca3af" }}>{email}</span>}
      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }}/>
      <span style={{ fontSize: 10, color: "#9ca3af" }}>
        {accepted}/{total} qabul qildi
      </span>
      <div style={{
        width: 50, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: pct === 100 ? "#22c55e" : "#6366f1", borderRadius: 99,
        }}/>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════
const Empty = ({ icon = "📭", title, sub }) => (
  <div style={{ ...card, textAlign: "center", padding: "60px 20px" }}>
    <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
    <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6 }}>{title}</p>
    {sub && <p style={{ fontSize: 13, color: "#9ca3af" }}>{sub}</p>}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Outgoing() {
  const { tasks, deleteTask } = useContext(TaskContext);
  const { user }              = useContext(AuthContext);

  // Men yuborgan + men yaratgan jamoa vazifalari
  const outgoing = useMemo(() => {
    const seen = new Set();
    const result = [];
    tasks.forEach(t => {
      if (t.archived) return;
      // Shaxsiy: men yuborgan, o'zimga emas
      const isPersonal = t.userId === user?.uid && t.assignedTo !== user?.uid && !t.teamId;
      // Jamoa: men yaratgan jamoa vazifasi
      const isTeam = t.userId === user?.uid && !!t.teamId;
      if ((isPersonal || isTeam) && !seen.has(t.id)) {
        seen.add(t.id);
        result.push({ ...t, _kind: isTeam ? "team" : "personal" });
      }
    });
    return result;
  }, [tasks, user]);

  // Firebase hooks
  const responses                   = useRecipientResponses(user?.uid);
  const { comments, addComment }    = useOutgoingComments(user?.uid);

  // UI state
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterKind,     setFilterKind]     = useState("all"); // all|personal|team
  const [filterRecip,    setFilterRecip]    = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy,         setSortBy]         = useState("newest");
  const [viewMode,       setViewMode]       = useState("list");
  const [search,         setSearch]         = useState("");

  const getResp = id => responses[id] || "pending";

  // ── STATS ──
  const stats = useMemo(() => {
    const total    = outgoing.length;
    const done     = outgoing.filter(t => t.completed).length;
    const overdue  = outgoing.filter(t => !t.completed && t.date && t.date < todayStr()).length;
    const accepted = outgoing.filter(t => getResp(t.id) === "accepted").length;
    const rejected = outgoing.filter(t => getResp(t.id) === "rejected").length;
    const pct      = total ? Math.round((done / total) * 100) : 0;

    const byRecipient = {};
    outgoing.forEach(t => {
      const key = t.teamId
        ? `👥 ${t.teamName || "Jamoa"}`
        : (t.assignedEmail || t.assignedTo || "Noma'lum");
      if (!byRecipient[key]) byRecipient[key] = [];
      byRecipient[key].push(t);
    });

    const teamCount = outgoing.filter(t => !!t.teamId).length;
    return { total, done, overdue, accepted, rejected, pct, byRecipient, teamCount };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoing, responses]);

  // Unique recipients (shaxsiy + jamoa)
  const recipients = useMemo(() => {
    const s = new Set();
    outgoing.forEach(t => {
      if (t.teamId) s.add(`👥 ${t.teamName || "Jamoa"}`);
      else if (t.assignedEmail) s.add(t.assignedEmail);
    });
    return [...s];
  }, [outgoing]);

  // ── FILTER + SORT ──
  const filtered = useMemo(() => {
    let list = [...outgoing];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.assignedEmail?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "all") {
      if (filterStatus === "done")    list = list.filter(t => t.completed);
      if (filterStatus === "active")  list = list.filter(t => !t.completed);
      if (filterStatus === "overdue") list = list.filter(t => !t.completed && t.date && t.date < todayStr());
      if (filterStatus === "accepted") list = list.filter(t => getResp(t.id) === "accepted");
      if (filterStatus === "rejected") list = list.filter(t => getResp(t.id) === "rejected");
    }
    if (filterKind !== "all") {
      if (filterKind === "team")     list = list.filter(t => !!t.teamId);
      if (filterKind === "personal") list = list.filter(t => !t.teamId);
    }
    if (filterRecip !== "all") {
      list = list.filter(t => {
        if (t.teamId) return `👥 ${t.teamName || "Jamoa"}` === filterRecip;
        return t.assignedEmail === filterRecip;
      });
    }
    if (filterPriority !== "all") {
      list = list.filter(t => t.priority === filterPriority);
    }

    list.sort((a, b) => {
      if (sortBy === "newest")   return (b.created?.toMillis?.() ?? 0) - (a.created?.toMillis?.() ?? 0);
      if (sortBy === "oldest")   return (a.created?.toMillis?.() ?? 0) - (b.created?.toMillis?.() ?? 0);
      if (sortBy === "dueDate")  return (a.date || "z").localeCompare(b.date || "z");
      if (sortBy === "priority") {
        const o = { high: 0, medium: 1, low: 2 };
        return (o[a.priority] ?? 3) - (o[b.priority] ?? 3);
      }
      if (sortBy === "status") {
        const o = { pending: 0, accepted: 1, rejected: 2 };
        return (o[getResp(a.id)] ?? 0) - (o[getResp(b.id)] ?? 0);
      }
      if (sortBy === "recipient") {
        return (a.assignedEmail || "").localeCompare(b.assignedEmail || "");
      }
      return 0;
    });

    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoing, responses, search, filterStatus, filterRecip, filterPriority, sortBy]);

  // Grouped by recipient
  const byRecipient = useMemo(() => {
    const m = {};
    filtered.forEach(t => {
      const k = t.teamId
        ? `👥 ${t.teamName || "Jamoa"}`
        : (t.assignedEmail || "Noma'lum");
      if (!m[k]) m[k] = [];
      m[k].push(t);
    });
    return m;
  }, [filtered]);

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f7f4",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: "#1a1a1a",
    }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* ── HEADER — Incoming bilan aynan bir xil tuzilma ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
            borderRadius: 24, padding: "26px 30px", color: "#fff",
            position: "relative", overflow: "hidden",
          }}>
            {[{ w: 160, r: -40, t: -40, o: 0.05 }, { w: 100, r: 80, t: -20, o: 0.03 }].map((c, i) => (
              <div key={i} style={{
                position: "absolute", width: c.w, height: c.w, borderRadius: "50%",
                background: "#fff", opacity: c.o, right: c.r, top: c.t,
              }}/>
            ))}
            <div style={{
              position: "relative", display: "flex",
              justifyContent: "space-between", alignItems: "flex-end",
              flexWrap: "wrap", gap: 14,
            }}>
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8,
                }}>Yuborilgan topshiriqlar</div>
                <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                  📤 Men bergan vazifalar
                </h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6, marginBottom: 0 }}>
                  Boshqalarga topshirgan vazifalaringiz
                </p>
              </div>
              {/* Quick summary — Incoming bilan aynan bir xil */}
              <div style={{
                display: "flex", gap: 14,
                background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)",
                borderRadius: 14, padding: "12px 18px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}>
                {[
                  { label: "Jami",     val: stats.total,    color: "#fff"    },
                  { label: "Qabul",    val: stats.accepted, color: "#4ade80" },
                  { label: "Rad",      val: stats.rejected, color: "#f87171" },
                  { label: "Kechikkan",val: stats.overdue,  color: "#fbbf24" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── EMPTY ── */}
        {outgoing.length === 0 && (
          <Empty
            icon="📤"
            title="Hali hech kimga vazifa bermagansiz"
            sub="Vazifalar bo'limiga o'tib, birovga topshiriq bering"
          />
        )}

        {outgoing.length > 0 && (
          <>
            {/* ── STAT CARDS — Incoming bilan aynan bir xil ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <StatCard label="Jami yuborildi"  value={stats.total}    icon="📤" color="#6366f1"/>
              <StatCard label="Bajarildi"        value={stats.done}     icon="✅" color="#22c55e"
                sub={`${stats.pct}% yakunlangan`}/>
              <StatCard label="Qabul qilindi"    value={stats.accepted} icon="👍" color="#16a34a"/>
              <StatCard label="Rad etildi"       value={stats.rejected} icon="👎" color="#dc2626"/>
              <StatCard label="Kechikkan"        value={stats.overdue}  icon="⚠️" color="#f59e0b"
                sub={stats.overdue > 0 ? "Diqqat!" : undefined}/>
              <StatCard label="Jamoa vazifalari" value={stats.teamCount} icon="👥" color="#8b5cf6"/>
            </div>

            {/* ── VIEW TABS — Incoming bilan aynan bir xil ── */}
            <div style={{
              display: "flex", gap: 4, marginBottom: 16,
              background: "#fff", borderRadius: 14, padding: 5,
              border: "1px solid rgba(0,0,0,0.07)", width: "fit-content",
            }}>
              {[
                { v: "list",       l: "≡ Ro'yxat" },
                { v: "grouped",    l: `👤 Qabul qiluvchilar (${recipients.length})` },
              ].map(m => (
                <button key={m.v} onClick={() => setViewMode(m.v)} style={{
                  padding: "7px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                  background: viewMode === m.v ? "#1a1a1a" : "transparent",
                  color:      viewMode === m.v ? "#fff"    : "#9ca3af",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}>{m.l}</button>
              ))}
            </div>

            {/* ── KIND TABS ── */}
            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              {[
                { v:"all",      l:"Barchasi",         count: outgoing.length },
                { v:"personal", l:"👤 Shaxsiy",       count: outgoing.filter(t=>!t.teamId).length },
                { v:"team",     l:"👥 Jamoa",         count: outgoing.filter(t=>!!t.teamId).length },
              ].map(k => (
                <button key={k.v} onClick={() => setFilterKind(k.v)} style={{
                  padding:"7px 16px", borderRadius:999, border:"none", cursor:"pointer",
                  fontFamily:"inherit", fontSize:13, fontWeight:600,
                  background: filterKind===k.v ? "#1a1a1a" : "#f3f4f6",
                  color:      filterKind===k.v ? "#fff"    : "#6b7280",
                  display:"flex", alignItems:"center", gap:6, transition:"all 0.15s",
                }}>
                  {k.l}
                  <span style={{
                    fontSize:10, fontWeight:800, padding:"1px 7px", borderRadius:999,
                    background: filterKind===k.v ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.07)",
                    color: filterKind===k.v ? "#fff" : "#9ca3af",
                  }}>{k.count}</span>
                </button>
              ))}
            </div>

            {/* ── SEARCH + FILTERS — Incoming bilan aynan bir xil ── */}
            <div style={{ ...card, marginBottom: 14, padding: "12px 14px" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

                {/* Search */}
                <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
                  <span style={{
                    position: "absolute", left: 11, top: "50%",
                    transform: "translateY(-50%)", color: "#9ca3af", fontSize: 14,
                  }}>⌕</span>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Vazifa yoki qabul qiluvchi qidirish…"
                    style={{
                      width: "100%", padding: "9px 12px 9px 32px",
                      border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10,
                      fontSize: 13, color: "#1a1a1a", background: "#fafafa",
                      outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Status filter */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[
                    { v: "all",      l: "Barchasi"   },
                    { v: "active",   l: "Faol"       },
                    { v: "done",     l: "Bajarildi"  },
                    { v: "overdue",  l: "⚠ Kechikkan"},
                    { v: "accepted", l: "✓ Qabul"    },
                    { v: "rejected", l: "✕ Rad"      },
                  ].map(f => (
                    <button key={f.v} onClick={() => setFilterStatus(f.v)}
                      style={pill(filterStatus === f.v)}>
                      {f.l}
                    </button>
                  ))}
                </div>

                {/* Priority + Recipient + Sort */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {/* Priority */}
                  <div style={{ display: "flex", gap: 3 }}>
                    {[
                      { v: "all",    l: "Barchasi", c: "#1a1a1a" },
                      { v: "high",   l: "🔴",       c: "#ef4444" },
                      { v: "medium", l: "🟡",       c: "#f59e0b" },
                      { v: "low",    l: "🟢",       c: "#22c55e" },
                    ].map(f => (
                      <button key={f.v} onClick={() => setFilterPriority(f.v)}
                        style={pill(filterPriority === f.v, f.c)}>
                        {f.l}
                      </button>
                    ))}
                  </div>

                  {/* Recipient dropdown */}
                  {recipients.length > 1 && (
                    <select value={filterRecip} onChange={e => setFilterRecip(e.target.value)} style={{
                      padding: "7px 12px", borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.1)",
                      fontSize: 12, fontFamily: "inherit", background: "#fafafa",
                      color: "#374151", cursor: "pointer", outline: "none",
                    }}>
                      <option value="all">👤 Barcha qabul qiluvchilar</option>
                      {recipients.map(r => (
                        <option key={r} value={r}>{r.split("@")[0]}</option>
                      ))}
                    </select>
                  )}

                  {/* Sort */}
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                    padding: "7px 12px", borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.1)",
                    fontSize: 12, fontFamily: "inherit", background: "#fafafa",
                    color: "#374151", cursor: "pointer", outline: "none",
                  }}>
                    <option value="newest">Yangi birinchi</option>
                    <option value="oldest">Eski birinchi</option>
                    <option value="dueDate">Muddat bo'yicha</option>
                    <option value="priority">Muhimlik bo'yicha</option>
                    <option value="status">Holat bo'yicha</option>
                    <option value="recipient">Qabul qiluvchi bo'yicha</option>
                  </select>

                  <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                    {filtered.length}/{outgoing.length}
                  </span>
                </div>
              </div>
            </div>

            {/* ── NO RESULTS ── */}
            {filtered.length === 0 && (
              <Empty icon="🔍" title="Hech narsa topilmadi"
                sub="Filter yoki qidiruvni o'zgartiring"/>
            )}

            {/* ══════════════════════════════════════════════
                LIST VIEW — Incoming bilan aynan bir xil
            ══════════════════════════════════════════════ */}
            {viewMode === "list" && filtered.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(t => (
                  <OutgoingCard
                    key={t.id}
                    task={t}
                    recipientState={getResp(t.id)}
                    onDelete={deleteTask}
                    comments={comments}
                    onAddComment={addComment}
                  />
                ))}
              </div>
            )}

            {/* ══════════════════════════════════════════════
                GROUPED VIEW — Incoming bilan aynan bir xil
            ══════════════════════════════════════════════ */}
            {viewMode === "grouped" && filtered.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {Object.entries(byRecipient).map(([recEmail, recTasks]) => (
                  <div key={recEmail}>
                    <RecipientGroup
                      email={recEmail}
                      tasks={recTasks}
                      responses={responses}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {recTasks.map(t => (
                        <OutgoingCard
                          key={t.id}
                          task={t}
                          recipientState={getResp(t.id)}
                          onDelete={deleteTask}
                          comments={comments}
                          onAddComment={addComment}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── BOTTOM SUMMARY — Incoming bilan aynan bir xil ── */}
            {filtered.length > 0 && (
              <div style={{
                marginTop: 20, padding: "12px 18px",
                background: "#fff", borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.07)",
                display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {filtered.length} ta vazifa ko'rsatilmoqda
                </span>
                <div style={{ flex: 1, minWidth: 80 }}>
                  <ProgressBar
                    pct={filtered.length
                      ? (filtered.filter(t => t.completed).length / filtered.length) * 100
                      : 0}
                    color="#6366f1"
                    height={4}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1" }}>
                  {filtered.filter(t => t.completed).length}/{filtered.length} bajarildi
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>
                  {filtered.filter(t => getResp(t.id) === "accepted").length} ta qabul qilindi
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>
    </div>
  );
}
