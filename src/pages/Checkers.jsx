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
  const [myColor,setMyColor] = useState("");
  const [rotate,setRotate] = useState(false);

  // CREATE
  const createGame = async ()=>{
    const id = Date.now().toString();

    await setDoc(doc(db,"games",id),{
      board: createBoard(),
      player1: user.uid,
      player2: "",
      turn: user.uid,
      status: "waiting",
      winner: "",
      colors: {}
    });

    setGameId(id);
  };

  // JOIN + COLOR
  const joinGame = async ()=>{

    const ref = doc(db,"games",gameId);
    const snap = await getDoc(ref);
    const data = snap.data();

    const colorChoice = prompt("b yoki w tanlang");

    if(Object.values(data.colors||{}).includes(colorChoice)){
      alert("Bu rang band");
      return;
    }

    await updateDoc(ref,{
      player2: user.uid,
      status: "playing",
      colors: {
        ...data.colors,
        [user.uid]: colorChoice
      }
    });

    setMyColor(colorChoice);
  };

  // REALTIME
  useEffect(()=>{
    if(!gameId) return;

    return onSnapshot(doc(db,"games",gameId),(snap)=>{
      const g = snap.data();
      setGame(g);

      if(g.colors && g.colors[user.uid]){
        setMyColor(g.colors[user.uid]);
      }
    });
  },[gameId]);

  // 🔥 CHECK VALID
  const inside = (i,j)=> i>=0 && i<8 && j>=0 && j<8;

  // 🔥 MOVES
  const getMoves = (i,j,board,piece)=>{

    const dirs = piece==="w" || piece==="wk" ? [-1] : [1];
    if(piece.includes("k")) dirs.push(-dirs[0]);

    let result = [];

    dirs.forEach(d=>{
      [-1,1].forEach(s=>{

        const ni=i+d;
        const nj=j+s;

        if(inside(ni,nj) && board[ni*8+nj]===""){
          result.push({i:ni,j:nj});
        }

        // eat
        const ei=i+d;
        const ej=j+s;
        const ti=i+d*2;
        const tj=j+s*2;

        if(
          inside(ti,tj) &&
          board[ei*8+ej] &&
          board[ei*8+ej][0]!==piece[0] &&
          board[ti*8+tj]===""
        ){
          result.push({i:ti,j:tj,eat:{i:ei,j:ej}});
        }

      });
    });

    // 🔥 majburiy urish
    const eats = result.filter(m=>m.eat);
    if(eats.length>0) return eats;

    return result;
  };

  // CLICK
  const handleClick = async (i,j)=>{

    if(!game || game.turn!==user.uid) return;

    const board = [...game.board];
    const idx = i*8+j;

    if(selected){

      const move = moves.find(m=>m.i===i && m.j===j);
      if(!move) return;

      const from = selected.i*8+selected.j;
      const piece = board[from];

      board[idx]=piece;
      board[from]="";

      // eat
      if(move.eat){
        board[move.eat.i*8+move.eat.j]="";
      }

      // king
      if(piece==="w" && i===0) board[idx]="wk";
      if(piece==="b" && i===7) board[idx]="bk";

      // win
      const enemy = piece[0]==="b" ? "w":"b";
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
      const piece = board[idx];
      if(piece && piece.startsWith(myColor)){
        setSelected({i,j});
        setMoves(getMoves(i,j,board,piece));
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

      <button onClick={()=>setRotate(!rotate)} className="bg-purple-500 text-white px-3 py-1 rounded">
        🔄 Board aylantirish
      </button>

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
        <div className={`grid grid-cols-8 w-[400px] ${rotate ? "rotate-180" : ""}`}>

          {game.board.map((cell,index)=>{

            const i=Math.floor(index/8);
            const j=index%8;

            const isDark=(i+j)%2===1;
            const isMove=moves.some(m=>m.i===i && m.j===j);

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