import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, increment, collection, query, orderBy, limit, getDocs
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
      // enemy piece → try to jump
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

// ─── PIECE SVG ────────────────────────────────────────────────────────────────
const PieceSVG = ({ color, isKing, selected, hint }) => (
  <div
    className={`
      w-10 h-10 rounded-full flex items-center justify-center
      transition-all duration-200
      ${color === "b"
        ? "bg-gradient-to-br from-gray-700 to-gray-900 shadow-[0_0_0_3px_#4a4a4a,inset_0_2px_4px_rgba(255,255,255,0.1)]"
        : "bg-gradient-to-br from-amber-50 to-amber-200 shadow-[0_0_0_3px_#c8a87a,inset_0_2px_4px_rgba(255,255,255,0.8)]"}
      ${selected ? "scale-110 ring-4 ring-yellow-400 ring-offset-1" : ""}
      ${hint ? "opacity-40" : ""}
    `}
    style={{ transform: selected ? "translateY(-4px) scale(1.12)" : "" }}
  >
    {isKing && (
      <span className={`text-lg leading-none select-none ${color === "b" ? "text-yellow-400" : "text-amber-700"}`}>
        ♛
      </span>
    )}
  </div>
);

// ─── STATUS BAR ───────────────────────────────────────────────────────────────
const StatusBar = ({ game, myColor, userId }) => {
  if (!game) return null;
  const myPieces = countPieces(game.board, myColor);
  const enemyPieces = countPieces(game.board, myColor === "b" ? "w" : "b");

  if (game.winner) {
    const iWon = game.winner === userId;
    return (
      <div className={`rounded-xl px-6 py-3 text-center font-bold text-lg tracking-wide
        ${iWon ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
               : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
        {iWon ? "🏆 Siz g'alaba qozondingiz!" : "💀 Raqib g'alaba qildi"}
      </div>
    );
  }
  if (game.status === "waiting") {
    return (
      <div className="rounded-xl px-6 py-3 text-center text-amber-300 border border-amber-500/30 bg-amber-500/10">
        ⏳ Raqib kutilmoqda… ID: <span className="font-mono font-bold">{game.id}</span>
      </div>
    );
  }
  const myTurn = game.turn === userId;
  return (
    <div className={`rounded-xl px-6 py-3 flex items-center justify-between
      ${myTurn ? "bg-blue-500/20 border border-blue-400/30" : "bg-slate-700/30 border border-slate-600/30"}`}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600"/>
        <span className="text-sm text-gray-300">Siz: <b className="text-white">{myPieces}</b></span>
      </div>
      <span className={`font-semibold ${myTurn ? "text-blue-300 animate-pulse" : "text-gray-400"}`}>
        {myTurn ? "⚡ Sizning navbatingiz" : "⏳ Raqib o'ylayapti…"}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300">Raqib: <b className="text-white">{enemyPieces}</b></span>
        <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-400"/>
      </div>
    </div>
  );
};

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
const Leaderboard = ({ visible, onClose }) => {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!visible) return;
    (async () => {
      const q = query(collection(db, "users"), orderBy("rating", "desc"), limit(10));
      const snap = await getDocs(q);
      setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1f2e] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-amber-400">🏆 Reyting jadvali</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {rows.map((r, i) => (
            <div key={r.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl
              ${i === 0 ? "bg-amber-500/20 border border-amber-500/30"
               : i === 1 ? "bg-slate-400/10 border border-slate-400/20"
               : i === 2 ? "bg-orange-500/10 border border-orange-500/20"
               : "bg-slate-800/50"}`}>
              <span className={`w-7 text-center font-bold text-lg
                ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-gray-500"}`}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
              </span>
              <span className="flex-1 text-white font-medium truncate">{r.displayName || r.id.slice(0, 8)}</span>
              <span className="text-emerald-400 font-bold">{r.rating ?? 1000}</span>
              <span className="text-gray-500 text-sm">{r.wins ?? 0}W / {r.losses ?? 0}L</span>
            </div>
          ))}
          {rows.length === 0 && <p className="text-center text-gray-500 py-8">Ma'lumot yo'q</p>}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Checkers() {
  const { user } = useContext(AuthContext);

  const [gameId, setGameId] = useState("");
  const [inputId, setInputId] = useState("");
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState([]);
  const [multiEatPiece, setMultiEatPiece] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [myRating, setMyRating] = useState(1000);
  const [notification, setNotification] = useState("");

  const myColor = useCallback(() =>
    game?.player1 === user?.uid ? "b" : "w", [game, user]);

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

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  };

  // ── CREATE ──
  const createGame = async () => {
    const id = `game_${Date.now()}`;
    await setDoc(doc(db, "games", id), {
      board: createBoard(),
      player1: user.uid,
      player2: "",
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
    showNotif("O'yin yaratildi! ID ni ulashing");
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
    await updateDoc(ref, {
      player2: user.uid,
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

    // ── MOVE EXECUTION ──
    if (selected) {
      const move = moves.find(m => m.i === i && m.j === j);
      if (!move) {
        // click another own piece
        const piece = board[idx];
        if (piece && piece.startsWith(color)) {
          const m = getMoves(i, j, board, piece, mustEat);
          if (mustEat && m.filter(x => x.eat).length === 0) { showNotif("⚠️ Majburiy urish!"); return; }
          setSelected({ i, j });
          setMoves(m);
        }
        return;
      }

      // enforce capture-only
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
        // win!
        const opponentId = user.uid === game.player1 ? game.player2 : game.player1;
        const opRating = user.uid === game.player1 ? game.player2Rating : game.player1Rating;
        const delta = calcRatingDelta(true, opRating, myRating);

        await updateDoc(doc(db, "games", gameId), { board, winner: user.uid, status: "done" });
        await updateDoc(doc(db, "users", user.uid), {
          wins: increment(1), rating: increment(delta)
        });
        await updateDoc(doc(db, "users", opponentId), {
          losses: increment(1), rating: increment(-delta)
        });
        showNotif(`🏆 G'alaba! +${delta} reyting`);
        setSelected(null); setMoves([]); setMultiEatPiece(null);
        return;
      }

      const nextTurn = user.uid === game.player1 ? game.player2 : game.player1;
      await updateDoc(doc(db, "games", gameId), {
        board, turn: nextTurn, moveCount: increment(1)
      });
      setSelected(null); setMoves([]); setMultiEatPiece(null);

    } else {
      // SELECT
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
    const opRating = user.uid === game.player1 ? game.player2Rating : game.player1Rating;
    const delta = calcRatingDelta(false, opRating, myRating);
    await updateDoc(doc(db, "games", gameId), { winner: opponentId, status: "done" });
    await updateDoc(doc(db, "users", user.uid), {
      losses: increment(1), rating: increment(-Math.abs(delta))
    });
    await updateDoc(doc(db, "users", opponentId), {
      wins: increment(1), rating: increment(Math.abs(delta))
    });
    showNotif("🏳️ Taslim bo'ldingiz");
  };

  const color = game ? myColor() : null;

  return (
    <div
      className="min-h-screen text-white font-sans"
      style={{
        background: "radial-gradient(ellipse at 20% 20%, #0f1a2e 0%, #0a0f1a 60%, #060c14 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Notification */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50
          bg-slate-800 border border-slate-600 px-6 py-3 rounded-full
          shadow-2xl text-sm font-medium animate-bounce">
          {notification}
        </div>
      )}

      <Leaderboard visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              <span className="text-amber-400">♟</span>
              <span className="ml-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                SHASHKA
              </span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Reyting: <span className="text-emerald-400 font-bold">{myRating}</span></p>
          </div>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10
              text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors"
          >
            🏆 Reyting
          </button>
        </div>

        {/* Controls */}
        {!gameId && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
            <button
              onClick={createGame}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500
                font-bold text-lg hover:from-blue-500 hover:to-blue-400 transition-all
                shadow-lg shadow-blue-900/40 active:scale-95"
            >
              ＋ Yangi o'yin yaratish
            </button>
            <div className="flex gap-2">
              <input
                value={inputId}
                onChange={e => setInputId(e.target.value)}
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

        {/* Status */}
        {game && <StatusBar game={game} myColor={color} userId={user.uid} />}

        {/* Game ID display */}
        {game && game.status === "waiting" && (
          <div className="bg-slate-800/40 rounded-xl px-4 py-2 text-center">
            <span className="text-gray-400 text-sm">O'yin kodi: </span>
            <span
              className="font-mono text-amber-400 font-bold cursor-pointer hover:text-amber-300"
              onClick={() => navigator.clipboard?.writeText(gameId)}
            >
              {gameId}
            </span>
            <span className="text-gray-600 text-xs ml-2">(bosib nusxa oling)</span>
          </div>
        )}

        {/* Board */}
        {game && (
          <div className="flex flex-col items-center space-y-3">
            <div
              className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
              style={{ border: "3px solid #2a3244" }}
            >
              {/* Flip board for player2 */}
              <div
                className="grid grid-cols-8"
                style={{
                  transform: color === "w" ? "rotate(180deg)" : "none",
                  transition: "transform 0.3s ease",
                }}
              >
                {game.board.map((cell, index) => {
                  const i = Math.floor(index / 8), j = index % 8;
                  const isDark = (i + j) % 2 === 1;
                  const isMovable = moves.some(m => m.i === i && m.j === j);
                  const isSelected = selected?.i === i && selected?.j === j;
                  const isLastFrom = lastMove?.from === index;
                  const isLastTo = lastMove?.to === index;
                  const piece = cell;
                  const isKing = piece.includes("k");

                  return (
                    <div
                      key={index}
                      onClick={() => handleClick(i, j)}
                      className="relative cursor-pointer select-none"
                      style={{
                        width: 52, height: 52,
                        background: isDark
                          ? isLastFrom || isLastTo ? "#2a5c3a" : "#1e3a28"
                          : "#c8a87a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: color === "w" ? "rotate(180deg)" : "none",
                      }}
                    >
                      {/* Move hint dot */}
                      {isMovable && !piece && (
                        <div className="w-4 h-4 rounded-full bg-green-400/60 animate-ping absolute"/>
                      )}
                      {isMovable && !piece && (
                        <div className="w-3 h-3 rounded-full bg-green-400/80 absolute"/>
                      )}
                      {/* Capture hint */}
                      {isMovable && piece && (
                        <div className="absolute inset-0 ring-4 ring-red-400/70 rounded"/>
                      )}
                      {/* Piece */}
                      {piece && (
                        <div style={{ transform: isSelected ? "translateY(-3px)" : "none", transition: "transform 0.15s" }}>
                          <PieceSVG
                            color={piece[0]}
                            isKing={isKing}
                            selected={isSelected}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Board coordinates hint */}
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

            {/* New game after finish */}
            {game.winner && (
              <button
                onClick={() => { setGameId(""); setGame(null); setSelected(null); setMoves([]); }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500
                  font-bold hover:from-blue-500 hover:to-blue-400 transition-all active:scale-95"
              >
                🔄 Yangi o'yin
              </button>
            )}
          </div>
        )}

        {/* Rules reference */}
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
    </div>
  );
}
