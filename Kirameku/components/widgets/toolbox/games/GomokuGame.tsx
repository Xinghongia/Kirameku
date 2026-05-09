"use client";

import { useState, useCallback } from "react";

const SIZE = 15;
const WIN_COUNT = 5;

type Stone = "black" | "white" | null;

function createBoard(): Stone[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function checkWin(board: Stone[][], r: number, c: number): boolean {
  const stone = board[r][c];
  if (!stone) return false;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let i = 1; i < WIN_COUNT; i++) {
      const nr = r + dr * i, nc = c + dc * i;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== stone) break;
      count++;
    }
    for (let i = 1; i < WIN_COUNT; i++) {
      const nr = r - dr * i, nc = c - dc * i;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== stone) break;
      count++;
    }
    if (count >= WIN_COUNT) return true;
  }
  return false;
}

function isDraw(board: Stone[][]): boolean {
  return board.every((row) => row.every((c) => c !== null));
}

export default function GomokuGame() {
  const [board, setBoard] = useState<Stone[][]>(createBoard);
  const [turn, setTurn] = useState<"black" | "white">("black");
  const [winner, setWinner] = useState<"black" | "white" | "draw" | null>(null);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [blackWins, setBlackWins] = useState(0);
  const [whiteWins, setWhiteWins] = useState(0);

  const handleClick = (r: number, c: number) => {
    if (winner || board[r][c]) return;
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = turn;
    setBoard(newBoard);
    setLastMove([r, c]);

    if (checkWin(newBoard, r, c)) {
      setWinner(turn);
      if (turn === "black") setBlackWins((w) => w + 1);
      else setWhiteWins((w) => w + 1);
      return;
    }
    if (isDraw(newBoard)) {
      setWinner("draw");
      return;
    }
    setTurn(turn === "black" ? "white" : "black");
  };

  const restart = () => {
    setBoard(createBoard);
    setTurn("black");
    setWinner(null);
    setLastMove(null);
  };

  const cellSize = "w-6 h-6 md:w-7 md:h-7";

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full select-none py-2">
      {/* 状态栏 */}
      <div className="flex items-center justify-center gap-4 w-full text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 dark:bg-white" />
          <span className="font-bold text-slate-700 dark:text-slate-300">黑棋</span>
          <span className="font-mono text-slate-500">{blackWins}</span>
        </div>
        <div className="text-slate-400">vs</div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300">白棋</span>
          <span className="font-mono text-slate-500">{whiteWins}</span>
        </div>
      </div>

      {/* 棋盘 */}
      <div className="bg-amber-100 dark:bg-amber-900/40 rounded-xl p-2 md:p-3">
        <div className="relative">
          {/* 网格线 */}
          <div
            className="grid gap-0"
            style={{ gridTemplateColumns: `repeat(${SIZE}, auto)` }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isLast = lastMove && lastMove[0] === r && lastMove[1] === c;
                const isEdge = r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleClick(r, c)}
                    className={`${cellSize} relative flex items-center justify-center ${
                      winner ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`absolute bg-slate-400 dark:bg-slate-600 ${isEdge ? "w-[calc(100%-12px)] h-px" : "w-full h-px"}`} />
                      <div className={`absolute bg-slate-400 dark:bg-slate-600 ${isEdge ? "h-[calc(100%-12px)] w-px" : "h-full w-px"}`} />
                    </div>
                    {/* Star points */}
                    {((r === 3 || r === 7 || r === 11) && (c === 3 || c === 7 || c === 11)) && !cell && (
                      <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-500 pointer-events-none" />
                    )}
                    {/* Stone */}
                    {cell && (
                      <div
                        className={`absolute w-[85%] h-[85%] rounded-full shadow-md transition-all duration-150 ${
                          cell === "black"
                            ? "bg-gradient-to-br from-slate-700 to-slate-900"
                            : "bg-gradient-to-br from-white to-slate-200 border border-slate-300"
                        } ${isLast ? "ring-2 ring-red-400 ring-offset-1" : ""}`}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 当前回合 */}
      {!winner && (
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-3 h-3 rounded-full ${turn === "black" ? "bg-slate-900 dark:bg-white" : "bg-white border-2 border-slate-400"}`} />
          <span className="font-bold text-slate-600 dark:text-slate-400">
            {turn === "black" ? "黑棋落子" : "白棋落子"}
          </span>
        </div>
      )}

      {/* 结果 */}
      {winner && (
        <div className={`text-center p-2 rounded-xl text-xs font-bold ${
          winner === "draw"
            ? "bg-slate-100 dark:bg-slate-800 text-slate-600"
            : winner === "black"
              ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white"
              : "bg-white dark:bg-slate-800 text-slate-600"
        }`}>
          {winner === "draw" ? "平局！" : `${winner === "black" ? "黑棋" : "白棋"}获胜！`}
        </div>
      )}

      <button
        type="button"
        onClick={restart}
        className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 active:scale-95 transition-all"
      >
        新游戏
      </button>

      <div className="text-[10px] text-slate-400">双人对弈 · 五子连珠获胜</div>
    </div>
  );
}
