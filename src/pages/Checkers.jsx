import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";

const createBoard = () => {
  const board = Array(8).fill(null).map(()=>Array(8).fill(null));

  for(let i=0;i<3;i++){
    for(let j=0;j<8;j++){
      if((i+j)%2===1) board[i][j] = "b";
    }
  }

  for(let i=5;i<8;i++){
    for(let j=0;j<8;j++){
      if((i+j)%2===1) board[i][j] = "w";
    }
  }

  return board;
};

export default function Checkers(){

  const { user } = useContext(AuthContext);

  const [gameId,setGameId] = useState("");
  const [game,setGame] = useState(null);
  const [selected,setSelected] = useState(null);

  // 🔥 CREATE GAME
  const createGame = async () => {

    const id = Date.now().toString();

    await setDoc(doc(db,"games",id),{
      board: createBoard(),
      player1: user.uid,
      player2: null,
      turn: user.uid,
      status: "waiting"
    });

    setGameId(id);
  };

  // 🔥 JOIN GAME
  const joinGame = async () => {

    const ref = doc(db,"games",gameId);
    const snap = await getDoc(ref);

    if(!snap.exists()) return alert("Game yo‘q ❌");

    await updateDoc(ref,{
      player2: user.uid,
      status: "playing"
    });
  };

  // 🔥 REALTIME LISTENER
  useEffect(()=>{

    if(!gameId) return;

    const unsub = onSnapshot(doc(db,"games",gameId),(snap)=>{
      setGame(snap.data());
    });

    return ()=>unsub();

  },[gameId]);

  // 🔥 MOVE
  const handleMove = async (i,j) => {

    if(!game) return;

    if(game.turn !== user.uid) return alert("Navbat sizda emas ❗");

    const board = [...game.board.map(r=>[...r])];

    if(selected){
      board[i][j] = board[selected.i][selected.j];
      board[selected.i][selected.j] = null;

      await updateDoc(doc(db,"games",gameId),{
        board,
        turn: user.uid === game.player1 ? game.player2 : game.player1
      });

      setSelected(null);

    } else if(board[i][j]){
      setSelected({i,j});
    }

  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold text-blue-600">
        ♟ Multiplayer Shashka
      </h1>

      {/* CREATE */}
      <button
        onClick={createGame}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        🎮 O‘yin yaratish
      </button>

      {/* JOIN */}
      <div className="flex gap-2">
        <input
          value={gameId}
          onChange={(e)=>setGameId(e.target.value)}
          placeholder="Game ID..."
          className="border p-2 rounded"
        />

        <button
          onClick={joinGame}
          className="bg-green-500 text-white px-4 rounded"
        >
          Qo‘shilish
        </button>
      </div>

      {/* BOARD */}
      {game && (
        <div className="grid grid-cols-8 w-[400px]">

          {game.board.map((row,i)=>
            row.map((cell,j)=>{

              const isDark = (i+j)%2===1;

              return (
                <div
                  key={i+"-"+j}
                  onClick={()=>handleMove(i,j)}
                  className={`w-12 h-12 flex items-center justify-center
                    ${isDark ? "bg-gray-700" : "bg-gray-200"}
                  `}
                >

                  {cell && (
                    <div
                      className={`w-8 h-8 rounded-full
                        ${cell==="b" ? "bg-black" : "bg-white border"}
                      `}
                    />
                  )}

                </div>
              );
            })
          )}

        </div>
      )}

    </div>
  );
}