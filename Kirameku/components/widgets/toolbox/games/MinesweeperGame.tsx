"use client";

import { useState, useCallback, useRef } from "react";

type Difficulty = "easy" | "medium" | "hard";

const CONFIG: Record<Difficulty, { rows: number; cols: number; mines: number; label: string }> = {
  easy: { rows: 9, cols: 9, mines: 10, label: "初级" },
  medium: { rows: 16, cols: 16, mines: 40, label: "中级" },
  hard: { rows: 16, cols: 30, mines: 99, label: "高级" },
};

const STORAGE_KEY = "game-minesweeper-best";

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  count: number;
}

function createBoard(rows: number, cols: number, mines: number, safeR?: number, safeC?: number): Cell[][] {
  const board: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, count: 0 }))
  );

  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (board[r][c].mine) continue;
    if (safeR !== undefined && Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    board[r][c].mine = true;
    placed++;
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let cnt = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) cnt++;
        }
      board[r][c].count = cnt;
    }

  return board;
}

function reveal(board: Cell[][], r: number, c: number): void {
  const rows = board.length, cols = board[0].length;
  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
  if (board[r][c].revealed || board[r][c].flagged) return;
  board[r][c].revealed = true;
  if (board[r][c].count === 0 && !board[r][c].mine) {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if (dr !== 0 || dc !== 0) reveal(board, r + dr, c + dc);
  }
}

const NUM_COLORS = ["", "text-blue-500", "text-green-600", "text-red-500", "text-purple-600", "text-amber-600", "text-cyan-500", "text-slate-500", "text-slate-400"];

