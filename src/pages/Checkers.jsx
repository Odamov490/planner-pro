import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, increment,
  collection, query, orderBy, limit, getDocs
} from "firebase/firestore";

// ─── BOARD SETUP ──────────────────────────────────────────────────────────────
const createBoard = () => {
  const b = Array(64).fill("");
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 8; j++)
      if ((i + j) % 2 === 1) b[i * 8 + j] = "b";
  for (let i = 5; i < 8; i++)
    for (let j = 0; j < 8; j++)
      if ((i + j) % 2 === 1) b[i * 8 + j] = "w";
  return b;
};

const inside = (i, j) => i >= 0 && i < 8 && j >= 0 && j < 8;

// ─── MOVE ENGINE ──────────────────────────────────────────────────────────────
const getMoves = (i, j, board, piece, onlyEat = false) => {
  const res = [];
  const isKing = piece.includes("k");
  const dirs = [];
  if (piece.startsWith("b") || isKing) dirs.push([1, -1], [1, 1]);
  if (piece.startsWith("w") || isKing) dirs.push([-1, -1], [-1, 1]);

  dirs.forEach(([di, dj]) => {
    let ni = i + di, nj = j + dj;
    while (inside(ni, nj)) {
      const idx = ni * 8 + nj;
      if (board[idx] === "") {
        if (!onlyEat) res.push({ i: ni, j: nj });
        if (!isKing) break;
        ni += di; nj += dj;
        continue;
      }
      if (board[idx][0] !== piece[0]) {
        const ti = ni + di, tj = nj + dj;
        if (inside(ti, tj) && board[ti * 8 + tj] === "") {
          res.push({ i: ti, j: tj, eat: { i: ni, j: nj } });
        }
      }
      break;
    }
  });

  return onlyEat ? res.filter(m => m.eat) : res;
};

const hasCapture = (board, color) =>
  board.some((cell, idx) => {
    if (!cell || !cell.startsWith(color)) return false;
    const i = Math.floor(idx / 8), j = idx % 8;
    return getMoves(i, j, board, cell, true).length > 0;
  });

const countPieces = (board, color) => board.filter(c => c && c.startsWith(color)).length;

// ─── RATING ───────────────────────────────────────────────────────────────────
const calcRatingDelta = (won, opponentRating, myRating) => {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
  return Math.round(K * ((won ? 1 : 0) - expected));
};

// ─── BOARD THEME PRESETS ─────────────────────────────────────────────────────
const BOARD_THEMES = [
  { name: "Klassik",  dark: "#1e3a28", light: "#c8a87a", accent: "#2a5c3a" },
  { name: "Okean",    dark: "#1a3a5c", light: "#a8c8e8", accent: "#2a5c8a" },
  { name: "Atirgul",  dark: "#5c1a3a", light: "#e8a8c8", accent: "#8a2a5c" },
  { name: "Oltin",    dark: "#3a2a0a", light: "#f0d080", accent: "#6a4a10" },
  { name: "Tun",      dark: "#111827", light: "#374151", accent: "#1f2937" },
  { name: "Ametist",  dark: "#2d1b69", light: "#c4b5fd", accent: "#4c1d95" },
];

// ─── PIECE COLOR PRESETS ──────────────────────────────────────────────────────
const PIECE_COLORS = {
  b: [
    { name: "Qora",   from: "#374151", to: "#111827", ring: "#4b5563" },
    { name: "Qizil",  from: "#991b1b", to: "#7f1d1d", ring: "#dc2626" },
    { name: "Ko'k",   from: "#1e3a8a", to: "#1e40af", ring: "#3b82f6" },
    { name: "Yashil", from: "#14532d", to: "#166534", ring: "#22c55e" },
  ],
  w: [
    { name: "Oq",     from: "#fef3c7", to: "#fde68a", ring: "#d97706" },
    { name: "Kumush", from: "#e2e8f0", to: "#cbd5e1", ring: "#94a3b8" },
    { name: "Oltin",  from: "#fef08a", to: "#fbbf24", ring: "#f59e0b" },
    { name: "Pushti", from: "#fce7f3", to: "#fbcfe8", ring: "#ec4899" },
  ],
};

