import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot, increment
} from "firebase/firestore";

// BOARD
const createBoard = () => {
  const b = Array(64).fill("");
  for(let i=0;i<3;i++){
    for(let j=0;j<8;j++){
      if((i+j)%2===1) b[i*8+j] = "b";
    }
  }
  for(let i=5;i<8;i++){
    for(let j=0;j<8;j++){
      if((i+j)%2===1) b[i*8+j] = "w";
    }
  }
  return b;
};

export default function Checkers(){

  const { user } = useContext(AuthContext);

  const [gameId,setGameId]=useState("");
  const [game,setGame]=useState(null);
  const [selected,setSelected]=useState(null);
  const [moves,setMoves]=useState([]);
  const [forced,setForced]=useState(false);

  const inside=(i,j)=>i>=0&&i<8&&j>=0&&j<8;

  // CREATE
  const createGame=async()=>{
    const id=Date.now().toString();
    await setDoc(doc(db,"games",id),{
      board:createBoard(),
      player1:user.uid,
      player2:"",
      turn:user.uid,
      status:"waiting",
      winner:""
    });
    setGameId(id);
  };

  // JOIN
  const joinGame=async()=>{
    const ref=doc(db,"games",gameId);
    await updateDoc(ref,{
      player2:user.uid,
      status:"playing"
    });
  };

  // REALTIME
  useEffect(()=>{
    if(!gameId) return;
    return onSnapshot(doc(db,"games",gameId),(snap)=>{
      setGame(snap.data());
    });
  },[gameId]);

  // 🔥 ALL CAPTURES CHECK (majburiy urish)
  const hasCapture=(board,color)=>{
    return board.some((cell,index)=>{
      if(!cell || !cell.startsWith(color)) return false;

      const i=Math.floor(index/8);
      const j=index%8;

      return getMoves(i,j,board,cell,true).length>0;
    });
  };

  // 🔥 MOVE GENERATOR
  const getMoves=(i,j,board,piece,onlyEat=false)=>{

    let res=[];
    const dirs=[];

    if(piece==="b") dirs.push([1,-1],[1,1]);
    if(piece==="w") dirs.push([-1,-1],[-1,1]);

    if(piece.includes("k")){
      dirs.push([1,-1],[1,1],[-1,-1],[-1,1]);
    }

    dirs.forEach(([di,dj])=>{

      let ni=i+di;
      let nj=j+dj;

      // king unlimited
      while(inside(ni,nj)){

        const idx=ni*8+nj;

        if(board[idx]==="" && !onlyEat){
          res.push({i:ni,j:nj});
        }

        // eat
        if(board[idx] && board[idx][0]!==piece[0]){
          const ti=ni+di;
          const tj=nj+dj;

          if(inside(ti,tj) && board[ti*8+tj]===""){
            res.push({
              i:ti,
              j:tj,
              eat:{i:ni,j:nj}
            });
          }
          break;
        }

        if(!piece.includes("k")) break;

        ni+=di;
        nj+=dj;
      }

    });

    if(onlyEat) return res.filter(m=>m.eat);

    return res;
  };

  // CLICK
  const handleClick=async(i,j)=>{

    if(!game || game.turn!==user.uid) return;

    const board=[...game.board];
    const idx=i*8+j;

    const myColor=user.uid===game.player1?"b":"w";

    const mustEat=hasCapture(board,myColor);

    if(selected){

      const move=moves.find(m=>m.i===i&&m.j===j);
      if(!move) return;

      const from=selected.i*8+selected.j;
      const piece=board[from];

      board[idx]=piece;
      board[from]="";

      // eat
      if(move.eat){
        board[move.eat.i*8+move.eat.j]="";
      }

      // king
      if(piece==="w"&&i===0) board[idx]="wk";
      if(piece==="b"&&i===7) board[idx]="bk";

      // multi eat
      if(move.eat){
        const more=getMoves(i,j,board,board[idx],true);
        if(more.length>0){
          setSelected({i,j});
          setMoves(more);
          setForced(true);
          await updateDoc(doc(db,"games",gameId),{board});
          return;
        }
      }

      // win
      const enemy=myColor==="b"?"w":"b";
      const enemyExists=board.some(c=>c.startsWith(enemy));

      if(!enemyExists){
        await updateDoc(doc(db,"games",gameId),{
          board,
          winner:user.uid
        });

        await updateDoc(doc(db,"users",user.uid),{
          wins:increment(1)
        });

        return;
      }

      await updateDoc(doc(db,"games",gameId),{
        board,
        turn:user.uid===game.player1?game.player2:game.player1
      });

      setSelected(null);
      setMoves([]);
      setForced(false);

    } else {

      const piece=board[idx];
      if(!piece || !piece.startsWith(myColor)) return;

      const m=getMoves(i,j,board,piece,mustEat);
      if(m.length===0) return;

      setSelected({i,j});
      setMoves(m);
    }
  };

  return (
    <div className="p-6 space-y-4">

      <h1 className="text-3xl font-bold text-blue-600">
        ♟ PREMIUM SHASHKA
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
        <div className="grid grid-cols-8 w-[420px]">

          {game.board.map((cell,index)=>{

            const i=Math.floor(index/8);
            const j=index%8;

            const isDark=(i+j)%2===1;
            const isMove=moves.some(m=>m.i===i&&m.j===j);
            const isSel=selected && selected.i===i && selected.j===j;

            return (
              <div
                key={index}
                onClick={()=>handleClick(i,j)}
                className={`w-12 h-12 flex items-center justify-center
                  ${isDark?"bg-gray-800":"bg-gray-300"}
                  ${isMove?"ring-4 ring-green-400":""}
                  ${isSel?"ring-4 ring-yellow-400":""}
                `}
              >
                {cell && (
                  <div className={`w-8 h-8 rounded-full
                    ${cell.startsWith("b")?"bg-black":"bg-white border"}
                  `}/>
                )}
              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}