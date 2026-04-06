import { useContext, useState, useRef, useEffect, useCallback } from "react";
import { TeamContext } from "../context/TeamContext";
import { auth } from "../firebase";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const TEAM_COLORS = [
  "#6366f1","#0ea5e9","#22c55e","#f59e0b",
  "#ef4444","#ec4899","#8b5cf6","#14b8a6",
];
const TEAM_ICONS = ["👥","🚀","💡","🎯","🔥","⚡","🏆","🌟","🛠","🎨"];

const ROLES = {
  owner:  { label:"Egasi",      color:"#f59e0b", bg:"#fffbeb", icon:"👑" },
  admin:  { label:"Admin",      color:"#6366f1", bg:"#eff6ff", icon:"🛡" },
  member: { label:"A'zo",       color:"#22c55e", bg:"#f0fdf4", icon:"👤" },
  viewer: { label:"Kuzatuvchi", color:"#9ca3af", bg:"#f9fafb", icon:"👁" },
};

// ─── HELPERS ──────────────────────────────────────────────────
const initials = (name) => name?.split("@")[0]?.slice(0,2)?.toUpperCase() || "??";
const fmtDate  = (iso) => iso
  ? new Date(iso).toLocaleDateString("uz-UZ",{day:"2-digit",month:"short",year:"numeric"})
  : "";

// ═══════════════════════════════════════════════════════════════
// MINI COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ─── AVATAR ───────────────────────────────────────────────────
const Avatar = ({ name, avatar, size=36, color="#6366f1" }) => (
  <div style={{
    width:size, height:size, borderRadius:"50%", flexShrink:0,
    background: avatar ? "transparent" : color+"25",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*0.35, fontWeight:800, color,
    border:`2px solid ${color}30`,
    overflow:"hidden",
  }}>
    {avatar
      ? <img src={avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      : initials(name)
    }
  </div>
);

// ─── ROLE BADGE ───────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const r = ROLES[role] || ROLES.member;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      padding:"2px 8px", borderRadius:999,
      background:r.bg, color:r.color,
      fontSize:10, fontWeight:700,
      border:`1px solid ${r.color}30`,
    }}>
      {r.icon} {r.label}
    </span>
  );
};

// ─── TOAST ────────────────────────────────────────────────────
const Toast = ({ msg, type="success", onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position:"fixed", top:24, left:"50%", transform:"translateX(-50%)",
      zIndex:500, padding:"11px 22px", borderRadius:999,
      background: type==="error"?"#fef2f2":"#f0fdf4",
      border:`1px solid ${type==="error"?"#fecaca":"#bbf7d0"}`,
      color: type==="error"?"#dc2626":"#16a34a",
      fontSize:13, fontWeight:600, whiteSpace:"nowrap",
      boxShadow:"0 8px 32px rgba(0,0,0,0.1)",
      animation:"toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {type==="error"?"✕ ":"✓ "}{msg}
    </div>
  );
};

