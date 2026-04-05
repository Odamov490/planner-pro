import { useEffect, useState, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc, setDoc, getDoc, updateDoc,
  collection, query, orderBy, limit, getDocs
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const SIZE = 4;

const TILE_COLORS = {
  0:    { bg:"transparent",          text:"transparent",       border:true  },
  2:    { bg:"#FAEEDA",              text:"#412402"                         },
  4:    { bg:"#FAC775",              text:"#412402"                         },
  8:    { bg:"#EF9F27",              text:"#412402"                         },
  16:   { bg:"#BA7517",              text:"#FAEEDA"                         },
  32:   { bg:"#F0997B",              text:"#4A1B0C"                         },
  64:   { bg:"#D85A30",              text:"#FAECE7"                         },
  128:  { bg:"#993C1D",              text:"#F5C4B3"                         },
  256:  { bg:"#5DCAA5",              text:"#04342C"                         },
  512:  { bg:"#1D9E75",              text:"#E1F5EE"                         },
  1024: { bg:"#0F6E56",              text:"#9FE1CB"                         },
  2048: { bg:"#085041",              text:"#9FE1CB"                         },
  4096: { bg:"#7F77DD",              text:"#EEEDFE"                         },
  8192: { bg:"#534AB7",              text:"#CECBF6"                         },
};

const getTileStyle = (val) => TILE_COLORS[val] || { bg:"#3C3489", text:"#CECBF6" };

// ═══════════════════════════════════════════════════════════════
// GAME LOGIC
// ═══════════════════════════════════════════════════════════════
const createEmpty = () => Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));

const addRandom = (grid) => {
  const g = grid.map(r => [...r]);
  const empty = [];
  g.forEach((row, i) => row.forEach((v, j) => { if (!v) empty.push([i, j]); }));
  if (!empty.length) return g;
  const [i, j] = empty[Math.floor(Math.random() * empty.length)];
  g[i][j] = Math.random() < 0.9 ? 2 : 4;
  return g;
};

const initGrid = () => {
  let g = createEmpty();
  g = addRandom(g);
  g = addRandom(g);
  return g;
};

// Merge one row to the left, returns { row, gained }
const mergeRow = (row) => {
  let arr = row.filter(v => v);
  let gained = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      gained += arr[i];
      arr.splice(i + 1, 1);
    }
  }
  while (arr.length < SIZE) arr.push(0);
  return { row: arr, gained };
};

const transpose = g => g[0].map((_, c) => g.map(r => r[c]));
const reverseRows = g => g.map(r => [...r].reverse());

const applyMove = (grid, dir) => {
  let g = grid.map(r => [...r]);
  let gained = 0;

  if (dir === "right") g = reverseRows(g);
  if (dir === "up")    g = transpose(g);
  if (dir === "down")  g = reverseRows(transpose(g));

  g = g.map(row => { const m = mergeRow(row); gained += m.gained; return m.row; });

  if (dir === "right") g = reverseRows(g);
  if (dir === "up")    g = transpose(g);
  if (dir === "down")  g = transpose(reverseRows(g));

  return { grid: g, gained };
};

const gridsEqual = (a, b) => a.every((row, i) => row.every((v, j) => v === b[i][j]));

const hasWon = (g) => g.some(row => row.some(v => v >= 2048));

