import { useState, useMemo, useContext } from "react";
import { NotificationContext, NOTIF_TYPES } from "../context/NotificationContext";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const timeAgo = (ts) => {
  if (!ts) return "";
  const sec = Math.floor(
    (Date.now() - (ts?.toMillis?.() ?? new Date(ts).getTime())) / 1000
  );
  if (sec < 60)    return "hozirgina";
  if (sec < 3600)  return `${Math.floor(sec / 60)} daqiqa oldin`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} soat oldin`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} kun oldin`;
  return new Date(ts?.toMillis?.() ?? ts).toLocaleDateString("uz-UZ", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const fmtFull = (ts) => {
  if (!ts) return "";
  return new Date(ts?.toMillis?.() ?? new Date(ts).getTime())
    .toLocaleString("uz-UZ", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
};

// ═══════════════════════════════════════════════════════════════
// STYLE TOKENS  (Incoming/Outgoing bilan mos)
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
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════
const ProgressBar = ({ pct, color, height = 4 }) => (
  <div style={{ background: "#f3f4f6", borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(pct, 100)}%`, height: "100%",
      background: color, borderRadius: 99,
      transition: "width 0.6s ease",
    }}/>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// TYPE BADGE
// ═══════════════════════════════════════════════════════════════
const TypeBadge = ({ type }) => {
  const cfg = NOTIF_TYPES[type] || NOTIF_TYPES.system;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
      background: cfg.color + "15", color: cfg.color,
      border: `1px solid ${cfg.color}30`, whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION CARD  (Incoming IncomingCard bilan bir xil tuzilma)
// ═══════════════════════════════════════════════════════════════
const NotifCard = ({ notif, onRead, onDelete }) => {
  const cfg     = NOTIF_TYPES[notif.type] || NOTIF_TYPES.system;
  const isUnread = !notif.read;

  const borderColor = isUnread ? cfg.color + "50" : "rgba(0,0,0,0.07)";
  const headerBg    = isUnread ? `linear-gradient(135deg, ${cfg.color}06, #fff)` : "#fff";

  return (
    <div
      style={{
        background: headerBg,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: isUnread ? `0 2px 12px ${cfg.color}15` : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, transform 0.2s",
        fontFamily: "inherit",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 6px 28px ${cfg.color}20`;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = isUnread ? `0 2px 12px ${cfg.color}15` : "0 1px 4px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* ── TOP STRIP ── */}
      <div style={{
        padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(0,0,0,0.05)", gap: 8, flexWrap: "wrap",
        background: "rgba(0,0,0,0.01)",
      }}>
        {/* Left meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          {isUnread && (
            <span style={{
              display: "inline-block", width: 7, height: 7,
              borderRadius: "50%", background: cfg.color,
              boxShadow: `0 0 0 2px ${cfg.color}30`,
              flexShrink: 0,
            }}/>
          )}
          <TypeBadge type={notif.type}/>

          {notif.teamName && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              background: "#ede9fe", color: "#7c3aed", border: "1px solid #ddd6fe",
            }}>👥 {notif.teamName}</span>
          )}

          {notif.fromEmail && (
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              <b style={{ color: "#374151" }}>
                {notif.fromEmail.split("@")[0]}
              </b>{" "}dan
            </span>
          )}

          <span style={{ fontSize: 10, color: "#d1d5db" }}>{timeAgo(notif.created)}</span>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {isUnread && (
            <button onClick={() => onRead(notif.id)} style={{
              padding: "4px 12px", borderRadius: 8,
              border: `1px solid ${cfg.color}40`,
              background: cfg.color + "10", color: cfg.color,
              fontSize: 11, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = cfg.color + "20"}
            onMouseLeave={e => e.currentTarget.style.background = cfg.color + "10"}
            >✓ O'qildi</button>
          )}
          <button onClick={() => onDelete(notif.id)} style={{
            padding: "4px 10px", borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.2)",
            background: "#fff5f5", color: "#ef4444",
            fontSize: 11, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff5f5"}
          >✕</button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: "12px 18px 14px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Icon circle */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: cfg.color + "15",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, border: `1px solid ${cfg.color}25`,
        }}>{cfg.icon}</div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: isUnread ? 700 : 500,
            color: "#1a1a1a", margin: 0, lineHeight: 1.55,
          }}>{notif.text}</p>

          {/* Full date on hover (tooltip-like) */}
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "5px 0 0" }}>
            {fmtFull(notif.created)}
          </p>

          {/* Task / Team link hints */}
          {(notif.taskId || notif.teamId) && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {notif.taskId && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                  background: "#f3f4f6", color: "#6b7280",
                }}>📋 #{notif.taskId.slice(0, 8)}</span>
              )}
              {notif.teamId && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                  background: "#f3f4f6", color: "#6b7280",
                }}>👥 #{notif.teamId.slice(0, 8)}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TYPE GROUP HEADER
// ═══════════════════════════════════════════════════════════════
const TypeGroupHeader = ({ type, notifs }) => {
  const cfg    = NOTIF_TYPES[type] || NOTIF_TYPES.system;
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: cfg.color + "20", border: `2px solid ${cfg.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
      }}>{cfg.icon}</div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{cfg.label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }}/>
      {unread > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
          background: cfg.color, color: "#fff",
        }}>{unread} yangi</span>
      )}
      <span style={{ fontSize: 10, color: "#9ca3af" }}>{notifs.length} ta</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EMAIL SETUP MODAL
// ═══════════════════════════════════════════════════════════════
const EmailSetupModal = ({ onClose }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()} style={{
    position: "fixed", inset: 0, zIndex: 300,
    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  }}>
    <div style={{
      background: "#fff", borderRadius: 24, width: "100%", maxWidth: 540,
      boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
      animation: "popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "linear-gradient(135deg,#1a1a2e,#16213e)",
        color: "#fff",
      }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>📧 Email bildirishnoma sozlash</h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
            EmailJS orqali bepul email yuborish
          </p>
        </div>
        <button onClick={onClose} style={{
          width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.1)", cursor: "pointer",
          fontSize: 15, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        }}>×</button>
      </div>

      <div style={{ padding: "20px 24px 24px" }}>
        {/* Steps */}
        {[
          {
            n: 1, title: "EmailJS ro'yxatdan o'ting",
            desc: "emailjs.com saytiga kiring va bepul akkaunt oching (200 email/oy bepul).",
            link: "https://emailjs.com", linkLabel: "emailjs.com →",
          },
          {
            n: 2, title: "Email Service qo'shing",
            desc: 'Dashboard → "Email Services" → Gmail yoki boshqa email provayderni ulang.',
          },
          {
            n: 3, title: "Template yarating",
            desc: '"Email Templates" → New Template. Quyidagi o\'zgaruvchilarni ishlating:',
            code: `To: {{to_email}}
Subject: {{subject}}
Body:
Salom, {{to_name}}!

{{message}}

— {{from_name}}`,
          },
          {
            n: 4, title: ".env faylingizga qo'shing",
            code: `VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx`,
          },
        ].map(step => (
          <div key={step.n} style={{
            display: "flex", gap: 14, marginBottom: 18,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: "#1a1a1a", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, marginTop: 1,
            }}>{step.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
                {step.title}
              </div>
              {step.desc && (
                <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 6px", lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              )}
              {step.link && (
                <a href={step.link} target="_blank" rel="noreferrer" style={{
                  fontSize: 12, color: "#6366f1", fontWeight: 600, textDecoration: "none",
                }}>{step.linkLabel}</a>
              )}
              {step.code && (
                <pre style={{
                  background: "#f9fafb", border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 10, padding: "10px 14px", fontSize: 11,
                  color: "#374151", margin: "6px 0 0", overflowX: "auto",
                  fontFamily: "monospace", lineHeight: 1.7,
                }}>{step.code}</pre>
              )}
            </div>
          </div>
        ))}

        <div style={{
          background: "#f0fdf4", borderRadius: 12, padding: "12px 14px",
          border: "1px solid #bbf7d0", fontSize: 12, color: "#16a34a", fontWeight: 600,
        }}>
          ✓ EmailJS sozlanganidan keyin vazifa berganingizda qabul qiluvchiga
          avtomatik email ketadi.
        </div>

        <button onClick={onClose} style={{
          marginTop: 16, width: "100%", padding: "12px", borderRadius: 12,
          border: "none", background: "#1a1a1a", color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>Tushunarli, yopish</button>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════
const Empty = ({ icon, title, sub }) => (
  <div style={{ ...card, textAlign: "center", padding: "70px 20px" }}>
    <div style={{ fontSize: 52, marginBottom: 14 }}>{icon}</div>
    <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6, margin: 0 }}>{title}</p>
    {sub && <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0 0" }}>{sub}</p>}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Notifications() {
  const {
    notifications, loading, unreadCount, stats,
    markAsRead, markAllAsRead,
    deleteNotification, deleteReadNotifications, deleteAllNotifications,
  } = useContext(NotificationContext);

  // UI state
  const [filterStatus, setFilterStatus] = useState("all");   // all|unread|read
  const [filterType,   setFilterType]   = useState("all");   // all | NOTIF_TYPES keys
  const [sortBy,       setSortBy]       = useState("newest");
  const [viewMode,     setViewMode]     = useState("list");   // list|grouped
  const [search,       setSearch]       = useState("");
  const [showEmail,    setShowEmail]    = useState(false);

  // ── FILTERED + SORTED ──
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
    if (filterStatus === "unread") list = list.filter(n => !n.read);
    if (filterStatus === "read")   list = list.filter(n => n.read);
    if (filterType !== "all")      list = list.filter(n => n.type === filterType);

    list.sort((a, b) => {
      if (sortBy === "newest") return (b.created?.toMillis?.()??0) - (a.created?.toMillis?.()??0);
      if (sortBy === "oldest") return (a.created?.toMillis?.()??0) - (b.created?.toMillis?.()??0);
      if (sortBy === "type")   return (a.type||"").localeCompare(b.type||"");
      return 0;
    });

    return list;
  }, [notifications, search, filterStatus, filterType, sortBy]);

  // Grouped by type
  const byType = useMemo(() => {
    const m = {};
    filtered.forEach(n => {
      if (!m[n.type]) m[n.type] = [];
      m[n.type].push(n);
    });
    return m;
  }, [filtered]);

  // Unique types present
  const presentTypes = useMemo(() =>
    [...new Set(notifications.map(n => n.type).filter(Boolean))],
    [notifications]
  );

  const emailConfigured = !!(
    import.meta.env?.VITE_EMAILJS_SERVICE_ID &&
    import.meta.env?.VITE_EMAILJS_TEMPLATE_ID &&
    import.meta.env?.VITE_EMAILJS_PUBLIC_KEY
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f7f4",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: "#1a1a1a",
    }}>
      {showEmail && <EmailSetupModal onClose={() => setShowEmail(false)}/>}

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* ── HEADER ── */}
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
                }}>Xabarnoma markazi</div>
                <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                  🔔 Bildirishnomalar
                </h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6, marginBottom: 0 }}>
                  Barcha yangilanishlar va topshiriqlar
                </p>
              </div>

              {/* Quick summary */}
              <div style={{
                display: "flex", gap: 14, alignItems: "center",
                background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)",
                borderRadius: 14, padding: "12px 18px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}>
                {[
                  { label: "Jami",      val: stats.total,  color: "#fff"    },
                  { label: "O'qilmagan",val: stats.unread, color: "#fcd34d" },
                  { label: "O'qilgan",  val: stats.read,   color: "#4ade80" },
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
        {!loading && notifications.length === 0 && (
          <Empty icon="🔕" title="Bildirishnoma yo'q"
            sub="Sizga kelgan barcha xabarlar shu yerda chiqadi"/>
        )}

        {(loading || notifications.length > 0) && (
          <>
            {/* ── STAT CARDS ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <StatCard label="Jami"       value={stats.total}  icon="🔔" color="#6366f1"/>
              <StatCard label="O'qilmagan" value={stats.unread} icon="🆕" color="#f59e0b"
                sub={stats.unread > 0 ? "Yangi xabarlar" : undefined}/>
              <StatCard label="O'qilgan"   value={stats.read}   icon="✓"  color="#22c55e"/>
              <StatCard label="Tur soni"   value={presentTypes.length} icon="📂" color="#8b5cf6"/>

              {/* Email config badge */}
              <div style={{
                background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
                borderRadius: 16, padding: "14px 18px", flex: 1, minWidth: 110,
                display: "flex", flexDirection: "column", gap: 6,
                cursor: "pointer", transition: "all 0.15s",
              }}
              onClick={() => setShowEmail(true)}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)"}
              >
                <span style={{ fontSize: 22 }}>📧</span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: emailConfigured ? "#22c55e" : "#f59e0b",
                }}>
                  {emailConfigured ? "✓ Email faol" : "Email sozlash"}
                </span>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>bosing →</span>
              </div>
            </div>

            {/* ── ACTION BUTTONS ── */}
            <div style={{
              display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap",
            }}>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} style={{
                  padding: "8px 16px", borderRadius: 10, border: "none",
                  background: "#6366f1", color: "#fff",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#4f46e5"}
                onMouseLeave={e => e.currentTarget.style.background = "#6366f1"}
                >✓✓ Hammasini o'qildi</button>
              )}
              <button onClick={deleteReadNotifications} style={{
                padding: "8px 16px", borderRadius: 10,
                border: "1px solid rgba(245,158,11,0.3)",
                background: "#fffbeb", color: "#d97706",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#fef3c7"}
              onMouseLeave={e => e.currentTarget.style.background = "#fffbeb"}
              >🗑 O'qilganlarni o'chirish</button>
              <button onClick={deleteAllNotifications} style={{
                padding: "8px 16px", borderRadius: 10,
                border: "1px solid rgba(239,68,68,0.2)",
                background: "#fff5f5", color: "#ef4444",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff5f5"}
              >✕ Hammasini tozalash</button>
            </div>

            {/* ── VIEW TABS ── */}
            <div style={{
              display: "flex", gap: 4, marginBottom: 16,
              background: "#fff", borderRadius: 14, padding: 5,
              border: "1px solid rgba(0,0,0,0.07)", width: "fit-content",
            }}>
              {[
                { v: "list",    l: "≡ Ro'yxat" },
                { v: "grouped", l: `📂 Tur bo'yicha (${presentTypes.length})` },
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
                  <span style={{
                    position: "absolute", left: 11, top: "50%",
                    transform: "translateY(-50%)", color: "#9ca3af", fontSize: 14,
                  }}>⌕</span>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Xabar yoki yuboruvchi qidirish…"
                    style={{
                      width: "100%", padding: "9px 12px 9px 32px",
                      border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10,
                      fontSize: 13, color: "#1a1a1a", background: "#fafafa",
                      outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Status pills */}
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { v: "all",    l: "Barchasi"   },
                    { v: "unread", l: "🆕 Yangi"   },
                    { v: "read",   l: "✓ O'qilgan" },
                  ].map(f => (
                    <button key={f.v} onClick={() => setFilterStatus(f.v)}
                      style={pill(filterStatus === f.v)}>
                      {f.l}
                    </button>
                  ))}
                </div>

                {/* Type filter */}
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{
                  padding: "7px 12px", borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.1)",
                  fontSize: 12, fontFamily: "inherit", background: "#fafafa",
                  color: "#374151", cursor: "pointer", outline: "none",
                }}>
                  <option value="all">📂 Barcha turlar</option>
                  {Object.entries(NOTIF_TYPES).map(([k, v]) => (
                    stats.byType[k] > 0 &&
                    <option key={k} value={k}>{v.icon} {v.label} ({stats.byType[k]})</option>
                  ))}
                </select>

                {/* Sort */}
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                  padding: "7px 12px", borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.1)",
                  fontSize: 12, fontFamily: "inherit", background: "#fafafa",
                  color: "#374151", cursor: "pointer", outline: "none",
                }}>
                  <option value="newest">Yangi birinchi</option>
                  <option value="oldest">Eski birinchi</option>
                  <option value="type">Tur bo'yicha</option>
                </select>

                <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                  {filtered.length}/{notifications.length}
                </span>
              </div>

              {/* Type quick filter pills */}
              {presentTypes.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {presentTypes.map(t => {
                    const cfg = NOTIF_TYPES[t] || NOTIF_TYPES.system;
                    const cnt = stats.byType[t] || 0;
                    const active = filterType === t;
                    return (
                      <button key={t} onClick={() => setFilterType(active ? "all" : t)} style={{
                        padding: "4px 12px", borderRadius: 999, border: "none",
                        cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                        background: active ? cfg.color : cfg.color + "12",
                        color:      active ? "#fff"    : cfg.color,
                        transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        {cfg.icon} {cfg.label}
                        <span style={{
                          fontSize: 9, fontWeight: 800,
                          background: active ? "rgba(255,255,255,0.25)" : cfg.color,
                          color: active ? "#fff" : "#fff",
                          borderRadius: 999, padding: "0 5px",
                        }}>{cnt}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── NO RESULTS ── */}
            {filtered.length === 0 && notifications.length > 0 && (
              <Empty icon="🔍" title="Hech narsa topilmadi"
                sub="Filter yoki qidiruvni o'zgartiring"/>
            )}

            {/* ══════════════════════════════════════════════
                LIST VIEW
            ══════════════════════════════════════════════ */}
            {viewMode === "list" && filtered.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(n => (
                  <NotifCard
                    key={n.id}
                    notif={n}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}

            {/* ══════════════════════════════════════════════
                GROUPED VIEW
            ══════════════════════════════════════════════ */}
            {viewMode === "grouped" && filtered.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {Object.entries(byType).map(([type, typeNotifs]) => (
                  <div key={type}>
                    <TypeGroupHeader type={type} notifs={typeNotifs}/>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {typeNotifs.map(n => (
                        <NotifCard
                          key={n.id}
                          notif={n}
                          onRead={markAsRead}
                          onDelete={deleteNotification}
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
                marginTop: 20, padding: "12px 18px",
                background: "#fff", borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.07)",
                display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {filtered.length} ta ko'rsatilmoqda
                </span>
                <div style={{ flex: 1, minWidth: 80 }}>
                  <ProgressBar
                    pct={filtered.length ? (filtered.filter(n => n.read).length / filtered.length) * 100 : 0}
                    color="#22c55e" height={4}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>
                  {filtered.filter(n => n.read).length} ta o'qildi
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} style={{
                    padding: "4px 12px", borderRadius: 999, border: "1px solid #e0e7ff",
                    background: "#eff6ff", cursor: "pointer", fontSize: 11,
                    fontFamily: "inherit", color: "#6366f1", fontWeight: 600,
                  }}>Hammasini o'qildi ✓</button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes popIn {
          from { opacity:0; transform:scale(0.9) translateY(8px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>
    </div>
  );
}
