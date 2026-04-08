import { useRef, useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// DATA — har so'z difficulty: 1=oson, 2=o'rta, 3=qiyin
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
    // difficulty 1 — qisqa, tanish so'zlar (2–4 harf)
    { word: "IT",      hint: "Sodiq uy hayvoni",            d: 1 },
    { word: "OT",      hint: "Minib yuriladi",              d: 1 },
    { word: "FIL",     hint: "Uzun burni bor",              d: 1 },
    { word: "KIT",     hint: "Eng katta suv hayvoni",       d: 1 },
    { word: "ARI",     hint: "Asal qiladi",                 d: 1 },
    { word: "AYIQ",    hint: "O'rmonda yashaydi",           d: 1 },
    { word: "ILON",    hint: "Sudralib yuradi",             d: 1 },
    { word: "BAQА",    hint: "Suvda sakraydi",              d: 1 },
    // difficulty 2 — o'rta uzunlik (5–7 harf)
    { word: "MUSHUK",  hint: "Uy hayvoni, miyovlaydi",      d: 2 },
    { word: "SIGIR",   hint: "Sut beruvchi hayvon",         d: 2 },
    { word: "TOVUQ",   hint: "Tuxum qo'yadi",              d: 2 },
    { word: "QUYON",   hint: "Uzun quloqlari bor",          d: 2 },
    { word: "BALIQ",   hint: "Suvda yashaydi",              d: 2 },
    { word: "KUCHUK",  hint: "Itning bolasi",               d: 2 },
    { word: "TULKI",   hint: "Ayyor, qizil hayvon",         d: 2 },
    { word: "ESHAK",   hint: "Yuklarni tashiydi",           d: 2 },
    { word: "SHER",    hint: "Hayvonlar qiroli",            d: 2 },
    { word: "TUYA",    hint: "Cho'lda yashaydi, o'rkachli", d: 2 },
    { word: "DELFIN",  hint: "Aqlli dengiz hayvoni",        d: 2 },
    { word: "BURGUT",  hint: "Katta yirtqich qush",         d: 2 },
    { word: "AKULA",   hint: "Dengiz yirtqichi",            d: 2 },
    { word: "ZEBRA",   hint: "Chiziqli otga o'xshash",      d: 2 },
    { word: "PANDA",   hint: "Oq-qora ayiq",                d: 2 },
    { word: "GEPA",    hint: "Eng tez yuguradigan hayvon",  d: 2 },
    { word: "KOALA",   hint: "Daraxtda yashaydi",           d: 2 },
    // difficulty 3 — uzun, kamtanish (8+ harf)
    { word: "KABUTAR",     hint: "Tinchlik ramzi bo'lgan qush",   d: 3 },
    { word: "KENGURU",     hint: "Sakrash orqali yuradi",         d: 3 },
    { word: "KALAMUSH",    hint: "Kichik kemiruvchi",             d: 3 },
    { word: "SICHQON",     hint: "Uyda yashovchi kemiruvchi",     d: 3 },
    { word: "TIPRATIKAN",  hint: "Ignali hayvon",                 d: 3 },
    { word: "QOPLON",      hint: "Tez yuguruvchi yirtqich",       d: 3 },
    { word: "LEOPARD",     hint: "Dog'li yirtqich",               d: 3 },
    { word: "TIMSOH",      hint: "Suvda yashovchi yirtqich",      d: 3 },
    { word: "QURBAQA",     hint: "Suvda va quruqlikda yashaydi",  d: 3 },
    { word: "KAPALAK",     hint: "Rangli hasharot",               d: 3 },
    { word: "QISQICHBAQA", hint: "Yon yuradi",                    d: 3 },
    { word: "PINGVIN",     hint: "Ucha olmaydi, muzda yashaydi",  d: 3 },
    { word: "CHUMCHUQ",    hint: "Kichik qush",                   d: 3 },
    { word: "LAYLAK",      hint: "Uzun oyoqli qush",              d: 3 },
    { word: "MEDUZA",      hint: "Jelga o'xshash dengiz jonzoti", d: 3 },
  ],
  food: [
    { word: "NON",       hint: "Kundalik oziq",                d: 1 },
    { word: "SUT",       hint: "Oq ichimlik",                  d: 1 },
    { word: "GUZ",       hint: "Yong'oq turi",                 d: 1 },
    { word: "ASAL",      hint: "Arilar tayyorlaydi",           d: 1 },
    { word: "OLMA",      hint: "Har kuni bir dona",            d: 1 },
    { word: "CHOY",      hint: "Issiq ichimlik",               d: 1 },
    { word: "ANOR",      hint: "Donali meva",                  d: 1 },
    { word: "UZUM",      hint: "Shirin mayda meva",            d: 1 },
    { word: "GURUCH",    hint: "Osh uchun kerak",              d: 2 },
    { word: "SABZI",     hint: "Qizil ildiz sabzavot",         d: 2 },
    { word: "TUXUM",     hint: "Tovuq qo'yadi",               d: 2 },
    { word: "PIYOZ",     hint: "Ko'z yoshlatadi",              d: 2 },
    { word: "QOVUN",     hint: "Yozgi shirin meva",            d: 2 },
    { word: "LIMON",     hint: "Nordon va sariq",              d: 2 },
    { word: "BANAN",     hint: "Sariq meva",                   d: 2 },
    { word: "MANTI",     hint: "Bug'da pishiriladi",           d: 2 },
    { word: "SOMSA",     hint: "Tandirda pishadi",             d: 2 },
    { word: "PALOV",     hint: "Mashhur o'zbek taomi",         d: 2 },
    { word: "PIZZA",     hint: "Italiya taomi",                d: 2 },
    { word: "BURGER",    hint: "Go'shtli sendvich",            d: 2 },
    { word: "QATIQ",     hint: "Sut mahsuloti",                d: 2 },
    { word: "TARVUZ",    hint: "Katta yozgi meva",             d: 2 },
    { word: "GILOS",     hint: "Qizil kichik meva",            d: 2 },
    { word: "BODRING",   hint: "Yashil va uzunchoq",           d: 2 },
    { word: "KARTOSHKA", hint: "Qovurib yeyiladi",             d: 3 },
    { word: "POMIDOR",   hint: "Qizil sabzavot",               d: 2 },
    { word: "KARAM",     hint: "Bargli sabzavot",              d: 2 },
    { word: "BAQLAJON",  hint: "To'q binafsha sabzavot",       d: 3 },
    { word: "QALAMPIR",  hint: "Achchiq yoki shirin bo'ladi",  d: 3 },
    { word: "SARIMSOQ",  hint: "Hidi kuchli",                  d: 3 },
    { word: "LAGMON",    hint: "Cho'zma ovqat",                d: 3 },
    { word: "SHASHLIK",  hint: "Go'sht kabobi",                d: 3 },
    { word: "PISHLOQ",   hint: "Sutdan tayyorlanadi",          d: 3 },
    { word: "SHOKOLAD",  hint: "Shirinlik",                    d: 3 },
    { word: "MUZQAYMOQ", hint: "Sovuq shirinlik",              d: 3 },
    { word: "APELSIN",   hint: "C vitamini ko'p",              d: 3 },
    { word: "MANDARIN",  hint: "Qishda ko'p yeyiladi",         d: 3 },
    { word: "QULUPNAY",  hint: "Qizil mayda meva",             d: 3 },
    { word: "ANANAS",    hint: "Tropik meva",                  d: 3 },
  ],
  nature: [
    { word: "GUL",    hint: "Chiroyli xushboy o'simlik",  d: 1 },
    { word: "TOG",    hint: "Baland joy, qorli choqqi",   d: 1 },
    { word: "QOR",    hint: "Qishda yog'adi",             d: 1 },
    { word: "OY",     hint: "Kecha yoritadi",             d: 1 },
    { word: "QUM",    hint: "Cho'lda uchraydi",           d: 1 },
    { word: "YOZ",    hint: "Issiq fasl",                 d: 1 },
    { word: "KUZ",    hint: "Barglar to'kiladi",          d: 1 },
    { word: "HAVO",   hint: "Nafas olamiz",               d: 1 },
    { word: "DARYO",  hint: "Oqar suv",                   d: 2 },
    { word: "DARAXT", hint: "Yog'och beradi",             d: 2 },
    { word: "BULUT",  hint: "Osmon paxtalari",            d: 2 },
    { word: "SHAMOL", hint: "Ko'rinmas, yaproq uchiradi", d: 2 },
    { word: "DENGIZ", hint: "Katta sho'r suv",            d: 2 },
    { word: "MAYSA",  hint: "Yashil o'tlar",              d: 2 },
    { word: "YAPROQ", hint: "Daraxt bargi",               d: 2 },
    { word: "YASHIN", hint: "Osmon chaqnashi",            d: 2 },
    { word: "QUYOSH", hint: "Issiqlik manbai",            d: 2 },
    { word: "YULDUZ", hint: "Osmonda porlaydi",           d: 2 },
    { word: "BAHOR",  hint: "Gullar ochiladi",            d: 2 },
    { word: "QISH",   hint: "Eng sovuq fasl",             d: 2 },
    { word: "OROL",   hint: "Suv bilan o'ralgan yer",     d: 2 },
    { word: "OLTIN",  hint: "Qimmatbaho metall",          d: 2 },
    { word: "KUMUSH", hint: "Oq metall",                  d: 2 },
    { word: "TABIAT", hint: "Atrof-muhit",                d: 2 },
    { word: "OKEAN",  hint: "Eng katta suv havzasi",      d: 3 },
    { word: "VODIY",  hint: "Tog'lar orasidagi tekislik", d: 3 },
    { word: "TUMAN",  hint: "Ko'rinish pasayadi",         d: 3 },
    { word: "SHARSHARA", hint: "Suv balanddan tushadi",   d: 3 },
    { word: "BOTQOQ",    hint: "Nam, loyqa yer",          d: 3 },
    { word: "MUZLIK",    hint: "Doim muz bilan qoplangan",d: 3 },
    { word: "JARLIK",    hint: "Chuqur pastlik",          d: 3 },
    { word: "QIRGOQ",    hint: "Suv bo'yidagi yer",       d: 3 },
    { word: "TUPROQ",    hint: "Yer qatlami",             d: 3 },
    { word: "MOMAQALDIROQ", hint: "Yashin tovushi",       d: 3 },
    { word: "YOMGIR",    hint: "Suv tomchilari yog'adi",  d: 3 },
  ],
  body: [
    { word: "QOL",    hint: "5 barmoq bor",           d: 1 },
    { word: "KOZ",    hint: "Ko'rish organi",          d: 1 },
    { word: "TIL",    hint: "Gapirish, ta'm bilish",   d: 1 },
    { word: "BEL",    hint: "Orqa past qismi",         d: 1 },
    { word: "YUZ",    hint: "Boshning old qismi",      d: 1 },
    { word: "LAB",    hint: "Og'iz cheti",             d: 1 },
    { word: "SON",    hint: "Oyoq yuqori qismi",       d: 1 },
    { word: "QON",    hint: "Organizmda aylanadi",     d: 1 },
    { word: "BOSH",   hint: "Fikrlash organi",         d: 2 },
    { word: "TISH",   hint: "Ovqat chaynash uchun",    d: 2 },
    { word: "MIYA",   hint: "Fikrlash markazi",        d: 2 },
    { word: "SOCH",   hint: "Boshda o'sadi",           d: 2 },
    { word: "QOSH",   hint: "Ko'z ustida",             d: 2 },
    { word: "OYOQ",   hint: "Yurish uchun",            d: 2 },
    { word: "BURUN",  hint: "Hidlash organi",          d: 2 },
    { word: "QULOQ",  hint: "Eshitish uchun",          d: 2 },
    { word: "YURAK",  hint: "Qon haydaydi",            d: 2 },
    { word: "JIGAR",  hint: "Ichki organ",             d: 2 },
    { word: "TERI",   hint: "Tana qoplami",            d: 2 },
    { word: "NAFAS",  hint: "Havo olish",              d: 2 },
    { word: "UYQU",   hint: "Dam olish vaqti",         d: 2 },
    { word: "KAFT",   hint: "Qo'l ichki qismi",        d: 2 },
    { word: "TIZZA",  hint: "Oyoq ortasida bukiladi",  d: 2 },
    { word: "OPKA",   hint: "Nafas olish organi",      d: 3 },
    { word: "BUYRAK", hint: "Filtrlovchi organ",       d: 3 },
    { word: "TIRNOQ", hint: "Barmoq uchida",           d: 3 },
    { word: "BILAK",  hint: "Qo'l o'rta qismi",        d: 3 },
    { word: "YELKA",  hint: "Qo'l boshlanishi",        d: 3 },
    { word: "BOLDIR", hint: "Oyoq pastki qismi",       d: 3 },
    { word: "MUSHAK", hint: "Harakat uchun kerak",     d: 3 },
    { word: "SUYAK",  hint: "Tana tayanchi",           d: 3 },
    { word: "UMURTQA",hint: "Orqa suyaklar",           d: 3 },
    { word: "QORIN",  hint: "Old qism",                d: 3 },
    { word: "KIPRIK", hint: "Ko'zni himoya qiladi",    d: 3 },
    { word: "BARMOQ", hint: "Qo'lda 5 ta bor",         d: 3 },
    { word: "BOYIN",  hint: "Boshni ushlab turadi",    d: 3 },
    { word: "QUVVAT", hint: "Energiya",                d: 3 },
  ],
  home: [
    { word: "STOL",  hint: "Ustida yoziladi",        d: 1 },
    { word: "STUL",  hint: "O'tirish uchun",         d: 1 },
    { word: "SOAT",  hint: "Vaqt ko'rsatadi",        d: 1 },
    { word: "QULF",  hint: "Yopadi",                 d: 1 },
    { word: "ESHIK", hint: "Ochiladi va yopiladi",   d: 1 },
    { word: "TOVA",  hint: "Qovurish uchun",         d: 1 },
    { word: "KOSA",  hint: "Sho'rva ichiladi",       d: 1 },
    { word: "PECHK", hint: "Issiq qiladi",           d: 1 },
    { word: "GILAM",   hint: "Polga solinadi",       d: 2 },
    { word: "LAMPA",   hint: "Xonani yoritadi",      d: 2 },
    { word: "KALIT",   hint: "Qulfni ochadi",        d: 2 },
    { word: "QOZON",   hint: "Ovqat pishiriladi",    d: 2 },
    { word: "DIVAN",   hint: "Yumshoq o'tirgich",    d: 2 },
    { word: "SHKAF",   hint: "Kiyim saqlanadi",      d: 2 },
    { word: "YOSTIQ",  hint: "Bosh qo'yiladi",       d: 2 },
    { word: "KORPA",   hint: "Yopiniladi",           d: 2 },
    { word: "PIYOLA",  hint: "Choy ichiladi",        d: 2 },
    { word: "QOSHIQ",  hint: "Ovqat yeyish uchun",  d: 2 },
    { word: "PICHOK",  hint: "Kesish uchun",         d: 2 },
    { word: "CHELAK",  hint: "Suv tashiladi",        d: 2 },
    { word: "SOVUN",   hint: "Qo'l yuviladi",        d: 2 },
    { word: "TAROQ",   hint: "Soch taraladi",        d: 2 },
    { word: "DERAZA",  hint: "Oynali, yorug' kiradi",d: 2 },
    { word: "KARAVOT", hint: "Uxlash joyi",          d: 2 },
    { word: "KRESLO",  hint: "Yakka yumshoq o'rindiq",  d: 3 },
    { word: "CHAYNIK", hint: "Suv qaynatadi",            d: 3 },
    { word: "KASTRYUL",hint: "Ovqat pishirish idishi",   d: 3 },
    { word: "SHAMPUN", hint: "Soch yuviladi",            d: 3 },
    { word: "SUPURGI", hint: "Pol supuriladi",           d: 3 },
    { word: "TELEVIZOR",   hint: "Ko'rsatuvlar chiqadi",  d: 3 },
    { word: "KOMPYUTER",   hint: "Ishlash uchun texnika", d: 3 },
    { word: "NOUTBUK",     hint: "Ko'chma kompyuter",     d: 3 },
    { word: "MUZLATGICH",  hint: "Ovqatni sovitadi",      d: 3 },
    { word: "KONDITSIONER",hint: "Sovutadi yoki isitadi", d: 3 },
    { word: "VENTILYATOR", hint: "Havo aylantiradi",      d: 3 },
    { word: "CHANGYUTGICH",hint: "Chang so'radi",         d: 3 },
    { word: "ROUTER",      hint: "Internet tarqatadi",    d: 3 },
    { word: "PRINTER",     hint: "Qog'oz chiqaradi",      d: 3 },
  ],
  sport: [
    { word: "TOP",   hint: "Dumaloq, o'yinda ishlatiladi", d: 1 },
    { word: "GOL",   hint: "Darvozaga kiradi",             d: 1 },
    { word: "ZAL",   hint: "Sport joyi",                  d: 1 },
    { word: "BOKS",  hint: "Musht bilan jang",            d: 1 },
    { word: "YOGA",  hint: "Tinch mashqlar",              d: 1 },
    { word: "FINAL", hint: "Oxirgi bosqich",              d: 1 },
    { word: "VAQT",  hint: "O'lchanadi",                  d: 1 },
    { word: "HAKAM", hint: "O'yinni boshqaradi",          d: 2 },
    { word: "MEDAL", hint: "Golib mukofoti",              d: 2 },
    { word: "KURASH",hint: "O'zbekiston milliy sporti",   d: 2 },
    { word: "FUTBOL",hint: "Eng mashhur sport turi",      d: 2 },
    { word: "TENNIS",hint: "Raketka bilan o'ynaladi",     d: 2 },
    { word: "JAMOA", hint: "Bir guruh sportchi",          d: 2 },
    { word: "GALABA",hint: "Yutish",                      d: 2 },
    { word: "DURANG",hint: "Teng hisob",                  d: 2 },
    { word: "ZARBA", hint: "Kuchli urish",                d: 2 },
    { word: "REKORD",hint: "Eng yaxshi natija",           d: 2 },
    { word: "TURNIR",hint: "Musobaqa",                    d: 2 },
    { word: "SUZISH",hint: "Suvda harakat",               d: 2 },
    { word: "FITNES",hint: "Sog'lomlashtirish sporti",    d: 2 },
    { word: "SHAXMAT",  hint: "Aqliy o'yin",             d: 2 },
    { word: "SHASHKA",  hint: "Oddiy strategik o'yin",   d: 2 },
    { word: "DARVOZA",  hint: "Futbolda bor",            d: 2 },
    { word: "PENALTI",  hint: "11 metr zarba",           d: 2 },
    { word: "CHEMPION", hint: "Birinchi o'rin egasi",    d: 3 },
    { word: "BASKETBOL",hint: "Halqaga to'p tashlanadi", d: 3 },
    { word: "VOLEYBOL", hint: "Tarmoq ustidan o'ynaladi",d: 3 },
    { word: "DZYUDO",   hint: "Yapon jang san'ati",      d: 3 },
    { word: "KARATE",   hint: "Sharq jang san'ati",      d: 3 },
    { word: "STADION",  hint: "Katta sport joyi",        d: 3 },
    { word: "MURABBIY", hint: "Sportchini o'rgatadi",    d: 3 },
    { word: "OLIMPIADA",hint: "Eng katta musobaqa",      d: 3 },
    { word: "RAKETKA",  hint: "Tennis uchun",            d: 3 },
    { word: "SHTANGA",  hint: "Og'ir ko'tariladi",       d: 3 },
    { word: "GIMNASTIKA",hint:"Moslashuvchanlik sporti", d: 3 },
    { word: "SPORTCHI", hint: "Sport bilan shug'ullanadi",d: 3 },
    { word: "MAGLUBIYAT",hint:"Yutqazish",               d: 3 },
  ],
};

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD — localStorage orqali saqlanadi
// ═══════════════════════════════════════════════════════════════
const LB_KEY = "soz_oyini_leaderboard_v1";

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLeaderboard(entries) {
  try { localStorage.setItem(LB_KEY, JSON.stringify(entries)); } catch {}
}

