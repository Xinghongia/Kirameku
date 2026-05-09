"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Difficulty = "easy" | "medium" | "hard";

const CONFIG: Record<Difficulty, { clues: number; label: string }> = {
  easy: { clues: 38, label: "简单" },
  medium: { clues: 30, label: "中等" },
  hard: { clues: 24, label: "困难" },
};

const STORAGE_KEY = "game-sudoku-best";

// ── Generator ──
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValidPlacement(board: number[][], r: number, c: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[r][i] === num) return false;
    if (board[i][c] === num) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++)
      if (board[br + dr][bc + dc] === num) return false;
  return true;
}

function solveSudoku(board: number[][]): boolean {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;
      const nums = shuffle([1,2,3,4,5,6,7,8,9]);
      for (const num of nums) {
        if (isValidPlacement(board, r, c, num)) {
          board[r][c] = num;
          if (solveSudoku(board)) return true;
          board[r][c] = 0;
        }
      }
      return false;
    }
  return true;
}

function generatePuzzle(clues: number): { puzzle: number[][]; solution: number[][] } {
  const solution = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveSudoku(solution);
  const puzzle = solution.map((row) => [...row]);

  const cells = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  let removed = 0;
  const toRemove = 81 - clues;
  for (const [r, c] of cells) {
    if (removed >= toRemove) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    removed++;
  }

  return { puzzle, solution };
}

// ── Component ──
interface Cell {
  value: number;
  given: boolean;
  notes: Set<number>;
  error: boolean;
}

