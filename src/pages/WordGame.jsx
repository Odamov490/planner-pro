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
    { word: "MUSHUK",        hint: "Uy hayvoni, miyovlaydi"       },
    { word: "SIGIR",         hint: "Sut beruvchi hayvon"           },
    { word: "TOVUQ",         hint: "Tuxum qo'yadi"                },
    { word: "QUYON",         hint: "Uzun quloqlari bor"            },
    { word: "BALIQ",         hint: "Suvda yashaydi"                },
    { word: "KUCHUK",        hint: "Itning bolasi"                 },
    { word: "AYIQ",          hint: "O'rmonda yashaydi"             },
    { word: "TULKI",         hint: "Ayyor, qizil hayvon"           },
    { word: "ESHAK",         hint: "Yuklarni tashiydi"             },
    { word: "OT",            hint: "Minib yuriladi"                },
    { word: "ECHKI",         hint: "Tog'da yashaydi, sut beradi"   },
    { word: "IT",            hint: "Sodiq uy hayvoni"              },
    { word: "SHER",          hint: "Hayvonlar qiroli"              },
    { word: "FIL",           hint: "Uzun burni bor katta hayvon"   },
    { word: "TUYA",          hint: "Cho'lda yashaydi, o'rkachli"   },
    { word: "BURGUT",        hint: "Katta yirtqich qush"           },
    { word: "KABUTAR",       hint: "Tinchlik ramzi bo'lgan qush"   },
    { word: "QURBAQA",       hint: "Suvda va quruqlikda yashaydi"  },
    { word: "ILON",          hint: "Sudralib yuradi"               },
    { word: "AKULA",         hint: "Dengiz yirtqichi"              },
    { word: "KIT",           hint: "Eng katta suv hayvoni"         },
    { word: "DELFIN",        hint: "Aqlli dengiz hayvoni"          },
    { word: "ZEBRA",         hint: "Chiziqli otga o'xshash"        },
    { word: "KENGURU",       hint: "Sakrash orqali yuradi"         },
    { word: "PANDA",         hint: "Oq-qora ayiq"                  },
    { word: "KALAMUSH",      hint: "Kichik kemiruvchi"             },
    { word: "SICHQON",       hint: "Uyda yashovchi kemiruvchi"     },
    { word: "TIPRATIKAN",    hint: "Ignali hayvon"                 },
    { word: "QOPLON",        hint: "Tez yuguruvchi yirtqich"       },
    { word: "GEPA",          hint: "Eng tez yuguradigan hayvon"    },
    { word: "KOALA",         hint: "Daraxtda yashaydi"             },
    { word: "LEOPARD",       hint: "Dog'li yirtqich"               },
    { word: "TIMSOH",        hint: "Suvda yashovchi yirtqich"      },
    { word: "PINGVIN",       hint: "Ucha olmaydi, muzda yashaydi"  },
    { word: "KAPALAK",       hint: "Rangli hasharot"               },
    { word: "QISQICHBAQA",   hint: "Yon yuradi"                   },
    { word: "MEDUZA",        hint: "Jelga o'xshash dengiz jonzoti" },
    { word: "LAYLAK",        hint: "Uzun oyoqli qush"              },
    { word: "CHUMCHUQ",      hint: "Kichik qush"                   },
    { word: "ARI",           hint: "Asal qiladi"                   },
  ],
  food: [
    { word: "NON",       hint: "Kundalik oziq"                },
    { word: "GURUCH",    hint: "Osh uchun kerak"              },
    { word: "SABZI",     hint: "Qizil ildiz sabzavot"         },
    { word: "TUXUM",     hint: "Tovuq qo'yadi"               },
    { word: "PIYOZ",     hint: "Ko'z yoshlatadi"              },
    { word: "QOVUN",     hint: "Yozgi shirin meva"            },
    { word: "GILOS",     hint: "Qizil kichik meva"            },
    { word: "OLMA",      hint: "Har kuni bir dona"            },
    { word: "LIMON",     hint: "Nordon va sariq"              },
    { word: "BODRING",   hint: "Yashil va uzunchoq"           },
    { word: "KARTOSHKA", hint: "Qovurib yeyiladi"             },
    { word: "POMIDOR",   hint: "Qizil sabzavot"               },
    { word: "KARAM",     hint: "Bargli sabzavot"              },
    { word: "BAQLAJON",  hint: "To'q binafsha sabzavot"       },
    { word: "QALAMPIR",  hint: "Achchiq yoki shirin bo'ladi"  },
    { word: "SARIMSOQ",  hint: "Hidi kuchli"                  },
    { word: "LAGMON",    hint: "Cho'zma ovqat"                },
    { word: "MANTI",     hint: "Bug'da pishiriladi"           },
    { word: "SOMSA",     hint: "Tandirda pishadi"             },
    { word: "PALOV",     hint: "Mashhur o'zbek taomi"         },
    { word: "PIZZA",     hint: "Italiya taomi"                },
    { word: "BURGER",    hint: "Go'shtli sendvich"            },
    { word: "SHASHLIK",  hint: "Go'sht kabobi"                },
    { word: "QATIQ",     hint: "Sut mahsuloti"                },
    { word: "SUT",       hint: "Oq ichimlik"                  },
    { word: "PISHLOQ",   hint: "Sutdan tayyorlanadi"          },
    { word: "ASAL",      hint: "Arilar tayyorlaydi"           },
    { word: "SHOKOLAD",  hint: "Shirinlik"                    },
    { word: "TORT",      hint: "Bayram shirinligi"            },
    { word: "MUZQAYMOQ", hint: "Sovuq shirinlik"              },
    { word: "BANAN",     hint: "Sariq meva"                   },
    { word: "APELSIN",   hint: "C vitamini ko'p"              },
    { word: "MANDARIN",  hint: "Qishda ko'p yeyiladi"         },
    { word: "ANOR",      hint: "Donali meva"                  },
    { word: "UZUM",      hint: "Shirin mayda meva"            },
    { word: "TARVUZ",    hint: "Katta yozgi meva"             },
    { word: "QULUPNAY",  hint: "Qizil mayda meva"             },
    { word: "MANGO",     hint: "Shirin sariq meva"            },
    { word: "ANANAS",    hint: "Tropik meva"                  },
    { word: "KIVI",      hint: "Ichki yashil meva"            },
  ],
  nature: [
    { word: "DARYO",      hint: "Oqar suv"                    },
    { word: "TOG",        hint: "Baland joy, qorli choqqi"    },
    { word: "GUL",        hint: "Chiroyli xushboy o'simlik"   },
    { word: "DARAXT",     hint: "Yog'och beradi"              },
    { word: "BULUT",      hint: "Osmon paxtalari"             },
    { word: "SHAMOL",     hint: "Ko'rinmas, yaproq uchiradi"  },
    { word: "DENGIZ",     hint: "Katta sho'r suv"             },
    { word: "OKEAN",      hint: "Eng katta suv havzasi"       },
    { word: "QUM",        hint: "Cho'lda uchraydi"            },
    { word: "VODIY",      hint: "Tog'lar orasidagi tekislik"  },
    { word: "MAYSA",      hint: "Yashil o'tlar"               },
    { word: "YAPROQ",     hint: "Daraxt bargi"                },
    { word: "QOR",        hint: "Qishda yog'adi"              },
    { word: "YOMGIR",     hint: "Suv tomchilari yog'adi"      },
    { word: "TUMAN",      hint: "Ko'rinish pasayadi"          },
    { word: "MOMAQALDIROQ", hint: "Yashin tovushi"            },
    { word: "YASHIN",     hint: "Osmon chaqnashi"             },
    { word: "QUYOSH",     hint: "Issiqlik manbai"             },
    { word: "OY",         hint: "Kecha yoritadi"              },
    { word: "YULDUZ",     hint: "Osmonda porlaydi"            },
    { word: "BAHOR",      hint: "Gullar ochiladi"             },
    { word: "YOZ",        hint: "Issiq fasl"                  },
    { word: "KUZ",        hint: "Barglar to'kiladi"           },
    { word: "QISH",       hint: "Eng sovuq fasl"              },
    { word: "OROL",       hint: "Suv bilan o'ralgan yer"      },
    { word: "SHARSHARA",  hint: "Suv balanddan tushadi"       },
    { word: "BOTQOQ",     hint: "Nam, loyqa yer"              },
    { word: "MUZLIK",     hint: "Doim muz bilan qoplangan"    },
    { word: "JARLIK",     hint: "Chuqur pastlik"              },
    { word: "QIRGOQ",     hint: "Suv bo'yidagi yer"           },
    { word: "HAVO",       hint: "Nafas olamiz"                },
    { word: "TUPROQ",     hint: "Yer qatlami"                 },
    { word: "OLTIN",      hint: "Qimmatbaho metall"           },
    { word: "KUMUSH",     hint: "Oq metall"                   },
    { word: "TABIAT",     hint: "Atrof-muhit"                 },
  ],
  body: [
    { word: "QOL",      hint: "5 barmoq bor"                },
    { word: "KOZ",      hint: "Ko'rish organi"               },
    { word: "QULOQ",    hint: "Eshitish uchun"               },
    { word: "BURUN",    hint: "Hidlash organi"               },
    { word: "TIL",      hint: "Gapirish, ta'm bilish"        },
    { word: "OYOQ",     hint: "Yurish uchun"                 },
    { word: "BOSH",     hint: "Fikrlash organi"              },
    { word: "TIZZA",    hint: "Oyoq ortasida bukiladi"       },
    { word: "BARMOQ",   hint: "Qo'lda 5 ta bor"             },
    { word: "YUZ",      hint: "Boshning old qismi"           },
    { word: "LAB",      hint: "Og'iz cheti"                  },
    { word: "TISH",     hint: "Ovqat chaynash uchun"         },
    { word: "MIYA",     hint: "Fikrlash markazi"             },
    { word: "SOCH",     hint: "Boshda o'sadi"                },
    { word: "QOSH",     hint: "Ko'z ustida"                  },
    { word: "KIPRIK",   hint: "Ko'zni himoya qiladi"         },
    { word: "BOYIN",    hint: "Boshni ushlab turadi"         },
    { word: "YURAK",    hint: "Qon haydaydi"                 },
    { word: "OPKA",     hint: "Nafas olish organi"           },
    { word: "JIGAR",    hint: "Ichki organ"                  },
    { word: "BUYRAK",   hint: "Filtrlovchi organ"            },
    { word: "QON",      hint: "Organizmda aylanadi"          },
    { word: "TERI",     hint: "Tana qoplami"                 },
    { word: "TIRNOQ",   hint: "Barmoq uchida"                },
    { word: "KAFT",     hint: "Qo'l ichki qismi"             },
    { word: "BILAK",    hint: "Qo'l o'rta qismi"             },
    { word: "YELKA",    hint: "Qo'l boshlanishi"             },
    { word: "SON",      hint: "Oyoq yuqori qismi"            },
    { word: "BOLDIR",   hint: "Oyoq pastki qismi"            },
    { word: "MUSHAK",   hint: "Harakat uchun kerak"          },
    { word: "SUYAK",    hint: "Tana tayanchi"                },
    { word: "UMURTQA",  hint: "Orqa suyaklar"                },
    { word: "BEL",      hint: "Orqa past qismi"              },
    { word: "QORIN",    hint: "Old qism"                     },
    { word: "NAFAS",    hint: "Havo olish"                   },
    { word: "UYQU",     hint: "Dam olish vaqti"              },
    { word: "QUVVAT",   hint: "Energiya"                     },
  ],
  home: [
    { word: "STOL",          hint: "Ustida yoziladi"          },
    { word: "ESHIK",         hint: "Ochiladi va yopiladi"     },
    { word: "DERAZA",        hint: "Oynali, yorug' kiradi"    },
    { word: "KARAVOT",       hint: "Uxlash joyi"              },
    { word: "GILAM",         hint: "Polga solinadi"           },
    { word: "LAMPA",         hint: "Xonani yoritadi"          },
    { word: "KALIT",         hint: "Qulfni ochadi"            },
    { word: "QOZON",         hint: "Ovqat pishiriladi"        },
    { word: "STUL",          hint: "O'tirish uchun"           },
    { word: "DIVAN",         hint: "Yumshoq o'tirgich"        },
    { word: "KRESLO",        hint: "Yakka yumshoq o'rindiq"   },
    { word: "SHKAF",         hint: "Kiyim saqlanadi"          },
    { word: "YOSTIQ",        hint: "Bosh qo'yiladi"           },
    { word: "KORPA",         hint: "Yopiniladi"               },
    { word: "MUZLATGICH",    hint: "Ovqatni sovitadi"         },
    { word: "CHAYNIK",       hint: "Suv qaynatadi"            },
    { word: "KASTRYUL",      hint: "Ovqat pishirish idishi"   },
    { word: "TOVA",          hint: "Qovurish uchun"           },
    { word: "PIYOLA",        hint: "Choy ichiladi"            },
    { word: "KOSA",          hint: "Sho'rva ichiladi"         },
    { word: "QOSHIQ",        hint: "Ovqat yeyish uchun"       },
    { word: "PICHOK",        hint: "Kesish uchun"             },
    { word: "CHELAK",        hint: "Suv tashiladi"            },
    { word: "SOVUN",         hint: "Qo'l yuviladi"            },
    { word: "SHAMPUN",       hint: "Soch yuviladi"            },
    { word: "TAROQ",         hint: "Soch taraladi"            },
    { word: "SOAT",          hint: "Vaqt ko'rsatadi"          },
    { word: "TELEVIZOR",     hint: "Ko'rsatuvlar chiqadi"     },
    { word: "KOMPYUTER",     hint: "Ishlash uchun texnika"    },
    { word: "NOUTBUK",       hint: "Ko'chma kompyuter"        },
    { word: "KONDITSIONER",  hint: "Sovutadi yoki isitadi"    },
    { word: "VENTILYATOR",   hint: "Havo aylantiradi"         },
    { word: "SUPURGI",       hint: "Pol supuriladi"           },
    { word: "CHANGYUTGICH",  hint: "Chang so'radi"            },
    { word: "QULF",          hint: "Yopadi"                   },
    { word: "ROUTER",        hint: "Internet tarqatadi"       },
    { word: "PRINTER",       hint: "Qog'oz chiqaradi"         },
  ],
  sport: [
    { word: "TOP",         hint: "Dumaloq, o'yinda ishlatiladi" },
    { word: "GOL",         hint: "Darvozaga kiradi"             },
    { word: "KURASH",      hint: "O'zbekiston milliy sporti"    },
    { word: "HAKAM",       hint: "O'yinni boshqaradi"           },
    { word: "MEDAL",       hint: "Golib mukofoti"               },
    { word: "CHEMPION",    hint: "Birinchi o'rin egasi"         },
    { word: "FUTBOL",      hint: "Eng mashhur sport turi"       },
    { word: "BASKETBOL",   hint: "Halqaga to'p tashlanadi"      },
    { word: "VOLEYBOL",    hint: "Tarmoq ustidan o'ynaladi"     },
    { word: "TENNIS",      hint: "Raketka bilan o'ynaladi"      },
    { word: "BOKS",        hint: "Musht bilan jang"             },
    { word: "DZYUDO",      hint: "Yapon jang san'ati"           },
    { word: "KARATE",      hint: "Sharq jang san'ati"           },
    { word: "SHAXMAT",     hint: "Aqliy o'yin"                  },
    { word: "SHASHKA",     hint: "Oddiy strategik o'yin"        },
    { word: "GIMNASTIKA",  hint: "Moslashuvchanlik sporti"      },
    { word: "STADION",     hint: "Katta sport joyi"             },
    { word: "MURABBIY",    hint: "Sportchini o'rgatadi"         },
    { word: "JAMOA",       hint: "Bir guruh sportchi"           },
    { word: "FINAL",       hint: "Oxirgi bosqich"               },
    { word: "REKORD",      hint: "Eng yaxshi natija"            },
    { word: "GALABA",      hint: "Yutish"                       },
    { word: "MAGLUBIYAT",  hint: "Yutqazish"                    },
    { word: "DURANG",      hint: "Teng hisob"                   },
    { word: "OLIMPIADA",   hint: "Eng katta musobaqa"           },
    { word: "RAKETKA",     hint: "Tennis uchun"                 },
    { word: "DARVOZA",     hint: "Futbolda bor"                 },
    { word: "PENALTI",     hint: "11 metr zarba"                },
    { word: "FITNES",      hint: "Sog'lomlashtirish sporti"     },
    { word: "YOGA",        hint: "Tinch mashqlar"               },
    { word: "SHTANGA",     hint: "Og'ir ko'tariladi"            },
    { word: "TURNIR",      hint: "Musobaqa"                     },
    { word: "SPORTCHI",    hint: "Sport bilan shug'ullanadi"    },
    { word: "SUZISH",      hint: "Suvda harakat"                },
    { word: "ZARBA",       hint: "Kuchli urish"                 },
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

// Har level boshida bazadan random N ta so'z tanlaydi
function pickWords(catId, count) {
  const bank = WORD_BANK[catId] || [];
  return shuffleArray(bank).slice(0, Math.min(count, bank.length));
}

// Faqat shu so'zning o'z harflari, aralashtirilgan, unique id bilan
function makeLetters(word) {
  return shuffleArray(word.split("")).map((ch, i) => ({
    letter: ch,
    id: `${word}_${i}_${Math.random()}`,
  }));
}

function buildTargets(catId, level) {
  const count = Math.min(2 + level, 4);
  return pickWords(catId, count).map((wObj) => ({
    word: wObj.word,
    hint: wObj.hint,
    letters: makeLetters(wObj.word), // faqat shu so'zning harflari
    found: false,
    selected: [],
    status: "idle", // idle | correct | wrong
  }));
}

// ═══════════════════════════════════════════════════════════════
// GAME HOOK
// ═══════════════════════════════════════════════════════════════
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

  const cat = CATEGORIES.find((c) => c.id === catId);
  const allFound = targets.length > 0 && targets.every((t) => t.found);

  const startLevel = useCallback((cid, lv) => {
    const newTargets = buildTargets(cid, lv);
    setCatId(cid);
    setLevel(lv);
    setTargets(newTargets);
    setActiveIdx(0);
    setHints(3);
    setHintWord(null);
    setShowPts(false);
  }, []);

  const changeCategory = (id) => startLevel(id, 1);
  const nextLevel      = ()   => startLevel(catId, level + 1);

  const setActive = (i) => {
    if (!targets[i]?.found) setActiveIdx(i);
  };

  const selectLetter = (wi, lid) => {
    setTargets((prev) =>
      prev.map((t, i) => {
        if (i !== wi) return t;
        if (t.found || t.status === "correct" || t.status === "wrong") return t;
        const idx = t.selected.findIndex((s) => s.id === lid);
        const selected =
          idx >= 0
            ? t.selected.slice(0, idx)
            : [...t.selected, t.letters.find((l) => l.id === lid)].filter(Boolean);
        return { ...t, selected, status: "idle" };
      })
    );
  };

  const submitWord = (wi) => {
    setTargets((prev) => {
      const t = prev[wi];
      if (!t || t.found) return prev;
      const typed = t.selected.map((s) => s.letter).join("");
      if (!typed) return prev;

      if (typed === t.word) {
        const pts = t.word.length * 12 + (t.word.length > 5 ? 25 : 0);
        setScore((s) => s + pts);
        setCatScores((cs) => ({ ...cs, [catId]: (cs[catId] || 0) + pts }));
        setLastPts(pts);
        setShowPts(true);
        const next = prev.findIndex((tt, i) => !tt.found && i !== wi);
        if (next >= 0) setActiveIdx(next);
        clearTimeout(timers.current[wi]);
        timers.current[wi] = setTimeout(() => {
          setShowPts(false);
          setTargets((p) =>
            p.map((tt, i) => (i === wi ? { ...tt, status: "idle" } : tt))
          );
        }, 900);
        return prev.map((tt, i) =>
          i === wi ? { ...tt, found: true, selected: [], status: "correct" } : tt
        );
      } else {
        clearTimeout(timers.current[wi]);
        timers.current[wi] = setTimeout(() => {
          setTargets((p) =>
            p.map((tt, i) =>
              i === wi ? { ...tt, status: "idle", selected: [] } : tt
            )
          );
        }, 700);
        return prev.map((tt, i) =>
          i === wi ? { ...tt, status: "wrong" } : tt
        );
      }
    });
  };

  const doBack = (wi) =>
    setTargets((prev) =>
      prev.map((t, i) =>
        i === wi && !t.found ? { ...t, selected: t.selected.slice(0, -1) } : t
      )
    );

  const doClear = (wi) =>
    setTargets((prev) =>
      prev.map((t, i) =>
        i === wi && !t.found ? { ...t, selected: [], status: "idle" } : t
      )
    );

  const doShuffle = (wi) =>
    setTargets((prev) =>
      prev.map((t, i) =>
        i === wi && !t.found ? { ...t, letters: shuffleArray([...t.letters]) } : t
      )
    );

  const useHint = () => {
    if (hints <= 0) return;
    const u = targets.find((t) => !t.found);
    if (!u) return;
    setHintWord(u);
    setHints((h) => h - 1);
    setActiveIdx(targets.indexOf(u));
  };

  return {
    cat, catId, level, targets, activeIdx, score, catScores,
    hints, hintWord, lastPts, showPts, allFound,
    changeCategory, nextLevel, setActive,
    selectLetter, submitWord, doBack, doClear, doShuffle, useHint,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

/* ── Category Bar ── */
const CategoryBar = ({ active, onChange, catScores }) => {
  const scrollRef  = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current)
      scrollRef.current.scrollBy({ left: dir * 130, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
      {canLeft && (
        <button onClick={() => scroll(-1)} style={arrowBtnStyle}>‹</button>
      )}
      <div
        ref={scrollRef}
        style={{
          display: "flex", gap: 6, overflowX: "auto", flex: 1,
          scrollbarWidth: "none", padding: "2px 0 4px",
        }}
      >
        {CATEGORIES.map((c) => {
          const on  = c.id === active;
          const pts = catScores[c.id] || 0;
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", borderRadius: 10,
                background: on ? c.color : "rgba(0,0,0,0.05)",
                border: on ? `2px solid ${c.color}` : "2px solid transparent",
                color: on ? "#fff" : "#555",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 14 }}>{c.icon}</span>
              <span>{c.label}</span>
              {pts > 0 && (
                <span
                  style={{
                    fontSize: 10, fontWeight: 800,
                    background: on ? "rgba(255,255,255,0.25)" : c.light,
                    color: on ? "#fff" : c.dark,
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
      {canRight && (
        <button onClick={() => scroll(1)} style={arrowBtnStyle}>›</button>
      )}
    </div>
  );
};

const arrowBtnStyle = {
  flexShrink: 0, width: 28, height: 28, borderRadius: 8,
  background: "rgba(0,0,0,0.06)", border: "none",
  fontSize: 18, fontWeight: 700, cursor: "pointer", color: "#555",
  display: "flex", alignItems: "center", justifyContent: "center",
};

/* ── Word Row (target display) ── */
const WordRow = ({ target, idx, cat, hintWord, isActive, onSetActive }) => {
  const isFound  = target.found;
  const isHinted = hintWord?.word === target.word && !isFound;

  return (
    <div
      onClick={() => !isFound && onSetActive(idx)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 4px", borderRadius: 8,
        background: isActive && !isFound ? `${cat.color}08` : "transparent",
        border: isActive && !isFound ? `1px solid ${cat.color}30` : "1px solid transparent",
        cursor: isFound ? "default" : "pointer",
        transition: "all 0.15s",
      }}
    >
      <span
        style={{
          width: 18, fontSize: 11, fontWeight: 700,
          color: isFound ? cat.color : isActive ? cat.color : "#BBB",
          textAlign: "right", flexShrink: 0,
        }}
      >
        {idx + 1}.
      </span>

      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {target.word.split("").map((ch, ci) => {
          const showFirst = isHinted && ci === 0;
          return (
            <div
              key={ci}
              style={{
                minWidth: 28, height: 34, borderRadius: 7,
                padding: "0 2px",
                background: isFound ? cat.color : showFirst ? "#FEF3C7" : "#F4F4F5",
                border: isFound
                  ? `2px solid ${cat.color}`
                  : showFirst
                  ? "2px solid #F59E0B"
                  : "2px dashed #D4D4D8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800,
                color: isFound ? "#fff" : showFirst ? "#92400E" : "transparent",
                transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                transform: isFound ? "scale(1.04)" : "scale(1)",
              }}
            >
              {isFound ? ch : showFirst ? target.word[0] : ""}
            </div>
          );
        })}
      </div>

      <span
        style={{
          fontSize: 10, fontWeight: 700, flexShrink: 0,
          color: isFound ? cat.dark : isActive ? cat.dark : "#A1A1AA",
          background: isFound ? cat.light : isActive ? cat.light : "#F4F4F5",
          borderRadius: 6, padding: "2px 6px",
          border: isFound || isActive ? `1px solid ${cat.color}30` : "1px solid transparent",
          transition: "all 0.22s",
          whiteSpace: "nowrap",
        }}
      >
        {target.word.length} harf
      </span>

      {isHinted && !isFound && (
        <span
          title={target.hint}
          style={{
            fontSize: 10, color: "#92400E", fontWeight: 600,
            background: "#FEF3C7", borderRadius: 6,
            padding: "2px 7px", border: "1px solid #FDE68A",
            flexShrink: 0, maxWidth: 100,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {target.hint}
        </span>
      )}

      {isFound && (
        <span style={{ fontSize: 14, color: cat.color, flexShrink: 0 }}>✓</span>
      )}

      {isActive && !isFound && (
        <span
          style={{
            fontSize: 9, fontWeight: 800, flexShrink: 0,
            color: cat.color, background: cat.light,
            borderRadius: 5, padding: "2px 5px",
            border: `1px solid ${cat.color}30`,
          }}
        >
          FAOL
        </span>
      )}
    </div>
  );
};

/* ── Letter Circle — faqat activeIdx so'zining harflari ── */
const LetterCircle = ({ target, wordIdx, cat, onSelect }) => {
  const { letters, selected, status, found } = target;
  const [positions, setPositions] = useState({});
  const count  = letters.length;
  const CX = 140, CY = 140;
  const radius = count <= 4 ? 70 : count <= 6 ? 90 : count <= 8 ? 100 : count <= 10 ? 108 : 114;

  useEffect(() => {
    const pos = {};
    letters.forEach(({ id }, i) => {
      const angle = (2 * Math.PI / count) * i - Math.PI / 2;
      pos[id] = {
        x: CX + radius * Math.cos(angle),
        y: CY + radius * Math.sin(angle),
      };
    });
    setPositions(pos);
  }, [letters, count, radius]);

  const selectedIds = new Set(selected.map((s) => s.id));

  if (found) return null;

  return (
    <div style={{ position: "relative", width: 280, height: 280, margin: "0 auto" }}>
      {/* SVG connector lines */}
      <svg
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
        }}
      >
        {selected.map((s, i) => {
          if (i === 0) return null;
          const a = positions[selected[i - 1].id];
          const b = positions[s.id];
          if (!a || !b) return null;
          return (
            <line
              key={`line-${i}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={cat.color} strokeWidth={3}
              strokeLinecap="round" strokeOpacity={0.6}
            />
          );
        })}
      </svg>

      {/* Center dot */}
      <div
        style={{
          position: "absolute", left: CX - 7, top: CY - 7,
          width: 14, height: 14, borderRadius: "50%",
          background: `${cat.color}20`,
          border: `2px solid ${cat.color}40`,
        }}
      />

      {/* Letter buttons */}
      {letters.map(({ letter, id }) => {
        const pos    = positions[id];
        if (!pos) return null;
        const isSel  = selectedIds.has(id);
        const order  = selected.findIndex((s) => s.id === id) + 1;
        const isWrong = status === "wrong" && isSel;

        return (
          <button
            key={id}
            onClick={(e) => { e.stopPropagation(); onSelect(wordIdx, id); }}
            style={{
              position: "absolute",
              left: pos.x - 26, top: pos.y - 26,
              width: 52, height: 52, borderRadius: "50%",
              border: isSel
                ? `2.5px solid ${cat.color}`
                : "2px solid rgba(0,0,0,0.1)",
              background: isSel ? cat.color : "#FFFFFF",
              color: isSel ? "#fff" : "#1A1A1A",
              fontSize: 17, fontWeight: 800,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer", zIndex: 2,
              boxShadow: isSel
                ? `0 3px 14px ${cat.color}50`
                : "0 2px 8px rgba(0,0,0,0.09)",
              transform: isSel ? "scale(1.12)" : "scale(1)",
              transition: "all 0.15s cubic-bezier(0.34,1.56,0.64,1)",
              animation: isWrong ? "shake 0.35s ease" : "none",
            }}
          >
            {letter}
            {isSel && (
              <span
                style={{
                  position: "absolute", top: -5, right: -5,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#111", color: "#fff",
                  fontSize: 9, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1.5px solid #fff",
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
};

/* ── Word Preview ── */
const WordPreview = ({ target, cat, lastPts, showPts }) => {
  const { selected, status } = target;
  const word = selected.map((s) => s.letter).join("");
  const sMap = {
    correct:   { bg: cat.color,  border: cat.color,  text: "#fff"    },
    wrong:     { bg: "#FEF2F2",  border: "#EF4444",  text: "#DC2626" },
    idle:      { bg: "#F4F4F5",  border: "#E4E4E7",  text: "#1A1A1A" },
  };
  const s   = sMap[status] || sMap.idle;
  const msg = {
    correct: "✓ To'g'ri!",
    wrong:   "✗ Noto'g'ri",
  }[status];

  return (
    <div
      style={{
        minHeight: 64, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 6,
      }}
    >
      {word ? (
        <div
          style={{
            display: "flex", gap: 4, position: "relative", flexWrap: "wrap",
            justifyContent: "center",
            animation:
              status === "wrong"
                ? "shake 0.35s ease"
                : status === "correct"
                ? "popIn 0.3s ease"
                : "none",
          }}
        >
          {word.split("").map((ch, i) => (
            <div
              key={i}
              style={{
                minWidth: 36, height: 42, borderRadius: 9, padding: "0 4px",
                background: s.bg, border: `2px solid ${s.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: s.text,
                transition: "all 0.16s",
              }}
            >
              {ch}
            </div>
          ))}
          {showPts && (
            <div
              style={{
                position: "absolute", top: -20, right: -8,
                fontSize: 14, fontWeight: 800, color: "#16A34A",
                animation: "floatUp 1.2s ease forwards",
                pointerEvents: "none",
              }}
            >
              +{lastPts}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            fontSize: 13, color: "#A1A1AA",
            fontWeight: 600, letterSpacing: "0.04em",
          }}
        >
          Harflarni tanlang...
        </div>
      )}
      {msg && (
        <div
          style={{
            fontSize: 12, fontWeight: 700,
            color: status === "correct" ? cat.dark : s.text,
            animation: "fadeIn 0.15s ease",
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
};

/* ── Hint Panel ── */
const HintPanel = ({ hints, hintWord, cat, onUseHint }) => (
  <div
    style={{
      background: "#FAFAFA", borderRadius: 12, border: "1px solid #E4E4E7",
      padding: "11px 14px",
      display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 10,
    }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 16, marginTop: 1 }}>💡</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Yordamchi</div>
        {hintWord ? (
          <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600, marginTop: 2 }}>
            {hintWord.hint}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>
            So'z topishda yordam
          </div>
        )}
      </div>
    </div>
    <button
      onClick={onUseHint}
      disabled={hints <= 0}
      style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 9,
        background: hints > 0 ? "#FEF3C7" : "#F4F4F5",
        border: hints > 0 ? "1.5px solid #FCD34D" : "1.5px solid #E4E4E7",
        color: hints > 0 ? "#92400E" : "#A1A1AA",
        fontSize: 13, fontWeight: 700,
        cursor: hints > 0 ? "pointer" : "default",
        fontFamily: "'DM Sans', sans-serif",
        opacity: hints > 0 ? 1 : 0.5, transition: "all 0.15s",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8, height: 8, borderRadius: "50%", display: "inline-block",
            background: i < hints ? "#F59E0B" : "#D4D4D8",
          }}
        />
      ))}
      <span>Hint</span>
    </button>
  </div>
);

/* ── Level Complete ── */
const LevelComplete = ({ cat, targets, score, onNext }) => (
  <div
    style={{
      position: "absolute", inset: 0, zIndex: 40, borderRadius: 20,
      background: "rgba(255,255,255,0.97)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 16, padding: 32,
      animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
    }}
  >
    <div style={{ fontSize: 56 }}>🏆</div>
    <div
      style={{
        fontSize: 22, fontWeight: 800, color: "#111",
        textAlign: "center", fontFamily: "'DM Sans', sans-serif",
      }}
    >
      Level yakunlandi!
    </div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
      {targets.map((t) => (
        <span
          key={t.word}
          style={{
            padding: "5px 12px", borderRadius: 8,
            background: cat.light, color: cat.dark,
            border: `1.5px solid ${cat.color}40`,
            fontSize: 14, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {t.word}
        </span>
      ))}
    </div>
    <div style={{ fontSize: 14, color: "#6B7280", fontFamily: "'DM Sans', sans-serif" }}>
      Jami ball: <strong style={{ color: "#111" }}>{score}</strong>
    </div>
    <button
      onClick={onNext}
      style={{
        padding: "13px 30px", borderRadius: 12,
        background: cat.color, color: "#fff",
        border: "none", fontSize: 15, fontWeight: 700,
        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      }}
    >
      Keyingi level →
    </button>
  </div>
);

/* ── Found Words ── */
const FoundWords = ({ targets, cat }) => {
  const found = targets.filter((t) => t.found);
  if (!found.length) return null;
  return (
    <div
      style={{
        background: "#fff", borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.07)",
        padding: "14px 16px", marginTop: 12,
      }}
    >
      <div
        style={{
          fontSize: 11, fontWeight: 700, color: "#A1A1AA",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
        }}
      >
        Topilgan so'zlar — {found.length} ta
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {found.map((t) => (
          <div
            key={t.word}
            style={{
              padding: "5px 12px", borderRadius: 8,
              background: cat.light, color: cat.dark,
              border: `1.5px solid ${cat.color}30`,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              animation: "fadeIn 0.2s ease",
            }}
          >
            {t.word}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function WordGame() {
  const g = useGame();
  if (!g.cat) return null;
  const { cat } = g;

  const activeTarget = g.targets[g.activeIdx];
  const canSubmit =
    !!activeTarget &&
    !activeTarget.found &&
    activeTarget.selected.length > 0 &&
    activeTarget.status !== "correct" &&
    activeTarget.status !== "wrong";

  const foundCount = g.targets.filter((t) => t.found).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${cat.light} 0%, #FAFAFA 55%, #F8FAFC 100%)`,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
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
          100%{opacity:0;transform:translateY(-38px)}
        }
      `}</style>

      <div style={{ maxWidth: 460, margin: "0 auto", padding: "16px 14px 52px" }}>

        {/* ── HEADER ── */}
        <div
          style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22, fontWeight: 800, color: "#111",
                letterSpacing: "-0.02em",
              }}
            >
              So'z O'yini
            </div>
            <div style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 500, marginTop: 1 }}>
              {cat.icon} {cat.label} · Level {g.level}
            </div>
          </div>
          <div
            style={{
              background: cat.color, color: "#fff",
              borderRadius: 10, padding: "8px 16px",
              fontSize: 16, fontWeight: 800,
            }}
          >
            {g.score} ball
          </div>
        </div>

        {/* ── CATEGORY BAR ── */}
        <div style={{ marginBottom: 14 }}>
          <CategoryBar
            active={g.catId}
            onChange={g.changeCategory}
            catScores={g.catScores}
          />
        </div>

        {/* ── GAME CARD ── */}
        <div
          style={{
            background: "#fff", borderRadius: 20,
            border: `1px solid ${cat.color}20`,
            boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
            padding: "20px 16px",
            position: "relative", overflow: "hidden",
          }}
        >
          {g.allFound && (
            <LevelComplete
              cat={cat}
              targets={g.targets}
              score={g.score}
              onNext={g.nextLevel}
            />
          )}

          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                flex: 1, height: 5,
                background: "#F4F4F5", borderRadius: 99, overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${g.targets.length ? (foundCount / g.targets.length) * 100 : 0}%`,
                  height: "100%", background: cat.color, borderRadius: 99,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <span
              style={{ fontSize: 12, fontWeight: 700, color: "#71717A", whiteSpace: "nowrap" }}
            >
              {foundCount} / {g.targets.length}
            </span>
          </div>

          {/* ── WORD SLOTS — bosib faollashtirish ── */}
          <div
            style={{
              display: "flex", flexDirection: "column", gap: 8,
              marginBottom: 14, padding: "12px 10px",
              background: "#FAFAFA", borderRadius: 14, border: "1px solid #F4F4F5",
            }}
          >
            <div
              style={{
                fontSize: 10, fontWeight: 800, color: "#A1A1AA",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4,
              }}
            >
              So'zni bosib tanlang · harflarni to'g'irla
            </div>
            {g.targets.map((t, i) => (
              <WordRow
                key={`${t.word}-${i}`}
                target={t}
                idx={i}
                cat={cat}
                hintWord={g.hintWord}
                isActive={i === g.activeIdx && !t.found}
                onSetActive={g.setActive}
              />
            ))}
          </div>

          {/* ── HINT ── */}
          <div style={{ marginBottom: 14 }}>
            <HintPanel
              hints={g.hints}
              hintWord={g.hintWord}
              cat={cat}
              onUseHint={g.useHint}
            />
          </div>

          {/* ── WORD PREVIEW (faol so'z uchun) ── */}
          {activeTarget && !activeTarget.found && (
            <div style={{ marginBottom: 8 }}>
              <WordPreview
                target={activeTarget}
                cat={cat}
                lastPts={g.lastPts}
                showPts={g.showPts}
              />
            </div>
          )}

          {/* ── LETTER CIRCLE (faqat faol so'zning harflari) ── */}
          {activeTarget && !activeTarget.found && (
            <LetterCircle
              target={activeTarget}
              wordIdx={g.activeIdx}
              cat={cat}
              onSelect={g.selectLetter}
            />
          )}

          {/* ── ACTION BUTTONS ── */}
          {activeTarget && !activeTarget.found && (
            <>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {[
                  {
                    label: "🔀 Aralashtir",
                    onClick: () => g.doShuffle(g.activeIdx),
                    disabled: false,
                    s: { background: "#EFF6FF", border: "1.5px solid #BFDBFE", color: "#1D4ED8" },
                  },
                  {
                    label: "⌫ O'chir",
                    onClick: () => g.doBack(g.activeIdx),
                    disabled: !activeTarget.selected.length,
                    s: { background: "#F4F4F5", border: "1.5px solid #E4E4E7", color: "#374151" },
                  },
                  {
                    label: "✕ Tozala",
                    onClick: () => g.doClear(g.activeIdx),
                    disabled: !activeTarget.selected.length,
                    s: { background: "#FFF1F2", border: "1.5px solid #FECDD3", color: "#BE123C" },
                  },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    disabled={btn.disabled}
                    style={{
                      flex: 1, padding: "9px 4px", borderRadius: 10,
                      fontSize: 12, fontWeight: 700,
                      cursor: btn.disabled ? "default" : "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: btn.disabled ? 0.4 : 1,
                      transition: "all 0.15s",
                      ...btn.s,
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* ── SUBMIT ── */}
              <button
                onClick={() => g.submitWord(g.activeIdx)}
                disabled={!canSubmit}
                style={{
                  width: "100%", marginTop: 10, padding: "13px",
                  borderRadius: 12, border: "none",
                  cursor: canSubmit ? "pointer" : "default",
                  background: canSubmit ? cat.color : "#E4E4E7",
                  color: canSubmit ? "#fff" : "#A1A1AA",
                  fontSize: 15, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.18s",
                  opacity: canSubmit ? 1 : 0.55,
                }}
              >
                Tekshirish ✓
              </button>
            </>
          )}
        </div>

        {/* ── FOUND WORDS ── */}
        <FoundWords targets={g.targets} cat={cat} />
      </div>
    </div>
  );
}
