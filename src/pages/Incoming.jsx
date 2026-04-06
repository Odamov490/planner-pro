import { useContext, useState, useMemo, useEffect, useCallback } from "react";
import { TaskContext } from "../context/TaskContext";
import { AuthContext } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import { db, auth } from "../firebase";
import {
  collection, addDoc, onSnapshot, query,
  where, updateDoc, doc, serverTimestamp, orderBy,
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const todayStr = () => new Date().toISOString().split("T")[0];

const daysLeft = (d) => {
  if (!d) return null;
  return Math.round((new Date(`${d}T00:00:00`) - new Date(`${todayStr()}T00:00:00`)) / 864e5);
};

const fmtDate = (d) => {
  if (!d) return null;
  return new Date(`${d}T00:00:00`).toLocaleDateString("uz-UZ", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const timeAgo = (ts) => {
  if (!ts) return "";
  const sec = Math.floor((Date.now() - (ts?.toMillis?.() ?? new Date(ts).getTime())) / 1000);
  if (sec < 60)  return "hozirgina";
  if (sec < 3600) return `${Math.floor(sec/60)} daqiqa oldin`;
  if (sec < 86400) return `${Math.floor(sec/3600)} soat oldin`;
  return `${Math.floor(sec/86400)} kun oldin`;
};

// ═══════════════════════════════════════════════════════════════
// STYLE TOKENS  (Tasks.jsx / Outgoing.jsx bilan mos)
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
  high:   { color:"#ef4444", bg:"#fef2f2", label:"Yuqori",  icon:"🔴" },
  medium: { color:"#f59e0b", bg:"#fffbeb", label:"O'rta",   icon:"🟡" },
  low:    { color:"#22c55e", bg:"#f0fdf4", label:"Past",    icon:"🟢" },
};

const ACCEPT_CFG = {
  pending:  { label:"Kutilmoqda",    color:"#6b7280", bg:"#f3f4f6",  border:"#e5e7eb"  },
  accepted: { label:"Qabul qilindi", color:"#16a34a", bg:"#f0fdf4",  border:"#bbf7d0"  },
  rejected: { label:"Rad etildi",    color:"#dc2626", bg:"#fef2f2",  border:"#fecaca"  },
};

// ═══════════════════════════════════════════════════════════════
// FIREBASE HOOKS
// ═══════════════════════════════════════════════════════════════

// Vazifa holatlari (qabul/rad) — shaxsiy, Firestore'da saqlanadi
function useAcceptStates(myUid) {
  const [states, setStates] = useState({});

  useEffect(() => {
    if (!myUid) return;
    const q = query(
      collection(db, "task_responses"),
      where("responderId", "==", myUid)
    );
    const unsub = onSnapshot(q, snap => {
      const m = {};
      snap.docs.forEach(d => { m[d.data().taskId] = d.data().state; });
      setStates(m);
    });
    return () => unsub();
  }, [myUid]);

  const setState = useCallback(async (taskId, state) => {
    if (!myUid) return;
    // Mavjud documentni topish
    const q = query(
      collection(db, "task_responses"),
      where("responderId", "==", myUid),
      where("taskId", "==", taskId)
    );
    const snap = await new Promise(res => {
      const unsub = onSnapshot(q, s => { unsub(); res(s); });
    });

    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { state, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, "task_responses"), {
        taskId, responderId: myUid, state, updatedAt: serverTimestamp(),
      });
    }
  }, [myUid]);

  return { states, setState };
}

// Izohlar — Firestore'da saqlanadi
function useComments(myUid) {
  const [comments, setComments] = useState({});

  useEffect(() => {
    if (!myUid) return;
    const q = query(
      collection(db, "task_comments"),
      where("userId", "==", myUid),
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
      userEmail: auth.currentUser?.email || "",
      text:      text.trim(),
      createdAt: serverTimestamp(),
    });
  }, [myUid]);

  return { comments, addComment };
}

