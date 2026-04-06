import { useContext, useState, useMemo } from "react";
import { TaskContext } from "../context/TaskContext";
import { AuthContext } from "../context/AuthContext";
import { getIncomingTasks } from "../utils/filters";
import TaskCard from "../components/TaskCard";

// ─── helpers ────────────────────────────────────────────────────
function isOverdue(task) {
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}
function isDueSoon(task) {
  if (!task.dueDate) return false;
  const diff = new Date(task.dueDate) - new Date();
  return diff > 0 && diff < 1000 * 60 * 60 * 24 * 2; // 48 h
}
function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" });
}
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hozirgina";
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

// ─── status badge ────────────────────────────────────────────────
const ACCEPT_STATES = { pending: null, accepted: true, rejected: false };

const StatusPill = ({ state }) => {
  const cfg = {
    pending:  { label: "Kutilmoqda", bg: "#F1F5F9", color: "#64748B" },
    accepted: { label: "Qabul qilindi", bg: "#DCFCE7", color: "#16A34A" },
    rejected: { label: "Rad etildi", bg: "#FEE2E2", color: "#DC2626" },
  }[state] || {};
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, letterSpacing: "0.02em",
    }}>{cfg.label}</span>
  );
};

// ─── comment section ─────────────────────────────────────────────
const CommentSection = ({ taskId, comments, onAdd }) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  const handle = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(taskId, t);
    setText("");
  };

  const taskComments = (comments[taskId] || []);

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 600, color: "#64748B",
          padding: "4px 0",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {taskComments.length > 0 ? `${taskComments.length} ta izoh` : "Izoh qo'shish"}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          {/* existing comments */}
          {taskComments.length > 0 && (
            <div style={{
              display: "flex", flexDirection: "column", gap: 6,
              marginBottom: 10,
            }}>
              {taskComments.map((c, i) => (
                <div key={i} style={{
                  background: "#F8FAFC", borderRadius: 10, padding: "8px 12px",
                  border: "1px solid #E2E8F0",
                }}>
                  <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.5 }}>{c.text}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{timeAgo(c.createdAt)}</div>
                </div>
              ))}
            </div>
          )}

          {/* input */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()}
              placeholder="Izohingizni yozing..."
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 10,
                border: "1.5px solid #E2E8F0", fontSize: 13, outline: "none",
                fontFamily: "inherit", color: "#1E293B", background: "#fff",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "#3B82F6"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
            <button
              onClick={handle}
              disabled={!text.trim()}
              style={{
                padding: "8px 14px", borderRadius: 10, border: "none",
                background: text.trim() ? "#3B82F6" : "#E2E8F0",
                color: text.trim() ? "#fff" : "#94A3B8",
                fontSize: 13, fontWeight: 700, cursor: text.trim() ? "pointer" : "default",
                fontFamily: "inherit", transition: "all 0.15s",
              }}
            >
              Yuborish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── task card wrapper ───────────────────────────────────────────
