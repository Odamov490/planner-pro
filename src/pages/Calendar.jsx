import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { TaskContext } from "../context/TaskContext";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════════
const WEEKDAYS  = ["Du","Se","Ch","Pa","Ju","Sh","Ya"];
const MONTHS_UZ = ["Yanvar","Fevral","Mart","Aprel","May","Iyun",
                   "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];

const PRIORITY = {
  high:   { color:"#ef4444", bg:"#fef2f2", label:"Yuqori"  },
  medium: { color:"#f59e0b", bg:"#fffbeb", label:"O'rta"   },
  low:    { color:"#22c55e", bg:"#f0fdf4", label:"Past"    },
};

const toKey   = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const todayKey = () => toKey(...(() => { const n=new Date(); return [n.getFullYear(),n.getMonth(),n.getDate()]; })());

const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();
const firstDay    = (y,m) => { const d=new Date(y,m,1).getDay(); return d===0?6:d-1; }; // Mon=0

const fmtFull = (key) => new Date(`${key}T00:00:00`)
  .toLocaleDateString("uz-UZ",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

const daysLeft = (key) => {
  const today = new Date(`${todayKey()}T00:00:00`);
  const d = new Date(`${key}T00:00:00`);
  return Math.round((d-today)/(864e5));
};

const deadlineInfo = (task) => {
  if (task.completed) return { text:"Bajarilgan", color:"#22c55e" };
  const dl = daysLeft(task.date);
  if (dl < 0)  return { text:`${Math.abs(dl)} kun kechikdi`, color:"#ef4444" };
  if (dl === 0) return { text:"Bugun",  color:"#6366f1" };
  if (dl === 1) return { text:"Ertaga", color:"#f59e0b" };
  return { text:`${dl} kun qoldi`, color:"#9ca3af" };
};

// ═══════════════════════════════════════════════════════════════
// MINI COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ─── DOT BADGE ────────────────────────────────────────────────
const PriDot = ({ priority, size=8 }) => {
  const p = PRIORITY[priority];
  if (!p) return null;
  return <span style={{
    display:"inline-block", width:size, height:size,
    borderRadius:"50%", background:p.color, flexShrink:0,
  }}/>;
};

// ─── PRIORITY CHIP ────────────────────────────────────────────
const PriChip = ({ priority }) => {
  const p = PRIORITY[priority];
  if (!p) return null;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"2px 8px", borderRadius:999,
      background:p.bg, color:p.color,
      fontSize:10, fontWeight:700,
    }}>
      <PriDot priority={priority} size={5}/>{p.label}
    </span>
  );
};

// ─── SUBTASK MINI LIST ────────────────────────────────────────
const SubList = ({ subtasks=[] }) => {
  if (!subtasks.length) return null;
  const done = subtasks.filter(s=>s.completed).length;
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
        <div style={{ flex:1, height:4, background:"#f3f4f6", borderRadius:99, overflow:"hidden" }}>
          <div style={{
            width:`${(done/subtasks.length)*100}%`,
            height:"100%", background:"#6366f1", borderRadius:99,
            transition:"width 0.4s ease",
          }}/>
        </div>
        <span style={{ fontSize:10, color:"#9ca3af", fontWeight:600 }}>{done}/{subtasks.length}</span>
      </div>
      {subtasks.slice(0,3).map(s=>(
        <div key={s.id} style={{
          display:"flex", alignItems:"flex-start", gap:5,
          fontSize:11, color:s.completed?"#9ca3af":"#6b7280",
          textDecoration:s.completed?"line-through":"none",
          marginBottom:2, paddingLeft:2,
        }}>
          <span style={{ marginTop:2, flexShrink:0 }}>{s.completed?"✓":"·"}</span>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.text}</span>
        </div>
      ))}
      {subtasks.length > 3 && (
        <div style={{ fontSize:10, color:"#9ca3af", paddingLeft:7 }}>+{subtasks.length-3} ta yana</div>
      )}
    </div>
  );
};

