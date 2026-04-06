/**
 * ⚡ Planner — Dashboard Page
 * Recharts · Glassmorphism · Dark/Light · Real-time feel
 */

import { useContext, useState, useEffect, lazy, Suspense } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { AuthContext } from "../../context/AuthContext";
import { TaskContext } from "../../context/TaskContext";
import { NotificationContext } from "../../context/NotificationContext";
import { StatCard, Card, Badge, Skeleton, SkeletonCard, AvatarGroup } from "../ui";

// ── Sample data ──────────────────────────────────────────────
const WEEKLY = [
  { day: "Du", done: 4, total: 6 },
  { day: "Se", done: 7, total: 9 },
  { day: "Ch", done: 3, total: 5 },
  { day: "Pa", done: 9, total: 10 },
  { day: "Ju", done: 5, total: 7 },
  { day: "Sh", done: 2, total: 4 },
  { day: "Ya", done: 6, total: 8 },
];

const ACTIVITY_AREA = [
  { h: "00", v: 2 }, { h: "03", v: 1 }, { h: "06", v: 4 },
  { h: "09", v: 12 }, { h: "12", v: 18 }, { h: "15", v: 15 },
  { h: "18", v: 9 }, { h: "21", v: 6 }, { h: "24", v: 3 },
];

const RECENT_TASKS = [
  { id: 1, title: "API integratsiyasini tugatish", priority: "high",  status: "inProgress", due: "Bugun" },
  { id: 2, title: "UI review o'tkazish",           priority: "med",   status: "todo",       due: "Ertaga" },
  { id: 3, title: "Backend testlarini yozish",     priority: "low",   status: "done",       due: "O'tdi"  },
  { id: 4, title: "Deploy script tayyorlash",      priority: "high",  status: "todo",       due: "2-may"  },
  { id: 5, title: "Prezentatsiya qilish",          priority: "med",   status: "done",       due: "O'tdi"  },
];

const TIMELINE = [
  { icon: "✅", text: "Ali vazifani tugatdi",       time: "2 daqiqa oldin",  color: "#22c55e" },
  { icon: "💬", text: "Barno izoh qoldirdi",        time: "15 daqiqa oldin", color: "#6366f1" },
  { icon: "📎", text: "Fayl yuklandi: design.fig",  time: "1 soat oldin",    color: "#8b5cf6" },
  { icon: "👥", text: "Yangi a'zo qo'shildi",       time: "2 soat oldin",    color: "#06b6d4" },
  { icon: "🚀", text: "v2.1 deploy qilindi",        time: "Kecha",           color: "#f59e0b" },
];

const PRIORITY_MAP = {
  high: { label: "Yuqori",  variant: "danger"  },
  med:  { label: "O'rta",   variant: "warn"    },
  low:  { label: "Past",    variant: "neutral" },
};
const STATUS_MAP = {
  todo:       { label: "Kutmoqda",    variant: "neutral"  },
  inProgress: { label: "Jarayonda",  variant: "primary"  },
  done:       { label: "Tugallandi", variant: "success"  },
};

