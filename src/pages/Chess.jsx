import { useEffect, useState, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, increment,
  collection, query, orderBy, limit, getDocs
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const FILES = ["a","b","c","d","e","f","g","h"];
const RANKS = ["8","7","6","5","4","3","2","1"];

// Piece types
const PIECES = {
  wK:"♔", wQ:"♕", wR:"♖", wB:"♗", wN:"♘", wP:"♙",
  bK:"♚", bQ:"♛", bR:"♜", bB:"♝", bN:"♞", bP:"♟",
};

// ═══════════════════════════════════════════════════════════════
// BOARD INITIALIZATION
// ═══════════════════════════════════════════════════════════════
const INITIAL_BOARD = () => {
  const b = Array(64).fill(null);
  // Black pieces (top, rows 0-1)
  const backRow = ["R","N","B","Q","K","B","N","R"];
  backRow.forEach((p,j) => { b[j] = "b"+p; b[8+j] = "bP"; });
  // White pieces (bottom, rows 6-7)
  backRow.forEach((p,j) => { b[48+j] = "wP"; b[56+j] = "w"+p; });
  return b;
};

const sqToRC = sq => [Math.floor(sq/8), sq%8];
const rcToSq = (r,c) => r*8+c;
const inBounds = (r,c) => r>=0&&r<8&&c>=0&&c<8;
const pieceColor = p => p ? p[0] : null; // "w" or "b"
const pieceType  = p => p ? p[1] : null; // "K","Q","R","B","N","P"

// ═══════════════════════════════════════════════════════════════
// MOVE GENERATION
// ═══════════════════════════════════════════════════════════════
function getRawMoves(board, sq, castleRights, enPassant) {
  const piece = board[sq];
  if (!piece) return [];
  const [r, c] = sqToRC(sq);
  const color = pieceColor(piece);
  const type  = pieceType(piece);
  const opp   = color === "w" ? "b" : "w";
  const moves = [];

  const push = (tr, tc, extra={}) => {
    if (!inBounds(tr,tc)) return;
    const tsq = rcToSq(tr,tc);
    const tp  = board[tsq];
    if (tp && pieceColor(tp) === color) return; // own piece
    moves.push({ from: sq, to: tsq, ...extra });
  };

  const slide = (dirs) => {
    dirs.forEach(([dr,dc]) => {
      let tr=r+dr, tc=c+dc;
      while(inBounds(tr,tc)) {
        const tsq=rcToSq(tr,tc);
        const tp=board[tsq];
        if (tp && pieceColor(tp)===color) break;
        moves.push({from:sq,to:tsq});
        if (tp) break; // capture stops slide
        tr+=dr; tc+=dc;
      }
    });
  };

  if (type === "P") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    const promRow  = color === "w" ? 0 : 7;
    // Forward
    const f1 = rcToSq(r+dir,c);
    if (inBounds(r+dir,c) && !board[f1]) {
      const isPromo = r+dir === promRow;
      if (isPromo) {
        ["Q","R","B","N"].forEach(p => moves.push({from:sq,to:f1,promo:color+p}));
      } else {
        moves.push({from:sq,to:f1});
      }
      // Double push
      if (r===startRow && !board[rcToSq(r+2*dir,c)]) {
        moves.push({from:sq, to:rcToSq(r+2*dir,c), doublePush:true});
      }
    }
    // Captures
    [-1,1].forEach(dc => {
      if (!inBounds(r+dir,c+dc)) return;
      const tsq = rcToSq(r+dir,c+dc);
      const isPromo = r+dir === promRow;
      if (board[tsq] && pieceColor(board[tsq])===opp) {
        if (isPromo) {
          ["Q","R","B","N"].forEach(p => moves.push({from:sq,to:tsq,promo:color+p}));
        } else {
          moves.push({from:sq,to:tsq});
        }
      }
      // En passant
      if (enPassant !== null && tsq === enPassant) {
        moves.push({from:sq,to:tsq,enPassant:rcToSq(r,c+dc)});
      }
    });
  }

  if (type === "N") {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => push(r+dr,c+dc));
  }
  if (type === "B") slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
  if (type === "R") slide([[-1,0],[1,0],[0,-1],[0,1]]);
  if (type === "Q") slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
  if (type === "K") {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => push(r+dr,c+dc));
    // Castling
    if (castleRights) {
      const kRank = color==="w" ? 7 : 0;
      if (r===kRank && c===4) {
        // Kingside
        const ksRight = color==="w" ? castleRights.wK : castleRights.bK;
        if (ksRight && !board[rcToSq(kRank,5)] && !board[rcToSq(kRank,6)]) {
          moves.push({from:sq,to:rcToSq(kRank,6),castle:"K"});
        }
        // Queenside
        const qsRight = color==="w" ? castleRights.wQ : castleRights.bQ;
        if (qsRight && !board[rcToSq(kRank,3)] && !board[rcToSq(kRank,2)] && !board[rcToSq(kRank,1)]) {
          moves.push({from:sq,to:rcToSq(kRank,2),castle:"Q"});
        }
      }
    }
  }
  return moves;
}

function isSquareAttacked(board, sq, byColor) {
  // Check if sq is attacked by byColor pieces
  for (let s=0;s<64;s++) {
    const p = board[s];
    if (!p || pieceColor(p)!==byColor) continue;
    const raw = getRawMoves(board,s,null,null);
    if (raw.some(m=>m.to===sq)) return true;
  }
  return false;
}

function isInCheck(board, color) {
  const kSq = board.findIndex(p=>p===color+"K");
  if (kSq<0) return false;
  return isSquareAttacked(board, kSq, color==="w"?"b":"w");
}

function applyMove(board, move) {
  const b = [...board];
  b[move.to] = move.promo ? move.promo : b[move.from];
  b[move.from] = null;
  if (move.enPassant !== undefined) b[move.enPassant] = null;
  if (move.castle) {
    const rank = Math.floor(move.from/8);
    if (move.castle==="K") { b[rcToSq(rank,5)]=b[rcToSq(rank,7)]; b[rcToSq(rank,7)]=null; }
    if (move.castle==="Q") { b[rcToSq(rank,3)]=b[rcToSq(rank,0)]; b[rcToSq(rank,0)]=null; }
  }
  return b;
}

function getLegalMoves(board, sq, castleRights, enPassant) {
  const piece = board[sq];
  if (!piece) return [];
  const color = pieceColor(piece);
  const raw = getRawMoves(board, sq, castleRights, enPassant);
  return raw.filter(move => {
    // Castling: king must not pass through check
    if (move.castle) {
      const rank = Math.floor(move.from/8);
      const passSq = move.castle==="K" ? rcToSq(rank,5) : rcToSq(rank,3);
      const opp = color==="w"?"b":"w";
      if (isSquareAttacked(board,move.from,opp)) return false;
      if (isSquareAttacked(board,passSq,opp)) return false;
    }
    const nb = applyMove(board, move);
    return !isInCheck(nb, color);
  });
}

