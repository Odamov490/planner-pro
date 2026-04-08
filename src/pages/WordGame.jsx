import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════
const CATS = [
  { id: "animals", label: "Hayvonlar", ic: "🐾", c: "#A78BFA", l: "rgba(167,139,250,.15)", d: "#C4B5FD", glow: "rgba(167,139,250,.28)" },
  { id: "food",    label: "Taomlar",   ic: "🍎", c: "#F87171", l: "rgba(248,113,113,.15)", d: "#FCA5A5", glow: "rgba(248,113,113,.28)" },
  { id: "nature",  label: "Tabiat",    ic: "🌿", c: "#34D399", l: "rgba(52,211,153,.15)",  d: "#6EE7B7", glow: "rgba(52,211,153,.28)"  },
  { id: "body",    label: "Tana",      ic: "🫀", c: "#60A5FA", l: "rgba(96,165,250,.15)",  d: "#93C5FD", glow: "rgba(96,165,250,.28)"  },
  { id: "home",    label: "Uy",        ic: "🏠", c: "#FBBF24", l: "rgba(251,191,36,.15)",  d: "#FCD34D", glow: "rgba(251,191,36,.28)"  },
  { id: "sport",   label: "Sport",     ic: "⚽", c: "#F472B6", l: "rgba(244,114,182,.15)", d: "#F9A8D4", glow: "rgba(244,114,182,.28)" },
];