// ─── MODAL SHELL ──────────────────────────────────────────────
const Modal = ({ visible, onClose, title, width=480, children }) => {
  useEffect(() => {
    if (!visible) return;
    const h = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h);
    return () => window.removeEventListener("keydown",h);
  }, [visible, onClose]);

  if (!visible) return null;
  return (
    <div
      onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{
        position:"fixed", inset:0, zIndex:300,
        background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      }}
    >
      <div style={{
        background:"#fff", borderRadius:24, width:"100%", maxWidth:width,
        boxShadow:"0 24px 80px rgba(0,0,0,0.2)",
        animation:"popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        overflow:"hidden",
      }}>
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"20px 24px 16px", borderBottom:"1px solid rgba(0,0,0,0.07)",
        }}>
          <h3 style={{ fontSize:17, fontWeight:800, color:"#1a1a1a", margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:"50%", border:"1px solid rgba(0,0,0,0.1)",
            background:"#f9fafb", cursor:"pointer", fontSize:15, color:"#6b7280",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>×</button>
        </div>
        <div style={{ padding:"20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
};

// ─── INPUT FIELD ──────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ marginBottom:16 }}>
    {label && <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b7280",
      textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{label}</label>}
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props} style={{
    width:"100%", padding:"10px 14px",
    border:"1px solid rgba(0,0,0,0.12)", borderRadius:10,
    fontSize:14, color:"#1a1a1a", background:"#fafafa",
    outline:"none", fontFamily:"inherit", boxSizing:"border-box",
    transition:"border-color 0.15s",
    ...props.style,
  }}
  onFocus={e=>e.target.style.borderColor="#6366f1"}
  onBlur={e=>e.target.style.borderColor="rgba(0,0,0,0.12)"}
  />
);

const Btn = ({ onClick, disabled, children, variant="primary", style:s={} }) => {
  const variants = {
    primary:  { background:"#1a1a1a", color:"#fff",    border:"none" },
    outline:  { background:"transparent", color:"#6b7280", border:"1px solid rgba(0,0,0,0.12)" },
    danger:   { background:"#fef2f2", color:"#ef4444", border:"1px solid #fecaca" },
    success:  { background:"#f0fdf4", color:"#22c55e", border:"1px solid #bbf7d0" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:"10px 18px", borderRadius:10, cursor:disabled?"not-allowed":"pointer",
      fontFamily:"inherit", fontSize:13, fontWeight:600,
      opacity:disabled?0.5:1, transition:"all 0.15s",
      ...v, ...s,
    }}
    onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity="0.85"; }}
    onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; }}
    >{children}</button>
  );
};

// ═══════════════════════════════════════════════════════════════
// CREATE TEAM MODAL
// ═══════════════════════════════════════════════════════════════
const CreateTeamModal = ({ visible, onClose, onCreate }) => {
  const [name,  setName]  = useState("");
  const [desc,  setDesc]  = useState("");
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [icon,  setIcon]  = useState(TEAM_ICONS[0]);
  const [busy,  setBusy]  = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await onCreate({ name, description:desc, color, icon });
    setBusy(false);
    setName(""); setDesc("");
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Yangi jamoa yaratish">
      {/* Icon picker */}
      <Field label="Ikonka">
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {TEAM_ICONS.map(ic=>(
            <button key={ic} onClick={()=>setIcon(ic)} style={{
              width:40, height:40, borderRadius:10, fontSize:20, border:"none",
              background: icon===ic ? color+"20" : "#f3f4f6",
              outline: icon===ic ? `2px solid ${color}` : "none",
              cursor:"pointer", transition:"all 0.15s",
            }}>{ic}</button>
          ))}
        </div>
      </Field>

      <Field label="Jamoa nomi">
        <Input value={name} onChange={e=>setName(e.target.value)}
          placeholder="Masalan: Dizayn bo'limi" onKeyDown={e=>e.key==="Enter"&&submit()}/>
      </Field>

      <Field label="Tavsif (ixtiyoriy)">
        <textarea value={desc} onChange={e=>setDesc(e.target.value)}
          placeholder="Jamoa haqida qisqacha..." rows={2}
          style={{
            width:"100%", padding:"10px 14px", border:"1px solid rgba(0,0,0,0.12)",
            borderRadius:10, fontSize:14, fontFamily:"inherit", resize:"vertical",
            outline:"none", background:"#fafafa", boxSizing:"border-box",
          }}
        />
      </Field>

      {/* Color picker */}
      <Field label="Rang">
        <div style={{ display:"flex", gap:8 }}>
          {TEAM_COLORS.map(c=>(
            <button key={c} onClick={()=>setColor(c)} style={{
              width:28, height:28, borderRadius:"50%", background:c, border:"none",
              outline: color===c ? `3px solid ${c}` : "none",
              outlineOffset:2, cursor:"pointer", transition:"all 0.15s",
            }}/>
          ))}
        </div>
      </Field>

      {/* Preview */}
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
        background:color+"10", borderRadius:12, border:`1px solid ${color}30`, marginBottom:20,
      }}>
        <div style={{
          width:44, height:44, borderRadius:12, background:color+"20",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
        }}>{icon}</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#1a1a1a" }}>{name||"Jamoa nomi"}</div>
          <div style={{ fontSize:12, color:"#9ca3af" }}>{desc||"Tavsif yo'q"}</div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="outline" onClick={onClose}>Bekor</Btn>
        <Btn onClick={submit} disabled={!name.trim()||busy}
          style={{ background:color, border:"none" }}>
          {busy ? "Yaratilmoqda…" : "✓ Yaratish"}
        </Btn>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// TEAM DETAIL MODAL (members, settings)
