import { useRef, useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════
const CATEGORIES = [
  { id: "animals", label: "Hayvonlar", icon: "🐾", color: "#7C3AED", light: "#EDE9FE", dark: "#5B21B6" },
  { id: "food",    label: "Taomlar",   icon: "🍎", color: "#DC2626", light: "#FEF2F2", dark: "#991B1B" },
  { id: "nature",  label: "Tabiat",    icon: "🌿", color: "#059669", light: "#ECFDF5", dark: "#065F46" },
  { id: "body",    label: "Tana",      icon: "🫀", color: "#0369A1", light: "#EFF6FF", dark: "#1E3A5F" },
  { id: "home",    label: "Uy",        icon: "🏠", color: "#B45309", light: "#FFFBEB", dark: "#92400E" },
  { id: "sport",   label: "Sport",     icon: "⚽", color: "#BE185D", light: "#FDF2F8", dark: "#9D174D" },
];

const WORD_BANK = {
  animals: [
    { word: "MUSHUK",  hint: "Uy hayvoni, miyovlaydi",       def: "Ko'pchilik uyda boqadi" },
    { word: "SIGIR",   hint: "Sut beruvchi hayvon",           def: "Fermalarda ko'p bo'ladi" },
    { word: "TOVUQ",   hint: "Tuxum qo'yadi",                 def: "Qishloq hayvoni" },
    { word: "QUYON",   hint: "Sakrashni yaxshi ko'radi",      def: "Uzun quloqlari bor" },
    { word: "BALIQ",   hint: "Suvda yashaydi",                def: "Suzib yuradi" },
    { word: "KUCHUK",  hint: "Itning bolasi",                  def: "Juda sevimli" },
    { word: "AYIQ",    hint: "O'rmonda yashaydi",              def: "Katta va kuchli" },
    { word: "TULKI",   hint: "Ayyor hayvon",                   def: "Qizil rangda bo'ladi" },
    { word: "ESHAK",   hint: "Yuklarni tashiydi",              def: "Ix-ix deydi" },
    { word: "OT",      hint: "Minib yuriladi",                 def: "Eng tez hayvonlardan" },
    { word: "QOY",     hint: "Jun beradi",                     def: "Ma'a deydi" },
    { word: "ECHKI",   hint: "Tog'da yashaydi",                def: "Sut beradi" },
  ],
  food: [
    { word: "NON",     hint: "Kundalik oziq",        def: "Har kuni yeymiz" },
    { word: "GURUCH",  hint: "Osh uchun kerak",       def: "Donli o'simlik" },
    { word: "SABZI",   hint: "Qizil ildiz",           def: "Salatlarga solinadi" },
    { word: "TUXUM",   hint: "Tovuq qo'yadi",         def: "Qaynatiladi yoki qovuriladi" },
    { word: "PIYOZ",   hint: "Ko'z yoshlatadi",       def: "Taomlar asosi" },
    { word: "QOVUN",   hint: "Yozgi shirinlik",       def: "Sariq va shirin" },
    { word: "GILOS",   hint: "Qizil kichik meva",    def: "Daraxtda o'sadi" },
    { word: "OLMA",    hint: "Har kuni bir dona",    def: "Qizil yoki yashil" },
    { word: "LIMON",   hint: "Nordon va sariq",       def: "C vitamini ko'p" },
    { word: "BODRING", hint: "Yashil va uzunchoq",   def: "Suvga to'la" },
  ],
  nature: [
    { word: "DARYO",   hint: "Oqar suv",             def: "Dengizga quyiladi" },
    { word: "TOG",     hint: "Baland joy",            def: "Qorli cho'qqisi bor" },
    { word: "GUL",     hint: "Chiroyli o'simlik",    def: "Xushbo'y bo'ladi" },
    { word: "DARAXT",  hint: "Yog'och beradi",       def: "O'rmonda ko'p" },
    { word: "TOSH",    hint: "Qattiq narsa",          def: "Yerda yotadi" },
    { word: "BULUT",   hint: "Osmon paxtalari",      def: "Yomg'ir yog'diradi" },
    { word: "SHAMOL",  hint: "Ko'rinmas harakat",    def: "Yaproqlarni uchiradi" },
    { word: "QOYA",    hint: "Katta tosh",            def: "Tog'larda bo'ladi" },
    { word: "KOL",     hint: "Tinch suv havzasi",    def: "Atrofi qo'riqxona" },
    { word: "VODIY",   hint: "Tog'lar orasidagi",    def: "Tekis va unumdor" },
  ],
  body: [
    { word: "QOL",     hint: "5 barmoq bor",         def: "Ish qilamiz" },
    { word: "KOZ",     hint: "Ko'rish organi",        def: "Oyna kabi" },
    { word: "QULOQ",   hint: "Eshitish uchun",        def: "Boshning ikki yonida" },
    { word: "BURUN",   hint: "Hidlash organi",        def: "Yuz o'rtasida" },
    { word: "TIL",     hint: "Gapirish uchun",        def: "Ta'm biladi" },
    { word: "OYOQ",    hint: "Yurish uchun",          def: "Ikki dona" },
    { word: "BOSH",    hint: "Fikrlash organi",       def: "Miya ichida" },
    { word: "ELKA",    hint: "Yelka ham deyiladi",   def: "Yuklar ortiladi" },
    { word: "TIZZA",   hint: "Oyoq buxiladi",         def: "O'rtada joylashgan" },
    { word: "BARMOQ",  hint: "Qo'lda 5 ta",          def: "Nozik va mohir" },
  ],
  home: [
    { word: "STOL",    hint: "Ustida yoziladi",      def: "Mebel" },
    { word: "ESHIK",   hint: "Ochiladi, yopiladi",   def: "Kirish joyi" },
    { word: "DERAZA",  hint: "Yorug' kiradi",         def: "Shisha bor" },
    { word: "KARAVOT", hint: "Uxlash joyi",           def: "Yotoqxonada" },
    { word: "GILAM",   hint: "Polga solinadi",        def: "Yumshoq va issiq" },
    { word: "LAMPA",   hint: "Xonani yoritadi",      def: "Elektr bilan" },
    { word: "IDISH",   hint: "Ovqat solinadi",        def: "Oshxonada" },
    { word: "KALIT",   hint: "Qulfni ochadi",         def: "Cho'ntagimizda" },
    { word: "QOZON",   hint: "Ovqat pishiriladi",    def: "Katta idish" },
    { word: "SUPURGI", hint: "Pol supuriladi",        def: "Uy-ro'zg'or" },
  ],
  sport: [
    { word: "TOP",     hint: "Dumaloq narsa",         def: "O'yinda ishlatiladi" },
    { word: "GOL",     hint: "Darvozaga kiradi",      def: "G'alaba belgisi" },
    { word: "YUGUR",   hint: "Tez harakat",           def: "Atletika" },
    { word: "SUZISH",  hint: "Suvda harakat",         def: "Olimpiya sport" },
    { word: "KURASH",  hint: "Milliy sport",          def: "O'zbekiston g'ururи" },
    { word: "ZARBA",   hint: "Kuchli urish",          def: "Boksda ishlatiladi" },
    { word: "HAKAM",   hint: "O'yinni boshqaradi",   def: "Adolatli qaror" },
    { word: "RAQIB",   hint: "Qarshi tomon",          def: "O'yindosh" },
    { word: "MEDAL",   hint: "G'olib mukofoti",       def: "Oltin, kumush, bronza" },
    { word: "CHEMPION", hint: "Birinchi o'rin",       def: "Eng yaxshi o'yinchi" },
  ],
};

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getLevelWords(catId, level) {
  const bank = WORD_BANK[catId] || [];
  const count = Math.min(2 + level, 5);
  const offset = ((level - 1) * 2) % Math.max(1, bank.length - count + 1);
  return bank.slice(offset, offset + count);
}

function buildLetterPool(words) {
  const needed = [...new Set(words.flatMap(w => w.split("")))];
  const extra = "AEIOUTLRNSBGMKDVZPQHF".split("");
  const pool = [...needed];
  for (const ch of shuffleArray(extra)) {
    if (pool.length >= 9) break;
    if (!pool.includes(ch)) pool.push(ch);
  }
  return shuffleArray(pool.slice(0, 9)).map((l, i) => ({ letter: l, id: i }));
}

// ═══════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════
function useGame() {
  const [catId,      setCatId]      = useState("animals");
  const [level,      setLevel]      = useState(1);
  const [letters,    setLetters]    = useState([]);
  const [targets,    setTargets]    = useState([]);
  const [found,      setFound]      = useState([]);
  const [selected,   setSelected]   = useState([]);
  const [status,     setStatus]     = useState("idle"); // idle | correct | wrong | duplicate
  const [score,      setScore]      = useState(0);
  const [catScores,  setCatScores]  = useState({});
  const [hints,      setHints]      = useState(3);
  const [hintWord,   setHintWord]   = useState(null);
  const [lastPts,    setLastPts]    = useState(0);
  const [showPts,    setShowPts]    = useState(false);
  const timerRef = useRef(null);

  const cat = CATEGORIES.find(c => c.id === catId);

  const startLevel = useCallback((cId, lv) => {
    const words = getLevelWords(cId, lv);
    setTargets(words);
    setFound([]);
    setSelected([]);
    setStatus("idle");
    setHints(3);
    setHintWord(null);
    setLetters(buildLetterPool(words.map(w => w.word)));
  }, []);

  useEffect(() => { startLevel(catId, level); }, [catId, level, startLevel]);

  const changeCategory = (id) => { setCatId(id); setLevel(1); };

  const selectLetter = (letter, id) => {
    if (status === "correct" || status === "wrong") return;
    setSelected(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx >= 0) return prev.slice(0, idx);
      return [...prev, { letter, id }];
    });
  };

  const removeLast = () => setSelected(prev => prev.slice(0, -1));
  const clearAll   = () => setSelected([]);

  const shuffleLetters = () => setLetters(prev => shuffleArray(prev));

  const flash = (s, ms = 1200) => {
    setStatus(s);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setStatus("idle"), ms);
  };

  const submit = () => {
    const word = selected.map(s => s.letter).join("");
    if (!word) return;
    if (found.includes(word)) { flash("duplicate"); return; }
    const match = targets.find(t => t.word === word);
    if (match) {
      const pts = word.length * 12 + (word.length > 5 ? 25 : 0);
      setFound(prev => [...prev, word]);
      setScore(prev => prev + pts);
      setCatScores(prev => ({ ...prev, [catId]: (prev[catId] || 0) + pts }));
      setLastPts(pts);
      setShowPts(true);
      setTimeout(() => setShowPts(false), 1200);
      setStatus("correct");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setStatus("idle");
        setSelected([]);
      }, 700);
    } else {
      flash("wrong");
      setTimeout(() => setSelected([]), 500);
    }
  };

  const useHint = () => {
    if (hints <= 0) return;
    const unfound = targets.filter(t => !found.includes(t.word));
    if (!unfound.length) return;
    setHintWord(unfound[0]);
    setHints(h => h - 1);
  };

  const nextLevel = () => setLevel(l => l + 1);

  const allFound = found.length === targets.length && targets.length > 0;
  const currentWord = selected.map(s => s.letter).join("");

  return {
    cat, catId, level, letters, targets, found, selected, status,
    score, catScores, hints, hintWord, lastPts, showPts, allFound, currentWord,
    changeCategory, selectLetter, removeLast, clearAll, shuffleLetters,
    submit, useHint, nextLevel,
  };
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ── Category Tab Bar ──────────────────────────────────────────
const CategoryBar = ({ active, onChange, catScores }) => (
  <div style={{
    display: "flex", gap: 6, overflowX: "auto", padding: "0 0 2px",
    scrollbarWidth: "none", msOverflowStyle: "none",
  }}>
    {CATEGORIES.map(c => {
      const on = c.id === active;
      const pts = catScores[c.id] || 0;
      return (
        <button key={c.id} onClick={() => onChange(c.id)} style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
          padding: "7px 13px", borderRadius: 10,
          background: on ? c.color : "rgba(0,0,0,0.04)",
          border: on ? `2px solid ${c.color}` : "2px solid transparent",
          color: on ? "#fff" : "#555",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.16s",
        }}>
          <span style={{ fontSize: 14 }}>{c.icon}</span>
          <span>{c.label}</span>
          {pts > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800,
              background: on ? "rgba(255,255,255,0.25)" : c.light,
              color: on ? "#fff" : c.dark,
              borderRadius: 6, padding: "1px 5px",
            }}>{pts}</span>
          )}
        </button>
      );
    })}
  </div>
);