const WORDS = {
  animals: [
    { w: "MUSHUK",   h: "Uy hayvoni, miyovlaydi"      },
    { w: "SIGIR",    h: "Sut beruvchi hayvon"          },
    { w: "TOVUQ",    h: "Tuxum qo'yadi"               },
    { w: "QUYON",    h: "Uzun quloqlari bor"           },
    { w: "BALIQ",    h: "Suvda yashaydi"               },
    { w: "KUCHUK",   h: "Itning bolasi"                },
    { w: "AYIQ",     h: "O'rmonda yashaydi"            },
    { w: "TULKI",    h: "Ayyor, qizil hayvon"          },
    { w: "ESHAK",    h: "Yuklarni tashiydi"            },
    { w: "IT",       h: "Sodiq uy hayvoni"             },
    { w: "SHER",     h: "Hayvonlar qiroli"             },
    { w: "FIL",      h: "Uzun burni bor"               },
    { w: "TUYA",     h: "O'rkachli, cho'l hayvoni"     },
    { w: "BURGUT",   h: "Yirtqich qush"                },
    { w: "KABUTAR",  h: "Tinchlik ramzi"               },
    { w: "QURBAQA",  h: "Suvda va quruqlikda yashaydi" },
    { w: "ILON",     h: "Sudralib yuradi"              },
    { w: "AKULA",    h: "Dengiz yirtqichi"             },
    { w: "KIT",      h: "Eng katta suv hayvoni"        },
    { w: "DELFIN",   h: "Aqlli dengiz hayvoni"         },
    { w: "ZEBRA",    h: "Chiziqli otga o'xshash"       },
    { w: "KENGURU",  h: "Sakrab yuradi"                },
    { w: "PANDA",    h: "Oq-qora ayiq"                 },
    { w: "KALAMUSH", h: "Kichik kemiruvchi"            },
    { w: "OT",       h: "Minib yuriladi"               },
    { w: "ECHKI",    h: "Tog'da yashaydi"              },
    { w: "QOYIN",    h: "Jun beradi"                   },
    { w: "BUQA",     h: "Kuchli mol"                   },
  ],
  food: [
    { w: "NON",       h: "Kundalik oziq"           },
    { w: "GURUCH",    h: "Osh uchun kerak"         },
    { w: "SABZI",     h: "Qizil ildiz sabzavot"    },
    { w: "TUXUM",     h: "Tovuq qo'yadi"           },
    { w: "PIYOZ",     h: "Ko'z yoshlatadi"         },
    { w: "QOVUN",     h: "Yozgi shirin meva"       },
    { w: "OLMA",      h: "Har kuni bir dona"       },
    { w: "LIMON",     h: "Nordon va sariq"         },
    { w: "KARTOSHKA", h: "Qovurib yeyiladi"        },
    { w: "POMIDOR",   h: "Qizil sabzavot"          },
    { w: "LAGMON",    h: "Cho'zma ovqat"           },
    { w: "MANTI",     h: "Bug'da pishiriladi"      },
    { w: "SOMSA",     h: "Tandirda pishadi"        },
    { w: "PALOV",     h: "Mashhur o'zbek taomi"    },
    { w: "SHASHLIK",  h: "Go'sht kabobi"           },
    { w: "ASAL",      h: "Arilar tayyorlaydi"      },
    { w: "SHOKOLAD",  h: "Shirinlik"               },
    { w: "MUZQAYMOQ", h: "Sovuq shirinlik"         },
    { w: "BANAN",     h: "Sariq meva"              },
    { w: "APELSIN",   h: "C vitamini ko'p"         },
    { w: "ANOR",      h: "Donali meva"             },
    { w: "TARVUZ",    h: "Yirik yozgi meva"        },
    { w: "SHAKAR",    h: "Shirinlik beradi"         },
    { w: "CHOY",      h: "Issiq ichimlik"          },
  ],
  nature: [
    { w: "DARYO",     h: "Oqar suv"                        },
    { w: "TOG",       h: "Baland, qorli joy"               },
    { w: "GUL",       h: "Xushbo'y o'simlik"               },
    { w: "DARAXT",    h: "Yog'och beradi"                  },
    { w: "BULUT",     h: "Osmon paxtalari"                 },
    { w: "SHAMOL",    h: "Ko'rinmas, yaproq uchiradi"      },
    { w: "DENGIZ",    h: "Katta sho'r suv"                 },
    { w: "QUM",       h: "Cho'lda uchraydi"                },
    { w: "MAYSA",     h: "Yashil o'tlar"                   },
    { w: "YAPROQ",    h: "Daraxt bargi"                    },
    { w: "QOR",       h: "Qishda yog'adi"                  },
    { w: "QUYOSH",    h: "Issiqlik manbai"                 },
    { w: "YULDUZ",    h: "Osmonda porlaydi"                },
    { w: "BAHOR",     h: "Gullar ochiladi"                 },
    { w: "QISH",      h: "Eng sovuq fasl"                  },
    { w: "SHARSHARA", h: "Suv balanddan tushadi"           },
    { w: "OROL",      h: "Suv bilan o'ralgan yer"          },
    { w: "HAVO",      h: "Nafas olamiz"                    },
    { w: "OKEAN",     h: "Eng katta suv havzasi"           },
    { w: "VODIY",     h: "Tog'lar orasidagi tekislik"      },
  ],
  body: [
    { w: "QOL",     h: "5 barmoqli"                  },
    { w: "KOZ",     h: "Ko'rish organi"              },
    { w: "QULOQ",   h: "Eshitish organi"             },
    { w: "BURUN",   h: "Hidlash organi"              },
    { w: "OYOQ",    h: "Yurish uchun"                },
    { w: "BOSH",    h: "Fikrlash markazi"            },
    { w: "TIZZA",   h: "Oyoq bukiladigan joy"        },
    { w: "BARMOQ",  h: "Qo'lda 5 ta"                },
    { w: "YUZ",     h: "Boshning old qismi"          },
    { w: "TISH",    h: "Ovqat chaynash uchun"        },
    { w: "MIYA",    h: "Asosiy boshqaruv markazi"    },
    { w: "SOCH",    h: "Boshda o'sadi"               },
    { w: "YURAK",   h: "Qon haydaydi"                },
    { w: "JIGAR",   h: "Ichki organ"                 },
    { w: "QON",     h: "Organizmda aylanadi"         },
    { w: "TERI",    h: "Tana qoplami"                },
    { w: "SUYAK",   h: "Tana tayanchi"               },
    { w: "BEL",     h: "Orqa pastki qismi"           },
    { w: "QORIN",   h: "Tananing old qismi"          },
    { w: "NAFAS",   h: "Havo olish"                  },
  ],
  home: [
    { w: "STOL",       h: "Ustida yoziladi"        },
    { w: "ESHIK",      h: "Ochiladi va yopiladi"   },
    { w: "KARAVOT",    h: "Uxlash joyi"            },
    { w: "GILAM",      h: "Polga solinadi"         },
    { w: "LAMPA",      h: "Xonani yoritadi"        },
    { w: "KALIT",      h: "Qulfni ochadi"          },
    { w: "QOZON",      h: "Ovqat pishiriladi"      },
    { w: "STUL",       h: "O'tirish uchun"         },
    { w: "DIVAN",      h: "Yumshoq o'tirgich"      },
    { w: "SHKAF",      h: "Kiyim saqlanadi"        },
    { w: "YOSTIQ",     h: "Bosh qo'yiladi"         },
    { w: "MUZLATGICH", h: "Ovqatni sovitadi"       },
    { w: "CHAYNIK",    h: "Suv qaynatadi"          },
    { w: "PIYOLA",     h: "Choy ichiladi"          },
    { w: "QOSHIQ",     h: "Ovqat yeyish uchun"     },
    { w: "SOVUN",      h: "Qo'l yuviladi"          },
    { w: "TAROQ",      h: "Soch taraladi"          },
    { w: "SOAT",       h: "Vaqt ko'rsatadi"        },
    { w: "TELEVIZOR",  h: "Ko'rsatuvlar chiqadi"   },
    { w: "QULF",       h: "Eshikni yopadi"         },
  ],
  sport: [
    { w: "TOP",       h: "Dumaloq o'yin asbobi"   },
    { w: "GOL",       h: "Darvozaga kiradi"        },
    { w: "KURASH",    h: "O'zbek milliy sporti"    },
    { w: "HAKAM",     h: "O'yinni boshqaradi"      },
    { w: "MEDAL",     h: "Golib mukofoti"          },
    { w: "CHEMPION",  h: "Birinchi o'rin egasi"    },
    { w: "FUTBOL",    h: "Eng mashhur sport"       },
    { w: "BASKETBOL", h: "Halqaga to'p tashlanadi" },
    { w: "VOLEYBOL",  h: "Tarmoq ustidan o'ynaladi"},
    { w: "TENNIS",    h: "Raketka bilan o'ynaladi" },
    { w: "BOKS",      h: "Musht bilan jang"        },
    { w: "SHAXMAT",   h: "Aqliy o'yin"             },
    { w: "SHASHKA",   h: "Strategik o'yin"         },
    { w: "STADION",   h: "Katta sport joyi"        },
    { w: "GALABA",    h: "Yutish"                  },
    { w: "DURANG",    h: "Teng hisob"              },
    { w: "OLIMPIADA", h: "Eng katta musobaqa"      },
    { w: "PENALTI",   h: "11 metr zarba"           },
    { w: "FITNES",    h: "Sog'lomlashtirish sporti" },
    { w: "YOGA",      h: "Tinch mashqlar"          },
  ],
};

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWords(catId, count) {
  return shuffle(WORDS[catId] || []).slice(0, count);
}