// ═══════════════════════════════════════════════════════════════
const TeamDetailModal = ({ team, visible, onClose }) => {
  const { addMemberByEmail, removeMember, changeRole, leaveTeam, deleteTeam, renameTeam } = useContext(TeamContext);
  const [tab,       setTab]       = useState("members");
  const [email,     setEmail]     = useState("");
  const [addRole,   setAddRole]   = useState("member");
  const [adding,    setAdding]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [editName,  setEditName]  = useState(team?.name||"");
  const [editDesc,  setEditDesc]  = useState(team?.description||"");
  const [saving,    setSaving]    = useState(false);
  const [pinMsg,    setPinMsg]    = useState(team?.pinnedMsg||"");

  const me = team?.members?.find(m=>m.uid===auth.currentUser?.uid);
  const isOwner = me?.role === "owner";
  const isAdmin = me?.role === "admin" || isOwner;

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  };

  const handleAdd = async () => {
    if (!email.trim()) return;
    setAdding(true);
    const res = await addMemberByEmail(team.id, email.trim(), addRole);
    setAdding(false);
    showToast(res.msg, res.ok?"success":"error");
    if (res.ok) setEmail("");
  };

  const handleSave = async () => {
    setSaving(true);
    await renameTeam(team.id, editName, editDesc);
    setSaving(false);
    showToast("O'zgarishlar saqlandi");
  };

  if (!team) return null;

  const TABS = [
    { id:"members",  label:`👥 A'zolar (${team.members?.length||0})` },
    { id:"settings", label:"⚙️ Sozlamalar" },
  ];

  return (
    <Modal visible={visible} onClose={onClose} title={`${team.icon||"👥"} ${team.name}`} width={560}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:20,
        background:"#f9fafb", borderRadius:10, padding:4 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1, padding:"7px 10px", borderRadius:8, border:"none", cursor:"pointer",
            fontFamily:"inherit", fontSize:12, fontWeight:600,
            background: tab===t.id?"#fff":"transparent",
            color:      tab===t.id?"#1a1a1a":"#9ca3af",
            transition:"all 0.15s",
            boxShadow: tab===t.id?"0 1px 3px rgba(0,0,0,0.08)":"none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div>
          {/* Add member */}
          {isAdmin && (
            <div style={{
              background:"#f9fafb", borderRadius:12, padding:"14px 16px", marginBottom:16,
              border:"1px solid rgba(0,0,0,0.07)",
            }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#6b7280",
                textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
                A'zo qo'shish
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Input value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="email@example.com"
                  onKeyDown={e=>e.key==="Enter"&&handleAdd()}
                  style={{ flex:1 }}
                />
                <select value={addRole} onChange={e=>setAddRole(e.target.value)} style={{
                  padding:"10px 10px", borderRadius:10, border:"1px solid rgba(0,0,0,0.12)",
                  fontSize:13, fontFamily:"inherit", background:"#fafafa", color:"#374151",
                  cursor:"pointer",
                }}>
                  {["member","admin","viewer"].map(r=>(
                    <option key={r} value={r}>{ROLES[r].label}</option>
                  ))}
                </select>
                <Btn onClick={handleAdd} disabled={!email.trim()||adding}
                  style={{ background:team.color||"#6366f1", color:"#fff", border:"none" }}>
                  {adding?"…":"+ Qo'sh"}
                </Btn>
              </div>
            </div>
          )}

          {/* Member list */}
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:340, overflowY:"auto" }}>
            {(team.members||[]).map(m => {
              const isMe = m.uid === auth.currentUser?.uid;
              return (
                <div key={m.uid} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"10px 14px", borderRadius:12,
                  background: isMe ? (team.color||"#6366f1")+"08" : "#f9fafb",
                  border:`1px solid ${isMe?(team.color||"#6366f1")+"20":"rgba(0,0,0,0.06)"}`,
                }}>
                  <Avatar name={m.displayName||m.email} avatar={m.avatar}
                    color={team.color||"#6366f1"} size={38}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#1a1a1a",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {m.displayName || m.email?.split("@")[0]}
                      </span>
                      {isMe && <span style={{ fontSize:10, color:"#9ca3af" }}>(Siz)</span>}
                    </div>
                    <div style={{ fontSize:11, color:"#9ca3af" }}>{m.email}</div>
                    {m.joinedAt && (
                      <div style={{ fontSize:10, color:"#d1d5db" }}>Qo'shilgan: {fmtDate(m.joinedAt)}</div>
                    )}
                  </div>

                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    {/* Role selector (owner only) */}
                    {isOwner && !isMe && m.role !== "owner" ? (
                      <select value={m.role}
                        onChange={e=>changeRole(team.id, m.uid, e.target.value)}
                        style={{
                          padding:"4px 8px", borderRadius:8, fontSize:11, fontWeight:600,
                          border:"1px solid rgba(0,0,0,0.1)", background:"#fff",
                          color:ROLES[m.role]?.color||"#6b7280", cursor:"pointer", fontFamily:"inherit",
                        }}>
                        {Object.entries(ROLES).filter(([r])=>r!=="owner").map(([r,v])=>(
                          <option key={r} value={r}>{v.label}</option>
                        ))}
                      </select>
                    ) : (
                      <RoleBadge role={m.role}/>
                    )}

                    {/* Remove button */}
                    {isAdmin && !isMe && m.role !== "owner" && (
                      <button onClick={()=>removeMember(team.id, m.uid)} style={{
                        width:26, height:26, borderRadius:8, border:"none",
                        background:"#fef2f2", color:"#ef4444", cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,
                      }} title="Olib tashlash">✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leave / Delete */}
          <div style={{ display:"flex", gap:8, marginTop:16, paddingTop:16, borderTop:"1px solid rgba(0,0,0,0.07)" }}>
            {!isOwner && (
              <Btn variant="danger" onClick={()=>{ leaveTeam(team.id); onClose(); }}>
                🚪 Jamoadan chiqish
              </Btn>
            )}
            {isOwner && (
              <Btn variant="danger" onClick={()=>{
                if(window.confirm("Jamoani o'chirishga ishonchingiz komilmi?")) {
                  deleteTeam(team.id); onClose();
                }
              }}>
                🗑 Jamoani o'chirish
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === "settings" && (
        <div>
          {isAdmin ? (
            <>
              <Field label="Jamoa nomi">
                <Input value={editName} onChange={e=>setEditName(e.target.value)}/>
              </Field>
              <Field label="Tavsif">
                <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} rows={3}
                  style={{
                    width:"100%", padding:"10px 14px", border:"1px solid rgba(0,0,0,0.12)",
                    borderRadius:10, fontSize:14, fontFamily:"inherit", resize:"vertical",
                    outline:"none", background:"#fafafa", boxSizing:"border-box",
                  }}
                />
              </Field>
              <Field label="📌 Muhim xabar (pinned)">
                <div style={{ display:"flex", gap:8 }}>
                  <Input value={pinMsg} onChange={e=>setPinMsg(e.target.value)}
                    placeholder="Barcha a'zolarga ko'rinadigan xabar..." style={{ flex:1 }}/>
                  <Btn onClick={async()=>{
                    const { pinMessage } = useContext(TeamContext);
                    await pinMessage(team.id, pinMsg);
                    showToast("Xabar saqlandi");
                  }} style={{ background:team.color||"#6366f1", color:"#fff", border:"none" }}>
                    Saqlash
                  </Btn>
                </div>
              </Field>

              {/* Team info */}
              <div style={{
                background:"#f9fafb", borderRadius:12, padding:"14px",
                border:"1px solid rgba(0,0,0,0.07)", marginBottom:16,
              }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af",
                  textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
                  Jamoa ma'lumotlari
                </div>
                {[
                  { label:"Egasi",    val: team.ownerEmail },
                  { label:"Yaratildi",val: team.createdAt?.toDate
                    ? fmtDate(team.createdAt.toDate().toISOString()) : "" },
                  { label:"A'zolar",  val: `${team.members?.length||0} ta` },
                ].map(r=>(
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between",
                    padding:"5px 0", borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize:12, color:"#9ca3af" }}>{r.label}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{r.val}</span>
                  </div>
                ))}
              </div>

              <Btn onClick={handleSave} disabled={saving}
                style={{ background:team.color||"#6366f1", color:"#fff", border:"none", width:"100%" }}>
                {saving ? "Saqlanmoqda…" : "✓ O'zgarishlarni saqlash"}
              </Btn>
            </>
          ) : (
            <div style={{ textAlign:"center", padding:"32px 0", color:"#9ca3af", fontSize:13 }}>
              Sozlamalarni o'zgartirish uchun admin huquqi kerak
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// TEAM CARD
// ═══════════════════════════════════════════════════════════════
const TeamCard = ({ team, onOpen }) => {
  const me      = team.members?.find(m=>m.uid===auth.currentUser?.uid);
  const color   = team.color || "#6366f1";
  const members = team.members || [];
  const shown   = members.slice(0,4);
  const extra   = members.length - 4;

  return (
    <div
      onClick={() => onOpen(team)}
      style={{
        background:"#fff", borderRadius:20, padding:"20px 22px",
        border:`1px solid ${color}20`,
        boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
        cursor:"pointer", transition:"all 0.2s ease",
        position:"relative", overflow:"hidden",
      }}
      onMouseEnter={e=>{
        e.currentTarget.style.transform="translateY(-2px)";
        e.currentTarget.style.boxShadow=`0 8px 28px ${color}20`;
        e.currentTarget.style.borderColor=`${color}40`;
      }}
      onMouseLeave={e=>{
        e.currentTarget.style.transform="none";
        e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor=`${color}20`;
      }}
    >
      {/* bg decoration */}
      <div style={{
        position:"absolute", right:-20, top:-20,
        width:80, height:80, borderRadius:"50%", background:color+"10",
      }}/>
      <div style={{
        position:"absolute", right:20, top:-10,
        width:50, height:50, borderRadius:"50%", background:color+"08",
      }}/>

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:14, position:"relative" }}>
        <div style={{
          width:48, height:48, borderRadius:14, flexShrink:0,
          background:`${color}20`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
        }}>{team.icon||"👥"}</div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#1a1a1a",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {team.name}
          </div>
          {team.description && (
            <div style={{ fontSize:12, color:"#9ca3af", marginTop:2,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {team.description}
            </div>
          )}
        </div>

        <RoleBadge role={me?.role||"member"}/>
      </div>

      {/* Pinned message */}
      {team.pinnedMsg && (
        <div style={{
          display:"flex", gap:7, alignItems:"flex-start",
          background:color+"0a", borderRadius:10, padding:"8px 10px",
          border:`1px solid ${color}20`, marginBottom:12,
        }}>
          <span style={{ fontSize:12, flexShrink:0 }}>📌</span>
          <span style={{ fontSize:11, color:"#6b7280", lineHeight:1.5 }}>{team.pinnedMsg}</span>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display:"flex", gap:16, marginBottom:14 }}>
        {[
          { icon:"👥", val:members.length, label:"a'zo" },
        ].map(s=>(
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:13 }}>{s.icon}</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{s.val}</span>
            <span style={{ fontSize:11, color:"#9ca3af" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Member avatars */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex" }}>
          {shown.map((m,i)=>(
            <div key={m.uid} style={{ marginLeft: i===0?0:-10, zIndex:shown.length-i }}>
              <Avatar name={m.displayName||m.email} avatar={m.avatar} color={color} size={30}/>
            </div>
          ))}
          {extra > 0 && (
            <div style={{
              width:30, height:30, borderRadius:"50%", marginLeft:-10,
              background:"#f3f4f6", border:"2px solid #fff",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:10, fontWeight:700, color:"#6b7280",
            }}>+{extra}</div>
          )}
        </div>

        <div style={{
          fontSize:11, fontWeight:600, color,
          display:"flex", alignItems:"center", gap:4,
        }}>
          Batafsil →
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Teams() {
  const { teams, loading } = useContext(TeamContext);
  const { createTeam }     = useContext(TeamContext);

  const [search,     setSearch]     = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activeTeam, setActiveTeam] = useState(null);
  const [toast,      setToast]      = useState(null);
  const [sortBy,     setSortBy]     = useState("name"); // name|members|recent

  const showToast = (msg,type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  };

  // Filter + sort
  const filtered = (teams||[])
    .filter(t => t.name?.toLowerCase().includes(search.toLowerCase())
             || t.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (sortBy==="members") return (b.members?.length||0)-(a.members?.length||0);
      if (sortBy==="recent")  return (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0);
      return a.name?.localeCompare(b.name)||0;
    });

  // Stats
  const totalMembers = [...new Set((teams||[]).flatMap(t=>t.memberIds||[]))].length;
  const myTeams      = (teams||[]).length;

  return (
    <div style={{
      minHeight:"100vh", background:"#f8f7f4",
      fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",
    }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      <CreateTeamModal
        visible={showCreate}
        onClose={()=>setShowCreate(false)}
        onCreate={async (data)=>{
          const id = await createTeam(data);
          if (id) showToast(`"${data.name}" jamoasi yaratildi`);
          else showToast("Xatolik yuz berdi","error");
        }}
      />

      {activeTeam && (
        <TeamDetailModal
          team={teams.find(t=>t.id===activeTeam)||activeTeam}
          visible={!!activeTeam}
          onClose={()=>setActiveTeam(null)}
        />
      )}

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 20px 60px" }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom:24 }}>
          <div style={{
            background:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
            borderRadius:24, padding:"28px 32px", color:"#fff",
            position:"relative", overflow:"hidden",
          }}>
            {[{s:180,r:-40,t:-40},{s:120,l:-30,b:-30}].map((c,i)=>(
              <div key={i} style={{
                position:"absolute", width:c.s, height:c.s, borderRadius:"50%",
                background:"#fff", opacity:0.04,
                right:c.r, top:c.t, left:c.l, bottom:c.b,
              }}/>
            ))}
            <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.5)",
                  textTransform:"uppercase", letterSpacing:"0.15em", marginBottom:8 }}>
                  Hamkorlik
                </div>
                <h1 style={{ fontSize:30, fontWeight:900, margin:0, letterSpacing:"-0.02em" }}>Jamoalar</h1>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:6, marginBottom:0 }}>
                  Jamoa a'zolari bilan birga ishlang
                </p>
              </div>
              <button onClick={()=>setShowCreate(true)} style={{
                padding:"12px 22px", borderRadius:14, border:"none",
                background:"#fff", color:"#1a1a1a",
                fontSize:14, fontWeight:800, cursor:"pointer",
                fontFamily:"inherit", transition:"all 0.15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
              >+ Yangi jamoa</button>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          {[
            { label:"Mening jamoalarim", value:myTeams,      icon:"👥", color:"#6366f1" },
            { label:"Jami a'zolar",      value:totalMembers, icon:"👤", color:"#22c55e" },
          ].map(s=>(
            <div key={s.label} style={{
              background:"#fff", border:"1px solid rgba(0,0,0,0.07)",
              borderRadius:16, padding:"16px 20px", flex:1, minWidth:140,
              display:"flex", alignItems:"center", gap:12,
            }}>
              <div style={{
                width:40, height:40, borderRadius:10, background:s.color+"15",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── SEARCH + SORT ── */}
        <div style={{
          background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:20,
          border:"1px solid rgba(0,0,0,0.07)",
          display:"flex", gap:10, alignItems:"center", flexWrap:"wrap",
        }}>
          <div style={{ flex:1, minWidth:180, position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              color:"#9ca3af", fontSize:14 }}>⌕</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Jamoa qidirish…"
              style={{
                width:"100%", padding:"9px 12px 9px 34px",
                border:"1px solid rgba(0,0,0,0.1)", borderRadius:10,
                fontSize:14, color:"#1a1a1a", background:"#fafafa",
                outline:"none", fontFamily:"inherit", boxSizing:"border-box",
              }}
            />
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {[
              {v:"name",    l:"A-Z"},
              {v:"members", l:"A'zolar"},
              {v:"recent",  l:"Yangi"},
            ].map(s=>(
              <button key={s.v} onClick={()=>setSortBy(s.v)} style={{
                padding:"7px 14px", borderRadius:10, border:"none", cursor:"pointer",
                fontFamily:"inherit", fontSize:12, fontWeight:600,
                background:sortBy===s.v?"#1a1a1a":"#f3f4f6",
                color:     sortBy===s.v?"#fff":"#6b7280",
                transition:"all 0.15s",
              }}>{s.l}</button>
            ))}
          </div>
        </div>

        {/* ── TEAM GRID ── */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#9ca3af", fontSize:14 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
            Yuklanmoqda…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background:"#fff", borderRadius:20, padding:"60px 20px",
            textAlign:"center", border:"1px solid rgba(0,0,0,0.07)",
          }}>
            <div style={{ fontSize:44, marginBottom:12 }}>👥</div>
            <p style={{ fontSize:16, fontWeight:700, color:"#374151", marginBottom:6 }}>
              {search ? "Jamoa topilmadi" : "Hali jamoalar yo'q"}
            </p>
            <p style={{ fontSize:13, color:"#9ca3af", marginBottom:20 }}>
              {search ? "Qidiruv so'zini o'zgartiring" : "Birinchi jamoangizni yarating"}
            </p>
            {!search && (
              <button onClick={()=>setShowCreate(true)} style={{
                padding:"12px 24px", borderRadius:12, border:"none",
                background:"#1a1a1a", color:"#fff",
                fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              }}>+ Jamoa yaratish</button>
            )}
          </div>
        ) : (
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",
            gap:16,
          }}>
            {filtered.map(team=>(
              <TeamCard key={team.id} team={team} onOpen={t=>setActiveTeam(t.id)}/>
            ))}
          </div>
        )}

      </div>

      <style>{`
        * { box-sizing:border-box; }
        @keyframes popIn {
          from{opacity:0;transform:scale(0.9) translateY(8px)}
          to{opacity:1;transform:scale(1) translateY(0)}
        }
        @keyframes toastIn {
          from{opacity:0;transform:translateX(-50%) translateY(-12px) scale(0.95)}
          to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}
        }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
      `}</style>
    </div>
  );
}
