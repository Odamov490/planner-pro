import { useState, useContext, useEffect, useRef } from "react";
import { TaskContext } from "../context/TaskContext";
import TaskCard from "../components/TaskCard";
import { notify } from "../utils/notify";
import { getSuggestion } from "../utils/ai";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// ─── PRIORITY CONFIG ──────────────────────────────────────────
const PRIORITIES = [
  { value:"high",   label:"Yuqori",  icon:"●", color:"#ef4444", bg:"rgba(239,68,68,0.08)",   border:"rgba(239,68,68,0.3)",   desc:"Shoshilinch" },
  { value:"medium", label:"O'rta",   icon:"●", color:"#f59e0b", bg:"rgba(245,158,11,0.08)",  border:"rgba(245,158,11,0.3)",  desc:"Oddiy" },
  { value:"low",    label:"Past",    icon:"●", color:"#22c55e", bg:"rgba(34,197,94,0.08)",   border:"rgba(34,197,94,0.3)",   desc:"Keyin" },
];

// ─── CATEGORY CONFIG ──────────────────────────────────────────
const CATEGORIES = [
  { value:"Ish",     label:"Ish",     icon:"💼", color:"#6366f1" },
  { value:"O'qish",  label:"O'qish",  icon:"📚", color:"#0ea5e9" },
  { value:"Shaxsiy", label:"Shaxsiy", icon:"🏠", color:"#14b8a6" },
  { value:"Moliya",  label:"Moliya",  icon:"💰", color:"#f59e0b" },
  { value:"Sport",   label:"Sport",   icon:"⚡", color:"#f97316" },
];

// ─── INLINE STYLES ────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "#f8f7f4",
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    color: "#1a1a1a",
  },
  inner: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "32px 20px 80px",
  },
  card: {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: 20,
    padding: "28px 28px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    fontSize: 14,
    outline: "none",
    background: "#fafafa",
    color: "#1a1a1a",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 8,
    display: "block",
  },
  btn: {
    padding: "11px 20px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
};

// ─── STAT CARD ────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.07)",
    borderRadius: 16,
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
    minWidth: 0,
  }}>
    <span style={{ fontSize: 22 }}>{icon}</span>
    <span style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
  </div>
);

// ─── PRIORITY BADGE ───────────────────────────────────────────
const PriorityBadge = ({ value }) => {
  const p = PRIORITIES.find(p => p.value === value);
  if (!p) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: p.bg, color: p.color, border: `1px solid ${p.border}`,
    }}>
      <span style={{ fontSize: 7 }}>{p.icon}</span>{p.label}
    </span>
  );
};

// ─── CATEGORY BADGE ───────────────────────────────────────────
const CategoryBadge = ({ value }) => {
  const c = CATEGORIES.find(c => c.value === value);
  if (!c) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: c.color + "15", color: c.color,
    }}>
      {c.icon} {c.label}
    </span>
  );
};

