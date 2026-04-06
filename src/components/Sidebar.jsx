import { NavLink, useLocation } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { TaskContext } from "../context/TaskContext";
import { NotificationContext } from "../context/NotificationContext";

// ─── Icon Components ───────────────────────────────────────────────
const Icon = ({ children, className = "" }) => (
  <span className={`text-base leading-none select-none ${className}`}>{children}</span>
);

const ChevronIcon = ({ collapsed }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-500 ease-in-out ${collapsed ? "rotate-180" : ""}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
  </svg>
);

// ─── Nav Sections ───────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "ASOSIY",
    items: [
      { to: "/",           icon: "⬡",  label: "Dashboard"       },
      { to: "/tasks",      icon: "◈",  label: "Vazifalar"       },
      { to: "/calendar",   icon: "◫",  label: "Kalendar"        },
    ],
  },
  {
    label: "JAMOA",
    items: [
      { to: "/teams",      icon: "◎",  label: "Jamoalar"        },
      { to: "/company",    icon: "▣",  label: "Kompaniya"       },
      { to: "/invites",    icon: "◈",  label: "Takliflar"       },
    ],
  },
  {
    label: "TOPSHIRIQLAR",
    items: [
      { to: "/incoming",   icon: "↓",  label: "Menga berilgan", badge: "incoming" },
      { to: "/outgoing",   icon: "↑",  label: "Men bergan"      },
    ],
  },
  {
    label: "SHAXSIY",
    items: [
      { to: "/journal",    icon: "◇",  label: "Kundalik"        },
      { to: "/notifications", icon: "◉", label: "Bildirishnomalar", badge: "notifications" },
    ],
  },
  {
    label: "TIZIM",
    items: [
      { to: "/activity",   icon: "≋",  label: "Faoliyat logi"  },
      { to: "/settings",   icon: "⊕",  label: "Sozlamalar"     },
    ],
  },
  {
    label: "GAME ZONE",
    items: [
      { to: "/checkers",   icon: "⬡",  label: "Shashka"        },
      { to: "/chess",      icon: "♟",  label: "Shaxmat"        },
      { to: "/2048",       icon: "#",  label: "2048"           },
    ],
  },
];

