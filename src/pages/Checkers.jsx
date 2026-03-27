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

// 🔥 1D BOARD
const createBoard = () => {
  const board = Array(64).fill("");

  for(let i=0;i<3;i++){
    for(let j=0;j<8;j++){
      if((i+j)%2===1){
        board[i*8 + j] = "b";
      }
    }
  }

  for(let i=5;i<8;i++){
    for(let j=0;j<8;j++){
      if((i+j)%2===1){
        board[i*8 + j] = "w";
      }
    }
  }

  return board;
};

export default function Checkers(){

  const { user } = useContext(AuthContext);

  const [gameId,setGameId] = useState("");
  const [game,setGame] = useState(null);
  const [selected,setSelected] = useState(null);
  const [loading,setLoading] = useState(false);

  // 🎮 CREATE GAME
  const createGame = async () => {

    if(!user){
      alert("Login qiling ❌");
      return;
    }

    try {
      setLoading(true);

      const id = Date.now().toString();

      await setDoc(doc(db,"games",id),{
        board: createBoard(),
        player1: user.uid,
        player2: "",
        turn: user.uid,
        status: "waiting",
        winner: ""
      });

      setGameId(id);
      alert("O‘yin yaratildi ✅ ID: " + id);

    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🤝 JOIN
  const joinGame = async () => {

    if(!gameId) return alert("ID kiriting");

    const ref = doc(db,"games",gameId);
    const snap = await getDoc(ref);

    if(!snap.exists()) return alert("Topilmadi ❌");

    const data = snap.data();

    if(data.player2) return alert("Band ❗");

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

  // 🎯 MOVE
  const handleMove = async (i,j) => {

    if(!game || game.status!=="playing") return;

    if(game.turn !== user.uid) return;

    const board = [...game.board];

    const index = i*8 + j;

    const isPlayer1 = user.uid === game.player1;
    const myPiece = isPlayer1 ? "b" : "w";

    if(selected){

      const selectedIndex = selected.i*8 + selected.j;
      const piece = board[selectedIndex];

      if(piece !== myPiece){
        setSelected(null);
        return;
      }

      const dx = i - selected.i;
      const dy = j - selected.j;
      const dir = myPiece === "w" ? -1 : 1;

      // oddiy yurish
      if(dx === dir && Math.abs(dy) === 1 && board[index] === ""){
        board[index] = piece;
        board[selectedIndex] = "";
      } else {
        return;
      }

      await updateDoc(doc(db,"games",gameId),{
        board,
        turn: user.uid === game.player1 ? game.player2 : game.player1
      });

      setSelected(null);

    } else {
      if(board[index] === myPiece){
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
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "..." : "🎮 O‘yin yaratish"}
      </button>

      {/* ID */}
      {gameId && (
        <div className="text-green-600 text-sm">
          Game ID: {gameId}
        </div>
      )}

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
        <div className="text-sm">
          {game.status === "waiting" && "Raqib kutilmoqda..."}
          {game.status === "playing" && (
            game.turn === user.uid
              ? "Siz yurishingiz kerak"
              : "Raqib yurmoqda"
          )}
        </div>
      )}

      {/* BOARD */}
      {game && (
        <div className="grid grid-cols-8 w-[400px] border">

          {game.board.map((cell,index)=>{

            const i = Math.floor(index/8);
            const j = index % 8;

            const isDark = (i+j)%2===1;

            return (
              <div
                key={index}
                onClick={()=>handleMove(i,j)}
                className={`w-12 h-12 flex items-center justify-center cursor-pointer
                  ${isDark ? "bg-gray-700" : "bg-gray-200"}
                `}
              >

                {cell !== "" && (
                  <div
                    className={`w-8 h-8 rounded-full
                      ${cell==="b" ? "bg-black" : "bg-white border"}
                    `}
                  />
                )}

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}