// ── Custom Tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--glass, rgba(255,255,255,0.9))",
      backdropFilter: "blur(16px)",
      border: "1px solid var(--glass-border, rgba(99,102,241,0.15))",
      borderRadius: 10, padding: "8px 14px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      fontSize: "0.78rem",
      fontFamily: "'DM Sans',sans-serif",
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4, fontFamily: "'Syne',sans-serif" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { tasks = [] } = useContext(TaskContext);
  const { notifications = [] } = useContext(NotificationContext);

  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 6)  setGreeting("Xayrli tun");
    else if (h < 12) setGreeting("Xayrli tong");
    else if (h < 18) setGreeting("Xayrli kun");
    else setGreeting("Xayrli kech");

    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const totalTasks    = tasks.length;
  const doneTasks     = tasks.filter((t) => t.completed).length;
  const activeTasks   = totalTasks - doneTasks;
  const unreadNotifs  = notifications.filter((n) => !n.read).length;
  const completion    = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const s = {
    page: {
      padding: "28px 28px 40px",
      maxWidth: 1100,
    },
    h: (s) => ({
      fontFamily: "'Syne',sans-serif",
      ...s,
    }),
    grid2: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
      gap: 16,
    },
    grid3: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
    },
  };

  if (loading) return (
    <div style={s.page}>
      <Skeleton height={28} width={240} style={{ marginBottom: 8, borderRadius: 8 }} />
      <Skeleton height={14} width={180} style={{ marginBottom: 32, borderRadius: 6 }} />
      <div style={s.grid2}>
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-3,#94a3b8)", fontFamily: "'Syne',sans-serif", letterSpacing: "0.06em", marginBottom: 4 }}>
            {time.toLocaleDateString("uz-UZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase()}
          </p>
          <h1 style={s.h({ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text,#1e293b)", lineHeight: 1.1 })}>
            {greeting}, {user?.displayName?.split(" ")[0] || "Do'stim"} 👋
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-2,#64748b)", marginTop: 6 }}>
            Bugun <strong style={{ color: "var(--c-primary,#6366f1)" }}>{activeTasks}</strong> ta faol vazifa kutmoqda
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            padding: "8px 16px", borderRadius: 12,
            background: "var(--glass,rgba(255,255,255,0.72))",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--glass-border,rgba(99,102,241,0.15))",
            fontSize: "0.8rem", fontFamily: "'Syne',sans-serif", fontWeight: 600,
            color: "var(--text-2,#64748b)",
          }}>
            📊 {completion}% bajarildi
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ ...s.grid2, marginBottom: 20 }}>
        <StatCard icon="📝" label="Jami vazifalar"    value={totalTasks}   trend={12}  trendLabel="o'tgan haftadan"  accent />
        <StatCard icon="✅" label="Bajarilgan"        value={doneTasks}    trend={8}   trendLabel="ijobiy dinamika"       />
        <StatCard icon="⚡" label="Faol vazifalar"    value={activeTasks}  trend={-3}  trendLabel="kamayish kuzatildi"    />
        <StatCard icon="🔔" label="O'qilmagan xabar" value={unreadNotifs} trend={0}   trendLabel="bugungi holat"         />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 20 }}>

        {/* Weekly bar chart */}
        <Card title="Haftalik bajarish" subtitle="Vazifalar soni" accent hover>
          <div style={{ height: 200, marginTop: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.07)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: "'Syne',sans-serif", fill: "var(--text-3,#94a3b8)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="rgba(99,102,241,0.12)" radius={[6,6,0,0]} name="Jami" />
                <Bar dataKey="done"  fill="url(#barGrad)"        radius={[6,6,0,0]} name="Bajarildi" />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity area chart */}
        <Card title="Bugungi faollik" subtitle="Soatlar bo'yicha" hover>
          <div style={{ height: 200, marginTop: 4 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVITY_AREA}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.07)" />
                <XAxis dataKey="h" tick={{ fontSize: 10, fill: "var(--text-3,#94a3b8)", fontFamily: "'Syne',sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} fill="url(#areaGrad)" name="Amallar" dot={false} activeDot={{ r: 5, fill: "#6366f1" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>

        {/* Recent tasks */}
        <Card title="So'nggi vazifalar" subtitle="Eng muhim topshiriqlar"
          header={<a href="/tasks" style={{ fontSize: "0.75rem", color: "var(--c-primary,#6366f1)", textDecoration: "none", fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>Barchasi →</a>}
          hover
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {RECENT_TASKS.map((task, i) => (
              <div
                key={task.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: task.status === "done"
                    ? "rgba(34,197,94,0.04)"
                    : "rgba(99,102,241,0.03)",
                  border: "1px solid",
                  borderColor: task.status === "done"
                    ? "rgba(34,197,94,0.12)"
                    : "rgba(99,102,241,0.08)",
                  transition: "all 0.2s",
                  cursor: "pointer",
                  animation: `psFadeSlide 0.4s ${i * 0.05}s both`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
              >
                <span style={{ fontSize: "0.85rem" }}>
                  {task.status === "done" ? "✅" : task.priority === "high" ? "🔴" : "🟡"}
                </span>
                <span style={{
                  flex: 1, fontSize: "0.82rem",
                  color: task.status === "done" ? "var(--text-3,#94a3b8)" : "var(--text,#1e293b)",
                  textDecoration: task.status === "done" ? "line-through" : "none",
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                  {task.title}
                </span>
                <Badge variant={STATUS_MAP[task.status].variant}>
                  {STATUS_MAP[task.status].label}
                </Badge>
                <span style={{ fontSize: "0.7rem", color: "var(--text-3,#94a3b8)", fontFamily: "'Syne',sans-serif", minWidth: 40, textAlign: "right" }}>
                  {task.due}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity timeline */}
        <Card title="Faoliyat" subtitle="Real-time lenta" hover>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {TIMELINE.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  paddingBottom: 16,
                  position: "relative",
                  animation: `psFadeSlide 0.4s ${i * 0.06}s both`,
                }}
              >
                {/* Line */}
                {i < TIMELINE.length - 1 && (
                  <div style={{
                    position: "absolute", left: 15, top: 28,
                    width: 1, bottom: 0,
                    background: "linear-gradient(180deg, var(--glass-border,rgba(99,102,241,0.15)), transparent)",
                  }} />
                )}
                {/* Icon bubble */}
                <div style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: `${item.color}18`,
                  border: `1px solid ${item.color}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.8rem", flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text,#1e293b)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.4 }}>
                    {item.text}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "var(--text-3,#94a3b8)", marginTop: 2, fontFamily: "'Syne',sans-serif" }}>
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* fade-slide keyframes (reuse from sidebar) */}
      <style>{`
        @keyframes psFadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
