import { useRef, useState, useEffect } from "react";
import useWordGame from "./hooks/useWordGame";
import { CATEGORIES } from "./data/words";

// ═══════════════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════════════
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
`;

const STATUS_CONFIG = {
  correct:   { bg:"#dcfce7", border:"#22c55e", text:"#16a34a", msg:"✓ To'g'ri!" },
  wrong:     { bg:"#fee2e2", border:"#ef4444", text:"#dc2626", msg:"✗ Noto'g'ri" },
  duplicate: { bg:"#fef3c7", border:"#f59e0b", text:"#d97706", msg:"Allaqachon topilgan!" },
  idle:      { bg:"transparent", border:"transparent", text:"transparent", msg:"" },
};

// ─── LETTER CIRCLE ────────────────────────────────────────────
// Places letters in a circle with SVG lines connecting selected ones
const LetterCircle = ({ letters, selected, onSelect, hintedLetters, catColor, status }) => {
  const svgRef  = useRef(null);
  const btnRefs = useRef({});
  const [lines, setLines] = useState([]);

  // Recompute connector lines whenever selection changes
  useEffect(() => {
    if (selected.length < 2 || !svgRef.current) { setLines([]); return; }
    const svgRect = svgRef.current.getBoundingClientRect();
    const pts = selected.map(s => {
      const el = btnRefs.current[s.idx];
      if (!el) return null;
      const r  = el.getBoundingClientRect();
      return { x: r.left - svgRect.left + r.width/2, y: r.top - svgRect.top + r.height/2 };
    }).filter(Boolean);
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i+1]]);
    setLines(segs);
  }, [selected]);

  const count  = letters.length;
  const radius = count <= 6 ? 110 : count <= 8 ? 120 : 130;
  const cx     = 160, cy = 160;

  return (
    <div style={{ position:"relative", width:320, height:320, margin:"0 auto" }}>
      {/* SVG for connecting lines */}
      <svg ref={svgRef} style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:1, width:"100%", height:"100%" }}>
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <circle cx="3" cy="3" r="2" fill={catColor}/>
          </marker>
        </defs>
        {lines.map(([a,b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={catColor} strokeWidth={3} strokeLinecap="round"
            strokeOpacity={0.7}
            style={{ filter:`drop-shadow(0 0 4px ${catColor}80)` }}
          />
        ))}
      </svg>

      {/* Letter buttons in circle */}
      {letters.map(({ letter, idx }, i) => {
        const angle  = (2 * Math.PI / count) * i - Math.PI / 2;
        const x      = cx + radius * Math.cos(angle);
        const y      = cy + radius * Math.sin(angle);
        const isSel  = selected.some(s => s.idx === idx);
        const isHint = hintedLetters.includes(letter);
        const selOrder = selected.findIndex(s => s.idx === idx) + 1;

        return (
          <button
            key={idx}
            ref={el => btnRefs.current[idx] = el}
            onClick={() => onSelect(letter, idx)}
            style={{
              position:"absolute",
              left: x - 28,
              top:  y - 28,
              width: 56, height: 56,
              borderRadius: "50%",
              border: isSel ? `3px solid ${catColor}` : isHint ? `3px solid #f59e0b` : "2px solid rgba(0,0,0,0.08)",
              background: isSel
                ? catColor
                : isHint
                  ? "#fffbeb"
                  : "white",
              color: isSel ? "white" : isHint ? "#d97706" : "#1a1a1a",
              fontSize: 20, fontWeight: 800,
              fontFamily: "Nunito, sans-serif",
              cursor: "pointer", zIndex: 2,
              boxShadow: isSel
                ? `0 4px 20px ${catColor}60, 0 0 0 4px ${catColor}20`
                : isHint
                  ? "0 4px 14px rgba(245,158,11,0.3)"
                  : "0 2px 10px rgba(0,0,0,0.1)",
              transform: isSel ? "scale(1.15)" : "scale(1)",
              transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
              animation: status === "wrong" && isSel
                ? "shake 0.4s ease" : "none",
            }}
          >
            {letter}
            {/* Selection order badge */}
            {isSel && selOrder > 0 && (
              <span style={{
                position:"absolute", top:-6, right:-6,
                width:18, height:18, borderRadius:"50%",
                background:"#1a1a1a", color:"#fff",
                fontSize:10, fontWeight:900,
                display:"flex", alignItems:"center", justifyContent:"center",
                border:"2px solid #fff",
              }}>{selOrder}</span>
            )}
          </button>
        );
      })}

      {/* Center dot */}
      <div style={{
        position:"absolute",
        left: cx - 8, top: cy - 8,
        width:16, height:16, borderRadius:"50%",
        background: catColor + "30",
        border: `2px solid ${catColor}50`,
      }}/>
    </div>
  );
};

