"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "game-whack-mole-best";
const GRID_ROWS = 3;
const GRID_COLS = 3;
const GAME_DURATION = 30;

type MoleState = "idle" | "up" | "hit" | "escaped";

interface Mole {
  state: MoleState;
  timer: number;
  type: "normal" | "golden" | "bomb";
}

export default function WhackAMoleGame() {
  const [moles, setMoles] = useState<Mole[]>(() => Array(9).fill(null).map(() => ({ state: "idle", timer: 0, type: "normal" })));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [combo, setCombo] = useState(0);


  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const comboTimerRef = useRef(0);
  const timeRef = useRef(GAME_DURATION);
  const startedRef = useRef(false);
  const gameOverRef = useRef(false);
  const molesRef = useRef<Mole[]>(Array(9).fill(null).map(() => ({ state: "idle", timer: 0, type: "normal" })));
  const frameRef = useRef<number | null>(null);
  const spawnTimerRef = useRef(0);
  const difficultyRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
  }, []);

  const initGame = useCallback(() => {
    const empty = Array(9).fill(null).map(() => ({ state: "idle", timer: 0, type: "normal" } as Mole));
    molesRef.current = empty;
    setMoles([...empty]);
    scoreRef.current = 0;
    comboRef.current = 0;
    comboTimerRef.current = 0;
    timeRef.current = GAME_DURATION;
    startedRef.current = false;
    gameOverRef.current = false;
    spawnTimerRef.current = 0;
    difficultyRef.current = 0;
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setStarted(false);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const spawnMole = useCallback(() => {
    const idleIndices = molesRef.current
      .map((m, i) => m.state === "idle" ? i : -1)
      .filter(i => i >= 0);
    if (idleIndices.length === 0) return;

    const idx = idleIndices[Math.floor(Math.random() * idleIndices.length)];
    const r = Math.random();
    const diff = difficultyRef.current;
    let type: Mole["type"] = "normal";
    if (r < 0.08 + diff * 0.01) type = "bomb";
    else if (r < 0.18 + diff * 0.01) type = "golden";

    const upTime = Math.max(0.6, 1.5 - diff * 0.05);

    molesRef.current[idx] = { state: "up", timer: upTime, type };
  }, []);

  const tick = useCallback((dt: number) => {
    if (gameOverRef.current || !startedRef.current) return;

    timeRef.current -= dt;
    if (timeRef.current <= 0) {
      timeRef.current = 0;
      gameOverRef.current = true;
      setGameOver(true);
      setTimeLeft(0);
      setBest((b) => {
        const nb = Math.max(b, scoreRef.current);
        localStorage.setItem(STORAGE_KEY, String(nb));
        return nb;
      });
      return;
    }
    setTimeLeft(Math.ceil(timeRef.current));

    difficultyRef.current = (GAME_DURATION - timeRef.current) / 5;

    // Combo timer
    comboTimerRef.current -= dt;
    if (comboTimerRef.current <= 0) {
      comboRef.current = 0;
      setCombo(0);
    }

    // Spawn moles
    spawnTimerRef.current += dt;
    const spawnInterval = Math.max(0.4, 1.2 - difficultyRef.current * 0.08);
    if (spawnTimerRef.current >= spawnInterval) {
      spawnTimerRef.current = 0;
      spawnMole();
      // Double spawn at higher difficulty
      if (difficultyRef.current > 3 && Math.random() < 0.3) spawnMole();
    }

    // Update moles
    let changed = false;
    for (let i = 0; i < 9; i++) {
      const mole = molesRef.current[i];
      if (mole.state === "up") {
        mole.timer -= dt;
        if (mole.timer <= 0) {
          mole.state = "escaped";
          mole.timer = 0.3;
          changed = true;
        }
      } else if (mole.state === "hit") {
        mole.timer -= dt;
        if (mole.timer <= 0) {
          mole.state = "idle";
          changed = true;
        }
      } else if (mole.state === "escaped") {
        mole.timer -= dt;
        if (mole.timer <= 0) {
          mole.state = "idle";
          changed = true;
        }
      }
    }
    if (changed) setMoles([...molesRef.current]);
  }, [spawnMole]);

  useEffect(() => {
    if (gameOver || !started) return;
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      tick(dt);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [tick, gameOver, started]);

  const whack = (idx: number) => {
    if (gameOverRef.current || !startedRef.current) return;
    const mole = molesRef.current[idx];

    if (mole.state === "up") {
      if (mole.type === "bomb") {
        // Hit bomb - lose points
        scoreRef.current = Math.max(0, scoreRef.current - 30);
        setScore(scoreRef.current);
        comboRef.current = 0;
        setCombo(0);
        mole.state = "hit";
        mole.timer = 0.5;
      } else {
        // Hit mole
        comboRef.current++;
        comboTimerRef.current = 2;
        setCombo(comboRef.current);

        const comboMult = comboRef.current >= 5 ? 3 : comboRef.current >= 3 ? 2 : 1;
        const basePoints = mole.type === "golden" ? 30 : 10;
        const pts = basePoints * comboMult;
        scoreRef.current += pts;
        setScore(scoreRef.current);

        mole.state = "hit";
        mole.timer = 0.3;
      }
      setMoles([...molesRef.current]);
    } else if (!startedRef.current) {
      startedRef.current = true;
      setStarted(true);
    }
  };

  const startGame = () => {
    initGame();
    startedRef.current = true;
    setStarted(true);
  };

  const getMoleEmoji = (mole: Mole) => {
    if (mole.state === "hit") return mole.type === "bomb" ? "💥" : "⭐";
    if (mole.state === "up") {
      if (mole.type === "bomb") return "💣";
      if (mole.type === "golden") return "👑";
      return "🐹";
    }
    if (mole.state === "escaped") return "💨";
    return "";
  };

  const getMoleBg = (mole: Mole) => {
    if (mole.state === "hit") return "bg-yellow-200 dark:bg-yellow-800/50";
    if (mole.state === "up") {
      if (mole.type === "bomb") return "bg-red-100 dark:bg-red-900/30";
      if (mole.type === "golden") return "bg-amber-100 dark:bg-amber-900/30";
      return "bg-green-100 dark:bg-green-900/30";
    }
    return "";
  };

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full select-none py-2">
      {/* Status */}
      <div className="flex items-center justify-center gap-3 w-full">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-1.5 text-center min-w-[60px]">
          <div className="text-[9px] text-amber-600 font-bold">分数</div>
          <div className="text-sm font-black text-amber-700 dark:text-amber-400">{score}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5 text-center min-w-[60px]">
          <div className="text-[9px] text-blue-600 font-bold">时间</div>
          <div className={`text-sm font-black ${timeLeft <= 5 ? "text-red-500" : "text-blue-700 dark:text-blue-400"}`}>{timeLeft}s</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center min-w-[60px]">
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

      {/* Time bar */}
      <div className="w-full max-w-[260px] h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-red-500" : "bg-blue-500"}`}
          style={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
        />
      </div>

      {/* Grid */}
      <div className="bg-amber-800 dark:bg-amber-900 rounded-2xl p-3 shadow-inner">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
          {moles.map((mole, i) => (
            <button
              key={i}
              type="button"
              onClick={() => whack(i)}
              className={`w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center relative overflow-hidden ${
                mole.state === "idle" || mole.state === "escaped"
                  ? "bg-amber-600 dark:bg-amber-800"
                  : getMoleBg(mole)
              }`}
            >
              {/* Hole */}
              <div className="absolute bottom-0 w-full h-3 bg-amber-900 dark:bg-amber-950 rounded-b-xl" />
              {/* Mole */}
              <span className={`text-3xl md:text-4xl transition-transform duration-150 ${
                mole.state === "up" ? "translate-y-0" : mole.state === "hit" ? "scale-75 -translate-y-1" : "translate-y-8"
              }`}>
                {getMoleEmoji(mole)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400">
        <span>🐹 +10</span>
        <span>👑 +30</span>
        <span>💣 -30</span>
      </div>

      {/* Start / Game Over */}
      {!started && !gameOver && (
        <button type="button" onClick={startGame}
          className="px-6 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 active:scale-95 transition-all">
          开始游戏
        </button>
      )}

      {gameOver && (
        <div className="text-center space-y-2">
          <div className="p-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600">
            时间到！得分：{score}
          </div>
          <button type="button" onClick={startGame}
            className="px-6 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 active:scale-95 transition-all">
            再来一局
          </button>
        </div>
      )}

      <div className="text-[10px] text-slate-400">点击冒出的地鼠得分 · 连击加倍</div>
    </div>
  );
}
