import { useState, useRef, useContext } from "react";
import { TaskContext } from "../context/TaskContext";

// ─── PRIORITY CONFIG ──────────────────────────────────────────
const PRIORITY = {
  high:   { color:"#ef4444", bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  label:"Yuqori"  },
  medium: { color:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", label:"O'rta"   },
  low:    { color:"#22c55e", bg:"rgba(34,197,94,0.08)",  border:"rgba(34,197,94,0.25)",  label:"Past"    },
};

const CATEGORY_COLOR = {
  "Ish":     "#6366f1",
  "O'qish":  "#0ea5e9",
  "Shaxsiy": "#14b8a6",
  "Moliya":  "#f59e0b",
  "Sport":   "#f97316",
};

// ─── SMALL CHECKBOX ───────────────────────────────────────────
const Checkbox = ({ checked, onChange, size = 20 }) => (
  <button
    onClick={onChange}
    style={{
      width: size, height: size, borderRadius: size * 0.3,
      border: `2px solid ${checked ? "#22c55e" : "#d1d5db"}`,
      background: checked ? "#22c55e" : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
    }}
  >
    {checked && (
      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
        <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </button>
);

// ─── SUBTASK ROW ──────────────────────────────────────────────
const SubtaskRow = ({ sub, taskId }) => {
  const { toggleSubtask, deleteSubtask, editSubtask } = useContext(TaskContext);
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(sub.text);

  const save = () => {
    if (val.trim()) editSubtask(taskId, sub.id, val);
    setEditing(false);
  };

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:8,
      padding:"5px 0",
      borderBottom:"1px solid rgba(0,0,0,0.04)",
    }}>
      <Checkbox size={16} checked={sub.completed} onChange={() => toggleSubtask(taskId, sub.id)}/>

      {editing ? (
        <input
          autoFocus value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if(e.key==="Enter") save(); if(e.key==="Escape") setEditing(false); }}
          style={{
            flex:1, fontSize:13, border:"none", outline:"none",
            background:"transparent", color:"#374151", fontFamily:"inherit",
          }}
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          style={{
            flex:1, fontSize:13,
            color: sub.completed ? "#9ca3af" : "#374151",
            textDecoration: sub.completed ? "line-through" : "none",
            cursor:"text",
          }}
        >{sub.text}</span>
      )}

      <button
        onClick={() => deleteSubtask(taskId, sub.id)}
        style={{
          border:"none", background:"transparent", cursor:"pointer",
          color:"#d1d5db", fontSize:15, padding:"0 2px",
          opacity:0, transition:"opacity 0.15s",
        }}
        className="sub-del"
      >×</button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TASK CARD
