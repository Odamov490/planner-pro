import { useState, useContext, useEffect, useRef } from "react";
import { TaskContext } from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import { notify } from "../utils/notify";
import { getSuggestion } from "../utils/ai";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const PRIORITIES = [
  { value:"high",   label:"Yuqori",  icon:"●", color:"#ef4444", bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.3)",  desc:"Shoshilinch" },
  { value:"medium", label:"O'rta",   icon:"●", color:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.3)", desc:"Oddiy"       },
  { value:"low",    label:"Past",    icon:"●", color:"#22c55e", bg:"rgba(34,197,94,0.08)",  border:"rgba(34,197,94,0.3)",  desc:"Keyin"       },
];
const CATEGORIES = [
  { value:"Ish",     label:"Ish",     icon:"💼", color:"#6366f1" },
  { value:"O'qish",  label:"O'qish",  icon:"📚", color:"#0ea5e9" },
  { value:"Shaxsiy", label:"Shaxsiy", icon:"🏠", color:"#14b8a6" },
  { value:"Moliya",  label:"Moliya",  icon:"💰", color:"#f59e0b" },
  { value:"Sport",   label:"Sport",   icon:"⚡", color:"#f97316" },
];

// ═══════════════════════════════════════════════════════════════
// STYLE TOKENS
// ═══════════════════════════════════════════════════════════════
const card = {
  background:"#fff", border:"1px solid rgba(0,0,0,0.07)",
  borderRadius:20, padding:"24px 24px",
  boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
};
const inputSt = {
  width:"100%", padding:"11px 14px",
  border:"1px solid rgba(0,0,0,0.12)", borderRadius:12,
  fontSize:14, outline:"none", background:"#fafafa",
  color:"#1a1a1a", fontFamily:"inherit", boxSizing:"border-box",
  transition:"border-color 0.15s",
};
const labelSt = {
  fontSize:11, fontWeight:700, color:"#6b7280",
  textTransform:"uppercase", letterSpacing:"0.06em",
  marginBottom:7, display:"block",
};
const pill = (active, color="#1a1a1a") => ({
  padding:"7px 16px", borderRadius:999, border:"none", cursor:"pointer",
  fontFamily:"inherit", fontSize:13, fontWeight:600,
  background: active ? color : "#f3f4f6",
  color:      active ? "#fff" : "#6b7280",
  transition:"all 0.15s",
});

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════
const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background:"#fff", border:"1px solid rgba(0,0,0,0.07)",
    borderRadius:16, padding:"16px 18px",
    display:"flex", flexDirection:"column", gap:6, flex:1, minWidth:120,
    position:"relative", overflow:"hidden",
  }}>
    <div style={{
      position:"absolute", right:-12, top:-12,
      width:52, height:52, borderRadius:"50%", background:color+"12",
    }}/>
    <span style={{ fontSize:22 }}>{icon}</span>
    <span style={{ fontSize:26, fontWeight:900, color, lineHeight:1 }}>{value}</span>
    <span style={{ fontSize:11, color:"#9ca3af", fontWeight:500 }}>{label}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// PROGRESS RING
// ═══════════════════════════════════════════════════════════════
const Ring = ({ pct, size=54, stroke=5 }) => {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a1a" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition:"stroke-dashoffset 0.6s ease" }}/>
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════

// Barcha users real-time
function useUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);
  return users;
}

// Mening jamoalarim real-time
function useMyTeams() {
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) { setTeams([]); return; }
      const q = collection(db, "teams");
      return onSnapshot(q, snap => {
        setTeams(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(t => t.memberIds?.includes(user.uid))
        );
      });
    });
    return () => unsub();
  }, []);
  return teams;
}

