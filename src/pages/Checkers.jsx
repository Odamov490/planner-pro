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

  // 🎮 CREATE GAME
  const createGame = async () => {

    const id = Date.now().toString();

    await setDoc(doc(db,"games",id),{
      board: createBoard(),
      player1: user.uid,
      player2: null,
      turn: user.uid,
      status: "waiting",
      winner: null
    });

    setGameId(id);
  };

  // 🤝 JOIN GAME
  const joinGame = async () => {

    const ref = doc(db,"games",gameId);
    const snap = await getDoc(ref);

    if(!snap.exists()) return alert("Game topilmadi ❌");

    const data = snap.data();

    if(data.player2) return alert("Game to‘la ❗");

    await updateDoc(ref,{
      player2: user.uid,
      status: "playing"
    });
  };

  // 🔄 REALTIME
  useEffect(()=>{
    if(!gameId) return;

    const unsub = onSnapshot(doc(db,"games",gameId),(snap)=>{
      setGame(snap.data());
    });

    return ()=>unsub();
  },[gameId]);

  // 🎯 MOVE LOGIC
  const isValidMove = (from,to,piece,board) => {

    const dir = piece === "w" ? -1 : 1;
    const dx = to.i - from.i;
    const dy = to.j - from.j;

    // oddiy yurish
    if(dx === dir && Math.abs(dy) === 1 && !board[to.i][to.j]){
      return true;
    }

    // urish
    if(dx === dir*2 && Math.abs(dy) === 2){
      const midI = (from.i + to.i)/2;
      const midJ = (from.j + to.j)/2;

      const enemy = board[midI][midJ];

      if(enemy && enemy !== piece && !board[to.i][to.j]){
        return { eat: {i:midI,j:midJ} };
      }
    }

    return false;
  };

  // 🔥 MOVE
  const handleMove = async (i,j) => {

    if(!game || game.status!=="playing") return;

    if(game.turn !== user.uid) return alert("Navbat sizda emas ❗");

    const board = game.board.map(r=>[...r]);

    const isPlayer1 = user.uid === game.player1;
    const myPiece = isPlayer1 ? "b" : "w";

    if(selected){

      const piece = board[selected.i][selected.j];

      if(piece !== myPiece){
        setSelected(null);
        return;
      }

      const result = isValidMove(selected,{i,j},piece,board);

      if(!result) return;

      // move
      board[i][j] = piece;
      board[selected.i][selected.j] = null;

      // eat
      if(result.eat){
        board[result.eat.i][result.eat.j] = null;
      }

      // winner check
      const allPieces = board.flat();
      const whiteLeft = allPieces.includes("w");
      const blackLeft = allPieces.includes("b");

      let winner = null;

      if(!whiteLeft) winner = game.player1;
      if(!blackLeft) winner = game.player2;

      await updateDoc(doc(db,"games",gameId),{
        board,
        turn: user.uid === game.player1 ? game.player2 : game.player1,
        winner
      });

      setSelected(null);

    } else {
      if(board[i][j] === myPiece){
        setSelected({i,j});
      }
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

      {/* STATUS */}
      {game && (
        <div className="text-sm text-gray-600">
          {game.winner
            ? "🏆 G‘olib bor!"
            : game.turn === user.uid
              ? "Sizning navbatingiz"
              : "Raqib yurmoqda..."}
        </div>
      )}

      {/* BOARD */}
      {game && (
        <div className="grid grid-cols-8 w-[400px] border">

          {game.board.map((row,i)=>
            row.map((cell,j)=>{

              const isDark = (i+j)%2===1;

              return (
                <div
                  key={i+"-"+j}
                  onClick={()=>handleMove(i,j)}
                  className={`w-12 h-12 flex items-center justify-center cursor-pointer
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