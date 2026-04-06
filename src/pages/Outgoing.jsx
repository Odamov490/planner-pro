import { useState, useContext, useMemo } from "react";
import { TaskContext } from "../context/TaskContext";
import { AuthContext } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";

// ═══════════════════════════════════════════════════════════════
// STYLE TOKENS (Tasks.jsx bilan mos)
// ═══════════════════════════════════════════════════════════════
const card = {
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 20,
  padding: "22px 24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const pill = (active, color = "#1a1a1a") => ({
  padding: "7px 16px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  background: active ? color : "#f3f4f6",
  color: active ? "#fff" : "#6b7280",
  transition: "all 0.15s",
});

const PRIORITY_CFG = {
  high:   { color: "#ef4444", bg: "#fef2f2", label: "Yuqori",  icon: "🔴" },
  medium: { color: "#f59e0b", bg: "#fffbeb", label: "O'rta",   icon: "🟡" },
  low:    { color: "#22c55e", bg: "#f0fdf4", label: "Past",    icon: "🟢" },
};

const todayStr = () => new Date().toISOString().split("T")[0];

const fmtDate = (d) => {
  if (!d) return null;
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" });
};

const daysLeft = (d) => {
  if (!d) return null;
  const diff = new Date(`${d}T00:00:00`) - new Date(`${todayStr()}T00:00:00`);
  return Math.round(diff / 864e5);
};

// ═══════════════════════════════════════════════════════════════
// MINI COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ─── STAT CARD ────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon, sub }) => (
  <div style={{
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: 16,
    padding: "16px 18px",
    display: "flex", flexDirection: "column", gap: 6,
    flex: 1, minWidth: 110,
    position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", right: -12, top: -12,
      width: 52, height: 52, borderRadius: "50%",
      background: color + "12",
    }}/>
    <span style={{ fontSize: 22 }}>{icon}</span>
    <span style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
    {sub && <span style={{ fontSize: 10, color, fontWeight: 600 }}>{sub}</span>}
  </div>
);

// ─── PROGRESS BAR ─────────────────────────────────────────────
const ProgressBar = ({ pct, color, height = 6 }) => (
  <div style={{ background: "#f3f4f6", borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(pct, 100)}%`,
      height: "100%",
      background: color,
      borderRadius: 99,
      transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: `0 0 6px ${color}50`,
    }}/>
  </div>
);

// ─── AVATAR ───────────────────────────────────────────────────
const Avatar = ({ email, photo, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: photo ? "transparent" : "#eff6ff",
    border: "2px solid #e0e7ff",
    overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.35, fontWeight: 800, color: "#6366f1",
    flexShrink: 0,
  }}>
    {photo
      ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
      : (email || "?").slice(0, 2).toUpperCase()
    }
  </div>
);

// ─── DEADLINE CHIP ────────────────────────────────────────────
const DeadlineChip = ({ date, completed }) => {
  if (!date) return null;
  const dl = daysLeft(date);
  let color = "#9ca3af", bg = "#f9fafb", text = fmtDate(date);
  if (completed)        { color = "#22c55e"; bg = "#f0fdf4"; text = "✓ Bajarildi"; }
  else if (dl < 0)      { color = "#ef4444"; bg = "#fef2f2"; text = `${Math.abs(dl)} kun kechikdi`; }
  else if (dl === 0)    { color = "#6366f1"; bg = "#eff6ff"; text = "Bugun!"; }
  else if (dl === 1)    { color = "#f59e0b"; bg = "#fffbeb"; text = "Ertaga"; }
  else if (dl <= 3)     { color = "#f97316"; bg = "#fff7ed"; text = `${dl} kun qoldi`; }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 999, background: bg, color,
      border: `1px solid ${color}30`,
      whiteSpace: "nowrap",
    }}>{text}</span>
  );
};

// ─── RECIPIENT SUMMARY CARD ───────────────────────────────────
// Bitta odamga berilgan vazifalar uchun kichik karta
const RecipientCard = ({ email, tasks, onSelect, isActive }) => {
  const done  = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const hasOverdue = tasks.some(t =>
    !t.completed && t.date && t.date < todayStr()
  );

  return (
    <div
      onClick={() => onSelect(isActive ? null : email)}
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        border: `1.5px solid ${isActive ? "#6366f1" : hasOverdue ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.08)"}`,
        background: isActive ? "#eff6ff" : "#fff",
        cursor: "pointer",
        transition: "all 0.18s ease",
        display: "flex", flexDirection: "column", gap: 10,
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = hasOverdue ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.08)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar email={email} size={36}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: "#1a1a1a",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {email?.split("@")[0]}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#6366f1" }}>{total}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>vazifa</div>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>
            {done}/{total} bajarildi
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: pct === 100 ? "#22c55e" : "#6366f1" }}>
            {pct}%
          </span>
        </div>
        <ProgressBar pct={pct} color={pct === 100 ? "#22c55e" : "#6366f1"}/>
      </div>

      {/* Tags row */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {hasOverdue && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
            background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca",
          }}>⚠ Kechikkan</span>
        )}
        {pct === 100 && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
            background: "#f0fdf4", color: "#22c55e", border: "1px solid #bbf7d0",
          }}>✓ Hammasi tayyor</span>
        )}
        {tasks.some(t => t.priority === "high" && !t.completed) && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
            background: "#fef2f2", color: "#ef4444",
          }}>🔴 Shoshilinch bor</span>
        )}
      </div>
    </div>
  );
};

