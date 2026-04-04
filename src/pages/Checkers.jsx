import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, increment,
  collection, query, orderBy, limit, getDocs
} from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// BOARD LOGIC
// ═══════════════════════════════════════════════════════════════
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
        if (inside(ti, tj) && board[ti * 8 + tj] === "")
          res.push({ i: ti, j: tj, eat: { i: ni, j: nj } });
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

const countPieces = (board, color) =>
  board.filter(c => c && c.startsWith(color)).length;

// ═══════════════════════════════════════════════════════════════
// ELO RATING
// ═══════════════════════════════════════════════════════════════
const calcDelta = (won, opRating, myRating) => {
  const K = 32;
  const exp = 1 / (1 + Math.pow(10, (opRating - myRating) / 400));
  return Math.round(K * ((won ? 1 : 0) - exp));
};

// ═══════════════════════════════════════════════════════════════
// VISUAL PRESETS
// ═══════════════════════════════════════════════════════════════
const BOARD_THEMES = [
  { name: "Klassik",  dark: "#1e3a28", light: "#c8a87a", accent: "#2a5c3a" },
  { name: "Okean",    dark: "#1a3a5c", light: "#a8c8e8", accent: "#2a5c8a" },
  { name: "Atirgul",  dark: "#5c1a3a", light: "#e8a8c8", accent: "#8a2a5c" },
  { name: "Oltin",    dark: "#3a2a0a", light: "#f0d080", accent: "#6a4a10" },
  { name: "Tun",      dark: "#111827", light: "#374151", accent: "#1f2937" },
  { name: "Ametist",  dark: "#2d1b69", light: "#c4b5fd", accent: "#4c1d95" },
];

// All piece colors — any color can be picked by any player
const ALL_PIECE_COLORS = [
  { id: "dark",    name: "Qora",    from: "#374151", to: "#111827", ring: "#6b7280",  preview: "#374151" },
  { id: "red",     name: "Qizil",   from: "#991b1b", to: "#7f1d1d", ring: "#ef4444",  preview: "#991b1b" },
  { id: "blue",    name: "Ko'k",    from: "#1e3a8a", to: "#1e40af", ring: "#60a5fa",  preview: "#1e3a8a" },
  { id: "green",   name: "Yashil",  from: "#14532d", to: "#166534", ring: "#4ade80",  preview: "#15803d" },
  { id: "white",   name: "Oq",      from: "#f8fafc", to: "#e2e8f0", ring: "#94a3b8",  preview: "#e2e8f0" },
  { id: "gold",    name: "Oltin",   from: "#fef08a", to: "#f59e0b", ring: "#fbbf24",  preview: "#f59e0b" },
  { id: "purple",  name: "Binafsha",from: "#581c87", to: "#7e22ce", ring: "#a855f7",  preview: "#7e22ce" },
  { id: "pink",    name: "Pushti",  from: "#fce7f3", to: "#f472b6", ring: "#ec4899",  preview: "#ec4899" },
  { id: "orange",  name: "To'q",    from: "#c2410c", to: "#ea580c", ring: "#fb923c",  preview: "#ea580c" },
  { id: "cyan",    name: "Moviy",   from: "#164e63", to: "#0e7490", ring: "#22d3ee",  preview: "#0e7490" },
];

const getPieceStyle = id => ALL_PIECE_COLORS.find(c => c.id === id) || ALL_PIECE_COLORS[0];

