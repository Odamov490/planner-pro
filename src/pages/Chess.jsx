import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  increment,
} from "firebase/firestore";

function Chess() {
  const { user } = useContext(AuthContext);

  const [board, setBoard] = useState([]);
  const [selected, setSelected] = useState(null);

  // ♟️ Boshlang‘ich doska
  const createBoard = () => {
    const newBoard = [];

    for (let i = 0; i < 64; i++) {
      newBoard.push({
        id: i,
        piece: null,
      });
    }

    // Oddiy test uchun 2 dona qo‘shamiz
    newBoard[8].piece = "♙";
    newBoard[55].piece = "♟";

    return newBoard;
  };

  // 🔄 Firebase’dan yuklash
  const loadGame = useCallback(async () => {
    if (!user) return;

    const ref = doc(db, "chess_games", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setBoard(snap.data().board);
    } else {
      const initial = createBoard();
      setBoard(initial);
      await setDoc(ref, { board: initial });
    }
  }, [user]);

  // 💾 Saqlash
  const saveGame = async (newBoard) => {
    if (!user) return;
    const ref = doc(db, "chess_games", user.uid);
    await updateDoc(ref, { board: newBoard });
  };

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // ♟️ Katakka bosish
  const handleClick = (cell) => {
    if (selected === null) {
      if (cell.piece) {
        setSelected(cell.id);
      }
    } else {
      const newBoard = [...board];

      newBoard[cell.id].piece = board[selected].piece;
      newBoard[selected].piece = null;

      setBoard(newBoard);
      setSelected(null);

      saveGame(newBoard);
    }
  };

  return (
    <div className="p-5 text-white">
      <h1 className="text-2xl font-bold mb-4">♟️ Shaxmat</h1>

      <div className="grid grid-cols-8 w-[320px] border">
        {board.map((cell, i) => {
          const isDark = (Math.floor(i / 8) + i) % 2 === 1;

          return (
            <div
              key={cell.id}
              onClick={() => handleClick(cell)}
              className={`w-10 h-10 flex items-center justify-center cursor-pointer
                ${isDark ? "bg-gray-700" : "bg-gray-200"}
                ${selected === cell.id ? "ring-2 ring-yellow-400" : ""}
              `}
            >
              {cell.piece}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Chess;