function getAllLegalMoves(board, color, castleRights, enPassant) {
  const all = [];
  for(let sq=0;sq<64;sq++) {
    if (pieceColor(board[sq])===color) {
      getLegalMoves(board,sq,castleRights,enPassant).forEach(m=>all.push(m));
    }
  }
  return all;
}

function updateCastleRights(rights, move, board) {
  const r = {...rights};
  const piece = board[move.from];
  if (piece==="wK") { r.wK=false; r.wQ=false; }
  if (piece==="bK") { r.bK=false; r.bQ=false; }
  if (piece==="wR") {
    if (move.from===63) r.wK=false;
    if (move.from===56) r.wQ=false;
  }
  if (piece==="bR") {
    if (move.from===7) r.bK=false;
    if (move.from===0) r.bQ=false;
  }
  // If rook captured
  if (move.to===63) r.wK=false;
  if (move.to===56) r.wQ=false;
  if (move.to===7)  r.bK=false;
  if (move.to===0)  r.bQ=false;
  return r;
}

// ═══════════════════════════════════════════════════════════════
// VISUAL PRESETS
// ═══════════════════════════════════════════════════════════════
const BOARD_THEMES = [
  { name:"Klassik",  dark:"#769656", light:"#eeeed2", accent:"#f6f669", border:"#5a7a3a" },
  { name:"Okean",    dark:"#1a5276", light:"#d6eaf8", accent:"#7fb3d3", border:"#154360" },
  { name:"Marmar",   dark:"#6d4c41", light:"#efebe9", accent:"#a1887f", border:"#4e342e" },
  { name:"Tun",      dark:"#1a1a2e", light:"#2d2d44", accent:"#4a4a6a", border:"#0d0d1a" },
  { name:"Lavanda",  dark:"#4a235a", light:"#e8daef", accent:"#c39bd3", border:"#311b45" },
  { name:"Oltin",    dark:"#7d6608", light:"#fef9e7", accent:"#f9e79f", border:"#5d4e08" },
];

const PIECE_STYLES = [
  { id:"classic",  name:"Klassik", wFrom:"#f5f5f5",wTo:"#d0d0d0",wRing:"#999",bFrom:"#3a3a3a",bTo:"#111",bRing:"#666" },
  { id:"wood",     name:"Yog'och", wFrom:"#f0d9b5",wTo:"#d4a57a",wRing:"#b8860b",bFrom:"#b58863",bTo:"#8b5e3c",bRing:"#6b4226" },
  { id:"marble",   name:"Marmar",  wFrom:"#ffffff",wTo:"#e8e8e8",wRing:"#aaa",bFrom:"#2c2c2c",bTo:"#1a1a1a",bRing:"#555" },
  { id:"neon",     name:"Neon",    wFrom:"#00f5d4",wTo:"#00b4d8",wRing:"#90e0ef",bFrom:"#f72585",bTo:"#b5179e",bRing:"#ff6ab0" },
  { id:"gold",     name:"Oltin",   wFrom:"#fff8e1",wTo:"#ffe082",wRing:"#ffc107",bFrom:"#bf360c",bTo:"#870000",bRing:"#ff5722" },
  { id:"royal",    name:"Shohona", wFrom:"#e8eaf6",wTo:"#9fa8da",wRing:"#5c6bc0",bFrom:"#1a237e",bTo:"#0d47a1",bRing:"#42a5f5" },
];

const getPieceStyle = id => PIECE_STYLES.find(s=>s.id===id) || PIECE_STYLES[0];

// ═══════════════════════════════════════════════════════════════
// ELO RATING
// ═══════════════════════════════════════════════════════════════
const calcDelta = (won, opRating, myRating) => {
  const K=32, exp=1/(1+Math.pow(10,(opRating-myRating)/400));
  return Math.round(K*((won?1:0)-exp));
};