function addToLeaderboard(name, score, level, catId) {
  const entries = loadLeaderboard();
  entries.push({ name, score, level, catId, date: Date.now() });
  entries.sort((a, b) => b.score - a.score);
  const top = entries.slice(0, 20);
  saveLeaderboard(top);
  return top;
}

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

// Faqat shu so'zning o'z harflari, aralashtirilgan
function makeLetters(word) {
  return shuffleArray(word.split("")).map((ch, i) => ({
    letter: ch,
    id: `${word}_${i}_${Math.random()}`,
  }));
}

/**
 * Level bo'yicha qiyinlik:
 *  Level 1–2  → d:1 so'zlar
 *  Level 3–4  → d:1 + d:2 aralash
 *  Level 5–6  → d:2 so'zlar
 *  Level 7+   → d:2 + d:3 aralash (asosan d:3)
 *
 * Takrorlanmaslik uchun usedWords Set ishlatiladi.
 */
function getDifficultyForLevel(level) {
  if (level <= 2) return [1];
  if (level <= 4) return [1, 2];
  if (level <= 6) return [2];
  return [2, 3];
}

function pickWordsForLevel(catId, level, usedWords) {
  const bank    = WORD_BANK[catId] || [];
  const diffs   = getDifficultyForLevel(level);
  const count   = level <= 2 ? 2 : level <= 4 ? 3 : 4;

  // Foydalanilmagan so'zlarni difficulty bo'yicha filter
  const pool = shuffleArray(
    bank.filter(w => diffs.includes(w.d) && !usedWords.has(w.word))
  );

  // Yetarli so'z bo'lmasa, past difficulty dan ham olish
  if (pool.length < count) {
    const fallback = shuffleArray(
      bank.filter(w => !usedWords.has(w.word) && !pool.find(p => p.word === w.word))
    );
    pool.push(...fallback);
  }

  return pool.slice(0, count);
}

