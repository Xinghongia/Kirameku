"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "game-coin-catcher-best";
const W = 360;
const H = 500;
const BASKET_W = 60;
const BASKET_H = 28;
const BASKET_Y = H - 50;

type ItemType = "coin_s" | "coin_m" | "coin_l" | "diamond" | "bomb" | "star" | "heart";

interface FallingItem {
  x: number; y: number;
  type: ItemType;
  speed: number;
  wobble: number; phase: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

const ITEM_DEFS: Record<ItemType, { emoji: string; points: number; r: number; color: string; chance: number }> = {
  coin_s:  { emoji: "🪙", points: 10,  r: 12, color: "#f59e0b", chance: 0.35 },
  coin_m:  { emoji: "💰", points: 25,  r: 14, color: "#f59e0b", chance: 0.20 },
  coin_l:  { emoji: "💎", points: 50,  r: 16, color: "#3b82f6", chance: 0.10 },
  diamond: { emoji: "👑", points: 100, r: 14, color: "#a855f7", chance: 0.05 },
  star:    { emoji: "⭐", points: 0,   r: 12, color: "#eab308", chance: 0.08 },
  heart:   { emoji: "❤️", points: 0,   r: 12, color: "#ef4444", chance: 0.07 },
  bomb:    { emoji: "💣", points: -1,  r: 14, color: "#1e293b", chance: 0.15 },
};

function randomItemType(score: number): ItemType {
  // Increase bomb chance as score goes up
  const adjustedChance = { ...ITEM_DEFS };
  adjustedChance.bomb.chance = Math.min(0.3, 0.15 + score * 0.0005);
  // Reduce coin chances proportionally
  const total = Object.values(adjustedChance).reduce((s, d) => s + d.chance, 0);
  const r = Math.random() * total;
  let cum = 0;
  for (const [type, def] of Object.entries(adjustedChance)) {
    cum += def.chance;
    if (r < cum) return type as ItemType;
  }
  return "coin_s";
}

export default function CoinCatcherGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [combo, setCombo] = useState(0);

