"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Difficulty = "easy" | "medium" | "hard";

const CONFIG: Record<Difficulty, { rows: number; cols: number; label: string }> = {
  easy: { rows: 3, cols: 4, label: "简单" },
  medium: { rows: 4, cols: 4, label: "中等" },
  hard: { rows: 4, cols: 5, label: "困难" },
};

const EMOJIS = ["🍎","🍊","🍋","🍇","🍉","🍓","🍑","🍒","🥝","🍍","🫐","🍌"];

const STORAGE_KEY = "game-memory-best";

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCards(rows: number, cols: number): Card[] {
  const pairs = (rows * cols) / 2;
  const emojis = EMOJIS.slice(0, pairs);
  const deck = shuffle([...emojis, ...emojis]);
  return deck.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
}

export default function MemoryGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [cards, setCards] = useState<Card[]>(() => createCards(3, 4));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const timerRef = useRef<number | null>(null);
  const lockRef = useRef(false);
  const [bests, setBests] = useState<Record<string, { moves: number; time: number }>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  });

  const { rows, cols } = CONFIG[difficulty];

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    setStarted(true);
    timerRef.current = window.setInterval(() => setTime((t) => t + 1), 1000);
  };

  const saveBest = (m: number, t: number) => {
    setBests((prev) => {
      const key = difficulty;
      const prevBest = prev[key];
      if (prevBest && (m > prevBest.moves || (m === prevBest.moves && t >= prevBest.time))) return prev;
      const next = { ...prev, [key]: { moves: m, time: t } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const newGame = (d?: Difficulty) => {
    const diff = d ?? difficulty;
    const cfg = CONFIG[diff];
    setDifficulty(diff);
    setCards(createCards(cfg.rows, cfg.cols));
    setFlipped([]);
    setMoves(0);
    setTime(0);
    setStarted(false);
    setWon(false);
    stopTimer();
    lockRef.current = false;
  };

  const flippedRef = useRef<number[]>([]);
  flippedRef.current = flipped;

  const handleFlip = (id: number) => {
    if (lockRef.current || won) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    if (!started) startTimer();

    // Immediately flip the card visually
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, flipped: true } : c));

    const newFlipped = [...flippedRef.current, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      const [first, second] = newFlipped;
      setMoves((m) => m + 1);

      // Find emoji from current cards state (synchronous)
      const c1 = cards.find((c) => c.id === first);
      const c2 = card; // the card we just clicked
      const isMatch = c1 && c1.emoji === c2.emoji;

      if (isMatch) {
        setTimeout(() => {
          setCards((prev) => prev.map((c) =>
            c.id === first || c.id === second ? { ...c, matched: true } : c
          ));
          setFlipped([]);
          lockRef.current = false;
        }, 300);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c) =>
            c.id === first || c.id === second ? { ...c, flipped: false } : c
          ));
          setFlipped([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  // Check win
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      setWon(true);
      stopTimer();
      saveBest(moves, time);
    }
  }, [cards, moves, time]);

  useEffect(() => {
    return () => stopTimer();
  }, []);

  const best = bests[difficulty];
  const cellSize = difficulty === "hard"
    ? "w-12 h-12 md:w-14 md:h-14 text-lg md:text-xl"
    : difficulty === "medium"
      ? "w-14 h-14 md:w-16 md:h-16 text-xl md:text-2xl"
      : "w-14 h-16 md:w-16 md:h-[72px] text-xl md:text-2xl";

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
                ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm"
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
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span className="font-mono font-bold">{time}s</span>
        </div>
        <div className="flex items-center gap-1 text-purple-500">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 15l-6-6M9 15l6-6" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span className="font-mono font-bold">{moves}</span>
        </div>
        {best && (
          <div className="flex items-center gap-1 text-amber-500">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="1.5" strokeLinejoin="round" /></svg>
            <span className="font-mono font-bold">{best.moves}步/{best.time}s</span>
          </div>
        )}
      </div>

      {/* 卡牌网格 */}
      <div
        className="grid gap-1.5 md:gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleFlip(card.id)}
            className={`${cellSize} rounded-lg transition-all duration-300 [perspective:600px] active:scale-95`}
          >
            <div
              className={`w-full h-full rounded-lg transition-transform duration-300 [transform-style:preserve-3d] ${
                card.flipped || card.matched ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* 背面 */}
              <div className="absolute inset-0 [backface-visibility:hidden] rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              {/* 正面 */}
              <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg flex items-center justify-center ${
                card.matched ? "bg-green-100 dark:bg-green-900/30" : "bg-white dark:bg-slate-700"
              }`}>
                <span className={card.matched ? "opacity-60" : ""}>{card.emoji}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 结果提示 */}
      {won && (
        <div className="text-center p-2 rounded-xl text-xs font-bold bg-pink-50 dark:bg-pink-900/20 text-pink-600">
          恭喜通关！{moves} 步，用时 {time} 秒
        </div>
      )}

      <button
        type="button"
        onClick={() => newGame()}
        className="px-4 py-1.5 rounded-lg bg-pink-500 text-white text-[10px] font-bold hover:bg-pink-600 active:scale-95 transition-all"
      >
        新游戏
      </button>

      <div className="text-[10px] text-slate-400">翻开卡牌，找出所有配对</div>
    </div>
  );
}
