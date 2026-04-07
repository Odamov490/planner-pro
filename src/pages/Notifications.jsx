import { useState, useMemo, useContext } from "react";
import { NotificationContext, NOTIF_TYPES } from "../context/NotificationContext";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const timeAgo = (ts) => {
  if (!ts) return "";
  const ms  = ts?.toMillis?.() ?? new Date(ts).getTime();
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60)     return "hozirgina";
  if (sec < 3600)   return `${Math.floor(sec / 60)}d oldin`;
  if (sec < 86400)  return `${Math.floor(sec / 3600)}s oldin`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} kun`;
  return new Date(ms).toLocaleDateString("uz-UZ", { day:"2-digit", month:"short" });
};

const fmtFull = (ts) => {
  if (!ts) return "";
  const ms = ts?.toMillis?.() ?? new Date(ts).getTime();
  return new Date(ms).toLocaleString("uz-UZ", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  });
};

const groupByDate = (notifs) => {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 864e5).toDateString();
  const groups    = {};
  notifs.forEach(n => {
    const ms   = n.created?.toMillis?.() ?? new Date(n.created ?? 0).getTime();
    const ds   = new Date(ms).toDateString();
    const label = ds === today ? "Bugun" : ds === yesterday ? "Kecha" : new Date(ms)
      .toLocaleDateString("uz-UZ", { day:"2-digit", month:"long", year:"numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
};

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS — Inbox aesthetic (dark sidebar + light feed)
// ═══════════════════════════════════════════════════════════════
const T = {
  sidebar:  "#0f1117",
  sideText: "rgba(255,255,255,0.55)",
  sideAct:  "rgba(255,255,255,0.08)",
  sideActB: "rgba(255,255,255,0.9)",
  bg:       "#f4f4f0",
  surface:  "#ffffff",
  border:   "rgba(0,0,0,0.06)",
  text:     "#111",
  muted:    "#888",
  accent:   "#5b5bd6",
  fontHead: "'Sora', 'DM Sans', system-ui, sans-serif",
  fontBody: "'DM Sans', system-ui, sans-serif",
};

// ═══════════════════════════════════════════════════════════════
// SIDEBAR NAV ITEM
// ═══════════════════════════════════════════════════════════════
const NavItem = ({ icon, label, count, active, onClick }) => (
  <button onClick={onClick} style={{
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "9px 14px", borderRadius: 10, border: "none",
    background: active ? T.sideAct : "transparent",
    cursor: "pointer", fontFamily: T.fontBody, textAlign: "left",
    transition: "background 0.15s",
  }}
  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
  >
    <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: "center" }}>{icon}</span>
    <span style={{
      fontSize: 13, fontWeight: active ? 700 : 500,
      color: active ? T.sideActB : T.sideText,
      flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    }}>{label}</span>
    {count > 0 && (
      <span style={{
        fontSize: 10, fontWeight: 800, minWidth: 18, height: 18,
        borderRadius: 9, background: active ? "#fff" : T.accent,
        color: active ? T.accent : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 5px",
      }}>{count > 99 ? "99+" : count}</span>
    )}
  </button>
);

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION ROW  — compact inbox style
// ═══════════════════════════════════════════════════════════════
const NotifRow = ({ notif, selected, onSelect, onRead, onDelete }) => {
  const cfg     = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system;
  const isUnread = !notif.read;
  const isSel    = selected === notif.id;

  return (
    <div
      onClick={() => { onSelect(notif.id); if (isUnread) onRead(notif.id); }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 20px", cursor: "pointer",
        background: isSel ? "#f0f0ff" : isUnread ? "#fff" : "transparent",
        borderBottom: `1px solid ${T.border}`,
        borderLeft: `3px solid ${isSel ? T.accent : isUnread ? cfg.color : "transparent"}`,
        transition: "all 0.12s",
        position: "relative",
      }}
      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = isUnread ? "#fafafa" : "#f9f9f9"; }}
      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? "#f0f0ff" : isUnread ? "#fff" : "transparent"; }}
    >
      {/* Unread dot */}
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: isUnread ? cfg.color : "transparent",
        flexShrink: 0, marginTop: 5,
        boxShadow: isUnread ? `0 0 0 3px ${cfg.color}25` : "none",
      }}/>

      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: cfg.bg, border: `1px solid ${cfg.color}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17,
      }}>{cfg.icon}</div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: cfg.color,
            background: cfg.bg, padding: "1px 7px", borderRadius: 999,
            border: `1px solid ${cfg.color}20`,
          }}>{cfg.label}</span>
          <span style={{ fontSize: 11, color: T.muted, flexShrink: 0, fontWeight: isUnread ? 600 : 400 }}>
            {timeAgo(notif.created)}
          </span>
        </div>

        <p style={{
          fontSize: 13, color: isUnread ? T.text : "#555",
          fontWeight: isUnread ? 600 : 400, margin: "5px 0 0",
          lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{notif.text}</p>

        {notif.fromEmail && (
          <span style={{ fontSize: 11, color: T.muted, marginTop: 4, display: "block" }}>
            — {notif.fromEmail.split("@")[0]}
          </span>
        )}
      </div>

      {/* Delete on hover */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
        style={{
          position: "absolute", right: 14, top: 14,
          width: 24, height: 24, borderRadius: 6, border: "none",
          background: "transparent", cursor: "pointer",
          color: "#ccc", fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transition: "opacity 0.1s",
        }}
        className="del-btn"
      >✕</button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DETAIL PANEL — selected notification full view
// ═══════════════════════════════════════════════════════════════
const DetailPanel = ({ notif, onDelete, onClose }) => {
  if (!notif) return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12,
      background: T.bg, color: T.muted,
    }}>
      <div style={{ fontSize: 48 }}>📭</div>
      <p style={{ fontSize: 14, fontWeight: 500, color: T.muted, margin: 0, fontFamily: T.fontBody }}>
        Bildirishnomani tanlang
      </p>
    </div>
  );

  const cfg = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: T.surface, overflow: "hidden",
    }}>
      {/* Detail header */}
      <div style={{
        padding: "22px 28px 18px", borderBottom: `1px solid ${T.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: cfg.bg, border: `1px solid ${cfg.color}20`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>{cfg.icon}</div>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: cfg.color,
              background: cfg.bg, padding: "2px 9px", borderRadius: 999,
              border: `1px solid ${cfg.color}20`, display: "inline-block",
              marginBottom: 6,
            }}>{cfg.label}</div>
            <p style={{
              fontSize: 16, fontWeight: 700, color: T.text,
              margin: 0, lineHeight: 1.45, fontFamily: T.fontHead,
            }}>{notif.text}</p>
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`,
          background: "transparent", cursor: "pointer", color: T.muted,
          fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginLeft: 12,
        }}>✕</button>
      </div>

      {/* Meta */}
      <div style={{ padding: "18px 28px", borderBottom: `1px solid ${T.border}` }}>
        {[
          { l: "Vaqt",       v: fmtFull(notif.created) },
          { l: "Yuboruvchi", v: notif.fromEmail || "—" },
          { l: "Tur",        v: cfg.label              },
          notif.teamName && { l: "Jamoa", v: notif.teamName },
          notif.taskId   && { l: "Vazifa ID", v: notif.taskId.slice(0,16)+"…" },
        ].filter(Boolean).map(({ l, v }) => (
          <div key={l} style={{
            display: "flex", gap: 12, paddingBottom: 10, marginBottom: 10,
            borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 12, color: T.muted, fontWeight: 600, width: 100, flexShrink: 0 }}>{l}</span>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Status */}
      <div style={{ padding: "14px 28px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: notif.read ? "#22c55e" : "#f59e0b",
          }}/>
          <span style={{ fontSize: 12, color: T.muted }}>
            {notif.read ? "O'qildi" : "O'qilmagan"}
          </span>
          {notif.readAt && (
            <span style={{ fontSize: 11, color: T.muted }}>
              · {fmtFull(notif.readAt)}
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Delete action */}
      <div style={{ padding: "16px 28px", borderTop: `1px solid ${T.border}` }}>
        <button onClick={() => { onDelete(notif.id); onClose(); }} style={{
          width: "100%", padding: "10px", borderRadius: 10,
          border: "1px solid rgba(239,68,68,0.2)",
          background: "#fff5f5", color: "#ef4444",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          fontFamily: T.fontBody, transition: "all 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff5f5"}
        >🗑 O'chirish</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Notifications() {
  const {
    notifications, loading, unreadCount, stats,
    markAsRead, markAllAsRead,
    deleteNotification, deleteReadNotifications, deleteAllNotifications,
  } = useContext(NotificationContext);

  const [search,      setSearch]      = useState("");
  const [activeFilter,setActiveFilter]= useState("all");  // all|unread|read|<type>
  const [sortBy,      setSortBy]      = useState("newest");
  const [viewMode,    setViewMode]    = useState("list"); // list|grouped
  const [selectedId,  setSelectedId]  = useState(null);

  // ── FILTERED ──
  const filtered = useMemo(() => {
    let list = [...notifications];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.text?.toLowerCase().includes(q) ||
        n.fromEmail?.toLowerCase().includes(q) ||
        n.teamName?.toLowerCase().includes(q)
      );
    }
    if (activeFilter === "unread") list = list.filter(n => !n.read);
    else if (activeFilter === "read") list = list.filter(n => n.read);
    else if (activeFilter !== "all") list = list.filter(n => n.type === activeFilter);

    list.sort((a, b) => {
      const ta = a.created?.toMillis?.() ?? 0;
      const tb = b.created?.toMillis?.() ?? 0;
      return sortBy === "oldest" ? ta - tb : tb - ta;
    });
    return list;
  }, [notifications, search, activeFilter, sortBy]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const selectedNotif = notifications.find(n => n.id === selectedId) || null;
  const presentTypes  = [...new Set(notifications.map(n => n.type).filter(Boolean))];

  // Sidebar nav items
  const navItems = [
    { id: "all",    icon: "📬", label: "Hammasi",     count: unreadCount },
    { id: "unread", icon: "🔵", label: "O'qilmagan",  count: unreadCount },
    { id: "read",   icon: "✓",  label: "O'qilgan",    count: 0 },
    null, // divider
    ...presentTypes.map(t => {
      const cfg = NOTIF_TYPES[t] || NOTIF_TYPES.system;
      return {
        id:    t,
        icon:  cfg.icon,
        label: cfg.label,
        count: notifications.filter(n => n.type === t && !n.read).length,
      };
    }),
  ];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: T.fontBody,
      background: T.bg,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        .del-btn { opacity: 0 !important; }
        *:hover > .del-btn { opacity: 1 !important; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
        @keyframes slideIn {
          from { opacity:0; transform:translateX(10px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* ══════════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════════ */}
      <div style={{
        width: 240, flexShrink: 0,
        background: T.sidebar,
        display: "flex", flexDirection: "column",
        padding: "24px 12px",
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 6px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Xabarnoma markazi
          </div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: T.fontHead, letterSpacing: "-0.03em" }}>
              {stats.total}
            </span>
            {unreadCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#fff",
                background: T.accent, borderRadius: 999, padding: "2px 8px",
              }}>{unreadCount} yangi</span>
            )}
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item, i) =>
            item === null ? (
              <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" }}/>
            ) : (
              <NavItem key={item.id}
                icon={item.icon} label={item.label} count={item.count}
                active={activeFilter === item.id}
                onClick={() => { setActiveFilter(item.id); setSelectedId(null); }}
              />
            )
          )}
        </div>

        <div style={{ flex: 1 }}/>

        {/* Bottom actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12, marginTop: 12 }}>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} style={{
              padding: "9px 12px", borderRadius: 10, border: "none",
              background: T.accent, color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: T.fontBody, textAlign: "left",
              display: "flex", alignItems: "center", gap: 8,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <span>✓✓</span> Hammasini o'qildi
            </button>
          )}
          <button onClick={deleteReadNotifications} style={{
            padding: "9px 12px", borderRadius: 10, border: "none",
            background: "rgba(255,255,255,0.06)", color: T.sideText,
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            fontFamily: T.fontBody, textAlign: "left",
            display: "flex", alignItems: "center", gap: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            <span>🗑</span> O'qilganlarni o'chir
          </button>
          <button onClick={deleteAllNotifications} style={{
            padding: "9px 12px", borderRadius: 10, border: "none",
            background: "rgba(239,68,68,0.12)", color: "#f87171",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            fontFamily: T.fontBody, textAlign: "left",
            display: "flex", alignItems: "center", gap: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
          >
            <span>✕</span> Hammasini tozala
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════
          MAIN PANEL
      ══════════════════════════════════ */}
      <div style={{
        flex: selectedId ? "0 0 360px" : 1,
        display: "flex", flexDirection: "column",
        borderRight: selectedId ? `1px solid ${T.border}` : "none",
        background: T.bg, minWidth: 0, overflow: "hidden",
        transition: "flex 0.25s ease",
      }}>
        {/* Toolbar */}
        <div style={{
          padding: "14px 20px", background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
            <span style={{
              position: "absolute", left: 10, top: "50%",
              transform: "translateY(-50%)", color: T.muted, fontSize: 13,
            }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish…"
              style={{
                width: "100%", padding: "8px 12px 8px 30px",
                border: `1px solid ${T.border}`, borderRadius: 9,
                fontSize: 13, color: T.text, background: T.bg,
                outline: "none", fontFamily: T.fontBody, boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {/* View toggle */}
          <div style={{
            display: "flex", background: T.bg, borderRadius: 8,
            border: `1px solid ${T.border}`, padding: 3,
          }}>
            {[{ v:"list", i:"≡" }, { v:"grouped", i:"▤" }].map(m => (
              <button key={m.v} onClick={() => setViewMode(m.v)} style={{
                padding: "5px 12px", borderRadius: 6, border: "none",
                background: viewMode === m.v ? T.surface : "transparent",
                cursor: "pointer", fontSize: 14,
                color: viewMode === m.v ? T.text : T.muted,
                boxShadow: viewMode === m.v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.12s",
              }}>{m.i}</button>
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: "7px 10px", borderRadius: 9, border: `1px solid ${T.border}`,
            fontSize: 12, fontFamily: T.fontBody, background: T.bg, color: T.text,
            cursor: "pointer", outline: "none",
          }}>
            <option value="newest">↓ Yangi</option>
            <option value="oldest">↑ Eski</option>
          </select>

          <span style={{ fontSize: 12, color: T.muted, whiteSpace: "nowrap" }}>
            {filtered.length}/{notifications.length}
          </span>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "flex", gap: 0,
          background: T.surface, borderBottom: `1px solid ${T.border}`,
        }}>
          {[
            { label: "Jami",       val: stats.total,  color: T.accent   },
            { label: "Yangi",      val: stats.unread, color: "#f59e0b"  },
            { label: "O'qilgan",   val: stats.read,   color: "#22c55e"  },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, padding: "10px 16px", textAlign: "center",
              borderRight: i < 2 ? `1px solid ${T.border}` : "none",
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: T.fontHead, lineHeight: 1 }}>
                {s.val}
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {loading && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>
              Yuklanmoqda…
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div style={{ padding: "80px 20px", textAlign: "center", animation: "fadeUp 0.3s ease" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🔕</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 6px", fontFamily: T.fontHead }}>
                Bildirishnoma yo'q
              </p>
              <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
                Yangi xabarlar shu yerda ko'rinadi
              </p>
            </div>
          )}

          {!loading && notifications.length > 0 && filtered.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Hech narsa topilmadi</p>
            </div>
          )}

          {/* LIST view */}
          {!loading && viewMode === "list" && filtered.length > 0 && (
            <div style={{ animation: "fadeUp 0.2s ease" }}>
              {filtered.map(n => (
                <NotifRow key={n.id} notif={n}
                  selected={selectedId}
                  onSelect={setSelectedId}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}

          {/* GROUPED view */}
          {!loading && viewMode === "grouped" && filtered.length > 0 && (
            <div style={{ animation: "fadeUp 0.2s ease" }}>
              {Object.entries(grouped).map(([dateLabel, group]) => (
                <div key={dateLabel}>
                  {/* Date divider */}
                  <div style={{
                    padding: "10px 20px 6px",
                    fontSize: 11, fontWeight: 700, color: T.muted,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    background: T.bg, borderBottom: `1px solid ${T.border}`,
                    position: "sticky", top: 0, zIndex: 2,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    {dateLabel}
                    <div style={{ flex: 1, height: 1, background: T.border }}/>
                    <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>{group.length}</span>
                  </div>
                  {group.map(n => (
                    <NotifRow key={n.id} notif={n}
                      selected={selectedId}
                      onSelect={setSelectedId}
                      onRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════
          DETAIL PANEL (right)
      ══════════════════════════════════ */}
      {selectedId && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, animation: "slideIn 0.2s ease" }}>
          <DetailPanel
            notif={selectedNotif}
            onDelete={deleteNotification}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}