// ── Word Slots Row ────────────────────────────────────────────
const WordRow = ({ target, found: foundList, idx, cat, hintWord }) => {
  const isFound  = foundList.includes(target.word);
  const isHinted = hintWord?.word === target.word && !isFound;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Word number */}
      <span style={{
        width: 20, fontSize: 11, fontWeight: 700,
        color: isFound ? cat.color : "#aaa", textAlign: "right",
      }}>{idx + 1}.</span>

      {/* Letter boxes */}
      <div style={{ display: "flex", gap: 4 }}>
        {target.word.split("").map((ch, ci) => {
          const showFirst = isHinted && ci === 0;
          return (
            <div key={ci} style={{
              width: 34, height: 38, borderRadius: 8,
              background: isFound ? cat.color : showFirst ? "#FEF3C7" : "#F3F4F6",
              border: isFound
                ? `2px solid ${cat.color}`
                : showFirst
                  ? "2px solid #F59E0B"
                  : "2px dashed #D1D5DB",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 800,
              color: isFound ? "#fff" : showFirst ? "#B45309" : "transparent",
              transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              transform: isFound ? "scale(1.05)" : "scale(1)",
            }}>
              {isFound ? ch : showFirst ? target.word[0] : ""}
            </div>
          );
        })}
      </div>

      {/* Letter count badge */}
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: isFound ? cat.color : "#9CA3AF",
        background: isFound ? cat.light : "#F3F4F6",
        borderRadius: 6, padding: "2px 7px",
        border: isFound ? `1px solid ${cat.color}40` : "1px solid transparent",
        transition: "all 0.25s",
      }}>
        {target.word.length} harf
      </span>

      {/* Hint text */}
      {isHinted && (
        <span style={{
          fontSize: 11, color: "#D97706", fontWeight: 600,
          background: "#FFFBEB", borderRadius: 6,
          padding: "2px 8px", border: "1px solid #FDE68A",
        }}>
          💡 {target.hint}
        </span>
      )}

      {/* Found checkmark */}
      {isFound && (
        <span style={{
          fontSize: 14, color: cat.color,
          animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}>✓</span>
      )}
    </div>
  );
};