// ─── TASK CARD ────────────────────────────────────────────────
const TaskCard = ({ task, compact=false }) => {
  const dl      = task.date ? deadlineInfo(task) : null;
  const isOver  = !task.completed && task.date && daysLeft(task.date) < 0;
  const subsT   = task.subtasks?.length || 0;
  const subsD   = task.subtasks?.filter(s=>s.completed).length || 0;

  return (
    <div style={{
      background: task.completed ? "#f9fafb" : isOver ? "#fff5f5" : "#fff",
      border:`1px solid ${task.completed ? "#e5e7eb" : isOver ? "#fecaca" : "#e0e7ff"}`,
      borderLeft:`3px solid ${task.completed?"#e5e7eb":PRIORITY[task.priority]?.color||"#e5e7eb"}`,
      borderRadius:12,
      padding: compact ? "10px 12px" : "14px 16px",
      transition:"all 0.15s ease",
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        {/* Completion dot */}
        <div style={{
          width:16, height:16, borderRadius:4, flexShrink:0, marginTop:1,
          border:`2px solid ${task.completed?"#22c55e":"#d1d5db"}`,
          background:task.completed?"#22c55e":"transparent",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {task.completed && <span style={{color:"#fff",fontSize:9,lineHeight:1}}>✓</span>}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize: compact ? 12 : 13, fontWeight:600,
            color:task.completed?"#9ca3af":"#1a1a1a",
            textDecoration:task.completed?"line-through":"none",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>{task.title}</div>

          <div style={{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap", alignItems:"center" }}>
            <PriChip priority={task.priority}/>
            {task.category && (
              <span style={{ fontSize:10, color:"#6b7280", fontWeight:600 }}>{task.category}</span>
            )}
            {dl && (
              <span style={{ fontSize:10, color:dl.color, fontWeight:700 }}>{dl.text}</span>
            )}
            {task.assignedEmail && (
              <span style={{ fontSize:10, color:"#9ca3af" }}>→ {task.assignedEmail.split("@")[0]}</span>
            )}
          </div>

          {!compact && subsT > 0 && <SubList subtasks={task.subtasks}/>}
          {compact && subsT > 0 && (
            <div style={{ fontSize:10, color:"#9ca3af", marginTop:4 }}>
              {subsD}/{subsT} subtask
            </div>
          )}
        </div>

        {/* Day badge */}
        {task.date && !compact && (
          <div style={{
            width:34, height:34, borderRadius:10, flexShrink:0,
            background: task.completed?"#f3f4f6":isOver?"#fee2e2":"#eff6ff",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, fontWeight:800,
            color:task.completed?"#9ca3af":isOver?"#ef4444":"#6366f1",
          }}>
            {new Date(`${task.date}T00:00:00`).getDate()}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DATE MODAL ───────────────────────────────────────────────
const DateModal = ({ date, tasks, onClose }) => {
  useEffect(() => {
    if (!date) return;
    const h = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [date, onClose]);

  if (!date) return null;
  const done   = tasks.filter(t=>t.completed).length;
  const active = tasks.length - done;

  return (
    <div
      onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{
        position:"fixed", inset:0, zIndex:200,
        background:"rgba(0,0,0,0.45)", backdropFilter:"blur(4px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      }}
    >
      <div style={{
        background:"#fff", borderRadius:24, width:"100%", maxWidth:500,
        boxShadow:"0 24px 80px rgba(0,0,0,0.2)", overflow:"hidden",
        animation:"popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Header */}
        <div style={{
          padding:"20px 24px 16px",
          borderBottom:"1px solid rgba(0,0,0,0.07)",
          display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"#6366f1", textTransform:"uppercase", letterSpacing:"0.1em" }}>
              Tanlangan sana
            </div>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#1a1a1a", margin:"6px 0 4px", letterSpacing:"-0.02em" }}>
              {fmtFull(date)}
            </h2>
            <div style={{ display:"flex", gap:10 }}>
              <span style={{ fontSize:12, color:"#9ca3af" }}>{tasks.length} ta vazifa</span>
              {active > 0 && <span style={{ fontSize:12, color:"#6366f1", fontWeight:600 }}>{active} ta ochiq</span>}
              {done  > 0 && <span style={{ fontSize:12, color:"#22c55e", fontWeight:600 }}>{done} ta bajarilgan</span>}
            </div>
          </div>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:"50%", border:"1px solid rgba(0,0,0,0.1)",
            background:"#f9fafb", cursor:"pointer", fontSize:16, color:"#6b7280",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>×</button>
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div style={{ padding:"12px 24px 0" }}>
            <div style={{ height:4, background:"#f3f4f6", borderRadius:99, overflow:"hidden" }}>
              <div style={{
                width:`${(done/tasks.length)*100}%`, height:"100%",
                background:"#22c55e", borderRadius:99, transition:"width 0.5s ease",
              }}/>
            </div>
          </div>
        )}

        {/* Task list */}
        <div style={{ padding:"16px 24px 24px", maxHeight:"60vh", overflowY:"auto", display:"flex", flexDirection:"column", gap:8 }}>
          {tasks.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:13 }}>
              Bu sanaga vazifalar biriktirilmagan
            </div>
          )}
          {tasks
            .sort((a,b) => Number(a.completed)-Number(b.completed) || (PRIORITY[a.priority]?.label||"").localeCompare(PRIORITY[b.priority]?.label||""))
            .map(t => <TaskCard key={t.id} task={t} compact/>)
          }
        </div>
      </div>
    </div>
  );
};

// ─── MINI MONTH NAV ───────────────────────────────────────────
const NavBtn = ({ onClick, children }) => (
  <button onClick={onClick} style={{
    width:32, height:32, borderRadius:8, border:"1px solid rgba(0,0,0,0.1)",
    background:"#fff", cursor:"pointer", fontSize:14, color:"#374151",
    display:"flex", alignItems:"center", justifyContent:"center",
    transition:"all 0.15s",
  }}
  onMouseEnter={e=>{ e.currentTarget.style.background="#f3f4f6"; }}
  onMouseLeave={e=>{ e.currentTarget.style.background="#fff"; }}
  >{children}</button>
);

// ─── STAT PILL ────────────────────────────────────────────────
const StatPill = ({ label, value, color, icon }) => (
  <div style={{
    background:"#fff", border:"1px solid rgba(0,0,0,0.07)",
    borderRadius:16, padding:"16px 18px",
    display:"flex", flexDirection:"column", gap:8, flex:1, minWidth:120,
  }}>
    <div style={{ fontSize:22 }}>{icon}</div>
    <div style={{ fontSize:26, fontWeight:900, color, lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:11, color:"#9ca3af", fontWeight:600 }}>{label}</div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN CALENDAR
// ═══════════════════════════════════════════════════════════════
export default function Calendar() {
  const { tasks, loading } = useContext(TaskContext);

  const today    = todayKey();
  const now      = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView]   = useState("month"); // month | week | list
  const [filterPri, setFilterPri] = useState("all");

  // ── GROUP BY DATE ──
  const grouped = useMemo(() => {
    const m = {};
    (tasks||[]).forEach(t => {
      if (!t.date || t.archived) return;
      if (!m[t.date]) m[t.date] = [];
      m[t.date].push(t);
    });
    return m;
  }, [tasks]);

  // ── STATS ──
  const stats = useMemo(() => {
    const all    = tasks || [];
    const t_done = all.filter(t=>t.completed).length;
    const t_over = all.filter(t=>!t.completed&&t.date&&t.date<today).length;
    const t_today= all.filter(t=>t.date===today&&!t.archived).length;
    const t_week = (() => {
      const end = new Date(); end.setDate(end.getDate()+7);
      const ws  = end.toISOString().split("T")[0];
      return all.filter(t=>!t.completed&&t.date&&t.date>=today&&t.date<=ws).length;
    })();
    return { done:t_done, total:all.length, overdue:t_over, today:t_today, thisWeek:t_week };
  }, [tasks, today]);

  // ── CALENDAR GRID ──
  const grid = useMemo(() => {
    const days   = daysInMonth(year, month);
    const offset = firstDay(year, month);
    const cells  = [];
    for (let i=0; i<offset; i++) cells.push(null);
    for (let d=1; d<=days; d++) cells.push(d);
    return cells;
  }, [year, month]);

  // ── NAVIGATION ──
  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };
  const goToday   = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  // ── WEEK VIEW (current week) ──
  const weekDays = useMemo(() => {
    const days = [];
    const d = new Date();
    const dayOfWeek = d.getDay()===0?6:d.getDay()-1;
    d.setDate(d.getDate()-dayOfWeek);
    for (let i=0;i<7;i++) {
      const copy = new Date(d);
      copy.setDate(d.getDate()+i);
      const key = toKey(copy.getFullYear(),copy.getMonth(),copy.getDate());
      days.push({ key, date:copy });
    }
    return days;
  }, []);

  // ── FILTERED LIST ──
  const listTasks = useMemo(() => {
    return (tasks||[])
      .filter(t=>!t.archived)
      .filter(t=>filterPri==="all"||t.priority===filterPri)
      .sort((a,b) => (a.date||"z").localeCompare(b.date||"z"));
  }, [tasks, filterPri]);

  const modalTasks = useMemo(() =>
    selectedDate
      ? (grouped[selectedDate]||[]).sort((a,b)=>Number(a.completed)-Number(b.completed))
      : []
  , [grouped, selectedDate]);

  return (
    <div style={{
      minHeight:"100vh", background:"#f8f7f4",
      fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",
      color:"#1a1a1a",
    }}>
      <div style={{ padding:"28px 20px 80px" }}>  

        {/* ── HEADER ── */}
        <div style={{ marginBottom:24 }}>
          <div style={{
            background:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
            borderRadius:24, padding:"28px 32px",
            color:"#fff", position:"relative", overflow:"hidden",
          }}>
            {/* decoration circles */}
            {[{s:200,r:-60,t:-60,o:0.04},{s:140,r:undefined,t:-40,l:-40,o:0.06}].map((c,i)=>(
              <div key={i} style={{
                position:"absolute", width:c.s, height:c.s, borderRadius:"50%",
                background:"#fff", opacity:c.o,
                right:c.r, top:c.t, left:c.l,
              }}/>
            ))}

            <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:16 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:8 }}>
                  Reja va muddatlar
                </div>
                <h1 style={{ fontSize:30, fontWeight:900, margin:0, letterSpacing:"-0.02em" }}>Kalendar</h1>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:6, marginBottom:0 }}>
                  Vazifalarni sana bo'yicha boshqaring
                </p>
              </div>
              <div style={{
                background:"rgba(255,255,255,0.1)", backdropFilter:"blur(8px)",
                borderRadius:14, padding:"12px 18px", border:"1px solid rgba(255,255,255,0.15)",
              }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>
                  Bugun
                </div>
                <div style={{ fontSize:15, fontWeight:800, marginTop:4 }}>{fmtFull(today)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          <StatPill label="Jami vazifa"     value={stats.total}    color="#6366f1" icon="📋"/>
          <StatPill label="Bajarilgan"       value={stats.done}     color="#22c55e" icon="✅"/>
          <StatPill label="Bugun"            value={stats.today}    color="#0ea5e9" icon="📅"/>
          <StatPill label="Bu hafta"         value={stats.thisWeek} color="#f59e0b" icon="📆"/>
          <StatPill label="Kechikkan"        value={stats.overdue}  color="#ef4444" icon="⚠️"/>
        </div>

        {/* ── VIEW SWITCHER ── */}
        <div style={{
          display:"flex", gap:4, marginBottom:20,
          background:"#fff", borderRadius:14, padding:5,
          border:"1px solid rgba(0,0,0,0.07)", width:"fit-content",
          boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
        }}>
          {[
            {id:"month",label:"🗓 Oy"},
            {id:"week", label:"📅 Hafta"},
            {id:"list", label:"📋 Ro'yxat"},
          ].map(v=>(
            <button key={v.id} onClick={()=>setView(v.id)} style={{
              padding:"8px 18px", borderRadius:10, border:"none", cursor:"pointer",
              fontFamily:"inherit", fontSize:13, fontWeight:600,
              background: view===v.id ? "#1a1a1a" : "transparent",
              color:      view===v.id ? "#fff"    : "#9ca3af",
              transition:"all 0.18s ease",
            }}>{v.label}</button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════
            MONTH VIEW
        ══════════════════════════════════════════════════════ */}
        {view === "month" && (
          <div style={{
            background:"#fff", borderRadius:20, padding:"20px 20px 24px",
            border:"1px solid rgba(0,0,0,0.07)",
            boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
          }}>
            {/* Month nav */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <h2 style={{ fontSize:20, fontWeight:800, margin:0, letterSpacing:"-0.02em" }}>
                  {MONTHS_UZ[month]} {year}
                </h2>
                <button onClick={goToday} style={{
                  fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:999,
                  border:"1px solid rgba(99,102,241,0.3)", background:"#eff6ff",
                  color:"#6366f1", cursor:"pointer", fontFamily:"inherit",
                }}>Bugun</button>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <NavBtn onClick={prevMonth}>‹</NavBtn>
                <NavBtn onClick={nextMonth}>›</NavBtn>
              </div>
            </div>

            {/* Weekday headers */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:8 }}>
              {WEEKDAYS.map(w=>(
                <div key={w} style={{
                  textAlign:"center", fontSize:11, fontWeight:700,
                  color:"#9ca3af", padding:"4px 0",
                }}>{w}</div>
              ))}
            </div>

            {/* Calendar cells */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
              {grid.map((d, i) => {
                if (!d) return <div key={`e${i}`}/>;
                const key      = toKey(year, month, d);
                const dayTasks = grouped[key] || [];
                const isToday  = key === today;
                const hasOver  = dayTasks.some(t=>!t.completed);
                const allDone  = dayTasks.length > 0 && dayTasks.every(t=>t.completed);
                const isPast   = key < today;

                // Color logic
                const hasTasks  = dayTasks.length > 0;
                const hasHigh   = dayTasks.some(t=>t.priority==="high"&&!t.completed);
                const dotColor  = hasHigh ? "#ef4444" : allDone ? "#22c55e" : "#6366f1";

                return (
                  <button
                    key={key}
                    onClick={() => hasTasks && setSelectedDate(key)}
                    style={{
                      borderRadius:10,
                      padding:"8px 4px 6px",
                      border:`1.5px solid ${isToday?"#6366f1":hasTasks?"rgba(99,102,241,0.15)":"transparent"}`,
                      background: isToday ? "#eff6ff" : hasTasks ? "#fafbff" : "transparent",
                      cursor: hasTasks ? "pointer" : "default",
                      transition:"all 0.15s ease",
                      minHeight:54,
                      display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                    }}
                    onMouseEnter={e=>{ if(hasTasks) e.currentTarget.style.background=isToday?"#e8f0fe":"#f5f3ff"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=isToday?"#eff6ff":hasTasks?"#fafbff":"transparent"; }}
                  >
                    {/* Day number */}
                    <div style={{
                      width:26, height:26, borderRadius:"50%",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:13, fontWeight:isToday?900:600,
                      background: isToday ? "#6366f1" : "transparent",
                      color: isToday ? "#fff" : isPast ? "#d1d5db" : "#1a1a1a",
                    }}>{d}</div>

                    {/* Task dots */}
                    {hasTasks && (
                      <div style={{ display:"flex", gap:2, flexWrap:"wrap", justifyContent:"center", maxWidth:32 }}>
                        {dayTasks.slice(0,4).map((t,ti)=>(
                          <div key={ti} style={{
                            width:5, height:5, borderRadius:"50%",
                            background: t.completed ? "#22c55e"
                              : PRIORITY[t.priority]?.color || "#6366f1",
                            opacity: t.completed ? 0.5 : 1,
                          }}/>
                        ))}
                        {dayTasks.length > 4 && (
                          <div style={{ fontSize:8, color:"#9ca3af", fontWeight:700 }}>+{dayTasks.length-4}</div>
                        )}
                      </div>
                    )}

                    {/* Count badge */}
                    {dayTasks.length > 0 && (
                      <div style={{
                        fontSize:9, fontWeight:700,
                        color: dotColor, lineHeight:1,
                      }}>{dayTasks.length}</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display:"flex", gap:14, marginTop:16, paddingTop:14, borderTop:"1px solid rgba(0,0,0,0.06)", flexWrap:"wrap" }}>
              {[
                {color:"#6366f1",label:"Oddiy"},
                {color:"#ef4444",label:"Muhim"},
                {color:"#22c55e",label:"Bajarilgan"},
              ].map(l=>(
                <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:l.color }}/>
                  <span style={{ fontSize:11, color:"#9ca3af" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            WEEK VIEW
        ══════════════════════════════════════════════════════ */}
        {view === "week" && (
          <div style={{
            background:"#fff", borderRadius:20, padding:"20px",
            border:"1px solid rgba(0,0,0,0.07)",
            boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <h2 style={{ fontSize:18, fontWeight:800, margin:"0 0 18px", letterSpacing:"-0.02em" }}>
              Joriy hafta
            </h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10 }}>
              {weekDays.map(({ key, date:d }) => {
                const dayTasks = grouped[key] || [];
                const isT      = key === today;
                const done_    = dayTasks.filter(t=>t.completed).length;
                const pct      = dayTasks.length ? (done_/dayTasks.length)*100 : 0;
                const dayName  = d.toLocaleDateString("uz-UZ",{weekday:"short"});

                return (
                  <button
                    key={key}
                    onClick={() => dayTasks.length && setSelectedDate(key)}
                    style={{
                      borderRadius:14,
                      border:`1.5px solid ${isT?"#6366f1":"rgba(0,0,0,0.07)"}`,
                      background: isT ? "#eff6ff" : "#fafafa",
                      padding:"12px 8px",
                      cursor:dayTasks.length?"pointer":"default",
                      transition:"all 0.15s",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                      minHeight:100,
                    }}
                    onMouseEnter={e=>{ if(dayTasks.length) e.currentTarget.style.background=isT?"#e8f0fe":"#f5f3ff"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background=isT?"#eff6ff":"#fafafa"; }}
                  >
                    <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase" }}>{dayName}</div>
                    <div style={{
                      width:32, height:32, borderRadius:"50%",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:15, fontWeight:900,
                      background:isT?"#6366f1":"transparent",
                      color:isT?"#fff":"#1a1a1a",
                    }}>{d.getDate()}</div>

                    {dayTasks.length > 0 && (
                      <>
                        <div style={{ fontSize:11, fontWeight:700, color:"#6366f1" }}>
                          {dayTasks.length} ta
                        </div>
                        {/* mini progress */}
                        <div style={{ width:"100%", height:4, background:"#f3f4f6", borderRadius:99, overflow:"hidden" }}>
                          <div style={{
                            width:`${pct}%`, height:"100%",
                            background:"#22c55e", borderRadius:99,
                          }}/>
                        </div>
                        {/* top priorities */}
                        <div style={{ display:"flex", gap:2, flexWrap:"wrap", justifyContent:"center" }}>
                          {dayTasks.slice(0,3).map((t,i)=>(
                            <div key={i} style={{
                              width:6, height:6, borderRadius:"50%",
                              background:PRIORITY[t.priority]?.color||"#6366f1",
                              opacity:t.completed?0.4:1,
                            }}/>
                          ))}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Week tasks expanded */}
            <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:16 }}>
              {weekDays.map(({ key, date:d }) => {
                const dayTasks = grouped[key] || [];
                if (!dayTasks.length) return null;
                const isT = key === today;
                return (
                  <div key={key}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{
                        fontSize:11, fontWeight:700, color: isT?"#6366f1":"#6b7280",
                        textTransform:"uppercase", letterSpacing:"0.08em",
                      }}>
                        {d.toLocaleDateString("uz-UZ",{weekday:"long",day:"numeric",month:"short"})}
                        {isT && " · Bugun"}
                      </span>
                      <div style={{ flex:1, height:1, background:"rgba(0,0,0,0.06)" }}/>
                      <span style={{ fontSize:11, color:"#9ca3af" }}>{dayTasks.length} ta</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {dayTasks.map(t=><TaskCard key={t.id} task={t} compact/>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            LIST VIEW
        ══════════════════════════════════════════════════════ */}
        {view === "list" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Filter bar */}
            <div style={{
              background:"#fff", borderRadius:16, padding:"14px 16px",
              border:"1px solid rgba(0,0,0,0.07)",
              display:"flex", gap:8, alignItems:"center", flexWrap:"wrap",
            }}>
              <span style={{ fontSize:12, color:"#9ca3af", fontWeight:700 }}>Muhimlik:</span>
              {[
                {v:"all",    l:"Barchasi"},
                {v:"high",   l:"🔴 Yuqori"},
                {v:"medium", l:"🟡 O'rta"},
                {v:"low",    l:"🟢 Past"},
              ].map(f=>(
                <button key={f.v} onClick={()=>setFilterPri(f.v)} style={{
                  padding:"6px 14px", borderRadius:999, border:"none", cursor:"pointer",
                  fontFamily:"inherit", fontSize:12, fontWeight:600,
                  background: filterPri===f.v ? "#1a1a1a" : "#f3f4f6",
                  color:      filterPri===f.v ? "#fff"    : "#6b7280",
                  transition:"all 0.15s",
                }}>{f.l}</button>
              ))}
              <div style={{ marginLeft:"auto", fontSize:12, color:"#9ca3af" }}>
                {listTasks.length} ta vazifa
              </div>
            </div>

            {/* Grouped list */}
            {(() => {
              const dateGroups = {};
              listTasks.forEach(t => {
                const k = t.date || "sanasiz";
                if (!dateGroups[k]) dateGroups[k] = [];
                dateGroups[k].push(t);
              });
              const keys = Object.keys(dateGroups).sort();

              if (!keys.length) return (
                <div style={{
                  background:"#fff", borderRadius:16, padding:"60px 20px",
                  textAlign:"center", border:"1px solid rgba(0,0,0,0.07)",
                  color:"#9ca3af", fontSize:14,
                }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
                  Vazifalar topilmadi
                </div>
              );

              return keys.map(k => {
                const isT   = k === today;
                const isP   = k < today && k !== "sanasiz";
                const label = k === "sanasiz"
                  ? "📌 Sanasiz"
                  : isT ? "📅 Bugun"
                  : isP ? `⚠ ${fmtFull(k)}`
                  : `📅 ${fmtFull(k)}`;

                return (
                  <div key={k}>
                    {/* Date header */}
                    <div style={{
                      display:"flex", alignItems:"center", gap:10, marginBottom:8, paddingLeft:2,
                    }}>
                      <span style={{
                        fontSize:12, fontWeight:700,
                        color: isP?"#ef4444":isT?"#6366f1":"#6b7280",
                        letterSpacing:"0.01em",
                      }}>{label}</span>
                      <div style={{ flex:1, height:1, background:"rgba(0,0,0,0.06)" }}/>
                      <span style={{
                        fontSize:10, fontWeight:700,
                        background: isP?"#fef2f2":isT?"#eff6ff":"#f3f4f6",
                        color:      isP?"#ef4444":isT?"#6366f1":"#9ca3af",
                        borderRadius:999, padding:"2px 8px",
                      }}>{dateGroups[k].length}</span>
                    </div>

                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {dateGroups[k].map(t=><TaskCard key={t.id} task={t}/>)}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

      </div>

      {/* ── DATE MODAL ── */}
      <DateModal date={selectedDate} tasks={modalTasks} onClose={()=>setSelectedDate(null)}/>

      <style>{`
        * { box-sizing:border-box; }
        @keyframes popIn {
          from { opacity:0; transform:scale(0.9) translateY(8px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }
      `}</style>
    </div>
  );
}
