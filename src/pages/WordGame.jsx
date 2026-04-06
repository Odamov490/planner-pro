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
  { word: "MUSHUK", hint: "Uy hayvoni, miyovlaydi" },
  { word: "SIGIR", hint: "Sut beruvchi hayvon" },
  { word: "TOVUQ", hint: "Tuxum qo'yadi" },
  { word: "QUYON", hint: "Uzun quloqlari bor" },
  { word: "BALIQ", hint: "Suvda yashaydi" },
  { word: "KUCHUK", hint: "Itning bolasi" },
  { word: "AYIQ", hint: "O'rmonda yashaydi" },
  { word: "TULKI", hint: "Ayyor, qizil hayvon" },
  { word: "ESHAK", hint: "Yuklarni tashiydi" },
  { word: "OT", hint: "Minib yuriladi" },
  { word: "ECHKI", hint: "Tog'da yashaydi, sut beradi" },

  { word: "IT", hint: "Sodiq uy hayvoni" },
  { word: "BO'RI", hint: "Yirtqich, o‘rmonda yashaydi" },
  { word: "SHER", hint: "Hayvonlar qiroli" },
  { word: "YO'LBARS", hint: "Chiziqli yirtqich" },
  { word: "FIL", hint: "Uzun burni bor katta hayvon" },
  { word: "TUYA", hint: "Cho‘lda yashaydi, o‘rkachli" },
  { word: "ECHKICH", hint: "Echkining bolasi" },
  { word: "XO'ROZ", hint: "Tongda qichqiradi" },
  { word: "QARG'A", hint: "Qora qush, ovozi baland" },
  { word: "BURGUT", hint: "Katta yirtqich qush" },

  { word: "KABUTAR", hint: "Tinchlik ramzi bo‘lgan qush" },
  { word: "LAYLAK", hint: "Uzun oyoqli qush" },
  { word: "QUSH", hint: "Uchadigan jonivor" },
  { word: "TO'TI", hint: "Gapirishni o‘rganadi" },
  { word: "CHUMCHUQ", hint: "Kichik qush" },
  { word: "QALDIRGOCH", hint: "Bahorda keladi" },
  { word: "PINGVIN", hint: "Ucha olmaydi, muzda yashaydi" },
  { word: "KAPALAK", hint: "Rangli hasharot" },
  { word: "ARI", hint: "Asal qiladi" },
  { word: "CHIVIN", hint: "Qon so‘ruvchi hasharot" },

  { word: "PASHSHA", hint: "Uyda uchib yuradi" },
  { word: "QURBAQA", hint: "Suvda va quruqlikda yashaydi" },
  { word: "ILON", hint: "Sudralib yuradi" },
  { word: "KALTakesak", hint: "Quyoshda isinadi" },
  { word: "TIMSOH", hint: "Suvda yashovchi yirtqich" },
  { word: "AKULA", hint: "Dengiz yirtqichi" },
  { word: "KIT", hint: "Eng katta suv hayvoni" },
  { word: "DELFIN", hint: "Aqlli dengiz hayvoni" },
  { word: "MEDUZA", hint: "Jelga o‘xshash dengiz jonzoti" },
  { word: "QISQICHBAQA", hint: "Yon yuradi" },

  { word: "OTBOQI", hint: "Otga qarovchi" },
  { word: "MOL", hint: "Uy hayvoni umumiy nomi" },
  { word: "BUZOQ", hint: "Sigirning bolasi" },
  { word: "QO'Y", hint: "Jun beradi" },
  { word: "QO'ZICHOQ", hint: "Qo‘yning bolasi" },
  { word: "BO'RIBOSAR", hint: "Kuchli it zoti" },
  { word: "MUSHUKCHA", hint: "Mushukning bolasi" },
  { word: "KUCHUKCHA", hint: "Itning kichigi" },
  { word: "TO'NG'IZ", hint: "Yovvoyi cho‘chqa" },
  { word: "CHO'CHQA", hint: "Uy hayvoni, go‘shti bor" },

  { word: "QOPLON", hint: "Tez yuguruvchi yirtqich" },
  { word: "GEPA", hint: "Eng tez yuguradigan hayvon" },
  { word: "ZEBRA", hint: "Chiziqli otga o‘xshash" },
  { word: "KENGURU", hint: "Sakrash orqali yuradi" },
  { word: "KOALA", hint: "Daraxtda yashaydi" },
  { word: "PANDA", hint: "Oq-qora ayiq" },
  { word: "LEOPARD", hint: "Dog‘li yirtqich" },
  { word: "YAGUAR", hint: "O‘rmon yirtqichi" },
  { word: "BUG'U", hint: "Shoxli hayvon" },
  { word: "LOS", hint: "Katta bug‘u turi" },

  { word: "KALAMUSH", hint: "Kichik kemiruvchi" },
  { word: "SICHQON", hint: "Uyda yashovchi kemiruvchi" },
  { word: "TIPRATIKAN", hint: "Ignali hayvon" },
  { word: "KIRPI", hint: "O‘zini yumaloq qiladi" },
  { word: "SUVSAR", hint: "Suv yaqinida yashaydi" },
  { word: "BO'RIBOLA", hint: "Bo‘rining bolasi" },
  { word: "AYIQCHA", hint: "Ayiqning bolasi" },
  { word: "TULKICHA", hint: "Tulkining bolasi" },
  { word: "MOLBOQAR", hint: "Mol boqadi" },
  { word: "CHO'PON", hint: "Qo‘y boqadi" },

  { word: "BURGUTCHA", hint: "Burgutning bolasi" },
  { word: "QARG'ACHA", hint: "Qarg‘aning bolasi" },
  { word: "XO'ROZCHA", hint: "Xo‘roz bolasi" },
  { word: "JO'JA", hint: "Tovuq bolasi" },
  { word: "TO'TIQUSH", hint: "Rangli gapiruvchi qush" },
  { word: "QUSHCHA", hint: "Kichik qush" },
  { word: "QALDIRGOCHCHA", hint: "Qaldirg‘och bolasi" },
  { word: "KABUTARCHA", hint: "Kabutar bolasi" },
  { word: "BALIQCHA", hint: "Kichik baliq" },
  { word: "AKULACHA", hint: "Akula bolasi" },

  { word: "TIMSOHCHA", hint: "Timsoh bolasi" },
  { word: "ILONGA", hint: "Sudraluvchi" },
  { word: "QURBAQACHA", hint: "Qurbaqa bolasi" },
  { word: "ARIQURT", hint: "Asal arisi lichinkasi" },
  { word: "KAPALAKCHA", hint: "Kapalak bolasi" },
  { word: "CHIVINCHA", hint: "Chivin bolasi" },
  { word: "PASHSHACHA", hint: "Pashsha bolasi" },
  { word: "QISQICHBAQACHA", hint: "Kichik qisqichbaqa" },
  { word: "MEDUZACHA", hint: "Kichik meduza" },
  { word: "DELFINCHA", hint: "Delfin bolasi" },
],
food: [
  { word: "NON", hint: "Kundalik oziq" },
  { word: "GURUCH", hint: "Osh uchun kerak" },
  { word: "SABZI", hint: "Qizil ildiz sabzavot" },
  { word: "TUXUM", hint: "Tovuq qo'yadi" },
  { word: "PIYOZ", hint: "Ko'z yoshlatadi" },
  { word: "QOVUN", hint: "Yozgi shirin meva" },
  { word: "GILOS", hint: "Qizil kichik meva" },
  { word: "OLMA", hint: "Har kuni bir dona" },
  { word: "LIMON", hint: "Nordon va sariq" },
  { word: "BODRING", hint: "Yashil va uzunchoq" },

  { word: "KARTOSHKA", hint: "Qovurib yeyiladi" },
  { word: "POMIDOR", hint: "Qizil sabzavot" },
  { word: "KARAM", hint: "Bargli sabzavot" },
  { word: "BAQLAJON", hint: "To‘q binafsha sabzavot" },
  { word: "QALAMPIR", hint: "Achchiq yoki shirin bo‘ladi" },
  { word: "SARIMSOQ", hint: "Hidi kuchli" },
  { word: "REDISKA", hint: "Kichik achchiq ildiz" },
  { word: "LAGMON", hint: "Cho‘zma ovqat" },
  { word: "OSHI", hint: "Milliy taom" },
  { word: "SHORVA", hint: "Suyuq ovqat" },

  { word: "MANTI", hint: "Bug‘da pishiriladi" },
  { word: "SOMSA", hint: "Tandirda pishadi" },
  { word: "PALOV", hint: "Mashhur o‘zbek taomi" },
  { word: "MAKARON", hint: "Un mahsuloti" },
  { word: "SPAGETTI", hint: "Uzun makaron turi" },
  { word: "PIZZA", hint: "Italiya taomi" },
  { word: "BURGER", hint: "Go‘shtli sendvich" },
  { word: "SENDVICH", hint: "Non orasida ovqat" },
  { word: "HOTDOG", hint: "Kolbasa bilan" },
  { word: "SHASHLIK", hint: "Go‘sht kabobi" },

  { word: "KABOB", hint: "Olovda pishadi" },
  { word: "QATIQ", hint: "Sut mahsuloti" },
  { word: "SUT", hint: "Oq ichimlik" },
  { word: "PISHLOQ", hint: "Sutdan tayyorlanadi" },
  { word: "SMETANA", hint: "Qaymoqsimon mahsulot" },
  { word: "YOG'", hint: "Ovqat pishirishda ishlatiladi" },
  { word: "MAYONEZ", hint: "Sous turi" },
  { word: "KETCHUP", hint: "Pomidorli sous" },
  { word: "ASAL", hint: "Arilar tayyorlaydi" },
  { word: "SHOKOLAD", hint: "Shirinlik" },

  { word: "KONFET", hint: "Bolalar yaxshi ko‘radi" },
  { word: "TORT", hint: "Bayram shirinligi" },
  { word: "PIROG", hint: "Ichiga narsa solib pishiriladi" },
  { word: "PECHENYE", hint: "Quruq shirinlik" },
  { word: "MUZQAYMOQ", hint: "Sovuq shirinlik" },
  { word: "SHARBAT", hint: "Meva ichimligi" },
  { word: "CHAY", hint: "Issiq ichimlik" },
  { word: "KOFE", hint: "Qahva ichimligi" },
  { word: "SUv", hint: "Hayot manbai" },
  { word: "KOLA", hint: "Gazli ichimlik" },

  { word: "FANTA", hint: "Apelsinli ichimlik" },
  { word: "SOK", hint: "Meva sharbati" },
  { word: "BANAN", hint: "Sariq meva" },
  { word: "APELSIN", hint: "C vitamini ko‘p" },
  { word: "MANDARIN", hint: "Qishda ko‘p yeyiladi" },
  { word: "ANOR", hint: "Donali meva" },
  { word: "UZUM", hint: "Shirin mayda meva" },
  { word: "NOK", hint: "Yumshoq meva" },
  { word: "SHAFTOLI", hint: "Yozgi meva" },
  { word: "OLXO'RI", hint: "Ko‘k yoki binafsha meva" },

  { word: "TARVUZ", hint: "Ichida urug‘i bor katta meva" },
  { word: "KIVI", hint: "Ichki yashil meva" },
  { word: "ANANAS", hint: "Tropik meva" },
  { word: "MANGO", hint: "Shirin sariq meva" },
  { word: "QULUPNAY", hint: "Qizil mayda meva" },
  { word: "MALINA", hint: "Yumshoq qizil meva" },
  { word: "SMORODINA", hint: "Qora mayda meva" },
  { word: "QOVOQ", hint: "Katta sabzavot" },
  { word: "NOXAT", hint: "Dukkakli mahsulot" },
  { word: "LOVIYA", hint: "Dukkakli ozuqa" },

  { word: "MASH", hint: "Yashil dukkakli" },
  { word: "GURUCHOSHI", hint: "Guruchdan ovqat" },
  { word: "DIMLAMA", hint: "Sabzavotli taom" },
  { word: "HONIM", hint: "Bug‘da pishiriladi" },
  { word: "QOVURMA", hint: "Qovurib tayyorlanadi" },
  { word: "TOVUQ", hint: "Parranda go‘shti" },
  { word: "MOLGO'SHTI", hint: "Sigir go‘shti" },
  { word: "QO'YGO'SHTI", hint: "Qo‘y go‘shti" },
  { word: "BALIQOVQAT", hint: "Baliqdan tayyorlanadi" },
  { word: "KOLBASA", hint: "Go‘sht mahsuloti" },

  { word: "SOSISKA", hint: "Qaynatib yeyiladi" },
  { word: "JELLY", hint: "Titroq shirinlik" },
  { word: "PUDING", hint: "Yumshoq desert" },
  { word: "KREM", hint: "Tort ustiga surtiladi" },
  { word: "SIRKA", hint: "Nordon suyuqlik" },
  { word: "TUZ", hint: "Ta'm beruvchi" },
  { word: "SHKAR", hint: "Shakar noto‘g‘ri yozilgan 🙂" },
  { word: "SHAKAR", hint: "Shirinlik beradi" },
  { word: "UN", hint: "Non tayyorlashda kerak" },
  { word: "XAMIR", hint: "Pishirishdan oldin" },
],
nature: [
  { word: "DARYO", hint: "Oqar suv" },
  { word: "TOG", hint: "Baland joy, qorli choqqi" },
  { word: "GUL", hint: "Chiroyli xushboy osimlik" },
  { word: "DARAXT", hint: "Yogoch beradi" },
  { word: "TOSH", hint: "Qattiq narsa" },
  { word: "BULUT", hint: "Osmon paxtalari" },
  { word: "SHAMOL", hint: "Korinmas, yaproq uchiradi" },
  { word: "KOL", hint: "Tinch suv havzasi" },
  { word: "VODIY", hint: "Toglar orasidagi tekislik" },
  { word: "QOYA", hint: "Katta tosh" },

  { word: "DENGIZ", hint: "Katta sho‘r suv" },
  { word: "OKEAN", hint: "Eng katta suv havzasi" },
  { word: "SOY", hint: "Kichik oqar suv" },
  { word: "BULOQ", hint: "Toza suv chiqadigan joy" },
  { word: "KO'LMA", hint: "Kichik suv yig‘ilgan joy" },
  { word: "QUM", hint: "Cho‘lda uchraydi" },
  { word: "CHO'L", hint: "Quruq hudud" },
  { word: "MAYDON", hint: "Keng ochiq joy" },
  { word: "DALA", hint: "Ekin ekiladigan joy" },
  { word: "O‘RMON", hint: "Ko‘p daraxtli hudud" },

  { word: "O‘TLOQ", hint: "Yashil maysa joy" },
  { word: "MAYSA", hint: "Yashil o‘tlar" },
  { word: "YAPROQ", hint: "Daraxt bargi" },
  { word: "ILDIZ", hint: "O‘simlik pastki qismi" },
  { word: "SHOX", hint: "Daraxt qo‘li" },
  { word: "POYA", hint: "O‘simlik tanasi" },
  { word: "URUG‘", hint: "O‘simlik boshlanishi" },
  { word: "MEVA", hint: "Daraxt mahsuli" },
  { word: "G‘UNCHA", hint: "Ochilmagan gul" },
  { word: "TIKAN", hint: "O‘tkir o‘simlik qismi" },

  { word: "QOR", hint: "Qishda yog‘adi" },
  { word: "YOMG‘IR", hint: "Suv tomchilari yog‘adi" },
  { word: "DO‘L", hint: "Muz donalari yog‘adi" },
  { word: "TUMAN", hint: "Ko‘rinish pasayadi" },
  { word: "SHABNAM", hint: "Ertalab suv tomchilari" },
  { word: "MOMAQALDIROQ", hint: "Yashin tovushi" },
  { word: "YASHIN", hint: "Osmon chaqnashi" },
  { word: "QUYOSH", hint: "Issiqlik manbai" },
  { word: "OY", hint: "Kecha yoritadi" },
  { word: "YULDUZ", hint: "Osmonda porlaydi" },

  { word: "UFQ", hint: "Osmon va yer tutashgan joy" },
  { word: "SOYA", hint: "Quyosh tushmagan joy" },
  { word: "ISSIQLIK", hint: "Harorat yuqori" },
  { word: "SOVUQ", hint: "Harorat past" },
  { word: "IQLIM", hint: "Hudud ob-havosi" },
  { word: "FASL", hint: "Yil bo‘linadi" },
  { word: "BAHOR", hint: "Gullar ochiladi" },
  { word: "YOZ", hint: "Issiq fasl" },
  { word: "KUZ", hint: "Barglar to‘kiladi" },
  { word: "QISH", hint: "Eng sovuq fasl" },

  { word: "QIYA", hint: "Qiyalik joy" },
  { word: "TEPALIK", hint: "Kichik balandlik" },
  { word: "JARLIK", hint: "Chuqur pastlik" },
  { word: "G‘OR", hint: "Tog ichidagi bo‘shliq" },
  { word: "QIR", hint: "Yarim baland hudud" },
  { word: "VOHA", hint: "Cho‘ldagi yashil joy" },
  { word: "BOTQOQ", hint: "Nam, loyqa yer" },
  { word: "MUZLIK", hint: "Doim muz bilan qoplangan" },
  { word: "QUTB", hint: "Yerning eng sovuq joyi" },
  { word: "OROL", hint: "Suv bilan o‘ralgan yer" },

  { word: "QIRGOQ", hint: "Suv bo‘yidagi yer" },
  { word: "PLYAJ", hint: "Qumli qirg‘oq" },
  { word: "TO‘LQIN", hint: "Suv harakati" },
  { word: "SHARSHARA", hint: "Suv balanddan tushadi" },
  { word: "IRMOQ", hint: "Kichik daryo" },
  { word: "KO‘LCHA", hint: "Kichik ko‘l" },
  { word: "TOSHLOQ", hint: "Toshli hudud" },
  { word: "QUMLOQ", hint: "Qumli hudud" },
  { word: "YAYLOV", hint: "Hayvonlar boqiladigan joy" },
  { word: "CHANG", hint: "Mayda tuproq zarrachasi" },

  { word: "TABIAT", hint: "Atrof-muhit" },
  { word: "ATMOSFERA", hint: "Yer atrofidagi havo" },
  { word: "HAVO", hint: "Nafas olamiz" },
  { word: "GAZ", hint: "Ko‘rinmas modda" },
  { word: "SUV", hint: "Hayot manbai" },
  { word: "TUPROQ", hint: "Yer qatlami" },
  { word: "MINERAL", hint: "Yer osti boyligi" },
  { word: "METALL", hint: "Qattiq modda" },
  { word: "OLTIN", hint: "Qimmatbaho metall" },
  { word: "KUMUSH", hint: "Oq metall" },
],
body: [
  { word: "QOL", hint: "5 barmoq bor" },
  { word: "KOZ", hint: "Korish organi" },
  { word: "QULOQ", hint: "Eshitish uchun" },
  { word: "BURUN", hint: "Hidlash organi" },
  { word: "TIL", hint: "Gapirish, tam bilish" },
  { word: "OYOQ", hint: "Yurish uchun" },
  { word: "BOSH", hint: "Fikrlash organi" },
  { word: "ELKA", hint: "Yelka deyiladi" },
  { word: "TIZZA", hint: "Oyoq ortasida bukiladi" },
  { word: "BARMOQ", hint: "Qolda 5 ta bor" },

  { word: "YUZ", hint: "Boshning old qismi" },
  { word: "LAB", hint: "Og‘iz cheti" },
  { word: "TISH", hint: "Ovqat chaynash uchun" },
  { word: "JAG'", hint: "Og‘iz suyak qismi" },
  { word: "MIYA", hint: "Fikrlash markazi" },
  { word: "SOCH", hint: "Boshda o‘sadi" },
  { word: "QOSH", hint: "Ko‘z ustida" },
  { word: "KIPRIK", hint: "Ko‘zni himoya qiladi" },
  { word: "PESHONA", hint: "Qosh ustidagi joy" },
  { word: "ENSa", hint: "Bosh orqa qismi" },

  { word: "BOYIN", hint: "Boshni ushlab turadi" },
  { word: "KO'KRAK", hint: "Ko‘krak qafasi" },
  { word: "YURAK", hint: "Qon haydaydi" },
  { word: "O'PKA", hint: "Nafas olish organi" },
  { word: "JIGAR", hint: "Ichki organ" },
  { word: "BUYRAK", hint: "Filtrlovchi organ" },
  { word: "OSHQOZON", hint: "Ovqat hazm qiladi" },
  { word: "ICHak", hint: "Ovqat yo‘li davomidir" },
  { word: "QON", hint: "Organizmda aylanadi" },
  { word: "TERI", hint: "Tana qoplami" },

  { word: "TIRNOQ", hint: "Barmoq uchida" },
  { word: "KAFT", hint: "Qo‘l ichki qismi" },
  { word: "BILAK", hint: "Qo‘l o‘rta qismi" },
  { word: "TIRSak", hint: "Qo‘l bukiladi" },
  { word: "YELKA", hint: "Qo‘l boshlanishi" },
  { word: "SON", hint: "Oyoq yuqori qismi" },
  { word: "BOLDIR", hint: "Oyoq pastki qismi" },
  { word: "TOVON", hint: "Oyoq orqa qismi" },
  { word: "PANJA", hint: "Oyoq old qismi" },
  { word: "TOvoncha", hint: "Kichik tovon" },

  { word: "MUSHAK", hint: "Harakat uchun kerak" },
  { word: "SUYAK", hint: "Tana tayanchi" },
  { word: "BO'G'IM", hint: "Bukiladigan joy" },
  { word: "UMURTQA", hint: "Orqa suyaklar" },
  { word: "BEL", hint: "Orqa past qismi" },
  { word: "ORQA", hint: "Tananing orqa tomoni" },
  { word: "QORIN", hint: "Old qism" },
  { word: "KINDIK", hint: "Qorin markazi" },
  { word: "CHANOQ", hint: "Pastki qism suyaklari" },
  { word: "TO'SH", hint: "Ko‘krak suyak" },

  { word: "ASAB", hint: "Signal uzatadi" },
  { word: "TOMIR", hint: "Qon yuradi" },
  { word: "Hujayra", hint: "Eng kichik birlik" },
  { word: "ORGAN", hint: "Tana qismi" },
  { word: "NAFAS", hint: "Havo olish" },
  { word: "HID", hint: "Burun sezadi" },
  { word: "TAM", hint: "Til sezadi" },
  { word: "KO'RISH", hint: "Ko‘z vazifasi" },
  { word: "ESHITISH", hint: "Quloq vazifasi" },
  { word: "HARAKAT", hint: "Mushak orqali" },

  { word: "QONAYLANISH", hint: "Qon harakati" },
  { word: "NAFASOLISH", hint: "O‘pka ishlaydi" },
  { word: "OVQATHAZM", hint: "Oshqozon jarayoni" },
  { word: "TANASOGLIGI", hint: "Sog‘lomlik holati" },
  { word: "YURISH", hint: "Oyoq bilan" },
  { word: "YUGURISH", hint: "Tez harakat" },
  { word: "OTIRISH", hint: "Dam olish" },
  { word: "TURISH", hint: "Tik holat" },
  { word: "QIMIRLASH", hint: "Harakat qilish" },
  { word: "SEZGI", hint: "His qilish" },

  { word: "TERLASH", hint: "Issiqda bo‘ladi" },
  { word: "QONBOSIM", hint: "Yurak bilan bog‘liq" },
  { word: "TANAHARORATI", hint: "Issiqlik darajasi" },
  { word: "MUTANOSIBLIK", hint: "Balans" },
  { word: "REAKSIYA", hint: "Tez javob" },
  { word: "OG'RIQ", hint: "Noqulay sezgi" },
  { word: "DAMOLISH", hint: "Tana tiklanadi" },
  { word: "UYQU", hint: "Dam olish vaqti" },
  { word: "CHARCHOQ", hint: "Kuch kamayadi" },
  { word: "QUVVAT", hint: "Energiya" },
],
home: [
  { word: "STOL", hint: "Ustida yoziladi" },
  { word: "ESHIK", hint: "Ochiladi va yopiladi" },
  { word: "DERAZA", hint: "Oynali, yorug kiradi" },
  { word: "KARAVOT", hint: "Uxlash joyi" },
  { word: "GILAM", hint: "Polga solinadi" },
  { word: "LAMPA", hint: "Xonani yoritadi" },
  { word: "IDISH", hint: "Ovqat solinadi" },
  { word: "KALIT", hint: "Qulfni ochadi" },
  { word: "QOZON", hint: "Ovqat pishiriladi" },
  { word: "SUPURGI", hint: "Pol supuriladi" },

  { word: "STUL", hint: "O‘tirish uchun" },
  { word: "DIVAN", hint: "Yumshoq o‘tirgich" },
  { word: "KRESLO", hint: "Yakka yumshoq o‘rindiq" },
  { word: "SHKAF", hint: "Kiyim saqlanadi" },
  { word: "KOMOD", hint: "Tortmali mebel" },
  { word: "POLKA", hint: "Devor javoni" },
  { word: "OYNА", hint: "O‘z aksingni ko‘rasan" },
  { word: "PARDА", hint: "Derazaga ilinadi" },
  { word: "YOSTIQ", hint: "Bosh qo‘yiladi" },
  { word: "KO'RPA", hint: "Yopiniladi" },

  { word: "CHADIR", hint: "Vaqtinchalik uy" },
  { word: "ROZETKA", hint: "Tok olinadi" },
  { word: "VILKA", hint: "Tokka ulanadi" },
  { word: "SIM", hint: "Elektr o‘tkazadi" },
  { word: "KABEL", hint: "Qalin sim" },
  { word: "UZAYTIRGICH", hint: "Simni uzaytiradi" },
  { word: "SWITCH", hint: "Chiroqni yoqadi" },
  { word: "PLITKA", hint: "Ovqat pishiriladi" },
  { word: "PECH", hint: "Issiq qiladi" },
  { word: "DUXOVKA", hint: "Ichida pishiriladi" },

  { word: "MUZLATGICH", hint: "Ovqatni sovitadi" },
  { word: "MOROZILNIK", hint: "Muzlatadi" },
  { word: "MIKROVOLNOVKA", hint: "Tez isitadi" },
  { word: "CHAYNIK", hint: "Suv qaynatadi" },
  { word: "KASTRYUL", hint: "Ovqat pishirish idishi" },
  { word: "TOVA", hint: "Qovurish uchun" },
  { word: "LAGAN", hint: "Ovqat tortiladi" },
  { word: "PIYOLA", hint: "Choy ichiladi" },
  { word: "KOSA", hint: "Sho‘rva ichiladi" },
  { word: "QOSHIQ", hint: "Ovqat yeyish uchun" },

  { word: "SANCHQI", hint: "Vilka bilan yeyiladi" },
  { word: "PICHОQ", hint: "Kesish uchun" },
  { word: "TAQSIMLAGICH", hint: "Ovqat bo‘linadi" },
  { word: "SHARBATDON", hint: "Ichimlik quyiladi" },
  { word: "KRUJKA", hint: "Issiq ichimlik uchun" },
  { word: "TERMOS", hint: "Issiqni saqlaydi" },
  { word: "BANKA", hint: "Saqlash uchun idish" },
  { word: "QOPQOQ", hint: "Yopadi" },
  { word: "CHELAK", hint: "Suv tashiladi" },
  { word: "PAQIR", hint: "Suv uchun idish" },

  { word: "SUPURGI", hint: "Tozalash uchun" },
  { word: "CHO'TKA", hint: "Artish uchun" },
  { word: "LATTA", hint: "Chang artadi" },
  { word: "SHVAbrA", hint: "Pol yuviladi" },
  { word: "CHANGYUTGICH", hint: "Chang so‘radi" },
  { word: "AXLATQUTI", hint: "Chiqindi tashlanadi" },
  { word: "SOVUN", hint: "Qo‘l yuviladi" },
  { word: "SHAMPUN", hint: "Soch yuviladi" },
  { word: "SOCHIQLIK", hint: "Quritadi" },
  { word: "TARoq", hint: "Soch taraladi" },

  { word: "KO'ZG", hint: "Aks ko‘rsatadi" },
  { word: "RASM", hint: "Devorga osiladi" },
  { word: "SOAT", hint: "Vaqt ko‘rsatadi" },
  { word: "TELEVIZOR", hint: "Ko‘rsatuvlar chiqadi" },
  { word: "PULT", hint: "Masofadan boshqaradi" },
  { word: "KOMPYUTER", hint: "Ishlash uchun texnika" },
  { word: "NOUTBUK", hint: "Ko‘chma kompyuter" },
  { word: "PRINTER", hint: "Qog‘oz chiqaradi" },
  { word: "ROUTER", hint: "Internet tarqatadi" },
  { word: "MODEM", hint: "Tarmoqqa ulaydi" },

  { word: "KONDITSIONER", hint: "Sovutadi yoki isitadi" },
  { word: "VENTILYATOR", hint: "Havo aylantiradi" },
  { word: "ISITGICH", hint: "Xonani isitadi" },
  { word: "GARDEROB", hint: "Kiyimlar uchun joy" },
  { word: "KIYIMILGICH", hint: "Kiyim osiladi" },
  { word: "ILGAK", hint: "Devorga osiladi" },
  { word: "ZANJIR", hint: "Mahkamlash uchun" },
  { word: "QULF", hint: "Yopadi" },
  { word: "SIGNALIZATSIYA", hint: "Xavfsizlik tizimi" },
  { word: "DOMOFON", hint: "Eshik orqali gaplashish" },
],
  sport: [
  { word: "TOP", hint: "Dumaloq, oyinda ishlatiladi" },
  { word: "GOL", hint: "Darvozaga kiradi" },
  { word: "YUGUR", hint: "Tez harakat qilish" },
  { word: "SUZISH", hint: "Suvda harakat" },
  { word: "KURASH", hint: "Ozbekiston milliy sporti" },
  { word: "ZARBA", hint: "Kuchli urish" },
  { word: "HAKAM", hint: "Oyinni boshqaradi" },
  { word: "RAQIB", hint: "Qarshi tomon" },
  { word: "MEDAL", hint: "Golib mukofoti" },
  { word: "CHEMPION", hint: "Birinchi orin egasi" },

  { word: "FUTBOL", hint: "Eng mashhur sport turi" },
  { word: "BASKETBOL", hint: "Halqaga to‘p tashlanadi" },
  { word: "VOLEYBOL", hint: "Tarmoq ustidan o‘ynaladi" },
  { word: "TENNIS", hint: "Raketka bilan o‘ynaladi" },
  { word: "STOLTENNIS", hint: "Kichik stol ustida" },
  { word: "BOKS", hint: "Musht bilan jang" },
  { word: "DZYUDO", hint: "Yapon jang san’ati" },
  { word: "KARATE", hint: "Sharq jang san’ati" },
  { word: "TAEKVONDO", hint: "Oyoq zarbalari ko‘p" },
  { word: "SHAXMAT", hint: "Aqliy o‘yin" },

  { word: "SHASHKA", hint: "Oddiy strategik o‘yin" },
  { word: "GIMNASTIKA", hint: "Moslashuvchanlik sporti" },
  { word: "YENGILATLETIKA", hint: "Yugurish va sakrashlar" },
  { word: "OGIRATLETIKA", hint: "Og‘irlik ko‘tarish" },
  { word: "VELOSPORT", hint: "Velosiped bilan" },
  { word: "SUZUVCHI", hint: "Suvda sportchi" },
  { word: "YUGURUVCHI", hint: "Tez yuguradi" },
  { word: "DARVOZABON", hint: "Darvozani himoya qiladi" },
  { word: "HUJUMCHI", hint: "Gol uradi" },
  { word: "HIMOYACHI", hint: "Himoya qiladi" },

  { word: "MAYDON", hint: "O‘yin joyi" },
  { word: "STADION", hint: "Katta sport joyi" },
  { word: "TRIBUNA", hint: "Tomoshabinlar joyi" },
  { word: "MASHGULOT", hint: "Tayyorlanish jarayoni" },
  { word: "MURABBIY", hint: "Sportchini o‘rgatadi" },
  { word: "JAMOA", hint: "Bir guruh sportchi" },
  { word: "UCHRASHUV", hint: "O‘yin" },
  { word: "FINAL", hint: "Oxirgi bosqich" },
  { word: "YARIMFINAL", hint: "Finaldan oldin" },
  { word: "SARALASH", hint: "Tanlab olish bosqichi" },

  { word: "REKORD", hint: "Eng yaxshi natija" },
  { word: "G‘ALABA", hint: "Yutish" },
  { word: "MAGLUBIYAT", hint: "Yutqazish" },
  { word: "DURANG", hint: "Teng hisob" },
  { word: "HISOB", hint: "Natija" },
  { word: "SONIYA", hint: "Vaqt o‘lchovi" },
  { word: "MINUT", hint: "60 soniya" },
  { word: "VAQT", hint: "O‘lchanadi" },
  { word: "BOSQICH", hint: "Daraja" },
  { word: "TURNIR", hint: "Musobaqa" },

  { word: "OLIMPIADA", hint: "Eng katta musobaqa" },
  { word: "SPORTCHI", hint: "Sport bilan shug‘ullanadi" },
  { word: "FORMА", hint: "Sport kiyimi" },
  { word: "KROSSOVKA", hint: "Sport oyoq kiyimi" },
  { word: "RAKETKA", hint: "Tennis uchun" },
  { word: "TO‘R", hint: "Voleybolda bor" },
  { word: "HALQA", hint: "Basketbolda bor" },
  { word: "DARVOZA", hint: "Futbolda bor" },
  { word: "CHIZIQ", hint: "Maydon belgisi" },
  { word: "FLAG", hint: "Yon chiziqda turadi" },

  { word: "OFsayd", hint: "Futbolda qoida buzilishi" },
  { word: "PENALTI", hint: "11 metr zarba" },
  { word: "Burchak", hint: "Corner zarbasi" },
  { word: "PAS", hint: "To‘p uzatish" },
  { word: "DRIBLING", hint: "To‘p bilan yurish" },
  { word: "SHOOT", hint: "Zarba berish" },
  { word: "SAVe", hint: "Darvozabon saqlab qoladi" },
  { word: "GOLURISH", hint: "To‘p kiritish" },
  { word: "QIZILKARTA", hint: "Maydondan chiqaradi" },
  { word: "SARIQKARTA", hint: "Ogohlantirish" },

  { word: "TURNIK", hint: "Tortilish uchun" },
  { word: "BRUSYA", hint: "Qo‘l mashqi" },
  { word: "GANTEL", hint: "Kichik og‘irlik" },
  { word: "SHTANGA", hint: "Og‘ir ko‘tariladi" },
  { word: "FITNES", hint: "Sog‘lomlashtirish sporti" },
  { word: "YOGA", hint: "Tinch mashqlar" },
  { word: "PILATES", hint: "Tana nazorati mashqi" },
  { word: "AEROBIKA", hint: "Ritmik mashqlar" },
  { word: "TRENAJOR", hint: "Mashq qurilmasi" },
  { word: "ZAL", hint: "Sport joyi" },
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

/**
 * Build letter pool preserving DUPLICATE letters.
 * MUSHUK needs M,U,S,H,U,K — two separate U tokens with unique ids.
 */
function buildLetterPool(words) {
  // Find max frequency of each letter across all words
  const freq = {};
  for (const word of words) {
    const wFreq = {};
    for (const ch of word) wFreq[ch] = (wFreq[ch] || 0) + 1;
    for (const [ch, cnt] of Object.entries(wFreq)) {
      freq[ch] = Math.max(freq[ch] || 0, cnt);
    }
  }

  // Build pool with duplicates
  const pool = [];
  for (const [ch, cnt] of Object.entries(freq)) {
    for (let i = 0; i < cnt; i++) pool.push(ch);
  }

  // Add filler letters up to 10 total
  const fillers = shuffleArray("AEIOUTLRNSBGMKDVZPQHF".split(""));
  for (const ch of fillers) {
    if (pool.length >= 10) break;
    pool.push(ch);
  }

  // Shuffle and assign unique ids
  return shuffleArray(pool).map((letter, i) => ({ letter, id: i }));
}

// ═══════════════════════════════════════════════════════════════
// GAME HOOK
// ═══════════════════════════════════════════════════════════════
function useGame() {
  const [catId,     setCatId]     = useState("animals");
  const [level,     setLevel]     = useState(1);
  const [letters,   setLetters]   = useState([]);
  const [targets,   setTargets]   = useState([]);
  const [found,     setFound]     = useState([]);
  const [selected,  setSelected]  = useState([]); // [{letter, id}]
  const [status,    setStatus]    = useState("idle");
  const [score,     setScore]     = useState(0);
  const [catScores, setCatScores] = useState({});
  const [hints,     setHints]     = useState(3);
  const [hintWord,  setHintWord]  = useState(null);
  const [lastPts,   setLastPts]   = useState(0);
  const [showPts,   setShowPts]   = useState(false);
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

  /**
   * Selecting a letter that is already selected (same id) removes from that point.
   * Different instances of same letter (different id) can both be selected.
   */
  const selectLetter = (letter, id) => {
    if (status === "correct" || status === "wrong") return;
    setSelected(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx >= 0) return prev.slice(0, idx);
      return [...prev, { letter, id }];
    });
  };

  const removeLast = () => setSelected(prev => prev.slice(0, -1));
  const clearAll   = () => { setSelected([]); setStatus("idle"); };

  const shuffleLetters = () => {
    setLetters(prev => shuffleArray([...prev]).map((item, i) => ({ ...item, id: i + Date.now() })));
  };

  const flash = (s, ms = 1300) => {
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
      setTimeout(() => setShowPts(false), 1300);
      setStatus("correct");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { setStatus("idle"); setSelected([]); }, 750);
    } else {
      flash("wrong");
      setTimeout(() => setSelected([]), 550);
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

  const allFound    = found.length === targets.length && targets.length > 0;
  const currentWord = selected.map(s => s.letter).join("");

  return {
    cat, catId, level, letters, targets, found, selected, status,
    score, catScores, hints, hintWord, lastPts, showPts, allFound, currentWord,
    changeCategory, selectLetter, removeLast, clearAll, shuffleLetters,
    submit, useHint, nextLevel,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════

/* ── Category Bar with scroll arrows ── */
const CategoryBar = ({ active, onChange, catScores }) => {
  const scrollRef = useRef(null);
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
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 130, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
      {canLeft && (
        <button onClick={() => scroll(-1)} style={arrowBtnStyle}>‹</button>
      )}
      <div ref={scrollRef} style={{
        display: "flex", gap: 6, overflowX: "auto", flex: 1,
        scrollbarWidth: "none", padding: "2px 0 4px",
      }}>
        {CATEGORIES.map(c => {
          const on  = c.id === active;
          const pts = catScores[c.id] || 0;
          return (
            <button key={c.id} onClick={() => onChange(c.id)} style={{
              flexShrink: 0,
              display: "flex", alignItems: "center", gap: 5,
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

/* ── Word Row ── */
const WordRow = ({ target, found: foundList, idx, cat, hintWord }) => {
  const isFound  = foundList.includes(target.word);
  const isHinted = hintWord?.word === target.word && !isFound;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      animation: isFound ? "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" : "none",
    }}>
      <span style={{
        width: 18, fontSize: 11, fontWeight: 700,
        color: isFound ? cat.color : "#BBB", textAlign: "right", flexShrink: 0,
      }}>{idx + 1}.</span>

      <div style={{ display: "flex", gap: 4 }}>
        {target.word.split("").map((ch, ci) => {
          const showFirst = isHinted && ci === 0;
          return (
            <div key={ci} style={{
              width: 34, height: 38, borderRadius: 8,
              background: isFound ? cat.color : showFirst ? "#FEF3C7" : "#F4F4F5",
              border: isFound
                ? `2px solid ${cat.color}`
                : showFirst ? "2px solid #F59E0B" : "2px dashed #D4D4D8",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 800,
              color: isFound ? "#fff" : showFirst ? "#92400E" : "transparent",
              transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              transform: isFound ? "scale(1.05)" : "scale(1)",
            }}>
              {isFound ? ch : showFirst ? target.word[0] : ""}
            </div>
          );
        })}
      </div>

      <span style={{
        fontSize: 11, fontWeight: 700, flexShrink: 0,
        color: isFound ? cat.dark : "#A1A1AA",
        background: isFound ? cat.light : "#F4F4F5",
        borderRadius: 6, padding: "2px 7px",
        border: isFound ? `1px solid ${cat.color}30` : "1px solid transparent",
        transition: "all 0.22s",
      }}>
        {target.word.length} harf
      </span>

      {isHinted && (
        <span style={{
          fontSize: 11, color: "#92400E", fontWeight: 600,
          background: "#FEF3C7", borderRadius: 6,
          padding: "2px 8px", border: "1px solid #FDE68A", flexShrink: 0,
        }}>
          {target.hint}
        </span>
      )}

      {isFound && (
        <span style={{ fontSize: 14, color: cat.color, flexShrink: 0 }}>✓</span>
      )}
    </div>
  );
};

/* ── Letter Circle ── */
const LetterCircle = ({ letters, selected, onSelect, cat, hintWord, found, status }) => {
  const [positions, setPositions] = useState({});
  const count  = letters.length;
  const CX = 140, CY = 140;
  const radius = count <= 7 ? 100 : count <= 9 ? 108 : 114;

  useEffect(() => {
    const pos = {};
    letters.forEach(({ id }, i) => {
      const angle = (2 * Math.PI / count) * i - Math.PI / 2;
      pos[id] = { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
    });
    setPositions(pos);
  }, [letters, count, radius]);

  const hintFirstLetter = hintWord && !found.includes(hintWord.word) ? hintWord.word[0] : null;
  const selectedIds = new Set(selected.map(s => s.id));

  return (
    <div style={{ position: "relative", width: 280, height: 280, margin: "0 auto" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {selected.map((s, i) => {
          if (i === 0) return null;
          const a = positions[selected[i - 1].id];
          const b = positions[s.id];
          if (!a || !b) return null;
          return (
            <line key={`line-${i}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={cat.color} strokeWidth={3}
              strokeLinecap="round" strokeOpacity={0.6}
            />
          );
        })}
      </svg>

      {letters.map(({ letter, id }) => {
        const pos   = positions[id];
        if (!pos) return null;
        const isSel  = selectedIds.has(id);
        const order  = selected.findIndex(s => s.id === id) + 1;
        const isHint = letter === hintFirstLetter && !isSel;
        const isWrong = status === "wrong" && isSel;

        return (
          <button key={id} onClick={() => onSelect(letter, id)} style={{
            position: "absolute",
            left: pos.x - 26, top: pos.y - 26,
            width: 52, height: 52, borderRadius: "50%",
            border: isSel
              ? `2.5px solid ${cat.color}`
              : isHint ? "2.5px solid #F59E0B" : "2px solid rgba(0,0,0,0.1)",
            background: isSel ? cat.color : isHint ? "#FEF3C7" : "#FFFFFF",
            color: isSel ? "#fff" : isHint ? "#92400E" : "#1A1A1A",
            fontSize: 17, fontWeight: 800,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", zIndex: 2,
            boxShadow: isSel ? `0 3px 14px ${cat.color}50` : "0 2px 8px rgba(0,0,0,0.09)",
            transform: isSel ? "scale(1.12)" : "scale(1)",
            transition: "all 0.15s cubic-bezier(0.34,1.56,0.64,1)",
            animation: isWrong ? "shake 0.35s ease" : "none",
          }}>
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

      <div style={{
        position: "absolute", left: CX - 7, top: CY - 7,
        width: 14, height: 14, borderRadius: "50%",
        background: `${cat.color}20`, border: `2px solid ${cat.color}40`,
      }} />
    </div>
  );
};

/* ── Word Preview ── */
const WordPreview = ({ word, status, cat, lastPts, showPts }) => {
  const sMap = {
    correct:   { bg: cat.color, border: cat.color,  text: "#fff" },
    wrong:     { bg: "#FEF2F2", border: "#EF4444",  text: "#DC2626" },
    duplicate: { bg: "#FFFBEB", border: "#F59E0B",  text: "#D97706" },
    idle:      { bg: "#F4F4F5", border: "#E4E4E7",  text: "#1A1A1A" },
  };
  const s   = sMap[status] || sMap.idle;
  const msg = { correct: "✓ To'g'ri!", wrong: "✗ Noto'g'ri", duplicate: "Allaqachon topilgan!" }[status];

  return (
    <div style={{
      minHeight: 64, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 6,
    }}>
      {word ? (
        <div style={{
          display: "flex", gap: 4, position: "relative",
          animation: status === "wrong" ? "shake 0.35s ease" : status === "correct" ? "popIn 0.3s ease" : "none",
        }}>
          {word.split("").map((ch, i) => (
            <div key={i} style={{
              width: 40, height: 46, borderRadius: 9,
              background: s.bg, border: `2px solid ${s.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: s.text,
              transition: "all 0.16s",
            }}>{ch}</div>
          ))}
          {showPts && (
            <div style={{
              position: "absolute", top: -20, right: -8,
              fontSize: 14, fontWeight: 800, color: "#16A34A",
              animation: "floatUp 1.2s ease forwards",
              pointerEvents: "none",
            }}>+{lastPts}</div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "#A1A1AA", fontWeight: 600, letterSpacing: "0.04em" }}>
          Harflarni tanlang...
        </div>
      )}
      {msg && (
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: status === "correct" ? cat.dark : s.text,
          animation: "fadeIn 0.15s ease",
        }}>{msg}</div>
      )}
    </div>
  );
};

/* ── Hint Panel ── */
const HintPanel = ({ hints, hintWord, cat, onUseHint }) => (
  <div style={{
    background: "#FAFAFA", borderRadius: 12, border: "1px solid #E4E4E7",
    padding: "11px 14px",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
  }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 16, marginTop: 1 }}>💡</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Yordamchi</div>
        {hintWord ? (
          <div style={{ fontSize: 12, color: "#D97706", fontWeight: 600, marginTop: 2 }}>{hintWord.hint}</div>
        ) : (
          <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>So'z topishda yordam</div>
        )}
      </div>
    </div>
    <button onClick={onUseHint} disabled={hints <= 0} style={{
      flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
      padding: "7px 14px", borderRadius: 9,
      background: hints > 0 ? "#FEF3C7" : "#F4F4F5",
      border: hints > 0 ? "1.5px solid #FCD34D" : "1.5px solid #E4E4E7",
      color: hints > 0 ? "#92400E" : "#A1A1AA",
      fontSize: 13, fontWeight: 700,
      cursor: hints > 0 ? "pointer" : "default",
      fontFamily: "'DM Sans', sans-serif",
      opacity: hints > 0 ? 1 : 0.5, transition: "all 0.15s",
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: "50%", display: "inline-block",
          background: i < hints ? "#F59E0B" : "#D4D4D8",
        }} />
      ))}
      <span>Hint</span>
    </button>
  </div>
);

/* ── Level Complete ── */
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
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
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
    <div style={{ fontSize: 14, color: "#6B7280", fontFamily: "'DM Sans', sans-serif" }}>
      Jami ball: <strong style={{ color: "#111" }}>{score}</strong>
    </div>
    <button onClick={onNext} style={{
      padding: "13px 30px", borderRadius: 12,
      background: cat.color, color: "#fff",
      border: "none", fontSize: 15, fontWeight: 700,
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    }}>
      Keyingi level →
    </button>
  </div>
);

/* ── Found Words ── */
const FoundWords = ({ words, cat }) => {
  if (!words.length) return null;
  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: "1px solid rgba(0,0,0,0.07)",
      padding: "14px 16px", marginTop: 12,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: "#A1A1AA",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
      }}>
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
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function WordGame() {
  const g = useGame();
  if (!g.cat) return null;
  const { cat } = g;
  const canSubmit = !!g.currentWord && g.status !== "correct" && g.status !== "wrong";

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${cat.light} 0%, #FAFAFA 55%, #F8FAFC 100%)`,
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
          100%{opacity:0;transform:translateY(-38px)}
        }
      `}</style>

      <div style={{ maxWidth: 460, margin: "0 auto", padding: "16px 14px 52px" }}>

        {/* HEADER */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 14,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>
              So'z O'yini
            </div>
            <div style={{ fontSize: 12, color: "#A1A1AA", fontWeight: 500, marginTop: 1 }}>
              {cat.icon} {cat.label} · Level {g.level}
            </div>
          </div>
          <div style={{
            background: cat.color, color: "#fff",
            borderRadius: 10, padding: "8px 16px",
            fontSize: 16, fontWeight: 800,
          }}>
            {g.score} ball
          </div>
        </div>

        {/* CATEGORY BAR */}
        <div style={{ marginBottom: 14 }}>
          <CategoryBar active={g.catId} onChange={g.changeCategory} catScores={g.catScores} />
        </div>

        {/* GAME CARD */}
        <div style={{
          background: "#fff", borderRadius: 20,
          border: `1px solid ${cat.color}20`,
          boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
          padding: "20px 16px",
          position: "relative", overflow: "hidden",
        }}>
          {g.allFound && (
            <LevelComplete cat={cat} found={g.found} score={g.score} onNext={g.nextLevel} />
          )}

          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 5, background: "#F4F4F5", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                width: `${g.targets.length ? (g.found.length / g.targets.length) * 100 : 0}%`,
                height: "100%", background: cat.color, borderRadius: 99,
                transition: "width 0.4s ease",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#71717A", whiteSpace: "nowrap" }}>
              {g.found.length} / {g.targets.length}
            </span>
          </div>

          {/* WORD SLOTS */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 10,
            marginBottom: 14, padding: "12px 10px",
            background: "#FAFAFA", borderRadius: 14, border: "1px solid #F4F4F5",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: "#A1A1AA",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2,
            }}>
              Topish kerak bo'lgan so'zlar
            </div>
            {g.targets.map((t, i) => (
              <WordRow key={t.word} target={t} found={g.found} idx={i} cat={cat} hintWord={g.hintWord} />
            ))}
          </div>

          {/* HINT */}
          <div style={{ marginBottom: 14 }}>
            <HintPanel hints={g.hints} hintWord={g.hintWord} cat={cat} onUseHint={g.useHint} />
          </div>

          {/* WORD PREVIEW */}
          <div style={{ marginBottom: 8 }}>
            <WordPreview word={g.currentWord} status={g.status} cat={cat} lastPts={g.lastPts} showPts={g.showPts} />
          </div>

          {/* LETTER CIRCLE */}
          <LetterCircle
            letters={g.letters} selected={g.selected}
            onSelect={g.selectLetter} cat={cat}
            hintWord={g.hintWord} found={g.found} status={g.status}
          />

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { label: "🔀 Aralashtir", onClick: g.shuffleLetters, s: { background: "#EFF6FF", border: "1.5px solid #BFDBFE", color: "#1D4ED8" } },
              { label: "⌫ O'chir",     onClick: g.removeLast, disabled: !g.selected.length, s: { background: "#F4F4F5", border: "1.5px solid #E4E4E7", color: "#374151" } },
              { label: "✕ Tozala",     onClick: g.clearAll,   disabled: !g.selected.length, s: { background: "#FFF1F2", border: "1.5px solid #FECDD3", color: "#BE123C" } },
            ].map(btn => (
              <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled} style={{
                flex: 1, padding: "9px 4px", borderRadius: 10,
                fontSize: 12, fontWeight: 700,
                cursor: btn.disabled ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                opacity: btn.disabled ? 0.4 : 1,
                transition: "all 0.15s", ...btn.s,
              }}>{btn.label}</button>
            ))}
          </div>

          {/* SUBMIT */}
          <button onClick={g.submit} disabled={!canSubmit} style={{
            width: "100%", marginTop: 10, padding: "13px", borderRadius: 12, border: "none",
            cursor: canSubmit ? "pointer" : "default",
            background: canSubmit ? cat.color : "#E4E4E7",
            color: canSubmit ? "#fff" : "#A1A1AA",
            fontSize: 15, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.18s",
            opacity: canSubmit ? 1 : 0.55,
          }}>
            Tekshirish ✓
          </button>
        </div>

        {/* FOUND WORDS */}
        <FoundWords words={g.found} cat={cat} />
      </div>
    </div>
  );
}