const hasLost = (g) => {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (!g[r][c]) return false;
      if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return false;
      if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return false;
    }
  return true;
};

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD MODAL
// ═══════════════════════════════════════════════════════════════
const Leaderboard = ({ visible, onClose }) => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    (async () => {
      const q    = query(collection(db, "2048_users"), orderBy("best", "desc"), limit(10));
      const snap = await getDocs(q);
      setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, [visible]);

  if (!visible) return null;
  const medals  = ["🥇","🥈","🥉"];
  const mColors = ["#f59e0b","#94a3b8","#f97316"];

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:"fixed", inset:0, zIndex:200,
        background:"rgba(0,0,0,0.82)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      }}
    >
      <div style={{
        background:"#0d1420", border:"1px solid #1e293b", borderRadius:20,
        width:"100%", maxWidth:440, boxShadow:"0 24px 80px rgba(0,0,0,0.7)", overflow:"hidden",
      }}>
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"18px 24px", borderBottom:"1px solid #1e293b",
          background:"linear-gradient(135deg,#131e35,#0d1420)",
        }}>
          <span style={{ fontSize:18, fontWeight:700, color:"#f59e0b" }}>🏆 2048 Rekordlar</span>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:"50%", border:"none",
            background:"#1e293b", color:"#94a3b8", cursor:"pointer", fontSize:18,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>×</button>
        </div>
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:8, maxHeight:"72vh", overflowY:"auto" }}>
          {loading && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#475569" }}>
              <div style={{
                width:28, height:28, border:"2px solid #f59e0b", borderTopColor:"transparent",
                borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px",
              }}/>
              Yuklanmoqda…
            </div>
          )}
          {!loading && rows.map((r, i) => (
            <div key={r.id} style={{
              display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:12,
              border:`1px solid ${i < 3 ? mColors[i]+"30" : "#1e293b"}`,
              background: i < 3 ? mColors[i]+"0d" : "rgba(15,23,42,0.5)",
            }}>
              <span style={{ width:28, textAlign:"center", fontWeight:900, fontSize:16, flexShrink:0, color:i<3?mColors[i]:"#475569" }}>
                {i < 3 ? medals[i] : i + 1}
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:"#f1f5f9", fontWeight:600, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {r.displayName || r.email?.split("@")[0] || r.id.slice(0, 10)}
                </div>
                {r.email && (
                  <div style={{ color:"#475569", fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {r.email}
                  </div>
                )}
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ color:"#34d399", fontWeight:800, fontSize:15 }}>{r.best?.toLocaleString() ?? 0}</div>
                <div style={{ color:"#475569", fontSize:11 }}>
                  eng yuqori: <span style={{ color:"#f59e0b" }}>{r.maxTile ?? 2}</span>
                </div>
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <p style={{ textAlign:"center", color:"#475569", padding:"40px 0" }}>Hali rekord yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SETTINGS MODAL (board theme)
// ═══════════════════════════════════════════════════════════════
const BOARD_THEMES = [
  { name:"Tungi",    boardBg:"#0f172a", cellEmpty:"#1e293b", border:"#334155" },
  { name:"Kulrang",  boardBg:"#1f2937", cellEmpty:"#374151", border:"#4b5563" },
  { name:"Ko'k",     boardBg:"#0c1a2e", cellEmpty:"#1e3a5f", border:"#2563eb" },
  { name:"Yashil",   boardBg:"#052e16", cellEmpty:"#14532d", border:"#166534" },
  { name:"Qo'ng'ir", boardBg:"#1c0a00", cellEmpty:"#431407", border:"#7c2d12" },
  { name:"Binafsha", boardBg:"#1e1b4b", cellEmpty:"#312e81", border:"#4338ca" },
];

const SettingsModal = ({ visible, onClose, themeIdx, setThemeIdx }) => {
  if (!visible) return null;
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:"fixed", inset:0, zIndex:200,
        background:"rgba(0,0,0,0.82)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      }}
    >
      <div style={{
        background:"#0d1420", border:"1px solid #1e293b", borderRadius:20,
        width:"100%", maxWidth:380, boxShadow:"0 24px 80px rgba(0,0,0,0.7)", overflow:"hidden",
      }}>
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"18px 24px", borderBottom:"1px solid #1e293b",
          background:"linear-gradient(135deg,#131e35,#0d1420)",
        }}>
          <span style={{ fontSize:17, fontWeight:700, color:"#f1f5f9" }}>⚙️ Sozlamalar</span>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:"50%", border:"none",
            background:"#1e293b", color:"#94a3b8", cursor:"pointer", fontSize:18,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>×</button>
        </div>
        <div style={{ padding:20 }}>
          <p style={{ color:"#cbd5e1", fontSize:13, fontWeight:600, marginBottom:12 }}>🎨 Taxta uslubi</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {BOARD_THEMES.map((t, i) => (
              <button key={i} onClick={() => setThemeIdx(i)} style={{
                borderRadius:10, overflow:"hidden", cursor:"pointer", border:"none",
                outline: themeIdx === i ? "2.5px solid #f59e0b" : "2.5px solid transparent",
                transform: themeIdx === i ? "scale(1.05)" : "scale(1)",
                transition:"all 0.2s",
                boxShadow: themeIdx === i ? "0 0 12px rgba(245,158,11,0.3)" : "none",
              }}>
                <div style={{ background:t.boardBg, padding:8 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:3 }}>
                    {[0,1,2,3].map(k => (
                      <div key={k} style={{
                        height:16, borderRadius:4,
                        background: k===0 ? "#EF9F27" : k===1 ? "#1D9E75" : k===2 ? "#7F77DD" : t.cellEmpty,
                        border:`1px solid ${t.border}`,
                      }}/>
                    ))}
                  </div>
                </div>
                <div style={{ background:"#0f172a", color:"#94a3b8", fontSize:11, textAlign:"center", padding:"5px 0" }}>
                  {t.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TILE COMPONENT
// ═══════════════════════════════════════════════════════════════
const Tile = ({ value, isNew, isMerged }) => {
  const s   = getTileStyle(value);
  const fs = value
  ? `${Math.max(18, 60 - value.toString().length * 22)}px`
  : 0;

  return (
    <div style={{
      background: value ? s.bg : "transparent",
      border: value ? "none" : "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 500, fontSize: fs, color: value ? s.text : "transparent",
      transition: "background 0.1s ease",
      animation: isNew ? "tileAppear 0.18s cubic-bezier(0.34,1.56,0.64,1)" :
                 isMerged ? "tilePop 0.2s cubic-bezier(0.34,1.56,0.64,1)" : "none",
      position: "relative",
    }}>
      {value > 0 ? value.toLocaleString() : ""}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Game2048() {
  const { user } = useContext(AuthContext);

  const [grid, setGrid]         = useState(() => initGrid());
  const [score, setScore]       = useState(0);
  const [best, setBest]         = useState(0);
  const [prevState, setPrev]    = useState(null);   // for undo
  const [status, setStatus]     = useState("playing"); // "playing" | "won" | "lost"
  const [continueAfterWin, setContinueAfterWin] = useState(false);
  const [notification, setNotification] = useState(null);
  const [themeIdx, setThemeIdx] = useState(() => +(localStorage.getItem("2048theme") ?? 0));
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings]       = useState(false);
  const [newCells, setNewCells]   = useState(new Set());
  const [mergedCells, setMergedCells] = useState(new Set());

  // Touch tracking
  const touchStart = useRef(null);

  useEffect(() => { localStorage.setItem("2048theme", themeIdx); }, [themeIdx]);

  // ── FIREBASE: load save ──
  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, "2048_saves", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setGrid(d.grid);
        setScore(d.score ?? 0);
        setStatus(d.status ?? "playing");
        setContinueAfterWin(d.continueAfterWin ?? false);
      }
      // Load best
      const uSnap = await getDoc(doc(db, "2048_users", user.uid));
      if (uSnap.exists()) setBest(uSnap.data().best ?? 0);
    })();
  }, [user]);

  const save = useCallback(async (g, s, st, caw) => {
    if (!user) return;
    await setDoc(doc(db, "2048_saves", user.uid), {
      grid: g, score: s, status: st, continueAfterWin: caw ?? false,
    });
  }, [user]);

  const updateUserRecord = useCallback(async (newScore, g) => {
    if (!user) return;
    const maxTile = Math.max(...g.flat());
    const ref     = doc(db, "2048_users", user.uid);
    const snap    = await getDoc(ref);
    const prev    = snap.exists() ? snap.data() : {};
    const newBest = Math.max(prev.best ?? 0, newScore);
    if (newBest > (prev.best ?? 0) || !snap.exists()) {
      await setDoc(ref, {
        best: newBest,
        maxTile: Math.max(prev.maxTile ?? 0, maxTile),
        email:       user.email || "",
        displayName: user.displayName || user.email?.split("@")[0] || user.uid.slice(0, 8),
      }, { merge: true });
      setBest(newBest);
    }
  }, [user]);

  const showNotif = (msg, ms = 2800) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), ms);
  };

  // ── MOVE ──
  const doMove = useCallback((dir) => {
    setGrid(prev => {
      if (status === "lost") return prev;
      if (status === "won" && !continueAfterWin) return prev;

      const { grid: next, gained } = applyMove(prev, dir);
      if (gridsEqual(prev, next)) return prev; // nothing moved

      // Track new/merged cells for animation
      const newSet    = new Set();
      const mergedSet = new Set();
      next.forEach((row, r) => row.forEach((v, c) => {
        const idx = r * SIZE + c;
        if (v && !prev[r][c]) newSet.add(idx);
        else if (v && v !== prev[r][c] && v === (prev[r][c] ?? 0) * 2) mergedSet.add(idx);
      }));
      setNewCells(newSet);
      setMergedCells(mergedSet);
      setTimeout(() => { setNewCells(new Set()); setMergedCells(new Set()); }, 250);

      const withTile = addRandom(next);
      const newScore = (prev => {
        let s; setScore(cur => { s = cur + gained; return s; }); return s;
      })();

      setScore(cur => {
        const ns = cur + gained;
        updateUserRecord(ns, withTile);
        return ns;
      });

      // Check won / lost
      let newStatus = status;
      let newCaw    = continueAfterWin;
      if (!continueAfterWin && hasWon(withTile)) {
        newStatus = "won";
        showNotif("🏆 2048! G'alaba!", 4000);
      } else if (hasLost(withTile)) {
        newStatus = "lost";
        showNotif("💀 O'yin tugadi!", 4000);
      }
      setStatus(newStatus);

      // Save async
      setScore(ns => {
        save(withTile, ns, newStatus, newCaw);
        return ns;
      });

      return withTile;
    });
  }, [status, continueAfterWin, save, updateUserRecord]);

  // ── KEYBOARD ──
  useEffect(() => {
    const map = { ArrowLeft:"left", ArrowRight:"right", ArrowUp:"up", ArrowDown:"down" };
    const handler = e => {
      if (map[e.key]) { e.preventDefault(); doMove(map[e.key]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doMove]);

  // ── TOUCH SWIPE ──
  const onTouchStart = e => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd   = e => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
  };

  // ── NEW GAME ──
  const newGame = async () => {
    const g = initGrid();
    setGrid(g);
    setScore(0);
    setStatus("playing");
    setContinueAfterWin(false);
    setPrev(null);
    setNotification(null);
    await save(g, 0, "playing", false);
  };

  // ── UNDO ──
  const undo = () => {
    if (!prevState) return;
    setGrid(prevState.grid);
    setScore(prevState.score);
    setStatus(prevState.status);
    setPrev(null);
  };

  // Save prev before move (wrap doMove)
  const move = (dir) => {
    setPrev({ grid: grid.map(r => [...r]), score, status });
    doMove(dir);
  };

  // ── CONTINUE after 2048 ──
  const keepPlaying = () => {
    setContinueAfterWin(true);
    setStatus("playing");
    setNotification(null);
  };

  const theme = BOARD_THEMES[themeIdx];
  const maxTile = Math.max(...grid.flat());

  return (
    <div style={{
      minHeight:"100vh", color:"#f1f5f9",
      background:"radial-gradient(ellipse at 20% 10%, #0f1d35 0%, #080e1a 55%, #040810 100%)",
      fontFamily:"'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>

      {/* Toast */}
      {notification && (
        <div style={{
          position:"fixed", top:24, left:"50%", transform:"translateX(-50%)",
          zIndex:300, background:"#0f172a", border:"1px solid #1e293b",
          padding:"11px 24px", borderRadius:999, fontSize:14, fontWeight:500, color:"#f1f5f9",
          boxShadow:"0 8px 40px rgba(0,0,0,0.6)", animation:"toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          whiteSpace:"nowrap",
        }}>
          {notification}
        </div>
      )}

      <Leaderboard visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <SettingsModal
        visible={showSettings} onClose={() => setShowSettings(false)}
        themeIdx={themeIdx} setThemeIdx={setThemeIdx}
      />

      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 16px 40px" }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:20, marginBottom:16 }}>
          <div>
            <h1 style={{ fontSize:38, fontWeight:900, letterSpacing:"-2px", margin:0 }}>
              <span style={{
                background:"linear-gradient(90deg,#f59e0b,#ef9f27,#d85a30)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              }}>2048</span>
            </h1>
            <p style={{ color:"#475569", fontSize:12, margin:"2px 0 0" }}>
              Eng yuqori katak: <span style={{ color:"#f59e0b", fontWeight:700 }}>{maxTile.toLocaleString()}</span>
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setShowSettings(true)} style={{
              padding:"8px 12px", borderRadius:10, cursor:"pointer",
              border:"1px solid #1e293b", background:"rgba(15,23,42,0.6)", color:"#94a3b8", fontSize:16,
            }}>⚙️</button>
            <button onClick={() => setShowLeaderboard(true)} style={{
              padding:"8px 14px", borderRadius:10, cursor:"pointer",
              border:"1px solid rgba(245,158,11,0.3)", background:"rgba(245,158,11,0.08)",
              color:"#f59e0b", fontSize:13, fontWeight:600,
            }}>🏆 Rekordlar</button>
          </div>
        </div>

        {/* ── SCORE CARDS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {[
            { label:"Ball", value:score, color:"#60a5fa" },
            { label:"Rekord", value:best, color:"#34d399" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background:"rgba(15,23,42,0.6)", border:"1px solid #1e293b",
              borderRadius:12, padding:"12px 16px", textAlign:"center",
            }}>
              <div style={{ color:"#475569", fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>
                {label}
              </div>
              <div style={{ color, fontSize:24, fontWeight:700, fontVariantNumeric:"tabular-nums" }}>
                {value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* ── CONTROL BUTTONS ── */}
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <button onClick={newGame} style={{
            flex:2, padding:"10px 0", borderRadius:10, cursor:"pointer", border:"none",
            fontWeight:600, fontSize:14, color:"#fff",
            background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
            boxShadow:"0 3px 16px rgba(37,99,235,0.3)",
          }}>Yangi o'yin</button>
          <button onClick={undo} disabled={!prevState} style={{
            flex:1, padding:"10px 0", borderRadius:10, cursor: prevState ? "pointer" : "not-allowed",
            border:"1px solid #1e293b",
            background: prevState ? "rgba(15,23,42,0.6)" : "rgba(15,23,42,0.3)",
            color: prevState ? "#94a3b8" : "#334155",
            fontWeight:600, fontSize:14,
          }}>↩ Orqaga</button>
          {status === "won" && !continueAfterWin && (
            <button onClick={keepPlaying} style={{
              flex:2, padding:"10px 0", borderRadius:10, cursor:"pointer", border:"none",
              fontWeight:600, fontSize:14, color:"#fff",
              background:"linear-gradient(135deg,#059669,#047857)",
            }}>Davom etish</button>
          )}
        </div>

        {/* ── ARROW BUTTONS (mobile helper) ── */}
        <div style={{ marginBottom:14, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <button onClick={() => move("up")} style={arrowBtn}>▲</button>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={() => move("left")}  style={arrowBtn}>◀</button>
            <button onClick={() => move("down")}  style={arrowBtn}>▼</button>
            <button onClick={() => move("right")} style={arrowBtn}>▶</button>
          </div>
        </div>

        {/* ── STATUS MESSAGE ── */}
        {(status === "won" || status === "lost") && (
          <div style={{
            marginBottom:14, padding:"12px 20px", borderRadius:12, textAlign:"center",
            fontWeight:700, fontSize:17,
            border:`1px solid ${status==="won" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            background: status==="won" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: status==="won" ? "#6ee7b7" : "#fca5a5",
          }}>
            {status === "won"
              ? continueAfterWin ? "🏆 Ajoyib! O'yin davom etmoqda" : "🏆 2048! Siz g'alaba qozondingiz!"
              : "💀 O'yin tugadi! Yangi o'yin boshlang"}
          </div>
        )}

        {/* ── GAME BOARD ── */}
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            background: theme.boardBg,
            borderRadius: 16,
            padding: 10,
            border: `2px solid ${theme.border}`,
            boxShadow: "0 12px 60px rgba(0,0,0,0.7)",
            display: "grid",
            gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
            gap: 8,
            touchAction: "none",
            userSelect: "none",
          }}
        >
          {grid.flat().map((val, idx) => (
            <div key={idx} style={{ aspectRatio:"1", borderRadius:10, background: val ? "transparent" : theme.cellEmpty, border:`1px solid ${theme.border}` }}>
              <Tile
                value={val}
                isNew={newCells.has(idx)}
                isMerged={mergedCells.has(idx)}
              />
            </div>
          ))}
        </div>

        {/* ── HOW TO PLAY ── */}
        <details style={{
          background:"rgba(15,23,42,0.4)", border:"1px solid #1e293b",
          borderRadius:12, overflow:"hidden", marginTop:14,
        }}>
          <summary style={{ padding:"12px 16px", cursor:"pointer", color:"#64748b", fontSize:13, userSelect:"none" }}>
            📖 Qanday o'ynaladi?
          </summary>
          <div style={{ padding:"0 16px 16px", color:"#475569", fontSize:13, lineHeight:2 }}>
            <p>• O'q tugmalari yoki mobilda suring (chapga/o'ngga/yuqoriga/pastga)</p>
            <p>• Bir xil raqamlar bir-biriga urilganda ikki barobarga oshadi</p>
            <p>• <b style={{color:"#94a3b8"}}>Maqsad:</b> 2048 katakka yetish</p>
            <p>• <b style={{color:"#94a3b8"}}>Orqaga:</b> faqat bitta yurish orqaga qaytarish mumkin</p>
            <p>• Katak to'lib, hech bir harakat imkoni qolmasa — o'yin tugaydi</p>
            <p>• 2048 ga yetgandan keyin ham davom ettirish mumkin!</p>
          </div>
        </details>

      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(-12px) scale(0.95); }
          to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes tileAppear {
          from { transform:scale(0); opacity:0; }
          to   { transform:scale(1); opacity:1; }
        }
        @keyframes tilePop {
          0%   { transform:scale(1); }
          50%  { transform:scale(1.2); }
          100% { transform:scale(1); }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }
        details>summary::-webkit-details-marker { display:none; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#1e293b; border-radius:10px; }
        * { box-sizing:border-box; }
      `}</style>
    </div>
  );
}

const arrowBtn = {
  width:52, height:44, borderRadius:8, cursor:"pointer",
  border:"1px solid #1e293b", background:"rgba(15,23,42,0.6)",
  color:"#94a3b8", fontSize:16, fontWeight:500, display:"flex",
  alignItems:"center", justifyContent:"center",
};