  const frameRef = useRef<number | null>(null);
  const basketX = useRef(W / 2 - BASKET_W / 2);
  const itemsRef = useRef<FallingItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const gameOverRef = useRef(false);
  const startedRef = useRef(false);
  const comboRef = useRef(0);
  const comboTimerRef = useRef(0);
  const spawnTimer = useRef(0);
  const moveDir = useRef({ left: false, right: false });
  const touchRef = useRef<{ offsetX: number } | null>(null);
  const starRef = useRef(0); // double points timer
  const timeRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
  }, []);

  const initGame = useCallback(() => {
    basketX.current = W / 2 - BASKET_W / 2;
    itemsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    gameOverRef.current = false;
    startedRef.current = false;
    comboRef.current = 0;
    comboTimerRef.current = 0;
    spawnTimer.current = 0;
    starRef.current = 0;
    timeRef.current = 0;
    setScore(0);
    setLives(3);
    setCombo(0);
    setGameOver(false);
    setStarted(false);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.4,
        color, size: 2 + Math.random() * 3,
      });
    }
  };

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.7, "#1e293b");
    grad.addColorStop(1, "#334155");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars background
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < 40; i++) {
      const sx = (i * 53 + 17) % W;
      const sy = (i * 97 + (timeRef.current * 20 | 0) % H) % H;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Falling items
    itemsRef.current.forEach((item) => {
      const def = ITEM_DEFS[item.type];
      const wobbleX = Math.sin(item.phase) * item.wobble;
      const cx = item.x + wobbleX;
      const cy = item.y;

      // Glow
      ctx.fillStyle = def.color + "30";
      ctx.beginPath();
      ctx.arc(cx, cy, def.r + 6, 0, Math.PI * 2);
      ctx.fill();

      // Emoji
      ctx.font = `${def.r * 1.5}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(def.emoji, cx, cy);
    });

    // Basket
    const bx = basketX.current;
    // Basket shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.roundRect(bx + 2, BASKET_Y + 2, BASKET_W, BASKET_H, 4);
    ctx.fill();
    // Basket body
    const baskGrad = ctx.createLinearGradient(bx, BASKET_Y, bx, BASKET_Y + BASKET_H);
    baskGrad.addColorStop(0, "#92400e");
    baskGrad.addColorStop(1, "#78350f");
    ctx.fillStyle = baskGrad;
    ctx.beginPath();
    ctx.roundRect(bx, BASKET_Y, BASKET_W, BASKET_H, 4);
    ctx.fill();
    // Basket rim
    ctx.fillStyle = "#a16207";
    ctx.fillRect(bx - 2, BASKET_Y, BASKET_W + 4, 4);
    // Basket pattern
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(bx + 8 + i * 14, BASKET_Y + 6);
      ctx.lineTo(bx + 8 + i * 14, BASKET_Y + BASKET_H - 2);
      ctx.stroke();
    }

    // Double points indicator
    if (starRef.current > 0) {
      ctx.fillStyle = "#eab308";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`⭐ ×2 ${starRef.current.toFixed(1)}s`, W / 2, BASKET_Y - 10);
    }

    // Particles
    particlesRef.current.forEach((pt) => {
      const alpha = pt.life / pt.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Score popup (using particles for now)
    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`♥`.repeat(livesRef.current), 10, 10);
    ctx.textAlign = "right";
    ctx.fillText(`${scoreRef.current}`, W - 10, 10);

    // Combo
    if (comboRef.current >= 3) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${comboRef.current}x`, W / 2, 10);
    }
  }, []);

  const tick = useCallback((dt: number) => {
    if (gameOverRef.current || !startedRef.current) return;

    timeRef.current += dt;
    const basket = basketX.current;

    // Move basket
    if (moveDir.current.left) basketX.current = Math.max(0, basket - 300 * dt);
    if (moveDir.current.right) basketX.current = Math.min(W - BASKET_W, basket + 300 * dt);

    // Power-up timers
    if (starRef.current > 0) starRef.current = Math.max(0, starRef.current - dt);
    comboTimerRef.current -= dt;
    if (comboTimerRef.current <= 0) { comboRef.current = 0; setCombo(0); }

    // Spawn items
    spawnTimer.current += dt;
    const spawnInterval = Math.max(0.3, 1.0 - timeRef.current * 0.005);
    if (spawnTimer.current >= spawnInterval) {
      spawnTimer.current = 0;
      const type = randomItemType(scoreRef.current);
      itemsRef.current.push({
        x: 20 + Math.random() * (W - 40),
        y: -20,
        type,
        speed: 100 + Math.random() * 60 + timeRef.current * 1.5,
        wobble: 5 + Math.random() * 10,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Move items
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const item = itemsRef.current[i];
      item.y += item.speed * dt;
      item.phase += dt * 3;

      // Check catch
      const def = ITEM_DEFS[item.type];
      const wobbleX = Math.sin(item.phase) * item.wobble;
      const cx = item.x + wobbleX;

      if (
        item.y + def.r >= BASKET_Y &&
        item.y - def.r <= BASKET_Y + BASKET_H &&
        cx + def.r >= basketX.current &&
        cx - def.r <= basketX.current + BASKET_W
      ) {
        // Caught!
        if (item.type === "bomb") {
          // Hit by bomb
          livesRef.current--;
          setLives(livesRef.current);
          comboRef.current = 0;
          setCombo(0);
          spawnParticles(cx, item.y, "#1e293b", 10);
          if (livesRef.current <= 0) {
            gameOverRef.current = true;
            setGameOver(true);
            setBest((b) => {
              const nb = Math.max(b, scoreRef.current);
              localStorage.setItem(STORAGE_KEY, String(nb));
              return nb;
            });
            return;
          }
        } else if (item.type === "star") {
          starRef.current = 8;
          spawnParticles(cx, item.y, "#eab308", 10);
        } else if (item.type === "heart") {
          livesRef.current = Math.min(5, livesRef.current + 1);
          setLives(livesRef.current);
          spawnParticles(cx, item.y, "#ef4444", 10);
        } else {
          // Coin/diamond
          const mult = starRef.current > 0 ? 2 : 1;
          comboRef.current++;
          comboTimerRef.current = 2;
          setCombo(comboRef.current);
          const comboMult = comboRef.current >= 5 ? 3 : comboRef.current >= 3 ? 2 : 1;
          const pts = def.points * mult * comboMult;
          scoreRef.current += pts;
          setScore(scoreRef.current);
          spawnParticles(cx, item.y, def.color, 8);
        }
        itemsRef.current.splice(i, 1);
        continue;
      }

      // Off screen
      if (item.y > H + 20) {
        itemsRef.current.splice(i, 1);
        // Miss penalty for coins
        if (def.points > 0) {
          comboRef.current = 0;
          setCombo(0);
        }
      }
    }

    // Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const pt = particlesRef.current[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 100 * dt; // gravity
      pt.life -= dt;
      if (pt.life <= 0) particlesRef.current.splice(i, 1);
    }
  }, []);

  useEffect(() => {
    draw();
    if (gameOver || !started) return;
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      tick(dt);
      draw();
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [tick, draw, gameOver, started]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); moveDir.current.left = true; }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); moveDir.current.right = true; }
      if (!startedRef.current && !gameOverRef.current) {
        startedRef.current = true;
        setStarted(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") moveDir.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") moveDir.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = (e.touches[0].clientX - rect.left) * (W / rect.width);
    touchRef.current = { offsetX: tx - basketX.current };
    if (!startedRef.current && !gameOverRef.current) {
      startedRef.current = true;
      setStarted(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = (e.touches[0].clientX - rect.left) * (W / rect.width);
    basketX.current = Math.max(0, Math.min(W - BASKET_W, tx - touchRef.current.offsetX));
  };

  const handleTouchEnd = () => { touchRef.current = null; };

  const restart = () => {
    initGame();
    draw();
  };

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[280px] md:max-w-xs mx-auto select-none py-2">
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-amber-600 font-bold">分数</div>
          <div className="text-sm font-black text-amber-700 dark:text-amber-400">{score}</div>
        </div>
        <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-red-600 font-bold">生命</div>
          <div className="text-sm font-black text-red-500">{"♥".repeat(lives)}</div>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">最高</div>
          <div className="text-sm font-black text-amber-500">{best}</div>
        </div>
      </div>

      <div
        className="relative rounded-xl overflow-hidden w-full cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" />
        {!started && !gameOver && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl px-6 py-4 text-center space-y-1">
              <div className="text-sm font-black text-slate-800 dark:text-white">接金币</div>
              <div className="text-[10px] text-slate-500">左右移动篮子接住宝物</div>
              <div className="text-[10px] text-slate-500">🪙💰💎👑 加分 · ⭐ 双倍 · ❤️ 加命 · 💣 减命</div>
            </div>
          </div>
        )}
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
      <div className="text-[10px] text-slate-400">触摸拖动或方向键移动</div>
    </div>
  );
}