// Faqat shu so'zning harflari, aralashtirilgan
function makeLetters(word) {
  return shuffle(word.split("")).map((ch, i) => ({
    letter: ch,
    id: `${word}_${i}_${Math.random()}`,
  }));
}

function buildTargets(catId, level) {
  const count = Math.min(2 + level, 4);
  return pickWords(catId, count).map((wObj) => ({
    w: wObj.w,
    h: wObj.h,
    letters: makeLetters(wObj.w),
    found: false,
    selected: [],
    status: "idle", // idle | correct | wrong
  }));
}

// ═══════════════════════════════════════════════════════
// GLOBAL CSS (injected once)
// ═══════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
::-webkit-scrollbar { display: none; }
body {
  background: #0C0B14;
  color: #E8E7F5;
  font-family: 'Nunito', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%     { transform: translateX(-7px); }
  40%     { transform: translateX(7px); }
  60%     { transform: translateX(-4px); }
  80%     { transform: translateX(4px); }
}
@keyframes popIn {
  0%   { transform: scale(0.72); opacity: 0; }
  65%  { transform: scale(1.06); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes floatUp {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-44px) scale(1.3); }
}
@keyframes shimmer {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-7px); }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes glowPulse {
  0%, 100% { opacity: 0.35; }
  50%       { opacity: 0.65; }
}
@keyframes letterAppear {
  0%   { transform: scale(0.5) rotate(-15deg); opacity: 0; }
  80%  { transform: scale(1.1) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.anim-shake    { animation: shake 0.32s ease both; }
.anim-popIn    { animation: popIn 0.35s cubic-bezier(.34,1.56,.64,1) both; }
.anim-slideDown{ animation: slideDown 0.22s ease both; }
.anim-shimmer  { animation: shimmer 1.6s ease-in-out infinite; }
.anim-bounce   { animation: bounce 1.1s ease-in-out infinite; }
`;

function injectCSS() {
  if (document.getElementById("soz-oyini-css")) return;
  const style = document.createElement("style");
  style.id = "soz-oyini-css";
  style.textContent = CSS;
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════
// THEME TOKENS
// ═══════════════════════════════════════════════════════
const T = {
  bg:       "#0C0B14",
  surface:  "#141322",
  surface2: "#1E1D30",
  surface3: "#272542",
  surface4: "#302E55",
  text:     "#E8E7F5",
  text2:    "#9896C0",
  text3:    "#524F7A",
};

// ═══════════════════════════════════════════════════════
// LETTER CIRCLE (SVG + absolute buttons)
// ═══════════════════════════════════════════════════════
function LetterCircle({ target, wordIdx, cat, onSelect }) {
  const { letters, selected, status, found } = target;
  const containerRef = useRef(null);
  const n = letters.length;
  const SIZE = 250;
  const CX = SIZE / 2, CY = SIZE / 2;
  const R = n <= 4 ? 68 : n <= 6 ? 80 : n <= 8 ? 90 : n <= 10 ? 96 : 104;
  const BTN = 46;

  const positions = letters.map((_, i) => {
    const angle = (2 * Math.PI / n) * i - Math.PI / 2;
    return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
  });

  const selIds = new Set(selected.map((s) => s.id));

  const lines = selected.map((s, i) => {
    if (i === 0) return null;
    const ai = letters.findIndex((l) => l.id === selected[i - 1].id);
    const bi = letters.findIndex((l) => l.id === s.id);
    if (ai < 0 || bi < 0) return null;
    const a = positions[ai], b = positions[bi];
    return (
      <line
        key={`line-${i}`}
        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke={cat.c}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.6}
      />
    );
  });

  if (found) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: SIZE,
        height: SIZE,
        margin: "0 auto",
      }}
    >
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <circle cx={CX} cy={CY} r={5} fill={cat.c} opacity={0.2} />
        {lines}
      </svg>

      {letters.map(({ letter, id }, i) => {
        const pos = positions[i];
        const isSel = selIds.has(id);
        const order = selected.findIndex((s) => s.id === id) + 1;
        const isWrong = status === "wrong" && isSel;

        return (
          <button
            key={id}
            onClick={(e) => { e.stopPropagation(); onSelect(wordIdx, id); }}
            className={isWrong ? "anim-shake" : ""}
            style={{
              position: "absolute",
              left: pos.x - BTN / 2,
              top: pos.y - BTN / 2,
              width: BTN,
              height: BTN,
              borderRadius: "50%",
              background: isSel ? cat.c : T.surface3,
              border: `2px solid ${isSel ? cat.c : "transparent"}`,
              color: isSel ? "#0C0B14" : T.text,
              fontSize: 15,
              fontWeight: 800,
              fontFamily: "'Nunito', sans-serif",
              cursor: "pointer",
              zIndex: 2,
              boxShadow: isSel
                ? `0 0 18px ${cat.glow}, 0 2px 8px rgba(0,0,0,.4)`
                : "0 2px 6px rgba(0,0,0,.35)",
              transform: isSel ? "scale(1.12)" : "scale(1)",
              transition: "all 0.14s cubic-bezier(.34,1.56,.64,1)",
              position: "absolute",
            }}
          >
            {letter}
            {isSel && (
              <span
                style={{
                  position: "absolute",
                  top: -5, right: -5,
                  width: 16, height: 16,
                  borderRadius: "50%",
                  background: T.text,
                  color: T.bg,
                  fontSize: 9, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${T.bg}`,
                  pointerEvents: "none",
                }}
              >
                {order}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// WORD CARD