// ═══════════════════════════════════════════════════════════════
// USER SEARCH DROPDOWN
// ═══════════════════════════════════════════════════════════════
const UserSearch = ({ value, onChange, onSelect, exclude=[] }) => {
  const allUsers = useUsers();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const list = value.trim().length === 0 ? [] : allUsers
    .filter(u => u.email && !exclude.includes(u.email))
    .filter(u => {
      const q = value.toLowerCase();
      return u.email.toLowerCase().includes(q) ||
             (u.displayName||"").toLowerCase().includes(q);
    })
    .slice(0, 7);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => value.trim() && setOpen(true)}
        placeholder="Email yoki ism yozing…"
        style={inputSt}
        onFocus_fix={e => e.target.style.borderColor="#6366f1"}
        onBlur={e => e.target.style.borderColor="rgba(0,0,0,0.12)"}
      />

      {open && list.length > 0 && (
        <div style={{
          position:"absolute", top:"calc(100% + 5px)", left:0, right:0, zIndex:300,
          background:"#fff", border:"1px solid rgba(0,0,0,0.1)",
          borderRadius:14, boxShadow:"0 12px 40px rgba(0,0,0,0.12)",
          overflow:"hidden",
        }}>
          <div style={{
            padding:"7px 14px 5px", fontSize:10, fontWeight:700,
            color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em",
            borderBottom:"1px solid rgba(0,0,0,0.05)",
          }}>
            {list.length} ta foydalanuvchi
          </div>
          {list.map((u, i) => (
            <div key={u.id}
              onMouseDown={() => { onSelect(u); setOpen(false); }}
              style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"9px 14px", cursor:"pointer", background:"#fff",
                borderBottom: i < list.length-1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                transition:"background 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background="#f5f3ff"}
              onMouseLeave={e => e.currentTarget.style.background="#fff"}
            >
              <div style={{
                width:34, height:34, borderRadius:"50%", flexShrink:0,
                background:"#eff6ff", border:"2px solid #e0e7ff",
                overflow:"hidden", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:12, fontWeight:800, color:"#6366f1",
              }}>
                {u.photoURL
                  ? <img src={u.photoURL} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : (u.displayName||u.email).slice(0,2).toUpperCase()
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {u.displayName || u.email?.split("@")[0]}
                </div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>{u.email}</div>
              </div>
              <div style={{
                fontSize:10, fontWeight:700, color:"#6366f1",
                background:"#eff6ff", borderRadius:6, padding:"2px 8px",
              }}>Tanlash</div>
            </div>
          ))}
        </div>
      )}

      {open && value.trim().length >= 2 && list.length === 0 && (
        <div style={{
          position:"absolute", top:"calc(100% + 5px)", left:0, right:0, zIndex:300,
          background:"#fff", border:"1px solid rgba(0,0,0,0.1)",
          borderRadius:12, padding:"16px", boxShadow:"0 8px 32px rgba(0,0,0,0.1)",
          textAlign:"center",
        }}>
          <div style={{ fontSize:12, color:"#9ca3af" }}>Foydalanuvchi topilmadi</div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ASSIGNEE SECTION (shaxsiy yoki jamoa)
// ═══════════════════════════════════════════════════════════════
const AssignSection = ({
  assignMode, setAssignMode,
  emailInput, setEmailInput,
  selectedUser, setSelectedUser,
  selectedTeam, setSelectedTeam,
}) => {
  const myTeams = useMyTeams();

  return (
    <div>
      <label style={labelSt}>👤 Topshiriq berish</label>

      {/* Mode toggle */}
      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
        {[
          { v:"person", l:"👤 Shaxs" },
          { v:"team",   l:"👥 Jamoa" },
        ].map(m => (
          <button key={m.v} onClick={() => {
            setAssignMode(m.v);
            setSelectedUser(null); setEmailInput("");
            setSelectedTeam(null);
          }} style={{
            padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer",
            fontFamily:"inherit", fontSize:12, fontWeight:700,
            background: assignMode===m.v ? "#1a1a1a" : "#f3f4f6",
            color:      assignMode===m.v ? "#fff"    : "#9ca3af",
            transition:"all 0.15s",
          }}>{m.l}</button>
        ))}
      </div>

      {/* Person mode */}
      {assignMode === "person" && (
        <div>
          {selectedUser ? (
            <div style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"9px 12px", background:"#f5f3ff",
              border:"1px solid #e0e7ff", borderRadius:12, marginBottom:8,
            }}>
              <div style={{
                width:32, height:32, borderRadius:"50%",
                background:"#eff6ff", border:"2px solid #e0e7ff",
                overflow:"hidden", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:12, fontWeight:800, color:"#6366f1",
              }}>
                {selectedUser.photoURL
                  ? <img src={selectedUser.photoURL} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : (selectedUser.displayName||selectedUser.email).slice(0,2).toUpperCase()
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>
                  {selectedUser.displayName || selectedUser.email?.split("@")[0]}
                </div>
                <div style={{ fontSize:10, color:"#9ca3af" }}>{selectedUser.email}</div>
              </div>
              <button onClick={() => { setSelectedUser(null); setEmailInput(""); }}
                style={{ border:"none", background:"transparent", cursor:"pointer", color:"#9ca3af", fontSize:16 }}>
                ✕
              </button>
            </div>
          ) : (
            <UserSearch
              value={emailInput}
              onChange={v => { setEmailInput(v); setSelectedUser(null); }}
              onSelect={u => { setSelectedUser(u); setEmailInput(u.email); }}
            />
          )}
        </div>
      )}

      {/* Team mode */}
      {assignMode === "team" && (
        <div>
          {myTeams.length === 0 ? (
            <div style={{
              padding:"14px", background:"#f9fafb", borderRadius:12,
              textAlign:"center", fontSize:12, color:"#9ca3af",
            }}>
              Hali jamoangiz yo'q. Avval jamoa yarating.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {myTeams.map(t => {
                const isSelected = selectedTeam?.id === t.id;
                const color = t.color || "#6366f1";
                return (
                  <div key={t.id}
                    onClick={() => setSelectedTeam(isSelected ? null : t)}
                    style={{
                      display:"flex", alignItems:"center", gap:10,
                      padding:"10px 14px", borderRadius:12, cursor:"pointer",
                      border:`1.5px solid ${isSelected ? color : "rgba(0,0,0,0.08)"}`,
                      background: isSelected ? color+"0d" : "#fafafa",
                      transition:"all 0.15s",
                    }}
                  >
                    <div style={{
                      width:34, height:34, borderRadius:10, flexShrink:0,
                      background:color+"20", display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:18,
                    }}>{t.icon||"👥"}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{t.name}</div>
                      <div style={{ fontSize:11, color:"#9ca3af" }}>
                        {t.members?.length||0} a'zo
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{
                        width:20, height:20, borderRadius:"50%",
                        background:color, display:"flex", alignItems:"center",
                        justifyContent:"center",
                      }}>
                        <span style={{ color:"#fff", fontSize:11 }}>✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedTeam && (
            <div style={{
              marginTop:10, padding:"8px 12px", background:"#f0fdf4",
              border:"1px solid #bbf7d0", borderRadius:10, fontSize:12,
              color:"#16a34a", fontWeight:600,
            }}>
              ✓ "{selectedTeam.name}" jamoasi tanlandi
              ({selectedTeam.members?.length||0} a'zoga yuboriladi)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask, editTask, stats, canUndo, undo } = useContext(TaskContext);

  // ── Form ──
  const [input,        setInput]        = useState("");
  const [suggestion,   setSuggestion]   = useState("");
  const [date,         setDate]         = useState("");
  const [priority,     setPriority]     = useState("");
  const [category,     setCategory]     = useState("");
  const [tags,         setTags]         = useState([]);
  const [tagInput,     setTagInput]     = useState("");
  const [note,         setNote]         = useState("");
  const [showForm,     setShowForm]     = useState(true);

  // ── Assign ──
  const [assignMode,   setAssignMode]   = useState("person"); // "person" | "team"
  const [emailInput,   setEmailInput]   = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // ── List ──
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState("all");
  const [sortBy,       setSortBy]       = useState("date");
  const [viewMode,     setViewMode]     = useState("grouped");
  const [selected,     setSelected]     = useState(new Set());
  const [bulkMode,     setBulkMode]     = useState(false);

  // ── AI suggestion ──
  useEffect(() => {
    if (input.length < 3) { setSuggestion(""); return; }
    const t = setTimeout(async () => {
      const res = await getSuggestion(input);
      setSuggestion(res);
    }, 400);
    return () => clearTimeout(t);
  }, [input]);

  // ── ADD ──
  const handleAdd = async () => {
    if (!input.trim()) return notify("Vazifa yozing ❗");
    const lines = input.split("\n").map(l => l.trim()).filter(Boolean);

    const basePayload = {
      date, priority, category, note, tags,
    };

    if (assignMode === "team" && selectedTeam) {
      // Jamoa vazifasi
      await Promise.all(lines.map(title =>
        addTask({
          ...basePayload,
          title,
          teamId:        selectedTeam.id,
          teamName:      selectedTeam.name,
          teamMemberIds: selectedTeam.memberIds || [],
          assignedTo:    null,
          assignedEmail: null,
        })
      ));
      notify(`✓ ${lines.length} ta vazifa "${selectedTeam.name}" jamoasiga qo'shildi`);
    } else {
      // Shaxsiy / bitta kishiga
      await Promise.all(lines.map(title =>
        addTask({
          ...basePayload,
          title,
          assignedTo:    selectedUser?.uid    || null,
          assignedEmail: selectedUser?.email  || null,
        })
      ));
      notify(`✓ ${lines.length} ta vazifa qo'shildi`);
    }

    setInput(""); setSuggestion(""); setNote(""); setTags([]);
    setSelectedUser(null); setEmailInput("");
    setSelectedTeam(null);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); }
    if (e.key === "Tab" && suggestion) { e.preventDefault(); setInput(suggestion); setSuggestion(""); }
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  // ── BULK ──
  const toggleSel  = id => setSelected(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const bulkDelete = () => { selected.forEach(id => deleteTask(id)); setSelected(new Set()); setBulkMode(false); };
  const bulkDone   = () => {
    selected.forEach(id => { const t=tasks.find(t=>t.id===id); if(t&&!t.completed) toggleTask(id); });
    setSelected(new Set()); setBulkMode(false);
  };

  // ── FILTER ──
  const filtered = tasks
    .filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
    .filter(t => {
      if (filter==="done")   return t.completed;
      if (filter==="active") return !t.completed;
      if (filter==="high")   return t.priority==="high";
      if (filter==="today")  return t.date===new Date().toISOString().split("T")[0];
      if (filter==="team")   return t.direction==="team";
      return true;
    })
    .sort((a,b) => {
      if (sortBy==="priority") {
        const o={high:0,medium:1,low:2};
        return (o[a.priority]??3)-(o[b.priority]??3);
      }
      if (sortBy==="alpha") return a.title?.localeCompare(b.title);
      return (a.date||"z").localeCompare(b.date||"z");
    });

  const grouped  = {};
  filtered.forEach(t => { const d=t.date||"Sanasiz"; if(!grouped[d]) grouped[d]=[]; grouped[d].push(t); });
  const sortedDates = Object.keys(grouped).sort();

  const formReady = date && priority && category;
  const todayStr  = new Date().toISOString().split("T")[0];

  return (
    <div style={{ minHeight:"100vh", background:"#f8f7f4",
      fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif", color:"#1a1a1a" }}>
     <div style={{
  padding: "28px 32px",
  marginLeft: "260px"   // sidebar width
}}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          marginBottom:24, gap:12, flexWrap:"wrap" }}>
          <div>
            <h1 style={{ fontSize:30, fontWeight:900, letterSpacing:"-0.03em", margin:0 }}>Vazifalar</h1>
            <p style={{ color:"#9ca3af", fontSize:13, margin:"4px 0 0" }}>
              {new Date().toLocaleDateString("uz-UZ",{weekday:"short",day:"numeric",month:"short"})}
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {canUndo && (
              <button onClick={undo} style={{
                padding:"8px 14px", borderRadius:10, border:"1px solid rgba(0,0,0,0.1)",
                background:"#fff", cursor:"pointer", fontSize:13, fontWeight:600,
                color:"#6b7280", fontFamily:"inherit",
              }}>↩ Orqaga</button>
            )}
            <button onClick={() => { setBulkMode(v=>!v); setSelected(new Set()); }} style={{
              padding:"8px 14px", borderRadius:10, border:"none", cursor:"pointer",
              fontFamily:"inherit", fontSize:13, fontWeight:600,
              background: bulkMode?"#1a1a1a":"#f3f4f6",
              color:      bulkMode?"#fff":"#6b7280",
            }}>
              {bulkMode?"✕ Bekor":"⊡ Ko'p tanlash"}
            </button>
            {[{v:"grouped",i:"▤"},{v:"list",i:"≡"}].map(m=>(
              <button key={m.v} onClick={()=>setViewMode(m.v)} style={{
                width:36, height:36, borderRadius:9, border:"none", cursor:"pointer",
                background: viewMode===m.v?"#1a1a1a":"#f3f4f6",
                color:      viewMode===m.v?"#fff":"#9ca3af", fontSize:16,
              }}>{m.i}</button>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          <StatCard label="Jami vazifa"   value={stats.total}        icon="📋" color="#6366f1"/>
          <StatCard label="Bajarilgan"     value={stats.done}         icon="✅" color="#22c55e"/>
          <StatCard label="Bugun"          value={stats.today}        icon="📅" color="#0ea5e9"/>
          <StatCard label="Shoshilinch"    value={stats.highPriority} icon="🔥" color="#ef4444"/>
          {/* Progress ring */}
          <div style={{
            background:"#fff", border:"1px solid rgba(0,0,0,0.07)",
            borderRadius:16, padding:"16px 18px",
            display:"flex", flexDirection:"column", alignItems:"center", gap:4, flex:1, minWidth:90,
          }}>
            <div style={{ position:"relative" }}>
              <Ring pct={stats.percent}/>
              <span style={{
                position:"absolute", inset:0, display:"flex",
                alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:800, color:"#1a1a1a",
              }}>{stats.percent}%</span>
            </div>
            <span style={{ fontSize:10, color:"#9ca3af", fontWeight:600 }}>Jarayon</span>
          </div>
        </div>

        {/* ── SEARCH + FILTER ── */}
        <div style={{
          ...card, marginBottom:14, padding:"12px 14px",
          display:"flex", gap:10, alignItems:"center", flexWrap:"wrap",
        }}>
          <div style={{ flex:1, minWidth:180, position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              color:"#9ca3af", fontSize:14 }}>⌕</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Vazifa qidirish…"
              style={{ ...inputSt, paddingLeft:34 }}
            />
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {[
              {v:"all",    l:"Hammasi"},
              {v:"active", l:"Faol"},
              {v:"done",   l:"Bajarilgan"},
              {v:"today",  l:"Bugun"},
              {v:"high",   l:"🔥 Shoshilinch"},
              {v:"team",   l:"👥 Jamoa"},
            ].map(f=>(
              <button key={f.v} onClick={()=>setFilter(f.v)} style={pill(filter===f.v)}>
                {f.l}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{
            ...inputSt, width:"auto", padding:"8px 12px", cursor:"pointer",
          }}>
            <option value="date">Sana bo'yicha</option>
            <option value="priority">Muhimlik bo'yicha</option>
            <option value="alpha">Alifbo bo'yicha</option>
          </select>
        </div>

        {/* ── BULK ACTION BAR ── */}
        {bulkMode && selected.size > 0 && (
          <div style={{
            background:"#1a1a1a", color:"#fff", borderRadius:14,
            padding:"11px 18px", marginBottom:12,
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <span style={{ fontSize:13, fontWeight:600 }}>{selected.size} ta tanlandi</span>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={bulkDone} style={{
                padding:"7px 16px", borderRadius:9, border:"none", cursor:"pointer",
                background:"#22c55e", color:"#fff", fontFamily:"inherit", fontWeight:600, fontSize:13,
              }}>✓ Bajarildi</button>
              <button onClick={bulkDelete} style={{
                padding:"7px 16px", borderRadius:9, border:"none", cursor:"pointer",
                background:"#ef4444", color:"#fff", fontFamily:"inherit", fontWeight:600, fontSize:13,
              }}>✕ O'chirish</button>
            </div>
          </div>
        )}

        {/* ── ADD FORM ── */}
        <div style={{ ...card, marginBottom:18 }}>
          {/* Header */}
          <button onClick={()=>setShowForm(v=>!v)} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
            border:"none", background:"transparent", cursor:"pointer", padding:0, fontFamily:"inherit",
            marginBottom: showForm ? 22 : 0,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:32, height:32, borderRadius:8, background:"#1a1a1a",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, color:"#fff",
              }}>+</div>
              <span style={{ fontSize:15, fontWeight:700 }}>Yangi vazifa qo'shish</span>
            </div>
            <span style={{
              fontSize:18, color:"#9ca3af",
              transform: showForm?"rotate(180deg)":"rotate(0deg)",
              transition:"transform 0.25s", display:"inline-block",
            }}>⌄</span>
          </button>

          {showForm && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

              {/* Row 1: Date + Assign */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div>
                  <label style={labelSt}>📅 Muddat</label>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputSt}/>
                </div>

                {/* Assign section */}
                <AssignSection
                  assignMode={assignMode}   setAssignMode={setAssignMode}
                  emailInput={emailInput}   setEmailInput={setEmailInput}
                  selectedUser={selectedUser} setSelectedUser={setSelectedUser}
                  selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam}
                />
              </div>

              {/* Priority */}
              <div>
                <label style={labelSt}>⚡ Muhimlik darajasi</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {PRIORITIES.map(p => (
                    <button key={p.value} onClick={()=>setPriority(p.value)} style={{
                      padding:"11px", borderRadius:12, cursor:"pointer",
                      border:`1.5px solid ${priority===p.value ? p.color : "rgba(0,0,0,0.08)"}`,
                      background: priority===p.value ? p.bg : "#fafafa",
                      fontFamily:"inherit", transition:"all 0.15s",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                    }}>
                      <span style={{ color:p.color, fontSize:16 }}>●</span>
                      <span style={{ fontSize:12, fontWeight:700, color:priority===p.value?p.color:"#374151" }}>
                        {p.label}
                      </span>
                      <span style={{ fontSize:10, color:"#9ca3af" }}>{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label style={labelSt}>📂 Vazifa turi</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={()=>setCategory(c.value)} style={{
                      padding:"8px 16px", borderRadius:10, cursor:"pointer",
                      border:`1.5px solid ${category===c.value ? c.color : "rgba(0,0,0,0.08)"}`,
                      background: category===c.value ? c.color+"12" : "#fafafa",
                      fontSize:13, fontWeight:600, fontFamily:"inherit",
                      color: category===c.value ? c.color : "#6b7280",
                      transition:"all 0.15s",
                      display:"flex", alignItems:"center", gap:6,
                    }}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={labelSt}>🏷 Teglar (ixtiyoriy)</label>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <input value={tagInput} onChange={e=>setTagInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter"||e.key===","){e.preventDefault();addTag();} }}
                    placeholder="#teg qo'shish…" style={{ ...inputSt, flex:1 }}/>
                  <button onClick={addTag} style={{
                    padding:"0 16px", borderRadius:10, border:"1px solid rgba(0,0,0,0.1)",
                    background:"#f3f4f6", color:"#374151", cursor:"pointer",
                    fontFamily:"inherit", fontWeight:600,
                  }}>Qo'sh</button>
                </div>
                {tags.length > 0 && (
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {tags.map(t=>(
                      <span key={t} style={{
                        padding:"3px 10px", borderRadius:999, fontSize:12, fontWeight:600,
                        background:"#f3f4f6", color:"#374151",
                        display:"flex", alignItems:"center", gap:5,
                      }}>
                        #{t}
                        <button onClick={()=>setTags(prev=>prev.filter(x=>x!==t))} style={{
                          border:"none", background:"transparent", cursor:"pointer",
                          color:"#9ca3af", fontSize:13, padding:0, lineHeight:1,
                        }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Textarea — faqat asosiy tanlov tugagach */}
              {formReady && (
                <>
                  <div>
                    <label style={labelSt}>✍️ Vazifa matni</label>
                    <div style={{ position:"relative" }}>
                      <textarea value={input} onChange={e=>setInput(e.target.value)}
                        onKeyDown={handleKeyDown} rows={3}
                        placeholder="Har bir qator alohida vazifa sifatida qo'shiladi…"
                        style={{ ...inputSt, resize:"vertical", lineHeight:1.6 }}/>
                      {suggestion && (
                        <div style={{ position:"absolute", bottom:-24, left:0,
                          fontSize:11, color:"#9ca3af", display:"flex", alignItems:"center", gap:5 }}>
                          <span>🤖</span><span>{suggestion}</span>
                          <span style={{ color:"#c7d2fe", fontWeight:700 }}>Tab →</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: suggestion ? 10 : 0 }}>
                    <label style={labelSt}>📝 Qo'shimcha izoh (ixtiyoriy)</label>
                    <input value={note} onChange={e=>setNote(e.target.value)}
                      placeholder="Qisqa izoh yoki havola…" style={inputSt}/>
                  </div>

                  {/* Assign summary before submit */}
                  {(selectedTeam || selectedUser) && (
                    <div style={{
                      padding:"10px 14px", borderRadius:10, fontSize:12, fontWeight:600,
                      background: selectedTeam ? "#f0fdf4" : "#f5f3ff",
                      border: `1px solid ${selectedTeam ? "#bbf7d0" : "#e0e7ff"}`,
                      color: selectedTeam ? "#16a34a" : "#6366f1",
                      display:"flex", alignItems:"center", gap:6,
                    }}>
                      {selectedTeam
                        ? `👥 "${selectedTeam.name}" jamoasiga (${selectedTeam.members?.length||0} a'zo)`
                        : `👤 ${selectedUser.displayName || selectedUser.email}`
                      }
                    </div>
                  )}

                  <button onClick={handleAdd} disabled={!input.trim()} style={{
                    padding:"13px", borderRadius:14, border:"none", cursor:"pointer",
                    background: input.trim() ? "#1a1a1a" : "#e5e7eb",
                    color:      input.trim() ? "#fff"    : "#9ca3af",
                    fontSize:15, fontWeight:700, fontFamily:"inherit", width:"100%",
                  }}>
                    {selectedTeam
                      ? `👥 Jamoaga qo'shish`
                      : selectedUser
                        ? `👤 ${selectedUser.displayName||selectedUser.email?.split("@")[0]} ga topshirish`
                        : "✓ Vazifa qo'shish"
                    }
                  </button>
                </>
              )}

              {!formReady && (
                <div style={{
                  background:"#fafafa", border:"1px dashed rgba(0,0,0,0.1)",
                  borderRadius:12, padding:"14px", textAlign:"center",
                  color:"#9ca3af", fontSize:13,
                }}>
                  Davom etish uchun muddat, muhimlik va turni tanlang
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── TASK LIST ── */}
        {filtered.length === 0 ? (
          <div style={{ ...card, textAlign:"center", padding:"60px 20px", color:"#9ca3af" }}>
            <div style={{ fontSize:38, marginBottom:10 }}>📭</div>
            <p style={{ fontSize:15, fontWeight:600, color:"#6b7280", marginBottom:5 }}>
              Vazifalar topilmadi
            </p>
            <p style={{ fontSize:13 }}>Filter yoki qidiruv sozlamalarini o'zgartiring</p>
          </div>
        ) : viewMode === "grouped" ? (
          sortedDates.map(d => (
            <div key={d} style={{ marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <span style={{
                  fontSize:11, fontWeight:700, color:"#6b7280",
                  textTransform:"uppercase", letterSpacing:"0.08em",
                }}>
                  {d===todayStr?"📅 Bugun":d==="Sanasiz"?"📌 Sanasiz":`📅 ${d}`}
                </span>
                <div style={{ flex:1, height:1, background:"rgba(0,0,0,0.06)" }}/>
                <span style={{
                  fontSize:10, color:"#9ca3af", fontWeight:600,
                  background:"#f3f4f6", borderRadius:999, padding:"2px 8px",
                }}>{grouped[d].length}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {grouped[d].map(t => (
                  <div key={t.id} style={{ display:"flex", alignItems:"stretch" }}>
                    {bulkMode && (
                      <div onClick={()=>toggleSel(t.id)} style={{
                        width:38, display:"flex", alignItems:"center", justifyContent:"center",
                        background: selected.has(t.id)?"#1a1a1a":"#f3f4f6",
                        borderRadius:"12px 0 0 12px", cursor:"pointer", flexShrink:0,
                        borderRight:"1px solid rgba(0,0,0,0.06)", transition:"background 0.15s",
                      }}>
                        <span style={{ fontSize:14, color:selected.has(t.id)?"#fff":"#9ca3af" }}>
                          {selected.has(t.id)?"✓":"○"}
                        </span>
                      </div>
                    )}
                    <div style={{ flex:1 }}>
                      <TaskCard task={t} onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // List view
          <div style={card}>
            {filtered.map((t, idx) => (
              <div key={t.id} style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"11px 0",
                borderBottom: idx<filtered.length-1?"1px solid rgba(0,0,0,0.05)":"none",
              }}>
                {bulkMode && (
                  <div onClick={()=>toggleSel(t.id)} style={{
                    width:18, height:18, borderRadius:5, cursor:"pointer", flexShrink:0,
                    border:`2px solid ${selected.has(t.id)?"#1a1a1a":"#d1d5db"}`,
                    background:selected.has(t.id)?"#1a1a1a":"transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {selected.has(t.id)&&<span style={{color:"#fff",fontSize:10}}>✓</span>}
                  </div>
                )}
                <div onClick={()=>toggleTask(t.id)} style={{
                  width:18, height:18, borderRadius:5, cursor:"pointer", flexShrink:0,
                  border:`2px solid ${t.completed?"#22c55e":"#d1d5db"}`,
                  background:t.completed?"#22c55e":"transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {t.completed&&<span style={{color:"#fff",fontSize:10}}>✓</span>}
                </div>
                <span style={{
                  flex:1, fontSize:13, fontWeight:600,
                  color:t.completed?"#9ca3af":"#1a1a1a",
                  textDecoration:t.completed?"line-through":"none",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>{t.title}</span>
                {t.teamName && (
                  <span style={{
                    fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:999,
                    background:"#f0fdf4", color:"#16a34a", flexShrink:0,
                  }}>👥 {t.teamName}</span>
                )}
                <button onClick={()=>deleteTask(t.id)} style={{
                  border:"none", background:"transparent", cursor:"pointer",
                  color:"#d1d5db", fontSize:16, padding:"0 4px", flexShrink:0,
                  transition:"color 0.1s",
                }}
                onMouseEnter={e=>e.target.style.color="#ef4444"}
                onMouseLeave={e=>e.target.style.color="#d1d5db"}
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }
        input[type=date]::-webkit-calendar-picker-indicator { opacity:0.5; cursor:pointer; }
      `}</style>
    </div>
  );
}