// ─── PIECE ────────────────────────────────────────────────────────────────────
const PieceSVG = ({ color, isKing, selected, pieceStyle }) => {
  const style = pieceStyle || PIECE_COLORS[color][0];
  return (
    <div style={{
      width: 42, height: 42, borderRadius: "50%",
      background: `linear-gradient(135deg, ${style.from}, ${style.to})`,
      boxShadow: `0 0 0 3px ${style.ring}, inset 0 2px 4px rgba(255,255,255,0.2)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: selected ? "translateY(-4px) scale(1.12)" : "scale(1)",
      transition: "transform 0.15s ease",
      outline: selected ? "3px solid #facc15" : "none",
      outlineOffset: 2,
    }}>
      {isKing && (
        <span style={{ fontSize: 18, lineHeight: 1, userSelect: "none",
          color: color === "b" ? "#facc15" : "#92400e" }}>
          ♛
        </span>
      )}
    </div>
  );
};

// ─── GAME ID BADGE — auto copy on click ───────────────────────────────────────
const GameIdBadge = ({ gameId }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(gameId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-2.5
        border border-slate-600/50 bg-slate-800/60 hover:bg-slate-700/60 transition-colors group"
    >
      <span className="text-slate-400 text-sm shrink-0">O'yin kodi:</span>
      <span className="font-mono text-amber-400 font-bold text-sm flex-1 text-center
        group-hover:text-amber-300 transition-colors truncate">
        {gameId}
      </span>
      <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 transition-all
        ${copied
          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          : "bg-slate-700 text-slate-400 border-slate-600"}`}>
        {copied ? "✓ Nusxalandi!" : "📋 Bosib nusxalang"}
      </span>
    </button>
  );
};

// ─── OPPONENT INFO BAR ────────────────────────────────────────────────────────
const OpponentBar = ({ game, myUserId }) => {
  const [opData, setOpData] = useState(null);

  const opId = game?.player1 === myUserId ? game?.player2 : game?.player1;
  const opRating = game?.player1 === myUserId ? game?.player2Rating : game?.player1Rating;

  useEffect(() => {
    if (!opId) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", opId));
      if (snap.exists()) setOpData(snap.data());
    })();
  }, [opId]);

  if (!game || game.status === "waiting" || !opId) return null;

  const name = opData?.displayName || opData?.email?.split("@")[0] || opId.slice(0, 10);
  const email = opData?.email || "";
  const initial = name[0]?.toUpperCase() || "?";

  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 border border-slate-700/50 bg-slate-800/40">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black
        border border-slate-600 shrink-0"
        style={{ background: "linear-gradient(135deg,#334155,#1e293b)" }}>
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{name}</div>
        {email && <div className="text-xs text-slate-500 truncate">{email}</div>}
      </div>
      <div className="text-right shrink-0">
        <div className="text-emerald-400 font-bold text-sm">{opData?.rating ?? opRating ?? 1000}</div>
        <div className="text-gray-600 text-xs">{opData?.wins ?? 0}W / {opData?.losses ?? 0}L</div>
      </div>
    </div>
  );
};