function buildTargets(catId, level, usedWords) {
  const words = pickWordsForLevel(catId, level, usedWords);
  return words.map(wObj => ({
    word:     wObj.word,
    hint:     wObj.hint,
    diff:     wObj.d,
    letters:  makeLetters(wObj.word),
    found:    false,
    selected: [],
    status:   "idle",
  }));
}

// ═══════════════════════════════════════════════════════════════
// GAME HOOK
// ═══════════════════════════════════════════════════════════════
function useGame(playerName) {
  const [catId,     setCatId]     = useState("animals");
  const [level,     setLevel]     = useState(1);
  const [targets,   setTargets]   = useState(() => buildTargets("animals", 1, new Set()));
  const [activeIdx, setActiveIdx] = useState(0);
  const [score,     setScore]     = useState(0);
  const [catScores, setCatScores] = useState({});
  const [hints,     setHints]     = useState(3);
  const [hintWord,  setHintWord]  = useState(null);
  const [lastPts,   setLastPts]   = useState(0);
  const [showPts,   setShowPts]   = useState(false);
  // Har kategoriya uchun ishlatilgan so'zlar
  const usedWordsRef = useRef({ animals: new Set(), food: new Set(), nature: new Set(), body: new Set(), home: new Set(), sport: new Set() });
  const timers = useRef({});

  const cat = CATEGORIES.find(c => c.id === catId);
  const allFound = targets.length > 0 && targets.every(t => t.found);

  const startLevel = useCallback((cid, lv, keepUsed = true) => {
    if (!keepUsed) usedWordsRef.current[cid] = new Set();
    const used = usedWordsRef.current[cid] || new Set();
    const newTargets = buildTargets(cid, lv, used);
    setCatId(cid);
    setLevel(lv);
    setTargets(newTargets);
    setActiveIdx(0);
    setHints(3);
    setHintWord(null);
    setShowPts(false);
  }, []);

  const changeCategory = (id) => {
    startLevel(id, 1, true);
    setScore(0);
  };

  const nextLevel = () => {
    // Topilgan so'zlarni usedWords ga qo'shish
    targets.forEach(t => {
      if (!usedWordsRef.current[catId]) usedWordsRef.current[catId] = new Set();
      usedWordsRef.current[catId].add(t.word);
    });
    startLevel(catId, level + 1, true);
  };

  const setActive = (i) => { if (!targets[i]?.found) setActiveIdx(i); };

  const selectLetter = (wi, lid) => {
    setTargets(prev => prev.map((t, i) => {
      if (i !== wi) return t;
      if (t.found || t.status === "correct" || t.status === "wrong") return t;
      const idx = t.selected.findIndex(s => s.id === lid);
      const selected = idx >= 0
        ? t.selected.slice(0, idx)
        : [...t.selected, t.letters.find(l => l.id === lid)].filter(Boolean);
      return { ...t, selected, status: "idle" };
    }));
  };

  const submitWord = (wi) => {
    setTargets(prev => {
      const t = prev[wi];
      if (!t || t.found) return prev;
      const typed = t.selected.map(s => s.letter).join("");
      if (!typed) return prev;

      if (typed === t.word) {
        // Qiyinlikka qarab ball: d1=10, d2=15, d3=20 + uzunlik bonusi
        const diffBonus = { 1: 10, 2: 15, 3: 20 }[t.diff] || 10;
        const pts = t.word.length * diffBonus + (t.word.length > 6 ? 30 : 0);
        setScore(s => s + pts);
        setCatScores(cs => ({ ...cs, [catId]: (cs[catId] || 0) + pts }));
        setLastPts(pts);
        setShowPts(true);
        const next = prev.findIndex((tt, i) => !tt.found && i !== wi);
        if (next >= 0) setActiveIdx(next);
        clearTimeout(timers.current[wi]);
        timers.current[wi] = setTimeout(() => {
          setShowPts(false);
          setTargets(p => p.map((tt, i) => i === wi ? { ...tt, status: "idle" } : tt));
        }, 900);
        return prev.map((tt, i) =>
          i === wi ? { ...tt, found: true, selected: [], status: "correct" } : tt
        );
      } else {
        clearTimeout(timers.current[wi]);
        timers.current[wi] = setTimeout(() => {
          setTargets(p => p.map((tt, i) =>
            i === wi ? { ...tt, status: "idle", selected: [] } : tt
          ));
        }, 700);
        return prev.map((tt, i) =>
          i === wi ? { ...tt, status: "wrong" } : tt
        );
      }
    });
  };

  const doBack    = wi => setTargets(prev => prev.map((t, i) => i === wi && !t.found ? { ...t, selected: t.selected.slice(0, -1) } : t));
  const doClear   = wi => setTargets(prev => prev.map((t, i) => i === wi && !t.found ? { ...t, selected: [], status: "idle" } : t));
  const doShuffle = wi => setTargets(prev => prev.map((t, i) => i === wi && !t.found ? { ...t, letters: shuffleArray([...t.letters]) } : t));

  const useHint = () => {
    if (hints <= 0) return;
    const u = targets.find(t => !t.found);
    if (!u) return;
    setHintWord(u);
    setHints(h => h - 1);
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
// DIFFICULTY BADGE
// ═══════════════════════════════════════════════════════════════
const DiffBadge = ({ diff }) => {
  const cfg = {
    1: { label: "Oson",  bg: "#DCFCE7", color: "#166534" },
    2: { label: "O'rta", bg: "#FEF9C3", color: "#854D0E" },
    3: { label: "Qiyin", bg: "#FEE2E2", color: "#991B1B" },
  }[diff] || { label: "", bg: "#F4F4F5", color: "#888" };
  return (
    <span style={{ fontSize: 9, fontWeight: 800, background: cfg.bg, color: cfg.color, borderRadius: 5, padding: "1px 5px", flexShrink: 0 }}>
      {cfg.label}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

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

  const scroll = dir => { if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 130, behavior: "smooth" }); };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
      {canLeft && <button onClick={() => scroll(-1)} style={arrowBtnStyle}>‹</button>}
      <div ref={scrollRef} style={{ display: "flex", gap: 6, overflowX: "auto", flex: 1, scrollbarWidth: "none", padding: "2px 0 4px" }}>
        {CATEGORIES.map(c => {
          const on  = c.id === active;
          const pts = catScores[c.id] || 0;
          return (
            <button key={c.id} onClick={() => onChange(c.id)} style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
              padding: "7px 12px", borderRadius: 10,
              background: on ? c.color : "rgba(0,0,0,0.05)",
              border: on ? `2px solid ${c.color}` : "2px solid transparent",
              color: on ? "#fff" : "#555",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
              <span style={{ fontSize: 14 }}>{c.icon}</span>
              <span>{c.label}</span>
              {pts > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, background: on ? "rgba(255,255,255,0.25)" : c.light, color: on ? "#fff" : c.dark, borderRadius: 6, padding: "1px 5px" }}>
                  {pts}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {canRight && <button onClick={() => scroll(1)} style={arrowBtnStyle}>›</button>}
    </div>
  );
};

const arrowBtnStyle = {
  flexShrink: 0, width: 28, height: 28, borderRadius: 8,
  background: "rgba(0,0,0,0.06)", border: "none",
  fontSize: 18, fontWeight: 700, cursor: "pointer", color: "#555",
  display: "flex", alignItems: "center", justifyContent: "center",
};

/* ── Word Row ── */
const WordRow = ({ target, idx, cat, hintWord, isActive, onSetActive }) => {
  const isFound  = target.found;
  const isHinted = hintWord?.word === target.word && !isFound;
  const cellSize = target.word.length <= 6 ? 30 : target.word.length <= 9 ? 25 : 21;
  const fontSize = target.word.length <= 6 ? 13 : target.word.length <= 9 ? 11 : 9;

  return (
    <div
      onClick={() => !isFound && onSetActive(idx)}
      style={{
        display: "flex", flexDirection: "column", gap: 5,
        padding: "8px 10px", borderRadius: 10,
        background: isActive && !isFound ? `${cat.color}08` : "transparent",
        border: isActive && !isFound ? `1px solid ${cat.color}30` : "1px solid transparent",
        cursor: isFound ? "default" : "pointer",
        transition: "all 0.15s",
      }}
    >
      {/* Qator 1: raqam + katakchalar + ✓ */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 16, fontSize: 11, fontWeight: 700, flexShrink: 0, color: isFound ? cat.color : isActive ? cat.color : "#BBB", textAlign: "right" }}>
          {idx + 1}.
        </span>
        <div style={{ display: "flex", gap: 3 }}>
          {target.word.split("").map((ch, ci) => {
            const showFirst = isHinted && ci === 0;
            return (
              <div key={ci} style={{
                width: cellSize, height: cellSize + 2, borderRadius: 6, flexShrink: 0,
                background: isFound ? cat.color : showFirst ? "#FEF3C7" : "#F4F4F5",
                border: isFound ? `2px solid ${cat.color}` : showFirst ? "2px solid #F59E0B" : "2px dashed #D4D4D8",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize, fontWeight: 800,
                color: isFound ? "#fff" : showFirst ? "#92400E" : "transparent",
                transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                transform: isFound ? "scale(1.04)" : "scale(1)",
              }}>
                {isFound ? ch : showFirst ? target.word[0] : ""}
              </div>
            );
          })}
        </div>
        {isFound && <span style={{ fontSize: 14, color: cat.color, flexShrink: 0, marginLeft: "auto" }}>✓</span>}
      </div>

      {/* Qator 2: harf soni + qiyinlik + FAOL + hint */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, paddingLeft: 22, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, flexShrink: 0,
          color: isFound ? cat.dark : isActive ? cat.dark : "#A1A1AA",
          background: isFound ? cat.light : isActive ? cat.light : "#F4F4F5",
          borderRadius: 6, padding: "2px 7px",
          border: isFound || isActive ? `1px solid ${cat.color}30` : "1px solid transparent",
          whiteSpace: "nowrap",
        }}>
          {target.word.length} harf
        </span>
        <DiffBadge diff={target.diff} />
        {isActive && !isFound && (
          <span style={{ fontSize: 9, fontWeight: 800, flexShrink: 0, color: cat.color, background: cat.light, borderRadius: 5, padding: "2px 6px", border: `1px solid ${cat.color}30`, whiteSpace: "nowrap" }}>
            FAOL
          </span>
        )}
        {isHinted && !isFound && (
          <span title={target.hint} style={{ fontSize: 10, color: "#92400E", fontWeight: 600, background: "#FEF3C7", borderRadius: 6, padding: "2px 8px", border: "1px solid #FDE68A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flex: 1 }}>
            💡 {target.hint}
          </span>
        )}
      </div>
    </div>
  );
};

/* ── Letter Circle ── */
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
      pos[id] = { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
    });
    setPositions(pos);
  }, [letters, count, radius]);

  const selectedIds = new Set(selected.map(s => s.id));
  if (found) return null;

  return (
    <div style={{ position: "relative", width: 280, height: 280, margin: "0 auto" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {selected.map((s, i) => {
          if (i === 0) return null;
          const a = positions[selected[i - 1].id];
          const b = positions[s.id];
          if (!a || !b) return null;
          return <line key={`line-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={cat.color} strokeWidth={3} strokeLinecap="round" strokeOpacity={0.6} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: CX - 7, top: CY - 7, width: 14, height: 14, borderRadius: "50%", background: `${cat.color}20`, border: `2px solid ${cat.color}40` }} />
      {letters.map(({ letter, id }) => {
        const pos = positions[id];
        if (!pos) return null;
        const isSel   = selectedIds.has(id);
        const order   = selected.findIndex(s => s.id === id) + 1;
        const isWrong = status === "wrong" && isSel;
        return (
          <button key={id} onClick={e => { e.stopPropagation(); onSelect(wordIdx, id); }} style={{
            position: "absolute", left: pos.x - 26, top: pos.y - 26,
            width: 52, height: 52, borderRadius: "50%",
            border: isSel ? `2.5px solid ${cat.color}` : "2px solid rgba(0,0,0,0.1)",
            background: isSel ? cat.color : "#FFFFFF",
            color: isSel ? "#fff" : "#1A1A1A",
            fontSize: 17, fontWeight: 800, fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", zIndex: 2,
            boxShadow: isSel ? `0 3px 14px ${cat.color}50` : "0 2px 8px rgba(0,0,0,0.09)",
            transform: isSel ? "scale(1.12)" : "scale(1)",
            transition: "all 0.15s cubic-bezier(0.34,1.56,0.64,1)",
            animation: isWrong ? "shake 0.35s ease" : "none",
          }}>
            {letter}
            {isSel && (
              <span style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "#111", color: "#fff", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff" }}>
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
  const word = selected.map(s => s.letter).join("");
  const sMap = {
    correct: { bg: cat.color, border: cat.color,  text: "#fff"    },
    wrong:   { bg: "#FEF2F2", border: "#EF4444",  text: "#DC2626" },
    idle:    { bg: "#F4F4F5", border: "#E4E4E7",  text: "#1A1A1A" },
  };
  const s   = sMap[status] || sMap.idle;
  const msg = { correct: "✓ To'g'ri!", wrong: "✗ Noto'g'ri" }[status];

  return (
    <div style={{ minHeight: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {word ? (
        <div style={{ display: "flex", gap: 4, position: "relative", flexWrap: "wrap", justifyContent: "center", animation: status === "wrong" ? "shake 0.35s ease" : status === "correct" ? "popIn 0.3s ease" : "none" }}>
          {word.split("").map((ch, i) => (
            <div key={i} style={{ minWidth: 36, height: 42, borderRadius: 9, padding: "0 4px", background: s.bg, border: `2px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: s.text, transition: "all 0.16s" }}>
              {ch}
            </div>
          ))}
          {showPts && (
            <div style={{ position: "absolute", top: -20, right: -8, fontSize: 14, fontWeight: 800, color: "#16A34A", animation: "floatUp 1.2s ease forwards", pointerEvents: "none" }}>
              +{lastPts}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "#A1A1AA", fontWeight: 600, letterSpacing: "0.04em" }}>Harflarni tanlang...</div>
      )}
      {msg && <div style={{ fontSize: 12, fontWeight: 700, color: status === "correct" ? cat.dark : s.text, animation: "fadeIn 0.15s ease" }}>{msg}</div>}
    </div>
  );
};

