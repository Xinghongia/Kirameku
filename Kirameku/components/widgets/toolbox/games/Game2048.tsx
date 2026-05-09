"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SIZE = 4;
const STORAGE_KEY = "game-2048-best";

function createEmpty(): number[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandom(grid: number[][]): number[][] {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map((row) => [...row]);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

// 向左滑动一行：去掉空位，相邻相同合并
function slideRowLeft(row: number[]): { row: number[]; score: number } {
  let arr = row.filter((v) => v !== 0);
  let score = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr.splice(i + 1, 1);
    }
  }
  while (arr.length < SIZE) arr.push(0);
  return { row: arr, score };
}

// 向左移动
function moveLeft(grid: number[][]): { grid: number[][]; score: number; moved: boolean } {
  let total = 0;
  let moved = false;
  const next = grid.map((row) => {
    const { row: newRow, score } = slideRowLeft([...row]);
    total += score;
    if (newRow.some((v, i) => v !== row[i])) moved = true;
    return newRow;
  });
  return { grid: next, score: total, moved };
}

// 向右移动：反转行，向左滑，再反转回来
function moveRight(grid: number[][]): { grid: number[][]; score: number; moved: boolean } {
  let total = 0;
  let moved = false;
  const next = grid.map((row) => {
    const reversed = [...row].reverse();
    const { row: newRow, score } = slideRowLeft(reversed);
    const result = newRow.reverse();
    total += score;
    if (result.some((v, i) => v !== row[i])) moved = true;
    return result;
  });
  return { grid: next, score: total, moved };
}

// 向上移动：提取列，向左滑，写回
function moveUp(grid: number[][]): { grid: number[][]; score: number; moved: boolean } {
  let total = 0;
  let moved = false;
  const next = grid.map((row) => [...row]);
  for (let c = 0; c < SIZE; c++) {
    const col = [];
    for (let r = 0; r < SIZE; r++) col.push(grid[r][c]);
    const { row: newCol, score } = slideRowLeft(col);
    total += score;
    for (let r = 0; r < SIZE; r++) {
      if (newCol[r] !== grid[r][c]) moved = true;
      next[r][c] = newCol[r];
    }
  }
  return { grid: next, score: total, moved };
}

// 向下移动：提取列并反转，向左滑，反转写回
function moveDown(grid: number[][]): { grid: number[][]; score: number; moved: boolean } {
  let total = 0;
  let moved = false;
  const next = grid.map((row) => [...row]);
  for (let c = 0; c < SIZE; c++) {
    const col = [];
    for (let r = SIZE - 1; r >= 0; r--) col.push(grid[r][c]);
    const { row: newCol, score } = slideRowLeft(col);
    total += score;
    const result = newCol.reverse();
    for (let r = 0; r < SIZE; r++) {
      if (result[r] !== grid[r][c]) moved = true;
      next[r][c] = result[r];
    }
  }
  return { grid: next, score: total, moved };
}

function canMove(grid: number[][]): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
  return false;
}

const COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-slate-200 dark:bg-slate-700", text: "text-transparent" },
  2: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-200" },
  4: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-800 dark:text-amber-200" },
  8: { bg: "bg-orange-300 dark:bg-orange-800", text: "text-white" },
  16: { bg: "bg-orange-400 dark:bg-orange-700", text: "text-white" },
  32: { bg: "bg-orange-500", text: "text-white" },
  64: { bg: "bg-red-500", text: "text-white" },
  128: { bg: "bg-yellow-400", text: "text-white" },
  256: { bg: "bg-yellow-500", text: "text-white" },
  512: { bg: "bg-yellow-600", text: "text-white" },
  1024: { bg: "bg-amber-500", text: "text-white" },
  2048: { bg: "bg-amber-600", text: "text-white" },
};

function getStyle(v: number) {
  return COLORS[v] || { bg: "bg-red-700", text: "text-white" };
}

export default function Game2048() {
  const [grid, setGrid] = useState<number[][]>(createEmpty);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
    const g = addRandom(addRandom(createEmpty()));
    setGrid(g);
  }, []);

  const doMove = useCallback((dir: "left" | "right" | "up" | "down") => {
    setGrid((prev) => {
      let result;
      if (dir === "left") result = moveLeft(prev);
      else if (dir === "right") result = moveRight(prev);
      else if (dir === "up") result = moveUp(prev);
      else result = moveDown(prev);

      if (!result.moved) return prev;

      const added = addRandom(result.grid);
      setScore((s) => {
        const next = s + result.score;
        setBest((b) => {
          const newBest = Math.max(b, next);
          localStorage.setItem(STORAGE_KEY, String(newBest));
          return newBest;
        });
        return next;
      });
      if (!canMove(added)) setGameOver(true);
      return added;
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, "left" | "right" | "up" | "down"> = {
        ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
      };
      if (map[e.key]) { e.preventDefault(); doMove(map[e.key]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doMove]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
    touchStart.current = null;
  };

  const restart = () => {
    const g = addRandom(addRandom(createEmpty()));
    setGrid(g);
    setScore(0);
    setGameOver(false);
  };

  return (
    <div
      className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[280px] md:max-w-xs mx-auto select-none py-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 分数 */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 md:p-2 text-center">
          <div className="text-[9px] text-slate-400 font-bold">分数</div>
          <div className="text-sm md:text-base font-black text-slate-800 dark:text-white">{score}</div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 md:p-2 text-center">
          <div className="text-[9px] text-slate-400 font-bold">最高</div>
          <div className="text-sm md:text-base font-black text-amber-500">{best}</div>
        </div>
      </div>

      {/* 网格 */}
      <div className="grid grid-cols-4 gap-1 w-full aspect-square bg-slate-300 dark:bg-slate-700 rounded-lg p-1">
        {grid.flat().map((v, i) => {
          const s = getStyle(v);
          return (
            <div
              key={i}
              className={`flex items-center justify-center aspect-square rounded-md font-black transition-all duration-100 ${s.bg} ${s.text} ${
                v >= 1000 ? "text-xs md:text-sm" : v >= 100 ? "text-sm md:text-base" : "text-base md:text-lg"
              }`}
            >
              {v || ""}
            </div>
          );
        })}
      </div>

      {/* 操作按钮 */}
      <button
        type="button"
        onClick={restart}
        className="w-full py-2 md:py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 active:scale-95 transition-all"
      >
        重新开始
      </button>

      {/* 游戏结束 */}
      {gameOver && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 text-center space-y-3">
            <div className="text-lg font-black text-slate-800 dark:text-white">游戏结束</div>
            <div className="text-sm text-slate-500">得分：{score}</div>
            <button
              type="button"
              onClick={restart}
              className="px-6 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 active:scale-95 transition-all"
            >
              再来一局
            </button>
          </div>
        </div>
      )}

      <div className="text-[10px] text-slate-400">滑动或方向键控制</div>
    </div>
  );
}