const IncomingCard = ({ task, acceptState, onAccept, onReject, comments, onAddComment }) => {
  const overdue = isOverdue(task);
  const soon    = isDueSoon(task);

  const borderColor = acceptState === "rejected"
    ? "#FCA5A5"
    : acceptState === "accepted"
      ? "#86EFAC"
      : overdue
        ? "#FCA5A5"
        : soon
          ? "#FDE68A"
          : "#E2E8F0";

  const headerBg = acceptState === "rejected"
    ? "linear-gradient(135deg,#FFF5F5,#FFF)"
    : acceptState === "accepted"
      ? "linear-gradient(135deg,#F0FDF4,#FFF)"
      : "#FFF";

  return (
    <div style={{
      background: headerBg,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 1px 12px rgba(0,0,0,0.05)",
      transition: "box-shadow 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 12px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* top strip */}
      <div style={{
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #F1F5F9",
        gap: 8, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <StatusPill state={acceptState} />
          {overdue && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px",
              borderRadius: 999, background: "#FEE2E2", color: "#DC2626",
            }}>
              ⚠ Muddati o'tgan
            </span>
          )}
          {soon && !overdue && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px",
              borderRadius: 999, background: "#FEF3C7", color: "#D97706",
            }}>
              ⏰ Muddat yaqin
            </span>
          )}
          {task.dueDate && (
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
              📅 {formatDate(task.dueDate)}
            </span>
          )}
          {task.assignerName && (
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              👤 <b style={{ color: "#475569" }}>{task.assignerName}</b> tomonidan
            </span>
          )}
        </div>

        {/* accept / reject */}
        {acceptState === "pending" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => onReject(task.id)}
              style={{
                padding: "5px 12px", borderRadius: 8, border: "1.5px solid #FECACA",
                background: "#FFF5F5", color: "#DC2626",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FFF5F5"; }}
            >
              ✕ Rad etish
            </button>
            <button
              onClick={() => onAccept(task.id)}
              style={{
                padding: "5px 12px", borderRadius: 8, border: "1.5px solid #86EFAC",
                background: "#F0FDF4", color: "#16A34A",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#DCFCE7"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#F0FDF4"; }}
            >
              ✓ Qabul qilish
            </button>
          </div>
        )}

        {/* undo */}
        {acceptState !== "pending" && (
          <button
            onClick={() => onAccept(task.id, "pending")}
            style={{
              padding: "4px 10px", borderRadius: 8, border: "1px solid #E2E8F0",
              background: "transparent", color: "#94A3B8",
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ↩ Bekor qilish
          </button>
        )}
      </div>

      {/* task card */}
      <div style={{ padding: "4px 8px" }}>
        <TaskCard
          task={task}
          hideDelete={true}
          onToggle={() => {}}
          onDelete={() => {}}
          onEdit={() => {}}
        />
      </div>

      {/* comments */}
      <div style={{ padding: "0 16px 14px" }}>
        <CommentSection
          taskId={task.id}
          comments={comments}
          onAdd={onAddComment}
        />
      </div>
    </div>
  );
};

// ─── filter bar ──────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { key: "all",      label: "Barchasi" },
  { key: "pending",  label: "Kutilmoqda" },
  { key: "accepted", label: "Qabul qilingan" },
  { key: "rejected", label: "Rad etilgan" },
  { key: "overdue",  label: "Muddati o'tgan" },
];

const SORT_OPTIONS = [
  { key: "newest",  label: "Yangi birinchi" },
  { key: "oldest",  label: "Eski birinchi" },
  { key: "dueDate", label: "Muddat bo'yicha" },
  { key: "status",  label: "Status bo'yicha" },
];

const FilterBar = ({ filter, setFilter, sort, setSort, total, filtered }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10,
    flexWrap: "wrap",
  }}>
    {/* filter pills */}
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {FILTER_OPTIONS.map(o => (
        <button key={o.key} onClick={() => setFilter(o.key)} style={{
          padding: "6px 14px", borderRadius: 999, border: "none",
          background: filter === o.key ? "#1E293B" : "#F1F5F9",
          color: filter === o.key ? "#fff" : "#475569",
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          fontFamily: "inherit", transition: "all 0.15s",
        }}>{o.label}</button>
      ))}
    </div>

    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#94A3B8" }}>
        {filtered} / {total} ta
      </span>
      {/* sort */}
      <select
        value={sort}
        onChange={e => setSort(e.target.value)}
        style={{
          padding: "6px 10px", borderRadius: 9,
          border: "1.5px solid #E2E8F0", background: "#fff",
          fontSize: 12, fontWeight: 600, color: "#475569",
          fontFamily: "inherit", cursor: "pointer", outline: "none",
        }}
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
    </div>
  </div>
);