// ─── STATUS BAR ───────────────────────────────────────────────────────────────
const StatusBar = ({ game, myColor, userId }) => {
  if (!game) return null;
  const myPieces = countPieces(game.board, myColor);
  const enemyPieces = countPieces(game.board, myColor === "b" ? "w" : "b");

  if (game.winner) {
    const iWon = game.winner === userId;
    return (
      <div className={`rounded-xl px-6 py-3 text-center font-bold text-lg tracking-wide border
        ${iWon ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
               : "bg-red-500/20 text-red-300 border-red-500/30"}`}>
        {iWon ? "🏆 Siz g'alaba qozondingiz!" : "💀 Raqib g'alaba qildi"}
      </div>
    );
  }
  if (game.status === "waiting") {
    return (
      <div className="rounded-xl px-6 py-3 text-center text-amber-300 border border-amber-500/30 bg-amber-500/10">
        ⏳ Raqib kutilmoqda…
      </div>
    );
  }
  const myTurn = game.turn === userId;
  return (
    <div className={`rounded-xl px-6 py-3 flex items-center justify-between border
      ${myTurn ? "bg-blue-500/20 border-blue-400/30" : "bg-slate-700/30 border-slate-600/30"}`}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border border-gray-600"
          style={{ background: myColor === "b" ? "#374151" : "#fef3c7" }}/>
        <span className="text-sm text-gray-300">Siz: <b className="text-white">{myPieces}</b></span>
      </div>
      <span className={`font-semibold ${myTurn ? "text-blue-300 animate-pulse" : "text-gray-400"}`}>
        {myTurn ? "⚡ Sizning navbatingiz" : "⏳ Raqib o'ylayapti…"}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300">Raqib: <b className="text-white">{enemyPieces}</b></span>
        <div className="w-3 h-3 rounded-full border border-gray-400"
          style={{ background: myColor === "b" ? "#fef3c7" : "#374151" }}/>
      </div>
    </div>
  );
};

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
const Leaderboard = ({ visible, onClose }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    (async () => {
      const q = query(collection(db, "users"), orderBy("rating", "desc"), limit(10));
      const snap = await getDocs(q);
      setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })();
  }, [visible]);

  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#12182a] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700/60"
          style={{ background: "linear-gradient(135deg,#1a2540,#12182a)" }}>
          <h2 className="text-xl font-bold text-amber-400">🏆 Reyting jadvali</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600
              text-gray-400 hover:text-white transition-colors flex items-center justify-center font-bold text-lg">
            ×
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="text-center py-10 text-slate-500">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"/>
              Yuklanmoqda…
            </div>
          )}
          {!loading && rows.map((r, i) => (
            <div key={r.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border
                ${i === 0 ? "bg-amber-500/15 border-amber-500/30"
                : i === 1 ? "bg-slate-400/10 border-slate-400/20"
                : i === 2 ? "bg-orange-500/10 border-orange-500/20"
                : "bg-slate-800/40 border-slate-700/30"}`}>
              <span className={`w-8 text-center font-black text-base shrink-0
                ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300"
                : i === 2 ? "text-orange-400" : "text-gray-600"}`}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                {/* Display name */}
                <div className="text-white font-semibold text-sm truncate">
                  {r.displayName || r.email?.split("@")[0] || r.id.slice(0, 10)}
                </div>
                {/* Email — ko'rinib turadi */}
                {r.email && (
                  <div className="text-slate-500 text-xs truncate">{r.email}</div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-emerald-400 font-black text-base">{r.rating ?? 1000}</div>
                <div className="text-gray-600 text-xs">{r.wins ?? 0}W / {r.losses ?? 0}L</div>
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <p className="text-center text-gray-500 py-10">Ma'lumot yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────
const SettingsPanel = ({
  visible, onClose,
  boardThemeIdx, setBoardThemeIdx,
  myPieceColorIdx, setMyPieceColorIdx,
  myColor, boardRotated, setBoardRotated
}) => {
  if (!visible) return null;
  const pieceKey = myColor || "b";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#12182a] border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700/60"
          style={{ background: "linear-gradient(135deg,#1a2540,#12182a)" }}>
          <h2 className="text-lg font-bold text-white">⚙️ Sozlamalar</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600
              text-gray-400 hover:text-white transition-colors flex items-center justify-center font-bold text-lg">
            ×
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* Board rotation */}
          <div>
            <p className="text-slate-300 text-sm font-semibold mb-2">🔄 Doskani aylantirish</p>
            <button
              onClick={() => setBoardRotated(v => !v)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-all
                ${boardRotated
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                  : "bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-600/60"}`}>
              {boardRotated ? "✅ Aylantirilgan (180°)" : "Standart holat — bosib o'zgartiring"}
            </button>
            <p className="text-slate-600 text-xs mt-1.5">
              Oq toshlar odatda yuqorida bo'lishi uchun avtomatik aylanadi. Bu tugma qo'shimcha boshqaruv beradi.
            </p>
          </div>

          {/* Board theme */}
          <div>
            <p className="text-slate-300 text-sm font-semibold mb-3">🎨 Doska rangi</p>
            <div className="grid grid-cols-3 gap-2">
              {BOARD_THEMES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setBoardThemeIdx(i)}
                  className={`rounded-xl overflow-hidden border-2 transition-all
                    ${boardThemeIdx === i ? "border-amber-400 scale-105 shadow-lg shadow-amber-500/20" : "border-transparent hover:border-slate-500"}`}>
                  <div className="grid grid-cols-4" style={{ height: 32 }}>
                    {[0,1,2,3].map(k => (
                      <div key={k} style={{ background: k % 2 === 0 ? t.light : t.dark }}/>
                    ))}
                  </div>
                  <div className="text-xs text-center py-1.5 bg-slate-800/90 text-slate-300">{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Piece color */}
          <div>
            <p className="text-slate-300 text-sm font-semibold mb-3">
              ♟ Sizning tosh rangi ({pieceKey === "b" ? "Qora" : "Oq"})
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PIECE_COLORS[pieceKey].map((c, i) => (
                <button
                  key={i}
                  onClick={() => setMyPieceColorIdx(i)}
                  className={`rounded-xl p-2.5 border-2 flex flex-col items-center gap-1.5 transition-all
                    ${myPieceColorIdx === i
                      ? "border-amber-400 scale-105 bg-slate-700/40"
                      : "border-transparent hover:border-slate-600 bg-slate-800/40"}`}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: `linear-gradient(135deg,${c.from},${c.to})`,
                    boxShadow: `0 0 0 2px ${c.ring}`,
                  }}/>
                  <span className="text-xs text-slate-400">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Checkers() {
  const { user } = useContext(AuthContext);

  const [gameId, setGameId]               = useState("");
  const [inputId, setInputId]             = useState("");
  const [game, setGame]                   = useState(null);
  const [selected, setSelected]           = useState(null);
  const [moves, setMoves]                 = useState([]);
  const [multiEatPiece, setMultiEatPiece] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [lastMove, setLastMove]           = useState(null);
  const [myRating, setMyRating]           = useState(1000);
  const [notification, setNotification]   = useState("");

  // Visual preferences
  const [boardThemeIdx, setBoardThemeIdx]       = useState(0);
  const [myPieceColorIdx, setMyPieceColorIdx]   = useState(0);
  const [boardRotated, setBoardRotated]         = useState(false);

  const myColor = useCallback(
    () => (game?.player1 === user?.uid ? "w" : "b"),
    [game, user]
  );

  // Load my rating
  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setMyRating(snap.data().rating ?? 1000);
    })();
  }, [user]);

  // Realtime listener
  useEffect(() => {
    if (!gameId) return;
    return onSnapshot(doc(db, "games", gameId), snap => {
      if (snap.exists()) setGame({ id: snap.id, ...snap.data() });
    });
  }, [gameId]);

  const showNotif = msg => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  };

  // ── CREATE ──
  const createGame = async () => {
    const id = `game_${Date.now()}`;
    await setDoc(doc(db, "games", id), {
      board: createBoard(),
      player1: user.uid,
      player1Email: user.email || "",
      player1Name: user.displayName || user.email?.split("@")[0] || user.uid.slice(0, 8),
      player2: "",
      player2Email: "",
      player2Name: "",
      player1Rating: myRating,
      player2Rating: 1000,
      turn: user.uid,
      status: "waiting",
      winner: "",
      moveCount: 0,
    });
    setGameId(id);
    setSelected(null);
    setMoves([]);
    showNotif("✅ O'yin yaratildi! ID bosib nusxalang");
  };

  // ── JOIN ──
  const joinGame = async () => {
    const id = inputId.trim();
    if (!id) return;
    const ref = doc(db, "games", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) { showNotif("❌ O'yin topilmadi"); return; }
    const data = snap.data();
    if (data.status !== "waiting") { showNotif("❌ O'yin allaqachon boshlangan"); return; }
    if (data.player1 === user.uid) { showNotif("❌ O'z o'yiningizga qo'shila olmaysiz"); return; }
    await updateDoc(ref, {
      player2: user.uid,
      player2Email: user.email || "",
      player2Name: user.displayName || user.email?.split("@")[0] || user.uid.slice(0, 8),
      player2Rating: myRating,
      status: "playing",
    });
    setGameId(id);
    showNotif("✅ O'yinga qo'shildingiz!");
  };

  // ── CLICK ──
  const handleClick = async (i, j) => {
    if (!game || game.turn !== user.uid || game.winner) return;
    if (game.status !== "playing") return;

    const board = [...game.board];
    const idx = i * 8 + j;
    const color = myColor();
    const mustEat = hasCapture(board, color);

    if (selected) {
      const move = moves.find(m => m.i === i && m.j === j);
      if (!move) {
        const piece = board[idx];
        if (piece && piece.startsWith(color)) {
          const m = getMoves(i, j, board, piece, mustEat);
          if (mustEat && m.filter(x => x.eat).length === 0) { showNotif("⚠️ Majburiy urish!"); return; }
          setSelected({ i, j });
          setMoves(m);
        }
        return;
      }

      if (mustEat && !move.eat) { showNotif("⚠️ Majburiy urish!"); return; }

      const fromIdx = selected.i * 8 + selected.j;
      const piece = board[fromIdx];
      board[idx] = piece;
      board[fromIdx] = "";
      if (move.eat) board[move.eat.i * 8 + move.eat.j] = "";

      // promotion
      if (piece === "w" && i === 0) board[idx] = "wk";
      if (piece === "b" && i === 7) board[idx] = "bk";

      setLastMove({ from: fromIdx, to: idx });

      // multi-capture
      if (move.eat) {
        const more = getMoves(i, j, board, board[idx], true);
        if (more.length > 0 && !multiEatPiece) {
          setSelected({ i, j });
          setMoves(more);
          setMultiEatPiece({ i, j });
          await updateDoc(doc(db, "games", gameId), { board });
          return;
        }
      }

      // check win
      const enemy = color === "b" ? "w" : "b";
      const enemyLeft = board.some(c => c && c.startsWith(enemy));
      const enemyMoves = board.some((cell, ci) => {
        if (!cell || !cell.startsWith(enemy)) return false;
        const ei = Math.floor(ci / 8), ej = ci % 8;
        return getMoves(ei, ej, board, cell).length > 0;
      });

      if (!enemyLeft || !enemyMoves) {
        const opponentId = user.uid === game.player1 ? game.player2 : game.player1;
        const opRating   = user.uid === game.player1 ? game.player2Rating : game.player1Rating;
        const delta = calcRatingDelta(true, opRating, myRating);
        await updateDoc(doc(db, "games", gameId), { board, winner: user.uid, status: "done" });
        await updateDoc(doc(db, "users", user.uid), { wins: increment(1), rating: increment(delta) });
        await updateDoc(doc(db, "users", opponentId), { losses: increment(1), rating: increment(-delta) });
        showNotif(`🏆 G'alaba! +${delta} reyting`);
        setSelected(null); setMoves([]); setMultiEatPiece(null);
        return;
      }

      const nextTurn = user.uid === game.player1 ? game.player2 : game.player1;
      await updateDoc(doc(db, "games", gameId), { board, turn: nextTurn, moveCount: increment(1) });
      setSelected(null); setMoves([]); setMultiEatPiece(null);

    } else {
      const piece = board[idx];
      if (!piece || !piece.startsWith(color)) return;
      if (multiEatPiece && (multiEatPiece.i !== i || multiEatPiece.j !== j)) return;
      const m = getMoves(i, j, board, piece, mustEat);
      if (mustEat && m.filter(x => x.eat).length === 0) {
        showNotif("⚠️ Majburiy urish qoida! Boshqa tosh tanlang");
        return;
      }
      if (m.length === 0) return;
      setSelected({ i, j });
      setMoves(m);
    }
  };

  // ── SURRENDER ──
  const surrender = async () => {
    if (!game || game.status !== "playing" || game.winner) return;
    const opponentId = user.uid === game.player1 ? game.player2 : game.player1;
    const opRating   = user.uid === game.player1 ? game.player2Rating : game.player1Rating;
    const delta = calcRatingDelta(false, opRating, myRating);
    await updateDoc(doc(db, "games", gameId), { winner: opponentId, status: "done" });
    await updateDoc(doc(db, "users", user.uid), { losses: increment(1), rating: increment(-Math.abs(delta)) });
    await updateDoc(doc(db, "users", opponentId), { wins: increment(1), rating: increment(Math.abs(delta)) });
    showNotif("🏳️ Taslim bo'ldingiz");
  };

  const color = game ? myColor() : null;
  const theme = BOARD_THEMES[boardThemeIdx];
  const myPieceStyle = color ? PIECE_COLORS[color][myPieceColorIdx] : PIECE_COLORS["b"][0];
  const opColor      = color === "b" ? "w" : "b";
  const opPieceStyle = PIECE_COLORS[opColor][0];

  // Auto-flip for white + manual override
  const autoFlip  = color === "w";
  const shouldFlip = boardRotated ? !autoFlip : autoFlip;

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "radial-gradient(ellipse at 20% 20%, #0f1a2e 0%, #0a0f1a 60%, #060c14 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Notification toast */}
      {notification && (
        <div style={{
          position: "fixed", top: 24, left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          background: "#1e293b",
          border: "1px solid #334155",
          padding: "10px 24px",
          borderRadius: 999,
          fontSize: 14, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          animation: "toastIn 0.2s ease",
          whiteSpace: "nowrap",
        }}>
          {notification}
        </div>
      )}

      <Leaderboard visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

      <SettingsPanel
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        boardThemeIdx={boardThemeIdx}
        setBoardThemeIdx={setBoardThemeIdx}
        myPieceColorIdx={myPieceColorIdx}
        setMyPieceColorIdx={setMyPieceColorIdx}
        myColor={color}
        boardRotated={boardRotated}
        setBoardRotated={setBoardRotated}
      />

      <div className="max-w-2xl mx-auto p-4 space-y-3">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              <span style={{ color: "#f59e0b" }}>♟</span>
              <span className="ml-2" style={{
                background: "linear-gradient(90deg,#f59e0b,#f97316)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>SHASHKA</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Reyting: <span className="text-emerald-400 font-bold">{myRating}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-2 rounded-xl border border-slate-600 bg-slate-800/50
                text-slate-300 text-sm hover:bg-slate-700/50 transition-colors"
              title="Sozlamalar"
            >
              ⚙️
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10
                text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors"
            >
              🏆 Reyting
            </button>
          </div>
        </div>

        {/* ── LOBBY ── */}
        {!gameId && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
            <button
              onClick={createGame}
              className="w-full py-3 rounded-xl font-bold text-lg transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                boxShadow: "0 4px 24px rgba(37,99,235,0.3)",
              }}
            >
              ＋ Yangi o'yin yaratish
            </button>
            <div className="flex gap-2">
              <input
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && joinGame()}
                placeholder="O'yin ID kiriting…"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5
                  text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={joinGame}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500
                  font-semibold transition-colors active:scale-95"
              >
                Qo'shilish
              </button>
            </div>
          </div>
        )}

        {/* ── GAME ID COPY BADGE ── */}
        {gameId && game && <GameIdBadge gameId={gameId} />}

        {/* ── KIM BILAN O'YNAYAPMAN ── */}
        {game && game.status === "playing" && (
          <OpponentBar game={game} myUserId={user.uid} />
        )}

        {/* ── STATUS ── */}
        {game && <StatusBar game={game} myColor={color} userId={user.uid} />}

        {/* ── BOARD ── */}
        {game && (
          <div className="flex flex-col items-center space-y-3">

            {/* Quick rotate button above board */}
            {game.status === "playing" && (
              <button
                onClick={() => setBoardRotated(v => !v)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs
                  border border-slate-700 bg-slate-800/50 text-slate-400
                  hover:bg-slate-700/50 hover:text-slate-200 transition-colors"
              >
                🔄 {shouldFlip ? "Standart holat" : "Doskani aylantirish"}
              </button>
            )}

            {/* Board wrapper */}
            <div style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "3px solid #1e293b",
              boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
              transform: shouldFlip ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8,52px)" }}>
                {game.board.map((cell, index) => {
                  const i = Math.floor(index / 8), j = index % 8;
                  const isDark = (i + j) % 2 === 1;
                  const isMovable  = moves.some(m => m.i === i && m.j === j);
                  const isSelected = selected?.i === i && selected?.j === j;
                  const isLastFrom = lastMove?.from === index;
                  const isLastTo   = lastMove?.to === index;
                  const isKing     = cell.includes("k");
                  const pieceOwner = cell ? cell[0] : null;
                  const pStyle = pieceOwner === color ? myPieceStyle : opPieceStyle;

                  let bg = isDark ? theme.dark : theme.light;
                  if (isDark && (isLastFrom || isLastTo)) bg = theme.accent;

                  return (
                    <div
                      key={index}
                      onClick={() => handleClick(i, j)}
                      style={{
                        width: 52, height: 52, background: bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        position: "relative", cursor: "pointer", userSelect: "none",
                        // counter-rotate each cell so pieces remain upright when board is flipped
                        transform: shouldFlip ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "background 0.3s ease",
                      }}
                    >
                      {/* Move dot */}
                      {isMovable && !cell && (
                        <>
                          <div style={{
                            position: "absolute", width: 18, height: 18, borderRadius: "50%",
                            background: "rgba(74,222,128,0.4)",
                            animation: "cellPing 1.2s ease-in-out infinite",
                          }}/>
                          <div style={{
                            position: "absolute", width: 12, height: 12, borderRadius: "50%",
                            background: "rgba(74,222,128,0.85)",
                          }}/>
                        </>
                      )}
                      {/* Capture ring */}
                      {isMovable && cell && (
                        <div style={{
                          position: "absolute", inset: 2,
                          border: "3px solid rgba(248,113,113,0.85)",
                          borderRadius: 6, pointerEvents: "none",
                        }}/>
                      )}
                      {/* Piece */}
                      {cell && (
                        <PieceSVG
                          color={pieceOwner}
                          isKing={isKing}
                          selected={isSelected}
                          pieceStyle={pStyle}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info */}
            <div className="text-center text-slate-600 text-xs">
              {color === "b" ? "♟ Siz — qora toshlar" : "♟ Siz — oq toshlar"}
              {" · "}
              {game.moveCount ?? 0} ta yurish
            </div>

            {/* Surrender */}
            {game.status === "playing" && !game.winner && (
              <button
                onClick={surrender}
                className="px-5 py-2 rounded-xl border border-red-500/30 bg-red-500/10
                  text-red-400 text-sm hover:bg-red-500/20 transition-colors"
              >
                🏳️ Taslim bo'lish
              </button>
            )}

            {/* New game */}
            {game.winner && (
              <button
                onClick={() => {
                  setGameId(""); setGame(null);
                  setSelected(null); setMoves([]);
                  setLastMove(null); setMultiEatPiece(null);
                }}
                className="px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}
              >
                🔄 Yangi o'yin
              </button>
            )}
          </div>
        )}

        {/* Rules accordion */}
        {!game && (
          <details className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
            <summary className="px-4 py-3 cursor-pointer text-slate-400 text-sm select-none hover:text-white">
              📖 Shashka qoidalari
            </summary>
            <div className="px-4 pb-4 text-sm text-slate-400 space-y-1.5">
              <p>• Toshlar faqat diagonal bo'yicha harakat qiladi</p>
              <p>• Qora (b) pastga, oq (w) yuqoriga yuradi</p>
              <p>• <b className="text-white">Majburiy urish:</b> agar raqib toshini urish imkoni bo'lsa, majburiy uriladi</p>
              <p>• Davomli urish: bir yurishda ketma-ket bir necha tosh urish mumkin</p>
              <p>• <b className="text-white">Shoh (♛):</b> tosh qarama-qarshi tomonning oxirgi qatoriga yetganda shohga aylanadi</p>
              <p>• Shoh barcha diagonal yo'nalishlarda istalgan masofaga yura oladi</p>
              <p>• Barcha raqib toshlari urilganda yoki raqib yura olmay qolsa — g'alaba</p>
            </div>
          </details>
        )}

      </div>

      <style>{`
        @keyframes cellPing {
          0%,100% { transform: scale(1); opacity:0.7; }
          50%      { transform: scale(1.6); opacity:0; }
        }
        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(-10px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