export default function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<Cell[][]>(() => createBoard(9, 9, 10));
  const [state, setState] = useState<"playing" | "won" | "lost">("playing");
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<number | null>(null);
  const longPressRef = useRef<number | null>(null);
  const [bests, setBests] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  });

  const { rows, cols, mines, label } = CONFIG[difficulty];

  const startTimer = () => {
    if (timerRef.current) return;
    setStarted(true);
    timerRef.current = window.setInterval(() => setTime((t) => t + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const saveBest = (t: number) => {
    setBests((prev) => {
      const key = difficulty;
      const prevBest = prev[key] ?? Infinity;
      if (t >= prevBest) return prev;
      const next = { ...prev, [key]: t };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const newGame = (d?: Difficulty) => {
    const diff = d ?? difficulty;
    const cfg = CONFIG[diff];
    setDifficulty(diff);
    setBoard(createBoard(cfg.rows, cfg.cols, cfg.mines));
    setState("playing");
    setFlagCount(0);
    setTime(0);
    setStarted(false);
    stopTimer();
  };

  const handleReveal = (r: number, c: number) => {
    if (state !== "playing") return;
    const cell = board[r][c];
    if (cell.revealed || cell.flagged) return;

    let newBoard: Cell[][];
    if (!started) {
      newBoard = createBoard(rows, cols, mines, r, c);
      startTimer();
    } else {
      newBoard = board.map((row) => row.map((c) => ({ ...c })));
    }

    if (newBoard[r][c].mine) {
      newBoard.forEach((row) => row.forEach((c) => { if (c.mine) c.revealed = true; }));
      setBoard(newBoard);
      setState("lost");
      stopTimer();
      return;
    }

    reveal(newBoard, r, c);

    const unrevealed = newBoard.flat().filter((c) => !c.revealed).length;
    if (unrevealed === mines) {
      newBoard.forEach((row) => row.forEach((c) => { if (c.mine) c.flagged = true; }));
      setBoard(newBoard);
      setState("won");
      stopTimer();
      saveBest(time);
      return;
    }

    setBoard(newBoard);
  };

  const handleFlag = (r: number, c: number) => {
    if (state !== "playing") return;
    const cell = board[r][c];
    if (cell.revealed) return;
    const newBoard = board.map((row) => row.map((c) => ({ ...c })));
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setBoard(newBoard);
    setFlagCount((f) => f + (newBoard[r][c].flagged ? 1 : -1));
  };

  // Long press for mobile flagging
  const handleTouchStart = (r: number, c: number) => {
    longPressRef.current = window.setTimeout(() => {
      handleFlag(r, c);
      longPressRef.current = null;
    }, 400);
  };

  const handleTouchEnd = (r: number, c: number) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
      handleReveal(r, c);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    handleFlag(r, c);
  };

  const cellSize = difficulty === "hard"
    ? "w-4 h-4 md:w-5 md:h-5 text-[7px] md:text-[8px]"
    : difficulty === "medium"
      ? "w-5 h-5 md:w-6 md:h-6 text-[8px] md:text-[9px]"
      : "w-6 h-6 md:w-7 md:h-7 text-[9px] md:text-xs";

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full select-none py-2">
      {/* 难度选择 */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
        {(Object.keys(CONFIG) as Difficulty[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => newGame(d)}
            className={`px-2.5 md:px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${
              difficulty === d
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {CONFIG[d].label}
          </button>
        ))}
      </div>

      {/* 状态栏 */}
      <div className="flex items-center justify-center gap-4 w-full text-xs">
        <div className="flex items-center gap-1 text-slate-500">
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span className="font-mono font-bold">{time}s</span>
        </div>
        <div className="flex items-center gap-1 text-red-500">
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5" strokeWidth="1.5" /><line x1="12" y1="3" x2="12" y2="7" strokeWidth="1.5" strokeLinecap="round" /><line x1="12" y1="17" x2="12" y2="21" strokeWidth="1.5" strokeLinecap="round" /><line x1="3" y1="12" x2="7" y2="12" strokeWidth="1.5" strokeLinecap="round" /><line x1="17" y1="12" x2="21" y2="12" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span className="font-mono font-bold">{mines - flagCount}</span>
        </div>
        {bests[difficulty] != null && (
          <div className="flex items-center gap-1 text-amber-500">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="1.5" strokeLinejoin="round" /></svg>
            <span className="font-mono font-bold">{bests[difficulty]}s</span>
          </div>
        )}
      </div>

      {/* 棋盘 */}
      <div className="overflow-auto max-w-full">
        <div
          className="inline-grid gap-px bg-slate-300 dark:bg-slate-600 rounded-lg p-px"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => handleReveal(r, c)}
                onContextMenu={(e) => handleContextMenu(e, r, c)}
                onTouchStart={() => handleTouchStart(r, c)}
                onTouchEnd={() => handleTouchEnd(r, c)}
                className={`flex items-center justify-center font-black ${cellSize} transition-colors ${
                  cell.revealed
                    ? cell.mine
                      ? "bg-red-200 dark:bg-red-900/40"
                      : "bg-slate-50 dark:bg-slate-800"
                    : cell.flagged
                      ? "bg-amber-200 dark:bg-amber-900/40"
                      : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:bg-slate-400"
                }`}
              >
                {cell.revealed ? (
                  cell.mine ? "💥" : cell.count > 0 ? (
                    <span className={NUM_COLORS[cell.count]}>{cell.count}</span>
                  ) : ""
                ) : cell.flagged ? "🚩" : ""}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 结果提示 */}
      {state !== "playing" && (
        <div className={`text-center p-2 md:p-3 rounded-xl text-xs md:text-sm font-bold ${
          state === "won" ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-red-50 dark:bg-red-900/20 text-red-600"
        }`}>
          {state === "won" ? `恭喜通关！用时 ${time} 秒` : "踩到地雷了！"}
        </div>
      )}

      <button
        type="button"
        onClick={() => newGame()}
        className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-[10px] font-bold hover:bg-indigo-600 active:scale-95 transition-all"
      >
        新游戏
      </button>

      <div className="text-[10px] text-slate-400">点击揭开 / 右键或长按标旗</div>
    </div>
  );
}