// ─── EMPTY STATE ──────────────────────────────────────────────
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
  const { tasks, toggleTask, deleteTask, editTask } = useContext(TaskContext);
  const { user } = useContext(AuthContext);

  // ── UI state ──
  const [search,          setSearch]          = useState("");
  const [filterStatus,    setFilterStatus]    = useState("all");   // all|active|done|overdue
  const [filterPriority,  setFilterPriority]  = useState("all");   // all|high|medium|low
  const [sortBy,          setSortBy]          = useState("date");   // date|priority|alpha|recipient
  const [viewMode,        setViewMode]        = useState("grouped"); // grouped|list|recipients
  const [activeRecipient, setActiveRecipient] = useState(null);     // email filter

  // ── BASE FILTER: faqat men yuborgan, o'zimga emas ──
  const outgoing = useMemo(() =>
    tasks.filter(t =>
      t.userId === user?.uid &&
      t.assignedTo !== user?.uid &&
      !t.archived
    ),
    [tasks, user]
  );

  // ── STATS ──
  const stats = useMemo(() => {
    const total   = outgoing.length;
    const done    = outgoing.filter(t => t.completed).length;
    const overdue = outgoing.filter(t => !t.completed && t.date && t.date < todayStr()).length;
    const high    = outgoing.filter(t => t.priority === "high" && !t.completed).length;
    const pct     = total ? Math.round((done / total) * 100) : 0;

    // By recipient
    const byRecipient = {};
    outgoing.forEach(t => {
      const key = t.assignedEmail || t.assignedTo || "Noma'lum";
      if (!byRecipient[key]) byRecipient[key] = [];
      byRecipient[key].push(t);
    });

    // By priority
    const byPriority = { high: 0, medium: 0, low: 0 };
    outgoing.forEach(t => { if (byPriority[t.priority] !== undefined) byPriority[t.priority]++; });

    return { total, done, overdue, high, pct, byRecipient, byPriority };
  }, [outgoing]);

  // ── FILTERED + SORTED ──
  const filtered = useMemo(() => {
    let list = [...outgoing];

    // Recipient filter
    if (activeRecipient) {
      list = list.filter(t =>
        t.assignedEmail === activeRecipient || t.assignedTo === activeRecipient
      );
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.assignedEmail?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }

    // Status filter
    list = list.filter(t => {
      if (filterStatus === "done")    return t.completed;
      if (filterStatus === "active")  return !t.completed;
      if (filterStatus === "overdue") return !t.completed && t.date && t.date < todayStr();
      return true;
    });

    // Priority filter
    if (filterPriority !== "all") {
      list = list.filter(t => t.priority === filterPriority);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "priority") {
        const o = { high: 0, medium: 1, low: 2 };
        return (o[a.priority] ?? 3) - (o[b.priority] ?? 3);
      }
      if (sortBy === "alpha")     return a.title?.localeCompare(b.title);
      if (sortBy === "recipient") return (a.assignedEmail || "").localeCompare(b.assignedEmail || "");
      return (a.date || "z").localeCompare(b.date || "z");
    });

    return list;
  }, [outgoing, activeRecipient, search, filterStatus, filterPriority, sortBy]);

  // ── GROUPED BY DATE ──
  const grouped = useMemo(() => {
    const m = {};
    filtered.forEach(t => {
      const d = t.date || "Sanasiz";
      if (!m[d]) m[d] = [];
      m[d].push(t);
    });
    return m;
  }, [filtered]);

  const today = todayStr();
  const recipients = Object.entries(stats.byRecipient)
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f7f4",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      color: "#1a1a1a",
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
            borderRadius: 24, padding: "26px 30px", color: "#fff",
            position: "relative", overflow: "hidden",
          }}>
            {/* deco circles */}
            {[
              { w: 160, r: -40, t: -40, o: 0.05 },
              { w: 100, r: 80,  t: -20, o: 0.03 },
            ].map((c, i) => (
              <div key={i} style={{
                position: "absolute", width: c.w, height: c.w, borderRadius: "50%",
                background: "#fff", opacity: c.o, right: c.r, top: c.t,
              }}/>
            ))}

            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
                  Topshiriqlar
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                  📤 Men bergan vazifalar
                </h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6, marginBottom: 0 }}>
                  Boshqalarga topshirgan vazifalaringiz
                </p>
              </div>

              {/* Quick summary */}
              <div style={{
                display: "flex", gap: 12,
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                borderRadius: 14, padding: "12px 18px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}>
                {[
                  { label: "Jami", val: stats.total,   color: "#fff" },
                  { label: "Tayyor", val: stats.done,  color: "#4ade80" },
                  { label: "Kechikkan", val: stats.overdue, color: "#f87171" },
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
            {/* ── STAT CARDS ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <StatCard label="Jami yuborildi"   value={stats.total}   icon="📤" color="#6366f1"/>
              <StatCard label="Bajarildi"         value={stats.done}    icon="✅" color="#22c55e"
                sub={`${stats.pct}% yakunlangan`}/>
              <StatCard label="Kechikkan"         value={stats.overdue} icon="⚠️" color="#ef4444"
                sub={stats.overdue > 0 ? "Diqqat talab qiladi" : undefined}/>
              <StatCard label="Shoshilinch"       value={stats.high}    icon="🔥" color="#f59e0b"/>

              {/* Overall progress ring */}
              <div style={{
                background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 16, padding: "14px 18px", flex: 1, minWidth: 90,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              }}>
                {(() => {
                  const r = 20, circ = 2 * Math.PI * r;
                  const off = circ - (stats.pct / 100) * circ;
                  return (
                    <div style={{ position: "relative" }}>
                      <svg width={50} height={50} style={{ transform: "rotate(-90deg)" }}>
                        <circle cx={25} cy={25} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5}/>
                        <circle cx={25} cy={25} r={r} fill="none"
                          stroke={stats.pct === 100 ? "#22c55e" : "#6366f1"}
                          strokeWidth={5} strokeDasharray={circ}
                          strokeDashoffset={off} strokeLinecap="round"
                          style={{ transition: "stroke-dashoffset 0.6s ease" }}
                        />
                      </svg>
                      <span style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, color: "#1a1a1a",
                      }}>{stats.pct}%</span>
                    </div>
                  );
                })()}
                <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Jarayon</span>
              </div>
            </div>

            {/* ── VIEW TABS ── */}
            <div style={{
              display: "flex", gap: 4, marginBottom: 16,
              background: "#fff", borderRadius: 14, padding: 5,
              border: "1px solid rgba(0,0,0,0.07)",
              width: "fit-content",
            }}>
              {[
                { v: "grouped",    l: "▤ Guruh"      },
                { v: "list",       l: "≡ Ro'yxat"    },
                { v: "recipients", l: `👤 Qabul qiluvchilar (${recipients.length})` },
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

            {/* ── SEARCH + FILTERS ── */}
            <div style={{ ...card, marginBottom: 14, padding: "12px 14px" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>

                {/* Search */}
                <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 14 }}>⌕</span>
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

                {/* Status pills */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[
                    { v: "all",     l: "Hammasi"   },
                    { v: "active",  l: "Faol"      },
                    { v: "done",    l: "Bajarildi" },
                    { v: "overdue", l: "⚠ Kechikkan"},
                  ].map(f => (
                    <button key={f.v} onClick={() => setFilterStatus(f.v)} style={pill(filterStatus === f.v)}>
                      {f.l}
                    </button>
                  ))}
                </div>

                {/* Priority pills */}
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { v: "all",    l: "Barchasi", c: "#1a1a1a" },
                    { v: "high",   l: "🔴",       c: "#ef4444" },
                    { v: "medium", l: "🟡",       c: "#f59e0b" },
                    { v: "low",    l: "🟢",       c: "#22c55e" },
                  ].map(f => (
                    <button key={f.v} onClick={() => setFilterPriority(f.v)}
                      title={PRIORITY_CFG[f.v]?.label || "Barchasi"}
                      style={pill(filterPriority === f.v, f.c)}>
                      {f.l}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                  padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)",
                  fontSize: 13, fontFamily: "inherit", background: "#fafafa", color: "#374151",
                  cursor: "pointer", outline: "none",
                }}>
                  <option value="date">Sana bo'yicha</option>
                  <option value="priority">Muhimlik bo'yicha</option>
                  <option value="alpha">Alifbo bo'yicha</option>
                  <option value="recipient">Qabul qiluvchi bo'yicha</option>
                </select>
              </div>

              {/* Active recipient chip */}
              {activeRecipient && (
                <div style={{
                  marginTop: 10, display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 12px", background: "#eff6ff",
                  borderRadius: 10, width: "fit-content",
                  border: "1px solid #e0e7ff",
                }}>
                  <Avatar email={activeRecipient} size={22}/>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1" }}>
                    {activeRecipient}
                  </span>
                  <button onClick={() => setActiveRecipient(null)} style={{
                    border: "none", background: "transparent", cursor: "pointer",
                    color: "#9ca3af", fontSize: 15, padding: "0 2px",
                  }}>×</button>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════
                RECIPIENTS VIEW
            ══════════════════════════════════════════════════ */}
            {viewMode === "recipients" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Recipient cards grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                  gap: 12,
                }}>
                  {recipients.map(([email, recipientTasks]) => (
                    <RecipientCard
                      key={email}
                      email={email}
                      tasks={recipientTasks}
                      onSelect={setActiveRecipient}
                      isActive={activeRecipient === email}
                    />
                  ))}
                </div>

                {/* If recipient selected — show their tasks */}
                {activeRecipient && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <Avatar email={activeRecipient} size={32}/>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>
                        {activeRecipient}
                      </span>
                      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }}/>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>
                        {stats.byRecipient[activeRecipient]?.length || 0} ta vazifa
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {filtered.map(t => (
                        <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask}/>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                GROUPED VIEW
            ══════════════════════════════════════════════════ */}
            {viewMode === "grouped" && (
              filtered.length === 0
                ? <Empty icon="🔍" title="Hech narsa topilmadi" sub="Filter yoki qidiruvni o'zgartiring"/>
                : Object.keys(grouped).sort().map(d => {
                    const isToday = d === today;
                    const grpTasks = grouped[d];
                    const grpDone  = grpTasks.filter(t => t.completed).length;

                    return (
                      <div key={d} style={{ marginBottom: 16 }}>
                        {/* Date header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: isToday ? "#6366f1" : "#6b7280",
                            textTransform: "uppercase", letterSpacing: "0.08em",
                          }}>
                            {d === "Sanasiz" ? "📌 Sanasiz"
                              : isToday ? "📅 Bugun"
                              : d < today ? `⚠ ${d}`
                              : `📅 ${d}`}
                          </span>
                          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }}/>
                          <span style={{
                            fontSize: 10, color: "#9ca3af", fontWeight: 600,
                            background: "#f3f4f6", borderRadius: 999, padding: "2px 8px",
                          }}>{grpDone}/{grpTasks.length}</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                          {grpTasks.map(t => (
                            <div key={t.id} style={{ position: "relative" }}>
                              <TaskCard task={t} onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask}/>

                              {/* Recipient tag overlay */}
                              {t.assignedEmail && (
                                <div
                                  onClick={() => setActiveRecipient(
                                    activeRecipient === t.assignedEmail ? null : t.assignedEmail
                                  )}
                                  style={{
                                    position: "absolute", top: 10, right: 10,
                                    display: "flex", alignItems: "center", gap: 5,
                                    padding: "3px 9px 3px 5px",
                                    background: "#f5f3ff",
                                    border: "1px solid #e0e7ff",
                                    borderRadius: 999, cursor: "pointer",
                                    fontSize: 11, fontWeight: 700, color: "#6366f1",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  <Avatar email={t.assignedEmail} size={16}/>
                                  {t.assignedEmail.split("@")[0]}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
            )}

            {/* ══════════════════════════════════════════════════
                LIST VIEW — ixcham jadval
            ══════════════════════════════════════════════════ */}
            {viewMode === "list" && (
              filtered.length === 0
                ? <Empty icon="🔍" title="Hech narsa topilmadi" sub="Filter yoki qidiruvni o'zgartiring"/>
                : (
                  <div style={card}>
                    {/* Table header */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 120px 90px 100px 70px",
                      gap: 8, padding: "0 0 10px",
                      borderBottom: "1px solid rgba(0,0,0,0.07)",
                      marginBottom: 4,
                    }}>
                      {["Vazifa", "Qabul qiluvchi", "Muhimlik", "Muddat", "Holat"].map(h => (
                        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {h}
                        </div>
                      ))}
                    </div>

                    {filtered.map((t, idx) => {
                      const p = PRIORITY_CFG[t.priority];
                      return (
                        <div key={t.id} style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 120px 90px 100px 70px",
                          gap: 8, alignItems: "center",
                          padding: "10px 0",
                          borderBottom: idx < filtered.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                        }}>
                          {/* Title */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              onClick={() => toggleTask(t.id)}
                              style={{
                                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                border: `2px solid ${t.completed ? "#22c55e" : "#d1d5db"}`,
                                background: t.completed ? "#22c55e" : "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "all 0.15s",
                              }}
                            >
                              {t.completed && (
                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                  <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                              )}
                            </div>
                            <span style={{
                              fontSize: 13, fontWeight: 600,
                              color: t.completed ? "#9ca3af" : "#1a1a1a",
                              textDecoration: t.completed ? "line-through" : "none",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{t.title}</span>
                          </div>

                          {/* Recipient */}
                          <div
                            onClick={() => setActiveRecipient(
                              activeRecipient === t.assignedEmail ? null : t.assignedEmail
                            )}
                            style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}
                          >
                            <Avatar email={t.assignedEmail} size={20}/>
                            <span style={{
                              fontSize: 11, color: "#6366f1", fontWeight: 600,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {t.assignedEmail?.split("@")[0] || "—"}
                            </span>
                          </div>

                          {/* Priority */}
                          {p ? (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 8px",
                              borderRadius: 999, background: p.bg, color: p.color,
                              border: `1px solid ${p.color}30`,
                            }}>
                              {p.icon} {p.label}
                            </span>
                          ) : <span style={{ color: "#d1d5db" }}>—</span>}

                          {/* Deadline */}
                          <DeadlineChip date={t.date} completed={t.completed}/>

                          {/* Delete */}
                          <button onClick={() => deleteTask(t.id)} style={{
                            border: "none", background: "transparent", cursor: "pointer",
                            color: "#e5e7eb", fontSize: 16, padding: "0 4px",
                            transition: "color 0.1s",
                          }}
                          onMouseEnter={e => e.target.style.color = "#ef4444"}
                          onMouseLeave={e => e.target.style.color = "#e5e7eb"}
                          >×</button>
                        </div>
                      );
                    })}
                  </div>
                )
            )}

            {/* ── BOTTOM SUMMARY ── */}
            {filtered.length > 0 && (
              <div style={{
                marginTop: 20, padding: "12px 16px",
                background: "#fff", borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.07)",
                display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {filtered.length} ta vazifa ko'rsatilmoqda
                  {activeRecipient ? ` · ${activeRecipient}` : ""}
                </span>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <ProgressBar
                    pct={filtered.length ? (filtered.filter(t => t.completed).length / filtered.length) * 100 : 0}
                    color="#6366f1" height={4}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1" }}>
                  {filtered.filter(t => t.completed).length}/{filtered.length} bajarildi
                </span>
                {activeRecipient && (
                  <button onClick={() => setActiveRecipient(null)} style={{
                    padding: "4px 12px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.1)",
                    background: "transparent", cursor: "pointer", fontSize: 11,
                    fontFamily: "inherit", color: "#6b7280", fontWeight: 600,
                  }}>Filterni tozalash ✕</button>
                )}
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
