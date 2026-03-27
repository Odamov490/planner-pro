import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, increment
} from "firebase/firestore";

const createBoard = () => {
  const board = Array(64).fill("");

  for(let i=0;i<3;i++){
    for(let j=0;j<8;j++){
      if((i+j)%2===1) board[i*8+j] = "b";
    }
  }

  for(let i=5;i<8;i++){
    for(let j=0;j<8;j++){
      if((i+j)%2===1) board[i*8+j] = "w";
    }
  }

  return board;
};

export default function Checkers(){

  const { user } = useContext(AuthContext);

  const [gameId,setGameId] = useState("");
  const [game,setGame] = useState(null);
  const [selected,setSelected] = useState(null);
  const [moves,setMoves] = useState([]);

  // CREATE
  const createGame = async ()=>{
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
  };

  // JOIN
  const joinGame = async ()=>{
    const ref = doc(db,"games",gameId);
    const snap = await getDoc(ref);
    const data = snap.data();

    await updateDoc(ref,{
      player2: user.uid,
      status: "playing"
    });
  };

  // REALTIME
  useEffect(()=>{
    if(!gameId) return;
    return onSnapshot(doc(db,"games",gameId),(snap)=>{
      setGame(snap.data());
    });
  },[gameId]);

  // 🔥 MOVES LOGIC
  const getMoves = (i,j,board,piece) => {

    const dirs = piece==="w" ? [-1] : [1];
    if(piece.includes("k")) dirs.push(-dirs[0]);

    const res = [];

    dirs.forEach(d=>{
      [-1,1].forEach(side=>{

        const ni = i+d;
        const nj = j+side;

        const idx = ni*8+nj;

        if(board[idx]===""){
          res.push({i:ni,j:nj});
        }

        // eat
        const ei = i+d;
        const ej = j+side;
        const ti = i+d*2;
        const tj = j+side*2;

        const enemy = board[ei*8+ej];

        if(enemy && enemy[0]!==piece[0] && board[ti*8+tj]===""){
          res.push({i:ti,j:tj,eat:{i:ei,j:ej}});
        }

      });
    });

    return res;
  };

  // CLICK
  const handleClick = async (i,j)=>{

    if(!game || game.turn!==user.uid) return;

    const board = [...game.board];
    const idx = i*8+j;

    const isP1 = user.uid===game.player1;
    const myPiece = isP1 ? "b" : "w";

    if(selected){

      const move = moves.find(m=>m.i===i && m.j===j);
      if(!move) return;

      const fromIdx = selected.i*8+selected.j;

      board[idx] = board[fromIdx];
      board[fromIdx] = "";

      // EAT
      if(move.eat){
        board[move.eat.i*8+move.eat.j] = "";
      }

      // DAMKA
      if(myPiece==="w" && i===0) board[idx]="wk";
      if(myPiece==="b" && i===7) board[idx]="bk";

      // WIN
      const enemy = myPiece==="b" ? "w" : "b";
      if(!board.some(c=>c.startsWith(enemy))){
        await updateDoc(doc(db,"games",gameId),{
          board,
          winner:user.uid
        });

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
      setMoves([]);

    } else {
      if(board[idx].startsWith(myPiece)){
        setSelected({i,j});
        setMoves(getMoves(i,j,board,board[idx]));
      }
    }
  };

  return (
    <div className="p-6 space-y-4">

      <h1 className="text-3xl font-bold text-blue-600">
        ♟ PRO Shashka
      </h1>

      <button onClick={createGame} className="bg-blue-500 text-white px-4 py-2 rounded">
        O‘yin yaratish
      </button>

      <div className="flex gap-2">
        <input value={gameId} onChange={(e)=>setGameId(e.target.value)} className="border p-2"/>
        <button onClick={joinGame} className="bg-green-500 text-white px-4">
          Qo‘shilish
        </button>
      </div>

      {game && (
        <div>
          {game.winner
            ? "🏆 G‘olib bor"
            : game.turn===user.uid
              ? "Siz yurishingiz kerak"
              : "Raqib yurmoqda"}
        </div>
      )}

      {game && (
        <div className="grid grid-cols-8 w-[400px]">

          {game.board.map((cell,index)=>{

            const i = Math.floor(index/8);
            const j = index%8;

            const isDark = (i+j)%2===1;
            const isMove = moves.some(m=>m.i===i && m.j===j);

            return (
              <div
                key={index}
                onClick={()=>handleClick(i,j)}
                className={`w-12 h-12 flex items-center justify-center
                  ${isDark ? "bg-gray-700" : "bg-gray-200"}
                  ${isMove ? "ring-4 ring-green-400" : ""}
                `}
              >
                {cell && (
                  <div className={`w-8 h-8 rounded-full
                    ${cell.startsWith("b") ? "bg-black" : "bg-white border"}`} />
                )}
              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}