export default function SudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [grid, setGrid] = useState<Cell[][]>(() => initGrid("easy"));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [bests, setBests] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  });

  function initGrid(diff: Difficulty): Cell[][] {
    const { puzzle } = generatePuzzle(CONFIG[diff].clues);
    return puzzle.map((row) =>
      row.map((v) => ({ value: v, given: v !== 0, notes: new Set<number>(), error: false }))
    );
  }

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    setStarted(true);
    timerRef.current = window.setInterval(() => setTime((t) => t + 1), 1000);
  };

  const newGame = (d?: Difficulty) => {
    const diff = d ?? difficulty;
    setDifficulty(diff);
    setGrid(initGrid(diff));
    setSelected(null);
    setNotesMode(false);
    setTime(0);
    setStarted(false);
    setWon(false);
    stopTimer();
  };

  const checkWin = useCallback((g: Cell[][]): boolean => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (g[r][c].value === 0 || g[r][c].error) return false;
    return true;
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (won) return;
    if (!started) startTimer();
    setSelected([r, c]);
  };

  const handleNumber = (num: number) => {
    if (!selected || won) return;
    const [r, c] = selected;
    if (grid[r][c].given) return;

    const newGrid = grid.map((row) => row.map((cell) => ({
      ...cell,
      notes: new Set(cell.notes),
    })));

    if (notesMode) {
      const cell = newGrid[r][c];
      if (cell.value !== 0) return;
      if (cell.notes.has(num)) cell.notes.delete(num);
      else cell.notes.add(num);
    } else {
      newGrid[r][c].value = num;
      newGrid[r][c].notes.clear();
      newGrid[r][c].error = false;

      // Check conflicts
      for (let i = 0; i < 9; i++) {
        if (i !== c && newGrid[r][i].value === num) { newGrid[r][i].error = true; newGrid[r][c].error = true; }
        if (i !== r && newGrid[i][c].value === num) { newGrid[i][c].error = true; newGrid[r][c].error = true; }
      }
      const br = Math.floor(r / 3) * 3;
      const bc = Math.floor(c / 3) * 3;
      for (let dr = 0; dr < 3; dr++)
        for (let dc = 0; dc < 3; dc++) {
          const nr = br + dr, nc = bc + dc;
          if (nr === r && nc === c) continue;
          if (newGrid[nr][nc].value === num) { newGrid[nr][nc].error = true; newGrid[r][c].error = true; }
        }

      // Remove notes that conflict
      if (num !== 0) {
        for (let i = 0; i < 9; i++) {
          newGrid[r][i].notes.delete(num);
          newGrid[i][c].notes.delete(num);
        }
        for (let dr = 0; dr < 3; dr++)
          for (let dc = 0; dc < 3; dc++)
            newGrid[br + dr][bc + dc].notes.delete(num);
      }
    }

    setGrid(newGrid);

    if (!notesMode && checkWin(newGrid)) {
      setWon(true);
      stopTimer();
      setBests((prev) => {
        const key = difficulty;
        const prevBest = prev[key] ?? Infinity;
        if (time >= prevBest) return prev;
        const next = { ...prev, [key]: time };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }
  };

  const handleErase = () => {
    if (!selected || won) return;
    const [r, c] = selected;
    if (grid[r][c].given) return;
    const newGrid = grid.map((row) => row.map((cell) => ({
      ...cell,
      notes: new Set(cell.notes),
    })));
    newGrid[r][c].value = 0;
    newGrid[r][c].error = false;
    setGrid(newGrid);
  };

  useEffect(() => { return () => stopTimer(); }, []);

  // Highlight logic
  const highlightNum = selected ? grid[selected[0]][selected[1]].value : 0;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full select-none py-2">
      {/* 难度 */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
        {(Object.keys(CONFIG) as Difficulty[]).map((d) => (
          <button key={d} type="button" onClick={() => newGame(d)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
              difficulty === d
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}>
            {CONFIG[d].label}
          </button>
        ))}
      </div>

      {/* 状态栏 */}
      <div className="flex items-center justify-center gap-4 w-full text-xs">
        <div className="flex items-center gap-1 text-slate-500">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span className="font-mono font-bold">{formatTime(time)}</span>
        </div>
        {bests[difficulty] != null && (
          <div className="flex items-center gap-1 text-amber-500">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="1.5" strokeLinejoin="round" /></svg>
            <span className="font-mono font-bold">{formatTime(bests[difficulty])}</span>
          </div>
        )}
      </div>

      {/* 棋盘 */}
      <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-px">
        <div className="grid grid-cols-9 gap-px">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selected && selected[0] === r && selected[1] === c;
              const isSameRow = selected && selected[0] === r;
              const isSameCol = selected && selected[1] === c;
              const isSameBox = selected && Math.floor(selected[0] / 3) === Math.floor(r / 3) && Math.floor(selected[1] / 3) === Math.floor(c / 3);
              const isSameNum = highlightNum !== 0 && cell.value === highlightNum;
              const thickRight = c === 2 || c === 5;
              const thickBottom = r === 2 || r === 5;

              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center relative transition-colors ${
                    isSelected
                      ? "bg-blue-200 dark:bg-blue-800"
                      : isSameNum
                        ? "bg-blue-100 dark:bg-blue-900/40"
                        : isSameRow || isSameCol || isSameBox
                          ? "bg-slate-100 dark:bg-slate-700/50"
                          : "bg-white dark:bg-slate-800"
                  } ${thickRight ? "border-r-2 border-r-slate-400 dark:border-r-slate-500" : ""} ${thickBottom ? "border-b-2 border-b-slate-400 dark:border-b-slate-500" : ""}`}
                >
                  {cell.value !== 0 ? (
                    <span className={`text-sm md:text-base font-bold ${
                      cell.given
                        ? "text-slate-800 dark:text-white"
                        : cell.error
                          ? "text-red-500"
                          : "text-blue-600 dark:text-blue-400"
                    }`}>
                      {cell.value}
                    </span>
                  ) : cell.notes.size > 0 ? (
                    <div className="grid grid-cols-3 gap-0 leading-none">
                      {[1,2,3,4,5,6,7,8,9].map((n) => (
                        <span key={n} className={`text-[6px] md:text-[7px] text-slate-400 ${cell.notes.has(n) ? "visible" : "invisible"}`}>
                          {n}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 数字键盘 + 操作 */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        <div className="flex gap-1">
          {[1,2,3,4,5,6,7,8,9].map((n) => (
            <button key={n} type="button" onClick={() => handleNumber(n)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 transition-all">
              {n}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleErase}
            className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all">
            擦除
          </button>
          <button type="button" onClick={() => setNotesMode(!notesMode)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold active:scale-95 transition-all ${
              notesMode
                ? "bg-amber-500 text-white"
                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
            }`}>
            笔记 {notesMode ? "ON" : "OFF"}
          </button>
          <button type="button" onClick={() => newGame()}
            className="px-3 py-1 rounded-lg bg-blue-500 text-white text-[10px] font-bold hover:bg-blue-600 active:scale-95 transition-all">
            新游戏
          </button>
        </div>
      </div>

      {won && (
        <div className="text-center p-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600">
          恭喜通关！用时 {formatTime(time)}
        </div>
      )}
    </div>
  );
}