/* ── Hint Panel ── */
const HintPanel = ({ hints, hintWord, cat, onUseHint }) => (
  <div style={{ background: "#FAFAFA", borderRadius: 12, border: "1px solid #E4E4E7", padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 16, marginTop: 1 }}>💡</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Yordamchi</div>
        {hintWord
          ? <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600, marginTop: 2 }}>{hintWord.hint}</div>
          : <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>So'z topishda yordam</div>}
      </div>
    </div>
    <button onClick={onUseHint} disabled={hints <= 0} style={{
      flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
      padding: "7px 14px", borderRadius: 9,
      background: hints > 0 ? "#FEF3C7" : "#F4F4F5",
      border: hints > 0 ? "1.5px solid #FCD34D" : "1.5px solid #E4E4E7",
      color: hints > 0 ? "#92400E" : "#A1A1AA",
      fontSize: 13, fontWeight: 700, cursor: hints > 0 ? "pointer" : "default",
      fontFamily: "'DM Sans', sans-serif", opacity: hints > 0 ? 1 : 0.5, transition: "all 0.15s",
    }}>
      {[0, 1, 2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: i < hints ? "#F59E0B" : "#D4D4D8" }} />)}
      <span>Hint</span>
    </button>
  </div>
);

/* ── Level Complete ── */
const LevelComplete = ({ cat, targets, score, level, onNext, playerName }) => {
  useEffect(() => {
    if (playerName) addToLeaderboard(playerName, score, level, cat.id);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, borderRadius: 20, background: "rgba(255,255,255,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div style={{ fontSize: 56 }}>🏆</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>Level {level} yakunlandi!</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {targets.map(t => (
          <span key={t.word} style={{ padding: "5px 12px", borderRadius: 8, background: cat.light, color: cat.dark, border: `1.5px solid ${cat.color}40`, fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
            {t.word}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 14, color: "#6B7280", fontFamily: "'DM Sans', sans-serif" }}>
        Jami ball: <strong style={{ color: "#111" }}>{score}</strong>
      </div>
      <button onClick={onNext} style={{ padding: "13px 30px", borderRadius: 12, background: cat.color, color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        Keyingi level →
      </button>
    </div>
  );
};

/* ── Found Words ── */
const FoundWords = ({ targets, cat }) => {
  const found = targets.filter(t => t.found);
  if (!found.length) return null;
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.07)", padding: "14px 16px", marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        Topilgan so'zlar — {found.length} ta
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {found.map(t => (
          <div key={t.word} style={{ padding: "5px 12px", borderRadius: 8, background: cat.light, color: cat.dark, border: `1.5px solid ${cat.color}30`, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", animation: "fadeIn 0.2s ease" }}>
            {t.word}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Leaderboard ── */
const MEDAL = ["🥇", "🥈", "🥉"];
const CAT_ICON = Object.fromEntries(CATEGORIES.map(c => [c.id, c.icon]));

const Leaderboard = ({ onClose, currentScore, playerName }) => {
  const entries = loadLeaderboard();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "20px 20px 0 0",
        width: "100%", maxWidth: 480, maxHeight: "75vh",
        padding: "20px 16px 32px", overflowY: "auto",
        animation: "slideUp 0.28s cubic-bezier(0.34,1.2,0.64,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>🏆 Reyting jadvali</div>
          <button onClick={onClose} style={{ background: "#F4F4F5", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: "#555" }}>✕</button>
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: "center", color: "#A1A1AA", fontSize: 14, padding: "32px 0" }}>
            Hali natija yo'q. O'ynab ko'ring!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {entries.map((e, i) => {
              const isMe = e.name === playerName;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 12,
                  background: isMe ? "#EDE9FE" : i % 2 === 0 ? "#FAFAFA" : "#fff",
                  border: isMe ? "1.5px solid #7C3AED40" : "1px solid #F4F4F5",
                }}>
                  <span style={{ fontSize: i < 3 ? 22 : 13, fontWeight: 800, width: 28, textAlign: "center", flexShrink: 0, color: i < 3 ? undefined : "#A1A1AA" }}>
                    {i < 3 ? MEDAL[i] : `${i + 1}.`}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isMe ? "#5B21B6" : "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.name} {isMe && <span style={{ fontSize: 10, background: "#7C3AED", color: "#fff", borderRadius: 5, padding: "1px 6px", marginLeft: 4 }}>Siz</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 1 }}>
                      {CAT_ICON[e.catId] || ""} Level {e.level} · {new Date(e.date).toLocaleDateString("uz-UZ")}
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#7C3AED", flexShrink: 0 }}>
                    {e.score}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {currentScore > 0 && (
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0", fontSize: 13, color: "#166534", fontWeight: 600, textAlign: "center" }}>
            Sizning joriy ballingiz: <strong>{currentScore}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Player Name Screen ── */
const NameScreen = ({ onStart }) => {
  const [name, setName] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", background: "linear-gradient(160deg, #EDE9FE 0%, #FAFAFA 55%, #F8FAFC 100%)" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎮</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 8, letterSpacing: "-0.02em", textAlign: "center" }}>So'z O'yini</div>
      <div style={{ fontSize: 14, color: "#A1A1AA", marginBottom: 32, textAlign: "center" }}>So'zlarni topib, reyting jadvali o'rnini egalla!</div>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Ismingizni kiriting</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && onStart(name.trim())}
          placeholder="Masalan: Sardor"
          maxLength={20}
          style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "2px solid #E4E4E7", fontSize: 15, fontWeight: 600, outline: "none", fontFamily: "'DM Sans', sans-serif", marginBottom: 12, color: "#111" }}
        />
        <button
          onClick={() => name.trim() && onStart(name.trim())}
          disabled={!name.trim()}
          style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: name.trim() ? "#7C3AED" : "#E4E4E7", color: name.trim() ? "#fff" : "#A1A1AA", fontSize: 15, fontWeight: 700, cursor: name.trim() ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif", transition: "all 0.18s" }}
        >
          O'yinni boshlash →
        </button>
        <button
          onClick={() => onStart("Mehmon")}
          style={{ width: "100%", marginTop: 8, padding: "10px", borderRadius: 12, border: "1.5px solid #E4E4E7", background: "transparent", color: "#A1A1AA", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
        >
          Mehmon sifatida kirish
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function WordGame() {
  const [playerName,     setPlayerName]     = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (!playerName) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { display: none; }
          @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
        <NameScreen onStart={name => setPlayerName(name)} />
      </>
    );
  }

  return <Game playerName={playerName} onShowLeaderboard={() => setShowLeaderboard(true)} showLeaderboard={showLeaderboard} onCloseLeaderboard={() => setShowLeaderboard(false)} />;
}

function Game({ playerName, onShowLeaderboard, showLeaderboard, onCloseLeaderboard }) {
  const g = useGame(playerName);
  if (!g.cat) return null;
  const { cat } = g;

  const activeTarget = g.targets[g.activeIdx];
  const canSubmit = !!activeTarget && !activeTarget.found && activeTarget.selected.length > 0 && activeTarget.status !== "correct" && activeTarget.status !== "wrong";
  const foundCount = g.targets.filter(t => t.found).length;

  // Qiyinlik darajasi label
  const diffLabel = { 1: "⭐ Boshlang'ich", 2: "⭐⭐ O'rta", 3: "⭐⭐⭐ Murakkab" };
  const diffs = getDifficultyForLevel(g.level);
  const levelDiff = diffs[diffs.length - 1];

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${cat.light} 0%, #FAFAFA 55%, #F8FAFC 100%)`, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes popIn { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-38px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {showLeaderboard && <Leaderboard onClose={onCloseLeaderboard} currentScore={g.score} playerName={playerName} />}

      <div style={{ padding: "18px 14px 80px" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>So'z O'yini</div>
            <div style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 500, marginTop: 1 }}>
              {cat.icon} {cat.label} · Level {g.level} · {diffLabel[levelDiff]}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{ background: cat.color, color: "#fff", borderRadius: 10, padding: "6px 14px", fontSize: 15, fontWeight: 800 }}>
              {g.score} ball
            </div>
            <button onClick={onShowLeaderboard} style={{ fontSize: 11, fontWeight: 700, color: cat.dark, background: cat.light, border: `1px solid ${cat.color}30`, borderRadius: 7, padding: "3px 10px", cursor: "pointer" }}>
              🏆 Reyting
            </button>
          </div>
        </div>

        {/* ── PLAYER BADGE ── */}
        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: cat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {playerName[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{playerName}</span>
          <span style={{ fontSize: 11, color: "#A1A1AA" }}>·</span>
          <span style={{ fontSize: 11, color: "#A1A1AA" }}>Level {g.level}</span>
        </div>

        {/* ── CATEGORY BAR ── */}
        <div style={{ marginBottom: 14 }}>
          <CategoryBar active={g.catId} onChange={g.changeCategory} catScores={g.catScores} />
        </div>

        {/* ── GAME CARD ── */}
        <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${cat.color}20`, boxShadow: "0 2px 24px rgba(0,0,0,0.07)", padding: "20px 16px", position: "relative", overflow: "hidden" }}>
          {g.allFound && <LevelComplete cat={cat} targets={g.targets} score={g.score} level={g.level} onNext={g.nextLevel} playerName={playerName} />}

          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 5, background: "#F4F4F5", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${g.targets.length ? (foundCount / g.targets.length) * 100 : 0}%`, height: "100%", background: cat.color, borderRadius: 99, transition: "width 0.4s ease" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#71717A", whiteSpace: "nowrap" }}>{foundCount} / {g.targets.length}</span>
          </div>

          {/* Word slots */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, padding: "12px 10px", background: "#FAFAFA", borderRadius: 14, border: "1px solid #F4F4F5" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              So'zni bosib tanlang · harflarni to'g'irla
            </div>
            {g.targets.map((t, i) => (
              <WordRow key={`${t.word}-${i}`} target={t} idx={i} cat={cat} hintWord={g.hintWord} isActive={i === g.activeIdx && !t.found} onSetActive={g.setActive} />
            ))}
          </div>

          {/* Hint */}
          <div style={{ marginBottom: 14 }}>
            <HintPanel hints={g.hints} hintWord={g.hintWord} cat={cat} onUseHint={g.useHint} />
          </div>

          {/* Word preview */}
          {activeTarget && !activeTarget.found && (
            <div style={{ marginBottom: 8 }}>
              <WordPreview target={activeTarget} cat={cat} lastPts={g.lastPts} showPts={g.showPts} />
            </div>
          )}

          {/* Letter circle */}
          {activeTarget && !activeTarget.found && (
            <LetterCircle target={activeTarget} wordIdx={g.activeIdx} cat={cat} onSelect={g.selectLetter} />
          )}

          {/* Actions */}
          {activeTarget && !activeTarget.found && (
            <>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {[
                  { label: "🔀 Aralashtir", onClick: () => g.doShuffle(g.activeIdx), disabled: false, s: { background: "#EFF6FF", border: "1.5px solid #BFDBFE", color: "#1D4ED8" } },
                  { label: "⌫ O'chir",     onClick: () => g.doBack(g.activeIdx),    disabled: !activeTarget.selected.length, s: { background: "#F4F4F5", border: "1.5px solid #E4E4E7", color: "#374151" } },
                  { label: "✕ Tozala",     onClick: () => g.doClear(g.activeIdx),   disabled: !activeTarget.selected.length, s: { background: "#FFF1F2", border: "1.5px solid #FECDD3", color: "#BE123C" } },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled} style={{ flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: btn.disabled ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: btn.disabled ? 0.4 : 1, transition: "all 0.15s", ...btn.s }}>
                    {btn.label}
                  </button>
                ))}
              </div>
              <button onClick={() => g.submitWord(g.activeIdx)} disabled={!canSubmit} style={{ width: "100%", marginTop: 10, padding: "13px", borderRadius: 12, border: "none", cursor: canSubmit ? "pointer" : "default", background: canSubmit ? cat.color : "#E4E4E7", color: canSubmit ? "#fff" : "#A1A1AA", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", transition: "all 0.18s", opacity: canSubmit ? 1 : 0.55 }}>
                Tekshirish ✓
              </button>
            </>
          )}
        </div>

        <FoundWords targets={g.targets} cat={cat} />
      </div>
    </div>
  );
}
