"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const GRID = 20;
const CELL = 18;
const SIZE = GRID * CELL;
const STORAGE_KEY = "game-snake-best";
const BASE_SPEED = 130; // ms per tick at start

type Dir = "up" | "down" | "left" | "right";
type Pos = { x: number; y: number };

interface Food {
  pos: Pos;
  type: "normal" | "golden" | "slow" | "ghost";
  ttl?: number; // seconds, undefined = permanent
}

interface Wall {
  pos: Pos;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string;
}

const FOOD_DEFS: Record<string, { points: number; grow: number; color: string; glow: string; chance: number; label: string }> = {
  normal: { points: 10, grow: 1, color: "#ef4444", glow: "rgba(239,68,68,0.4)", chance: 0.7, label: "" },
  golden: { points: 30, grow: 1, color: "#f59e0b", glow: "rgba(245,158,11,0.5)", chance: 0.15, label: "★" },
  slow:   { points: 10, grow: 1, color: "#3b82f6", glow: "rgba(59,130,246,0.4)", chance: 0.08, label: "❄" },
  ghost:  { points: 10, grow: 0, color: "#a855f7", glow: "rgba(168,85,247,0.4)", chance: 0.07, label: "👻" },
};

function randomFood(snake: Pos[], walls: Wall[], foods: Food[]): Food {
  const occupied = new Set([
    ...snake.map((p) => `${p.x},${p.y}`),
    ...walls.map((w) => `${w.pos.x},${w.pos.y}`),
    ...foods.map((f) => `${f.pos.x},${f.pos.y}`),
  ]);
  let pos: Pos;
  let tries = 0;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    tries++;
    if (tries > 500) break;
  } while (occupied.has(`${pos.x},${pos.y}`));

  // Pick type by weighted chance
  const r = Math.random();
  let cum = 0;
  let type: Food["type"] = "normal";
  for (const [t, def] of Object.entries(FOOD_DEFS)) {
    cum += def.chance;
    if (r < cum) { type = t as Food["type"]; break; }
  }

  return { pos, type, ttl: type === "golden" ? 8 : type === "slow" || type === "ghost" ? 10 : undefined };
}