// ═══════════════════════════════════════════════════════
function WordCard({ target, idx, isActive, cat, hintWord, onSetActive, onSelect, onSubmit, onBack, onClear, onShuffle, showPts, lastPts }) {
  const { w, h, letters, found, selected, status } = target;
  const hinted = hintWord?.w === w && !found;
  const cw = selected.map((s) => s.letter).join("");
  const canSub = !!cw && status !== "correct" && status !== "wrong";
  const hasSel = selected.length > 0;

  const statusStyle = {
    correct: { bg: cat.c,                    border: cat.c,     tx: "#0C0B14"  },
    wrong:   { bg: "rgba(248,113,113,.15)",  border: "#F87171", tx: "#F87171"  },
    idle:    { bg: T.surface3,               border: "transparent", tx: T.text },
  }[status] || { bg: T.surface3, border: "transparent", tx: T.text };

  const msg = status === "correct" ? "✓ Zo'r! To'g'ri!" : status === "wrong" ? "✗ Noto'g'ri, qayta ur" : "";

  return (
    <div
      onClick={() => !found && onSetActive(idx)}
      style={{
        borderRadius: 14,
        border: `2px solid ${isActive ? cat.c : found ? cat.c + "55" : T.surface3}`,
        background: isActive ? cat.l : found ? "rgba(255,255,255,.02)" : T.surface2,
        padding: "12px 14px",
        cursor: found ? "default" : "pointer",
        transition: "all 0.2s",
        boxShadow: isActive ? `0 0 0 1px ${cat.c}33, 0 8px 28px rgba(0,0,0,.35)` : "none",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span
          style={{
            width: 22, height: 22, borderRadius: 7,
            background: isActive ? cat.c : found ? cat.c + "44" : T.surface3,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 900,
            color: isActive ? "#0C0B14" : found ? cat.c : T.text3,
            flexShrink: 0,
          }}
        >
          {idx + 1}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? cat.c : found ? cat.c : T.text3 }}>
          {w.length} harf
        </span>
        {found && (
          <span
            className="anim-popIn"
            style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 800,
              color: cat.c, background: cat.l,
              borderRadius: 6, padding: "2px 8px",
            }}
          >
            ✓ Topildi
          </span>
        )}
        {isActive && !found && (
          <span
            className="anim-shimmer"
            style={{
              marginLeft: "auto", fontSize: 10, fontWeight: 700,
              color: cat.c, background: cat.l,
              borderRadius: 6, padding: "2px 7px",
            }}
          >
            Faol
          </span>
        )}
        {hinted && !found && (
          <span
            title={h}
            style={{
              marginLeft: "auto", fontSize: 10,
              color: "#FBBF24", background: "rgba(251,191,36,.12)",
              borderRadius: 6, padding: "2px 8px",
              border: "1px solid rgba(251,191,36,.3)",
              maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {h}
          </span>
        )}
      </div>

      {/* Letter cells */}
      <div style={{ display: "flex", gap: 3 }}>
        {w.split("").map((ch, ci) => {
          const showFirst = hinted && ci === 0;
          let bg, border, color;
          if (found)       { bg = cat.c;                      border = cat.c;    color = "#0C0B14"; }
          else if (showFirst){ bg = "rgba(251,191,36,.15)";   border = "#FBBF24"; color = "#FBBF24"; }
          else             { bg = T.surface3;                 border = "transparent"; color = "transparent"; }

          return (
            <div
              key={ci}
              style={{
                flex: 1, minWidth: 22, maxWidth: 36, height: 34,
                borderRadius: 8,
                background: bg, border: `2px solid ${border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color,
                transition: "all 0.2s",
              }}
            >
              {found ? ch : showFirst ? w[0] : ""}
            </div>
          );
        })}
      </div>

      {/* Input area (only active, not found) */}
      {isActive && !found && (
        <div
          className="anim-slideDown"
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${T.surface3}`,
          }}
        >
          {/* Preview */}
          <div
            style={{
              minHeight: 56,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 5, marginBottom: 10, position: "relative",
            }}
          >
            {cw ? (
              <>
                <div
                  style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}
                  className={status === "wrong" ? "anim-shake" : status === "correct" ? "anim-popIn" : ""}
                >
                  {cw.split("").map((ch, i) => (
                    <div
                      key={i}
                      style={{
                        minWidth: 32, height: 38, borderRadius: 8,
                        background: statusStyle.bg,
                        border: `2px solid ${statusStyle.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: statusStyle.tx,
                        padding: "0 4px", transition: "all 0.15s",
                      }}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
                {showPts && (
                  <div
                    style={{
                      position: "absolute", top: -16, right: 0,
                      fontSize: 15, fontWeight: 900,
                      color: "#34D399",
                      animation: "floatUp 1.1s ease forwards",
                      pointerEvents: "none",
                      fontFamily: "'Baloo 2', sans-serif",
                    }}
                  >
                    +{lastPts}
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize: 12, color: T.text3, fontWeight: 600 }}>
                Harfni bosing...
              </span>
            )}
            {msg && (
              <span
                style={{
                  fontSize: 11, fontWeight: 700,
                  color: status === "correct" ? cat.c : "#F87171",
                }}
              >
                {msg}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
            {[
              { label: "🔀 Aralash", onClick: () => onShuffle(idx), disabled: false,    danger: false },
              { label: "⌫ O'chir",  onClick: () => onBack(idx),    disabled: !hasSel,  danger: false },
              { label: "✕ Tozala",  onClick: () => onClear(idx),   disabled: !hasSel,  danger: true  },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={(e) => { e.stopPropagation(); btn.onClick(); }}
                disabled={btn.disabled}
                style={{
                  flex: 1, padding: "8px 4px",
                  borderRadius: 9, border: "none",
                  fontSize: 11, fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: btn.disabled ? "default" : "pointer",
                  background: btn.disabled
                    ? T.surface3
                    : btn.danger && !btn.disabled
                    ? "rgba(248,113,113,.12)"
                    : T.surface3,
                  color: btn.disabled
                    ? T.text3
                    : btn.danger
                    ? "#F87171"
                    : T.text2,
                  opacity: btn.disabled ? 0.4 : 1,
                  transition: "all 0.15s",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Submit */}
          <button
            onClick={(e) => { e.stopPropagation(); onSubmit(idx); }}
            disabled={!canSub}
            style={{
              width: "100%", padding: "13px",
              borderRadius: 11, border: "none",
              cursor: canSub ? "pointer" : "default",
              background: canSub ? cat.c : T.surface3,
              color: canSub ? "#0C0B14" : T.text3,
              fontSize: 15, fontWeight: 800,
              fontFamily: "'Nunito', sans-serif",
              transition: "all 0.15s",
              opacity: canSub ? 1 : 0.5,
              boxShadow: canSub ? `0 4px 18px ${cat.glow}` : "none",
            }}
          >
            Tekshirish ✓
          </button>

          {/* Circle */}
          <div style={{ marginTop: 14 }}>
            <LetterCircle
              target={target}
              wordIdx={idx}
              cat={cat}
              onSelect={onSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CATEGORY BAR
// ═══════════════════════════════════════════════════════
function CatBar({ catId, catScores, onChange }) {
  return (
    <div
      style={{
        display: "flex", gap: 6,
        overflowX: "auto", scrollbarWidth: "none",
        paddingBottom: 4, marginBottom: 12,
      }}
    >
      {CATS.map((ct) => {
        const on = ct.id === catId;
        const pts = catScores[ct.id] || 0;
        return (
          <button
            key={ct.id}
            onClick={() => onChange(ct.id)}
            style={{
              flexShrink: 0,
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 12px", borderRadius: 10,
              background: on ? ct.c : T.surface2,
              border: "none",
              color: on ? "#0C0B14" : T.text2,
              fontSize: 12, fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.15s",
              boxShadow: on ? `0 3px 14px ${ct.glow}` : "none",
            }}
          >
            <span style={{ fontSize: 13 }}>{ct.ic}</span>
            {ct.label}
            {pts > 0 && (
              <span
                style={{
                  fontSize: 10, fontWeight: 800,
                  background: on ? "rgba(12,11,20,.2)" : ct.l,
                  color: on ? "#0C0B14" : ct.c,
                  borderRadius: 6, padding: "1px 5px",
                }}
              >
                {pts}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LEVEL COMPLETE SCREEN
// ═══════════════════════════════════════════════════════
function LevelComplete({ targets, cat, score, level, onNext }) {
  return (
    <div
      className="anim-popIn"
      style={{
        background: T.surface,
        borderRadius: 20,
        border: `1px solid ${cat.c}44`,
        padding: "36px 24px",
        textAlign: "center",
        marginBottom: 10,
        boxShadow: `0 0 48px ${cat.glow}`,
      }}
    >
      <div className="anim-bounce" style={{ fontSize: 52, marginBottom: 12 }}>🏆</div>
      <div
        style={{
          fontFamily: "'Baloo 2', sans-serif",
          fontSize: 24, fontWeight: 800,
          color: cat.c, marginBottom: 6,
        }}
      >
        Zo'r!
      </div>
      <div style={{ fontSize: 14, color: T.text2, marginBottom: 16 }}>
        Level {level} yakunlandi
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {targets.map((t) => (
          <span
            key={t.w}
            style={{
              padding: "6px 14px", borderRadius: 10,
              background: cat.l, color: cat.c,
              fontSize: 13, fontWeight: 800,
              border: `1px solid ${cat.c}44`,
            }}
          >
            {t.w}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 13, color: T.text3, marginBottom: 20 }}>
        Jami:{" "}
        <span
          style={{
            fontSize: 22, fontWeight: 900,
            color: cat.c,
            fontFamily: "'Baloo 2', sans-serif",
          }}
        >
          {score}
        </span>{" "}
        ball
      </div>
      <button
        onClick={onNext}
        style={{
          padding: "14px 32px", borderRadius: 12,
          background: cat.c, color: "#0C0B14",
          border: "none", fontSize: 15, fontWeight: 800,
          fontFamily: "'Nunito', sans-serif",
          cursor: "pointer",
          boxShadow: `0 4px 22px ${cat.glow}`,
        }}
      >
        Keyingi level →
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FOUND WORDS BAR
// ═══════════════════════════════════════════════════════
function FoundWords({ targets, cat }) {
  const found = targets.filter((t) => t.found);
  if (!found.length) return null;
  return (
    <div
      style={{
        background: T.surface,
        borderRadius: 12,
        border: `1px solid ${T.surface3}`,
        padding: "12px 14px",
        marginTop: 10,
      }}
    >
      <div
        style={{
          fontSize: 10, fontWeight: 700,
          color: T.text3,
          textTransform: "uppercase", letterSpacing: ".06em",
          marginBottom: 8,
        }}
      >
        Topilgan · {found.length} ta
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {found.map((t) => (
          <div
            key={t.w}
            style={{
              padding: "4px 10px", borderRadius: 7,
              background: cat.l, color: cat.c,
              border: `1px solid ${cat.c}33`,
              fontSize: 12, fontWeight: 700,
            }}
          >
            {t.w}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN GAME HOOK
// ═══════════════════════════════════════════════════════
function useGame() {
  const [catId,     setCatId]     = useState("animals");
  const [level,     setLevel]     = useState(1);
  const [targets,   setTargets]   = useState(() => buildTargets("animals", 1));
  const [activeIdx, setActiveIdx] = useState(0);
  const [score,     setScore]     = useState(0);
  const [catScores, setCatScores] = useState({});
  const [hints,     setHints]     = useState(3);
  const [hintWord,  setHintWord]  = useState(null);
  const [lastPts,   setLastPts]   = useState(0);
  const [showPts,   setShowPts]   = useState(false);
  const timers = useRef({});

  const cat = CATS.find((c) => c.id === catId) || CATS[0];
  const allDone = targets.length > 0 && targets.every((t) => t.found);

  function startLevel(cid, lv) {
    const newTargets = buildTargets(cid, lv);
    setCatId(cid);
    setLevel(lv);
    setTargets(newTargets);
    setActiveIdx(0);
    setHints(3);
    setHintWord(null);
    setShowPts(false);
  }

  function changeCategory(id) { startLevel(id, 1); }
  function nextLevel()        { startLevel(catId, level + 1); }

  function setActive(i) {
    if (!targets[i]?.found) setActiveIdx(i);
  }

  function selectLetter(wi, lid) {
    setTargets((prev) => {
      const next = prev.map((t, i) => {
        if (i !== wi) return t;
        if (t.found || t.status === "correct" || t.status === "wrong") return t;
        const idx = t.selected.findIndex((s) => s.id === lid);
        const selected = idx >= 0
          ? t.selected.slice(0, idx)
          : [...t.selected, t.letters.find((l) => l.id === lid)].filter(Boolean);
        return { ...t, selected, status: "idle" };
      });
      return next;
    });
  }

  function submitWord(wi) {
    setTargets((prev) => {
      const t = prev[wi];
      if (!t || t.found) return prev;
      const typed = t.selected.map((s) => s.letter).join("");
      if (!typed) return prev;

      if (typed === t.w) {
        const pts = t.w.length * 15 + (t.w.length > 5 ? 25 : 0);
        setScore((s) => s + pts);
        setCatScores((cs) => ({ ...cs, [catId]: (cs[catId] || 0) + pts }));
        setLastPts(pts);
        setShowPts(true);

        const next = prev.findIndex((tt, i) => !tt.found && i !== wi);
        if (next >= 0) setActiveIdx(next);

        clearTimeout(timers.current[wi]);
        timers.current[wi] = setTimeout(() => {
          setShowPts(false);
          setTargets((p) => p.map((tt, i) => i === wi ? { ...tt, status: "idle" } : tt));
        }, 1000);

        return prev.map((tt, i) =>
          i === wi ? { ...tt, found: true, selected: [], status: "correct" } : tt
        );
      } else {
        clearTimeout(timers.current[wi]);
        timers.current[wi] = setTimeout(() => {
          setTargets((p) =>
            p.map((tt, i) => i === wi ? { ...tt, status: "idle", selected: [] } : tt)
          );
        }, 700);
        return prev.map((tt, i) =>
          i === wi ? { ...tt, status: "wrong" } : tt
        );
      }
    });
  }

  function doBack(wi) {
    setTargets((prev) =>
      prev.map((t, i) =>
        i === wi && !t.found ? { ...t, selected: t.selected.slice(0, -1) } : t
      )
    );
  }

  function doClear(wi) {
    setTargets((prev) =>
      prev.map((t, i) =>
        i === wi && !t.found ? { ...t, selected: [], status: "idle" } : t
      )
    );
  }

  function doShuffle(wi) {
    setTargets((prev) =>
      prev.map((t, i) =>
        i === wi && !t.found ? { ...t, letters: shuffle([...t.letters]) } : t
      )
    );
  }

  function doHint() {
    if (hints <= 0) return;
    const u = targets.find((t) => !t.found);
    if (!u) return;
    setHintWord(u);
    setHints((h) => h - 1);
    setActiveIdx(targets.indexOf(u));
  }

  return {
    cat, catId, level, targets, activeIdx, score, catScores,
    hints, hintWord, lastPts, showPts, allDone,
    changeCategory, nextLevel, setActive,
    selectLetter, submitWord, doBack, doClear, doShuffle, doHint,
  };
}

// ═══════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════
export default function SozOyini() {
  useEffect(() => { injectCSS(); }, []);

  const g = useGame();
  const { cat } = g;
  const foundCount = g.targets.filter((t) => t.found).length;
  const pct = g.targets.length ? (foundCount / g.targets.length) * 100 : 0;
  const dots = [0, 1, 2].map((i) => (
    <div
      key={i}
      style={{
        width: 7, height: 7, borderRadius: "50%",
        background: i < g.hints ? cat.c : T.surface4,
        transition: "background 0.2s",
      }}
    />
  ));

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: T.bg }}>
      {/* Glow blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", top: -100, right: -80,
            width: 300, height: 300, borderRadius: "50%",
            background: cat.glow, filter: "blur(90px)",
            animation: "glowPulse 3s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: 60, left: -80,
            width: 240, height: 240, borderRadius: "50%",
            background: cat.glow, filter: "blur(100px)",
            animation: "glowPulse 4s ease-in-out infinite 1.5s",
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative", zIndex: 1,
          maxWidth: 480, margin: "0 auto",
          padding: "18px 14px 64px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div
              style={{
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: 22, fontWeight: 800,
                color: cat.c, letterSpacing: "-0.01em", lineHeight: 1,
              }}
            >
              So'z O'yini
            </div>
            <div style={{ fontSize: 11, color: T.text3, marginTop: 3, fontWeight: 600 }}>
              {cat.ic} {cat.label} · Level {g.level}
            </div>
          </div>
          <div
            style={{
              background: cat.c, color: "#0C0B14",
              borderRadius: 12, padding: "8px 16px",
              fontSize: 15, fontWeight: 800,
              fontFamily: "'Baloo 2', sans-serif",
              boxShadow: `0 4px 22px ${cat.glow}`,
            }}
          >
            {g.score}
            <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.7, marginLeft: 3 }}>ball</span>
          </div>
        </div>

        {/* Category bar */}
        <CatBar catId={g.catId} catScores={g.catScores} onChange={g.changeCategory} />

        {/* Main card */}
        <div
          style={{
            background: T.surface,
            borderRadius: 20,
            border: `1px solid ${T.surface3}`,
            padding: 16,
            marginBottom: 10,
          }}
        >
          {g.allDone ? (
            <LevelComplete
              targets={g.targets}
              cat={cat}
              score={g.score}
              level={g.level}
              onNext={g.nextLevel}
            />
          ) : (
            <>
              {/* Progress + hint */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div
                  style={{
                    flex: 1, height: 5,
                    background: T.surface3,
                    borderRadius: 99, overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`, height: "100%",
                      background: cat.c, borderRadius: 99,
                      transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
                      boxShadow: `0 0 8px ${cat.glow}`,
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.text3, whiteSpace: "nowrap" }}>
                  {foundCount}/{g.targets.length}
                </span>
                <button
                  onClick={g.doHint}
                  disabled={g.hints <= 0}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "5px 10px", borderRadius: 8,
                    background: g.hints > 0 ? "rgba(251,191,36,.12)" : T.surface2,
                    border: `1px solid ${g.hints > 0 ? "rgba(251,191,36,.3)" : T.surface3}`,
                    color: g.hints > 0 ? "#FBBF24" : T.text3,
                    fontSize: 11, fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    cursor: g.hints > 0 ? "pointer" : "default",
                    opacity: g.hints > 0 ? 1 : 0.5,
                  }}
                >
                  {dots}
                  <span style={{ marginLeft: 2 }}>Hint</span>
                </button>
              </div>

              {/* Word cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.targets.map((t, i) => (
                  <WordCard
                    key={`${t.w}-${i}`}
                    target={t}
                    idx={i}
                    isActive={i === g.activeIdx && !t.found}
                    cat={cat}
                    hintWord={g.hintWord}
                    onSetActive={g.setActive}
                    onSelect={g.selectLetter}
                    onSubmit={g.submitWord}
                    onBack={g.doBack}
                    onClear={g.doClear}
                    onShuffle={g.doShuffle}
                    showPts={g.showPts}
                    lastPts={g.lastPts}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Found words */}
        {!g.allDone && <FoundWords targets={g.targets} cat={cat} />}
      </div>
    </div>
  );
}
