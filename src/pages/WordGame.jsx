import { useState } from "react";

const WORDS = ["KITAB", "BOLA", "OLMA"];
const LETTERS = ["K", "I", "T", "A", "B"];

export default function WordGame() {
  const [selected, setSelected] = useState([]);
  const [foundWords, setFoundWords] = useState([]);

  const handleClick = (letter, index) => {
    setSelected(prev => [...prev, { letter, index }]);
  };

  const currentWord = selected.map(l => l.letter).join("");

  const checkWord = () => {
    if (WORDS.includes(currentWord) && !foundWords.includes(currentWord)) {
      setFoundWords(prev => [...prev, currentWord]);
    }
    setSelected([]);
  };

  const reset = () => setSelected([]);

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">🧠 Word Game</h1>

      {/* TANLANGAN SO‘Z */}
      <div className="mb-4 text-xl tracking-widest">
        {currentWord || "______"}
      </div>

      {/* HARFLAR */}
      <div className="flex justify-center gap-3 mb-4">
        {LETTERS.map((l, i) => (
          <button
            key={i}
            onClick={() => handleClick(l, i)}
            className="w-12 h-12 bg-blue-500 text-white rounded-xl text-lg hover:scale-110 transition"
          >
            {l}
          </button>
        ))}
      </div>

      {/* BUTTONS */}
      <div className="flex justify-center gap-3 mb-4">
        <button
          onClick={checkWord}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          Tekshirish
        </button>

        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-400 text-white rounded-lg"
        >
          Tozalash
        </button>
      </div>

      {/* TOPILGAN SO‘ZLAR */}
      <div>
        <h2 className="font-semibold">Topilgan so‘zlar:</h2>
        <div className="flex justify-center gap-2 mt-2 flex-wrap">
          {foundWords.map((w, i) => (
            <span key={i} className="bg-green-200 px-3 py-1 rounded-full">
              {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}