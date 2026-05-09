"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const COLS = 10;
const ROWS = 20;
const STORAGE_KEY = "game-tetris-best";

type Tetromino = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

const SHAPES: Record<Tetromino, number[][][]> = {
  I: [[[1,1,1,1]], [[1],[1],[1],[1]]],
  O: [[[1,1],[1,1]]],
  T: [[[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[1,1,1],[0,1,0]], [[0,1],[1,1],[0,1]]],
  S: [[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]],
  Z: [[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]],
  J: [[[1,0,0],[1,1,1]], [[1,1],[1,0],[1,0]], [[1,1,1],[0,0,1]], [[0,1],[0,1],[1,1]]],
  L: [[[0,0,1],[1,1,1]], [[1,0],[1,0],[1,1]], [[1,1,1],[1,0,0]], [[1,1],[0,1],[0,1]]],
};

const COLORS: Record<Tetromino, string> = {
  I: "bg-cyan-400",
  O: "bg-yellow-400",
  T: "bg-purple-500",
  S: "bg-green-500",
  Z: "bg-red-500",
  J: "bg-blue-500",
  L: "bg-orange-500",
};

function createGrid(): (Tetromino | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomType(): Tetromino {
  const types: Tetromino[] = ["I","O","T","S","Z","J","L"];
  return types[Math.floor(Math.random() * types.length)];
}

interface Piece {
  type: Tetromino;
  rotation: number;
  row: number;
  col: number;
}

function getShape(piece: Piece): number[][] {
  return SHAPES[piece.type][piece.rotation];
}

function isValid(grid: (Tetromino | null)[][], piece: Piece): boolean {
  const shape = getShape(piece);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = piece.row + r, nc = piece.col + c;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
      if (grid[nr][nc]) return false;
    }
  return true;
}

function place(grid: (Tetromino | null)[][], piece: Piece): (Tetromino | null)[][] {
  const newGrid = grid.map((row) => [...row]);
  const shape = getShape(piece);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) newGrid[piece.row + r][piece.col + c] = piece.type;
  return newGrid;
}

function clearLines(grid: (Tetromino | null)[][]): { grid: (Tetromino | null)[][]; lines: number } {
  const kept = grid.filter((row) => row.some((c) => c === null));
  const lines = ROWS - kept.length;
  while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
  return { grid: kept, lines };
}

const LINE_SCORES = [0, 100, 300, 500, 800];

