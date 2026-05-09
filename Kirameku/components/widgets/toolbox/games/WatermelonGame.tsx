"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "game-watermelon-best";
const W = 320;
const H = 500;
const WALL_Y = 80; // drop zone top
const GRAVITY = 600;
const DAMPING = 0.6;
const FRICTION = 0.995;
const RESTITUTION = 0.4;

interface Fruit {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  type: number;
  settled: boolean;
}

const FRUIT_DEFS = [
  { r: 14, emoji: "🍇", color: "#8b5cf6", score: 1 },
  { r: 20, emoji: "🍊", color: "#f97316", score: 2 },
  { r: 26, emoji: "🍋", color: "#eab308", score: 4 },
  { r: 32, emoji: "🥝", color: "#84cc16", score: 8 },
  { r: 38, emoji: "🍅", color: "#ef4444", score: 16 },
  { r: 44, emoji: "🍑", color: "#fb923c", score: 32 },
  { r: 50, emoji: "🍎", color: "#dc2626", score: 64 },
  { r: 56, emoji: "🍐", color: "#a3e635", score: 128 },
  { r: 62, emoji: "🥥", color: "#92400e", score: 256 },
  { r: 70, emoji: "🍈", color: "#22c55e", score: 512 },
  { r: 80, emoji: "🍉", color: "#16a34a", score: 1024 },
];

let nextId = 0;

function circleOverlap(a: Fruit, b: Fruit): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy < (a.r + b.r) * (a.r + b.r);
}

function resolveCollision(a: Fruit, b: Fruit) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = a.r + b.r - dist;

  // Separate
  const totalMass = a.r * a.r + b.r * b.r;
  const aRatio = (b.r * b.r) / totalMass;
  const bRatio = (a.r * a.r) / totalMass;
  a.x -= nx * overlap * aRatio;
  a.y -= ny * overlap * aRatio;
  b.x += nx * overlap * bRatio;
  b.y += ny * overlap * bRatio;

  // Elastic impulse
  const dvx = a.vx - b.vx;
  const dvy = a.vy - b.vy;
  const dvDotN = dvx * nx + dvy * ny;
  if (dvDotN > 0) return;

  const impulse = (1 + RESTITUTION) * dvDotN / (1 / (a.r * a.r) + 1 / (b.r * b.r));
  a.vx -= impulse * nx / (a.r * a.r);
  a.vy -= impulse * ny / (a.r * a.r);
  b.vx += impulse * nx / (b.r * b.r);
  b.vy += impulse * ny / (b.r * b.r);
}

