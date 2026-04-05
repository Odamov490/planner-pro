import { useEffect, useState, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, increment,
  collection, query, orderBy, limit, getDocs
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// BOARD CONSTANTS
// ═══════════════════════════════════════════════════════════════
const FILES = ["a","b","c","d","e","f","g","h"];
const RANKS = ["8","7","6","5","4","3","2","1"];

const sqToRC  = sq => [Math.floor(sq / 8), sq % 8];
const rcToSq  = (r, c) => r * 8 + c;
const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const pColor   = p => p ? p[0] : null;   // "b" | "w"
const isKing   = p => p ? p.length > 1 && p[1] === "k" : false;

// ═══════════════════════════════════════════════════════════════
// BOARD INIT
// ═══════════════════════════════════════════════════════════════
const INITIAL_BOARD = () => {
  const b = Array(64).fill(null);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) b[rcToSq(r, c)] = "b";
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) b[rcToSq(r, c)] = "w";
  return b;
};

// ═══════════════════════════════════════════════════════════════
// MOVE ENGINE
// ═══════════════════════════════════════════════════════════════
function getRawMoves(board, sq, onlyCaptures = false) {
  const piece = board[sq];
  if (!piece) return [];
  const [r, c] = sqToRC(sq);
  const color = pColor(piece);
  const king  = isKing(piece);
  const opp   = color === "w" ? "b" : "w";
  const dirs  = [];

  if (color === "b" || king) dirs.push([1, -1], [1, 1]);
  if (color === "w" || king) dirs.push([-1, -1], [-1, 1]);

  const moves = [];

  dirs.forEach(([dr, dc]) => {
    if (king) {
      // King slides unlimited
      let nr = r + dr, nc = c + dc;
      while (inBounds(nr, nc)) {
        const tsq = rcToSq(nr, nc);
        const tp  = board[tsq];
        if (tp) {
          if (pColor(tp) === opp) {
            // Try to jump
            const jr = nr + dr, jc = nc + dc;
            if (inBounds(jr, jc) && !board[rcToSq(jr, jc)]) {
              moves.push({ from: sq, to: rcToSq(jr, jc), capture: tsq });
            }
          }
          break;
        }
        if (!onlyCaptures) moves.push({ from: sq, to: tsq });
        nr += dr; nc += dc;
      }
    } else {
      // Regular piece: one step
      const nr = r + dr, nc = c + dc;
      if (!inBounds(nr, nc)) return;
      const tsq = rcToSq(nr, nc);
      const tp  = board[tsq];
      if (!tp) {
        if (!onlyCaptures) moves.push({ from: sq, to: tsq });
      } else if (pColor(tp) === opp) {
        const jr = nr + dr, jc = nc + dc;
        if (inBounds(jr, jc) && !board[rcToSq(jr, jc)]) {
          moves.push({ from: sq, to: rcToSq(jr, jc), capture: tsq });
        }
      }
    }
  });

  return onlyCaptures ? moves.filter(m => m.capture !== undefined) : moves;
}

function hasAnyCapture(board, color) {
  for (let sq = 0; sq < 64; sq++) {
    if (pColor(board[sq]) === color && getRawMoves(board, sq, true).length > 0)
      return true;
  }
  return false;
}

function getLegalMoves(board, sq) {
  const piece = board[sq];
  if (!piece) return [];
  const color    = pColor(piece);
  const mustEat  = hasAnyCapture(board, color);
  const raw      = getRawMoves(board, sq, mustEat);
  if (mustEat)   return raw.filter(m => m.capture !== undefined);
  return raw;
}

function getAllLegalMoves(board, color) {
  const all = [];
  for (let sq = 0; sq < 64; sq++)
    if (pColor(board[sq]) === color)
      getLegalMoves(board, sq).forEach(m => all.push(m));
  return all;
}

function applyMove(board, move) {
  const b = [...board];
  let piece = b[move.from];
  b[move.to]   = piece;
  b[move.from] = null;
  if (move.capture !== undefined) b[move.capture] = null;

  // Promotion to king
  const [tr] = sqToRC(move.to);
  if (pColor(piece) === "b" && tr === 7) b[move.to] = "bk";
  if (pColor(piece) === "w" && tr === 0) b[move.to] = "wk";

  return b;
}

function moveNotation(move, board) {
  const [fr, fc] = sqToRC(move.from);
  const [tr, tc] = sqToRC(move.to);
  const from = FILES[fc] + RANKS[fr];
  const to   = FILES[tc] + RANKS[tr];
  const cap  = move.capture !== undefined ? "x" : "-";
  return from + cap + to;
}

function countPieces(board, color) {
  return board.filter(p => pColor(p) === color).length;
}

// ═══════════════════════════════════════════════════════════════
// VISUAL PRESETS  (same structure as Chess)
// ═══════════════════════════════════════════════════════════════
const BOARD_THEMES = [
  { name:"Klassik",  dark:"#1e3a28", light:"#c8a87a", accent:"#4a7c5a", border:"#162b1e" },
  { name:"Okean",    dark:"#1a3a5c", light:"#a8c8e8", accent:"#2a6c9a", border:"#102540" },
  { name:"Atirgul",  dark:"#5c1a3a", light:"#e8a8c8", accent:"#8a2a5c", border:"#3a0f25" },
  { name:"Oltin",    dark:"#3a2a0a", light:"#f0d080", accent:"#7a5a10", border:"#251a05" },
  { name:"Tun",      dark:"#111827", light:"#374151", accent:"#2d3f55", border:"#0a0f18" },
  { name:"Ametist",  dark:"#2d1b69", light:"#c4b5fd", accent:"#5b3fa8", border:"#1a0f40" },
];