// ─── stats bar ───────────────────────────────────────────────────
const StatsBar = ({ tasks, acceptStates }) => {
  const total    = tasks.length;
  const accepted = Object.values(acceptStates).filter(v => v === "accepted").length;
  const rejected = Object.values(acceptStates).filter(v => v === "rejected").length;
  const pending  = total - accepted - rejected;
  const overdue  = tasks.filter(isOverdue).length;

  const stats = [
    { label: "Jami",          value: total,    color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Kutilmoqda",    value: pending,   color: "#64748B", bg: "#F1F5F9" },
    { label: "Qabul qilindi", value: accepted,  color: "#16A34A", bg: "#F0FDF4" },
    { label: "Rad etildi",    value: rejected,  color: "#DC2626", bg: "#FFF5F5" },
    { label: "Muddati o'tdi", value: overdue,   color: "#D97706", bg: "#FFFBEB" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {stats.map(s => (
        <div key={s.label} style={{
          flex: "1 1 80px",
          background: s.bg, borderRadius: 12, padding: "10px 14px",
          border: `1px solid ${s.color}20`,
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: s.color, opacity: 0.8, marginTop: 1 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function Incoming() {
  const { tasks, toggleTask, deleteTask, editTask } = useContext(TaskContext);
  const { user } = useContext(AuthContext);

  const incoming = getIncomingTasks(tasks, user?.uid);

  // local state (in real app: save to DB / context)
  const [acceptStates, setAcceptStates] = useState({}); // { taskId: "pending"|"accepted"|"rejected" }
  const [comments,     setComments]     = useState({}); // { taskId: [{text, createdAt}] }
  const [filter,       setFilter]       = useState("all");
  const [sort,         setSort]         = useState("newest");

  const getState = (id) => acceptStates[id] || "pending";

  const handleAccept = (id, override) => {
    setAcceptStates(prev => ({ ...prev, [id]: override || "accepted" }));
  };
  const handleReject = (id) => {
    setAcceptStates(prev => ({ ...prev, [id]: "rejected" }));
  };
  const handleAddComment = (taskId, text) => {
    setComments(prev => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), { text, createdAt: new Date().toISOString() }],
    }));
  };

  // filter
  const filtered = useMemo(() => {
    let list = [...incoming];
    if (filter === "pending")  list = list.filter(t => getState(t.id) === "pending");
    if (filter === "accepted") list = list.filter(t => getState(t.id) === "accepted");
    if (filter === "rejected") list = list.filter(t => getState(t.id) === "rejected");
    if (filter === "overdue")  list = list.filter(isOverdue);

    // sort
    if (sort === "newest")  list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (sort === "oldest")  list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (sort === "dueDate") list.sort((a, b) => new Date(a.dueDate || "9999") - new Date(b.dueDate || "9999"));
    if (sort === "status")  list.sort((a, b) => {
      const order = { pending: 0, accepted: 1, rejected: 2 };
      return (order[getState(a.id)] ?? 0) - (order[getState(b.id)] ?? 0);
    });

    return list;
  }, [incoming, filter, sort, acceptStates]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 48px", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>📥</div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
              Menga berilgan vazifalar
            </h1>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, marginTop: 2 }}>
              Boshqalar tomonidan yuborilgan vazifalar
            </p>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      {incoming.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <StatsBar tasks={incoming} acceptStates={acceptStates} />
        </div>
      )}

      {/* ── FILTER BAR ── */}
      {incoming.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <FilterBar
            filter={filter} setFilter={setFilter}
            sort={sort} setSort={setSort}
            total={incoming.length} filtered={filtered.length}
          />
        </div>
      )}

      {/* ── EMPTY ── */}
      {incoming.length === 0 && (
        <div style={{
          textAlign: "center", padding: "64px 24px",
          background: "#F8FAFC", borderRadius: 20,
          border: "1.5px dashed #CBD5E1",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
            Hozircha vazifa yo'q
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>
            Sizga hali hech kim vazifa bermagan
          </div>
        </div>
      )}

      {/* ── NO RESULTS ── */}
      {incoming.length > 0 && filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: "#F8FAFC", borderRadius: 16,
          border: "1px solid #E2E8F0",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>
            Bu filtrlarda natija topilmadi
          </div>
        </div>
      )}

      {/* ── LIST ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(task => (
          <IncomingCard
            key={task.id}
            task={task}
            acceptState={getState(task.id)}
            onAccept={handleAccept}
            onReject={handleReject}
            comments={comments}
            onAddComment={handleAddComment}
          />
        ))}
      </div>
    </div>
  );
}
