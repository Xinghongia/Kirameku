"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const ROWS = 8;
const COLS = 8;
const STORAGE_KEY = "game-match3-best";

type GemType = 0 | 1 | 2 | 3 | 4 | 5;

const GEM_EMOJIS = ["🔴","🟢","🔵","🟡","🟣","🟠"];
const GEM_COLORS = ["#ef4444","#22c55e","#3b82f6","#eab308","#a855f7","#f97316"];

interface Gem {
  type: GemType;
  id: number;
}

let nextGemId = 0;

function randomType(): GemType {
  return Math.floor(Math.random() * 6) as GemType;
}

function createGem(): Gem {
  return { type: randomType(), id: nextGemId++ };
}

function createGrid(): Gem[][] {
  const grid: Gem[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      let gem = createGem();
      // Avoid initial matches
      while (
        (c >= 2 && grid[r][c-1].type === gem.type && grid[r][c-2].type === gem.type) ||
        (r >= 2 && grid[r-1][c].type === gem.type && grid[r-2][c].type === gem.type)
      ) {
        gem = createGem();
      }
      grid[r][c] = gem;
    }
  return grid;
}

interface MatchResult {
  matched: Set<string>;
  points: number;
}

function findMatches(grid: Gem[][]): MatchResult {
  const matched = new Set<string>();

  // Horizontal
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS - 2; c++) {
      if (grid[r][c] && grid[r][c+1] && grid[r][c+2] &&
          grid[r][c].type === grid[r][c+1].type && grid[r][c].type === grid[r][c+2].type) {
        matched.add(`${r},${c}`);
        matched.add(`${r},${c+1}`);
        matched.add(`${r},${c+2}`);
      }
    }

  // Vertical
  for (let r = 0; r < ROWS - 2; r++)
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] && grid[r+1][c] && grid[r+2][c] &&
          grid[r][c].type === grid[r+1][c].type && grid[r][c].type === grid[r+2][c].type) {
        matched.add(`${r},${c}`);
        matched.add(`${r+1},${c}`);
        matched.add(`${r+2},${c}`);
      }
    }

  return { matched, points: matched.size * 10 };
}

function applyGravity(grid: Gem[][]): boolean {
  let moved = false;
  for (let c = 0; c < COLS; c++) {
    let emptyRow = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c]) {
        if (r !== emptyRow) {
          grid[emptyRow][c] = grid[r][c];
          grid[r][c] = null!;
          moved = true;
        }
        emptyRow--;
      }
    }
    for (let r = emptyRow; r >= 0; r--) {
      grid[r][c] = createGem();
      moved = true;
    }
  }
  return moved;
}

export default function Match3Game() {
  const [grid, setGrid] = useState<Gem[][]>(createGrid);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [animating, setAnimating] = useState(false);
  const matchedRef = useRef<Set<string>>(new Set());
  const [matchedCells, setMatchedCells] = useState<Set<string>>(new Set());
  const scoreRef = useRef(0);
  const movesRef = useRef(30);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
  }, []);

  const processMatches = useCallback((g: Gem[][], chain: number = 1) => {
    const { matched, points } = findMatches(g);
    if (matched.size === 0) {
      setAnimating(false);
      return;
    }

    setMatchedCells(new Set(matched));
    setCombo(chain);

    setTimeout(() => {
      // Clear matched
      for (const key of matched) {
        const [r, c] = key.split(",").map(Number);
        g[r][c] = null!;
      }
      applyGravity(g);
      setGrid(g.map((row) => [...row]));
      setMatchedCells(new Set());

      const totalPoints = points * chain;
      scoreRef.current += totalPoints;
      setScore(scoreRef.current);

      // Check for cascades
      setTimeout(() => processMatches(g, chain + 1), 200);
    }, 300);
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (animating || gameOver) return;

    if (!selected) {
      setSelected([r, c]);
      return;
    }

    const [sr, sc] = selected;
    if (sr === r && sc === c) {
      setSelected(null);
      return;
    }

    // Check adjacency
    const dr = Math.abs(sr - r);
    const dc = Math.abs(sc - c);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      // Swap
      const newGrid = grid.map((row) => [...row]);
      const temp = newGrid[sr][sc];
      newGrid[sr][sc] = newGrid[r][c];
      newGrid[r][c] = temp;

      // Check if swap creates a match
      const { matched } = findMatches(newGrid);
      if (matched.size > 0) {
        setGrid(newGrid);
        setSelected(null);
        setAnimating(true);
        movesRef.current--;
        setMoves(movesRef.current);
        processMatches(newGrid);

        if (movesRef.current <= 0) {
          setTimeout(() => {
            setGameOver(true);
            setBest((b) => {
              const nb = Math.max(b, scoreRef.current);
              localStorage.setItem(STORAGE_KEY, String(nb));
              return nb;
            });
          }, 1000);
        }
      } else {
        // Invalid swap - flash and deselect
        setSelected(null);
      }
    } else {
      setSelected([r, c]);
    }
  };

  const restart = () => {
    const g = createGrid();
    setGrid(g);
    setSelected(null);
    scoreRef.current = 0;
    movesRef.current = 30;
    setScore(0);
    setMoves(30);
    setGameOver(false);
    setCombo(0);
    setAnimating(false);
    setMatchedCells(new Set());
  };

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full select-none py-2">
      {/* 状态栏 */}
      <div className="flex items-center justify-center gap-3 w-full">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center min-w-[60px]">
          <div className="text-[9px] text-slate-400 font-bold">分数</div>
          <div className="text-sm font-black text-slate-800 dark:text-white">{score}</div>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center min-w-[60px]">
          <div className="text-[9px] text-slate-400 font-bold">步数</div>
          <div className={`text-sm font-black ${moves <= 5 ? "text-red-500" : "text-slate-800 dark:text-white"}`}>{moves}</div>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center min-w-[60px]">
          <div className="text-[9px] text-slate-400 font-bold">最高</div>
          <div className="text-sm font-black text-amber-500">{best}</div>
        </div>
      </div>

      {/* Combo */}
      {combo >= 2 && (
        <div className="text-xs font-bold text-amber-500 animate-bounce">
          {combo}x 连击！
        </div>
      )}

      {/* 网格 */}
      <div className="bg-slate-200 dark:bg-slate-700 rounded-xl p-1">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, auto)` }}>
          {grid.map((row, r) =>
            row.map((gem, c) => {
              const isSelected = selected && selected[0] === r && selected[1] === c;
              const isMatched = matchedCells.has(`${r},${c}`);
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-150 ${
                    isSelected
                      ? "ring-2 ring-blue-400 scale-110 bg-blue-100 dark:bg-blue-900/40"
                      : isMatched
                        ? "scale-90 opacity-50"
                        : "hover:scale-105 active:scale-95"
                  } ${!gem ? "bg-slate-100 dark:bg-slate-800" : ""}`}
                >
                  {gem ? (
                    <span className={isMatched ? "animate-pulse" : ""}>{GEM_EMOJIS[gem.type]}</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 结果 */}
      {gameOver && (
        <div className="text-center p-2 rounded-xl text-xs font-bold bg-pink-50 dark:bg-pink-900/20 text-pink-600">
          步数用完！得分：{score}
        </div>
      )}

      <button type="button" onClick={restart}
        className="px-4 py-1.5 rounded-lg bg-pink-500 text-white text-[10px] font-bold hover:bg-pink-600 active:scale-95 transition-all">
        新游戏
      </button>

      <div className="text-[10px] text-slate-400">交换相邻宝石，三个以上连线消除</div>
    </div>
  );
}
