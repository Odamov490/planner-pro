import { useContext, useState, useMemo } from "react";
import { TaskContext } from "../context/TaskContext";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, RadialBarChart, RadialBar,
} from "recharts";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const PRIORITY_CFG = {
  high:   { label:"Yuqori",  color:"#ef4444", bg:"#fef2f2", icon:"🔴" },
  medium: { label:"O'rta",   color:"#f59e0b", bg:"#fffbeb", icon:"🟡" },
  low:    { label:"Past",    color:"#22c55e", bg:"#f0fdf4", icon:"🟢" },
};
const CAT_COLORS = ["#6366f1","#0ea5e9","#14b8a6","#f59e0b","#f97316","#ec4899","#8b5cf6","#10b981"];

const TABS = [
  { id:"overview",   label:"Umumiy",    icon:"📊" },
  { id:"tasks",      label:"Vazifalar", icon:"✅" },
  { id:"priority",   label:"Muhimlik",  icon:"⚡" },
  { id:"timeline",   label:"Jadval",    icon:"📅" },
  { id:"team",       label:"Jamoa",     icon:"👥" },
];

// ─── HELPERS ──────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate  = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("uz-UZ", { day:"2-digit", month:"short" });
};
const fmtNum = (n) => n?.toLocaleString?.() ?? n;

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, color="#6366f1" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"#fff", border:"1px solid rgba(0,0,0,0.08)",
      borderRadius:12, padding:"10px 14px",
      boxShadow:"0 8px 24px rgba(0,0,0,0.1)",
      fontFamily:"inherit",
    }}>
      {label && <p style={{ fontSize:11, color:"#9ca3af", marginBottom:4, fontWeight:600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize:14, fontWeight:700, color: p.color || color, margin:0 }}>
          {p.name}: {fmtNum(p.value)}
        </p>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ─── METRIC CARD ──────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon, color="#6366f1", trend, sparkline }) => (
  <div style={{
    background:"#fff", borderRadius:18,
    padding:"20px 22px",
    border:"1px solid rgba(0,0,0,0.07)",
    boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
    display:"flex", flexDirection:"column", gap:8,
    position:"relative", overflow:"hidden",
  }}>
    {/* background circle decoration */}
    <div style={{
      position:"absolute", right:-20, top:-20,
      width:80, height:80, borderRadius:"50%",
      background:color+"12",
    }}/>
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
      <div style={{
        fontSize:28, width:44, height:44, borderRadius:12,
        background:color+"15", display:"flex", alignItems:"center", justifyContent:"center",
      }}>{icon}</div>
      {trend !== undefined && (
        <div style={{
          fontSize:11, fontWeight:700,
          color: trend >= 0 ? "#22c55e" : "#ef4444",
          background: trend >= 0 ? "#f0fdf4" : "#fef2f2",
          borderRadius:999, padding:"2px 8px",
          border:`1px solid ${trend >= 0 ? "#bbf7d0" : "#fecaca"}`,
        }}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize:28, fontWeight:900, color:"#1a1a1a", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:13, color:"#9ca3af", fontWeight:500, marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:color, fontWeight:600, marginTop:2 }}>{sub}</div>}
    </div>
    {sparkline && (
      <div style={{ height:32, marginTop:4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkline}>
            <Area type="monotone" dataKey="v" stroke={color} fill={color+"25"} strokeWidth={2} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

// ─── PROGRESS BAR ─────────────────────────────────────────────
const ProgressBar = ({ pct, color, height=8, label, showPct=true }) => (
  <div>
    {(label || showPct) && (
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        {label && <span style={{ fontSize:12, color:"#6b7280", fontWeight:600 }}>{label}</span>}
        {showPct && <span style={{ fontSize:12, color, fontWeight:700 }}>{Math.round(pct)}%</span>}
      </div>
    )}
    <div style={{ background:"#f3f4f6", borderRadius:99, height, overflow:"hidden" }}>
      <div style={{
        width:`${Math.min(pct,100)}%`, height:"100%",
        background:color, borderRadius:99,
        transition:"width 0.7s cubic-bezier(0.4,0,0.2,1)",
        boxShadow:`0 0 8px ${color}50`,
      }}/>
    </div>
  </div>
);

// ─── SECTION CARD ─────────────────────────────────────────────
const SectionCard = ({ title, children, action }) => (
  <div style={{
    background:"#fff", borderRadius:18, padding:"22px 24px",
    border:"1px solid rgba(0,0,0,0.07)",
    boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
  }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
      <h3 style={{ fontSize:14, fontWeight:800, color:"#1a1a1a", letterSpacing:"-0.01em", margin:0 }}>{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

// ─── TASK ROW ─────────────────────────────────────────────────
const TaskRow = ({ task }) => {
  const p = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;
  const isOverdue = task.date && task.date < todayStr() && !task.completed;
  const subsTotal = task.subtasks?.length || 0;
  const subsDone  = task.subtasks?.filter(s=>s.completed).length || 0;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"10px 0",
      borderBottom:"1px solid rgba(0,0,0,0.05)",
    }}>
      {/* status dot */}
      <div style={{
        width:8, height:8, borderRadius:"50%", flexShrink:0,
        background: task.completed ? "#22c55e" : isOverdue ? "#ef4444" : "#f59e0b",
      }}/>
      {/* title */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:13, fontWeight:600, color: task.completed ? "#9ca3af" : "#1a1a1a",
          textDecoration: task.completed ? "line-through" : "none",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>{task.title}</div>
        {subsTotal > 0 && (
          <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>
            {subsDone}/{subsTotal} subtask
          </div>
        )}
      </div>
      {/* priority badge */}
      <span style={{
        fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:999,
        background:p.bg, color:p.color, flexShrink:0,
      }}>{p.icon}</span>
      {/* date */}
      {task.date && (
        <span style={{ fontSize:11, color: isOverdue ? "#ef4444" : "#9ca3af", flexShrink:0 }}>
          {fmtDate(task.date)}
        </span>
      )}
    </div>
  );
};

// ─── DONUT LABEL ──────────────────────────────────────────────
const DonutLabel = ({ cx, cy, value, name, percent }) => (
  <>
    <text x={cx} y={cy-8} textAnchor="middle" fill="#1a1a1a" fontSize={26} fontWeight={900}>
      {value}
    </text>
    <text x={cx} y={cy+14} textAnchor="middle" fill="#9ca3af" fontSize={12} fontWeight={600}>
      {name}
    </text>
  </>
);

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { tasks, stats } = useContext(TaskContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("week"); // week|month|all

  // ── COMPUTED DATA ──
  const data = useMemo(() => {
    const today = todayStr();
    const done    = tasks.filter(t => t.completed).length;
    const active  = tasks.filter(t => !t.completed && !t.archived).length;
    const overdue = tasks.filter(t => !t.completed && t.date && t.date < today).length;
    const todayT  = tasks.filter(t => t.date === today).length;
    const pinned  = tasks.filter(t => t.pinned).length;

    // Subtasks
    let totalSub = 0, doneSub = 0;
    tasks.forEach(t => {
      totalSub += t.subtasks?.length || 0;
      doneSub  += t.subtasks?.filter(s=>s.completed).length || 0;
    });

    // Priority
    const byPriority = [
      { name:"Yuqori",  value: tasks.filter(t=>t.priority==="high").length,   color:"#ef4444" },
      { name:"O'rta",   value: tasks.filter(t=>t.priority==="medium").length,  color:"#f59e0b" },
      { name:"Past",    value: tasks.filter(t=>t.priority==="low").length,     color:"#22c55e" },
    ].filter(p => p.value > 0);

    // Category
    const catMap = {};
    tasks.forEach(t => {
      if (!t.category) return;
      catMap[t.category] = (catMap[t.category] || 0) + 1;
    });
    const byCategory = Object.entries(catMap)
      .map(([name, value], i) => ({ name, value, color:CAT_COLORS[i % CAT_COLORS.length] }))
      .sort((a,b) => b.value - a.value);

    // Timeline — last 14 days
    const last14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const total   = tasks.filter(t => t.date === ds).length;
      const done_   = tasks.filter(t => t.date === ds && t.completed).length;
      const created = tasks.filter(t => {
        const c = t.created?.toDate?.() || (t.created ? new Date(t.created) : null);
        return c && c.toISOString().split("T")[0] === ds;
      }).length;
      last14.push({ date:fmtDate(ds), raw:ds, total, done:done_, created, active:total-done_ });
    }

    // Team stats
    const teamMap = {};
    tasks.forEach(t => {
      if (!t.assignedEmail) return;
      if (!teamMap[t.assignedEmail]) teamMap[t.assignedEmail] = { email:t.assignedEmail, total:0, done:0, high:0 };
      teamMap[t.assignedEmail].total++;
      if (t.completed) teamMap[t.assignedEmail].done++;
      if (t.priority==="high") teamMap[t.assignedEmail].high++;
    });
    const byTeam = Object.values(teamMap).sort((a,b) => b.total - a.total);

    // Completion rate radial
    const pct = tasks.length ? Math.round((done/tasks.length)*100) : 0;
    const radial = [{ name:"Bajarilgan", value:pct, fill:"#6366f1" }];

    // Tags
    const tagMap = {};
    tasks.forEach(t => (t.tags||[]).forEach(tag => {
      tagMap[tag] = (tagMap[tag]||0)+1;
    }));
    const topTags = Object.entries(tagMap)
      .sort((a,b)=>b[1]-a[1]).slice(0,8)
      .map(([tag,count]) => ({ tag, count }));

    // Recent tasks
    const recent = [...tasks]
      .sort((a,b) => {
        const da = a.created?.toDate?.() || new Date(a.created||0);
        const db_ = b.created?.toDate?.() || new Date(b.created||0);
        return db_ - da;
      }).slice(0, 8);

    // Overdue tasks
    const overdueList = tasks.filter(t => !t.completed && t.date && t.date < today)
      .sort((a,b) => a.date.localeCompare(b.date)).slice(0,6);

    // Sparkline for metric cards (last 7 days task counts)
    const spark = last14.slice(-7).map(d => ({ v:d.total }));

    return {
      done, active, overdue, todayT, pinned,
      totalSub, doneSub,
      pct, byPriority, byCategory, last14, byTeam, radial, topTags,
      recent, overdueList, spark,
    };
  }, [tasks]);

  // ── TAB CONTENT ──
  const renderTab = () => {
    switch(activeTab) {

      // ─── OVERVIEW ──────────────────────────────────────────
      case "overview": return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* Metric cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14 }}>
            <MetricCard label="Jami vazifa"    value={tasks.length}   icon="📋" color="#6366f1" sparkline={data.spark}/>
            <MetricCard label="Bajarilgan"      value={data.done}      icon="✅" color="#22c55e" sub={`${data.pct}% yakunlangan`}/>
            <MetricCard label="Faol"            value={data.active}    icon="⚡" color="#f59e0b"/>
            <MetricCard label="Muddati o'tgan"  value={data.overdue}   icon="⚠️" color="#ef4444" sub={data.overdue>0?"Tezkor ko'rib chiqing!":undefined}/>
            <MetricCard label="Bugun"           value={data.todayT}    icon="📅" color="#0ea5e9"/>
            <MetricCard label="Subtasklar"      value={`${data.doneSub}/${data.totalSub}`} icon="🔗" color="#8b5cf6"
              sub={data.totalSub?`${Math.round((data.doneSub/data.totalSub)*100)}% tugallangan`:undefined}/>
          </div>

          {/* Progress overview */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

            {/* Completion donut */}
            <SectionCard title="Bajarilish darajasi">
              <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                <div style={{ width:120, height:120, flexShrink:0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        {name:"Bajarilgan", value:data.done},
                        {name:"Qolgan",     value:data.active || 0.01}
                      ]}
                        dataKey="value" cx="50%" cy="50%"
                        innerRadius={38} outerRadius={54}
                        startAngle={90} endAngle={-270}
                      >
                        <Cell fill="#6366f1"/>
                        <Cell fill="#e0e7ff"/>
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div style={{ fontSize:36, fontWeight:900, color:"#6366f1", lineHeight:1 }}>{data.pct}%</div>
                  <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>Umumiy bajarilish</div>
                  <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:4 }}>
                    {[
                      {label:"Bajarilgan", val:data.done,   color:"#6366f1"},
                      {label:"Faol",       val:data.active, color:"#f59e0b"},
                    ].map(r => (
                      <div key={r.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:r.color}}/>
                        <span style={{fontSize:11,color:"#6b7280"}}>{r.label}:</span>
                        <span style={{fontSize:11,fontWeight:700,color:"#1a1a1a"}}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Progress bars */}
            <SectionCard title="Ko'rsatkichlar">
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <ProgressBar pct={data.pct}  color="#6366f1" label="Vazifalar bajarilishi"/>
                <ProgressBar
                  pct={data.totalSub ? (data.doneSub/data.totalSub)*100 : 0}
                  color="#22c55e" label="Subtasklar bajarilishi"
                />
                <ProgressBar
                  pct={tasks.length ? ((tasks.length-data.overdue)/tasks.length)*100 : 100}
                  color="#f59e0b" label="Vaqtida bajarilish"
                />
                <ProgressBar
                  pct={data.active ? Math.min((data.todayT/data.active)*100,100) : 0}
                  color="#0ea5e9" label="Bugungi faollik"
                />
              </div>
            </SectionCard>
          </div>

          {/* Area chart — 14 day activity */}
          <SectionCard title="14 kunlik aktivlik"
            action={
              <div style={{display:"flex",gap:6}}>
                {["Jami","Bajarilgan","Yaratilgan"].map((l,i)=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:["#6366f1","#22c55e","#f59e0b"][i]}}/>
                    <span style={{fontSize:11,color:"#9ca3af"}}>{l}</span>
                  </div>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.last14} margin={{top:4,right:4,left:-20,bottom:0}}>
                <defs>
                  {[["total","#6366f1"],["done","#22c55e"],["created","#f59e0b"]].map(([k,c])=>(
                    <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0.02}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="total"   name="Jami"      stroke="#6366f1" fill="url(#grad_total)"   strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="done"    name="Bajarilgan" stroke="#22c55e" fill="url(#grad_done)"    strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="created" name="Yaratilgan" stroke="#f59e0b" fill="url(#grad_created)" strokeWidth={2} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Top tags */}
          {data.topTags.length > 0 && (
            <SectionCard title="🏷 Teglar">
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {data.topTags.map(({tag,count},i)=>(
                  <div key={tag} style={{
                    padding:"5px 12px", borderRadius:999,
                    background:CAT_COLORS[i%CAT_COLORS.length]+"15",
                    border:`1.5px solid ${CAT_COLORS[i%CAT_COLORS.length]}40`,
                    display:"flex",alignItems:"center",gap:6,
                  }}>
                    <span style={{fontSize:12,fontWeight:700,color:CAT_COLORS[i%CAT_COLORS.length]}}>#{tag}</span>
                    <span style={{fontSize:10,background:CAT_COLORS[i%CAT_COLORS.length],color:"#fff",borderRadius:999,padding:"0 6px",fontWeight:700}}>{count}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      );

      // ─── TASKS ─────────────────────────────────────────────
      case "tasks": return (
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          {/* Recent + Overdue split */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>

            <SectionCard title="⏰ So'nggi vazifalar">
              {data.recent.length === 0
                ? <Empty msg="Vazifalar yo'q"/>
                : data.recent.map(t => <TaskRow key={t.id} task={t}/>)
              }
            </SectionCard>

            <SectionCard title="🚨 Muddati o'tgan" action={
              data.overdueList.length > 0 && (
                <span style={{fontSize:11,fontWeight:700,background:"#fef2f2",color:"#ef4444",borderRadius:999,padding:"2px 8px",border:"1px solid #fecaca"}}>
                  {data.overdueList.length} ta
                </span>
              )
            }>
              {data.overdueList.length === 0
                ? <Empty msg="Muddati o'tgan vazifa yo'q ✓" color="#22c55e"/>
                : data.overdueList.map(t => <TaskRow key={t.id} task={t}/>)
              }
            </SectionCard>
          </div>

          {/* Status breakdown */}
          <SectionCard title="Holat bo'yicha">
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {[
                {label:"Bajarilgan",    value:data.done,    color:"#22c55e", icon:"✅"},
                {label:"Jarayonda",     value:data.active,  color:"#f59e0b", icon:"⏳"},
                {label:"Muddati o'tgan",value:data.overdue, color:"#ef4444", icon:"🚨"},
              ].map(s=>(
                <div key={s.label} style={{
                  background:s.color+"08", border:`1px solid ${s.color}25`,
                  borderRadius:14,padding:"14px 16px",textAlign:"center",
                }}>
                  <div style={{fontSize:22}}>{s.icon}</div>
                  <div style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1,marginTop:4}}>{s.value}</div>
                  <div style={{fontSize:11,color:"#9ca3af",marginTop:4,fontWeight:600}}>{s.label}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      );

      // ─── PRIORITY ──────────────────────────────────────────
      case "priority": return (
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          {/* Priority cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {Object.entries(PRIORITY_CFG).map(([key,p])=>{
              const cnt   = tasks.filter(t=>t.priority===key).length;
              const done_ = tasks.filter(t=>t.priority===key&&t.completed).length;
              const pct   = cnt ? Math.round((done_/cnt)*100) : 0;
              return (
                <div key={key} style={{
                  background:"#fff",border:`1px solid ${p.color}25`,borderRadius:18,
                  padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div style={{fontSize:26,width:44,height:44,borderRadius:12,background:p.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {p.icon}
                    </div>
                    <span style={{fontSize:28,fontWeight:900,color:p.color}}>{cnt}</span>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>{p.label}</div>
                  <ProgressBar pct={pct} color={p.color} label={`${done_}/${cnt} bajarilgan`}/>
                </div>
              );
            })}
          </div>

          {/* Pie + bar side by side */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <SectionCard title="Muhimlik taqsimoti">
              {data.byPriority.length === 0
                ? <Empty msg="Ma'lumot yo'q"/>
                : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.byPriority} dataKey="value" cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      paddingAngle={4}
                    >
                      {data.byPriority.map((p,i)=>(
                        <Cell key={i} fill={p.color} stroke="transparent"/>
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend iconType="circle" iconSize={8}
                      formatter={(v)=><span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            <SectionCard title="Muhimlik bo'yicha faollik">
              {data.byPriority.length === 0
                ? <Empty msg="Ma'lumot yo'q"/>
                : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byPriority} margin={{top:4,right:4,left:-20,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="value" name="Soni" radius={[8,8,0,0]}>
                      {data.byPriority.map((p,i)=><Cell key={i} fill={p.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </div>

          {/* Category breakdown */}
          <SectionCard title="Kategoriya bo'yicha taqsimot">
            {data.byCategory.length === 0
              ? <Empty msg="Kategoriyalar yo'q"/>
              : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {data.byCategory.map(({name,value,color},i)=>{
                  const pct = tasks.length ? (value/tasks.length)*100 : 0;
                  return (
                    <div key={name} style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{
                        width:32,height:32,borderRadius:8,
                        background:color+"20",display:"flex",alignItems:"center",
                        justifyContent:"center",fontSize:14,flexShrink:0,
                      }}>
                        {["💼","📚","🏠","💰","⚡"][i%5]}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>{name}</span>
                          <span style={{fontSize:12,fontWeight:700,color}}>{value} ta</span>
                        </div>
                        <ProgressBar pct={pct} color={color} showPct={false} height={5}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      );

      // ─── TIMELINE ──────────────────────────────────────────
      case "timeline": return (
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          {/* Bar chart - daily */}
          <SectionCard title="Kunlik faollik (14 kun)"
            action={
              <div style={{display:"flex",gap:4}}>
                {["Faol","Bajarilgan"].map((l,i)=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:8,height:8,borderRadius:2,background:["#6366f1","#22c55e"][i]}}/>
                    <span style={{fontSize:10,color:"#9ca3af"}}>{l}</span>
                  </div>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.last14} margin={{top:4,right:4,left:-20,bottom:0}} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize:9,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="active" name="Faol"       fill="#6366f1" radius={[4,4,0,0]} stackId="a"/>
                <Bar dataKey="done"   name="Bajarilgan" fill="#22c55e" radius={[4,4,0,0]} stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Trend line */}
          <SectionCard title="Vazifa qo'shilishi tendentsiyasi">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.last14} margin={{top:4,right:4,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize:9,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Line type="monotone" dataKey="created" name="Yaratilgan" stroke="#f59e0b" strokeWidth={2.5}
                  dot={{fill:"#f59e0b",strokeWidth:0,r:3}} activeDot={{r:5,fill:"#f59e0b"}}/>
                <Line type="monotone" dataKey="done" name="Bajarilgan" stroke="#22c55e" strokeWidth={2.5}
                  dot={{fill:"#22c55e",strokeWidth:0,r:3}} activeDot={{r:5,fill:"#22c55e"}} strokeDasharray="5 3"/>
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Upcoming tasks table */}
          <SectionCard title="📅 Kelgusi vazifalar">
            {(() => {
              const upcoming = tasks
                .filter(t => !t.completed && t.date && t.date >= todayStr())
                .sort((a,b) => a.date.localeCompare(b.date))
                .slice(0,8);
              if (!upcoming.length) return <Empty msg="Rejalashtirilgan vazifalar yo'q"/>;
              return upcoming.map(t => <TaskRow key={t.id} task={t}/>);
            })()}
          </SectionCard>
        </div>
      );

      // ─── TEAM ──────────────────────────────────────────────
      case "team": return (
        <div style={{display:"flex",flexDirection:"column",gap:20}}>

          {data.byTeam.length === 0 ? (
            <SectionCard title="Jamoa statistikasi">
              <Empty msg="Biror kishiga vazifa topshirilmagan"/>
            </SectionCard>
          ) : (
            <>
              {/* Team member cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
                {data.byTeam.slice(0,6).map((m,i)=>{
                  const pct = m.total ? Math.round((m.done/m.total)*100) : 0;
                  const initials = m.email.split("@")[0].slice(0,2).toUpperCase();
                  const color = CAT_COLORS[i%CAT_COLORS.length];
                  return (
                    <div key={m.email} style={{
                      background:"#fff",borderRadius:18,padding:"18px 20px",
                      border:"1px solid rgba(0,0,0,0.07)",
                      boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                        <div style={{
                          width:40,height:40,borderRadius:12,
                          background:color+"20",color,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:14,fontWeight:800,flexShrink:0,
                        }}>{initials}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {m.email.split("@")[0]}
                          </div>
                          <div style={{fontSize:10,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {m.email}
                          </div>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                        {[
                          {label:"Jami",  val:m.total, color:"#6b7280"},
                          {label:"Tayyor",val:m.done,  color:"#22c55e"},
                          {label:"Yuqori",val:m.high,  color:"#ef4444"},
                        ].map(s=>(
                          <div key={s.label} style={{textAlign:"center"}}>
                            <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.val}</div>
                            <div style={{fontSize:10,color:"#9ca3af"}}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <ProgressBar pct={pct} color={color} label={`${pct}% bajarilgan`}/>
                    </div>
                  );
                })}
              </div>

              {/* Team bar chart */}
              <SectionCard title="Jamoa samaradorligi">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={data.byTeam.map(m=>({
                      name: m.email.split("@")[0].slice(0,10),
                      Jami:  m.total,
                      Tayyor:m.done,
                    }))}
                    margin={{top:4,right:4,left:-20,bottom:0}}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="Jami"   fill="#6366f1" radius={[4,4,0,0]} maxBarSize={40}/>
                    <Bar dataKey="Tayyor" fill="#22c55e" radius={[4,4,0,0]} maxBarSize={40}/>
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
            </>
          )}
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"#f8f7f4",
      fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",
      color:"#1a1a1a",
    }}>
       <div style={{ padding: "28px 20px 80px" }}>

        {/* ── HEADER ── */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28,gap:16,flexWrap:"wrap"}}>
          <div>
            <h1 style={{fontSize:28,fontWeight:900,letterSpacing:"-0.03em",margin:0,lineHeight:1}}>
              Dashboard
            </h1>
            <p style={{color:"#9ca3af",fontSize:13,marginTop:6,marginBottom:0}}>
              {new Date().toLocaleDateString("uz-UZ",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
            </p>
          </div>

          {/* Quick stats pills */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[
              {label:"Jami",    val:tasks.length,  color:"#6366f1"},
              {label:"Tayyor",  val:data.done,     color:"#22c55e"},
              {label:"Bugun",   val:data.todayT,   color:"#0ea5e9"},
              {label:"Kechikdi",val:data.overdue,  color:"#ef4444"},
            ].map(p=>(
              <div key={p.label} style={{
                padding:"7px 14px",borderRadius:999,
                background:"#fff",border:"1px solid rgba(0,0,0,0.08)",
                display:"flex",alignItems:"center",gap:7,
                boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <div style={{width:7,height:7,borderRadius:"50%",background:p.color}}/>
                <span style={{fontSize:12,color:"#9ca3af",fontWeight:600}}>{p.label}</span>
                <span style={{fontSize:13,fontWeight:800,color:"#1a1a1a"}}>{p.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{
          display:"flex",gap:4,marginBottom:24,
          background:"#fff",borderRadius:16,padding:6,
          border:"1px solid rgba(0,0,0,0.07)",
          boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
          overflowX:"auto",
        }}>
          {TABS.map(tab=>{
            const isActive = tab.id === activeTab;
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{
                flex:1,minWidth:90,
                padding:"9px 14px",borderRadius:12,
                border:"none",cursor:"pointer",
                background: isActive ? "#1a1a1a" : "transparent",
                color: isActive ? "#fff" : "#9ca3af",
                fontSize:13,fontWeight:isActive?700:600,
                fontFamily:"inherit",
                display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                transition:"all 0.18s ease",
                whiteSpace:"nowrap",
              }}>
                <span style={{fontSize:14}}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT ── */}
        <div style={{animation:"fadeIn 0.2s ease"}}>
          {renderTab()}
        </div>

      </div>

      <style>{`
        * { box-sizing:border-box; }
        @keyframes fadeIn {
          from{opacity:0;transform:translateY(6px)}
          to{opacity:1;transform:translateY(0)}
        }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
      `}</style>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────
const Empty = ({ msg, color="#9ca3af" }) => (
  <div style={{textAlign:"center",padding:"32px 20px"}}>
    <div style={{fontSize:32,marginBottom:8}}>📭</div>
    <p style={{fontSize:13,color,fontWeight:600,margin:0}}>{msg}</p>
  </div>
);
