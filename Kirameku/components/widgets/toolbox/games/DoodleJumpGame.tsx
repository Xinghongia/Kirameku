"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "game-doodle-jump-best";
const W = 320;
const H = 500;
const PW = 28;
const PH = 32;
const PLAT_W = 60;
const PLAT_H = 10;
const GRAVITY = 1400;
const JUMP_VEL = -580;
const SPRING_VEL = -850;
const MOVE_SPEED = 300;

type PlatType = "normal" | "moving" | "breakable" | "spring";

interface Platform {
  x: number;
  y: number;
  type: PlatType;
  moveDir: number;
  broken: boolean;
}

export default function DoodleJumpGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const raf = useRef<number | null>(null);

  // All game state in refs for synchronous access
  const state = useRef({
    px: 0, py: 0, pvy: 0, pdir: 0,
    camY: 0, score: 0, best: 0,
    started: false, gameOver: false,
    moveLeft: false, moveRight: false,
    plats: [] as Platform[],
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { const v = Number(saved); state.current.best = v; setBest(v); }
  }, []);

  const genPlats = useCallback((fromY: number, toY: number): Platform[] => {
    const result: Platform[] = [];
    let y = fromY;
    while (y > toY) {
      const x = 10 + Math.random() * (W - PLAT_W - 20);
      const r = Math.random();
      let type: PlatType = "normal";
      if (r < 0.06) type = "spring";
      else if (r < 0.15) type = "breakable";
      else if (r < 0.28) type = "moving";
      result.push({ x, y, type, moveDir: type === "moving" ? (Math.random() < 0.5 ? 1 : -1) : 0, broken: false });
      y -= 50 + Math.random() * 40 + Math.abs(y) * 0.003;
    }
    return result;
  }, []);

  const initGame = useCallback(() => {
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null; }
    const s = state.current;
    s.px = W / 2 - PW / 2;
    s.py = H - 80;
    s.pvy = JUMP_VEL;
    s.pdir = 0;
    s.camY = 0;
    s.score = 0;
    s.started = false;
    s.gameOver = false;
    s.moveLeft = false;
    s.moveRight = false;

    const plats: Platform[] = [];
    plats.push({ x: W / 2 - PLAT_W / 2, y: H - 40, type: "normal", moveDir: 0, broken: false });
    let y = H - 100;
    while (y > -800) {
      plats.push({ x: 10 + Math.random() * (W - PLAT_W - 20), y, type: "normal", moveDir: 0, broken: false });
      y -= 50 + Math.random() * 40;
    }
    s.plats = plats;

    setScore(0);
    setGameOver(false);
    setStarted(false);
    draw();
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const s = state.current;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f0fdf4";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.fillStyle = "#dcfce7";
    for (let gx = 0; gx < W; gx += 24) for (let gy = 0; gy < H; gy += 24) ctx.fillRect(gx, gy, 1, 1);

    // Draw everything in world coords, camera translates
    ctx.save();
    ctx.translate(0, -s.camY);

    // Platforms
    for (const p of s.plats) {
      if (p.broken) continue;
      const sy = p.y - s.camY;
      if (sy < -20 || sy > H + 20) continue;

      ctx.fillStyle = p.type === "moving" ? "#3b82f6" : p.type === "breakable" ? "#ca8a04" : "#22c55e";
      ctx.fillRect(p.x, p.y, PLAT_W, PLAT_H);

      if (p.type === "spring") {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(p.x + PLAT_W / 2 - 6, p.y - 10, 12, 10);
      }
      if (p.type === "breakable") {
        ctx.strokeStyle = "#92400e";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x + 15, p.y + 2); ctx.lineTo(p.x + 22, p.y + 8);
        ctx.moveTo(p.x + 38, p.y + 3); ctx.lineTo(p.x + 42, p.y + 7);
        ctx.stroke();
      }
    }

    // Player
    const px = s.px, py = s.py;
    ctx.fillStyle = "#6366f1";
    ctx.fillRect(px + 2, py + 8, PW - 4, PH - 8);
    ctx.fillRect(px + 4, py, PW - 8, 12);
    // Eyes
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(px + 10 + s.pdir, py + 6, 3.5, 0, Math.PI * 2);
    ctx.arc(px + 18 + s.pdir, py + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(px + 11 + s.pdir * 2, py + 6, 1.8, 0, Math.PI * 2);
    ctx.arc(px + 19 + s.pdir * 2, py + 6, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Feet
    ctx.fillStyle = "#4338ca";
    ctx.fillRect(px + 4, py + PH, 7, 4);
    ctx.fillRect(px + PW - 11, py + PH, 7, 4);

    ctx.restore();

    // HUD
    ctx.fillStyle = "#334155";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(String(s.score), 12, 30);
  }, []);

  // Main loop
  useEffect(() => {
    if (!started || gameOver) { draw(); return; }

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const s = state.current;

      // Move
      if (s.moveLeft) s.px -= MOVE_SPEED * dt;
      if (s.moveRight) s.px += MOVE_SPEED * dt;
      if (s.pdir !== 0) s.px += s.pdir * MOVE_SPEED * 0.5 * dt;
      if (s.px > W) s.px = -PW;
      if (s.px < -PW) s.px = W;

      // Physics
      s.pvy += GRAVITY * dt;
      s.py += s.pvy * dt;

      // Moving platforms
      for (const p of s.plats) {
        if (p.type === "moving" && !p.broken) {
          p.x += p.moveDir * 90 * dt;
          if (p.x < 0 || p.x > W - PLAT_W) p.moveDir *= -1;
        }
      }

      // Collision (only when falling)
      if (s.pvy > 0) {
        const bottom = s.py + PH;
        const left = s.px + 4;
        const right = s.px + PW - 4;
        for (const p of s.plats) {
          if (p.broken) continue;
          if (right > p.x && left < p.x + PLAT_W) {
            if (bottom >= p.y && bottom <= p.y + PLAT_H + s.pvy * dt) {
              if (p.type === "breakable") { p.broken = true; continue; }
              s.py = p.y - PH;
              s.pvy = p.type === "spring" ? SPRING_VEL : JUMP_VEL;
            }
          }
        }
      }

      // Camera: track highest point
      const camTarget = s.py - H * 0.5;
      if (camTarget < s.camY) s.camY = camTarget;

      // Score
      const h = Math.floor(-s.py / 10);
      if (h > s.score) { s.score = h; setScore(h); }

      // Generate platforms above
      let highest = Infinity;
      for (const p of s.plats) if (p.y < highest) highest = p.y;
      if (highest > s.camY - H) {
        s.plats.push(...genPlats(highest - 60, s.camY - H * 1.5));
      }

      // Remove platforms far below screen
      s.plats = s.plats.filter((p) => p.y < s.camY + H + 100);

      // Game over
      if (s.py > s.camY + H + 60) {
        s.gameOver = true;
        setGameOver(true);
        if (s.score > s.best) {
          s.best = s.score;
          setBest(s.score);
          localStorage.setItem(STORAGE_KEY, String(s.score));
        }
        return;
      }

      draw();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null; } };
  }, [started, gameOver, draw, genPlats]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); state.current.moveLeft = true; }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); state.current.moveRight = true; }
      if (!state.current.started && !state.current.gameOver) { state.current.started = true; setStarted(true); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") state.current.moveLeft = false;
      if (e.key === "ArrowRight" || e.key === "d") state.current.moveRight = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Touch
  const onTouchStart = (e: React.TouchEvent) => {
    if (!state.current.started && !state.current.gameOver) { state.current.started = true; setStarted(true); }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = (e.touches[0].clientX - rect.left) / rect.width * W;
    state.current.pdir = tx < W / 2 ? -1 : 1;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    state.current.px = Math.max(0, Math.min(W - PW, (e.touches[0].clientX - rect.left) / rect.width * W - PW / 2));
  };
  const onTouchEnd = () => { state.current.pdir = 0; };

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[280px] md:max-w-xs mx-auto select-none py-2">
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-indigo-600 font-bold">高度</div>
          <div className="text-sm font-black text-indigo-700 dark:text-indigo-400">{score}</div>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">最高</div>
          <div className="text-sm font-black text-amber-500">{best}</div>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden w-full cursor-pointer"
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" />
        {!started && !gameOver && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl px-6 py-4 text-center shadow-lg">
              <div className="text-sm font-black text-slate-800 dark:text-white">涂鸦跳跃</div>
              <div className="text-[10px] text-slate-500 mt-1">踩平台不断向上跳</div>
              <div className="text-[10px] text-slate-500">方向键或触摸左右移动</div>
            </div>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
            <div className="text-lg font-black text-white">掉下去了！</div>
            <div className="text-sm text-white/70">高度：{score}</div>
            <button type="button" onClick={initGame}
              className="px-6 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 active:scale-95 transition-all">
              再来一局
            </button>
          </div>
        )}
      </div>

      <button type="button" onClick={initGame}
        className="w-full py-1.5 rounded-lg bg-indigo-500 text-white text-[10px] font-bold hover:bg-indigo-600 active:scale-95 transition-all">
        重新开始
      </button>
    </div>
  );
}
