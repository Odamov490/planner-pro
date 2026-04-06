import { NavLink } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { TaskContext } from "../context/TaskContext";
import { NotificationContext } from "../context/NotificationContext";

/* ─────────────────────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────────────────────── */
const NAV = [
  {
    group: "Asosiy",
    items: [
      { to: "/",              icon: HomeIcon,     label: "Dashboard"          },
      { to: "/tasks",         icon: TaskIcon,     label: "Vazifalar"          },
      { to: "/calendar",      icon: CalIcon,      label: "Kalendar"           },
    ],
  },
  {
    group: "Jamoa",
    items: [
      { to: "/teams",         icon: TeamsIcon,    label: "Jamoalar"           },
      { to: "/company",       icon: CompanyIcon,  label: "Kompaniya"          },
      { to: "/invites",       icon: InviteIcon,   label: "Takliflar"          },
    ],
  },
  {
    group: "Topshiriqlar",
    items: [
      { to: "/incoming",      icon: InboxIcon,    label: "Menga berilgan",    badge: "incoming"      },
      { to: "/outgoing",      icon: OutboxIcon,   label: "Men bergan"         },
    ],
  },
  {
    group: "Shaxsiy",
    items: [
      { to: "/journal",       icon: JournalIcon,  label: "Kundalik"           },
      { to: "/notifications", icon: BellIcon,     label: "Bildirishnomalar",  badge: "notifications" },
      { to: "/activity",      icon: ActivityIcon, label: "Faoliyat logi"      },
      { to: "/settings",      icon: SettingsIcon, label: "Sozlamalar"         },
    ],
  },
  {
    group: "O'yinlar",
    items: [
      { to: "/checkers",      icon: CheckersIcon, label: "Shashka"            },
      { to: "/chess",         icon: ChessIcon,    label: "Shaxmat"            },
      { to: "/2048",          icon: TwokIcon,     label: "2048"               },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   SVG ICONS  (16 × 16 viewBox, strokeWidth 1.6)
───────────────────────────────────────────────────────────── */
function Ico({ d, children, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {d ? <path d={d} /> : children}
    </svg>
  );
}
function HomeIcon()     { return <Ico><rect x="2" y="7" width="12" height="8" rx="1.5"/><path d="M1 7.5 8 2l7 5.5"/></Ico>; }
function TaskIcon()     { return <Ico><rect x="3" y="2" width="10" height="12" rx="1.5"/><path d="M5.5 6h5M5.5 9h3"/></Ico>; }
function CalIcon()      { return <Ico><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 7h12M5.5 2v2M10.5 2v2"/></Ico>; }
function TeamsIcon()    { return <Ico><circle cx="6" cy="5.5" r="2.5"/><path d="M1.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/><circle cx="12" cy="5.5" r="2"/><path d="M14.5 13c0-1.8-1.2-3-2.5-3"/></Ico>; }
function CompanyIcon()  { return <Ico><rect x="2" y="5" width="12" height="9" rx="1"/><path d="M5 14V9h6v5M2 8V5.5A1.5 1.5 0 0 1 3.5 4h9A1.5 1.5 0 0 1 14 5.5V8"/></Ico>; }
function InviteIcon()   { return <Ico><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M2 7l6 4 6-4"/></Ico>; }
function InboxIcon()    { return <Ico><path d="M2 10h3l1.5 2h3L11 10h3"/><rect x="2" y="4" width="12" height="10" rx="1.5"/><path d="M8 4v5M5.5 6.5 8 9l2.5-2.5"/></Ico>; }
function OutboxIcon()   { return <Ico><path d="M2 10h3l1.5 2h3L11 10h3"/><rect x="2" y="4" width="12" height="10" rx="1.5"/><path d="M8 9V4M5.5 6.5 8 4l2.5 2.5"/></Ico>; }
function JournalIcon()  { return <Ico><rect x="3" y="2" width="10" height="12" rx="1.5"/><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3"/><rect x="3" y="2" width="2" height="12" rx="1" fill="currentColor" stroke="none" opacity=".2"/></Ico>; }
function BellIcon()     { return <Ico><path d="M8 2a4 4 0 0 1 4 4v3l1.5 2.5h-11L4 9V6a4 4 0 0 1 4-4z"/><path d="M6.5 12.5a1.5 1.5 0 0 0 3 0"/></Ico>; }
function ActivityIcon() { return <Ico><polyline points="2,10 5,6 8,9 11,4 14,7"/></Ico>; }
function SettingsIcon() { return <Ico><circle cx="8" cy="8" r="2.5"/><path d="M8 2v1.5M8 12.5V14M14 8h-1.5M3.5 8H2M12.2 3.8l-1.1 1.1M4.9 11.1 3.8 12.2M12.2 12.2l-1.1-1.1M4.9 4.9 3.8 3.8"/></Ico>; }
function CheckersIcon() { return <Ico><rect x="2" y="2" width="12" height="12" rx="1.5"/><circle cx="5.5" cy="5.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="10.5" cy="5.5" r="1.5"/><circle cx="5.5" cy="10.5" r="1.5"/><circle cx="10.5" cy="10.5" r="1.5" fill="currentColor" stroke="none"/></Ico>; }
function ChessIcon()    { return <Ico d="M6 13h4M8 13V9M5 9h6M6.5 9 6 6h4l-.5 3M7 6V4.5A1.5 1.5 0 0 1 8 3a1.5 1.5 0 0 1 1 1.5V6"/>; }
function TwokIcon()     { return <Ico><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6.5C5 5.7 5.7 5 6.5 5S8 5.7 8 6.5C8 8 5 9 5 10.5h3M11 5v6"/></Ico>; }
function SunIcon()      { return <Ico><circle cx="8" cy="8" r="3"/><path d="M8 2v1.5M8 12.5V14M14 8h-1.5M3.5 8H2M12.2 3.8l-1.1 1.1M4.9 11.1 3.8 12.2M12.2 12.2l-1.1-1.1M4.9 4.9 3.8 3.8"/></Ico>; }
function MoonIcon()     { return <Ico d="M7 3C4.2 3 2 5.2 2 8s2.2 5 5 5c1.8 0 3.4-.9 4.3-2.3C10.9 11 10.5 11 10 11c-2.8 0-5-2.2-5-5 0-1.2.4-2.3 1.1-3.1C5.4 2.9 4.7 3 4 3"/>; }
function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d={open ? "M9 3L5 7l4 4" : "M5 3l4 4-4 4"} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   SIDEBAR COMPONENT
───────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const { user, logout }       = useContext(AuthContext);
  const { tasks = [] }         = useContext(TaskContext);
  const { notifications = [] } = useContext(NotificationContext);

  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("planner-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("planner-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e) => { if (!localStorage.getItem("planner-theme")) setDark(e.matches); };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const incomingCount = tasks.filter(t => t.assignedTo === user?.uid && !t.completed).length;
  const unreadCount   = notifications.filter(n => !n.read).length;
  const getBadge = (key) => key === "incoming" ? incomingCount : key === "notifications" ? unreadCount : 0;

  return (
    <>
      <style>{STYLES}</style>

      <aside className={`sb${collapsed ? " sb--col" : ""}`}>

        {/* background texture lines */}
        <div className="sb-lines" aria-hidden="true">
          {[...Array(5)].map((_, i) => <span key={i} className="sb-line" style={{ "--i": i }} />)}
        </div>

        {/* ── HEADER ── */}
        <header className="sb-head">
          <div className="sb-brand">
            <div className="sb-mark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z"
                  stroke="white" strokeWidth="1.4" fill="rgba(255,255,255,.18)" strokeLinejoin="round"/>
                <path d="M8 5L11 6.8V10.2L8 12L5 10.2V6.8L8 5Z" fill="white" opacity=".95"/>
              </svg>
            </div>
            <span className="sb-wordmark">Planner</span>
          </div>

          <div className="sb-controls">
            <button className="sb-ctrl" onClick={() => setDark(d => !d)} title={dark ? "Light" : "Dark"}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="sb-ctrl" onClick={() => setCollapsed(c => !c)} title="Toggle">
              <ChevronIcon open={!collapsed} />
            </button>
          </div>
        </header>

        {/* ── NAV ── */}
        <nav className="sb-nav">
          {NAV.map((section, si) => (
            <div key={section.group} className="sb-group" style={{ "--d": `${si * 55}ms` }}>
              <p className="sb-glabel">{section.group}</p>

              {section.items.map((item) => {
                const count = item.badge ? getBadge(item.badge) : 0;
                const IC = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `sb-item${isActive ? " sb-item--on" : ""}`}
                  >
                    <span className="sb-ico"><IC /></span>
                    <span className="sb-lbl">{item.label}</span>
                    {count > 0 && <span className="sb-num">{count > 9 ? "9+" : count}</span>}
                    <span className="sb-tip">{item.label}{count > 0 ? ` (${count})` : ""}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── USER ── */}
        <footer className="sb-foot">
          <div className="sb-user">
            <img
              className="sb-ava"
              src={user?.photoURL || `https://api.dicebear.com/8.x/thumbs/svg?seed=${user?.uid || "guest"}&backgroundColor=4f46e5`}
              alt="avatar"
            />
            <div className="sb-uinfo">
              <p className="sb-uname">{user?.displayName || "Foydalanuvchi"}</p>
              <p className="sb-uemail">{user?.email || ""}</p>
            </div>
            <span className="sb-dot" />
          </div>

          <button className="sb-item sb-logout" onClick={logout}>
            <span className="sb-ico">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M10 8H3M6 5l-3 3 3 3"/>
                <path d="M7 3h5a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7"/>
              </svg>
            </span>
            <span className="sb-lbl">Chiqish</span>
            <span className="sb-tip">Chiqish</span>
          </button>
        </footer>

      </aside>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700&family=Geist+Mono:wght@400;500&display=swap');

/* ── tokens ── */
:root {
  --sb-w:  252px;
  --sb-wc: 62px;

  --sb-bg:       #ffffff;
  --sb-border:   #e9e9f0;
  --sb-surface:  #f5f5fc;

  --sb-text:     #111118;
  --sb-text2:    #6b7180;
  --sb-text3:    #a0a8b8;

  --sb-accent:   #4f46e5;
  --sb-accent2:  #7c3aed;
  --sb-ah:       rgba(79,70,229,.08);
  --sb-abg:      rgba(79,70,229,.10);
  --sb-aborder:  rgba(79,70,229,.20);

  --sb-r:  10px;
  --sb-dur: .22s;
  --sb-ease: cubic-bezier(.4,0,.2,1);
  --sb-shadow:
    1px 0 0 var(--sb-border),
    4px 0 20px rgba(0,0,0,.05),
    12px 0 48px rgba(0,0,0,.03);
}
.dark {
  --sb-bg:       #0c0c13;
  --sb-border:   rgba(255,255,255,.07);
  --sb-surface:  rgba(255,255,255,.05);

  --sb-text:     #eeeef8;
  --sb-text2:    #7a7a92;
  --sb-text3:    #48485e;

  --sb-accent:   #818cf8;
  --sb-accent2:  #a78bfa;
  --sb-ah:       rgba(129,140,248,.09);
  --sb-abg:      rgba(129,140,248,.12);
  --sb-aborder:  rgba(129,140,248,.26);

  --sb-shadow:
    1px 0 0 var(--sb-border),
    4px 0 24px rgba(0,0,0,.45),
    12px 0 60px rgba(0,0,0,.35);
}

/* ── reset ── */
*, *::before, *::after { box-sizing: border-box; }

/* ── shell ── */
.sb {
  position: fixed; left: 0; top: 0; z-index: 100;
  width: var(--sb-w); height: 100vh;
  display: flex; flex-direction: column;
  background: var(--sb-bg);
  box-shadow: var(--sb-shadow);
  transition: width var(--sb-dur) var(--sb-ease);
  overflow: hidden;
  font-family: 'Bricolage Grotesque', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.sb--col { width: var(--sb-wc); }

/* ── background lines ── */
.sb-lines {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 0; overflow: hidden;
}
.sb-line {
  position: absolute;
  left: calc(16px + var(--i) * 46px);
  top: 0; bottom: 0; width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(79,70,229,.055) 30%,
    rgba(79,70,229,.055) 70%,
    transparent 100%
  );
  transform: skewX(-6deg);
}
.dark .sb-line {
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(129,140,248,.04) 30%,
    rgba(129,140,248,.04) 70%,
    transparent 100%
  );
}

/* ── header ── */
.sb-head {
  position: relative; z-index: 1;
  padding: 16px 12px 13px;
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  border-bottom: 1px solid var(--sb-border);
  flex-shrink: 0;
}

.sb-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }

.sb-mark {
  width: 32px; height: 32px; border-radius: 9px;
  background: linear-gradient(140deg, var(--sb-accent) 0%, var(--sb-accent2) 100%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(79,70,229,.38), inset 0 1px 0 rgba(255,255,255,.18);
  transition: transform .2s var(--sb-ease), box-shadow .2s;
}
.sb-mark:hover { transform: rotate(-6deg) scale(1.06); box-shadow: 0 4px 18px rgba(79,70,229,.48); }

.sb-wordmark {
  font-size: .96rem; font-weight: 700; letter-spacing: -.03em;
  color: var(--sb-text);
  white-space: nowrap; overflow: hidden;
  max-width: 120px; opacity: 1;
  transition: max-width var(--sb-dur) var(--sb-ease), opacity var(--sb-dur);
}
.sb--col .sb-wordmark { max-width: 0; opacity: 0; }

.sb-controls {
  display: flex; gap: 3px; flex-shrink: 0;
}

.sb-ctrl {
  width: 28px; height: 28px; border-radius: 7px;
  border: none; background: transparent;
  color: var(--sb-text3);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background var(--sb-dur), color var(--sb-dur), transform .15s;
}
.sb-ctrl:hover {
  background: var(--sb-ah);
  color: var(--sb-accent);
  transform: scale(1.1);
}
/* hide theme toggle in collapsed mode */
.sb--col .sb-controls .sb-ctrl:first-child { display: none; }

/* ── nav ── */
.sb-nav {
  position: relative; z-index: 1;
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 8px 8px;
  display: flex; flex-direction: column; gap: 1px;
  scrollbar-width: thin;
  scrollbar-color: rgba(79,70,229,.1) transparent;
}
.sb-nav::-webkit-scrollbar { width: 3px; }
.sb-nav::-webkit-scrollbar-thumb { background: rgba(79,70,229,.1); border-radius: 2px; }

/* ── group ── */
.sb-group {
  margin-bottom: 2px;
  animation: sbIn .32s var(--sb-ease) var(--d, 0ms) both;
}
@keyframes sbIn {
  from { opacity: 0; transform: translateY(7px); }
  to   { opacity: 1; transform: translateY(0); }
}

.sb-glabel {
  font-size: .6rem; font-weight: 600; letter-spacing: .1em;
  text-transform: uppercase; color: var(--sb-text3);
  padding: 10px 9px 5px;
  white-space: nowrap; overflow: hidden;
  max-height: 30px; opacity: 1;
  transition: max-height var(--sb-dur) var(--sb-ease), opacity var(--sb-dur), padding var(--sb-dur);
}
.sb--col .sb-glabel { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; }

/* ── item ── */
.sb-item {
  position: relative;
  display: flex; align-items: center; gap: 9px;
  padding: 7px 8px;
  border-radius: var(--sb-r);
  border: 1px solid transparent;
  color: var(--sb-text2);
  font-size: .825rem; font-weight: 450;
  text-decoration: none; cursor: pointer;
  background: none;
  width: 100%; text-align: left;
  font-family: inherit;
  overflow: hidden; white-space: nowrap;
  transition:
    background var(--sb-dur),
    border-color var(--sb-dur),
    color var(--sb-dur),
    transform .18s var(--sb-ease);
}
.sb-item:hover {
  background: var(--sb-ah);
  color: var(--sb-accent);
  transform: translateX(2px);
}
.sb-item--on {
  background: var(--sb-abg);
  border-color: var(--sb-aborder);
  color: var(--sb-accent);
  font-weight: 600;
}
.sb-item--on::before {
  content: '';
  position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 2.5px; height: 18px;
  border-radius: 0 3px 3px 0;
  background: var(--sb-accent);
  box-shadow: 1px 0 8px var(--sb-accent);
}

/* ── icon wrapper ── */
.sb-ico {
  width: 30px; height: 30px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: var(--sb-surface);
  transition: background var(--sb-dur), transform .18s;
}
.sb-item:hover .sb-ico,
.sb-item--on .sb-ico {
  background: rgba(79,70,229,.11);
  transform: scale(1.07);
}
.dark .sb-item:hover .sb-ico,
.dark .sb-item--on .sb-ico { background: rgba(129,140,248,.14); }

/* ── label ── */
.sb-lbl {
  flex: 1; overflow: hidden;
  max-width: 150px; opacity: 1;
  transition: max-width var(--sb-dur) var(--sb-ease), opacity var(--sb-dur);
}
.sb--col .sb-lbl { max-width: 0; opacity: 0; }

/* ── badge number ── */
.sb-num {
  font-family: 'Geist Mono', monospace;
  font-size: .6rem; font-weight: 500; line-height: 1;
  padding: 2px 6px; border-radius: 100px;
  background: var(--sb-accent); color: #fff;
  flex-shrink: 0;
  box-shadow: 0 0 0 2.5px var(--sb-bg);
  transition: opacity var(--sb-dur);
  animation: sbPop 2.6s ease-in-out infinite;
}
.sb--col .sb-num { opacity: 0; pointer-events: none; }
@keyframes sbPop {
  0%,100% { box-shadow: 0 0 0 2.5px var(--sb-bg); }
  50%      { box-shadow: 0 0 0 2.5px var(--sb-bg), 0 0 10px rgba(79,70,229,.5); }
}

/* ── tooltip (collapsed only) ── */
.sb-tip {
  position: absolute; left: calc(100% + 8px); top: 50%;
  transform: translateY(-50%) translateX(5px) scale(.94);
  padding: 5px 10px; border-radius: 7px;
  background: var(--sb-text); color: var(--sb-bg);
  font-size: .75rem; font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(0,0,0,.18);
  opacity: 0; pointer-events: none;
  transition: opacity .14s, transform .14s;
  z-index: 300;
}
.sb--col .sb-item:hover .sb-tip {
  opacity: 1; transform: translateY(-50%) translateX(0) scale(1);
}

/* ── footer ── */
.sb-foot {
  position: relative; z-index: 1;
  padding: 9px 8px 13px;
  border-top: 1px solid var(--sb-border);
  flex-shrink: 0;
  display: flex; flex-direction: column; gap: 5px;
}

.sb-user {
  display: flex; align-items: center; gap: 9px;
  padding: 8px;
  border-radius: var(--sb-r);
  border: 1px solid var(--sb-border);
  background: var(--sb-surface);
  overflow: hidden;
  transition: background var(--sb-dur), border-color var(--sb-dur);
  cursor: default;
}
.sb-user:hover {
  background: var(--sb-ah);
  border-color: var(--sb-aborder);
}

.sb-ava {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  object-fit: cover;
  border: 1.5px solid var(--sb-border);
  transition: transform .2s;
}
.sb-user:hover .sb-ava { transform: scale(1.07); }

.sb-uinfo {
  flex: 1; min-width: 0; overflow: hidden;
  max-width: 150px; opacity: 1;
  transition: max-width var(--sb-dur) var(--sb-ease), opacity var(--sb-dur);
}
.sb--col .sb-uinfo { max-width: 0; opacity: 0; }

.sb-uname {
  font-size: .78rem; font-weight: 600; color: var(--sb-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sb-uemail {
  font-size: .65rem; color: var(--sb-text3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  font-family: 'Geist Mono', monospace;
  margin-top: 1px;
}

.sb-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  background: #22c55e;
  box-shadow: 0 0 0 2px var(--sb-bg), 0 0 6px rgba(34,197,94,.5);
  animation: sbDot 2.8s ease-in-out infinite;
  transition: opacity var(--sb-dur);
}
.sb--col .sb-dot { opacity: 0; }
@keyframes sbDot {
  0%,100% { box-shadow: 0 0 0 2px var(--sb-bg), 0 0 4px rgba(34,197,94,.4); }
  50%      { box-shadow: 0 0 0 2px var(--sb-bg), 0 0 10px rgba(34,197,94,.7); }
}

/* logout — shares sb-item styles */
.sb-logout {
  color: var(--sb-text3);
  border-color: transparent;
}
.sb-logout:hover {
  background: rgba(239,68,68,.07);
  border-color: rgba(239,68,68,.18);
  color: #ef4444;
  transform: translateX(0);
}
.sb-logout:hover .sb-ico { background: rgba(239,68,68,.1); }
`;