// ═══════════════════════════════════════════════════════════════
// PIECE COMPONENT
// ═══════════════════════════════════════════════════════════════
const Piece = ({ styleId, isKing, selected }) => {
  const s = getPieceStyle(styleId);
  const kingColor = ["white", "gold", "pink"].includes(styleId) ? "#1e293b" : "#fbbf24";
  return (
    <div style={{
      width: 44, height: 44, borderRadius: "50%",
      background: `linear-gradient(145deg, ${s.from}, ${s.to})`,
      boxShadow: selected
        ? `0 0 0 3px #facc15, 0 0 0 5px ${s.ring}55, 0 6px 20px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,255,255,0.3)`
        : `0 0 0 3px ${s.ring}, 0 4px 12px rgba(0,0,0,0.4), inset 0 2px 5px rgba(255,255,255,0.2)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: selected ? "translateY(-5px) scale(1.14)" : "scale(1)",
      transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
      cursor: "pointer",
      position: "relative",
    }}>
      {/* Inner gloss */}
      <div style={{
        position: "absolute", top: 6, left: 8, width: 14, height: 8,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.25)",
        filter: "blur(1px)",
      }}/>
      {isKing && (
        <span style={{
          fontSize: 19, lineHeight: 1, userSelect: "none",
          color: kingColor,
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
          zIndex: 1,
        }}>♛</span>
      )}
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 8, padding: "10px 16px", borderRadius: 12, cursor: "pointer", border: "1px solid #334155",
      background: copied ? "rgba(16,185,129,0.08)" : "rgba(15,23,42,0.7)",
      transition: "background 0.3s",
    }}>
      <span style={{ color: "#94a3b8", fontSize: 13, flexShrink: 0 }}>O'yin kodi:</span>
      <span style={{ fontFamily: "monospace", color: "#f59e0b", fontWeight: 700, fontSize: 13, flex: 1, textAlign: "center" }}>
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
// OPPONENT INFO BAR
// ═══════════════════════════════════════════════════════════════
const OpponentBar = ({ game, myUserId, opPieceStyleId }) => {
  const [opData, setOpData] = useState(null);
  const opId     = game?.player1 === myUserId ? game?.player2 : game?.player1;
  const opRating = game?.player1 === myUserId ? game?.player2Rating : game?.player1Rating;

  useEffect(() => {
    if (!opId) return;
    getDoc(doc(db, "users", opId)).then(s => s.exists() && setOpData(s.data()));
  }, [opId]);

  if (!game || game.status === "waiting" || !opId) return null;

  const s = getPieceStyle(opPieceStyleId);
  const name = opData?.displayName || opData?.email?.split("@")[0] || opId.slice(0, 10);
  const email = opData?.email || "";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
      borderRadius: 12, border: "1px solid rgba(51,65,85,0.5)",
      background: "rgba(15,23,42,0.5)",
    }}>
      {/* Piece color preview */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(145deg,${s.from},${s.to})`,
        boxShadow: `0 0 0 2px ${s.ring}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, color: "#fff",
      }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </div>
        {email && (
          <div style={{ color: "#64748b", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ color: "#34d399", fontWeight: 700, fontSize: 14 }}>
          {opData?.rating ?? opRating ?? 1000}
        </div>
        <div style={{ color: "#475569", fontSize: 11 }}>
          {opData?.wins ?? 0}W / {opData?.losses ?? 0}L
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STATUS BAR
// ═══════════════════════════════════════════════════════════════
const StatusBar = ({ game, myColor, userId, myStyleId, opStyleId }) => {
  if (!game) return null;
  const myPieces  = countPieces(game.board, myColor);
  const opPieces  = countPieces(game.board, myColor === "b" ? "w" : "b");
  const ms = getPieceStyle(myStyleId);
  const os = getPieceStyle(opStyleId);

  if (game.winner) {
    const iWon = game.winner === userId;
    return (
      <div style={{
        borderRadius: 12, padding: "12px 24px", textAlign: "center",
        fontWeight: 700, fontSize: 17, letterSpacing: 0.3,
        border: `1px solid ${iWon ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
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
        borderRadius: 12, padding: "12px 24px", textAlign: "center",
        color: "#fcd34d", border: "1px solid rgba(245,158,11,0.3)",
        background: "rgba(245,158,11,0.08)",
      }}>
        ⏳ Raqib kutilmoqda…
      </div>
    );
  }

  const myTurn = game.turn === userId;
  return (
    <div style={{
      borderRadius: 12, padding: "10px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      border: `1px solid ${myTurn ? "rgba(96,165,250,0.3)" : "rgba(51,65,85,0.4)"}`,
      background: myTurn ? "rgba(59,130,246,0.1)" : "rgba(30,41,59,0.3)",
      transition: "all 0.4s ease",
    }}>
      {/* My side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: `linear-gradient(145deg,${ms.from},${ms.to})`,
          boxShadow: `0 0 0 2px ${ms.ring}`,
          flexShrink: 0,
        }}/>
        <div>
          <div style={{ color: "#94a3b8", fontSize: 11 }}>Siz</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{myPieces}</div>
        </div>
      </div>

      {/* Center */}
      <div style={{
        fontWeight: 600, fontSize: 13,
        color: myTurn ? "#93c5fd" : "#64748b",
        animation: myTurn ? "pulseText 1.5s ease-in-out infinite" : "none",
        textAlign: "center",
      }}>
        {myTurn ? "⚡ Sizning navbat" : "⏳ Raqib o'ylayapti…"}
      </div>

      {/* Opponent side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div>
          <div style={{ color: "#94a3b8", fontSize: 11, textAlign: "right" }}>Raqib</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, textAlign: "right" }}>{opPieces}</div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: `linear-gradient(145deg,${os.from},${os.to})`,
          boxShadow: `0 0 0 2px ${os.ring}`,
          flexShrink: 0,
        }}/>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD MODAL
// ═══════════════════════════════════════════════════════════════
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

  const medals = ["🥇", "🥈", "🥉"];
  const medalColors = ["#f59e0b", "#94a3b8", "#f97316"];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#0d1420", border: "1px solid #1e293b",
        borderRadius: 20, width: "100%", maxWidth: 440,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px", borderBottom: "1px solid #1e293b",
          background: "linear-gradient(135deg,#131e35,#0d1420)",
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>🏆 Reyting jadvali</span>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", border: "none",
            background: "#1e293b", color: "#94a3b8", cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Rows */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, maxHeight: "72vh", overflowY: "auto" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#475569" }}>
              <div style={{
                width: 28, height: 28, border: "2px solid #f59e0b", borderTopColor: "transparent",
                borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
              }}/>
              Yuklanmoqda…
            </div>
          )}
          {!loading && rows.map((r, i) => (
            <div key={r.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid ${i < 3 ? medalColors[i] + "30" : "#1e293b"}`,
              background: i < 3 ? medalColors[i] + "0d" : "rgba(15,23,42,0.5)",
            }}>
              <span style={{
                width: 28, textAlign: "center", fontWeight: 900, fontSize: 16, flexShrink: 0,
                color: i < 3 ? medalColors[i] : "#475569",
              }}>
                {i < 3 ? medals[i] : i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.displayName || r.email?.split("@")[0] || r.id.slice(0, 10)}
                </div>
                {/* Email ko'rinadi */}
                {r.email && (
                  <div style={{ color: "#475569", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.email}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "#34d399", fontWeight: 800, fontSize: 15 }}>{r.rating ?? 1000}</div>
                <div style={{ color: "#475569", fontSize: 11 }}>{r.wins ?? 0}W / {r.losses ?? 0}L</div>
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <p style={{ textAlign: "center", color: "#475569", padding: "40px 0" }}>Ma'lumot yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COLOR PICKER PANEL (before game creation)
// ═══════════════════════════════════════════════════════════════
const ColorPicker = ({ selectedId, onSelect, label }) => (
  <div>
    <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{label}</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
      {ALL_PIECE_COLORS.map(c => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          title={c.name}
          style={{
            padding: "8px 4px", borderRadius: 10, border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            background: selectedId === c.id ? "rgba(250,204,21,0.12)" : "rgba(15,23,42,0.5)",
            outline: selectedId === c.id ? "2px solid #facc15" : "2px solid transparent",
            transition: "all 0.18s",
            transform: selectedId === c.id ? "scale(1.08)" : "scale(1)",
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: `linear-gradient(145deg,${c.from},${c.to})`,
            boxShadow: `0 0 0 2px ${c.ring}`,
          }}/>
          <span style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1 }}>{c.name}</span>
        </button>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════
const SettingsModal = ({
  visible, onClose,
  boardThemeIdx, setBoardThemeIdx,
  myPieceId, setMyPieceId,
  boardFlipped, setBoardFlipped,
}) => {
  if (!visible) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#0d1420", border: "1px solid #1e293b",
        borderRadius: 20, width: "100%", maxWidth: 400,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 24px", borderBottom: "1px solid #1e293b",
          background: "linear-gradient(135deg,#131e35,#0d1420)",
        }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>⚙️ Sozlamalar</span>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", border: "none",
            background: "#1e293b", color: "#94a3b8", cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Board rotation toggle */}
          <div>
            <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              🔄 Doskani aylantirish
            </p>
            <button
              onClick={() => setBoardFlipped(v => !v)}
              style={{
                width: "100%", padding: "10px 16px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${boardFlipped ? "rgba(96,165,250,0.4)" : "#334155"}`,
                background: boardFlipped ? "rgba(59,130,246,0.12)" : "rgba(15,23,42,0.6)",
                color: boardFlipped ? "#93c5fd" : "#94a3b8",
                fontWeight: 600, fontSize: 13, transition: "all 0.2s",
              }}
            >
              {boardFlipped ? "✅ Aylantirilgan holat yoqilgan" : "Standart holat — bosib o'zgartiring"}
            </button>
            <p style={{ color: "#334155", fontSize: 11, marginTop: 6 }}>
              Siz tanlagan rang sizni pastda, raqibni tepada ko'rsatadi. Bu toggle qo'shimcha boshqaruv.
            </p>
          </div>

          {/* Board theme */}
          <div>
            <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>🎨 Doska uslubi</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {BOARD_THEMES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setBoardThemeIdx(i)}
                  style={{
                    borderRadius: 10, overflow: "hidden", cursor: "pointer", border: "none",
                    outline: boardThemeIdx === i ? "2px solid #f59e0b" : "2px solid transparent",
                    transform: boardThemeIdx === i ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s",
                    boxShadow: boardThemeIdx === i ? "0 0 12px rgba(245,158,11,0.3)" : "none",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", height: 30 }}>
                    {[0,1,2,3].map(k => (
                      <div key={k} style={{ background: k % 2 === 0 ? t.light : t.dark }}/>
                    ))}
                  </div>
                  <div style={{ background: "#0f172a", color: "#94a3b8", fontSize: 11, textAlign: "center", padding: "5px 0" }}>
                    {t.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Piece color — o'yin davomida ham o'zgartirish mumkin */}
          <ColorPicker
            label="♟ Sizning tosh rangi"
            selectedId={myPieceId}
            onSelect={setMyPieceId}
          />

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

  // Game state
  const [gameId, setGameId]                   = useState("");
  const [inputId, setInputId]                 = useState("");
  const [game, setGame]                       = useState(null);
  const [selected, setSelected]               = useState(null);
  const [moves, setMoves]                     = useState([]);
  const [multiEatPiece, setMultiEatPiece]     = useState(null);
  const [lastMove, setLastMove]               = useState(null);
  const [myRating, setMyRating]               = useState(1000);
  const [notification, setNotification]       = useState(null);

  // UI state
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings]       = useState(false);

  // Visual preferences — persisted in localStorage
  const [boardThemeIdx, setBoardThemeIdx]     = useState(() => +(localStorage.getItem("sh_board") ?? 0));
  const [myPieceId, setMyPieceId]             = useState(() => localStorage.getItem("sh_piece") || "dark");
  const [boardFlipped, setBoardFlipped]       = useState(() => localStorage.getItem("sh_flip") === "1");

  // Chosen side before game creation: "b" = qora, "w" = oq
  // After o'yin boshlanganida, server qiymatiga qarab aniqlanadi
  const [chosenSide, setChosenSide]           = useState("b");

  // Persist settings
  useEffect(() => { localStorage.setItem("sh_board", boardThemeIdx); }, [boardThemeIdx]);
  useEffect(() => { localStorage.setItem("sh_piece", myPieceId); }, [myPieceId]);
  useEffect(() => { localStorage.setItem("sh_flip", boardFlipped ? "1" : "0"); }, [boardFlipped]);

  const myColor = useCallback(
    () => (game?.player1 === user?.uid ? game?.player1Side || "b" : game?.player2Side || "w"),
    [game, user]
  );

  // Load my rating
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(s => {
      if (s.exists()) setMyRating(s.data().rating ?? 1000);
    });
  }, [user]);

  // Realtime game listener
  useEffect(() => {
    if (!gameId) return;
    return onSnapshot(doc(db, "games", gameId), snap => {
      if (snap.exists()) setGame({ id: snap.id, ...snap.data() });
    });
  }, [gameId]);

  const showNotif = (msg, duration = 2800) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), duration);
  };

  // ── CREATE ──
  // Tosh rangini tanlash imkoni: o'yin yaratishdan oldin rangini tanlaydi
  // Qaysi rangni tanlasa, o'sha tomondan o'ynaydi
  const createGame = async () => {
    const id = `game_${Date.now()}`;
    // Creator tanlagan tomoni: agar "b" tanlasa, u player1 (b=qora), aks holda player2 bo'lishi kerak
    // Lekin soddalik uchun: player1 har doim creator, lekin creator o'z rangini tanlaydi
    const myGameColor = chosenSide; // "b" yoki "w"

    await setDoc(doc(db, "games", id), {
      board: createBoard(),
      player1: user.uid,
      player1Email: user.email || "",
      player1Name: user.displayName || user.email?.split("@")[0] || user.uid.slice(0, 8),
      player1Side: myGameColor,           // creator qaysi rangda o'ynashi
      player1PieceId: myPieceId,         // creator tosh rangi
      player2: "",
      player2Email: "",
      player2Name: "",
      player2Side: myGameColor === "b" ? "w" : "b",  // raqibga teskari rang
      player2PieceId: "white",           // default, raqib o'zi o'zgartiradi
      player1Rating: myRating,
      player2Rating: 1000,
      turn: user.uid,  // har doim creator boshlaydi (qora avval yuradi)
      // Agar creator oq tanlagan bo'lsa ham, qoidaga ko'ra qora (raqib) boshlaydi
      // Bu quyida turn mantiqida hal qilinadi
      status: "waiting",
      winner: "",
      moveCount: 0,
    });
    setGameId(id);
    setSelected(null); setMoves([]);
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
      player2PieceId: myPieceId,
      player2Rating: myRating,
      status: "playing",
    });
    setGameId(id);
    showNotif("✅ O'yinga qo'shildingiz!");
  };

  // ── CLICK ──
  const handleClick = async (i, j) => {
    if (!game || game.winner) return;
    if (game.status !== "playing") return;

    const color = myColor();

    // Faqat o'z navbatida bosish mumkin
    // Navbatni tekshirish: turn = user.uid bo'lishi kerak
    if (game.turn !== user.uid) return;

    const board = [...game.board];
    const idx = i * 8 + j;
    const mustEat = hasCapture(board, color);

    if (selected) {
      const move = moves.find(m => m.i === i && m.j === j);
      if (!move) {
        const piece = board[idx];
        if (piece && piece.startsWith(color)) {
          const m = getMoves(i, j, board, piece, mustEat);
          if (mustEat && m.filter(x => x.eat).length === 0) {
            showNotif("⚠️ Majburiy urish! Boshqa tosh tanlang"); return;
          }
          setSelected({ i, j }); setMoves(m);
        }
        return;
      }
      if (mustEat && !move.eat) { showNotif("⚠️ Majburiy urish!"); return; }

      const fromIdx = selected.i * 8 + selected.j;
      const piece = board[fromIdx];
      board[idx] = piece;
      board[fromIdx] = "";
      if (move.eat) board[move.eat.i * 8 + move.eat.j] = "";

      // Promotion to king
      if (piece === "w" && i === 0) board[idx] = "wk";
      if (piece === "b" && i === 7) board[idx] = "bk";

      setLastMove({ from: fromIdx, to: idx });

      // Multi-capture
      if (move.eat) {
        const more = getMoves(i, j, board, board[idx], true);
        if (more.length > 0 && !multiEatPiece) {
          setSelected({ i, j }); setMoves(more);
          setMultiEatPiece({ i, j });
          await updateDoc(doc(db, "games", gameId), { board });
          return;
        }
      }

      // Win check
      const enemy = color === "b" ? "w" : "b";
      const enemyLeft  = board.some(c => c && c.startsWith(enemy));
      const enemyMoved = board.some((cell, ci) => {
        if (!cell || !cell.startsWith(enemy)) return false;
        const ei = Math.floor(ci / 8), ej = ci % 8;
        return getMoves(ei, ej, board, cell).length > 0;
      });

      if (!enemyLeft || !enemyMoved) {
        const opId    = user.uid === game.player1 ? game.player2 : game.player1;
        const opRating = user.uid === game.player1 ? game.player2Rating : game.player1Rating;
        const delta = calcDelta(true, opRating, myRating);
        await updateDoc(doc(db, "games", gameId), { board, winner: user.uid, status: "done" });
        await updateDoc(doc(db, "users", user.uid), { wins: increment(1), rating: increment(delta) });
        await updateDoc(doc(db, "users", opId), { losses: increment(1), rating: increment(-delta) });
        showNotif(`🏆 G'alaba! Reyting: +${delta}`, 3500);
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
        showNotif("⚠️ Majburiy urish qoida! Boshqa tosh tanlang"); return;
      }
      if (m.length === 0) return;
      setSelected({ i, j }); setMoves(m);
    }
  };

  // ── SURRENDER ──
  const surrender = async () => {
    if (!game || game.status !== "playing" || game.winner) return;
    const opId    = user.uid === game.player1 ? game.player2 : game.player1;
    const opRating = user.uid === game.player1 ? game.player2Rating : game.player1Rating;
    const delta = calcDelta(false, opRating, myRating);
    await updateDoc(doc(db, "games", gameId), { winner: opId, status: "done" });
    await updateDoc(doc(db, "users", user.uid), { losses: increment(1), rating: increment(-Math.abs(delta)) });
    await updateDoc(doc(db, "users", opId), { wins: increment(1), rating: increment(Math.abs(delta)) });
    showNotif("🏳️ Taslim bo'ldingiz");
  };

  // ── RESET ──
  const resetGame = () => {
    setGameId(""); setGame(null);
    setSelected(null); setMoves([]);
    setLastMove(null); setMultiEatPiece(null);
  };

  // ── DERIVED ──
  const color        = game ? myColor() : null;
  const theme        = BOARD_THEMES[boardThemeIdx];

  // O'yin davomida tosh ranglari
  const myStyleId    = game ? (user.uid === game.player1 ? game.player1PieceId : game.player2PieceId) ?? myPieceId : myPieceId;
  const opStyleId    = game ? (user.uid === game.player1 ? game.player2PieceId : game.player1PieceId) ?? "white" : "white";

  // ═══════════════════════════════════════════════════════════════
  // BOARD FLIP LOGIC
  // Asosiy qoida: siz tanlagan rang sizni PASTDA ko'rsatadi.
  // Qora tosh odatda pastda (standart) → qora o'yinchi flip yo'q
  // Oq tosh pastda bo'lishi uchun → oq o'yinchi uchun board 180° aylanadi
  // boardFlipped toggle bu avtomatikni teskarisiga qiladi
  // ═══════════════════════════════════════════════════════════════
  const autoFlip   = color === "w";
  const shouldFlip = boardFlipped ? !autoFlip : autoFlip;

  const myStyle = getPieceStyle(myStyleId);

  return (
    <div style={{
      minHeight: "100vh", color: "#f1f5f9",
      background: "radial-gradient(ellipse at 20% 10%, #0f1d35 0%, #080e1a 55%, #040810 100%)",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>

      {/* ── TOAST NOTIFICATION ── */}
      {notification && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 300, background: "#0f172a", border: "1px solid #1e293b",
          padding: "11px 24px", borderRadius: 999,
          fontSize: 14, fontWeight: 500, color: "#f1f5f9",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          animation: "toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          whiteSpace: "nowrap",
        }}>
          {notification}
        </div>
      )}

      {/* ── MODALS ── */}
      <Leaderboard visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <SettingsModal
        visible={showSettings} onClose={() => setShowSettings(false)}
        boardThemeIdx={boardThemeIdx} setBoardThemeIdx={setBoardThemeIdx}
        myPieceId={myPieceId} setMyPieceId={setMyPieceId}
        boardFlipped={boardFlipped} setBoardFlipped={setBoardFlipped}
      />

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 40px" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.5px", margin: 0 }}>
              <span style={{ color: "#f59e0b" }}>♟</span>
              <span style={{
                marginLeft: 8,
                background: "linear-gradient(90deg,#f59e0b,#f97316)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>SHASHKA</span>
            </h1>
            <p style={{ color: "#475569", fontSize: 12, margin: "3px 0 0" }}>
              Reyting:{" "}
              <span style={{ color: "#34d399", fontWeight: 700 }}>{myRating}</span>
              {color && (
                <span style={{ marginLeft: 8, color: "#64748b" }}>
                  · Sizning rang:{" "}
                  <span style={{ color: myStyle.preview === myStyle.from ? "#f1f5f9" : myStyle.preview, fontWeight: 600 }}>
                    {getPieceStyle(myStyleId).name}
                  </span>
                  {" "}({color === "b" ? "qora tosh" : "oq tosh"})
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                border: "1px solid #1e293b", background: "rgba(15,23,42,0.6)",
                color: "#94a3b8", fontSize: 16,
              }}
              title="Sozlamalar"
            >⚙️</button>
            <button
              onClick={() => setShowLeaderboard(true)}
              style={{
                padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                border: "1px solid rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.08)",
                color: "#f59e0b", fontSize: 13, fontWeight: 600,
              }}
            >🏆 Reyting</button>
          </div>
        </div>

        {/* ── LOBBY: O'YIN YARATISH / QOSHILISH ── */}
        {!gameId && (
          <div style={{
            background: "rgba(15,23,42,0.7)", border: "1px solid #1e293b",
            borderRadius: 16, padding: 20, marginBottom: 16,
          }}>

            {/* Rang tanlash */}
            <div style={{ marginBottom: 20 }}>
              <ColorPicker
                label="🎨 O'yin rangini tanlang (siz qaysi toshda o'ynaysiz?)"
                selectedId={myPieceId}
                onSelect={(id) => { setMyPieceId(id); }}
              />

              {/* Tomon tanlash */}
              <div style={{ marginTop: 14 }}>
                <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>
                  Qaysi tomon bilan o'ynashni tanlang:
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { val: "b", label: "⬛ Qora tosh (avval yuradi)" },
                    { val: "w", label: "⬜ Oq tosh (ikkinchi yuradi)" },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setChosenSide(opt.val)}
                      style={{
                        flex: 1, padding: "9px 8px", borderRadius: 10, cursor: "pointer",
                        fontSize: 12, fontWeight: 600,
                        border: `1px solid ${chosenSide === opt.val ? "rgba(250,204,21,0.5)" : "#1e293b"}`,
                        background: chosenSide === opt.val ? "rgba(250,204,21,0.1)" : "rgba(15,23,42,0.5)",
                        color: chosenSide === opt.val ? "#facc15" : "#64748b",
                        transition: "all 0.2s",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #1e293b", marginBottom: 16 }}/>

            {/* Create button */}
            <button
              onClick={createGame}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12, cursor: "pointer",
                border: "none", fontWeight: 700, fontSize: 15, color: "#fff",
                background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                boxShadow: "0 4px 20px rgba(37,99,235,0.35)",
                marginBottom: 12, transition: "opacity 0.2s",
              }}
              onMouseEnter={e => e.target.style.opacity = "0.9"}
              onMouseLeave={e => e.target.style.opacity = "1"}
            >
              ＋ Yangi o'yin yaratish
            </button>

            {/* Join */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={inputId}
                onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && joinGame()}
                placeholder="Do'stingizning o'yin ID kiriting…"
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13,
                  border: "1px solid #1e293b", background: "#060c18",
                  color: "#f1f5f9", outline: "none",
                }}
              />
              <button
                onClick={joinGame}
                style={{
                  padding: "10px 18px", borderRadius: 10, cursor: "pointer",
                  border: "none", fontWeight: 600, fontSize: 13, color: "#fff",
                  background: "#059669", transition: "background 0.2s",
                }}
              >Qo'shilish</button>
            </div>
          </div>
        )}

        {/* ── GAME ID BADGE ── */}
        {gameId && game && (
          <div style={{ marginBottom: 10 }}>
            <GameIdBadge gameId={gameId} />
          </div>
        )}

        {/* ── KIM BILAN O'YNAYAPMAN ── */}
        {game && game.status === "playing" && (
          <div style={{ marginBottom: 10 }}>
            <OpponentBar game={game} myUserId={user.uid} opPieceStyleId={opStyleId} />
          </div>
        )}

        {/* ── STATUS BAR ── */}
        {game && (
          <div style={{ marginBottom: 12 }}>
            <StatusBar
              game={game} myColor={color} userId={user.uid}
              myStyleId={myStyleId} opStyleId={opStyleId}
            />
          </div>
        )}

        {/* ── BOARD ── */}
        {game && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>

            {/* Quick flip button */}
            {game.status === "playing" && (
              <button
                onClick={() => setBoardFlipped(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                  border: "1px solid #1e293b", background: "rgba(15,23,42,0.5)",
                  color: "#64748b", fontSize: 12, transition: "all 0.2s",
                }}
              >
                🔄 {shouldFlip ? "Standart holat" : "Doskani aylantirish"}
              </button>
            )}

            {/* Board */}
            <div style={{
              borderRadius: 14, overflow: "hidden",
              border: "3px solid #0f172a",
              boxShadow: "0 12px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
              transform: shouldFlip ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8,54px)" }}>
                {game.board.map((cell, index) => {
                  const row = Math.floor(index / 8), col = index % 8;
                  const isDark     = (row + col) % 2 === 1;
                  const isMovable  = moves.some(m => m.i === row && m.j === col);
                  const isSelected = selected?.i === row && selected?.j === col;
                  const isLastFrom = lastMove?.from === index;
                  const isLastTo   = lastMove?.to   === index;
                  const isKing     = cell.includes("k");
                  const owner      = cell ? cell[0] : null;

                  // Piece style: o'z toshi yoki raqib toshi
                  const pStyleId = owner === color ? myStyleId : opStyleId;

                  let bg = isDark ? theme.dark : theme.light;
                  if (isDark && (isLastFrom || isLastTo)) bg = theme.accent;
                  if (!isDark && (isLastFrom || isLastTo)) bg = theme.light + "cc";

                  return (
                    <div
                      key={index}
                      onClick={() => handleClick(row, col)}
                      style={{
                        width: 54, height: 54, background: bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        position: "relative", cursor: "pointer", userSelect: "none",
                        // Counter-rotate each cell when board flipped so pieces remain upright
                        transform: shouldFlip ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "background 0.35s ease",
                      }}
                    >
                      {/* Move hint */}
                      {isMovable && !cell && (
                        <>
                          <div style={{
                            position: "absolute", width: 20, height: 20, borderRadius: "50%",
                            background: "rgba(74,222,128,0.35)",
                            animation: "pingDot 1.3s ease-in-out infinite",
                          }}/>
                          <div style={{
                            position: "absolute", width: 13, height: 13, borderRadius: "50%",
                            background: "rgba(74,222,128,0.9)",
                            boxShadow: "0 0 8px rgba(74,222,128,0.6)",
                          }}/>
                        </>
                      )}

                      {/* Capture highlight */}
                      {isMovable && cell && (
                        <div style={{
                          position: "absolute", inset: 3,
                          border: "3px solid rgba(248,113,113,0.9)",
                          borderRadius: 6, pointerEvents: "none",
                          boxShadow: "inset 0 0 8px rgba(248,113,113,0.3)",
                          animation: "captureGlow 1s ease-in-out infinite alternate",
                        }}/>
                      )}

                      {/* Piece */}
                      {cell && (
                        <Piece
                          styleId={pStyleId}
                          isKing={isKing}
                          selected={isSelected}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Board legend */}
            <div style={{ color: "#334155", fontSize: 11, textAlign: "center", lineHeight: 1.6 }}>
              {color === "b"
                ? "⬛ Siz — qora tosh (pastda)"
                : "⬜ Siz — oq tosh (pastda)"}
              {"  ·  "}
              {game.moveCount ?? 0} ta yurish qilindi
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {game.status === "playing" && !game.winner && (
                <button
                  onClick={surrender}
                  style={{
                    padding: "9px 20px", borderRadius: 10, cursor: "pointer",
                    border: "1px solid rgba(239,68,68,0.3)",
                    background: "rgba(239,68,68,0.08)", color: "#f87171",
                    fontSize: 13, fontWeight: 600, transition: "background 0.2s",
                  }}
                >🏳️ Taslim bo'lish</button>
              )}
              {(game.winner || game.status === "done") && (
                <button
                  onClick={resetGame}
                  style={{
                    padding: "11px 28px", borderRadius: 12, cursor: "pointer",
                    border: "none", fontWeight: 700, fontSize: 14, color: "#fff",
                    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                    boxShadow: "0 4px 20px rgba(37,99,235,0.35)",
                    transition: "opacity 0.2s",
                  }}
                >🔄 Yangi o'yin</button>
              )}
            </div>
          </div>
        )}

        {/* ── RULES ── */}
        {!game && (
          <details style={{
            background: "rgba(15,23,42,0.4)", border: "1px solid #1e293b",
            borderRadius: 12, overflow: "hidden", marginTop: 8,
          }}>
            <summary style={{ padding: "12px 16px", cursor: "pointer", color: "#64748b", fontSize: 13, userSelect: "none" }}>
              📖 Shashka qoidalari
            </summary>
            <div style={{ padding: "0 16px 16px", color: "#475569", fontSize: 13, lineHeight: 2 }}>
              <p>• Toshlar faqat diagonal bo'yicha harakat qiladi</p>
              <p>• Qora tosh pastdan yuqoriga, oq tosh yuqoridan pastga yuradi</p>
              <p>• <b style={{ color: "#94a3b8" }}>Majburiy urish:</b> raqib toshini urish mumkin bo'lsa, albatta uriladi</p>
              <p>• Ketma-ket urish: bir yurishda bir necha tosh urish mumkin</p>
              <p>• <b style={{ color: "#94a3b8" }}>Shoh (♛):</b> qarama-qarshi oxirgi qatorga yetganda shohga aylanadi</p>
              <p>• Shoh barcha diagonal yo'nalishlarda istalgan masofaga yuradi</p>
              <p>• Raqibning barcha toshlari urilsa yoki yura olmay qolsa — g'alaba!</p>
            </div>
          </details>
        )}

      </div>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        * { box-sizing: border-box; }
        @keyframes pingDot {
          0%,100% { transform: scale(1); opacity: 0.7; }
          50%      { transform: scale(1.8); opacity: 0; }
        }
        @keyframes captureGlow {
          from { border-color: rgba(248,113,113,0.7); }
          to   { border-color: rgba(248,113,113,1); box-shadow: inset 0 0 12px rgba(248,113,113,0.4); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes pulseText {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.6; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: #334155; }
        input:focus { border-color: #3b82f6 !important; }
        details > summary::-webkit-details-marker { display: none; }
        details > summary::marker { display: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}