export default function TetrisGame() {
  const [grid, setGrid] = useState<(Tetromino | null)[][]>(createGrid);
  const [current, setCurrent] = useState<Piece>(() => ({ type: randomType(), rotation: 0, row: 0, col: 3 }));
  const [next, setNext] = useState<Tetromino>(randomType);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const dropRef = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const gridRef = useRef(grid);
  const currentRef = useRef(current);
  const nextRef = useRef(next);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const gameOverRef = useRef(false);
  const pausedRef = useRef(false);

  gridRef.current = grid;
  currentRef.current = current;
  nextRef.current = next;
  gameOverRef.current = gameOver;
  pausedRef.current = paused;

  const level = Math.floor(lines / 10);
  const speed = Math.max(100, 500 - level * 40);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
  }, []);

  const saveBest = useCallback((s: number) => {
    setBest((b) => {
      const nb = Math.max(b, s);
      localStorage.setItem(STORAGE_KEY, String(nb));
      return nb;
    });
  }, []);

  const spawn = useCallback((g: (Tetromino | null)[][], nextType: Tetromino) => {
    const newPiece: Piece = { type: nextType, rotation: 0, row: 0, col: 3 };
    if (!isValid(g, newPiece)) {
      setGameOver(true);
      gameOverRef.current = true;
      saveBest(scoreRef.current);
      return null;
    }
    setCurrent(newPiece);
    setNext(randomType());
    return newPiece;
  }, [saveBest]);

  const doDrop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const g = gridRef.current;
    const cur = currentRef.current;
    const nextPiece = { ...cur, row: cur.row + 1 };
    if (isValid(g, nextPiece)) {
      setCurrent(nextPiece);
    } else {
      const placed = place(g, cur);
      const { grid: cleared, lines: clearedLines } = clearLines(placed);
      if (clearedLines > 0) {
        const s = scoreRef.current + LINE_SCORES[clearedLines] * (Math.floor(linesRef.current / 10) + 1);
        scoreRef.current = s;
        setScore(s);
        linesRef.current += clearedLines;
        setLines(linesRef.current);
        saveBest(s);
      }
      setGrid(cleared);
      gridRef.current = cleared;
      spawn(cleared, nextRef.current);
    }
  }, [spawn, saveBest]);

  useEffect(() => {
    dropRef.current = window.setInterval(doDrop, speed);
    return () => { if (dropRef.current) clearInterval(dropRef.current); };
  }, [doDrop, speed]);

  const moveLeft = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = { ...currentRef.current, col: currentRef.current.col - 1 };
    if (isValid(gridRef.current, p)) setCurrent(p);
  }, []);

  const moveRight = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const p = { ...currentRef.current, col: currentRef.current.col + 1 };
    if (isValid(gridRef.current, p)) setCurrent(p);
  }, []);

  const rotate = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const cur = currentRef.current;
    const maxRot = SHAPES[cur.type].length;
    const p = { ...cur, rotation: (cur.rotation + 1) % maxRot };
    if (isValid(gridRef.current, p)) { setCurrent(p); return; }
    const kicks = [1, -1, 2, -2];
    for (const kick of kicks) {
      const pk = { ...p, col: p.col + kick };
      if (isValid(gridRef.current, pk)) { setCurrent(pk); return; }
    }
  }, []);

  const hardDrop = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;
    const g = gridRef.current;
    const cur = currentRef.current;
    let ghostRow = cur.row;
    while (isValid(g, { ...cur, row: ghostRow + 1 })) ghostRow++;
    const dropped = { ...cur, row: ghostRow };
    const placed = place(g, dropped);
    const { grid: cleared, lines: clearedLines } = clearLines(placed);
    if (clearedLines > 0) {
      const s = scoreRef.current + LINE_SCORES[clearedLines] * (Math.floor(linesRef.current / 10) + 1);
      scoreRef.current = s;
      setScore(s);
      linesRef.current += clearedLines;
      setLines(linesRef.current);
      saveBest(s);
    }
    setGrid(cleared);
    gridRef.current = cleared;
    spawn(cleared, nextRef.current);
  }, [spawn, saveBest]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); moveLeft(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); moveRight(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); doDrop(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); rotate(); }
      else if (e.key === " ") { e.preventDefault(); hardDrop(); }
      else if (e.key === "p" || e.key === "P") { e.preventDefault(); setPaused((p) => { pausedRef.current = !p; return !p; }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [moveLeft, moveRight, doDrop, rotate, hardDrop]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) { hardDrop(); touchStart.current = null; return; }
    if (Math.abs(dx) > Math.abs(dy)) { dx > 0 ? moveRight() : moveLeft(); }
    else { dy > 0 ? hardDrop() : rotate(); }
    touchStart.current = null;
  };

  const restart = () => {
    const g = createGrid();
    setGrid(g);
    gridRef.current = g;
    setCurrent({ type: randomType(), rotation: 0, row: 0, col: 3 });
    setNext(randomType());
    scoreRef.current = 0;
    linesRef.current = 0;
    setScore(0);
    setLines(0);
    setGameOver(false);
    setPaused(false);
  };

  const shape = getShape(current);
  const displayGrid = grid.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c] && current.row + r >= 0 && current.row + r < ROWS)
        displayGrid[current.row + r][current.col + c] = current.type;

  const nextShape = SHAPES[next][0];

  return (
    <div
      className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[260px] md:max-w-xs mx-auto select-none py-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 分数栏 */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">分数</div>
          <div className="text-sm font-black text-slate-800 dark:text-white">{score}</div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">行数</div>
          <div className="text-sm font-black text-slate-800 dark:text-white">{lines}</div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">等级</div>
          <div className="text-sm font-black text-cyan-500">{level}</div>
        </div>
        {best > 0 && (
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
            <div className="text-[9px] text-slate-400 font-bold">最高</div>
            <div className="text-sm font-black text-amber-500">{best}</div>
          </div>
        )}
      </div>

      <div className="flex gap-2 w-full">
        {/* 游戏区域 */}
        <div className="bg-slate-800 rounded-lg p-px overflow-hidden">
          <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${COLS}, auto)` }}>
            {displayGrid.map((row, r) =>
              row.map((cell, c) => {
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-5 h-5 md:w-6 md:h-6 rounded-[1px] ${
                      cell ? COLORS[cell] : "bg-slate-900"
                    }`}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* 侧栏：下一个 */}
        <div className="flex flex-col gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2 text-center">
            <div className="text-[9px] text-slate-400 font-bold mb-1">下一个</div>
            <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${nextShape[0].length}, 1fr)` }}>
              {nextShape.map((row, r) =>
                row.map((v, c) => (
                  <div key={`${r}-${c}`} className={`w-3 h-3 rounded-[1px] ${v ? COLORS[next] : "bg-transparent"}`} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 按钮 */}
      <div className="flex gap-2 w-full">
        <button
          type="button"
          onClick={restart}
          className="flex-1 py-1.5 rounded-lg bg-cyan-500 text-white text-[10px] font-bold hover:bg-cyan-600 active:scale-95 transition-all"
        >
          重新开始
        </button>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="flex-1 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all"
        >
          {paused ? "继续" : "暂停"}
        </button>
      </div>

      {/* 操作提示 */}
      <div className="text-[10px] text-slate-400 text-center">方向键移动 · 上键旋转 · 空格硬降 · 滑动操作</div>

      {/* 游戏结束 */}
      {gameOver && (
        <div className="text-center p-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600">
          游戏结束！得分：{score}
        </div>
      )}

      {paused && !gameOver && (
        <div className="text-center p-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600">
          已暂停
        </div>
      )}
    </div>
  );
}
