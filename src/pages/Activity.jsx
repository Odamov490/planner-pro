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
  login:            { label: "Tizimga kirdi",         icon: "🔐", color: "#8b5cf6", bg: "#f5f3ff" },
  logout:           { label: "Tizimdan chiqdi",       icon: "🔓", color: "#9ca3af", bg: "#f9fafb" },
  task_created:     { label: "Vazifa yaratdi",         icon: "✅", color: "#22c55e", bg: "#f0fdf4" },
  task_updated:     { label: "Vazifani yangiladi",     icon: "✏️", color: "#f59e0b", bg: "#fffbeb" },
  task_deleted:     { label: "Vazifani o'chirdi",      icon: "🗑",  color: "#ef4444", bg: "#fef2f2" },
  task_completed:   { label: "Vazifani bajardi",       icon: "🏆", color: "#6366f1", bg: "#eff6ff" },
  team_created:     { label: "Jamoa yaratdi",          icon: "👥", color: "#0ea5e9", bg: "#f0f9ff" },
  team_updated:     { label: "Jamoani yangiladi",      icon: "✏️", color: "#f59e0b", bg: "#fffbeb" },
  team_deleted:     { label: "Jamoani o'chirdi",       icon: "🗑",  color: "#ef4444", bg: "#fef2f2" },
  team_joined:      { label: "Jamoaga qo'shildi",     icon: "🤝", color: "#14b8a6", bg: "#f0fdfa" },
  team_left:        { label: "Jamoadan chiqdi",        icon: "🚪", color: "#9ca3af", bg: "#f9fafb" },
  member_added:     { label: "A'zo qo'shdi",           icon: "➕", color: "#22c55e", bg: "#f0fdf4" },
  member_removed:   { label: "A'zoni chiqardi",        icon: "➖", color: "#ef4444", bg: "#fef2f2" },
  company_created:  { label: "Kompaniya yaratdi",      icon: "🏢", color: "#6366f1", bg: "#eff6ff" },
  company_updated:  { label: "Kompaniyani yangiladi",  icon: "✏️", color: "#f59e0b", bg: "#fffbeb" },
  project_created:  { label: "Loyiha yaratdi",         icon: "📁", color: "#8b5cf6", bg: "#f5f3ff" },
  project_updated:  { label: "Loyihani yangiladi",     icon: "✏️", color: "#f59e0b", bg: "#fffbeb" },
  project_deleted:  { label: "Loyihani o'chirdi",      icon: "🗑",  color: "#ef4444", bg: "#fef2f2" },
  profile_updated:  { label: "Profilni yangiladi",     icon: "👤", color: "#14b8a6", bg: "#f0fdfa" },
  password_changed: { label: "Parol o'zgartirdi",      icon: "🔑", color: "#f59e0b", bg: "#fffbeb" },
  game_played:      { label: "O'yin o'ynadi",           icon: "🎮", color: "#ec4899", bg: "#fdf2f8" },
};