// ── Letter Circle ─────────────────────────────────────────────
const LetterCircle = ({ letters, selected, onSelect, cat, hintWord, found, status }) => {
  const areaRef = useRef(null);
  const btnRefs = useRef({});
  const [positions, setPositions] = useState({});
  const svgRef = useRef(null);

  const count  = letters.length;
  const radius = count <= 6 ? 100 : count <= 8 ? 108 : 114;
  const CX = 140, CY = 140;

  // Compute positions
  useEffect(() => {
    const pos = {};
    letters.forEach(({ letter, id }, i) => {
      const angle = (2 * Math.PI / count) * i - Math.PI / 2;
      pos[id] = {
        x: CX + radius * Math.cos(angle),
        y: CY + radius * Math.sin(angle),
      };
    });
    setPositions(pos);
  }, [letters, count, radius]);

  const hintFirstLetter = hintWord && !found.includes(hintWord.word) ? hintWord.word[0] : null;

  return (
    <div ref={areaRef} style={{ position: "relative", width: 280, height: 280, margin: "0 auto" }}>
      {/* SVG lines */}
      <svg ref={svgRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {selected.length >= 2 && selected.map((s, i) => {
          if (i === 0) return null;
          const a = positions[selected[i-1].id];
          const b = positions[s.id];
          if (!a || !b) return null;
          return (
            <line key={i}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={cat.color} strokeWidth={3}
              strokeLinecap="round" strokeOpacity={0.65}
            />
          );
        })}
      </svg>

      {/* Letter buttons */}
      {letters.map(({ letter, id }, i) => {
        const pos    = positions[id];
        if (!pos) return null;
        const isSel  = selected.some(s => s.id === id);
        const order  = selected.findIndex(s => s.id === id) + 1;
        const isHint = letter === hintFirstLetter;
        const isWrong = status === "wrong" && isSel;

        return (
          <button
            key={id}
            ref={el => btnRefs.current[id] = el}
            onClick={() => onSelect(letter, id)}
            style={{
              position: "absolute",
              left: pos.x - 26, top: pos.y - 26,
              width: 52, height: 52, borderRadius: "50%",
              border: isSel
                ? `2.5px solid ${cat.color}`
                : isHint
                  ? "2.5px solid #F59E0B"
                  : "2px solid rgba(0,0,0,0.1)",
              background: isSel ? cat.color : isHint ? "#FFFBEB" : "#FFFFFF",
              color: isSel ? "#fff" : isHint ? "#B45309" : "#1A1A1A",
              fontSize: 17, fontWeight: 800,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer", zIndex: 2,
              boxShadow: isSel
                ? `0 3px 14px ${cat.color}50`
                : "0 2px 8px rgba(0,0,0,0.09)",
              transform: isSel ? "scale(1.12)" : "scale(1)",
              transition: "all 0.16s cubic-bezier(0.34,1.56,0.64,1)",
              animation: isWrong ? "shake 0.35s ease" : "none",
            }}
          >
            {letter}
            {isSel && (
              <span style={{
                position: "absolute", top: -5, right: -5,
                width: 16, height: 16, borderRadius: "50%",
                background: "#111", color: "#fff",
                fontSize: 9, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1.5px solid #fff",
              }}>{order}</span>
            )}
          </button>
        );
      })}

      {/* Center */}
      <div style={{
        position: "absolute",
        left: CX - 7, top: CY - 7,
        width: 14, height: 14, borderRadius: "50%",
        background: `${cat.color}20`, border: `2px solid ${cat.color}40`,
      }} />
    </div>
  );
};

// ── Current Word Preview ──────────────────────────────────────
const WordPreview = ({ word, status, cat, lastPts, showPts }) => {
  const colors = {
    correct:   { bg: cat.color,  border: cat.color,  text: "#fff" },
    wrong:     { bg: "#FEF2F2",  border: "#EF4444",  text: "#DC2626" },
    duplicate: { bg: "#FFFBEB",  border: "#F59E0B",  text: "#D97706" },
    idle:      { bg: "#F3F4F6",  border: "#E5E7EB",  text: "#1A1A1A" },
  };
  const c = colors[status] || colors.idle;
  const msgs = { correct: "✓ To'g'ri!", wrong: "✗ Noto'g'ri", duplicate: "Allaqachon topilgan!" };

  return (
    <div style={{ minHeight: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {word ? (
        <div style={{
          display: "flex", gap: 4,
          animation: status === "wrong" ? "shake 0.35s ease" : status === "correct" ? "popIn 0.3s ease" : "none",
          position: "relative",
        }}>
          {word.split("").map((ch, i) => (
            <div key={i} style={{
              width: 40, height: 46, borderRadius: 9,
              background: c.bg, border: `2px solid ${c.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: c.text,
              transition: "all 0.18s",
            }}>{ch}</div>
          ))}
          {showPts && (
            <div style={{
              position: "absolute", top: -22, right: -10,
              fontSize: 15, fontWeight: 800, color: "#16A34A",
              animation: "floatUp 1.1s ease forwards",
              pointerEvents: "none",
            }}>+{lastPts}</div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.05em" }}>
          Harflarni tanlang...
        </div>
      )}
      {status !== "idle" && msgs[status] && (
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: c.text === "#fff" ? cat.dark : c.text,
          animation: "fadeIn 0.15s ease",
        }}>{msgs[status]}</div>
      )}
    </div>
  );
};

// ── Level Complete Overlay ────────────────────────────────────
const LevelComplete = ({ cat, found, score, onNext }) => (
  <div style={{
    position: "absolute", inset: 0, zIndex: 40, borderRadius: 20,
    background: "rgba(255,255,255,0.97)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 16, padding: 32,
    animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
  }}>
    <div style={{ fontSize: 56 }}>🏆</div>
    <div style={{ fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
      Level yakunlandi!
    </div>
    <div style={{
      display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center",
    }}>
      {found.map(w => (
        <span key={w} style={{
          padding: "5px 12px", borderRadius: 8,
          background: cat.light, color: cat.dark,
          border: `1.5px solid ${cat.color}40`,
          fontSize: 14, fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif",
        }}>{w}</span>
      ))}
    </div>
    <div style={{ fontSize: 14, color: "#6B7280", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
      Jami ball: <strong style={{ color: "#111" }}>{score}</strong>
    </div>
    <button onClick={onNext} style={{
      padding: "13px 30px", borderRadius: 12,
      background: cat.color, color: "#fff",
      border: "none", fontSize: 15, fontWeight: 700,
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      transition: "opacity 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >Keyingi level →</button>
  </div>
);

// ── Hint Panel ────────────────────────────────────────────────
const HintPanel = ({ hints, hintWord, cat, onUseHint }) => (
  <div style={{
    background: "#FAFAFA", borderRadius: 12,
    border: "1px solid #E5E7EB",
    padding: "11px 14px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 10,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 13 }}>💡</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Yordamchi</div>
        {hintWord ? (
          <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600, marginTop: 1 }}>
            {hintWord.hint}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>
            So'z topishda yordam olish
          </div>
        )}
      </div>
    </div>
    <button onClick={onUseHint} disabled={hints <= 0} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "7px 14px", borderRadius: 9,
      background: hints > 0 ? "#FEF3C7" : "#F3F4F6",
      border: hints > 0 ? "1.5px solid #FCD34D" : "1.5px solid #E5E7EB",
      color: hints > 0 ? "#B45309" : "#9CA3AF",
      fontSize: 13, fontWeight: 700, cursor: hints > 0 ? "pointer" : "default",
      fontFamily: "'DM Sans', sans-serif",
      opacity: hints > 0 ? 1 : 0.5,
      transition: "all 0.15s",
    }}>
      {[...Array(3)].map((_, i) => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          background: i < hints ? "#F59E0B" : "#D1D5DB",
          display: "inline-block",
        }} />
      ))}
      <span style={{ marginLeft: 2 }}>Hint</span>
    </button>
  </div>
);

// ── Found Words ───────────────────────────────────────────────
const FoundWords = ({ words, cat }) => {
  if (!words.length) return null;
  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: "1px solid rgba(0,0,0,0.07)",
      padding: "14px 16px", marginTop: 12,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        Topilgan so'zlar — {words.length} ta
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {words.map((w, i) => (
          <div key={i} style={{
            padding: "5px 12px", borderRadius: 8,
            background: cat.light, color: cat.dark,
            border: `1.5px solid ${cat.color}30`,
            fontSize: 13, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            animation: "fadeIn 0.2s ease",
          }}>{w}</div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function WordGame() {
  const g = useGame();

  if (!g.cat) return null;
  const { cat } = g;

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${cat.light} 0%, #FAFAFA 50%, #F8FAFC 100%)`,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-5px)}
          40%{transform:translateX(5px)}
          60%{transform:translateX(-3px)}
          80%{transform:translateX(3px)}
        }
        @keyframes popIn {
          from{opacity:0;transform:scale(0.88)}
          to{opacity:1;transform:scale(1)}
        }
        @keyframes fadeIn {
          from{opacity:0;transform:translateY(-3px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes floatUp {
          0%{opacity:1;transform:translateY(0)}
          100%{opacity:0;transform:translateY(-36px)}
        }
      `}</style>

      <div style={{ maxWidth: 460, margin: "0 auto", padding: "16px 14px 48px" }}>

        {/* ── HEADER ── */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>
              So'z O'yini
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginTop: 1 }}>
              {cat.icon} {cat.label} · Level {g.level}
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              background: cat.color, color: "#fff",
              borderRadius: 10, padding: "8px 16px",
              fontSize: 16, fontWeight: 800,
            }}>
              {g.score} ball
            </div>
          </div>
        </div>

        {/* ── CATEGORY BAR ── */}
        <div style={{ marginBottom: 14 }}>
          <CategoryBar active={g.catId} onChange={g.changeCategory} catScores={g.catScores} />
        </div>

        {/* ── GAME CARD ── */}
        <div style={{
          background: "#fff", borderRadius: 20,
          border: `1px solid ${cat.color}20`,
          boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
          padding: "20px 16px",
          position: "relative", overflow: "hidden",
        }}>
          {g.allFound && (
            <LevelComplete
              cat={cat} found={g.found}
              score={g.score} onNext={g.nextLevel}
            />
          )}

          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 5, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                width: `${g.targets.length ? (g.found.length / g.targets.length) * 100 : 0}%`,
                height: "100%", background: cat.color, borderRadius: 99,
                transition: "width 0.4s ease",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", whiteSpace: "nowrap" }}>
              {g.found.length} / {g.targets.length}
            </span>
          </div>

          {/* ── WORD SLOTS ── */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 10,
            marginBottom: 16, padding: "12px 10px",
            background: "#FAFAFA", borderRadius: 14,
            border: "1px solid #F3F4F6",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
              Topish kerak bo'lgan so'zlar
            </div>
            {g.targets.map((t, i) => (
              <WordRow
                key={t.word} target={t} found={g.found}
                idx={i} cat={cat} hintWord={g.hintWord}
              />
            ))}
          </div>

          {/* ── HINT PANEL ── */}
          <div style={{ marginBottom: 14 }}>
            <HintPanel hints={g.hints} hintWord={g.hintWord} cat={cat} onUseHint={g.useHint} />
          </div>

          {/* ── CURRENT WORD ── */}
          <div style={{ marginBottom: 10 }}>
            <WordPreview
              word={g.currentWord} status={g.status} cat={cat}
              lastPts={g.lastPts} showPts={g.showPts}
            />
          </div>

          {/* ── LETTER CIRCLE ── */}
          <LetterCircle
            letters={g.letters} selected={g.selected}
            onSelect={g.selectLetter} cat={cat}
            hintWord={g.hintWord} found={g.found}
            status={g.status}
          />

          {/* ── ACTION BUTTONS ── */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { label: "🔀 Aralashtir", onClick: g.shuffleLetters, always: true, style: { background: "#EFF6FF", border: "1.5px solid #BFDBFE", color: "#1D4ED8" } },
              { label: "⌫ O'chir", onClick: g.removeLast, disabled: !g.selected.length, style: { background: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#374151" } },
              { label: "✕ Tozala", onClick: g.clearAll, disabled: !g.selected.length, style: { background: "#FFF1F2", border: "1.5px solid #FECDD3", color: "#BE123C" } },
            ].map(btn => (
              <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled} style={{
                flex: 1, padding: "9px 6px", borderRadius: 10,
                fontSize: 12, fontWeight: 700, cursor: btn.disabled ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                opacity: btn.disabled ? 0.4 : 1,
                transition: "all 0.15s",
                ...btn.style,
              }}>{btn.label}</button>
            ))}
          </div>

          {/* ── SUBMIT ── */}
          <button
            onClick={g.submit}
            disabled={!g.currentWord || g.status === "correct"}
            style={{
              width: "100%", marginTop: 10,
              padding: "13px", borderRadius: 12,
              border: "none", cursor: g.currentWord ? "pointer" : "default",
              background: g.currentWord ? cat.color : "#E5E7EB",
              color: g.currentWord ? "#fff" : "#9CA3AF",
              fontSize: 15, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.18s",
              opacity: !g.currentWord || g.status === "correct" ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (g.currentWord) e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = (!g.currentWord || g.status === "correct") ? "0.5" : "1"; }}
          >
            Tekshirish ✓
          </button>
        </div>

        {/* ── FOUND WORDS ── */}
        <FoundWords words={g.found} cat={cat} />

      </div>
    </div>
  );
}
