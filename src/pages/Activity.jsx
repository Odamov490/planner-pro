import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection, query, orderBy, onSnapshot,
  where, doc, getDoc,
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// ACTION META
// ═══════════════════════════════════════════════════════════════
const ACTION_META = {
  login:            { label: "Tizimga kirdi",         icon: "🔐", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.3)"  },
  logout:           { label: "Tizimdan chiqdi",       icon: "🔓", color: "#9ca3af", bg: "rgba(156,163,175,0.08)", border: "rgba(156,163,175,0.3)" },
  task_created:     { label: "Vazifa yaratdi",         icon: "✅", color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.3)"   },
  task_updated:     { label: "Vazifani yangiladi",     icon: "✏️", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)"  },
  task_deleted:     { label: "Vazifani o'chirdi",      icon: "🗑",  color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)"   },
  task_completed:   { label: "Vazifani bajardi",       icon: "🏆", color: "#6366f1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.3)"  },
  team_created:     { label: "Jamoa yaratdi",          icon: "👥", color: "#0ea5e9", bg: "rgba(14,165,233,0.08)",  border: "rgba(14,165,233,0.3)"  },
  team_updated:     { label: "Jamoani yangiladi",      icon: "✏️", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)"  },
  team_deleted:     { label: "Jamoani o'chirdi",       icon: "🗑",  color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)"   },
  team_joined:      { label: "Jamoaga qo'shildi",     icon: "🤝", color: "#14b8a6", bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.3)"  },
  team_left:        { label: "Jamoadan chiqdi",        icon: "🚪", color: "#9ca3af", bg: "rgba(156,163,175,0.08)", border: "rgba(156,163,175,0.3)" },
  member_added:     { label: "A'zo qo'shdi",           icon: "➕", color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.3)"   },
  member_removed:   { label: "A'zoni chiqardi",        icon: "➖", color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)"   },
  company_created:  { label: "Kompaniya yaratdi",      icon: "🏢", color: "#6366f1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.3)"  },
  company_updated:  { label: "Kompaniyani yangiladi",  icon: "✏️", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)"  },
  project_created:  { label: "Loyiha yaratdi",         icon: "📁", color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.3)"  },
  project_updated:  { label: "Loyihani yangiladi",     icon: "✏️", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)"  },
  project_deleted:  { label: "Loyihani o'chirdi",      icon: "🗑",  color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)"   },
  profile_updated:  { label: "Profilni yangiladi",     icon: "👤", color: "#14b8a6", bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.3)"  },
  password_changed: { label: "Parol o'zgartirdi",      icon: "🔑", color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)"  },
  game_played:      { label: "O'yin o'ynadi",           icon: "🎮", color: "#ec4899", bg: "rgba(236,72,153,0.08)",  border: "rgba(236,72,153,0.3)"  },
};

const getMeta = (action) =>
  ACTION_META[action] || { label: action || "Faoliyat", icon: "📌", color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.3)" };

// ═══════════════════════════════════════════════════════════════
// STYLE TOKENS
// ═══════════════════════════════════════════════════════════════
const card = {
  background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 20, padding: "24px 24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
const inputSt = {
  width: "100%", padding: "11px 14px",
  border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12,
  fontSize: 14, outline: "none", background: "#fafafa",
  color: "#1a1a1a", fontFamily: "inherit", boxSizing: "border-box",
  transition: "border-color 0.15s",
};
const pill = (active, color = "#1a1a1a") => ({
  padding: "7px 16px", borderRadius: 999, border: "none", cursor: "pointer",
  fontFamily: "inherit", fontSize: 13, fontWeight: 600,
  background: active ? color : "#f3f4f6",
  color:      active ? "#fff" : "#6b7280",
  transition: "all 0.15s",
});

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const AVATAR_COLORS = ["#6366f1","#0ea5e9","#22c55e","#f59e0b","#ef4444","#ec4899","#8b5cf6","#14b8a6"];
const avatarColor = (str) =>
  AVATAR_COLORS[(str || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const initials = (name) => (name || "?").split("@")[0].slice(0, 2).toUpperCase();

const relTime = (ts) => {
  if (!ts) return "";
  const d    = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)     return "Hozirgina";
  if (diff < 3600)   return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" });
};

const fullTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("uz-UZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const dateLabel = (ts) => {
  if (!ts) return "Noma'lum sana";
  const d   = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const y   = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Bugun";
  if (d.toDateString() === y.toDateString())   return "Kecha";
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" });
};

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════
const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: 16, padding: "16px 18px",
    display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 120,
    position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", right: -12, top: -12,
      width: 52, height: 52, borderRadius: "50%", background: color + "12",
    }} />
    <span style={{ fontSize: 22 }}>{icon}</span>
    <span style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// LOG CARD