// ═══════════════════════════════════════════════════════════════
// AVATAR
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
      ? <img src={photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
      : (email || "?").slice(0, 2).toUpperCase()
    }
  </div>
);

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// DEADLINE CHIP
// ═══════════════════════════════════════════════════════════════
const DeadlineChip = ({ date, completed }) => {
  if (!date) return null;
  const dl = daysLeft(date);
  let color = "#9ca3af", bg = "#f9fafb", text = fmtDate(date);
  if (completed)     { color="#22c55e"; bg="#f0fdf4"; text="✓ Bajarildi"; }
  else if (dl < 0)   { color="#ef4444"; bg="#fef2f2"; text=`${Math.abs(dl)} kun kechikdi`; }
  else if (dl === 0) { color="#6366f1"; bg="#eff6ff"; text="Bugun!"; }
  else if (dl === 1) { color="#f59e0b"; bg="#fffbeb"; text="Ertaga"; }
  else if (dl <= 3)  { color="#f97316"; bg="#fff7ed"; text=`${dl} kun qoldi`; }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
      background: bg, color, border: `1px solid ${color}30`, whiteSpace: "nowrap",
    }}>{text}</span>
  );
};

// ═══════════════════════════════════════════════════════════════
// ACCEPT STATE BADGE
// ═══════════════════════════════════════════════════════════════
const StatePill = ({ state }) => {
  const c = ACCEPT_CFG[state] || ACCEPT_CFG.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 10px",
      borderRadius: 999, background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
    }}>{c.label}</span>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMMENT SECTION
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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {taskComments.length > 0 ? `${taskComments.length} ta izoh` : "Izoh qo'shish"}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          {taskComments.map((c) => (
            <div key={c.id} style={{
              background: "#f9fafb", borderRadius: 10,
              padding: "8px 12px", marginBottom: 6,
              border: "1px solid rgba(0,0,0,0.06)",
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
              fontSize: 13, fontWeight: 700, cursor: text.trim() ? "pointer" : "default",
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
// INCOMING CARD
// ═══════════════════════════════════════════════════════════════
const IncomingCard = ({ task, state, onAccept, onReject, onUndo, comments, onAddComment }) => {
  const dl       = daysLeft(task.date);
  const isOver   = !task.completed && task.date && task.date < todayStr();
  const isSoon   = !task.completed && dl !== null && dl >= 0 && dl <= 2;
  const p        = PRIORITY_CFG[task.priority];
  const ac       = ACCEPT_CFG[state];

  const borderColor =
    state === "accepted" ? "#bbf7d0" :
    state === "rejected" ? "#fecaca" :
    isOver              ? "#fecaca" :
    isSoon              ? "#fde68a" :
    "rgba(0,0,0,0.08)";

  const headerBg =
    state === "accepted" ? "linear-gradient(135deg,#f0fdf4,#fff)" :
    state === "rejected" ? "linear-gradient(135deg,#fff5f5,#fff)" : "#fff";

  return (
    <div style={{
      background: headerBg,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 18, overflow: "hidden",
      boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
      transition: "box-shadow 0.2s, transform 0.2s",
      fontFamily: "inherit",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow="0 6px 28px rgba(0,0,0,0.09)"; e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow="0 1px 8px rgba(0,0,0,0.05)"; e.currentTarget.style.transform="none"; }}
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
          <StatePill state={state}/>

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

          {task.createdByEmail && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Avatar email={task.createdByEmail} size={18}/>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                <b style={{ color: "#374151", fontWeight: 700 }}>
                  {task.createdByEmail.split("@")[0]}
                </b>{" "}tomonidan
              </span>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {state === "pending" ? (
            <>
              <button onClick={() => onReject(task.id)} style={{
                padding: "5px 12px", borderRadius: 8,
                border: "1.5px solid #fecaca", background: "#fff5f5",
                color: "#dc2626", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background="#fee2e2"}
              onMouseLeave={e => e.currentTarget.style.background="#fff5f5"}
              >✕ Rad etish</button>

              <button onClick={() => onAccept(task.id)} style={{
                padding: "5px 14px", borderRadius: 8,
                border: "none", background: "#6366f1",
                color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
              }}
              onMouseEnter={e => e.currentTarget.style.background="#4f46e5"}
              onMouseLeave={e => e.currentTarget.style.background="#6366f1"}
              >✓ Qabul qilish</button>
            </>
          ) : (
            <button onClick={() => onUndo(task.id)} style={{
              padding: "4px 10px", borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.1)", background: "transparent",
              color: "#9ca3af", fontSize: 11, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>↩ Bekor</button>
          )}
        </div>
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
        <CommentSection taskId={task.id} comments={comments} onAdd={onAddComment}/>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SENDER GROUP HEADER
// ═══════════════════════════════════════════════════════════════
const SenderGroup = ({ email, tasks, states }) => {
  const done    = tasks.filter(t => t.completed).length;
  const total   = tasks.length;
  const pct     = total ? Math.round((done/total)*100) : 0;
  const accepted= tasks.filter(t => states[t.id]==="accepted").length;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
    }}>
      <Avatar email={email} size={28}/>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
        {email?.split("@")[0]}
      </span>
      <span style={{ fontSize: 11, color: "#9ca3af" }}>{email}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }}/>
      <span style={{ fontSize: 10, color: "#9ca3af" }}>
        {accepted}/{total} qabul qilindi
      </span>
      {/* mini progress */}
      <div style={{ width: 50, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:"#6366f1", borderRadius:99 }}/>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Incoming() {
  const { tasks } = useContext(TaskContext);
  const { user }  = useContext(AuthContext);

  // Faqat menga boshqalar tomonidan berilgan
  const incoming = useMemo(() =>
    tasks.filter(t =>
      t.assignedTo === user?.uid &&
      t.userId     !== user?.uid &&
      !t.archived
    ),
    [tasks, user]
  );

  // Firebase hooks
  const { states, setState } = useAcceptStates(user?.uid);
  const { comments, addComment } = useComments(user?.uid);

  // UI
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterSender,   setFilterSender]   = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy,         setSortBy]         = useState("newest");
  const [viewMode,       setViewMode]       = useState("list"); // list | grouped
  const [search,         setSearch]         = useState("");

  const getState = id => states[id] || "pending";

  const handleAccept = (id) => setState(id, "accepted");
  const handleReject = (id) => setState(id, "rejected");
  const handleUndo   = (id) => setState(id, "pending");

  // ── STATS ──
  const stats = useMemo(() => ({
    total:    incoming.length,
    pending:  incoming.filter(t => getState(t.id) === "pending").length,
    accepted: incoming.filter(t => getState(t.id) === "accepted").length,
    rejected: incoming.filter(t => getState(t.id) === "rejected").length,
    overdue:  incoming.filter(t => !t.completed && t.date && t.date < todayStr()).length,
    done:     incoming.filter(t => t.completed).length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [incoming, states]);

  // Unique senders
  const senders = useMemo(() => [
    ...new Set(incoming.map(t => t.createdByEmail).filter(Boolean))
  ], [incoming]);

  // ── FILTER + SORT ──
  const filtered = useMemo(() => {
    let list = [...incoming];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.createdByEmail?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") {
      if (filterStatus === "overdue") list = list.filter(t => !t.completed && t.date && t.date < todayStr());
      else list = list.filter(t => getState(t.id) === filterStatus);
    }
    if (filterSender !== "all") {
      list = list.filter(t => t.createdByEmail === filterSender);
    }
    if (filterPriority !== "all") {
      list = list.filter(t => t.priority === filterPriority);
    }

    list.sort((a, b) => {
      if (sortBy === "newest")   return (b.created?.toMillis?.()??0) - (a.created?.toMillis?.()??0);
      if (sortBy === "oldest")   return (a.created?.toMillis?.()??0) - (b.created?.toMillis?.()??0);
      if (sortBy === "dueDate")  return (a.date||"z").localeCompare(b.date||"z");
      if (sortBy === "priority") {
        const o = {high:0,medium:1,low:2};
        return (o[a.priority]??3)-(o[b.priority]??3);
      }
      if (sortBy === "status") {
        const o = {pending:0,accepted:1,rejected:2};
        return (o[getState(a.id)]??0)-(o[getState(b.id)]??0);
      }
      return 0;
    });
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming, states, search, filterStatus, filterSender, filterPriority, sortBy]);

  // Grouped by sender (for grouped view)
  const bySender = useMemo(() => {
    const m = {};
    filtered.forEach(t => {
      const k = t.createdByEmail || "Noma'lum";
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

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
            borderRadius: 24, padding: "26px 30px", color: "#fff",
            position: "relative", overflow: "hidden",
          }}>
            {[{w:160,r:-40,t:-40,o:.05},{w:100,r:80,t:-20,o:.03}].map((c,i)=>(
              <div key={i} style={{
                position:"absolute",width:c.w,height:c.w,borderRadius:"50%",
                background:"#fff",opacity:c.o,right:c.r,top:c.t,
              }}/>
            ))}
            <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:14 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:8 }}>
                  Kiruvchi topshiriqlar
                </div>
                <h1 style={{ fontSize:28, fontWeight:900, margin:0, letterSpacing:"-0.02em" }}>
                  📥 Menga berilgan vazifalar
                </h1>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:6, marginBottom:0 }}>
                  Boshqalar tomonidan yuborilgan vazifalar
                </p>
              </div>
              {/* Quick summary */}
              <div style={{
                display:"flex", gap:14,
                background:"rgba(255,255,255,0.08)",
                backdropFilter:"blur(8px)",
                borderRadius:14, padding:"12px 18px",
                border:"1px solid rgba(255,255,255,0.12)",
              }}>
                {[
                  { label:"Jami",       val:stats.total,    color:"#fff"     },
                  { label:"Kutilmoqda", val:stats.pending,  color:"#fcd34d"  },
                  { label:"Qabul",      val:stats.accepted, color:"#4ade80"  },
                  { label:"Rad",        val:stats.rejected, color:"#f87171"  },
                ].map(s=>(
                  <div key={s.label} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── EMPTY ── */}
        {incoming.length === 0 && (
          <div style={{
            ...card, textAlign:"center", padding:"70px 20px",
            border:"1.5px dashed rgba(0,0,0,0.1)",
          }}>
            <div style={{ fontSize:48, marginBottom:14 }}>📭</div>
            <p style={{ fontSize:16, fontWeight:700, color:"#374151", marginBottom:6 }}>
              Hozircha vazifa yo'q
            </p>
            <p style={{ fontSize:13, color:"#9ca3af" }}>
              Sizga hali hech kim vazifa bermagan
            </p>
          </div>
        )}

        {incoming.length > 0 && (
          <>
            {/* ── STAT CARDS ── */}
            <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
              <StatCard label="Jami keldi"      value={stats.total}    icon="📥" color="#6366f1"/>
              <StatCard label="Kutilmoqda"       value={stats.pending}  icon="⏳" color="#6b7280"/>
              <StatCard label="Qabul qilingan"   value={stats.accepted} icon="✅" color="#22c55e"
                sub={stats.total ? `${Math.round(stats.accepted/stats.total*100)}%` : undefined}/>
              <StatCard label="Rad etilgan"      value={stats.rejected} icon="✕"  color="#ef4444"/>
              <StatCard label="Kechikkan"        value={stats.overdue}  icon="⚠️" color="#f59e0b"
                sub={stats.overdue > 0 ? "Diqqat!" : undefined}/>
            </div>

            {/* ── VIEW TABS ── */}
            <div style={{
              display:"flex", gap:4, marginBottom:16,
              background:"#fff", borderRadius:14, padding:5,
              border:"1px solid rgba(0,0,0,0.07)", width:"fit-content",
            }}>
              {[
                { v:"list",    l:"≡ Ro'yxat"   },
                { v:"grouped", l:`👤 Yuboruvchi bo'yicha (${senders.length})` },
              ].map(m=>(
                <button key={m.v} onClick={()=>setViewMode(m.v)} style={{
                  padding:"7px 16px", borderRadius:10, border:"none", cursor:"pointer",
                  fontFamily:"inherit", fontSize:12, fontWeight:600,
                  background: viewMode===m.v?"#1a1a1a":"transparent",
                  color:      viewMode===m.v?"#fff":"#9ca3af",
                  transition:"all 0.15s", whiteSpace:"nowrap",
                }}>{m.l}</button>
              ))}
            </div>

            {/* ── SEARCH + FILTERS ── */}
            <div style={{ ...card, marginBottom:14, padding:"12px 14px" }}>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>

                {/* Search */}
                <div style={{ flex:1, minWidth:180, position:"relative" }}>
                  <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", fontSize:14 }}>⌕</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Vazifa yoki yuboruvchi qidirish…"
                    style={{
                      width:"100%", padding:"9px 12px 9px 32px",
                      border:"1px solid rgba(0,0,0,0.1)", borderRadius:10,
                      fontSize:13, color:"#1a1a1a", background:"#fafafa",
                      outline:"none", fontFamily:"inherit", boxSizing:"border-box",
                    }}
                  />
                </div>

                {/* Status pills */}
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {[
                    {v:"all",      l:"Barchasi"},
                    {v:"pending",  l:"Kutilmoqda"},
                    {v:"accepted", l:"✓ Qabul"},
                    {v:"rejected", l:"✕ Rad"},
                    {v:"overdue",  l:"⚠ Kechikkan"},
                  ].map(f=>(
                    <button key={f.v} onClick={()=>setFilterStatus(f.v)} style={pill(filterStatus===f.v)}>
                      {f.l}
                    </button>
                  ))}
                </div>

                {/* Priority + Sender + Sort in one row */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                  {/* Priority */}
                  <div style={{ display:"flex", gap:3 }}>
                    {[{v:"all",l:"Barchasi",c:"#1a1a1a"},{v:"high",l:"🔴",c:"#ef4444"},{v:"medium",l:"🟡",c:"#f59e0b"},{v:"low",l:"🟢",c:"#22c55e"}].map(f=>(
                      <button key={f.v} onClick={()=>setFilterPriority(f.v)} style={pill(filterPriority===f.v,f.c)}>
                        {f.l}
                      </button>
                    ))}
                  </div>

                  {/* Sender dropdown */}
                  {senders.length > 1 && (
                    <select value={filterSender} onChange={e=>setFilterSender(e.target.value)} style={{
                      padding:"7px 12px", borderRadius:10, border:"1px solid rgba(0,0,0,0.1)",
                      fontSize:12, fontFamily:"inherit", background:"#fafafa",
                      color:"#374151", cursor:"pointer", outline:"none",
                    }}>
                      <option value="all">👤 Barcha yuboruvchilar</option>
                      {senders.map(s=>(
                        <option key={s} value={s}>{s.split("@")[0]}</option>
                      ))}
                    </select>
                  )}

                  {/* Sort */}
                  <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{
                    padding:"7px 12px", borderRadius:10, border:"1px solid rgba(0,0,0,0.1)",
                    fontSize:12, fontFamily:"inherit", background:"#fafafa",
                    color:"#374151", cursor:"pointer", outline:"none",
                  }}>
                    <option value="newest">Yangi birinchi</option>
                    <option value="oldest">Eski birinchi</option>
                    <option value="dueDate">Muddat bo'yicha</option>
                    <option value="priority">Muhimlik bo'yicha</option>
                    <option value="status">Status bo'yicha</option>
                  </select>

                  <span style={{ fontSize:12, color:"#9ca3af", whiteSpace:"nowrap" }}>
                    {filtered.length}/{incoming.length}
                  </span>
                </div>
              </div>
            </div>

            {/* ── NO RESULTS ── */}
            {filtered.length === 0 && (
              <div style={{ ...card, textAlign:"center", padding:"50px 20px", color:"#9ca3af" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
                <p style={{ fontSize:14, fontWeight:600, color:"#6b7280", margin:0 }}>
                  Hech narsa topilmadi
                </p>
              </div>
            )}

            {/* ── LIST VIEW ── */}
            {viewMode === "list" && filtered.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filtered.map(t => (
                  <IncomingCard
                    key={t.id}
                    task={t}
                    state={getState(t.id)}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onUndo={handleUndo}
                    comments={comments}
                    onAddComment={addComment}
                  />
                ))}
              </div>
            )}

            {/* ── GROUPED VIEW (by sender) ── */}
            {viewMode === "grouped" && filtered.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                {Object.entries(bySender).map(([senderEmail, senderTasks]) => (
                  <div key={senderEmail}>
                    <SenderGroup
                      email={senderEmail}
                      tasks={senderTasks}
                      states={states}
                    />
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {senderTasks.map(t => (
                        <IncomingCard
                          key={t.id}
                          task={t}
                          state={getState(t.id)}
                          onAccept={handleAccept}
                          onReject={handleReject}
                          onUndo={handleUndo}
                          comments={comments}
                          onAddComment={addComment}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── BOTTOM SUMMARY ── */}
            {filtered.length > 0 && (
              <div style={{
                marginTop:20, padding:"12px 18px",
                background:"#fff", borderRadius:14,
                border:"1px solid rgba(0,0,0,0.07)",
                display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
              }}>
                <span style={{ fontSize:12, color:"#9ca3af" }}>
                  {filtered.length} ta vazifa ko'rsatilmoqda
                </span>
                <div style={{ flex:1, minWidth:80, height:4, background:"#f3f4f6", borderRadius:99, overflow:"hidden" }}>
                  <div style={{
                    width:`${filtered.length ? (filtered.filter(t=>getState(t.id)==="accepted").length/filtered.length)*100 : 0}%`,
                    height:"100%", background:"#6366f1", borderRadius:99,
                    transition:"width 0.6s ease",
                  }}/>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:"#6366f1" }}>
                  {filtered.filter(t=>getState(t.id)==="accepted").length} ta qabul qilindi
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