const getMeta = (action) =>
  ACTION_META[action] || { label: action || "Faoliyat", icon: "📌", color: "#6b7280", bg: "#f9fafb" };

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
// AVATAR
// ═══════════════════════════════════════════════════════════════
const Avatar = ({ name, avatar, size = 36 }) => {
  const color = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: avatar ? "transparent" : color + "20",
      border: `2px solid ${color}30`, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 800, color,
    }}>
      {avatar
        ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials(name)
      }
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LOG ROW
// ═══════════════════════════════════════════════════════════════
const LogRow = ({ log, isAdmin }) => {
  const meta = getMeta(log.action);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 16px", borderRadius: 14,
      background: "#fff", border: "1px solid rgba(0,0,0,0.06)",
      transition: "all 0.18s",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = `0 4px 16px ${meta.color}12`;
        e.currentTarget.style.borderColor = meta.color + "25";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
      }}
    >
      {/* Action icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: meta.bg, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 16,
        border: `1px solid ${meta.color}20`,
      }}>
        {meta.icon}
      </div>

      {/* User avatar — faqat admin uchun */}
      {isAdmin && (
        <Avatar
          name={log.displayName || log.userEmail}
          avatar={log.avatar}
          size={32}
        />
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: log.detail ? 2 : 0 }}>
          {isAdmin && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
              {log.displayName || log.userEmail?.split("@")[0]}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, color: meta.color,
            background: meta.bg, padding: "2px 8px", borderRadius: 6,
            border: `1px solid ${meta.color}20`,
          }}>
            {meta.icon} {meta.label}
          </span>
          {log.page && (
            <span style={{ fontSize: 10, color: "#9ca3af", background: "#f3f4f6", padding: "2px 7px", borderRadius: 6 }}>
              {log.page}
            </span>
          )}
        </div>

        {log.detail && (
          <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {log.detail}
          </div>
        )}

        {isAdmin && log.userEmail && (
          <div style={{ fontSize: 10, color: "#d1d5db", marginTop: 1 }}>{log.userEmail}</div>
        )}
      </div>

      {/* Time */}
      <div style={{ flexShrink: 0, textAlign: "right" }} title={fullTime(log.createdAt)}>
        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
          {relTime(log.createdAt)}
        </div>
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

  // ── Admin tekshiruvi ──
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      setIsAdmin(snap.data()?.role === "admin");
    });
  }, [uid]);

  // ── Loglarni yuklash ──
  useEffect(() => {
    if (!uid) return;

    const q = isAdmin
      ? query(collection(db, "activity_logs"), orderBy("createdAt", "desc"))
      : query(collection(db, "activity_logs"), where("userId", "==", uid), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [uid, isAdmin]);

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
  const grouped = filtered.reduce((acc, log) => {
    const label = dateLabel(log.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(log);
    return acc;
  }, {});

  // ── Statistika ──
  const todayCount = logs.filter((l) => {
    if (!l.createdAt) return false;
    const d = l.createdAt.toDate ? l.createdAt.toDate() : new Date(l.createdAt);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const uniqueUsers = new Set(logs.map((l) => l.userId)).size;

  // ── Ishlatilgan action turlari (filter chips uchun) ──
  const usedActions = [...new Set(logs.map((l) => l.action).filter(Boolean))];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)", borderRadius: 24, padding: "28px 32px", color: "#fff", position: "relative", overflow: "hidden" }}>
            {[{ s: 180, r: -40, t: -40 }, { s: 120, l: -30, b: -30 }].map((c, i) => (
              <div key={i} style={{ position: "absolute", width: c.s, height: c.s, borderRadius: "50%", background: "#fff", opacity: 0.04, right: c.r, top: c.t, left: c.l, bottom: c.b }} />
            ))}
            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>Shaxsiy</div>
                <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>Faoliyat logi</h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6, marginBottom: 0 }}>
                  {isAdmin ? "Barcha foydalanuvchilarning faoliyati" : "Mening faoliyatim"}
                </p>
              </div>
              {isAdmin && (
                <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#fff", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  👑 Admin view
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Jami loglar",        value: logs.length,  icon: "📊", color: "#6366f1" },
            { label: "Bugun",              value: todayCount,   icon: "📅", color: "#22c55e" },
            isAdmin
              ? { label: "Foydalanuvchilar", value: uniqueUsers, icon: "👥", color: "#0ea5e9" }
              : { label: "Mening loglarim",  value: logs.length, icon: "👤", color: "#0ea5e9" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 16, padding: "16px 20px", flex: 1, minWidth: 140, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── SEARCH ── */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "12px 16px", marginBottom: 12, border: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ color: "#9ca3af", fontSize: 16 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAdmin ? "Email, ism, harakat, tafsilot…" : "Harakat, tafsilot…"}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#1a1a1a", fontFamily: "inherit", background: "transparent" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ border: "none", background: "#f3f4f6", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#6b7280", cursor: "pointer", fontFamily: "inherit" }}>
              ✕ Tozalash
            </button>
          )}
        </div>

        {/* ── ACTION FILTER CHIPS ── */}
        {usedActions.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            <button onClick={() => setFilter("all")} style={{
              padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 11, fontWeight: 700, transition: "all 0.15s",
              background: filter === "all" ? "#1a1a1a" : "#f3f4f6",
              color:      filter === "all" ? "#fff"    : "#6b7280",
            }}>Barchasi</button>

            {usedActions.map((action) => {
              const m      = getMeta(action);
              const active = filter === action;
              return (
                <button key={action} onClick={() => setFilter(active ? "all" : action)} style={{
                  padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                  background: active ? m.color : m.bg,
                  color:      active ? "#fff"  : m.color,
                  outline:    active ? "none"  : `1px solid ${m.color}30`,
                }}>
                  {m.icon} {m.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── CONTENT ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>Yuklanmoqda…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: "60px 20px", textAlign: "center", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              {search || filter !== "all" ? "Hech narsa topilmadi" : "Faoliyat yo'q"}
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              {search || filter !== "all" ? "Filtrni o'zgartiring" : "Hali hech qanday harakat amalga oshirilmagan"}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              {/* Date separator */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{date}</div>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
                <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, whiteSpace: "nowrap" }}>{items.length} ta</div>
              </div>

              {/* Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((log) => (
                  <LogRow key={log.id} log={log} isAdmin={isAdmin} />
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