// ═══════════════════════════════════════════════════════════════
const LogCard = ({ log, isAdmin }) => {
  const meta  = getMeta(log.action);
  const color = avatarColor(log.userEmail);

  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: 14, padding: "13px 16px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      transition: "all 0.15s",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = `0 4px 16px ${meta.color}15`;
        e.currentTarget.style.borderColor = meta.color + "30";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
        e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)";
      }}
    >
      {/* Action icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: meta.bg, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 18,
        border: `1.5px solid ${meta.border}`,
      }}>
        {meta.icon}
      </div>

      {/* Avatar — faqat admin uchun */}
      {isAdmin && (
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: color + "20", border: `2px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color, overflow: "hidden",
        }}>
          {log.avatar
            ? <img src={log.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials(log.displayName || log.userEmail)
          }
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 }}>
          {isAdmin && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
              {log.displayName || log.userEmail?.split("@")[0]}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, color: meta.color,
            background: meta.bg, padding: "2px 9px", borderRadius: 8,
            border: `1px solid ${meta.border}`,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            {meta.icon} {meta.label}
          </span>
          {log.page && (
            <span style={{
              fontSize: 10, color: "#9ca3af", background: "#f3f4f6",
              padding: "2px 7px", borderRadius: 6, fontWeight: 600,
            }}>
              {log.page}
            </span>
          )}
        </div>

        {log.detail && (
          <div style={{
            fontSize: 12, color: "#6b7280", fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {log.detail}
          </div>
        )}

        {isAdmin && log.userEmail && (
          <div style={{ fontSize: 10, color: "#d1d5db", marginTop: 1 }}>{log.userEmail}</div>
        )}
      </div>

      {/* Time */}
      <div style={{ flexShrink: 0 }} title={fullTime(log.createdAt)}>
        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
          {relTime(log.createdAt)}
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
function Activity() {
  const { user } = useContext(AuthContext);
  const uid = user?.uid;

  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");

  // ── Admin tekshiruvi + loglarni yuklash (birlashtirilgan) ──
  useEffect(() => {
    if (!uid) return;

    let unsub;

    getDoc(doc(db, "users", uid)).then((snap) => {
      const admin = snap.data()?.role === "admin";
      setIsAdmin(admin);

      const q = admin
        ? query(collection(db, "activity_logs"), orderBy("createdAt", "desc"))
        : query(collection(db, "activity_logs"), where("userId", "==", uid), orderBy("createdAt", "desc"));

      unsub = onSnapshot(q, (snapshot) => {
        setLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, (err) => {
        console.error("Activity logs error:", err);
        setLoading(false);
      });
    });

    return () => { if (unsub) unsub(); };
  }, [uid]);

  // ── Filter + search ──
  const filtered = logs.filter((log) => {
    const matchSearch =
      !search ||
      (log.userEmail   || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.action      || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.detail      || "").toLowerCase().includes(search.toLowerCase());

    const matchFilter = filter === "all" || log.action === filter;
    return matchSearch && matchFilter;
  });

  // ── Sana bo'yicha guruhlash ──
  const grouped = {};
  filtered.forEach((log) => {
    const label = dateLabel(log.createdAt);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(log);
  });

  // ── Statistika ──
  const todayCount = logs.filter((l) => {
    if (!l.createdAt) return false;
    const d = l.createdAt.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const uniqueUsers = new Set(logs.map((l) => l.userId)).size;
  const usedActions = [...new Set(logs.map((l) => l.action).filter(Boolean))];

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f7f4",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: "#1a1a1a",
    }}>
      <div style={{ padding: "28px 20px 80px" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Faoliyat logi</h1>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
              {new Date().toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric", month: "short" })}
              {isAdmin && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#1a1a1a", color: "#fff", padding: "2px 8px", borderRadius: 6 }}>
                  👑 Admin
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <StatCard label="Jami loglar"   value={logs.length}    icon="📊" color="#6366f1" />
          <StatCard label="Bugun"         value={todayCount}     icon="📅" color="#22c55e" />
          {isAdmin
            ? <StatCard label="Foydalanuvchilar" value={uniqueUsers}    icon="👥" color="#0ea5e9" />
            : <StatCard label="Mening loglarim"  value={logs.length}    icon="👤" color="#0ea5e9" />
          }
          <StatCard label="Filtrlangan"   value={filtered.length} icon="🔍" color="#f59e0b" />
        </div>

        {/* ── SEARCH + FILTER ── */}
        <div style={{
          ...card, marginBottom: 14, padding: "12px 14px",
          display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 14 }}>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAdmin ? "Email, ism, harakat…" : "Harakat, tafsilot…"}
              style={{ ...inputSt, paddingLeft: 34 }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
            />
          </div>

          {usedActions.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <button onClick={() => setFilter("all")} style={pill(filter === "all")}>
                Barchasi
              </button>
              {usedActions.map((action) => {
                const m = getMeta(action);
                return (
                  <button key={action}
                    onClick={() => setFilter(filter === action ? "all" : action)}
                    style={pill(filter === action, m.color)}>
                    {m.icon} {m.label}
                  </button>
                );
              })}
            </div>
          )}

          {search && (
            <button onClick={() => setSearch("")} style={{
              padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 600,
              background: "#f3f4f6", color: "#6b7280",
            }}>✕ Tozalash</button>
          )}
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div style={{ ...card, textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>⏳</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#6b7280" }}>Yuklanmoqda…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>📭</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#6b7280", marginBottom: 5 }}>
              {search || filter !== "all" ? "Hech narsa topilmadi" : "Faoliyat yo'q"}
            </p>
            <p style={{ fontSize: 13 }}>
              {search || filter !== "all"
                ? "Filter yoki qidiruv sozlamalarini o'zgartiring"
                : "Hali hech qanday harakat amalga oshirilmagan"}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 16 }}>
              {/* Date separator */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {date === "Bugun" ? "📅 Bugun" : date === "Kecha" ? "📅 Kecha" : `📌 ${date}`}
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
                <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, background: "#f3f4f6", borderRadius: 999, padding: "2px 8px" }}>
                  {items.length}
                </span>
              </div>

              {/* Log cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {items.map((log) => (
                  <LogCard key={log.id} log={log} isAdmin={isAdmin} />
                ))}
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
