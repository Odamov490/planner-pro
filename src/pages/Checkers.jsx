import { useState } from "react";

const initialBoard = () => {
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

  const [board,setBoard] = useState(initialBoard());
  const [selected,setSelected] = useState(null);

  const handleClick = (i,j) => {

    if(selected){
      const newBoard = board.map(r=>[...r]);
      newBoard[i][j] = board[selected.i][selected.j];
      newBoard[selected.i][selected.j] = null;
      setBoard(newBoard);
      setSelected(null);
    } else if(board[i][j]){
      setSelected({i,j});
    }

  };

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold text-blue-600">
        ♟ Shashka
      </h1>

      <div className="grid grid-cols-8 w-[400px]">

        {board.map((row,i)=>
          row.map((cell,j)=>{

            const isDark = (i+j)%2===1;

            return (
              <div
                key={i+"-"+j}
                onClick={()=>handleClick(i,j)}
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

    </div>
  );
}