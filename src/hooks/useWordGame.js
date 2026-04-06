// ═══════════════════════════════════════════════════════════════
// useWordGame — barcha o'yin logikasi shu yerda
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from "react";
import { CATEGORIES, WORDS, getWordsByCategory, getLettersForWords } from "../data/words";

const STORAGE_KEY = "wordgame_v2";

// localStorage save/load
const loadState = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
};
const saveState = (s) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
};

// Get today's date string
const todayStr = () => new Date().toISOString().split("T")[0];

export default function useWordGame() {
  const saved = loadState();

  // ── Category & level ──
  const [activeCat,   setActiveCat]   = useState(saved.activeCat  || "meva");
  const [level,       setLevel]       = useState(saved.level       || 1);

  // ── Words for this level ──
  const [levelWords,  setLevelWords]  = useState([]);   // all words available
  const [targetWords, setTargetWords] = useState([]);   // words to find (6-8)
  const [letters,     setLetters]     = useState([]);   // circle letters
  const [foundWords,  setFoundWords]  = useState(saved.foundWords || []);

  // ── Selection ──
  const [selected,    setSelected]    = useState([]);   // [{letter,idx}]
  const [status,      setStatus]      = useState("idle"); // idle|correct|wrong

  // ── Scores ──
  const [scores,      setScores]      = useState(saved.scores     || {});
  const [totalScore,  setTotalScore]  = useState(saved.totalScore || 0);

  // ── Achievements ──
  const [achievements, setAchievements] = useState(saved.achievements || []);

  // ── Analytics ──
  const [analytics,   setAnalytics]   = useState(saved.analytics  || {});

  // ── Hints ──
  const [hintsLeft,   setHintsLeft]   = useState(saved.hintsLeft !== undefined ? saved.hintsLeft : 3);
  const [hintedLetters, setHintedLetters] = useState([]);

  // ── Daily challenge ──
  const [dailyDone,   setDailyDone]   = useState(saved.dailyDate === todayStr());
  const [dailyCat,    setDailyCat]    = useState(saved.dailyCat   || "meva");

  // ── Streak ──
  const [streak,      setStreak]      = useState(saved.streak     || 0);
  const [lastPlayedDate, setLastPlayedDate] = useState(saved.lastPlayedDate || "");

  // Status timer
  const statusTimer = useRef(null);

  // ── Persist ──
  useEffect(() => {
    saveState({
      activeCat, level, foundWords, scores, totalScore,
      achievements, analytics, hintsLeft,
      dailyDate: dailyDone ? todayStr() : saved.dailyDate,
      dailyCat,
      streak, lastPlayedDate,
    });
  }, [activeCat, level, foundWords, scores, totalScore,
      achievements, analytics, hintsLeft, dailyDone, dailyCat, streak, lastPlayedDate]);

  // ── Init level ──
  const initLevel = useCallback((catId, lvl) => {
    const all  = getWordsByCategory(catId);
    const offset = (lvl - 1) * 6;
    const picks  = all.slice(offset, offset + 6);
    if (!picks.length) return false; // no more words

    const letts  = getLettersForWords(picks);
    setLevelWords(all);
    setTargetWords(picks);
    setLetters(letts.map((l, i) => ({ letter: l, idx: i, used: false })));
    setFoundWords([]);
    setSelected([]);
    setHintedLetters([]);
    setStatus("idle");
    return true;
  }, []);

  // Init on cat/level change
  useEffect(() => {
    initLevel(activeCat, level);
  }, [activeCat, level, initLevel]);

  // ── Change category ──
  const changeCategory = useCallback((catId) => {
    setActiveCat(catId);
    setLevel(1);
    setHintsLeft(3);
  }, []);

  // ── Select letter ──
  const selectLetter = useCallback((letter, idx) => {
    if (status !== "idle") return;
    setSelected(prev => {
      // already selected at that position → deselect last
      if (prev.some(s => s.idx === idx)) return prev;
      return [...prev, { letter, idx }];
    });
  }, [status]);

  // ── Remove last letter ──
  const removeLast = useCallback(() => {
    setSelected(prev => prev.slice(0, -1));
  }, []);

  // ── Clear selection ──
  const clearSelected = useCallback(() => {
    setSelected([]);
  }, []);

  // ── Shuffle letters ──
  const shuffle = useCallback(() => {
    setLetters(prev => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
    setSelected([]);
  }, []);

  // ── Flash status ──
  const flashStatus = (s) => {
    setStatus(s);
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus("idle"), 900);
  };

  // ── Submit word ──
  const submitWord = useCallback(() => {
    if (!selected.length) return;
    const word = selected.map(s => s.letter).join("");

    if (foundWords.includes(word)) { flashStatus("duplicate"); setSelected([]); return; }

    const match = targetWords.find(w => w.word === word);
    if (match) {
      // Correct!
      const pts = word.length * 10 + (word.length > 5 ? 20 : 0);
      setFoundWords(prev => [...prev, word]);
      setTotalScore(prev => prev + pts);
      setScores(prev => ({ ...prev, [activeCat]: (prev[activeCat] || 0) + pts }));

      // Analytics
      setAnalytics(prev => ({
        ...prev,
        [activeCat]: (prev[activeCat] || 0) + 1,
        total: (prev.total || 0) + 1,
      }));

      // Streak
      const today = todayStr();
      if (lastPlayedDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split("T")[0];
        setStreak(prev => lastPlayedDate === yStr ? prev + 1 : 1);
        setLastPlayedDate(today);
      }

      flashStatus("correct");
      checkAchievements(word, activeCat);
    } else {
      flashStatus("wrong");
    }
    setSelected([]);
  }, [selected, foundWords, targetWords, activeCat, lastPlayedDate]);

  // ── Check all found ──
  const allFound = foundWords.length >= targetWords.length && targetWords.length > 0;

  // ── Next level ──
  const nextLevel = useCallback(() => {
    const ok = initLevel(activeCat, level + 1);
    if (ok) setLevel(prev => prev + 1);
    else setLevel(1); // restart
    setHintsLeft(3);
  }, [activeCat, level, initLevel]);

  // ── Hint ──
  const useHint = useCallback(() => {
    if (hintsLeft <= 0) return;
    const notFound = targetWords.filter(w => !foundWords.includes(w.word));
    if (!notFound.length) return;
    const target = notFound[0];
    // Reveal first letter of next word
    setHintedLetters(prev => [...new Set([...prev, target.word[0]])]);
    setHintsLeft(prev => prev - 1);
  }, [hintsLeft, targetWords, foundWords]);

  // ── Achievements ──
  const checkAchievements = (word, cat) => {
    const newAch = [];
    const catScore = (scores[cat] || 0);
    if (catScore >= 500 && !achievements.includes(`${cat}_master`)) {
      newAch.push({ id:`${cat}_master`, label:`${CATEGORIES.find(c=>c.id===cat)?.label} ustasi!`, icon:"🥇" });
    }
    if ((analytics.total || 0) >= 100 && !achievements.includes("century")) {
      newAch.push({ id:"century", label:"100 ta so'z topildi!", icon:"💯" });
    }
    if (word.length >= 7 && !achievements.includes("long_word")) {
      newAch.push({ id:"long_word", label:"7+ harfli so'z!", icon:"📏" });
    }
    if (newAch.length) {
      setAchievements(prev => [...prev, ...newAch.map(a=>a.id)]);
      // could trigger toast
    }
    return newAch;
  };

  // ── Daily challenge ──
  const startDailyChallenge = useCallback(() => {
    // pick a random cat based on today's date
    const dayIdx = new Date().getDay();
    const cat = CATEGORIES[dayIdx % CATEGORIES.length];
    setDailyCat(cat.id);
    setActiveCat(cat.id);
    setLevel(1);
    setDailyDone(false);
  }, []);

  const completeDailyChallenge = useCallback(() => {
    setDailyDone(true);
    setTotalScore(prev => prev + 200); // bonus
  }, []);

  // Category info
  const activeCatInfo = CATEGORIES.find(c => c.id === activeCat);
  const dailyCatInfo  = CATEGORIES.find(c => c.id === dailyCat);

  // Words not yet found
  const remaining = targetWords.filter(w => !foundWords.includes(w.word));

  return {
    // State
    activeCat, activeCatInfo,
    level,
    letters,
    targetWords,
    foundWords,
    remaining,
    selected,
    status,
    allFound,
    scores,
    totalScore,
    streak,
    achievements,
    analytics,
    hintsLeft,
    hintedLetters,
    dailyDone, dailyCat, dailyCatInfo,

    // Actions
    changeCategory,
    selectLetter,
    removeLast,
    clearSelected,
    shuffle,
    submitWord,
    nextLevel,
    useHint,
    startDailyChallenge,
    completeDailyChallenge,

    // Derived
    currentWord: selected.map(s => s.letter).join(""),
    CATEGORIES,
  };
}