// ─── PROGRESS RING ────────────────────────────────────────────
const ProgressRing = ({ percent, size = 56, stroke = 5 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a1a" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }}/>
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask, editTask } = useContext(TaskContext);

  // ── Form state ──
  const [input, setInput]           = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [date, setDate]             = useState("");
  const [priority, setPriority]     = useState("");
  const [category, setCategory]     = useState("");
  const [tags, setTags]             = useState([]);   // NEW: custom tags
  const [tagInput, setTagInput]     = useState("");
  const [note, setNote]             = useState("");   // NEW: optional note

  // ── UI state ──
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("all");
  const [sortBy, setSortBy]         = useState("date"); // NEW: sort
  const [viewMode, setViewMode]     = useState("grouped"); // NEW: grouped | list
  const [showForm, setShowForm]     = useState(true);

  // ── Users ──
  const [users, setUsers]           = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUsers, setShowUsers]   = useState(false);
  const userDropRef                 = useRef(null);

  // ── Bulk select ──  NEW
  const [selected, setSelected]     = useState(new Set());
  const [bulkMode, setBulkMode]     = useState(false);

  // ── Drag for reorder ──  NEW
  const dragItem = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (userDropRef.current && !userDropRef.current.contains(e.target))
        setShowUsers(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Firebase users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snap => {
      setUsers(snap.docs.map(d => d.data()));
    });
    return () => unsub();
  }, []);

  // AI suggestion
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
    const lines = input.split("\n").map(l => l.trim()).filter(l => l);
    await Promise.all(lines.map(line =>
      addTask(line, date, priority, category, selectedUser?.uid, selectedUser?.email, note, tags)
    ));
    notify(`${lines.length} ta vazifa qo'shildi ✓`);
    setInput(""); setSuggestion(""); setSelectedUser(null);
    setEmailInput(""); setNote(""); setTags([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); }
    if (e.key === "Tab" && suggestion) { e.preventDefault(); setInput(suggestion); setSuggestion(""); }
  };

  // ── TAG ──
  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  // ── BULK ──
  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const bulkDelete  = () => { selected.forEach(id => deleteTask(id)); setSelected(new Set()); setBulkMode(false); };
  const bulkDone    = () => { selected.forEach(id => { const t = tasks.find(t=>t.id===id); if(t&&!t.completed) toggleTask(id); }); setSelected(new Set()); setBulkMode(false); };

  // ── FILTER + SORT ──
  const filtered = tasks
    .filter(t => t.title?.toLowerCase().includes(search.toLowerCase()))
    .filter(t => {
      if (filter === "done")   return t.completed;
      if (filter === "active") return !t.completed;
      if (filter === "high")   return t.priority === "high";
      if (filter === "today")  return t.date === new Date().toISOString().split("T")[0];
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const order = { high:0, medium:1, low:2 };
        return (order[a.priority]??3) - (order[b.priority]??3);
      }
      if (sortBy === "alpha") return a.title?.localeCompare(b.title);
      return (a.date||"z").localeCompare(b.date||"z");
    });

  // ── GROUP ──
  const grouped = {};
  filtered.forEach(t => {
    const d = t.date || "Sanasiz";
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(t);
  });
  const sortedDates = Object.keys(grouped).sort();

  // ── STATS ──
  const done     = tasks.filter(t => t.completed).length;
  const total    = tasks.length;
  const percent  = total ? Math.round((done / total) * 100) : 0;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCnt = tasks.filter(t => t.date === todayStr && !t.completed).length;
  const highCnt  = tasks.filter(t => t.priority === "high" && !t.completed).length;

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(emailInput.toLowerCase())
  );

  // ── FORM VALID ──
  const formReady = date && priority && category;

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, gap:16 }}>
          <div>
            <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.03em", margin:0, lineHeight:1 }}>
              Vazifalar
            </h1>
            <p style={{ color:"#9ca3af", fontSize:14, marginTop:6 }}>
              {new Date().toLocaleDateString("uz-UZ", { weekday:"long", day:"numeric", month:"long" })}
            </p>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            {/* Bulk mode toggle */}
            <button
              onClick={() => { setBulkMode(v=>!v); setSelected(new Set()); }}
              style={{
                ...S.btn,
                background: bulkMode ? "#1a1a1a" : "#f3f4f6",
                color: bulkMode ? "#fff" : "#6b7280",
                padding: "10px 14px",
              }}
            >
              {bulkMode ? "✕ Bekor" : "⊡ Ko'p tanlash"}
            </button>

            {/* View toggle */}
            <div style={{ display:"flex", background:"#f3f4f6", borderRadius:10, padding:3, gap:2 }}>
              {[
                { v:"grouped", icon:"▤" },
                { v:"list",    icon:"≡" },
              ].map(m => (
                <button key={m.v} onClick={() => setViewMode(m.v)} style={{
                  padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer",
                  fontFamily:"inherit", fontSize:15,
                  background: viewMode===m.v ? "#fff" : "transparent",
                  color:      viewMode===m.v ? "#1a1a1a" : "#9ca3af",
                  boxShadow:  viewMode===m.v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}>{m.icon}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display:"flex", gap:10, marginBottom:24 }}>
          <StatCard label="Jami vazifa"  value={total}   color="#1a1a1a"   icon="📋"/>
          <StatCard label="Bajarilgan"   value={done}    color="#22c55e"   icon="✅"/>
          <StatCard label="Bugun"        value={todayCnt} color="#0ea5e9" icon="📅"/>
          <StatCard label="Shoshilinch"  value={highCnt} color="#ef4444"   icon="🔥"/>

          {/* Progress ring card */}
          <div style={{
            background:"#fff", border:"1px solid rgba(0,0,0,0.07)",
            borderRadius:16, padding:"18px 20px",
            display:"flex", flexDirection:"column", alignItems:"center", gap:6, flex:1, minWidth:0,
          }}>
            <div style={{ position:"relative" }}>
              <ProgressRing percent={percent}/>
              <span style={{
                position:"absolute", inset:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:700, color:"#1a1a1a",
              }}>{percent}%</span>
            </div>
            <span style={{ fontSize:11, color:"#9ca3af", fontWeight:500 }}>Jarayon</span>
          </div>
        </div>

        {/* ── SEARCH + FILTER BAR ── */}
        <div style={{
          background:"#fff", border:"1px solid rgba(0,0,0,0.07)",
          borderRadius:16, padding:"14px 16px", marginBottom:16,
          display:"flex", gap:10, alignItems:"center", flexWrap:"wrap",
        }}>
          {/* Search */}
          <div style={{ flex:1, minWidth:180, position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", fontSize:14 }}>⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Vazifa qidirish..."
              style={{ ...S.input, paddingLeft:34, padding:"10px 12px 10px 34px" }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {[
              { v:"all",    l:"Hammasi" },
              { v:"active", l:"Faol" },
              { v:"done",   l:"Bajarilgan" },
              { v:"today",  l:"Bugun" },
              { v:"high",   l:"🔥 Shoshilinch" },
            ].map(f => (
              <button key={f.v} onClick={() => setFilter(f.v)} style={{
                ...S.btn,
                padding:"7px 14px", fontSize:13,
                background: filter===f.v ? "#1a1a1a" : "#f3f4f6",
                color:      filter===f.v ? "#fff"    : "#6b7280",
              }}>{f.l}</button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ ...S.input, width:"auto", padding:"8px 12px", cursor:"pointer" }}
          >
            <option value="date">Sana bo'yicha</option>
            <option value="priority">Muhimlik bo'yicha</option>
            <option value="alpha">Alifbo bo'yicha</option>
          </select>
        </div>

        {/* ── BULK ACTIONS ── */}
        {bulkMode && selected.size > 0 && (
          <div style={{
            background:"#1a1a1a", color:"#fff", borderRadius:14,
            padding:"12px 20px", marginBottom:14,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            animation:"slideDown 0.2s ease",
          }}>
            <span style={{ fontSize:14, fontWeight:600 }}>{selected.size} ta tanlandi</span>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={bulkDone} style={{
                ...S.btn, background:"#22c55e", color:"#fff", padding:"7px 16px",
              }}>✓ Bajarildi</button>
              <button onClick={bulkDelete} style={{
                ...S.btn, background:"#ef4444", color:"#fff", padding:"7px 16px",
              }}>✕ O'chirish</button>
            </div>
          </div>
        )}

        {/* ── ADD FORM ── */}
        <div style={{ ...S.card, marginBottom:20 }}>

          {/* Form header — collapsible */}
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
              border:"none", background:"transparent", cursor:"pointer", padding:0, fontFamily:"inherit",
              marginBottom: showForm ? 24 : 0,
            }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:32, height:32, borderRadius:8, background:"#1a1a1a",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:16, color:"#fff",
              }}>+</div>
              <span style={{ fontSize:16, fontWeight:700, color:"#1a1a1a" }}>Yangi vazifa qo'shish</span>
            </div>
            <span style={{
              fontSize:18, color:"#9ca3af",
              transform: showForm ? "rotate(180deg)" : "rotate(0deg)",
              transition:"transform 0.25s",
              display:"inline-block",
            }}>⌄</span>
          </button>

          {showForm && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* Row 1: Date + Assignee */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

                <div>
                  <label style={S.label}>📅 Muddat</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={S.input}
                  />
                </div>

                {/* Assignee */}
                <div ref={userDropRef} style={{ position:"relative" }}>
                  <label style={S.label}>👤 Topshiriq berish</label>
                  <div style={{ display:"flex", gap:6 }}>
                    <input
                      value={emailInput}
                      onChange={e => { setEmailInput(e.target.value); setSelectedUser(null); setShowUsers(true); }}
                      onFocus={() => setShowUsers(true)}
                      placeholder="Email yoki ism..."
                      style={{ ...S.input, flex:1 }}
                    />
                  </div>
                  {showUsers && filteredUsers.length > 0 && (
                    <div style={{
                      position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:50,
                      background:"#fff", border:"1px solid rgba(0,0,0,0.1)",
                      borderRadius:12, boxShadow:"0 8px 24px rgba(0,0,0,0.1)",
                      maxHeight:160, overflowY:"auto",
                    }}>
                      {filteredUsers.map(u => (
                        <div key={u.uid} onClick={() => { setSelectedUser(u); setEmailInput(u.email); setShowUsers(false); }}
                          style={{
                            padding:"10px 14px", cursor:"pointer", fontSize:13,
                            display:"flex", alignItems:"center", gap:10,
                            borderBottom:"1px solid #f3f4f6",
                            transition:"background 0.1s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background="#f9fafb"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}
                        >
                          <div style={{
                            width:28, height:28, borderRadius:"50%",
                            background:"#f3f4f6", display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:11, fontWeight:700, color:"#6b7280",
                          }}>
                            {u.email?.[0]?.toUpperCase()}
                          </div>
                          <span style={{ color:"#374151" }}>{u.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <div style={{
                      display:"flex", alignItems:"center", gap:6,
                      marginTop:6, fontSize:12, color:"#22c55e", fontWeight:600,
                    }}>
                      <span>✓</span> {selectedUser.email}
                      <button onClick={() => { setSelectedUser(null); setEmailInput(""); }}
                        style={{ border:"none", background:"transparent", cursor:"pointer", color:"#9ca3af", fontSize:14, marginLeft:2 }}>×</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Priority */}
              <div>
                <label style={S.label}>⚡ Muhimlik darajasi</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {PRIORITIES.map(p => (
                    <button key={p.value} onClick={() => setPriority(p.value)} style={{
                      padding:"12px", borderRadius:12, cursor:"pointer",
                      border:`1.5px solid ${priority===p.value ? p.color : "rgba(0,0,0,0.08)"}`,
                      background: priority===p.value ? p.bg : "#fafafa",
                      fontFamily:"inherit", transition:"all 0.15s",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                    }}>
                      <span style={{ color:p.color, fontSize:18 }}>●</span>
                      <span style={{ fontSize:13, fontWeight:600, color: priority===p.value ? p.color : "#374151" }}>{p.label}</span>
                      <span style={{ fontSize:11, color:"#9ca3af" }}>{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Category */}
              <div>
                <label style={S.label}>📂 Vazifa turi</label>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setCategory(c.value)} style={{
                      padding:"9px 16px", borderRadius:10, cursor:"pointer",
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

              {/* Row 4: Tags (NEW) */}
              <div>
                <label style={S.label}>🏷 Teglar (ixtiyoriy)</label>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if(e.key==="Enter"||e.key===","){ e.preventDefault(); addTag(); } }}
                    placeholder="#teg qo'shish..."
                    style={{ ...S.input, flex:1 }}
                  />
                  <button onClick={addTag} style={{ ...S.btn, background:"#f3f4f6", color:"#374151" }}>Qo'sh</button>
                </div>
                {tags.length > 0 && (
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {tags.map(t => (
                      <span key={t} style={{
                        padding:"3px 10px", borderRadius:999, fontSize:12, fontWeight:600,
                        background:"#f3f4f6", color:"#374151", display:"flex", alignItems:"center", gap:6,
                      }}>
                        #{t}
                        <button onClick={() => setTags(prev=>prev.filter(x=>x!==t))}
                          style={{ border:"none", background:"transparent", cursor:"pointer", color:"#9ca3af", fontSize:13, padding:0 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 5: Textarea + Note — visible when form is valid */}
              {formReady && (
                <>
                  <div>
                    <label style={S.label}>✍️ Vazifa matni</label>
                    <div style={{ position:"relative" }}>
                      <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                        placeholder="Har bir qator alohida vazifa sifatida qo'shiladi..."
                        style={{
                          ...S.input,
                          resize:"vertical", lineHeight:1.6,
                          paddingTop:12, paddingBottom:12,
                        }}
                      />
                      {suggestion && (
                        <div style={{
                          position:"absolute", bottom:-28, left:0,
                          fontSize:12, color:"#9ca3af",
                          display:"flex", alignItems:"center", gap:6,
                        }}>
                          <span>🤖</span>
                          <span>{suggestion}</span>
                          <span style={{ color:"#c7d2fe", fontWeight:600 }}>Tab →</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional note */}
                  <div style={{ marginTop: suggestion ? 12 : 0 }}>
                    <label style={S.label}>📝 Qo'shimcha izoh (ixtiyoriy)</label>
                    <input
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Qisqa izoh yoki havolа..."
                      style={S.input}
                    />
                  </div>

                  <button
                    onClick={handleAdd}
                    disabled={!input.trim()}
                    style={{
                      ...S.btn,
                      background: input.trim() ? "#1a1a1a" : "#e5e7eb",
                      color:      input.trim() ? "#fff"    : "#9ca3af",
                      padding:"14px",
                      fontSize:15, width:"100%",
                      letterSpacing:"-0.01em",
                    }}
                  >
                    Vazifa qo'shish
                  </button>
                </>
              )}

              {!formReady && (
                <div style={{
                  background:"#fafafa", border:"1px dashed rgba(0,0,0,0.1)",
                  borderRadius:12, padding:"16px", textAlign:"center",
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
          <div style={{
            ...S.card, textAlign:"center", padding:"60px 20px",
            color:"#9ca3af",
          }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <p style={{ fontSize:16, fontWeight:600, color:"#6b7280", marginBottom:6 }}>Vazifalar topilmadi</p>
            <p style={{ fontSize:13 }}>Filter yoki qidiruv sozlamalarini o'zgartiring</p>
          </div>
        ) : viewMode === "grouped" ? (
          sortedDates.map(d => (
            <div key={d} style={{ marginBottom:16 }}>
              {/* Date header */}
              <div style={{
                display:"flex", alignItems:"center", gap:12, marginBottom:8,
              }}>
                <span style={{
                  fontSize:12, fontWeight:700, color:"#6b7280",
                  textTransform:"uppercase", letterSpacing:"0.08em",
                }}>
                  {d === todayStr ? "📅 Bugun" : d === "Sanasiz" ? "📌 Sanasiz" : `📅 ${d}`}
                </span>
                <div style={{ flex:1, height:1, background:"rgba(0,0,0,0.06)" }}/>
                <span style={{
                  fontSize:11, color:"#9ca3af", fontWeight:600,
                  background:"#f3f4f6", borderRadius:999, padding:"2px 8px",
                }}>{grouped[d].length}</span>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {grouped[d].map(t => (
                  <div key={t.id} style={{ position:"relative", display:"flex", alignItems:"stretch", gap:0 }}>
                    {/* Bulk checkbox */}
                    {bulkMode && (
                      <div
                        onClick={() => toggleSelect(t.id)}
                        style={{
                          width:40, display:"flex", alignItems:"center", justifyContent:"center",
                          background: selected.has(t.id) ? "#1a1a1a" : "#f3f4f6",
                          borderRadius:"12px 0 0 12px",
                          cursor:"pointer", flexShrink:0,
                          borderRight:"1px solid rgba(0,0,0,0.06)",
                          transition:"background 0.15s",
                        }}
                      >
                        <span style={{ fontSize:16, color: selected.has(t.id) ? "#fff" : "#9ca3af" }}>
                          {selected.has(t.id) ? "✓" : "○"}
                        </span>
                      </div>
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <TaskCard
                        task={t}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onEdit={editTask}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // List view
          <div style={{ ...S.card }}>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {filtered.map((t, idx) => (
                <div key={t.id} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"12px 0",
                  borderBottom: idx < filtered.length-1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}>
                  {bulkMode && (
                    <div onClick={() => toggleSelect(t.id)} style={{
                      width:20, height:20, borderRadius:6, cursor:"pointer",
                      border:`2px solid ${selected.has(t.id)?"#1a1a1a":"#d1d5db"}`,
                      background: selected.has(t.id)?"#1a1a1a":"transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      flexShrink:0,
                    }}>
                      {selected.has(t.id) && <span style={{ color:"#fff", fontSize:12 }}>✓</span>}
                    </div>
                  )}
                  <div
                    onClick={() => toggleTask(t.id)}
                    style={{
                      width:20, height:20, borderRadius:6, cursor:"pointer",
                      border:`2px solid ${t.completed?"#22c55e":"#d1d5db"}`,
                      background: t.completed?"#22c55e":"transparent",
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                    }}
                  >
                    {t.completed && <span style={{ color:"#fff", fontSize:12 }}>✓</span>}
                  </div>
                  <span style={{
                    flex:1, fontSize:14, color: t.completed?"#9ca3af":"#1a1a1a",
                    textDecoration: t.completed?"line-through":"none",
                    minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>{t.title}</span>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    {t.priority && <PriorityBadge value={t.priority}/>}
                    {t.category && <CategoryBadge value={t.category}/>}
                  </div>
                  <button onClick={() => deleteTask(t.id)} style={{
                    border:"none", background:"transparent", cursor:"pointer",
                    color:"#d1d5db", fontSize:16, padding:"0 4px",
                    transition:"color 0.1s",
                  }}
                  onMouseEnter={e=>e.target.style.color="#ef4444"}
                  onMouseLeave={e=>e.target.style.color="#d1d5db"}
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        input[type=date]::-webkit-calendar-picker-indicator { opacity:0.5; cursor:pointer; }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }
      `}</style>
    </div>
  );
}