// ─── Main Sidebar ───────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const { tasks } = useContext(TaskContext);
  const { notifications } = useContext(NotificationContext);

  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });
  const [hovered, setHovered] = useState(null);
  const [ripples, setRipples] = useState([]);
  const sidebarRef = useRef(null);

  // Dark mode sync
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // System color scheme listener
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!localStorage.getItem("theme")) setDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const incomingCount = tasks.filter(
    (t) => t.assignedTo === user?.uid && !t.completed
  ).length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getBadge = (key) => {
    if (key === "incoming") return incomingCount;
    if (key === "notifications") return unreadCount;
    return 0;
  };

  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
  };

  return (
    <>
      {/* ── Global styles injected once ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        :root {
          --sidebar-w: 256px;
          --sidebar-w-collapsed: 68px;
          --glass-light: rgba(255,255,255,0.72);
          --glass-dark:  rgba(15,15,25,0.80);
          --accent-1: #6366f1;
          --accent-2: #8b5cf6;
          --accent-3: #06b6d4;
          --surface-light: rgba(248,248,255,0.9);
          --surface-dark:  rgba(20,20,35,0.9);
          --border-light: rgba(99,102,241,0.15);
          --border-dark:  rgba(139,92,246,0.2);
        }

        * { box-sizing: border-box; }

        body {
          font-family: 'DM Sans', sans-serif;
          transition: background 0.4s, color 0.4s;
        }

        .dark body, :root.dark {
          color-scheme: dark;
        }

        /* Sidebar shell */
        .ps-sidebar {
          position: fixed; left: 0; top: 0; z-index: 100;
          height: 100vh;
          display: flex; flex-direction: column;
          width: var(--sidebar-w);
          transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
          background: var(--glass-light);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-right: 1px solid var(--border-light);
          box-shadow:
            4px 0 24px rgba(99,102,241,0.08),
            inset -1px 0 0 rgba(255,255,255,0.6);
        }
        .dark .ps-sidebar {
          background: var(--glass-dark);
          border-right-color: var(--border-dark);
          box-shadow:
            4px 0 32px rgba(0,0,0,0.4),
            inset -1px 0 0 rgba(139,92,246,0.12);
        }
        .ps-sidebar.collapsed { width: var(--sidebar-w-collapsed); }

        /* Ambient background orbs */
        .ps-orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          filter: blur(48px); opacity: 0.35; z-index: 0;
          transition: opacity 0.4s;
        }
        .ps-orb-1 { width:180px; height:180px; background: radial-gradient(circle, #6366f1, transparent); top: -40px; left: -60px; }
        .ps-orb-2 { width:140px; height:140px; background: radial-gradient(circle, #8b5cf6, transparent); bottom: 80px; right: -50px; }
        .ps-orb-3 { width:100px; height:100px; background: radial-gradient(circle, #06b6d4, transparent); top: 45%; left: 10px; }
        .dark .ps-orb { opacity: 0.18; }

        /* Logo */
        .ps-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.35rem;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
          overflow: hidden;
          transition: opacity 0.3s, max-width 0.4s;
          max-width: 160px;
        }
        .collapsed .ps-logo { max-width: 0; opacity: 0; }

        /* Section label */
        .ps-section-label {
          font-family: 'Syne', sans-serif;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #a0a0b8;
          padding: 0 10px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          transition: opacity 0.25s, max-height 0.4s;
          max-height: 20px;
        }
        .collapsed .ps-section-label { opacity: 0; max-height: 0; }

        /* Nav item */
        .ps-item {
          position: relative;
          display: flex; align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          text-decoration: none;
          overflow: hidden;
          font-size: 0.83rem;
          font-weight: 500;
          color: #64748b;
          white-space: nowrap;
        }
        .dark .ps-item { color: #94a3b8; }

        .ps-item:hover {
          background: rgba(99,102,241,0.08);
          color: #6366f1;
          transform: translateX(3px);
        }
        .dark .ps-item:hover {
          background: rgba(139,92,246,0.12);
          color: #a78bfa;
        }

        .ps-item.active {
          background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08));
          color: #6366f1;
          font-weight: 600;
          box-shadow: inset 0 0 0 1px rgba(99,102,241,0.2);
        }
        .dark .ps-item.active {
          background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.12));
          color: #a78bfa;
          box-shadow: inset 0 0 0 1px rgba(139,92,246,0.3);
        }

        /* Active left bar */
        .ps-item.active::before {
          content: '';
          position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 20px;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #6366f1, #8b5cf6);
        }
        .dark .ps-item.active::before { background: linear-gradient(180deg, #8b5cf6, #a78bfa); }

        /* Item icon */
        .ps-item-icon {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 7px;
          background: rgba(99,102,241,0.06);
          font-size: 0.95rem;
          flex-shrink: 0;
          transition: background 0.2s, transform 0.2s;
        }
        .ps-item:hover .ps-item-icon,
        .ps-item.active .ps-item-icon {
          background: rgba(99,102,241,0.15);
          transform: scale(1.08);
        }
        .dark .ps-item-icon { background: rgba(139,92,246,0.08); }
        .dark .ps-item:hover .ps-item-icon,
        .dark .ps-item.active .ps-item-icon { background: rgba(139,92,246,0.2); }

        /* Item label */
        .ps-item-label {
          flex: 1;
          transition: opacity 0.25s, max-width 0.4s;
          max-width: 160px;
          overflow: hidden;
        }
        .collapsed .ps-item-label { opacity: 0; max-width: 0; }

        /* Badge */
        .ps-badge {
          font-size: 0.6rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: white;
          padding: 1px 6px;
          border-radius: 20px;
          min-width: 18px;
          text-align: center;
          animation: psBadgePulse 2s ease-in-out infinite;
          flex-shrink: 0;
          transition: opacity 0.25s;
          box-shadow: 0 2px 6px rgba(239,68,68,0.4);
        }
        .collapsed .ps-badge { opacity: 0; pointer-events: none; }
        @keyframes psBadgePulse {
          0%, 100% { box-shadow: 0 2px 6px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 2px 12px rgba(239,68,68,0.7); }
        }

        /* Tooltip (collapsed mode) */
        .ps-tooltip {
          position: absolute; left: calc(100% + 12px); top: 50%;
          transform: translateY(-50%) scale(0.9);
          background: rgba(15,15,25,0.95);
          color: white;
          font-size: 0.75rem; font-weight: 500;
          padding: 5px 10px;
          border-radius: 7px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: all 0.15s;
          backdrop-filter: blur(12px);
          border: 1px solid rgba(99,102,241,0.3);
          z-index: 200;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .collapsed .ps-item:hover .ps-tooltip {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }

        /* Ripple */
        .ps-ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(99,102,241,0.25);
          transform: scale(0);
          animation: psRipple 0.6s linear;
          pointer-events: none;
        }
        @keyframes psRipple {
          to { transform: scale(4); opacity: 0; }
        }

        /* Divider */
        .ps-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent);
          margin: 6px 8px;
        }
        .dark .ps-divider { background: linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent); }

        /* Collapse button */
        .ps-collapse-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(99,102,241,0.2);
          background: rgba(99,102,241,0.06);
          color: #6366f1;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .ps-collapse-btn:hover {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.4);
          transform: scale(1.08);
        }
        .dark .ps-collapse-btn {
          border-color: rgba(139,92,246,0.3);
          background: rgba(139,92,246,0.08);
          color: #a78bfa;
        }

        /* Dark toggle */
        .ps-dark-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(99,102,241,0.15);
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .ps-dark-btn:hover {
          background: rgba(99,102,241,0.08);
          color: #6366f1;
          border-color: rgba(99,102,241,0.3);
        }
        .dark .ps-dark-btn { color: #94a3b8; border-color: rgba(139,92,246,0.2); }
        .dark .ps-dark-btn:hover { color: #fbbf24; background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.3); }

        /* User panel */
        .ps-user {
          display: flex; align-items: center; gap: 10px;
          padding: 10px;
          border-radius: 12px;
          background: rgba(99,102,241,0.04);
          border: 1px solid rgba(99,102,241,0.1);
          transition: all 0.2s;
          cursor: default;
        }
        .ps-user:hover {
          background: rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.2);
        }
        .dark .ps-user {
          background: rgba(139,92,246,0.06);
          border-color: rgba(139,92,246,0.15);
        }

        .ps-avatar {
          width: 34px; height: 34px;
          border-radius: 10px;
          border: 2px solid transparent;
          background-image: linear-gradient(white, white), linear-gradient(135deg, #6366f1, #8b5cf6);
          background-origin: border-box;
          background-clip: content-box, border-box;
          object-fit: cover;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .ps-user:hover .ps-avatar { transform: scale(1.05); }

        .ps-user-info {
          flex: 1; min-width: 0;
          overflow: hidden;
          transition: opacity 0.25s, max-width 0.4s;
          max-width: 160px;
        }
        .collapsed .ps-user-info { opacity: 0; max-width: 0; }

        .ps-user-name {
          font-family: 'Syne', sans-serif;
          font-size: 0.8rem; font-weight: 600;
          color: #1e293b;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dark .ps-user-name { color: #e2e8f0; }

        .ps-user-email {
          font-size: 0.68rem;
          color: #94a3b8;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* Status dot */
        .ps-status {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(34,197,94,0.25);
          animation: psStatusPulse 3s ease-in-out infinite;
        }
        @keyframes psStatusPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.25); }
          50% { box-shadow: 0 0 0 4px rgba(34,197,94,0.15); }
        }

        /* Logout */
        .ps-logout-btn {
          width: 100%;
          padding: 7px;
          border-radius: 9px;
          font-size: 0.78rem; font-weight: 500;
          color: #ef4444;
          background: transparent;
          border: 1px solid rgba(239,68,68,0.15);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          overflow: hidden;
          transition: opacity 0.25s, all 0.2s;
        }
        .ps-logout-btn:hover {
          background: rgba(239,68,68,0.06);
          border-color: rgba(239,68,68,0.35);
        }
        .collapsed .ps-logout-btn { opacity: 0; pointer-events: none; }

        /* Scrollbar */
        .ps-nav::-webkit-scrollbar { width: 3px; }
        .ps-nav::-webkit-scrollbar-track { background: transparent; }
        .ps-nav::-webkit-scrollbar-thumb {
          background: rgba(99,102,241,0.2);
          border-radius: 3px;
        }

        /* Fade-in sections */
        @keyframes psFadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ps-section { animation: psFadeSlide 0.4s ease both; }

        /* Game zone special */
        .ps-game-icon { filter: saturate(1.4); }

        /* Content offset */
        .ps-content-offset {
          margin-left: var(--sidebar-w);
          transition: margin-left 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .collapsed ~ .ps-content-offset { margin-left: var(--sidebar-w-collapsed); }
      `}</style>

      <aside
        ref={sidebarRef}
        className={`ps-sidebar${collapsed ? " collapsed" : ""}`}
      >
        {/* Ambient orbs */}
        <div className="ps-orb ps-orb-1" />
        <div className="ps-orb ps-orb-2" />
        <div className="ps-orb ps-orb-3" />

        {/* ── Header ── */}
        <div
          style={{
            position: "relative", zIndex: 1,
            padding: "16px 12px 10px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {/* Logo mark */}
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
              fontSize: "0.85rem", color: "white",
            }}>⚡</div>
            <span className="ps-logo">Planner</span>
          </div>

          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button className="ps-dark-btn" onClick={() => setDark((d) => !d)} title={dark ? "Light mode" : "Dark mode"}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="ps-collapse-btn" onClick={() => setCollapsed((c) => !c)} title={collapsed ? "Expand" : "Collapse"}>
              <ChevronIcon collapsed={collapsed} />
            </button>
          </div>
        </div>

        <div className="ps-divider" />

        {/* ── Navigation ── */}
        <nav
          className="ps-nav"
          style={{
            flex: 1, overflowY: "auto", overflowX: "hidden",
            padding: "4px 8px", position: "relative", zIndex: 1,
            display: "flex", flexDirection: "column", gap: 4,
          }}
        >
          {NAV_SECTIONS.map((section, si) => (
            <div
              key={section.label}
              className="ps-section"
              style={{ animationDelay: `${si * 0.04}s` }}
            >
              <p className="ps-section-label">{section.label}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {section.items.map((item) => {
                  const badge = item.badge ? getBadge(item.badge) : 0;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `ps-item${isActive ? " active" : ""}`
                      }
                      onClick={addRipple}
                      onMouseEnter={() => setHovered(item.to)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {/* Ripples */}
                      {ripples.map((r) => (
                        <span
                          key={r.id}
                          className="ps-ripple"
                          style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
                        />
                      ))}

                      {/* Icon */}
                      <span className={`ps-item-icon${section.label === "GAME ZONE" ? " ps-game-icon" : ""}`}>
                        {item.icon}
                      </span>

                      {/* Label */}
                      <span className="ps-item-label">{item.label}</span>

                      {/* Badge */}
                      {badge > 0 && (
                        <span className="ps-badge">{badge > 9 ? "9+" : badge}</span>
                      )}

                      {/* Tooltip (only in collapsed mode) */}
                      <span className="ps-tooltip">
                        {item.label}
                        {badge > 0 && ` (${badge})`}
                      </span>
                    </NavLink>
                  );
                })}
              </div>

              {si < NAV_SECTIONS.length - 1 && <div className="ps-divider" style={{ marginTop: 6 }} />}
            </div>
          ))}
        </nav>

        {/* ── User Panel ── */}
        <div
          style={{
            padding: "10px 10px 14px",
            borderTop: "1px solid rgba(99,102,241,0.1)",
            position: "relative", zIndex: 1,
            flexShrink: 0,
          }}
        >
          <div className="ps-user" style={{ marginBottom: 8 }}>
            <img
              src={user?.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${user?.uid || "user"}`}
              className="ps-avatar"
              alt="avatar"
            />
            <div className="ps-user-info">
              <p className="ps-user-name">{user?.displayName || "User"}</p>
              <p className="ps-user-email">{user?.email || "user@planner.app"}</p>
            </div>
            <div className="ps-status" />
          </div>

          <button className="ps-logout-btn" onClick={logout}>
            ← Chiqish
          </button>

          <p style={{
            textAlign: "center",
            fontSize: "0.6rem",
            color: "rgba(148,163,184,0.5)",
            marginTop: 8,
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.08em",
            transition: "opacity 0.25s",
            opacity: collapsed ? 0 : 1,
          }}>
            © 2026 PLANNER
          </p>
        </div>
      </aside>
    </>
  );
}