const PIECE_STYLES = [
  { id:"classic",  name:"Klassik",  wFrom:"#f5f5f5",wTo:"#d0d0d0",wRing:"#999",    bFrom:"#3a3a3a",bTo:"#111",   bRing:"#666" },
  { id:"wood",     name:"Yog'och",  wFrom:"#f0d9b5",wTo:"#d4a57a",wRing:"#b8860b", bFrom:"#b58863",bTo:"#5c3317",bRing:"#3d1f00" },
  { id:"ruby",     name:"Yoqut",    wFrom:"#fce7f3",wTo:"#f9a8d4",wRing:"#ec4899", bFrom:"#9f1239",bTo:"#7f1d1d",bRing:"#dc2626" },
  { id:"neon",     name:"Neon",     wFrom:"#d1fae5",wTo:"#6ee7b7",wRing:"#10b981", bFrom:"#4c1d95",bTo:"#2e1065",bRing:"#a855f7" },
  { id:"gold",     name:"Oltin",    wFrom:"#fff8e1",wTo:"#ffe082",wRing:"#ffc107", bFrom:"#78350f",bTo:"#451a03",bRing:"#d97706" },
  { id:"royal",    name:"Shohona",  wFrom:"#e8eaf6",wTo:"#9fa8da",wRing:"#5c6bc0", bFrom:"#1a237e",bTo:"#0d47a1",bRing:"#42a5f5" },
];

const getPieceStyle = id => PIECE_STYLES.find(s => s.id === id) || PIECE_STYLES[0];

// ═══════════════════════════════════════════════════════════════
// ELO
// ═══════════════════════════════════════════════════════════════
const calcDelta = (won, opR, myR) => {
  const K = 32, exp = 1 / (1 + Math.pow(10, (opR - myR) / 400));
  return Math.round(K * ((won ? 1 : 0) - exp));
};

