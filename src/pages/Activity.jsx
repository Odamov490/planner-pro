import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const ACTION_TYPES = {
  task_created:   { label: "Vazifa yaratildi",   icon: "✅", color: "#22c55e", bg: "#f0fdf4" },
  task_updated:   { label: "Vazifa yangilandi",   icon: "✏️", color: "#f59e0b", bg: "#fffbeb" },
  task_deleted:   { label: "Vazifa o'chirildi",   icon: "🗑",  color: "#ef4444", bg: "#fef2f2" },
  task_completed: { label: "Vazifa bajarildi",    icon: "🏆", color: "#6366f1", bg: "#eff6ff" },
  team_created:   { label: "Jamoa yaratildi",     icon: "👥", color: "#0ea5e9", bg: "#f0f9ff" },
  team_joined:    { label: "Jamoaga qo'shildi",   icon: "🤝", color: "#14b8a6", bg: "#f0fdfa" },
  team_left:      { label: "Jamoadan chiqdi",     icon: "🚪", color: "#9ca3af", bg: "#f9fafb" },
  login:          { label: "Tizimga kirdi",        icon: "🔐", color: "#8b5cf6", bg: "#f5f3ff" },
  logout:         { label: "Tizimdan chiqdi",      icon: "🔓", color: "#9ca3af", bg: "#f9fafb" },
  default:        { label: "Faoliyat",             icon: "📌", color: "#6b7280", bg: "#f9fafb" },
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const getActionMeta = (action) => {
  if (!action) return ACTION_TYPES.default;
  const key = Object.keys(ACTION_TYPES).find((k) =>
    action.toLowerCase().includes(k.replace("_", " ")) ||
    action.toLowerCase().includes(k)
  );
  return ACTION_TYPES[key] || ACTION_TYPES.default;
};

const initials = (email) =>
  (email || "?").split("@")[0].slice(0, 2).toUpperCase();

const fmtDate = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;

  if (diff < 60)   return "Hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;

  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtFullDate = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("uz-UZ", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// ═══════════════════════════════════════════════════════════════
// MINI COMPONENTS
// ═══════════════════════════════════════════════════════════════
const Avatar = ({ email, size = 36 }) => {
  const colors = ["#6366f1","#0ea5e9","#22c55e","#f59e0b","#ef4444","#ec4899","#8b5cf6","#14b8a6"];
  const color  = colors[(email || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: color + "20", border: `2px solid ${color}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 800, color,
    }}>
      {initials(email)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LOG CARD
// ═══════════════════════════════════════════════════════════════
const LogCard = ({ log }) => {
  const meta = getActionMeta(log.action);

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "14px 18px",
      border: "1px solid rgba(0,0,0,0.07)",
      display: "flex", alignItems: "center", gap: 14,
      transition: "all 0.2s",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = `0 4px 16px ${meta.color}15`;
        e.currentTarget.style.borderColor = meta.color + "25";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)";
      }}
    >
      {/* Action icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: meta.bg, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 18,
        border: `1px solid ${meta.color}20`,
      }}>
        {meta.icon}
      </div>

      {/* User avatar */}
      <Avatar email={log.userEmail} size={36} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
            {log.userEmail?.split("@")[0] || "Noma'lum"}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>—</span>
          <span style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>
            {log.action || meta.label}
          </span>
        </div>
        {log.detail && (
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {log.detail}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#9ca3af" }} title={fmtFullDate(log.createdAt)}>
          🕐 {fmtDate(log.createdAt)}
          {log.time && !log.createdAt && ` — ${log.time}`}
        </div>
      </div>

      {/* Badge */}
      <span style={{
        fontSize: 10, fontWeight: 700, color: meta.color,
        background: meta.bg, padding: "3px 10px", borderRadius: 999,
        border: `1px solid ${meta.color}25`, flexShrink: 0,
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {meta.icon} {meta.label}
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
function Activity() {
  const { user } = useContext(AuthContext);
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all"); // all | mine

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "activity_logs"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // ── Filter ──
  const filtered = logs.filter((log) => {
    const matchFilter = filter === "all" || log.userEmail === user?.email;
    const matchSearch =
      !search ||
      (log.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.action    || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.detail    || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // ── Stats ──
  const todayCount = logs.filter((l) => {
    if (!l.createdAt) return false;
    const d = l.createdAt.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const myCount = logs.filter((l) => l.userEmail === user?.email).length;

  // ── Group by date ──
  const grouped = filtered.reduce((acc, log) => {
    const d = log.createdAt?.toDate
      ? log.createdAt.toDate()
      : log.createdAt
        ? new Date(log.createdAt)
        : null;

    const label = d
      ? (() => {
          const now = new Date();
          if (d.toDateString() === now.toDateString()) return "Bugun";
          const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
          if (d.toDateString() === yesterday.toDateString()) return "Kecha";
          return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" });
        })()
      : "Sana noma'lum";

    if (!acc[label]) acc[label] = [];
    acc[label].push(log);
    return acc;
  }, {});

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f7f4",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
            borderRadius: 24, padding: "28px 32px", color: "#fff",
            position: "relative", overflow: "hidden",
          }}>
            {[{ s: 180, r: -40, t: -40 }, { s: 120, l: -30, b: -30 }].map((c, i) => (
              <div key={i} style={{
                position: "absolute", width: c.s, height: c.s,
                borderRadius: "50%", background: "#fff", opacity: 0.04,
                right: c.r, top: c.t, left: c.l, bottom: c.b,
              }} />
            ))}
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
                Shaxsiy
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                Faoliyat logi
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6, marginBottom: 0 }}>
                Tizimda amalga oshirilgan barcha harakatlar
              </p>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Jami faoliyat",  value: logs.length,  icon: "📊", color: "#6366f1" },
            { label: "Bugun",          value: todayCount,   icon: "📅", color: "#22c55e" },
            { label: "Mening loglarim",value: myCount,      icon: "👤", color: "#0ea5e9" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
              borderRadius: 16, padding: "16px 20px", flex: 1, minWidth: 140,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── SEARCH + FILTER ── */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: "12px 16px", marginBottom: 20,
          border: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
        }}>
          <span style={{ color: "#9ca3af", fontSize: 16 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidiruv: email, harakat…"
            style={{ flex: 1, minWidth: 160, border: "none", outline: "none", fontSize: 14, color: "#1a1a1a", fontFamily: "inherit", background: "transparent" }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { v: "all",  l: "Barchasi" },
              { v: "mine", l: "Mening" },
            ].map((f) => (
              <button key={f.v} onClick={() => setFilter(f.v)} style={{
                padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                background: filter === f.v ? "#1a1a1a" : "#f3f4f6",
                color:      filter === f.v ? "#fff"    : "#6b7280",
                transition: "all 0.15s",
              }}>{f.l}</button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>Yuklanmoqda…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: "60px 20px", textAlign: "center", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              {search ? "Hech narsa topilmadi" : "Faoliyat yo'q"}
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              {search ? "Qidiruv so'zini o'zgartiring" : "Hali hech qanday harakat amalga oshirilmagan"}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              {/* Date label */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {date}
                </div>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
                <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{items.length} ta</div>
              </div>

              {/* Logs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((log) => <LogCard key={log.id} log={log} />)}
              </div>
            </div>
          ))
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

export default Activity;