export default function WatermelonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const fruitsRef = useRef<Fruit[]>([]);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const dropX = useRef(W / 2);
  const dropType = useRef(0);
  const frameRef = useRef<number | null>(null);
  const dropCooldown = useRef(0);
  const touchRef = useRef<number | null>(null);
  const nextTypeRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
    dropType.current = Math.floor(Math.random() * 5);
    nextTypeRef.current = Math.floor(Math.random() * 5);
  }, []);

  const spawnFruit = useCallback((x: number, type: number) => {
    const def = FRUIT_DEFS[type];
    fruitsRef.current.push({
      id: nextId++,
      x, y: WALL_Y + def.r,
      vx: 0, vy: 0,
      r: def.r, type,
      settled: false,
    });
  }, []);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#fef3c7");
    grad.addColorStop(1, "#fde68a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Walls
    ctx.fillStyle = "#92400e";
    ctx.fillRect(0, WALL_Y - 4, 4, H - WALL_Y + 4);
    ctx.fillRect(W - 4, WALL_Y - 4, 4, H - WALL_Y + 4);
    ctx.fillRect(0, H - 4, W, 4);

    // Drop zone line
    ctx.strokeStyle = "rgba(148,163,184,0.3)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, WALL_Y);
    ctx.lineTo(W, WALL_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Preview fruit (next to drop)
    const previewDef = FRUIT_DEFS[nextTypeRef.current];
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = previewDef.color;
    ctx.beginPath();
    ctx.arc(dropX.current, WALL_Y / 2, previewDef.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${previewDef.r}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(previewDef.emoji, dropX.current, WALL_Y / 2);
    ctx.globalAlpha = 1;

    // Drop indicator line
    ctx.strokeStyle = "rgba(148,163,184,0.2)";
    ctx.beginPath();
    ctx.moveTo(dropX.current, WALL_Y);
    ctx.lineTo(dropX.current, H);
    ctx.stroke();

    // Fruits
    fruitsRef.current.forEach((f) => {
      const def = FRUIT_DEFS[f.type];
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.beginPath();
      ctx.ellipse(f.x + 2, f.y + 2, f.r, f.r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.arc(f.x - f.r * 0.25, f.y - f.r * 0.25, f.r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Emoji
      ctx.font = `${Math.max(12, f.r * 0.9)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(def.emoji, f.x, f.y + 1);
    });

    // Score
    ctx.fillStyle = "#92400e";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${scoreRef.current}`, W / 2, WALL_Y / 2 + previewDef.r + 16);
  }, []);

  const tick = useCallback((dt: number) => {
    if (gameOverRef.current) return;

    const fruits = fruitsRef.current;
    dropCooldown.current = Math.max(0, dropCooldown.current - dt);

    // Physics
    fruits.forEach((f) => {
      f.vy += GRAVITY * dt;
      f.vx *= FRICTION;
      f.vy *= FRICTION;
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      // Wall collision
      if (f.x - f.r < 4) { f.x = 4 + f.r; f.vx = Math.abs(f.vx) * DAMPING; }
      if (f.x + f.r > W - 4) { f.x = W - 4 - f.r; f.vx = -Math.abs(f.vx) * DAMPING; }
      if (f.y + f.r > H - 4) { f.y = H - 4 - f.r; f.vy = -Math.abs(f.vy) * DAMPING; }

      // Settled check
      f.settled = Math.abs(f.vx) < 2 && Math.abs(f.vy) < 2 && f.y + f.r >= H - 6;
    });

    // Circle-circle collision & merge
    const toRemove = new Set<number>();
    const toAdd: Fruit[] = [];

    for (let i = 0; i < fruits.length; i++) {
      if (toRemove.has(fruits[i].id)) continue;
      for (let j = i + 1; j < fruits.length; j++) {
        if (toRemove.has(fruits[j].id)) continue;
        const a = fruits[i];
        const b = fruits[j];
        if (!circleOverlap(a, b)) continue;

        // Merge check
        if (a.type === b.type && a.type < FRUIT_DEFS.length - 1) {
          const newType = a.type + 1;
          const newR = FRUIT_DEFS[newType].r;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          toRemove.add(a.id);
          toRemove.add(b.id);
          toAdd.push({
            id: nextId++,
            x: mx, y: my,
            vx: (a.vx + b.vx) * 0.5,
            vy: (a.vy + b.vy) * 0.5 - 50,
            r: newR, type: newType,
            settled: false,
          });
          scoreRef.current += FRUIT_DEFS[newType].score;
          setScore(scoreRef.current);
        } else {
          resolveCollision(a, b);
        }
      }
    }

    fruitsRef.current = fruits.filter((f) => !toRemove.has(f.id));
    fruitsRef.current.push(...toAdd);

    // Game over check: if any settled fruit is above the wall line
    const dangerFruits = fruitsRef.current.filter((f) => f.settled && f.y - f.r < WALL_Y);
    if (dangerFruits.length >= 2) {
      gameOverRef.current = true;
      setGameOver(true);
      setBest((b) => {
        const nb = Math.max(b, scoreRef.current);
        localStorage.setItem(STORAGE_KEY, String(nb));
        return nb;
      });
    }
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      tick(dt);
      draw();
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [tick, draw]);

  // Mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dropX.current = Math.max(20, Math.min(W - 20, (e.clientX - rect.left) * (W / rect.width)));
  };

  const handleClick = () => {
    if (gameOverRef.current || dropCooldown.current > 0) return;
    spawnFruit(dropX.current, dropType.current);
    dropType.current = nextTypeRef.current;
    nextTypeRef.current = Math.floor(Math.random() * 5);
    dropCooldown.current = 0.3;
  };

  // Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    touchRef.current = (e.touches[0].clientX - rect.left) * (W / rect.width);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    dropX.current = Math.max(20, Math.min(W - 20, (e.touches[0].clientX - rect.left) * (W / rect.width)));
  };

  const handleTouchEnd = () => {
    if (gameOverRef.current || dropCooldown.current > 0) return;
    spawnFruit(dropX.current, dropType.current);
    dropType.current = nextTypeRef.current;
    nextTypeRef.current = Math.floor(Math.random() * 5);
    dropCooldown.current = 0.3;
    touchRef.current = null;
  };

  const restart = () => {
    fruitsRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    gameOverRef.current = false;
    setGameOver(false);
    dropCooldown.current = 0;
    dropType.current = Math.floor(Math.random() * 5);
    nextTypeRef.current = Math.floor(Math.random() * 5);
  };

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[280px] md:max-w-xs mx-auto select-none py-2">
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-amber-600 font-bold">分数</div>
          <div className="text-sm font-black text-amber-700 dark:text-amber-400">{score}</div>
        </div>
        <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-amber-600 font-bold">最高</div>
          <div className="text-sm font-black text-amber-500">{best}</div>
        </div>
      </div>

      <div
        className="relative rounded-xl overflow-hidden w-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 text-center space-y-2">
              <div className="text-lg font-black text-slate-800 dark:text-white">游戏结束</div>
              <div className="text-sm text-slate-500">得分：{score}</div>
              <button type="button" onClick={(e) => { e.stopPropagation(); restart(); }}
                className="px-6 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 active:scale-95 transition-all">
                再来一局
              </button>
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={restart}
        className="w-full py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 active:scale-95 transition-all">
        重新开始
      </button>
      <div className="text-[10px] text-slate-400">点击/触摸掉落水果 · 相同合成更大的</div>
    </div>
  );
}