// ═══════════════════════════════════════════════════════════════
// PIECE RENDERER
// ═══════════════════════════════════════════════════════════════
const ChessPiece = ({ piece, styleId, selected, inCheck }) => {
  const s = getPieceStyle(styleId);
  const isWhite = pieceColor(piece)==="w";
  const from  = isWhite ? s.wFrom : s.bFrom;
  const to    = isWhite ? s.wTo   : s.bTo;
  const ring  = isWhite ? s.wRing : s.bRing;
  const sym   = PIECES[piece] || piece;

  return (
    <div style={{
      width:48, height:48, borderRadius:"50%",
      background:`radial-gradient(circle at 35% 30%, ${from}, ${to})`,
      boxShadow: inCheck
        ? `0 0 0 3px #ef4444, 0 0 16px #ef4444, 0 3px 8px rgba(0,0,0,0.5)`
        : selected
          ? `0 0 0 3px #facc15, 0 0 12px rgba(250,204,21,0.6), 0 3px 8px rgba(0,0,0,0.5)`
          : `0 0 0 2px ${ring}, 0 3px 8px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.3)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      transform: selected ? "translateY(-4px) scale(1.12)" : "scale(1)",
      transition:"transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease",
      cursor:"pointer", userSelect:"none", position:"relative",
    }}>
      {/* gloss */}
      <div style={{
        position:"absolute",top:6,left:9,width:12,height:7,borderRadius:"50%",
        background:"rgba(255,255,255,0.35)",filter:"blur(1px)",
      }}/>
      <span style={{
        fontSize:24, lineHeight:1, zIndex:1,
        filter:`drop-shadow(0 1px 2px rgba(0,0,0,0.6))`,
        color: isWhite ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)",
      }}>{sym}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CAPTURED PIECES
// ═══════════════════════════════════════════════════════════════
const CapturedPieces = ({ captured, color, styleId }) => {
  const pieces = captured.filter(p=>pieceColor(p)===color);
  if (!pieces.length) return null;
  const s = getPieceStyle(styleId);
  return (
    <div style={{display:"flex",gap:2,flexWrap:"wrap",alignItems:"center"}}>
      {pieces.map((p,i) => (
        <span key={i} style={{
          fontSize:18,
          color: pieceColor(p)==="w" ? s.wFrom : s.bFrom,
          filter:`drop-shadow(0 1px 1px rgba(0,0,0,0.5))`,
        }}>{PIECES[p]||p}</span>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PAWN PROMOTION MODAL
// ═══════════════════════════════════════════════════════════════
const PromoModal = ({ color, styleId, onChoose }) => {
  const pieces = ["Q","R","B","N"].map(t=>color+t);
  const s = getPieceStyle(styleId);
  return (
    <div style={{
      position:"fixed",inset:0,zIndex:500,
      background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>
      <div style={{
        background:"#0d1420",border:"1px solid #1e293b",
        borderRadius:20,padding:32,
        boxShadow:"0 24px 80px rgba(0,0,0,0.8)",
        textAlign:"center",
      }}>
        <p style={{color:"#f1f5f9",fontWeight:700,fontSize:18,marginBottom:20}}>
          ♟ Donani tanlang
        </p>
        <div style={{display:"flex",gap:16}}>
          {pieces.map(p => {
            const isW = pieceColor(p)==="w";
            return (
              <button key={p} onClick={()=>onChoose(p)} style={{
                width:72,height:72,borderRadius:14,cursor:"pointer",border:"none",
                background:isW
                  ? `radial-gradient(circle at 35% 30%,${s.wFrom},${s.wTo})`
                  : `radial-gradient(circle at 35% 30%,${s.bFrom},${s.bTo})`,
                boxShadow:`0 0 0 2px ${isW?s.wRing:s.bRing}, 0 4px 16px rgba(0,0,0,0.5)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:36, transition:"transform 0.15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
              >
                <span style={{filter:"drop-shadow(0 2px 3px rgba(0,0,0,0.6))"}}>
                  {PIECES[p]}
                </span>
              </button>
            );
          })}
        </div>
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
    navigator.clipboard?.writeText(gameId).then(()=>{
      setCopied(true); setTimeout(()=>setCopied(false),2000);
    });
  };
  return (
    <button onClick={copy} style={{
      width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
      gap:8,padding:"10px 16px",borderRadius:12,cursor:"pointer",
      border:`1px solid ${copied?"rgba(16,185,129,0.4)":"#1e293b"}`,
      background:copied?"rgba(16,185,129,0.08)":"rgba(15,23,42,0.7)",
      transition:"all 0.3s",
    }}>
      <span style={{color:"#94a3b8",fontSize:13,flexShrink:0}}>O'yin kodi:</span>
      <span style={{fontFamily:"monospace",color:"#f59e0b",fontWeight:700,fontSize:13,flex:1,textAlign:"center"}}>
        {gameId}
      </span>
      <span style={{
        fontSize:11,padding:"3px 10px",borderRadius:999,flexShrink:0,
        border:`1px solid ${copied?"#10b981":"#475569"}`,
        color:copied?"#10b981":"#94a3b8",
        background:copied?"rgba(16,185,129,0.12)":"rgba(71,85,105,0.2)",
        transition:"all 0.3s",
      }}>
        {copied?"✓ Nusxalandi!":"📋 Bosib nusxalang"}
      </span>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════
// OPPONENT BAR
// ═══════════════════════════════════════════════════════════════
const OpponentBar = ({ game, myUserId, styleId }) => {
  const [opData, setOpData] = useState(null);
  const opId     = game?.player1===myUserId ? game?.player2 : game?.player1;
  const opRating = game?.player1===myUserId ? game?.player2Rating : game?.player1Rating;

  useEffect(()=>{
    if(!opId) return;
    getDoc(doc(db,"users",opId)).then(s=>s.exists()&&setOpData(s.data()));
  },[opId]);

  if (!game||game.status==="waiting"||!opId) return null;

  const s = getPieceStyle(styleId);
  const name = opData?.displayName||opData?.email?.split("@")[0]||opId.slice(0,10);

  return (
    <div style={{
      display:"flex",alignItems:"center",gap:12,padding:"10px 16px",
      borderRadius:12,border:"1px solid rgba(51,65,85,0.5)",
      background:"rgba(15,23,42,0.5)",
    }}>
      <div style={{
        width:36,height:36,borderRadius:"50%",flexShrink:0,
        background:`radial-gradient(circle at 35% 30%,${s.bFrom},${s.bTo})`,
        boxShadow:`0 0 0 2px ${s.bRing}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:16,
      }}>
        <span style={{filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.8))"}}>
          {PIECES["bK"]}
        </span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {name}
        </div>
        {opData?.email && (
          <div style={{color:"#475569",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {opData.email}
          </div>
        )}
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{color:"#34d399",fontWeight:700,fontSize:14}}>{opData?.rating??opRating??1000}</div>
        <div style={{color:"#475569",fontSize:11}}>{opData?.wins??0}W / {opData?.losses??0}L</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════
const Leaderboard = ({ visible, onClose }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(()=>{
    if(!visible) return;
    setLoading(true);
    (async()=>{
      const q = query(collection(db,"chess_users"),orderBy("rating","desc"),limit(10));
      const snap = await getDocs(q);
      setRows(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    })();
  },[visible]);

  if(!visible) return null;
  const medals=["🥇","🥈","🥉"];
  const mColors=["#f59e0b","#94a3b8","#f97316"];

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:"fixed",inset:0,zIndex:200,
      background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,
    }}>
      <div style={{
        background:"#0d1420",border:"1px solid #1e293b",borderRadius:20,
        width:"100%",maxWidth:440,boxShadow:"0 24px 80px rgba(0,0,0,0.7)",overflow:"hidden",
      }}>
        <div style={{
          display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"18px 24px",borderBottom:"1px solid #1e293b",
          background:"linear-gradient(135deg,#131e35,#0d1420)",
        }}>
          <span style={{fontSize:18,fontWeight:700,color:"#f59e0b"}}>♟ Shaxmat Reytingi</span>
          <button onClick={onClose} style={{
            width:32,height:32,borderRadius:"50%",border:"none",
            background:"#1e293b",color:"#94a3b8",cursor:"pointer",fontSize:18,
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>×</button>
        </div>
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:8,maxHeight:"72vh",overflowY:"auto"}}>
          {loading&&(
            <div style={{textAlign:"center",padding:"40px 0",color:"#475569"}}>
              <div style={{width:28,height:28,border:"2px solid #f59e0b",borderTopColor:"transparent",
                borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>
              Yuklanmoqda…
            </div>
          )}
          {!loading&&rows.map((r,i)=>(
            <div key={r.id} style={{
              display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:12,
              border:`1px solid ${i<3?mColors[i]+"30":"#1e293b"}`,
              background:i<3?mColors[i]+"0d":"rgba(15,23,42,0.5)",
            }}>
              <span style={{width:28,textAlign:"center",fontWeight:900,fontSize:16,flexShrink:0,color:i<3?mColors[i]:"#475569"}}>
                {i<3?medals[i]:i+1}
              </span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {r.displayName||r.email?.split("@")[0]||r.id.slice(0,10)}
                </div>
                {r.email&&<div style={{color:"#475569",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.email}</div>}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{color:"#34d399",fontWeight:800,fontSize:15}}>{r.rating??1000}</div>
                <div style={{color:"#475569",fontSize:11}}>{r.wins??0}W / {r.losses??0}L</div>
              </div>
            </div>
          ))}
          {!loading&&rows.length===0&&(
            <p style={{textAlign:"center",color:"#475569",padding:"40px 0"}}>Ma'lumot yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════
const SettingsModal = ({ visible, onClose, boardThemeIdx, setBoardThemeIdx, pieceStyleId, setPieceStyleId, boardFlipped, setBoardFlipped }) => {
  if(!visible) return null;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:"fixed",inset:0,zIndex:200,
      background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,
    }}>
      <div style={{
        background:"#0d1420",border:"1px solid #1e293b",borderRadius:20,
        width:"100%",maxWidth:420,boxShadow:"0 24px 80px rgba(0,0,0,0.7)",overflow:"hidden",
      }}>
        <div style={{
          display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"18px 24px",borderBottom:"1px solid #1e293b",
          background:"linear-gradient(135deg,#131e35,#0d1420)",
        }}>
          <span style={{fontSize:17,fontWeight:700,color:"#f1f5f9"}}>⚙️ Sozlamalar</span>
          <button onClick={onClose} style={{
            width:32,height:32,borderRadius:"50%",border:"none",
            background:"#1e293b",color:"#94a3b8",cursor:"pointer",fontSize:18,
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>×</button>
        </div>
        <div style={{padding:20,display:"flex",flexDirection:"column",gap:24}}>

          {/* Board flip */}
          <div>
            <p style={{color:"#cbd5e1",fontSize:13,fontWeight:600,marginBottom:8}}>🔄 Doskani aylantirish</p>
            <button onClick={()=>setBoardFlipped(v=>!v)} style={{
              width:"100%",padding:"10px 16px",borderRadius:10,cursor:"pointer",
              border:`1px solid ${boardFlipped?"rgba(96,165,250,0.4)":"#334155"}`,
              background:boardFlipped?"rgba(59,130,246,0.12)":"rgba(15,23,42,0.6)",
              color:boardFlipped?"#93c5fd":"#94a3b8",fontWeight:600,fontSize:13,transition:"all 0.2s",
            }}>
              {boardFlipped?"✅ Aylantirilgan holat":"Standart holat — bosib o'zgartiring"}
            </button>
          </div>

          {/* Board theme */}
          <div>
            <p style={{color:"#cbd5e1",fontSize:13,fontWeight:600,marginBottom:10}}>🎨 Doska uslubi</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {BOARD_THEMES.map((t,i)=>(
                <button key={i} onClick={()=>setBoardThemeIdx(i)} style={{
                  borderRadius:10,overflow:"hidden",cursor:"pointer",border:"none",
                  outline:boardThemeIdx===i?"2.5px solid #f59e0b":"2.5px solid transparent",
                  transform:boardThemeIdx===i?"scale(1.05)":"scale(1)",transition:"all 0.2s",
                  boxShadow:boardThemeIdx===i?"0 0 12px rgba(245,158,11,0.3)":"none",
                }}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",height:28}}>
                    {[0,1,2,3].map(k=>(
                      <div key={k} style={{background:k%2===0?t.light:t.dark}}/>
                    ))}
                  </div>
                  <div style={{background:"#0f172a",color:"#94a3b8",fontSize:11,textAlign:"center",padding:"5px 0"}}>{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Piece style */}
          <div>
            <p style={{color:"#cbd5e1",fontSize:13,fontWeight:600,marginBottom:10}}>♟ Dona uslubi</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {PIECE_STYLES.map(s=>(
                <button key={s.id} onClick={()=>setPieceStyleId(s.id)} style={{
                  borderRadius:10,padding:"10px 6px",cursor:"pointer",border:"none",
                  background:pieceStyleId===s.id?"rgba(250,204,21,0.1)":"rgba(15,23,42,0.5)",
                  outline:pieceStyleId===s.id?"2px solid #facc15":"2px solid transparent",
                  transform:pieceStyleId===s.id?"scale(1.05)":"scale(1)",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:6,transition:"all 0.2s",
                }}>
                  <div style={{display:"flex",gap:4}}>
                    <div style={{width:20,height:20,borderRadius:"50%",
                      background:`radial-gradient(circle at 35% 30%,${s.wFrom},${s.wTo})`,
                      boxShadow:`0 0 0 1.5px ${s.wRing}`}}/>
                    <div style={{width:20,height:20,borderRadius:"50%",
                      background:`radial-gradient(circle at 35% 30%,${s.bFrom},${s.bTo})`,
                      boxShadow:`0 0 0 1.5px ${s.bRing}`}}/>
                  </div>
                  <span style={{color:"#94a3b8",fontSize:11}}>{s.name}</span>
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
// MOVE HISTORY
// ═══════════════════════════════════════════════════════════════
const MoveHistory = ({ history }) => {
  const ref = useRef(null);
  useEffect(()=>{
    if(ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  },[history]);

  if(!history?.length) return null;
  const pairs = [];
  for(let i=0;i<history.length;i+=2) pairs.push([history[i],history[i+1]]);

  return (
    <div style={{
      background:"rgba(15,23,42,0.5)",border:"1px solid #1e293b",borderRadius:12,
      padding:12,maxHeight:120,overflowY:"auto",
    }} ref={ref}>
      <div style={{display:"flex",flexWrap:"wrap",gap:"2px 12px"}}>
        {pairs.map((pair,i)=>(
          <span key={i} style={{fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>
            <span style={{color:"#475569",marginRight:4}}>{i+1}.</span>
            <span style={{color:"#94a3b8",marginRight:6}}>{pair[0]}</span>
            {pair[1]&&<span style={{color:"#64748b"}}>{pair[1]}</span>}
          </span>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MOVE NOTATION
// ═══════════════════════════════════════════════════════════════
function getMoveNotation(board, move) {
  const piece = board[move.from];
  const type  = pieceType(piece);
  const [tr,tc] = sqToRC(move.to);
  const capture = board[move.to] || move.enPassant!==undefined ? "x" : "";
  const dest = FILES[tc]+RANKS[tr];
  if (move.castle==="K") return "O-O";
  if (move.castle==="Q") return "O-O-O";
  if (type==="P") {
    if (capture) return FILES[move.from%8]+"x"+dest;
    return dest;
  }
  return type+capture+dest+(move.promo?"="+pieceType(move.promo):"");
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Chess() {
  const { user } = useContext(AuthContext);

  // ── Game state ──
  const [gameId, setGameId]           = useState("");
  const [inputId, setInputId]         = useState("");
  const [game, setGame]               = useState(null);
  const [selected, setSelected]       = useState(null);
  const [legalMoves, setLegalMoves]   = useState([]);
  const [promoMove, setPromoMove]     = useState(null); // pending promotion
  const [notification, setNotification] = useState(null);
  const [myRating, setMyRating]       = useState(1000);

  // ── Visual ──
  const [boardThemeIdx, setBoardThemeIdx] = useState(()=>+(localStorage.getItem("ch_board")??0));
  const [pieceStyleId, setPieceStyleId]   = useState(()=>localStorage.getItem("ch_piece")||"classic");
  const [boardFlipped, setBoardFlipped]   = useState(()=>localStorage.getItem("ch_flip")==="1");
  const [chosenSide, setChosenSide]       = useState("w"); // "w" or "b" before game creation

  // ── UI ──
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings]       = useState(false);

  useEffect(()=>{localStorage.setItem("ch_board",boardThemeIdx);},[boardThemeIdx]);
  useEffect(()=>{localStorage.setItem("ch_piece",pieceStyleId);},[pieceStyleId]);
  useEffect(()=>{localStorage.setItem("ch_flip",boardFlipped?"1":"0");},[boardFlipped]);

  // My color in current game
  const myColor = useCallback(()=>{
    if(!game||!user) return null;
    return game.player1===user.uid ? game.player1Side : game.player2Side;
  },[game,user]);

  // Load my rating
  useEffect(()=>{
    if(!user) return;
    getDoc(doc(db,"chess_users",user.uid)).then(s=>{
      if(s.exists()) setMyRating(s.data().rating??1000);
    });
  },[user]);

  // Realtime listener
  useEffect(()=>{
    if(!gameId) return;
    return onSnapshot(doc(db,"chess_games",gameId), snap=>{
      if(snap.exists()) setGame({id:snap.id,...snap.data()});
    });
  },[gameId]);

  const showNotif = (msg, ms=3000) => {
    setNotification(msg);
    setTimeout(()=>setNotification(null), ms);
  };

  // ── CREATE ──
  const createGame = async () => {
    const id = `chess_${Date.now()}`;
    const mySide = chosenSide;
    const opSide = mySide==="w"?"b":"w";
    const initBoard = INITIAL_BOARD();
    await setDoc(doc(db,"chess_games",id),{
      board: initBoard,
      player1: user.uid,
      player1Email: user.email||"",
      player1Name: user.displayName||user.email?.split("@")[0]||user.uid.slice(0,8),
      player1Side: mySide,
      player2: "",
      player2Email: "",
      player2Name: "",
      player2Side: opSide,
      player1Rating: myRating,
      player2Rating: 1000,
      turn: "w",           // oq har doim boshlaydi
      status: "waiting",
      winner: "",
      castleRights: {wK:true,wQ:true,bK:true,bQ:true},
      enPassant: null,
      moveCount: 0,
      history: [],
      captured: [],
    });
    setGameId(id);
    setSelected(null); setLegalMoves([]);
    showNotif("✅ O'yin yaratildi! ID bosib nusxalang");
  };

  // ── JOIN ──
  const joinGame = async () => {
    const id = inputId.trim();
    if(!id) return;
    const ref = doc(db,"chess_games",id);
    const snap = await getDoc(ref);
    if(!snap.exists()) { showNotif("❌ O'yin topilmadi"); return; }
    const data = snap.data();
    if(data.status!=="waiting") { showNotif("❌ O'yin allaqachon boshlangan"); return; }
    if(data.player1===user.uid) { showNotif("❌ O'z o'yiningizga qo'shila olmaysiz"); return; }
    await updateDoc(ref,{
      player2: user.uid,
      player2Email: user.email||"",
      player2Name: user.displayName||user.email?.split("@")[0]||user.uid.slice(0,8),
      player2Rating: myRating,
      status: "playing",
    });
    setGameId(id);
    showNotif("✅ O'yinga qo'shildingiz!");
  };

  // ── CLICK ──
  const handleClick = (sq) => {
    if(!game||game.status!=="playing"||game.winner) return;
    const color = myColor();
    if(game.turn!==color) return; // not my turn

    const board = game.board;
    const castleRights = game.castleRights||{wK:true,wQ:true,bK:true,bQ:true};
    const enPassant = game.enPassant??null;

    if(selected!==null) {
      // Try to execute move
      const move = legalMoves.find(m=>m.to===sq);
      if(move) {
        // Check pawn promotion (no promo choices in move yet — need modal)
        const piece = board[move.from];
        const [tr] = sqToRC(move.to);
        const isPromoRow = (color==="w"&&tr===0)||(color==="b"&&tr===7);
        if(pieceType(piece)==="P"&&isPromoRow&&!move.promo) {
          // Show promotion modal
          setPromoMove(move);
          return;
        }
        executeMove(move);
        return;
      }
      // Click own piece — reselect
      if(board[sq]&&pieceColor(board[sq])===color) {
        const ml = getLegalMoves(board,sq,castleRights,enPassant);
        setSelected(sq); setLegalMoves(ml);
      } else {
        setSelected(null); setLegalMoves([]);
      }
    } else {
      if(board[sq]&&pieceColor(board[sq])===color) {
        const ml = getLegalMoves(board,sq,castleRights,enPassant);
        setSelected(sq); setLegalMoves(ml);
      }
    }
  };

  const executeMove = async (move) => {
    const board = [...game.board];
    const castleRights = game.castleRights||{wK:true,wQ:true,bK:true,bQ:true};
    const enPassant = game.enPassant??null;
    const captured = [...(game.captured||[])];
    const history  = [...(game.history||[])];
    const color = myColor();

    // Notation before apply
    const notation = getMoveNotation(board, move);

    // Capture tracking
    if(board[move.to]) captured.push(board[move.to]);
    if(move.enPassant!==undefined&&board[move.enPassant]) captured.push(board[move.enPassant]);

    const newBoard = applyMove(board, move);
    const newCastle = updateCastleRights(castleRights, move, board);
    const newEP = move.doublePush ? (move.from+move.to)/2|0 : null;
    const nextTurn = color==="w"?"b":"w";

    // Check game-ending conditions
    const oppMoves = getAllLegalMoves(newBoard, nextTurn, newCastle, newEP);
    const oppInCheck = isInCheck(newBoard, nextTurn);
    let winner = "";
    let newStatus = "playing";
    let finalNotation = notation;

    if(oppMoves.length===0) {
      if(oppInCheck) {
        // Checkmate
        finalNotation += "#";
        winner = user.uid;
        newStatus = "done";
      } else {
        // Stalemate
        newStatus = "done";
        winner = "draw";
      }
    } else if(oppInCheck) {
      finalNotation += "+";
    }

    history.push(finalNotation);

    const updateData = {
      board: newBoard,
      turn: nextTurn,
      castleRights: newCastle,
      enPassant: newEP,
      moveCount: increment(1),
      history,
      captured,
    };

    if(newStatus==="done") {
      updateData.status = "done";
      updateData.winner = winner;

      const opId    = user.uid===game.player1 ? game.player2 : game.player1;
      const opRating = user.uid===game.player1 ? game.player2Rating : game.player1Rating;

      if(winner===user.uid) {
        const delta = calcDelta(true, opRating, myRating);
        await updateDoc(doc(db,"chess_users",user.uid),{wins:increment(1),rating:increment(delta)});
        await updateDoc(doc(db,"chess_users",opId),{losses:increment(1),rating:increment(-delta)});
        showNotif(`🏆 Mat! G'alaba! +${delta} reyting`,4000);
      } else if(winner==="draw") {
        showNotif("🤝 Pat! Durang",4000);
      }
    } else if(oppInCheck) {
      showNotif("⚠️ Shoh ostida!",2000);
    }

    await updateDoc(doc(db,"chess_games",gameId), updateData);
    setSelected(null); setLegalMoves([]); setPromoMove(null);
  };

  const handlePromoChoice = (promoPiece) => {
    if(!promoMove) return;
    executeMove({...promoMove, promo:promoPiece});
  };

  // ── SURRENDER ──
  const surrender = async () => {
    if(!game||game.status!=="playing"||game.winner) return;
    const opId    = user.uid===game.player1 ? game.player2 : game.player1;
    const opRating = user.uid===game.player1 ? game.player2Rating : game.player1Rating;
    const delta = calcDelta(false, opRating, myRating);
    await updateDoc(doc(db,"chess_games",gameId),{winner:opId,status:"done"});
    await updateDoc(doc(db,"chess_users",user.uid),{losses:increment(1),rating:increment(-Math.abs(delta))});
    await updateDoc(doc(db,"chess_users",opId),{wins:increment(1),rating:increment(Math.abs(delta))});
    showNotif("🏳️ Taslim bo'ldingiz");
  };

  const resetGame = () => {
    setGameId(""); setGame(null);
    setSelected(null); setLegalMoves([]); setPromoMove(null);
  };

  // ── DERIVED ──
  const color = game ? myColor() : null;
  const theme = BOARD_THEMES[boardThemeIdx];
  const board = game?.board || [];
  const castleRights = game?.castleRights||{wK:true,wQ:true,bK:true,bQ:true};
  const enPassant = game?.enPassant??null;

  // Flip: if I'm black OR manual flip
  const autoFlip  = color === "b";
  const shouldFlip = boardFlipped ? !autoFlip : autoFlip;

  // King in check squares
  const wKsq = board.findIndex(p=>p==="wK");
  const bKsq = board.findIndex(p=>p==="bK");
  const wInCheck = game&&isInCheck(board,"w");
  const bInCheck = game&&isInCheck(board,"b");

  // Which squares to show as possible moves
  const moveSqs  = new Set(legalMoves.map(m=>m.to));
  const captSqs  = new Set(legalMoves.filter(m=>board[m.to]||m.enPassant!==undefined).map(m=>m.to));

  // Render squares in board order, but reversed when flipped
  const squareIndices = Array.from({length:64},(_,i)=>i);
  const displayOrder  = shouldFlip ? [...squareIndices].reverse() : squareIndices;

  const myPieceStyle = getPieceStyle(pieceStyleId);

  return (
    <div style={{
      minHeight:"100vh",color:"#f1f5f9",
      background:"radial-gradient(ellipse at 20% 10%, #0f1d35 0%, #080e1a 55%, #040810 100%)",
      fontFamily:"'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      {/* Toast */}
      {notification&&(
        <div style={{
          position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",
          zIndex:300,background:"#0f172a",border:"1px solid #1e293b",
          padding:"11px 24px",borderRadius:999,fontSize:14,fontWeight:500,color:"#f1f5f9",
          boxShadow:"0 8px 40px rgba(0,0,0,0.6)",animation:"toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          whiteSpace:"nowrap",
        }}>{notification}</div>
      )}

      {/* Promotion modal */}
      {promoMove&&(
        <PromoModal color={color} styleId={pieceStyleId} onChoose={handlePromoChoice}/>
      )}

      <Leaderboard visible={showLeaderboard} onClose={()=>setShowLeaderboard(false)}/>
      <SettingsModal
        visible={showSettings} onClose={()=>setShowSettings(false)}
        boardThemeIdx={boardThemeIdx} setBoardThemeIdx={setBoardThemeIdx}
        pieceStyleId={pieceStyleId} setPieceStyleId={setPieceStyleId}
        boardFlipped={boardFlipped} setBoardFlipped={setBoardFlipped}
      />

      <div style={{maxWidth:660,margin:"0 auto",padding:"0 16px 40px"}}>

        {/* ── HEADER ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:20,marginBottom:16}}>
          <div>
            <h1 style={{fontSize:30,fontWeight:900,letterSpacing:"-0.5px",margin:0}}>
              <span style={{color:"#f59e0b"}}>♟</span>
              <span style={{marginLeft:8,background:"linear-gradient(90deg,#f59e0b,#f97316)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SHAXMAT</span>
            </h1>
            <p style={{color:"#475569",fontSize:12,margin:"3px 0 0"}}>
              Reyting: <span style={{color:"#34d399",fontWeight:700}}>{myRating}</span>
              {color&&<span style={{color:"#64748b",marginLeft:8}}>
                · {color==="w"?"⬜ Oq tosh":"⬛ Qora tosh"}
              </span>}
            </p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowSettings(true)} style={{
              padding:"8px 12px",borderRadius:10,cursor:"pointer",
              border:"1px solid #1e293b",background:"rgba(15,23,42,0.6)",color:"#94a3b8",fontSize:16,
            }} title="Sozlamalar">⚙️</button>
            <button onClick={()=>setShowLeaderboard(true)} style={{
              padding:"8px 14px",borderRadius:10,cursor:"pointer",
              border:"1px solid rgba(245,158,11,0.3)",background:"rgba(245,158,11,0.08)",
              color:"#f59e0b",fontSize:13,fontWeight:600,
            }}>🏆 Reyting</button>
          </div>
        </div>

        {/* ── LOBBY ── */}
        {!gameId&&(
          <div style={{
            background:"rgba(15,23,42,0.7)",border:"1px solid #1e293b",
            borderRadius:16,padding:20,marginBottom:16,
          }}>
            {/* Side selection */}
            <div style={{marginBottom:16}}>
              <p style={{color:"#94a3b8",fontSize:13,fontWeight:600,marginBottom:8}}>
                ♟ Qaysi tosh rangida o'ynaysiz?
              </p>
              <div style={{display:"flex",gap:8}}>
                {[
                  {val:"w",label:"⬜ Oq tosh",sub:"Avval yuradi"},
                  {val:"b",label:"⬛ Qora tosh",sub:"Ikkinchi yuradi"},
                ].map(opt=>(
                  <button key={opt.val} onClick={()=>setChosenSide(opt.val)} style={{
                    flex:1,padding:"12px 8px",borderRadius:12,cursor:"pointer",
                    border:`1px solid ${chosenSide===opt.val?"rgba(250,204,21,0.5)":"#1e293b"}`,
                    background:chosenSide===opt.val?"rgba(250,204,21,0.1)":"rgba(15,23,42,0.5)",
                    transition:"all 0.2s",
                  }}>
                    <div style={{fontSize:22,marginBottom:4}}>{opt.label.split(" ")[0]}</div>
                    <div style={{color:chosenSide===opt.val?"#facc15":"#64748b",fontWeight:600,fontSize:13}}>{opt.label.split(" ")[1]+" "+opt.label.split(" ")[2]}</div>
                    <div style={{color:"#334155",fontSize:11,marginTop:2}}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{borderTop:"1px solid #1e293b",marginBottom:16}}/>

            <button onClick={createGame} style={{
              width:"100%",padding:"13px 0",borderRadius:12,cursor:"pointer",
              border:"none",fontWeight:700,fontSize:15,color:"#fff",
              background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
              boxShadow:"0 4px 20px rgba(37,99,235,0.35)",marginBottom:12,
            }}>♟ Yangi o'yin yaratish</button>

            <div style={{display:"flex",gap:8}}>
              <input value={inputId} onChange={e=>setInputId(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&joinGame()}
                placeholder="Do'stingizning o'yin ID kiriting…"
                style={{
                  flex:1,padding:"10px 14px",borderRadius:10,fontSize:13,
                  border:"1px solid #1e293b",background:"#060c18",
                  color:"#f1f5f9",outline:"none",
                }}
              />
              <button onClick={joinGame} style={{
                padding:"10px 18px",borderRadius:10,cursor:"pointer",
                border:"none",fontWeight:600,fontSize:13,color:"#fff",background:"#059669",
              }}>Qo'shilish</button>
            </div>
          </div>
        )}

        {/* ── GAME ID ── */}
        {gameId&&game&&<div style={{marginBottom:10}}><GameIdBadge gameId={gameId}/></div>}

        {/* ── OPPONENT ── */}
        {game&&game.status==="playing"&&(
          <div style={{marginBottom:10}}>
            <OpponentBar game={game} myUserId={user.uid} styleId={pieceStyleId}/>
          </div>
        )}

        {/* ── STATUS BAR ── */}
        {game&&(()=>{
          const iWon = game.winner===user.uid;
          const isDraw = game.winner==="draw";
          const myTurn = game.turn===color;

          if(game.winner) return (
            <div style={{
              borderRadius:12,padding:"12px 24px",textAlign:"center",fontWeight:700,fontSize:17,
              border:`1px solid ${isDraw?"rgba(245,158,11,0.3)":iWon?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,
              background:isDraw?"rgba(245,158,11,0.08)":iWon?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",
              color:isDraw?"#fcd34d":iWon?"#6ee7b7":"#fca5a5",
              marginBottom:10,
            }}>
              {isDraw?"🤝 Pat! Durang":iWon?"♔ Mat! Siz g'alaba qozondingiz!":"♚ Raqib g'alaba qildi"}
            </div>
          );
          if(game.status==="waiting") return (
            <div style={{
              borderRadius:12,padding:"12px 24px",textAlign:"center",
              color:"#fcd34d",border:"1px solid rgba(245,158,11,0.3)",
              background:"rgba(245,158,11,0.08)",marginBottom:10,
            }}>⏳ Raqib kutilmoqda…</div>
          );

          // My turn color indicator
          const myCheckStr = (color==="w"&&wInCheck)||(color==="b"&&bInCheck) ? " — ⚠️ SHOH OSTIDA!" : "";
          return (
            <div style={{
              borderRadius:12,padding:"10px 20px",marginBottom:10,
              display:"flex",alignItems:"center",justifyContent:"space-between",
              border:`1px solid ${myTurn?"rgba(96,165,250,0.3)":"rgba(51,65,85,0.4)"}`,
              background:myTurn?"rgba(59,130,246,0.1)":"rgba(30,41,59,0.3)",
              transition:"all 0.4s ease",
            }}>
              {/* Captured by opp */}
              <CapturedPieces captured={game.captured||[]} color={color} styleId={pieceStyleId}/>
              <span style={{fontWeight:600,fontSize:13,color:myTurn?"#93c5fd":"#64748b",animation:myTurn?"pulseText 1.5s ease-in-out infinite":"none"}}>
                {myTurn?`⚡ Sizning navbat${myCheckStr}`:"⏳ Raqib o'ylayapti…"}
              </span>
              <CapturedPieces captured={game.captured||[]} color={color==="w"?"b":"w"} styleId={pieceStyleId}/>
            </div>
          );
        })()}

        {/* ── BOARD ── */}
        {game&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>

            {/* Flip button */}
            {game.status==="playing"&&(
              <button onClick={()=>setBoardFlipped(v=>!v)} style={{
                display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:8,cursor:"pointer",
                border:"1px solid #1e293b",background:"rgba(15,23,42,0.5)",color:"#64748b",fontSize:12,
              }}>
                🔄 {shouldFlip?"Standart holat":"Doskani aylantirish"}
              </button>
            )}

            {/* Board container */}
            <div>
              {/* Rank labels top */}
              <div style={{display:"flex",marginBottom:2}}>
                <div style={{width:20}}/>
                {(shouldFlip?[...FILES].reverse():FILES).map(f=>(
                  <div key={f} style={{width:56,textAlign:"center",fontSize:11,color:"#475569"}}>{f}</div>
                ))}
              </div>

              <div style={{display:"flex"}}>
                {/* File labels left */}
                <div style={{display:"flex",flexDirection:"column",marginRight:2}}>
                  {(shouldFlip?[...RANKS].reverse():RANKS).map(r=>(
                    <div key={r} style={{height:56,display:"flex",alignItems:"center",justifyContent:"center",
                      width:20,fontSize:11,color:"#475569"}}>{r}</div>
                  ))}
                </div>

                {/* Board */}
                <div style={{
                  borderRadius:10,overflow:"hidden",
                  border:`3px solid ${theme.border}`,
                  boxShadow:`0 12px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.04)`,
                }}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(8,56px)"}}>
                    {displayOrder.map(sq=>{
                      const row = Math.floor(sq/8), col = sq%8;
                      const isDark = (row+col)%2===1;
                      const piece  = board[sq];
                      const pColor = pieceColor(piece);
                      const isSel  = selected===sq;
                      const isMove = moveSqs.has(sq);
                      const isCapt = captSqs.has(sq);
                      const isKingCheck =
                        (sq===wKsq&&wInCheck)||(sq===bKsq&&bInCheck);
                      const isLastMove = game.history?.length>0 && false; // could track lastMove separately

                      let bg = isDark ? theme.dark : theme.light;
                      if(isSel) bg = theme.accent;

                      return (
                        <div key={sq} onClick={()=>handleClick(sq)} style={{
                          width:56,height:56,background:bg,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          position:"relative",cursor:"pointer",userSelect:"none",
                          outline:isKingCheck?"3px solid #ef444488 inset":"none",
                          boxShadow:isKingCheck?"inset 0 0 12px rgba(239,68,68,0.5)":"none",
                          transition:"background 0.2s ease",
                        }}>
                          {/* Move hint */}
                          {isMove&&!piece&&(
                            <>
                              <div style={{position:"absolute",width:18,height:18,borderRadius:"50%",
                                background:"rgba(74,222,128,0.3)",animation:"pingDot 1.3s ease-in-out infinite"}}/>
                              <div style={{position:"absolute",width:12,height:12,borderRadius:"50%",
                                background:"rgba(74,222,128,0.85)",boxShadow:"0 0 8px rgba(74,222,128,0.6)"}}/>
                            </>
                          )}
                          {/* Capture hint */}
                          {isCapt&&piece&&(
                            <div style={{position:"absolute",inset:2,borderRadius:4,
                              border:"3px solid rgba(248,113,113,0.9)",
                              boxShadow:"inset 0 0 8px rgba(248,113,113,0.3)",
                              animation:"captureGlow 1s ease-in-out infinite alternate",pointerEvents:"none"}}/>
                          )}
                          {/* King in check */}
                          {isKingCheck&&(
                            <div style={{position:"absolute",inset:0,
                              background:"rgba(239,68,68,0.15)",borderRadius:2,pointerEvents:"none"}}/>
                          )}
                          {/* Piece */}
                          {piece&&(
                            <ChessPiece
                              piece={piece}
                              styleId={pieceStyleId}
                              selected={isSel}
                              inCheck={isKingCheck}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* File labels right */}
                <div style={{display:"flex",flexDirection:"column",marginLeft:2}}>
                  {(shouldFlip?[...RANKS].reverse():RANKS).map(r=>(
                    <div key={r} style={{height:56,display:"flex",alignItems:"center",justifyContent:"center",
                      width:20,fontSize:11,color:"#475569"}}>{r}</div>
                  ))}
                </div>
              </div>

              {/* File labels bottom */}
              <div style={{display:"flex",marginTop:2}}>
                <div style={{width:20}}/>
                {(shouldFlip?[...FILES].reverse():FILES).map(f=>(
                  <div key={f} style={{width:56,textAlign:"center",fontSize:11,color:"#475569"}}>{f}</div>
                ))}
              </div>
            </div>

            {/* Move history */}
            {game.history?.length>0&&(
              <div style={{width:"100%"}}>
                <MoveHistory history={game.history}/>
              </div>
            )}

            {/* Move count + info */}
            <div style={{color:"#334155",fontSize:11,textAlign:"center"}}>
              {color==="w"?"⬜ Siz — oq tosh (pastda)":"⬛ Siz — qora tosh (pastda)"}
              {"  ·  "}
              {game.moveCount??0} ta yurish
            </div>

            {/* Action buttons */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
              {game.status==="playing"&&!game.winner&&(
                <button onClick={surrender} style={{
                  padding:"9px 20px",borderRadius:10,cursor:"pointer",
                  border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",
                  color:"#f87171",fontSize:13,fontWeight:600,
                }}>🏳️ Taslim bo'lish</button>
              )}
              {(game.winner||game.status==="done")&&(
                <button onClick={resetGame} style={{
                  padding:"11px 28px",borderRadius:12,cursor:"pointer",border:"none",
                  fontWeight:700,fontSize:14,color:"#fff",
                  background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
                  boxShadow:"0 4px 20px rgba(37,99,235,0.35)",
                }}>🔄 Yangi o'yin</button>
              )}
            </div>
          </div>
        )}

        {/* ── RULES ── */}
        {!game&&(
          <details style={{
            background:"rgba(15,23,42,0.4)",border:"1px solid #1e293b",
            borderRadius:12,overflow:"hidden",marginTop:8,
          }}>
            <summary style={{padding:"12px 16px",cursor:"pointer",color:"#64748b",fontSize:13,userSelect:"none"}}>
              📖 Shaxmat qoidalari
            </summary>
            <div style={{padding:"0 16px 16px",color:"#475569",fontSize:13,lineHeight:2}}>
              <p>• Oq tosh har doim birinchi yuradi</p>
              <p>• Har bir dona o'ziga xos tarzda harakat qiladi</p>
              <p>• <b style={{color:"#94a3b8"}}>Shoh ostida:</b> raqib shohingizga hujum qilsa, uni qutqarishingiz kerak</p>
              <p>• <b style={{color:"#94a3b8"}}>Mat:</b> shohni qutqarib bo'lmasa — g'alaba!</p>
              <p>• <b style={{color:"#94a3b8"}}>Pat:</b> yurish imkoni yo'q ammo shoh ostida bo'lmasa — durang</p>
              <p>• <b style={{color:"#94a3b8"}}>Rokkirovka:</b> shoh va rok maxsus yurish qilishi mumkin</p>
              <p>• <b style={{color:"#94a3b8"}}>En passant:</b> piyoda maxsus urish qoidasi</p>
              <p>• <b style={{color:"#94a3b8"}}>Piyoda tanlash:</b> oxirgi qatorga yetganda boshqa donaga aylanadi</p>
            </div>
          </details>
        )}
      </div>

      <style>{`
        @keyframes pingDot {
          0%,100% { transform:scale(1); opacity:0.7; }
          50%      { transform:scale(1.8); opacity:0; }
        }
        @keyframes captureGlow {
          from { border-color:rgba(248,113,113,0.7); }
          to   { border-color:rgba(248,113,113,1); }
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
