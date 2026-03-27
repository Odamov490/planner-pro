import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  increment
} from "firebase/firestore";

const createBoard = () => {
  const board = Array(64).fill("");

  for(let i=0;i<3;i++){
    for(let j=0;j<8;j++){
      if((i+j)%2===1) board[i*8 + j] = "b";
    }
  }

  for(let i=5;i<8;i++){
    for(let j=0;j<8;j++){
      if((i+j)%2===1) board[i*8 + j] = "w";
    }
  }

  return board;
};

export default function Checkers(){

  const { user } = useContext(AuthContext);

  const [gameId,setGameId] = useState("");
  const [game,setGame] = useState(null);
  const [selected,setSelected] = useState(null);
  const [possibleMoves,setPossibleMoves] = useState([]);

  // 🎮 CREATE
  const createGame = async () => {

    const id = Date.now().toString();

    await setDoc(doc(db,"games",id),{
      board: createBoard(),
      player1: user.uid,
      player1Email: user.email,
      player2: "",
      player2Email: "",
      turn: user.uid,
      status: "waiting",
      winner: ""
    });

    setGameId(id);
  };

  // 🤝 JOIN
  const joinGame = async () => {

    const ref = doc(db,"games",gameId);
    const snap = await getDoc(ref);

    const data = snap.data();

    await updateDoc(ref,{
      player2: user.uid,
      player2Email: user.email,
      status: "playing"
    });
  };

  // 🔄 REALTIME
  useEffect(()=>{
    if(!gameId) return;

    return onSnapshot(doc(db,"games",gameId),(snap)=>{
      setGame(snap.data());
    });
  },[gameId]);

  // 🎯 POSSIBLE MOVES
  const getMoves = (i,j,board,piece) => {

    const moves = [];
    const dir = piece==="w" ? -1 : 1;

    const left = {i:i+dir,j:j-1};
    const right = {i:i+dir,j:j+1};

    if(board[left.i*8 + left.j]==="") moves.push(left);
    if(board[right.i*8 + right.j]==="") moves.push(right);

    return moves;
  };

  // 🎯 CLICK
  const handleClick = async (i,j) => {

    if(!game || game.status!=="playing") return;
    if(game.turn !== user.uid) return;

    const board = [...game.board];

    const index = i*8+j;

    const isPlayer1 = user.uid===game.player1;
    const myPiece = isPlayer1 ? "b" : "w";

    if(selected){

      const valid = possibleMoves.find(m=>m.i===i && m.j===j);
      if(!valid) return;

      const selectedIndex = selected.i*8 + selected.j;

      board[index] = board[selectedIndex];
      board[selectedIndex] = "";

      // 🏆 WIN CHECK
      const enemy = myPiece==="b" ? "w" : "b";
      if(!board.includes(enemy)){
        await updateDoc(doc(db,"games",gameId),{
          board,
          winner: user.uid
        });

        // 📊 STATS SAVE
        await updateDoc(doc(db,"users",user.uid),{
          wins: increment(1)
        });

        return;
      }

      await updateDoc(doc(db,"games",gameId),{
        board,
        turn: user.uid===game.player1 ? game.player2 : game.player1
      });

      setSelected(null);
      setPossibleMoves([]);

    } else {

      if(board[index]===myPiece){
        setSelected({i,j});
        setPossibleMoves(getMoves(i,j,board,myPiece));
      }
    }
  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold text-blue-600">
        ♟ PRO Shashka
      </h1>

      <button onClick={createGame} className="bg-blue-500 text-white px-4 py-2 rounded">
        🎮 O‘yin yaratish
      </button>

      <div className="flex gap-2">
        <input value={gameId} onChange={(e)=>setGameId(e.target.value)} className="border p-2"/>
        <button onClick={joinGame} className="bg-green-500 text-white px-4">
          Qo‘shilish
        </button>
      </div>

      {/* 👥 PLAYERS */}
      {game && (
        <div className="text-sm space-y-1">
          <div>👤 1: {game.player1Email}</div>
          <div>👤 2: {game.player2Email || "kutilmoqda..."}</div>
        </div>
      )}

      {/* STATUS */}
      {game && (
        <div>
          {game.winner
            ? "🏆 G‘olib bor!"
            : game.turn===user.uid
              ? "Siz yurishingiz kerak"
              : "Raqib yurmoqda"}
        </div>
      )}

      {/* BOARD */}
      {game && (
        <div className="grid grid-cols-8 w-[400px] border">

          {game.board.map((cell,index)=>{

            const i = Math.floor(index/8);
            const j = index%8;

            const isDark = (i+j)%2===1;

            const isMove = possibleMoves.some(m=>m.i===i && m.j===j);

            return (
              <div
                key={index}
                onClick={()=>handleClick(i,j)}
                className={`w-12 h-12 flex items-center justify-center cursor-pointer
                  ${isDark ? "bg-gray-700" : "bg-gray-200"}
                  ${isMove ? "ring-4 ring-green-400" : ""}
                `}
              >

                {cell!=="" && (
                  <div className={`w-8 h-8 rounded-full
                    ${cell==="b" ? "bg-black" : "bg-white border"}`} />
                )}

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}