// ═══════════════════════════════════════════════════════════════
// PIECE COMPONENT  (same ball style as Chess)
// ═══════════════════════════════════════════════════════════════
const CheckerPiece = ({ color, king, selected, styleId }) => {
  const s   = getPieceStyle(styleId);
  const isW = color === "w";
  const from = isW ? s.wFrom : s.bFrom;
  const to   = isW ? s.wTo   : s.bTo;
  const ring = isW ? s.wRing : s.bRing;

  return (
    <div style={{
      width: 48, height: 48, borderRadius: "50%",
      background: `radial-gradient(circle at 35% 30%, ${from}, ${to})`,
      boxShadow: selected
        ? `0 0 0 3px #facc15, 0 0 14px rgba(250,204,21,0.6), 0 4px 10px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.3)`
        : `0 0 0 2.5px ${ring}, 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.25)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: selected ? "translateY(-5px) scale(1.14)" : "scale(1)",
      transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
      cursor: "pointer", userSelect: "none", position: "relative",
    }}>
      {/* Gloss */}
      <div style={{
        position: "absolute", top: 7, left: 10, width: 13, height: 8,
        borderRadius: "50%", background: "rgba(255,255,255,0.32)", filter: "blur(1px)",
      }}/>
      {/* King crown */}
      {king && (
        <span style={{
          fontSize: 20, lineHeight: 1, zIndex: 1, userSelect: "none",
          color: isW ? "#92400e" : "#facc15",
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.7))",
        }}>♛</span>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CAPTURED PIECES DISPLAY
// ═══════════════════════════════════════════════════════════════
const CapturedPieces = ({ count, color, styleId }) => {
  if (!count) return <div style={{flex:1}}/>;
  const s = getPieceStyle(styleId);
  const isW = color === "w";
  const from = isW ? s.wFrom : s.bFrom;
  const to   = isW ? s.wTo   : s.bTo;
  const ring = isW ? s.wRing : s.bRing;

  return (
    <div style={{ display:"flex", gap:3, flexWrap:"wrap", alignItems:"center", flex:1 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 14, height: 14, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%,${from},${to})`,
          boxShadow: `0 0 0 1px ${ring}`,
          flexShrink: 0,
        }}/>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MOVE HISTORY
// ═══════════════════════════════════════════════════════════════
const MoveHistory = ({ history }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [history]);

  if (!history?.length) return null;
  const pairs = [];
  for (let i = 0; i < history.length; i += 2)
    pairs.push([history[i], history[i + 1]]);

  return (
    <div style={{
      background: "rgba(15,23,42,0.5)", border: "1px solid #1e293b",
      borderRadius: 12, padding: 10, maxHeight: 100, overflowY: "auto", width: "100%",
    }} ref={ref}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"2px 12px" }}>
        {pairs.map((pair, i) => (
          <span key={i} style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
            <span style={{ color:"#475569", marginRight:4 }}>{i + 1}.</span>
            <span style={{ color:"#94a3b8", marginRight:6 }}>{pair[0]}</span>
            {pair[1] && <span style={{ color:"#64748b" }}>{pair[1]}</span>}
          </span>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// GAME ID BADGE
// ═══════════════════════════════════════════════════════════════
const GameIdBadge = ({ gameId }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(gameId).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 8, padding: "10px 16px", borderRadius: 12, cursor: "pointer",
      border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "#1e293b"}`,
      background: copied ? "rgba(16,185,129,0.08)" : "rgba(15,23,42,0.7)",
      transition: "all 0.3s",
    }}>
      <span style={{ color:"#94a3b8", fontSize:13, flexShrink:0 }}>O'yin kodi:</span>
      <span style={{ fontFamily:"monospace", color:"#f59e0b", fontWeight:700, fontSize:13, flex:1, textAlign:"center" }}>
        {gameId}
      </span>
      <span style={{
        fontSize: 11, padding: "3px 10px", borderRadius: 999, flexShrink: 0,
        border: `1px solid ${copied ? "#10b981" : "#475569"}`,
        color: copied ? "#10b981" : "#94a3b8",
        background: copied ? "rgba(16,185,129,0.12)" : "rgba(71,85,105,0.2)",
        transition: "all 0.3s",
      }}>
        {copied ? "✓ Nusxalandi!" : "📋 Bosib nusxalang"}
      </span>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════
// OPPONENT BAR
// ═══════════════════════════════════════════════════════════════
const OpponentBar = ({ game, myUserId, styleId }) => {
  const [opData, setOpData] = useState(null);
  const opId     = game?.player1 === myUserId ? game?.player2 : game?.player1;
  const opRating = game?.player1 === myUserId ? game?.player2Rating : game?.player1Rating;
  const opSide   = game?.player1 === myUserId ? game?.player2Side  : game?.player1Side;

  useEffect(() => {
    if (!opId) return;
    getDoc(doc(db, "users", opId)).then(s => s.exists() && setOpData(s.data()));
  }, [opId]);

  if (!game || game.status === "waiting" || !opId) return null;

  const s    = getPieceStyle(styleId);
  const isW  = opSide === "w";
  const name = opData?.displayName || opData?.email?.split("@")[0] || opId.slice(0, 10);

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
      borderRadius:12, border:"1px solid rgba(51,65,85,0.5)", background:"rgba(15,23,42,0.5)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: `radial-gradient(circle at 35% 30%,${isW?s.wFrom:s.bFrom},${isW?s.wTo:s.bTo})`,
        boxShadow: `0 0 0 2px ${isW?s.wRing:s.bRing}`,
      }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:"#f1f5f9", fontWeight:600, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {name}
        </div>
        {opData?.email && (
          <div style={{ color:"#475569", fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {opData.email}
          </div>
        )}
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ color:"#34d399", fontWeight:700, fontSize:14 }}>{opData?.rating ?? opRating ?? 1000}</div>
        <div style={{ color:"#475569", fontSize:11 }}>{opData?.wins ?? 0}W / {opData?.losses ?? 0}L</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════
const Leaderboard = ({ visible, onClose }) => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    (async () => {
      const q    = query(collection(db, "shashka_users"), orderBy("rating", "desc"), limit(10));
      const snap = await getDocs(q);
      setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, [visible]);

  if (!visible) return null;
  const medals  = ["🥇","🥈","🥉"];
  const mColors = ["#f59e0b","#94a3b8","#f97316"];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:"fixed", inset:0, zIndex:200,
      background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      <div style={{
        background:"#0d1420", border:"1px solid #1e293b", borderRadius:20,
        width:"100%", maxWidth:440, boxShadow:"0 24px 80px rgba(0,0,0,0.7)", overflow:"hidden",
      }}>
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"18px 24px", borderBottom:"1px solid #1e293b",
          background:"linear-gradient(135deg,#131e35,#0d1420)",
        }}>
          <span style={{ fontSize:18, fontWeight:700, color:"#f59e0b" }}>♟ Shashka Reytingi</span>
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
                <div style={{ color:"#34d399", fontWeight:800, fontSize:15 }}>{r.rating ?? 1000}</div>
                <div style={{ color:"#475569", fontSize:11 }}>{r.wins ?? 0}W / {r.losses ?? 0}L</div>
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <p style={{ textAlign:"center", color:"#475569", padding:"40px 0" }}>Ma'lumot yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════
const SettingsModal = ({
  visible, onClose,
  boardThemeIdx, setBoardThemeIdx,
  pieceStyleId, setPieceStyleId,
  boardFlipped, setBoardFlipped,
}) => {
  if (!visible) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:"fixed", inset:0, zIndex:200,
      background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      <div style={{
        background:"#0d1420", border:"1px solid #1e293b", borderRadius:20,
        width:"100%", maxWidth:420, boxShadow:"0 24px 80px rgba(0,0,0,0.7)", overflow:"hidden",
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

        <div style={{ padding:20, display:"flex", flexDirection:"column", gap:24 }}>

          {/* Board flip toggle */}
          <div>
            <p style={{ color:"#cbd5e1", fontSize:13, fontWeight:600, marginBottom:8 }}>🔄 Doskani aylantirish</p>
            <button onClick={() => setBoardFlipped(v => !v)} style={{
              width:"100%", padding:"10px 16px", borderRadius:10, cursor:"pointer",
              border:`1px solid ${boardFlipped ? "rgba(96,165,250,0.4)" : "#334155"}`,
              background: boardFlipped ? "rgba(59,130,246,0.12)" : "rgba(15,23,42,0.6)",
              color: boardFlipped ? "#93c5fd" : "#94a3b8",
              fontWeight:600, fontSize:13, transition:"all 0.2s",
            }}>
              {boardFlipped ? "✅ Aylantirilgan holat" : "Standart holat — bosib o'zgartiring"}
            </button>
            <p style={{ color:"#334155", fontSize:11, marginTop:6 }}>
              Siz tanlagan rang sizni pastda ko'rsatadi. Bu toggle qo'shimcha boshqaruv.
            </p>
          </div>

          {/* Board theme */}
          <div>
            <p style={{ color:"#cbd5e1", fontSize:13, fontWeight:600, marginBottom:10 }}>🎨 Doska uslubi</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {BOARD_THEMES.map((t, i) => (
                <button key={i} onClick={() => setBoardThemeIdx(i)} style={{
                  borderRadius:10, overflow:"hidden", cursor:"pointer", border:"none",
                  outline: boardThemeIdx === i ? "2.5px solid #f59e0b" : "2.5px solid transparent",
                  transform: boardThemeIdx === i ? "scale(1.05)" : "scale(1)",
                  transition:"all 0.2s",
                  boxShadow: boardThemeIdx === i ? "0 0 12px rgba(245,158,11,0.3)" : "none",
                }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", height:28 }}>
                    {[0,1,2,3].map(k => (
                      <div key={k} style={{ background: k%2===0 ? t.light : t.dark }}/>
                    ))}
                  </div>
                  <div style={{ background:"#0f172a", color:"#94a3b8", fontSize:11, textAlign:"center", padding:"5px 0" }}>
                    {t.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Piece style */}
          <div>
            <p style={{ color:"#cbd5e1", fontSize:13, fontWeight:600, marginBottom:10 }}>♟ Tosh uslubi</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {PIECE_STYLES.map(s => (
                <button key={s.id} onClick={() => setPieceStyleId(s.id)} style={{
                  borderRadius:10, padding:"10px 6px", cursor:"pointer", border:"none",
                  background: pieceStyleId === s.id ? "rgba(250,204,21,0.1)" : "rgba(15,23,42,0.5)",
                  outline: pieceStyleId === s.id ? "2px solid #facc15" : "2px solid transparent",
                  transform: pieceStyleId === s.id ? "scale(1.05)" : "scale(1)",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"all 0.2s",
                }}>
                  <div style={{ display:"flex", gap:5 }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:`radial-gradient(circle at 35% 30%,${s.wFrom},${s.wTo})`, boxShadow:`0 0 0 1.5px ${s.wRing}` }}/>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:`radial-gradient(circle at 35% 30%,${s.bFrom},${s.bTo})`, boxShadow:`0 0 0 1.5px ${s.bRing}` }}/>
                  </div>
                  <span style={{ color:"#94a3b8", fontSize:11 }}>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Checkers() {
  const { user } = useContext(AuthContext);

  // ── Game state ──
  const [gameId, setGameId]             = useState("");
  const [inputId, setInputId]           = useState("");
  const [game, setGame]                 = useState(null);
  const [selected, setSelected]         = useState(null);
  const [legalMoves, setLegalMoves]     = useState([]);
  const [multiCapture, setMultiCapture] = useState(null); // sq locked for multi-jump
  const [notification, setNotification] = useState(null);
  const [myRating, setMyRating]         = useState(1000);

  // ── Visual (localStorage persisted) ──
  const [boardThemeIdx, setBoardThemeIdx] = useState(() => +(localStorage.getItem("sh_board") ?? 0));
  const [pieceStyleId, setPieceStyleId]   = useState(() => localStorage.getItem("sh_piece") || "classic");
  const [boardFlipped, setBoardFlipped]   = useState(() => localStorage.getItem("sh_flip") === "1");
  const [chosenSide, setChosenSide]       = useState("b"); // before game

  // ── UI modals ──
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings]       = useState(false);

  useEffect(() => { localStorage.setItem("sh_board", boardThemeIdx); }, [boardThemeIdx]);
  useEffect(() => { localStorage.setItem("sh_piece", pieceStyleId);  }, [pieceStyleId]);
  useEffect(() => { localStorage.setItem("sh_flip",  boardFlipped ? "1" : "0"); }, [boardFlipped]);

  const myColor = useCallback(() => {
    if (!game || !user) return null;
    return game.player1 === user.uid ? game.player1Side : game.player2Side;
  }, [game, user]);

  // Load rating
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "shashka_users", user.uid)).then(s => {
      if (s.exists()) setMyRating(s.data().rating ?? 1000);
    });
  }, [user]);

  // Realtime listener
  useEffect(() => {
    if (!gameId) return;
    return onSnapshot(doc(db, "shashka_games", gameId), snap => {
      if (snap.exists()) setGame({ id: snap.id, ...snap.data() });
    });
  }, [gameId]);

  const showNotif = (msg, ms = 3000) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), ms);
  };

  // ── CREATE ──
  const createGame = async () => {
    const id = `sh_${Date.now()}`;
    await setDoc(doc(db, "shashka_games", id), {
      board:        INITIAL_BOARD(),
      player1:      user.uid,
      player1Email: user.email || "",
      player1Name:  user.displayName || user.email?.split("@")[0] || user.uid.slice(0, 8),
      player1Side:  chosenSide,
      player2:      "",
      player2Email: "",
      player2Name:  "",
      player2Side:  chosenSide === "b" ? "w" : "b",
      player1Rating: myRating,
      player2Rating: 1000,
      turn:   "w",        // qora har doim boshlaydi (shashka qoidasi)
      status: "waiting",
      winner: "",
      moveCount: 0,
      history:  [],
      captured: { w: 0, b: 0 },
    });
    setGameId(id);
    setSelected(null); setLegalMoves([]);
    showNotif("✅ O'yin yaratildi! ID bosib nusxalang");
  };

  // ── JOIN ──
  const joinGame = async () => {
    const id = inputId.trim();
    if (!id) return;
    const ref  = doc(db, "shashka_games", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) { showNotif("❌ O'yin topilmadi"); return; }
    const data = snap.data();
    if (data.status !== "waiting") { showNotif("❌ O'yin allaqachon boshlangan"); return; }
    if (data.player1 === user.uid)  { showNotif("❌ O'z o'yiningizga qo'shila olmaysiz"); return; }
    await updateDoc(ref, {
      player2:      user.uid,
      player2Email: user.email || "",
      player2Name:  user.displayName || user.email?.split("@")[0] || user.uid.slice(0, 8),
      player2Rating: myRating,
      status: "playing",
    });
    setGameId(id);
    showNotif("✅ O'yinga qo'shildingiz!");
  };

  // ── CLICK ──
  const handleClick = (sq) => {
    if (!game || game.status !== "playing" || game.winner) return;
    const color = myColor();
    if (game.turn !== color) return;

    const board = game.board;

    if (selected !== null) {
      const move = legalMoves.find(m => m.to === sq);

      if (move) {
        executeMove(move);
        return;
      }

      // Reselect own piece (only if not in multi-capture)
      if (!multiCapture && pColor(board[sq]) === color) {
        const ml = getLegalMoves(board, sq);
        setSelected(sq); setLegalMoves(ml);
        return;
      }

      // Deselect
      if (!multiCapture) { setSelected(null); setLegalMoves([]); }
    } else {
      if (pColor(board[sq]) !== color) return;
      const ml = getLegalMoves(board, sq);
      if (!ml.length) return;
      setSelected(sq); setLegalMoves(ml);
    }
  };

  const executeMove = async (move) => {
    const board    = [...game.board];
    const history  = [...(game.history  || [])];
    const captured = { ...(game.captured || { w:0, b:0 }) };
    const color    = myColor();

    const notation = moveNotation(move, board);
    if (move.capture !== undefined) {
      const capColor = pColor(board[move.capture]);
      if (capColor) captured[capColor] = (captured[capColor] || 0) + 1;
    }

    const newBoard = applyMove(board, move);
    history.push(notation);

    // Check multi-capture
    const moreCaps = getRawMoves(newBoard, move.to, true);
    if (move.capture !== undefined && moreCaps.length > 0) {
      // Stay on same piece, opponent doesn't get turn yet
      const ml = getLegalMoves(newBoard, move.to);
      setSelected(move.to);
      setLegalMoves(ml);
      setMultiCapture(move.to);
      await updateDoc(doc(db, "shashka_games", gameId), { board: newBoard, history, captured });
      return;
    }

    // Check win / no moves
    const opp = color === "b" ? "w" : "b";
    const oppPieces = newBoard.some(p => pColor(p) === opp);
    const oppMoves  = oppPieces && getAllLegalMoves(newBoard, opp).length > 0;

    let winner = "";
    let newStatus = "playing";
    const nextTurn = opp;

    if (!oppPieces || !oppMoves) {
      winner    = user.uid;
      newStatus = "done";
      const opId     = user.uid === game.player1 ? game.player2 : game.player1;
      const opRating = user.uid === game.player1 ? game.player2Rating : game.player1Rating;
      const delta    = calcDelta(true, opRating, myRating);
      await updateDoc(doc(db, "shashka_games", gameId), {
        board: newBoard, history, captured, winner, status: "done",
      });
      await updateDoc(doc(db, "shashka_users", user.uid), { wins: increment(1), rating: increment(delta) });
      await updateDoc(doc(db, "shashka_users", opId),     { losses: increment(1), rating: increment(-delta) });
      showNotif(`🏆 G'alaba! +${delta} reyting`, 4000);
      setSelected(null); setLegalMoves([]); setMultiCapture(null);
      return;
    }

    await updateDoc(doc(db, "shashka_games", gameId), {
      board: newBoard, turn: nextTurn,
      moveCount: increment(1), history, captured,
    });
    setSelected(null); setLegalMoves([]); setMultiCapture(null);
  };

  // ── SURRENDER ──
  const surrender = async () => {
    if (!game || game.status !== "playing" || game.winner) return;
    const opId     = user.uid === game.player1 ? game.player2 : game.player1;
    const opRating = user.uid === game.player1 ? game.player2Rating : game.player1Rating;
    const delta    = calcDelta(false, opRating, myRating);
    await updateDoc(doc(db, "shashka_games", gameId), { winner: opId, status: "done" });
    await updateDoc(doc(db, "shashka_users", user.uid), { losses: increment(1), rating: increment(-Math.abs(delta)) });
    await updateDoc(doc(db, "shashka_users", opId),     { wins: increment(1),   rating: increment(Math.abs(delta)) });
    showNotif("🏳️ Taslim bo'ldingiz");
  };

  const resetGame = () => {
    setGameId(""); setGame(null);
    setSelected(null); setLegalMoves([]); setMultiCapture(null);
  };

  // ── DERIVED ──
  const color = game ? myColor() : null;
  const theme = BOARD_THEMES[boardThemeIdx];
  const board = game?.board || [];

  // Flip: qora tanlasa pastda (no flip needed since "b" is top by default)
  // White (w) is at bottom by default → if player chose "w", no flip needed
  // If player chose "b" (black), board should flip so black is at bottom
  const autoFlip   = color === "b";
  const shouldFlip = boardFlipped ? !autoFlip : autoFlip;

  const moveSqs = new Set(legalMoves.map(m => m.to));
  const captSqs = new Set(legalMoves.filter(m => m.capture !== undefined).map(m => m.to));

  const displayOrder = shouldFlip
    ? Array.from({ length:64 }, (_,i) => 63 - i)
    : Array.from({ length:64 }, (_,i) => i);

  const myPieces = countPieces(board, color);
  const opPieces = countPieces(board, color === "b" ? "w" : "b");
  const capturedByMe  = game?.captured?.[color === "b" ? "w" : "b"] || 0;
  const capturedByOpp = game?.captured?.[color] || 0;

  return (
    <div style={{
      minHeight: "100vh", color: "#f1f5f9",
      background: "radial-gradient(ellipse at 20% 10%, #0f1d35 0%, #080e1a 55%, #040810 100%)",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>

      {/* ── TOAST ── */}
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

      <Leaderboard visible={showLeaderboard} onClose={() => setShowLeaderboard(false)}/>
      <SettingsModal
        visible={showSettings} onClose={() => setShowSettings(false)}
        boardThemeIdx={boardThemeIdx} setBoardThemeIdx={setBoardThemeIdx}
        pieceStyleId={pieceStyleId}   setPieceStyleId={setPieceStyleId}
        boardFlipped={boardFlipped}   setBoardFlipped={setBoardFlipped}
      />

      <div style={{ maxWidth:620, margin:"0 auto", padding:"0 16px 40px" }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:20, marginBottom:16 }}>
          <div>
            <h1 style={{ fontSize:30, fontWeight:900, letterSpacing:"-0.5px", margin:0 }}>
              <span style={{ color:"#f59e0b" }}>⬤</span>
              <span style={{
                marginLeft:8,
                background:"linear-gradient(90deg,#f59e0b,#f97316)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              }}>SHASHKA</span>
            </h1>
            <p style={{ color:"#475569", fontSize:12, margin:"3px 0 0" }}>
              Reyting: <span style={{ color:"#34d399", fontWeight:700 }}>{myRating}</span>
              {color && (
                <span style={{ color:"#64748b", marginLeft:8 }}>
                  · {color === "b" ? "⬛ Qora tosh" : "⬜ Oq tosh"}
                </span>
              )}
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setShowSettings(true)} style={{
              padding:"8px 12px", borderRadius:10, cursor:"pointer",
              border:"1px solid #1e293b", background:"rgba(15,23,42,0.6)", color:"#94a3b8", fontSize:16,
            }} title="Sozlamalar">⚙️</button>
            <button onClick={() => setShowLeaderboard(true)} style={{
              padding:"8px 14px", borderRadius:10, cursor:"pointer",
              border:"1px solid rgba(245,158,11,0.3)", background:"rgba(245,158,11,0.08)",
              color:"#f59e0b", fontSize:13, fontWeight:600,
            }}>🏆 Reyting</button>
          </div>
        </div>

        {/* ── LOBBY ── */}
        {!gameId && (
          <div style={{
            background:"rgba(15,23,42,0.7)", border:"1px solid #1e293b",
            borderRadius:16, padding:20, marginBottom:16,
          }}>
            {/* Side selection */}
            <div style={{ marginBottom:16 }}>
              <p style={{ color:"#94a3b8", fontSize:13, fontWeight:600, marginBottom:8 }}>
                ♟ Qaysi tosh rangida o'ynaysiz?
              </p>
              <div style={{ display:"flex", gap:8 }}>
                {[
                  { val:"b", label:"⬛ Qora tosh", sub:"Avval yuradi" },
                  { val:"w", label:"⬜ Oq tosh",   sub:"Ikkinchi yuradi" },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setChosenSide(opt.val)} style={{
                    flex:1, padding:"12px 8px", borderRadius:12, cursor:"pointer",
                    border:`1px solid ${chosenSide===opt.val ? "rgba(250,204,21,0.5)" : "#1e293b"}`,
                    background: chosenSide===opt.val ? "rgba(250,204,21,0.1)" : "rgba(15,23,42,0.5)",
                    transition:"all 0.2s",
                  }}>
                    <div style={{ fontSize:24, marginBottom:4 }}>{opt.label.split(" ")[0]}</div>
                    <div style={{ color: chosenSide===opt.val ? "#facc15" : "#64748b", fontWeight:600, fontSize:13 }}>
                      {opt.label.split(" ").slice(1).join(" ")}
                    </div>
                    <div style={{ color:"#334155", fontSize:11, marginTop:2 }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop:"1px solid #1e293b", marginBottom:16 }}/>

            <button onClick={createGame} style={{
              width:"100%", padding:"13px 0", borderRadius:12, cursor:"pointer",
              border:"none", fontWeight:700, fontSize:15, color:"#fff",
              background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
              boxShadow:"0 4px 20px rgba(37,99,235,0.35)", marginBottom:12,
            }}>⬤ Yangi o'yin yaratish</button>

            <div style={{ display:"flex", gap:8 }}>
              <input value={inputId} onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && joinGame()}
                placeholder="Do'stingizning o'yin ID kiriting…"
                style={{
                  flex:1, padding:"10px 14px", borderRadius:10, fontSize:13,
                  border:"1px solid #1e293b", background:"#060c18",
                  color:"#f1f5f9", outline:"none",
                }}
              />
              <button onClick={joinGame} style={{
                padding:"10px 18px", borderRadius:10, cursor:"pointer",
                border:"none", fontWeight:600, fontSize:13, color:"#fff", background:"#059669",
              }}>Qo'shilish</button>
            </div>
          </div>
        )}

        {/* ── GAME ID ── */}
        {gameId && game && <div style={{ marginBottom:10 }}><GameIdBadge gameId={gameId}/></div>}

        {/* ── OPPONENT ── */}
        {game && game.status === "playing" && (
          <div style={{ marginBottom:10 }}>
            <OpponentBar game={game} myUserId={user.uid} styleId={pieceStyleId}/>
          </div>
        )}

        {/* ── STATUS BAR ── */}
        {game && (() => {
          if (game.winner) {
            const iWon = game.winner === user.uid;
            return (
              <div style={{
                borderRadius:12, padding:"12px 24px", textAlign:"center",
                fontWeight:700, fontSize:17, letterSpacing:0.3, marginBottom:10,
                border:`1px solid ${iWon ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                background: iWon ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color: iWon ? "#6ee7b7" : "#fca5a5",
              }}>
                {iWon ? "🏆 Siz g'alaba qozondingiz!" : "💀 Raqib g'alaba qildi"}
              </div>
            );
          }
          if (game.status === "waiting") {
            return (
              <div style={{
                borderRadius:12, padding:"12px 24px", textAlign:"center",
                color:"#fcd34d", border:"1px solid rgba(245,158,11,0.3)",
                background:"rgba(245,158,11,0.08)", marginBottom:10,
              }}>⏳ Raqib kutilmoqda…</div>
            );
          }
          const myTurn = game.turn === color;
          return (
            <div style={{
              borderRadius:12, padding:"10px 18px", marginBottom:10,
              display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
              border:`1px solid ${myTurn ? "rgba(96,165,250,0.3)" : "rgba(51,65,85,0.4)"}`,
              background: myTurn ? "rgba(59,130,246,0.1)" : "rgba(30,41,59,0.3)",
              transition:"all 0.4s ease",
            }}>
              {/* My pieces */}
              <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-start" }}>
                <CapturedPieces count={capturedByMe} color={color === "b" ? "w" : "b"} styleId={pieceStyleId}/>
                <span style={{ color:"#64748b", fontSize:11 }}>Siz: {myPieces} tosh</span>
              </div>

              <span style={{
                fontWeight:600, fontSize:13, textAlign:"center",
                color: myTurn ? "#93c5fd" : "#64748b",
                animation: myTurn ? "pulseText 1.5s ease-in-out infinite" : "none",
              }}>
                {myTurn
                  ? multiCapture ? "⚡ Davomli urish!" : "⚡ Sizning navbat"
                  : "⏳ Raqib o'ylayapti…"}
              </span>

              {/* Opp pieces */}
              <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                <CapturedPieces count={capturedByOpp} color={color} styleId={pieceStyleId}/>
                <span style={{ color:"#64748b", fontSize:11 }}>Raqib: {opPieces} tosh</span>
              </div>
            </div>
          );
        })()}

        {/* ── BOARD ── */}
        {game && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>

            {/* Flip button */}
            {game.status === "playing" && (
              <button onClick={() => setBoardFlipped(v => !v)} style={{
                display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8,
                cursor:"pointer", border:"1px solid #1e293b", background:"rgba(15,23,42,0.5)",
                color:"#64748b", fontSize:12, transition:"all 0.2s",
              }}>
                🔄 {shouldFlip ? "Standart holat" : "Doskani aylantirish"}
              </button>
            )}

            {/* Board with coordinate labels */}
            <div>
              {/* Top file labels */}
              <div style={{ display:"flex", marginBottom:2 }}>
                <div style={{ width:22 }}/>
                {(shouldFlip ? [...FILES].reverse() : FILES).map(f => (
                  <div key={f} style={{ width:56, textAlign:"center", fontSize:11, color:"#334155" }}>{f}</div>
                ))}
              </div>

              <div style={{ display:"flex" }}>
                {/* Left rank labels */}
                <div style={{ display:"flex", flexDirection:"column", marginRight:2 }}>
                  {(shouldFlip ? [...RANKS].reverse() : RANKS).map(rk => (
                    <div key={rk} style={{
                      height:56, width:20, display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, color:"#334155",
                    }}>{rk}</div>
                  ))}
                </div>

                {/* Board */}
                <div style={{
                  borderRadius:10, overflow:"hidden",
                  border:`3px solid ${theme.border}`,
                  boxShadow:"0 12px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
                }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(8,56px)" }}>
                    {displayOrder.map(sq => {
                      const row = Math.floor(sq / 8), col = sq % 8;
                      const isDark    = (row + col) % 2 === 1;
                      const piece     = board[sq];
                      const pc        = pColor(piece);
                      const king      = isKing(piece);
                      const isSel     = selected === sq;
                      const isMove    = moveSqs.has(sq);
                      const isCapt    = captSqs.has(sq);
                      const isMulti   = multiCapture === sq;

                      // Only dark squares are playable
                      let bg = isDark ? theme.dark : theme.light;
                      if (isDark && isSel)   bg = theme.accent;
                      if (isDark && isMulti) bg = theme.accent;

                      return (
                        <div
                          key={sq}
                          onClick={() => isDark && handleClick(sq)}
                          style={{
                            width:56, height:56, background:bg,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            position:"relative",
                            cursor: isDark ? "pointer" : "default",
                            userSelect:"none",
                            transition:"background 0.25s ease",
                          }}
                        >
                          {/* Move hint dot */}
                          {isMove && !piece && (
                            <>
                              <div style={{
                                position:"absolute", width:18, height:18, borderRadius:"50%",
                                background:"rgba(74,222,128,0.3)",
                                animation:"pingDot 1.3s ease-in-out infinite",
                              }}/>
                              <div style={{
                                position:"absolute", width:12, height:12, borderRadius:"50%",
                                background:"rgba(74,222,128,0.9)",
                                boxShadow:"0 0 8px rgba(74,222,128,0.6)",
                              }}/>
                            </>
                          )}
                          {/* Capture ring */}
                          {isCapt && piece && (
                            <div style={{
                              position:"absolute", inset:3,
                              border:"3px solid rgba(248,113,113,0.9)",
                              borderRadius:6, pointerEvents:"none",
                              boxShadow:"inset 0 0 8px rgba(248,113,113,0.3)",
                              animation:"captureGlow 1s ease-in-out infinite alternate",
                            }}/>
                          )}
                          {/* Multi-capture locked indicator */}
                          {isMulti && piece && (
                            <div style={{
                              position:"absolute", inset:0,
                              background:"rgba(250,204,21,0.08)",
                              borderRadius:2, pointerEvents:"none",
                            }}/>
                          )}
                          {/* Piece */}
                          {piece && (
                            <CheckerPiece
                              color={pc}
                              king={king}
                              selected={isSel}
                              styleId={pieceStyleId}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right rank labels */}
                <div style={{ display:"flex", flexDirection:"column", marginLeft:2 }}>
                  {(shouldFlip ? [...RANKS].reverse() : RANKS).map(rk => (
                    <div key={rk} style={{
                      height:56, width:20, display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, color:"#334155",
                    }}>{rk}</div>
                  ))}
                </div>
              </div>

              {/* Bottom file labels */}
              <div style={{ display:"flex", marginTop:2 }}>
                <div style={{ width:22 }}/>
                {(shouldFlip ? [...FILES].reverse() : FILES).map(f => (
                  <div key={f} style={{ width:56, textAlign:"center", fontSize:11, color:"#334155" }}>{f}</div>
                ))}
              </div>
            </div>

            {/* Move history */}
            {game.history?.length > 0 && (
              <div style={{ width:"100%" }}>
                <MoveHistory history={game.history}/>
              </div>
            )}

            {/* Info */}
            <div style={{ color:"#334155", fontSize:11, textAlign:"center" }}>
              {color === "b" ? "⬛ Siz — qora tosh (pastda)" : "⬜ Siz — oq tosh (pastda)"}
              {"  ·  "}
              {game.moveCount ?? 0} ta yurish
            </div>

            {/* Buttons */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
              {game.status === "playing" && !game.winner && (
                <button onClick={surrender} style={{
                  padding:"9px 20px", borderRadius:10, cursor:"pointer",
                  border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.08)",
                  color:"#f87171", fontSize:13, fontWeight:600,
                }}>🏳️ Taslim bo'lish</button>
              )}
              {(game.winner || game.status === "done") && (
                <button onClick={resetGame} style={{
                  padding:"11px 28px", borderRadius:12, cursor:"pointer", border:"none",
                  fontWeight:700, fontSize:14, color:"#fff",
                  background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
                  boxShadow:"0 4px 20px rgba(37,99,235,0.35)",
                }}>🔄 Yangi o'yin</button>
              )}
            </div>
          </div>
        )}

        {/* ── RULES ── */}
        {!game && (
          <details style={{
            background:"rgba(15,23,42,0.4)", border:"1px solid #1e293b",
            borderRadius:12, overflow:"hidden", marginTop:8,
          }}>
            <summary style={{ padding:"12px 16px", cursor:"pointer", color:"#64748b", fontSize:13, userSelect:"none" }}>
              📖 Shashka qoidalari
            </summary>
            <div style={{ padding:"0 16px 16px", color:"#475569", fontSize:13, lineHeight:2 }}>
              <p>• Toshlar faqat diagonal bo'yicha qora kataklar bo'ylab yuradi</p>
              <p>• Qora tosh pastga, oq tosh yuqoriga yuradi</p>
              <p>• <b style={{color:"#94a3b8"}}>Majburiy urish:</b> raqib toshini urish imkoni bo'lsa, albatta uriladi</p>
              <p>• <b style={{color:"#94a3b8"}}>Davomli urish:</b> bir yurishda ketma-ket bir necha tosh urish mumkin</p>
              <p>• <b style={{color:"#94a3b8"}}>Shoh (♛):</b> qarama-qarshi oxirgi qatorga yetganda shohga aylanadi</p>
              <p>• Shoh barcha diagonal yo'nalishlarda istalgan masofaga yuradi</p>
              <p>• Raqibning barcha toshlari urilsa yoki yura olmay qolsa — g'alaba!</p>
              <p>• Qora tosh har doim birinchi yuradi</p>
            </div>
          </details>
        )}

      </div>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes pingDot {
          0%,100% { transform:scale(1); opacity:0.7; }
          50%      { transform:scale(1.9); opacity:0; }
        }
        @keyframes captureGlow {
          from { border-color:rgba(248,113,113,0.7); }
          to   { border-color:rgba(248,113,113,1); box-shadow:inset 0 0 12px rgba(248,113,113,0.4); }
        }
        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(-12px) scale(0.95); }
          to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes pulseText {
          0%,100% { opacity:1; }
          50%      { opacity:0.6; }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }
        input::placeholder { color:#334155; }
        input:focus { border-color:#3b82f6 !important; }
        details>summary::-webkit-details-marker { display:none; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#1e293b; border-radius:10px; }
      `}</style>
    </div>
  );
}