// ═══════════════════════════════════════════════════════════════
export default function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const {
    addSubtask, pinTask, archiveTask, duplicateTask, updateTask,
  } = useContext(TaskContext);

  const [expanded,    setExpanded]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editVal,     setEditVal]     = useState(task.title);
  const [subInput,    setSubInput]    = useState("");
  const [showMenu,    setShowMenu]    = useState(false);
  const [hovered,     setHovered]     = useState(false);
  const menuRef = useRef(null);

  const p   = PRIORITY[task.priority] || PRIORITY.medium;
  const catColor = CATEGORY_COLOR[task.category] || "#6b7280";

  const subsDone  = (task.subtasks || []).filter(s => s.completed).length;
  const subsTotal = (task.subtasks || []).length;
  const subPct    = subsTotal ? Math.round((subsDone / subsTotal) * 100) : 0;

  const isOverdue = task.date && task.date < new Date().toISOString().split("T")[0] && !task.completed;
  const isToday   = task.date === new Date().toISOString().split("T")[0];

  const saveEdit = () => {
    if (editVal.trim()) onEdit(task.id, editVal);
    setEditing(false);
  };

  const addSub = () => {
    if (subInput.trim()) { addSubtask(task.id, subInput); setSubInput(""); }
  };

  // Direction badge
  const dirColor = task.direction === "incoming" ? "#6366f1" : "#0ea5e9";
  const dirLabel = task.direction === "incoming" ? "Topshirilgan" : "Siz berdingiz";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowMenu(false); }}
      style={{
        background: task.pinned ? "#fffbeb" : "#fff",
        border: `1px solid ${
          task.completed ? "rgba(0,0,0,0.05)"
          : isOverdue    ? "rgba(239,68,68,0.25)"
          : hovered      ? "rgba(0,0,0,0.15)"
          : "rgba(0,0,0,0.07)"
        }`,
        borderLeft: `3px solid ${task.completed ? "#e5e7eb" : p.color}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "all 0.15s ease",
        boxShadow: hovered ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
        opacity: task.archived ? 0.5 : 1,
      }}
    >
      {/* ── MAIN ROW ── */}
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
      }}>

        {/* Checkbox */}
        <Checkbox checked={task.completed} onChange={() => onToggle(task.id)}/>

        {/* Content */}
        <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={() => setExpanded(v=>!v)}>

          {editing ? (
            <input
              autoFocus value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e => { if(e.key==="Enter") saveEdit(); if(e.key==="Escape") setEditing(false); }}
              onClick={e => e.stopPropagation()}
              style={{
                width:"100%", fontSize:14, fontWeight:600,
                border:"none", borderBottom:"1.5px solid #6366f1",
                outline:"none", background:"transparent",
                color:"#1a1a1a", fontFamily:"inherit", padding:"2px 0",
              }}
            />
          ) : (
            <div style={{
              fontSize:14, fontWeight:600,
              color: task.completed ? "#9ca3af" : "#1a1a1a",
              textDecoration: task.completed ? "line-through" : "none",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              transition:"color 0.15s",
            }}>
              {task.pinned && <span style={{ marginRight:6, fontSize:12 }}>📌</span>}
              {task.title}
            </div>
          )}

          {/* Meta row */}
          <div style={{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap", alignItems:"center" }}>

            {/* Priority badge */}
            <span style={{
              fontSize:11, fontWeight:600,
              padding:"1px 8px", borderRadius:999,
              background: p.bg, color: p.color,
              border: `1px solid ${p.border}`,
            }}>● {p.label}</span>

            {/* Category */}
            {task.category && (
              <span style={{
                fontSize:11, fontWeight:600,
                padding:"1px 8px", borderRadius:999,
                background: catColor+"15", color: catColor,
              }}>{task.category}</span>
            )}

            {/* Direction */}
            {task.direction && (
              <span style={{
                fontSize:10, fontWeight:600, padding:"1px 7px", borderRadius:999,
                background: dirColor+"12", color: dirColor,
              }}>{dirLabel}</span>
            )}

            {/* Date */}
            {task.date && (
              <span style={{
                fontSize:11, color: isOverdue ? "#ef4444" : isToday ? "#f59e0b" : "#9ca3af",
                fontWeight: (isOverdue||isToday) ? 600 : 400,
              }}>
                {isOverdue ? "⚠ " : isToday ? "📅 " : ""}
                {isToday ? "Bugun" : task.date}
              </span>
            )}

            {/* Tags */}
            {(task.tags||[]).map(tag => (
              <span key={tag} style={{
                fontSize:10, padding:"1px 7px", borderRadius:999,
                background:"#f3f4f6", color:"#6b7280", fontWeight:500,
              }}>#{tag}</span>
            ))}

            {/* Assigned */}
            {task.assignedEmail && task.direction === "outgoing" && (
              <span style={{ fontSize:11, color:"#9ca3af" }}>→ {task.assignedEmail}</span>
            )}

            {/* Subtask progress */}
            {subsTotal > 0 && (
              <span style={{ fontSize:11, color:"#9ca3af" }}>
                {subsDone}/{subsTotal} subtask
              </span>
            )}
          </div>

          {/* Subtask progress bar */}
          {subsTotal > 0 && (
            <div style={{
              marginTop:6, height:3, background:"#f3f4f6", borderRadius:99,
              overflow:"hidden",
            }}>
              <div style={{
                width:`${subPct}%`, height:"100%",
                background: subPct===100 ? "#22c55e" : "#6366f1",
                borderRadius:99, transition:"width 0.4s ease",
              }}/>
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div style={{
          display:"flex", alignItems:"center", gap:4,
          opacity: hovered ? 1 : 0, transition:"opacity 0.15s",
        }}>

          {/* Edit */}
          <ActionBtn
            icon="✎"
            title="Tahrirlash"
            onClick={e => { e.stopPropagation(); setEditing(v=>!v); setExpanded(true); }}
          />

          {/* Pin */}
          <ActionBtn
            icon={task.pinned ? "📌" : "📍"}
            title={task.pinned ? "Pinni olib tashlash" : "Pin qilish"}
            onClick={e => { e.stopPropagation(); pinTask(task.id); }}
            active={task.pinned}
          />

          {/* Expand */}
          <ActionBtn
            icon={expanded ? "⌃" : "⌄"}
            title={expanded ? "Yopish" : "Ko'proq"}
            onClick={e => { e.stopPropagation(); setExpanded(v=>!v); }}
          />

          {/* Menu */}
          <div style={{ position:"relative" }} ref={menuRef}>
            <ActionBtn
              icon="⋯"
              title="Ko'proq amallar"
              onClick={e => { e.stopPropagation(); setShowMenu(v=>!v); }}
            />
            {showMenu && (
              <div style={{
                position:"absolute", top:"calc(100% + 4px)", right:0, zIndex:100,
                background:"#fff", border:"1px solid rgba(0,0,0,0.1)",
                borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,0.1)",
                minWidth:170, overflow:"hidden",
                animation:"menuIn 0.12s ease",
              }}>
                {[
                  { icon:"⧉", label:"Nusxalash",  action:() => duplicateTask(task.id) },
                  { icon:"🗄", label: task.archived ? "Arxivdan chiqarish" : "Arxivlash", action:() => archiveTask(task.id) },
                  { icon:"✕", label:"O'chirish",   action:() => onDelete(task.id), danger:true },
                ].map(item => (
                  <button key={item.label} onClick={e => { e.stopPropagation(); item.action(); setShowMenu(false); }} style={{
                    width:"100%", padding:"10px 14px", border:"none", background:"transparent",
                    cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:500,
                    color: item.danger ? "#ef4444" : "#374151",
                    display:"flex", alignItems:"center", gap:10, textAlign:"left",
                    transition:"background 0.1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = item.danger ? "#fff5f5" : "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize:14 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── EXPANDED PANEL ── */}
      {expanded && (
        <div style={{
          borderTop:"1px solid rgba(0,0,0,0.06)",
          padding:"14px 16px",
          background:"#fafafa",
          animation:"expandIn 0.18s ease",
        }}>

          {/* Note */}
          {task.note && (
            <div style={{
              fontSize:13, color:"#6b7280", lineHeight:1.6,
              marginBottom:12, padding:"8px 12px",
              background:"#fff", borderRadius:8,
              border:"1px solid rgba(0,0,0,0.06)",
            }}>
              📝 {task.note}
            </div>
          )}

          {/* Repeat info */}
          {task.repeat && task.repeat !== "none" && (
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:10 }}>
              🔁 Takrorlanish: <b style={{color:"#6b7280"}}>{
                { daily:"Har kun", weekly:"Har hafta", monthly:"Har oy" }[task.repeat] || task.repeat
              }</b>
            </div>
          )}

          {/* Assigned info */}
          {task.assignedEmail && (
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>
              {task.direction === "incoming"
                ? `📥 ${task.createdByEmail} tomonidan topshirilgan`
                : `📤 ${task.assignedEmail} ga topshirilgan`
              }
            </div>
          )}

          {/* Subtasks */}
          <div style={{ marginBottom:10 }}>
            <div style={{
              fontSize:11, fontWeight:700, color:"#9ca3af",
              textTransform:"uppercase", letterSpacing:"0.06em",
              marginBottom:8,
              display:"flex", justifyContent:"space-between",
            }}>
              <span>Kichik vazifalar</span>
              {subsTotal > 0 && (
                <span style={{ color: subPct===100 ? "#22c55e" : "#9ca3af" }}>
                  {subsDone}/{subsTotal} ({subPct}%)
                </span>
              )}
            </div>

            {(task.subtasks || []).map(sub => (
              <SubtaskRow key={sub.id} sub={sub} taskId={task.id}/>
            ))}

            {/* Add subtask */}
            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              <input
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") addSub(); }}
                placeholder="+ Kichik vazifa qo'shish..."
                style={{
                  flex:1, fontSize:13, padding:"7px 10px",
                  border:"1px solid rgba(0,0,0,0.1)", borderRadius:8,
                  outline:"none", background:"#fff", fontFamily:"inherit", color:"#374151",
                }}
              />
              <button onClick={addSub} style={{
                padding:"7px 12px", borderRadius:8, border:"none",
                background:"#1a1a1a", color:"#fff", cursor:"pointer",
                fontSize:13, fontFamily:"inherit", fontWeight:600,
              }}>+</button>
            </div>
          </div>

          {/* Quick priority change */}
          <div style={{ display:"flex", gap:6, marginTop:4 }}>
            <span style={{ fontSize:11, color:"#9ca3af", alignSelf:"center" }}>Muhimlik:</span>
            {["high","medium","low"].map(pv => {
              const pc = PRIORITY[pv];
              return (
                <button key={pv} onClick={() => updateTask(task.id, { priority: pv })} style={{
                  padding:"3px 10px", borderRadius:999, border:"none", cursor:"pointer",
                  fontSize:11, fontWeight:600, fontFamily:"inherit",
                  background: task.priority===pv ? pc.bg : "#f3f4f6",
                  color:      task.priority===pv ? pc.color : "#9ca3af",
                  transition:"all 0.12s",
                }}>● {pc.label}</button>
              );
            })}
          </div>

        </div>
      )}

      <style>{`
        .sub-del { opacity: 0 !important; }
        *:hover > .sub-del, .sub-del:focus { opacity: 1 !important; }
        @keyframes menuIn {
          from { opacity:0; transform:translateY(-6px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes expandIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>
    </div>
  );
}

// ─── ACTION BUTTON ────────────────────────────────────────────
const ActionBtn = ({ icon, title, onClick, active }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      width:28, height:28, borderRadius:7, border:"none",
      background: active ? "#fffbeb" : "transparent",
      cursor:"pointer", display:"flex", alignItems:"center",
      justifyContent:"center", fontSize:14, color: active ? "#f59e0b" : "#9ca3af",
      transition:"all 0.12s",
      fontFamily:"inherit",
    }}
    onMouseEnter={e => { e.currentTarget.style.background="#f3f4f6"; e.currentTarget.style.color="#374151"; }}
    onMouseLeave={e => { e.currentTarget.style.background= active?"#fffbeb":"transparent"; e.currentTarget.style.color= active?"#f59e0b":"#9ca3af"; }}
  >
    {icon}
  </button>
);