// ─── WORD SLOTS ────────────────────────────────────────────────
const WordSlots = ({ targetWords, foundWords, catColor, catBg }) => {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
      {targetWords.map((w, i) => {
        const found = foundWords.includes(w.word);
        return (
          <div key={i} style={{
            display:"flex", gap:3, alignItems:"center",
          }}>
            {w.word.split("").map((ch, ci) => (
              <div key={ci} style={{
                width:32, height:38,
                background: found ? catBg : "#f3f4f6",
                border: found ? `2px solid ${catColor}` : "2px solid #e5e7eb",
                borderRadius:8,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:found ? 16 : 12, fontWeight:800,
                color: found ? catColor : "#d1d5db",
                transition:"all 0.3s ease",
                transform: found ? "scale(1.05)" : "scale(1)",
                boxShadow: found ? `0 2px 8px ${catColor}30` : "none",
              }}>
                {found ? ch : "·"}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ─── CURRENT WORD DISPLAY ─────────────────────────────────────
const CurrentWordDisplay = ({ word, status, catColor }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  return (
    <div style={{
      minHeight:56,
      display:"flex", alignItems:"center", justifyContent:"center",
      flexDirection:"column", gap:4,
    }}>
      {word ? (
        <div style={{
          display:"flex", gap:4,
          animation: status === "wrong" ? "shake 0.4s ease" : status === "correct" ? "pop 0.3s ease" : "none",
        }}>
          {word.split("").map((ch, i) => (
            <div key={i} style={{
              width:38, height:44, borderRadius:10,
              background: status==="correct" ? catColor : status==="wrong" ? "#fef2f2" : "#f3f4f6",
              border: `2px solid ${status==="correct" ? catColor : status==="wrong" ? "#ef4444" : "#e5e7eb"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, fontWeight:800,
              color: status==="correct" ? "#fff" : status==="wrong" ? "#ef4444" : "#1a1a1a",
              transition:"all 0.2s ease",
              boxShadow: status==="correct" ? `0 4px 12px ${catColor}40` : "none",
            }}>
              {ch}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          fontSize:14, color:"#9ca3af", fontWeight:600,
          letterSpacing:"0.1em",
        }}>
          Harflarni tanlang…
        </div>
      )}
      {status !== "idle" && (
        <div style={{
          fontSize:12, fontWeight:700, color:cfg.text,
          animation:"fadeIn 0.15s ease",
        }}>{cfg.msg}</div>
      )}
    </div>
  );
};

// ─── SCORE POPUP ──────────────────────────────────────────────
const ScorePopup = ({ score, visible }) => (
  visible ? (
    <div style={{
      position:"absolute", top:-20, right:0, zIndex:10,
      fontSize:18, fontWeight:900, color:"#22c55e",
      animation:"scoreFloat 1s ease forwards",
      pointerEvents:"none",
    }}>+{score}</div>
  ) : null
);

// ─── ACHIEVEMENT TOAST ────────────────────────────────────────
const AchievementToast = ({ ach, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
      zIndex:1000,
      background:"#1a1a1a", color:"#fff",
      borderRadius:16, padding:"12px 24px",
      boxShadow:"0 8px 32px rgba(0,0,0,0.3)",
      display:"flex", alignItems:"center", gap:10,
      animation:"slideDown 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      fontFamily:"Nunito, sans-serif",
    }}>
      <span style={{ fontSize:24 }}>{ach.icon}</span>
      <div>
        <div style={{ fontSize:11, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>
          Yutuq qo'lga kiritildi!
        </div>
        <div style={{ fontSize:15, fontWeight:800 }}>{ach.label}</div>
      </div>
    </div>
  );
};

// ─── CATEGORY MENU ────────────────────────────────────────────
const CategoryMenu = ({ active, onChange, scores }) => (
  <div style={{
    display:"flex", gap:8, overflowX:"auto",
    paddingBottom:4, scrollbarWidth:"none",
  }}>
    {CATEGORIES.map(cat => {
      const isActive = cat.id === active;
      return (
        <button key={cat.id} onClick={() => onChange(cat.id)} style={{
          flexShrink:0,
          padding:"8px 16px", borderRadius:999,
          border: `2px solid ${isActive ? cat.color : "rgba(0,0,0,0.08)"}`,
          background: isActive ? cat.color : "#fff",
          color: isActive ? "#fff" : "#6b7280",
          fontSize:13, fontWeight:700,
          fontFamily:"Nunito, sans-serif", cursor:"pointer",
          display:"flex", alignItems:"center", gap:6,
          transition:"all 0.18s ease",
          boxShadow: isActive ? `0 4px 14px ${cat.color}40` : "none",
        }}>
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
          {scores[cat.id] > 0 && (
            <span style={{
              fontSize:10, fontWeight:900,
              background: isActive ? "rgba(255,255,255,0.25)" : cat.color+"15",
              color: isActive ? "#fff" : cat.color,
              borderRadius:999, padding:"1px 6px",
            }}>{scores[cat.id]}</span>
          )}
        </button>
      );
    })}
  </div>
);

// ─── LEVEL COMPLETE OVERLAY ────────────────────────────────────
const LevelComplete = ({ catInfo, foundWords, onNext, totalScore }) => (
  <div style={{
    position:"absolute", inset:0, zIndex:50,
    background:"rgba(255,255,255,0.96)",
    backdropFilter:"blur(4px)",
    borderRadius:24,
    display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center",
    gap:16, padding:32,
    animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
  }}>
    <div style={{ fontSize:60 }}>🎉</div>
    <div style={{ fontSize:26, fontWeight:900, color:"#1a1a1a", textAlign:"center" }}>
      Level yakunlandi!
    </div>
    <div style={{
      background: catInfo.bg,
      border: `2px solid ${catInfo.color}`,
      borderRadius:14, padding:"10px 20px",
      fontSize:15, fontWeight:700, color:catInfo.color,
    }}>
      {catInfo.icon} {catInfo.label}: {foundWords.length} ta so'z
    </div>
    <div style={{ fontSize:14, color:"#6b7280", fontWeight:600 }}>
      Jami: <span style={{ color:"#1a1a1a", fontWeight:900 }}>{totalScore} ball</span>
    </div>
    <button onClick={onNext} style={{
      padding:"14px 32px", borderRadius:16,
      border:"none", cursor:"pointer",
      background: catInfo.color, color:"#fff",
      fontSize:16, fontWeight:800,
      fontFamily:"Nunito, sans-serif",
      boxShadow:`0 8px 24px ${catInfo.color}50`,
      transition:"transform 0.15s",
    }}
    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
    onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
    >
      Keyingi level →
    </button>
  </div>
);

// ─── ANALYTICS PANEL ──────────────────────────────────────────
const AnalyticsPanel = ({ analytics, scores }) => {
  const total   = analytics.total || 0;
  const topCat  = CATEGORIES.reduce((best, c) =>
    (analytics[c.id]||0) > (analytics[best.id]||0) ? c : best, CATEGORIES[0]);

  return (
    <div style={{
      background:"#f9fafb", borderRadius:16, padding:16,
      border:"1px solid rgba(0,0,0,0.07)",
    }}>
      <div style={{ fontSize:13, fontWeight:800, color:"#1a1a1a", marginBottom:12, textTransform:"uppercase", letterSpacing:"0.06em" }}>
        📊 Statistika
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <StatBox label="Jami topilgan" value={total} icon="📝"/>
        <StatBox label="Eng yuqori" value={`${topCat.icon} ${topCat.label}`} icon="🏆"/>
      </div>
      <div style={{ marginTop:12 }}>
        {CATEGORIES.map(cat => {
          const cnt = analytics[cat.id] || 0;
          const pct = total ? (cnt / total) * 100 : 0;
          return cnt > 0 ? (
            <div key={cat.id} style={{ marginBottom:6 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:12, color:"#6b7280", fontWeight:600 }}>{cat.icon} {cat.label}</span>
                <span style={{ fontSize:12, color:cat.color, fontWeight:700 }}>{cnt}</span>
              </div>
              <div style={{ height:6, background:"#e5e7eb", borderRadius:99, overflow:"hidden" }}>
                <div style={{
                  width:`${pct}%`, height:"100%",
                  background:cat.color, borderRadius:99,
                  transition:"width 0.6s ease",
                }}/>
              </div>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
};

const StatBox = ({ label, value, icon }) => (
  <div style={{
    background:"#fff", borderRadius:12, padding:"10px 14px",
    border:"1px solid rgba(0,0,0,0.06)",
  }}>
    <div style={{ fontSize:11, color:"#9ca3af", fontWeight:600, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:16, fontWeight:800, color:"#1a1a1a" }}>{value}</div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function WordGame() {
  const game = useWordGame();
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [pendingAch,    setPendingAch]    = useState(null);
  const [lastCorrectScore, setLastCorrectScore] = useState(0);
  const [showScorePopup,   setShowScorePopup]   = useState(false);

  const {
    activeCatInfo: cat,
    level, letters, targetWords, foundWords,
    selected, status, allFound, totalScore, streak,
    scores, hintsLeft, hintedLetters, dailyDone, dailyCatInfo,
    currentWord, CATEGORIES,
    changeCategory, selectLetter, shuffle,
    submitWord, removeLast, clearSelected,
    nextLevel, useHint, startDailyChallenge,
  } = game;

  // Show score popup on correct
  useEffect(() => {
    if (status === "correct" && currentWord) {
      const pts = currentWord.length * 10 + (currentWord.length > 5 ? 20 : 0);
      setLastCorrectScore(pts);
      setShowScorePopup(true);
      setTimeout(() => setShowScorePopup(false), 1000);
    }
  }, [status]);

  if (!cat) return null;

  return (
    <div style={{
      minHeight:"100vh",
      background:`linear-gradient(135deg, ${cat.color}08 0%, #ffffff 60%, ${cat.color}05 100%)`,
      fontFamily:"Nunito, sans-serif",
    }}>
      <style>{`
        ${FONTS}
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
        @keyframes pop {
          0%{transform:scale(1)}
          50%{transform:scale(1.1)}
          100%{transform:scale(1)}
        }
        @keyframes popIn {
          from{opacity:0;transform:scale(0.85)}
          to{opacity:1;transform:scale(1)}
        }
        @keyframes fadeIn {
          from{opacity:0;transform:translateY(-4px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes scoreFloat {
          0%{opacity:1;transform:translateY(0)}
          100%{opacity:0;transform:translateY(-40px)}
        }
        @keyframes slideDown {
          from{opacity:0;transform:translateX(-50%) translateY(-20px)}
          to{opacity:1;transform:translateX(-50%) translateY(0)}
        }
      `}</style>

      {/* Achievement toast */}
      {pendingAch && <AchievementToast ach={pendingAch} onDone={() => setPendingAch(null)}/>}

      <div style={{ maxWidth:480, margin:"0 auto", padding:"20px 16px 40px" }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:900, color:"#1a1a1a", margin:0, letterSpacing:"-0.02em" }}>
              So'z O'yini
            </h1>
            <div style={{ display:"flex", gap:8, marginTop:4, alignItems:"center" }}>
              {streak > 1 && (
                <span style={{
                  fontSize:12, fontWeight:700,
                  background:"#fff7ed", color:"#f97316",
                  borderRadius:999, padding:"2px 8px",
                  border:"1px solid #fed7aa",
                }}>🔥 {streak} kun ketma-ket</span>
              )}
            </div>
          </div>

          {/* Score + controls */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button
              onClick={() => setShowAnalytics(v => !v)}
              style={{ ...iconBtn, background: showAnalytics ? "#f3f4f6" : "transparent" }}
              title="Statistika"
            >📊</button>

            {/* Daily challenge badge */}
            <button onClick={startDailyChallenge} style={{
              padding:"6px 12px", borderRadius:999,
              border:`2px solid ${dailyDone ? "#22c55e" : "#f97316"}`,
              background: dailyDone ? "#f0fdf4" : "#fff7ed",
              color: dailyDone ? "#16a34a" : "#ea580c",
              fontSize:12, fontWeight:700, cursor:"pointer",
              fontFamily:"Nunito, sans-serif",
            }}>
              {dailyDone ? "✓ Bugun" : "⚡ Kunlik"}
            </button>

            <div style={{
              background: cat.color, color:"#fff",
              borderRadius:14, padding:"8px 14px",
              fontWeight:900, fontSize:17,
              boxShadow:`0 4px 14px ${cat.color}40`,
            }}>
              {totalScore}
            </div>
          </div>
        </div>

        {/* ── CATEGORY MENU ── */}
        <div style={{ marginBottom:16 }}>
          <CategoryMenu active={game.activeCat} onChange={changeCategory} scores={scores}/>
        </div>

        {/* ── ANALYTICS PANEL ── */}
        {showAnalytics && (
          <div style={{ marginBottom:16 }}>
            <AnalyticsPanel analytics={game.analytics} scores={scores}/>
          </div>
        )}

        {/* ── GAME CARD ── */}
        <div style={{
          background:"#fff",
          borderRadius:24, padding:"24px 20px",
          boxShadow:"0 4px 40px rgba(0,0,0,0.08)",
          border:`1px solid ${cat.color}20`,
          position:"relative", overflow:"hidden",
        }}>

          {/* Level complete overlay */}
          {allFound && (
            <LevelComplete
              catInfo={cat} foundWords={foundWords}
              onNext={nextLevel} totalScore={totalScore}
            />
          )}

          {/* Category + Level header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"6px 14px", borderRadius:999,
              background:cat.bg, border:`1.5px solid ${cat.color}`,
            }}>
              <span style={{ fontSize:16 }}>{cat.icon}</span>
              <span style={{ fontSize:13, fontWeight:800, color:cat.color }}>{cat.label}</span>
            </div>

            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {/* Progress */}
              <div style={{
                fontSize:13, fontWeight:700, color:"#9ca3af",
              }}>
                {foundWords.length}/{targetWords.length}
              </div>
              {/* Level badge */}
              <div style={{
                background:"#f3f4f6", borderRadius:999,
                padding:"4px 12px", fontSize:12, fontWeight:800, color:"#6b7280",
              }}>
                Level {level}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height:6, background:"#f3f4f6", borderRadius:99, marginBottom:20, overflow:"hidden" }}>
            <div style={{
              width:`${targetWords.length ? (foundWords.length/targetWords.length)*100 : 0}%`,
              height:"100%", background:cat.color, borderRadius:99,
              transition:"width 0.5s ease",
              boxShadow:`0 0 8px ${cat.color}60`,
            }}/>
          </div>

          {/* Word slots */}
          <div style={{ marginBottom:20 }}>
            <WordSlots
              targetWords={targetWords}
              foundWords={foundWords}
              catColor={cat.color}
              catBg={cat.bg}
            />
          </div>

          {/* Current word display */}
          <div style={{ position:"relative", marginBottom:8 }}>
            <CurrentWordDisplay word={currentWord} status={status} catColor={cat.color}/>
            {showScorePopup && <ScorePopup score={lastCorrectScore} visible/>}
          </div>

          {/* Letter circle */}
          <LetterCircle
            letters={letters}
            selected={selected}
            onSelect={selectLetter}
            hintedLetters={hintedLetters}
            catColor={cat.color}
            status={status}
          />

          {/* Action buttons row */}
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:16 }}>
            {/* Hint */}
            <button onClick={useHint} disabled={hintsLeft<=0} style={{
              ...actionBtn,
              background: hintsLeft > 0 ? "#fffbeb" : "#f9fafb",
              border:`2px solid ${hintsLeft>0?"#fcd34d":"#e5e7eb"}`,
              color: hintsLeft>0?"#d97706":"#d1d5db",
              opacity:hintsLeft>0?1:0.6,
            }}>
              💡 Hint ({hintsLeft})
            </button>

            {/* Shuffle */}
            <button onClick={shuffle} style={{
              ...actionBtn,
              background:"#f0f9ff",
              border:"2px solid #bae6fd",
              color:"#0284c7",
            }}>
              🔀 Aralashtir
            </button>

            {/* Backspace */}
            <button onClick={removeLast} disabled={!selected.length} style={{
              ...actionBtn,
              background:"#f9fafb",
              border:"2px solid #e5e7eb",
              color:"#6b7280",
              opacity:selected.length?1:0.5,
            }}>
              ⌫
            </button>
          </div>

          {/* Submit button */}
          {currentWord && (
            <button
              onClick={submitWord}
              style={{
                width:"100%", marginTop:12,
                padding:"14px", borderRadius:16,
                border:"none", cursor:"pointer",
                background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)`,
                color:"#fff", fontSize:16, fontWeight:800,
                fontFamily:"Nunito, sans-serif",
                boxShadow:`0 6px 20px ${cat.color}40`,
                transition:"transform 0.15s, box-shadow 0.15s",
                animation:"fadeIn 0.2s ease",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="scale(1.02)"; e.currentTarget.style.boxShadow=`0 8px 28px ${cat.color}60`; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow=`0 6px 20px ${cat.color}40`; }}
            >
              Tekshirish ✓
            </button>
          )}

        </div>

        {/* ── FOUND WORDS CHIPS ── */}
        {foundWords.length > 0 && (
          <div style={{
            background:"#fff", borderRadius:16, padding:"16px",
            marginTop:16, border:"1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
              Topilgan so'zlar
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {foundWords.map((w, i) => (
                <div key={i} style={{
                  padding:"5px 12px", borderRadius:999,
                  background: cat.bg, border:`1.5px solid ${cat.color}`,
                  fontSize:13, fontWeight:700, color:cat.color,
                  animation:"fadeIn 0.25s ease",
                }}>
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── SHARED BUTTON STYLES ─────────────────────────────────────
const actionBtn = {
  padding:"9px 16px", borderRadius:12,
  fontSize:13, fontWeight:700,
  fontFamily:"Nunito, sans-serif", cursor:"pointer",
  transition:"all 0.15s",
};

const iconBtn = {
  width:36, height:36, borderRadius:10,
  border:"1px solid rgba(0,0,0,0.08)",
  cursor:"pointer", fontSize:16,
  display:"flex", alignItems:"center", justifyContent:"center",
  transition:"all 0.15s",
};