function randomWall(snake: Pos[], walls: Wall[], foods: Food[]): Pos | null {
  const occupied = new Set([
    ...snake.map((p) => `${p.x},${p.y}`),
    ...walls.map((w) => `${w.pos.x},${w.pos.y}`),
    ...foods.map((f) => `${f.pos.x},${f.pos.y}`),
  ]);
  // Don't place walls too close to center (where snake starts)
  for (let i = 0; i < 200; i++) {
    const pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    if (occupied.has(`${pos.x},${pos.y}`)) continue;
    if (Math.abs(pos.x - 10) < 4 && Math.abs(pos.y - 10) < 4) continue;
    return pos;
  }
  return null;
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dirRef = useRef<Dir>("right");
  const nextDirRef = useRef<Dir>("right");
  const snakeRef = useRef<Pos[]>([{ x: 5, y: 10 }]);
  const foodsRef = useRef<Food[]>([]);
  const wallsRef = useRef<Wall[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(true);
  const [started, setStarted] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const tickRef = useRef<number | null>(null);
  const ghostRef = useRef(0);
  const slowRef = useRef(0);
  const comboRef = useRef(0);
  const comboTimerRef = useRef(0);
  const wallTimerRef = useRef(0);
  const animRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
  }, []);

  const getSpeed = useCallback(() => {
    const scoreBonus = Math.min(scoreRef.current / 10, 40);
    const slowBonus = slowRef.current > 0 ? 40 : 0;
    return Math.max(50, BASE_SPEED - scoreBonus + slowBonus);
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      particlesRef.current.push({
        x: x * CELL + CELL / 2,
        y: y * CELL + CELL / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.4,
        color,
      });
    }
  }, []);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Grid dots
    ctx.fillStyle = "rgba(51,65,85,0.3)";
    for (let r = 0; r < GRID; r++)
      for (let c = 0; c < GRID; c++)
        ctx.fillRect(c * CELL + CELL / 2 - 0.5, r * CELL + CELL / 2 - 0.5, 1, 1);

    // Walls
    wallsRef.current.forEach((w) => {
      ctx.fillStyle = "#475569";
      ctx.fillRect(w.pos.x * CELL + 1, w.pos.y * CELL + 1, CELL - 2, CELL - 2);
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1;
      ctx.strokeRect(w.pos.x * CELL + 1, w.pos.y * CELL + 1, CELL - 2, CELL - 2);
    });

    // Food
    const time = Date.now() / 1000;
    foodsRef.current.forEach((f) => {
      const def = FOOD_DEFS[f.type];
      const cx = f.pos.x * CELL + CELL / 2;
      const cy = f.pos.y * CELL + CELL / 2;
      const pulse = 1 + Math.sin(time * 4) * 0.15;
      const r = (CELL / 2 - 3) * pulse;

      // Glow
      ctx.fillStyle = def.glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Label
      if (def.label) {
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${CELL * 0.45}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(def.label, cx, cy);
      }

      // TTL indicator
      if (f.ttl !== undefined) {
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (f.ttl / (f.type === "golden" ? 8 : 10))));
        ctx.stroke();
      }
    });

    // Snake
    const snake = snakeRef.current;
    const isGhost = ghostRef.current > 0;

    // Trail effect
    if (snake.length > 1) {
      for (let i = snake.length - 1; i >= Math.max(0, snake.length - 4); i--) {
        const alpha = ((snake.length - i) / 4) * 0.1;
        ctx.fillStyle = isGhost ? `rgba(168,85,247,${alpha})` : `rgba(16,185,129,${alpha})`;
        ctx.fillRect(snake[i].x * CELL + 2, snake[i].y * CELL + 2, CELL - 4, CELL - 4);
      }
    }

    snake.forEach((p, i) => {
      const x = p.x * CELL;
      const y = p.y * CELL;
      const ratio = i / snake.length;

      if (i === 0) {
        // Head
        ctx.fillStyle = isGhost ? "#c084fc" : "#10b981";
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, CELL - 2, CELL - 2, 5);
        ctx.fill();

        // Eyes
        const dir = dirRef.current;
        let ex1: number, ey1: number, ex2: number, ey2: number;
        if (dir === "right") { ex1 = x + 12; ey1 = y + 5; ex2 = x + 12; ey2 = y + 12; }
        else if (dir === "left") { ex1 = x + 5; ey1 = y + 5; ex2 = x + 5; ey2 = y + 12; }
        else if (dir === "up") { ex1 = x + 5; ey1 = y + 5; ex2 = x + 12; ey2 = y + 5; }
        else { ex1 = x + 5; ey1 = y + 12; ex2 = x + 12; ey2 = y + 12; }
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(ex1, ey1, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey2, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.beginPath(); ctx.arc(ex1, ey1, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey2, 1.2, 0, Math.PI * 2); ctx.fill();
      } else {
        // Body - gradient from green to teal
        const g = Math.round(185 - ratio * 60);
        const b = Math.round(129 - ratio * 40);
        ctx.fillStyle = isGhost
          ? `rgba(${160 + ratio * 40}, ${85 + ratio * 40}, ${200 + ratio * 30}, 0.7)`
          : `rgb(16, ${g}, ${b})`;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, CELL - 4, CELL - 4, 3);
        ctx.fill();
      }
    });

    // Particles
    particlesRef.current.forEach((pt) => {
      const alpha = pt.life / pt.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5 * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // HUD overlay
    if (ghostRef.current > 0) {
      ctx.fillStyle = "rgba(168,85,247,0.15)";
      ctx.fillRect(0, 0, SIZE, SIZE);
    }

    // Combo display
    if (comboRef.current >= 3) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${comboRef.current}x`, SIZE / 2, 6);
    }
  }, []);

  const tick = useCallback(() => {
    dirRef.current = nextDirRef.current;
    const snake = snakeRef.current;
    const head = { ...snake[0] };

    if (dirRef.current === "up") head.y--;
    else if (dirRef.current === "down") head.y++;
    else if (dirRef.current === "left") head.x--;
    else head.x++;

    // Wall wrapping (ghost mode) or collision
    const isGhost = ghostRef.current > 0;
    if (isGhost) {
      if (head.x < 0) head.x = GRID - 1;
      if (head.x >= GRID) head.x = 0;
      if (head.y < 0) head.y = GRID - 1;
      if (head.y >= GRID) head.y = 0;
    } else {
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        setGameOver(true); setRunning(false); return;
      }
    }

    // Obstacle collision
    if (!isGhost && wallsRef.current.some((w) => w.pos.x === head.x && w.pos.y === head.y)) {
      setGameOver(true); setRunning(false); return;
    }

    // Self collision
    if (!isGhost && snake.some((p) => p.x === head.x && p.y === head.y)) {
      setGameOver(true); setRunning(false); return;
    }

    const newSnake = [head, ...snake];

    // Food collision
    let ate = false;
    for (let i = foodsRef.current.length - 1; i >= 0; i--) {
      const f = foodsRef.current[i];
      if (head.x === f.pos.x && head.y === f.pos.y) {
        const def = FOOD_DEFS[f.type];
        scoreRef.current += def.points;
        setScore(scoreRef.current);
        setBest((b) => {
          const nb = Math.max(b, scoreRef.current);
          localStorage.setItem(STORAGE_KEY, String(nb));
          return nb;
        });
        spawnParticles(head.x, head.y, def.color);

        // Combo
        comboRef.current++;
        comboTimerRef.current = 2;

        // Apply effects
        if (f.type === "slow") slowRef.current = 5;
        if (f.type === "ghost") ghostRef.current = 6;

        // Grow
        for (let g = 0; g < def.grow; g++) newSnake.push({ ...newSnake[newSnake.length - 1] });

        foodsRef.current.splice(i, 1);
        ate = true;
        break;
      }
    }

    if (!ate) newSnake.pop();

    snakeRef.current = newSnake;
  }, [spawnParticles]);

  // Game loop
  useEffect(() => {
    if (!running || !started) return;

    const loop = () => {
      tick();

      // Update particles
      const dt = getSpeed() / 1000;
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) particlesRef.current.splice(i, 1);
      }

      // Update power-up timers
      if (ghostRef.current > 0) ghostRef.current = Math.max(0, ghostRef.current - dt);
      if (slowRef.current > 0) slowRef.current = Math.max(0, slowRef.current - dt);
      comboTimerRef.current -= dt;
      if (comboTimerRef.current <= 0) comboRef.current = 0;

      // Food TTL
      for (let i = foodsRef.current.length - 1; i >= 0; i--) {
        const f = foodsRef.current[i];
        if (f.ttl !== undefined) {
          f.ttl -= dt;
          if (f.ttl <= 0) foodsRef.current.splice(i, 1);
        }
      }

      // Spawn walls progressively
      wallTimerRef.current += dt;
      if (wallTimerRef.current >= 15 && wallsRef.current.length < 12) {
        wallTimerRef.current = 0;
        const w = randomWall(snakeRef.current, wallsRef.current, foodsRef.current);
        if (w) wallsRef.current.push({ pos: w });
      }

      // Ensure at least one food exists
      if (foodsRef.current.length === 0) {
        foodsRef.current.push(randomFood(snakeRef.current, wallsRef.current, foodsRef.current));
      }
      // Spawn extra food occasionally
      if (foodsRef.current.length < 3 && Math.random() < 0.02) {
        foodsRef.current.push(randomFood(snakeRef.current, wallsRef.current, foodsRef.current));
      }

      draw();
      tickRef.current = window.setTimeout(loop, getSpeed());
    };

    tickRef.current = window.setTimeout(loop, getSpeed());
    return () => { if (tickRef.current) clearTimeout(tickRef.current); };
  }, [running, started, tick, draw, getSpeed]);

  // Animation frame for smooth rendering
  useEffect(() => {
    const animate = () => {
      draw();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [draw]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      const opp: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
      if (d !== opp[dirRef.current]) nextDirRef.current = d;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 15) return;
    const opp: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
    let d: Dir;
    if (Math.abs(dx) > Math.abs(dy)) d = dx > 0 ? "right" : "left";
    else d = dy > 0 ? "down" : "up";
    if (d !== opp[dirRef.current]) nextDirRef.current = d;
    touchStart.current = null;
  };

  const startGame = () => {
    snakeRef.current = [{ x: 5, y: 10 }];
    foodsRef.current = [randomFood([{ x: 5, y: 10 }], [], [])];
    wallsRef.current = [];
    particlesRef.current = [];
    dirRef.current = "right";
    nextDirRef.current = "right";
    scoreRef.current = 0;
    ghostRef.current = 0;
    slowRef.current = 0;
    comboRef.current = 0;
    comboTimerRef.current = 0;
    wallTimerRef.current = 0;
    setScore(0);
    setGameOver(false);
    setRunning(true);
    setStarted(true);
  };

  const restart = () => {
    startGame();
  };

  return (
    <div
      className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[280px] md:max-w-md mx-auto select-none py-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Score */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">分数</div>
          <div className="text-sm font-black text-slate-800 dark:text-white">{score}</div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">长度</div>
          <div className="text-sm font-black text-green-500">{snakeRef.current.length}</div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">最高</div>
          <div className="text-sm font-black text-amber-500">{best}</div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-slate-900 w-full aspect-square">
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="block w-full h-full" />
        {!started && !gameOver && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl px-6 py-4 text-center space-y-2">
              <div className="text-sm font-black text-slate-800 dark:text-white">贪吃蛇</div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <div>🍎 红色 +10 · ⭐ 金色 +30</div>
                <div>❄ 蓝色减速 · 👻 紫色穿墙</div>
              </div>
              <button type="button" onClick={startGame}
                className="px-5 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 active:scale-95 transition-all">
                开始游戏
              </button>
            </div>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 text-center space-y-3">
              <div className="text-lg font-black text-slate-800 dark:text-white">游戏结束</div>
              <div className="text-sm text-slate-500">得分：{score} · 长度：{snakeRef.current.length}</div>
              <button type="button" onClick={restart}
                className="px-6 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 active:scale-95 transition-all">
                再来一局
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Power-up status */}
      <div className="flex items-center justify-center gap-3 w-full text-[10px]">
        {ghostRef.current > 0 && (
          <span className="text-purple-500 font-bold">👻 穿墙 {ghostRef.current.toFixed(0)}s</span>
        )}
        {slowRef.current > 0 && (
          <span className="text-blue-500 font-bold">❄ 减速 {slowRef.current.toFixed(0)}s</span>
        )}
      </div>

      <button type="button" onClick={restart}
        className="w-full py-1.5 rounded-lg bg-green-500 text-white text-[10px] font-bold hover:bg-green-600 active:scale-95 transition-all">
        重新开始
      </button>

      <div className="text-[10px] text-slate-400">滑动或方向键控制</div>
    </div>
  );
}
