"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "game-stack-best";
const W = 320;
const H = 500;
const BLOCK_H = 26;
const COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#6366f1","#a855f7","#ec4899"];

interface Block {
  x: number;
  w: number;
  color: string;
}

interface FallingPiece {
  x: number;
  w: number;
  y: number;
  vy: number;
  color: string;
}

export default function StackGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [combo, setCombo] = useState(0);

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const startedRef = useRef(false);
  const gameOverRef = useRef(false);
  const blocksRef = useRef<Block[]>([]);
  const currentRef = useRef<Block>({ x: 0, w: 0, color: "" });
  const dirRef = useRef(1);
  const fallingRef = useRef<FallingPiece[]>([]);
  const frameRef = useRef<number | null>(null);
  const cameraY = useRef(0);
  const targetCameraY = useRef(0);
  const perfectFlash = useRef(0);
  const speedRef = useRef(2);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
  }, []);

  const initGame = useCallback(() => {
    const baseW = W * 0.6;
    blocksRef.current = [{ x: (W - baseW) / 2, w: baseW, color: COLORS[0] }];
    currentRef.current = { x: -baseW, w: baseW, color: COLORS[1] };
    dirRef.current = 1;
    fallingRef.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    startedRef.current = false;
    gameOverRef.current = false;
    cameraY.current = 0;
    targetCameraY.current = 0;
    perfectFlash.current = 0;
    speedRef.current = 2;
    setScore(0);
    setCombo(0);
    setGameOver(false);
    setStarted(false);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const placeBlock = useCallback(() => {
    if (gameOverRef.current || !startedRef.current) return;

    const prev = blocksRef.current[blocksRef.current.length - 1];
    const cur = currentRef.current;

    const overlapLeft = Math.max(cur.x, prev.x);
    const overlapRight = Math.min(cur.x + cur.w, prev.x + prev.w);
    const overlapW = overlapRight - overlapLeft;

    if (overlapW <= 0) {
      // Missed completely
      gameOverRef.current = true;
      setGameOver(true);
      setBest((b) => {
        const nb = Math.max(b, scoreRef.current);
        localStorage.setItem(STORAGE_KEY, String(nb));
        return nb;
      });
      return;
    }

    const isPerfect = Math.abs(overlapW - prev.w) < 3;

    if (isPerfect) {
      comboRef.current++;
      if (comboRef.current >= 2) setCombo(comboRef.current);
    } else {
      comboRef.current = 0;
      setCombo(0);
    }

    // Add placed block
    const newBlock: Block = {
      x: overlapLeft,
      w: overlapW,
      color: cur.color,
    };
    blocksRef.current.push(newBlock);

    // Falling piece
    if (cur.x < prev.x) {
      fallingRef.current.push({
        x: cur.x,
        w: prev.x - cur.x,
        y: blocksRef.current.length * BLOCK_H,
        vy: 0,
        color: cur.color,
      });
    } else if (cur.x + cur.w > prev.x + prev.w) {
      const cutStart = prev.x + prev.w;
      fallingRef.current.push({
        x: cutStart,
        w: cur.x + cur.w - cutStart,
        y: blocksRef.current.length * BLOCK_H,
        vy: 0,
        color: cur.color,
      });
    }

    scoreRef.current += isPerfect ? 2 + comboRef.current : 1;
    setScore(scoreRef.current);

    if (isPerfect) perfectFlash.current = 0.3;

    // Camera
    targetCameraY.current = Math.max(0, blocksRef.current.length * BLOCK_H - H + 150);

    // Speed up
    speedRef.current = Math.min(6, 2 + scoreRef.current * 0.08);

    // Next block
    const nextW = isPerfect ? prev.w : overlapW;
    const nextColor = COLORS[blocksRef.current.length % COLORS.length];
    dirRef.current = -dirRef.current;
    currentRef.current = {
      x: dirRef.current > 0 ? -nextW : W,
      w: nextW,
      color: nextColor,
    };
  }, []);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Smooth camera
    cameraY.current += (targetCameraY.current - cameraY.current) * 0.1;

    ctx.save();
    ctx.translate(0, cameraY.current);

    // Draw blocks
    const startIdx = Math.max(0, Math.floor((cameraY.current - 100) / BLOCK_H));
    for (let i = startIdx; i < blocksRef.current.length; i++) {
      const b = blocksRef.current[i];
      const y = i * BLOCK_H;
      if (y > cameraY.current + H + 50) break;

      // Block shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(b.x + 2, H - y - BLOCK_H + 2, b.w, BLOCK_H);

      // Block body
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, H - y - BLOCK_H, b.w, BLOCK_H);

      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(b.x, H - y - BLOCK_H, b.w, 3);
    }

    // Draw current swinging block
    if (!gameOverRef.current && startedRef.current) {
      const cur = currentRef.current;
      const y = blocksRef.current.length * BLOCK_H;
      ctx.fillStyle = cur.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(cur.x, H - y - BLOCK_H, cur.w, BLOCK_H);
      ctx.globalAlpha = 1;
    }

    // Falling pieces
    for (const fp of fallingRef.current) {
      ctx.fillStyle = fp.color;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(fp.x, H - fp.y - BLOCK_H, fp.w, BLOCK_H);
      ctx.globalAlpha = 1;
    }

    // Perfect flash
    if (perfectFlash.current > 0) {
      ctx.fillStyle = `rgba(255,255,255,${perfectFlash.current * 0.3})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();

    // HUD
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(scoreRef.current), W / 2, 40);

    if (comboRef.current >= 2) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`${comboRef.current}x Perfect!`, W / 2, 60);
    }
  }, []);

  const tick = useCallback((dt: number) => {
    if (gameOverRef.current || !startedRef.current) return;

    // Move current block
    const cur = currentRef.current;
    cur.x += speedRef.current * dirRef.current * 60 * dt;
    if (cur.x + cur.w > W + 50) dirRef.current = -1;
    if (cur.x < -50) dirRef.current = 1;

    // Update falling pieces
    for (let i = fallingRef.current.length - 1; i >= 0; i--) {
      const fp = fallingRef.current[i];
      fp.vy += 600 * dt;
      fp.y += fp.vy * dt;
      if (fp.y > cameraY.current + H + 200) fallingRef.current.splice(i, 1);
    }

    // Perfect flash
    if (perfectFlash.current > 0) perfectFlash.current -= dt;
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (!startedRef.current && !gameOverRef.current) {
          startedRef.current = true;
          setStarted(true);
        } else {
          placeBlock();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [placeBlock]);

  const handleClick = () => {
    if (!startedRef.current && !gameOverRef.current) {
      startedRef.current = true;
      setStarted(true);
      return;
    }
    placeBlock();
  };

  const restart = () => {
    initGame();
    draw();
  };

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[280px] md:max-w-xs mx-auto select-none py-2">
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-blue-600 font-bold">层数</div>
          <div className="text-sm font-black text-blue-700 dark:text-blue-400">{score}</div>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">最高</div>
          <div className="text-sm font-black text-amber-500">{best}</div>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden w-full cursor-pointer" onClick={handleClick}>
        <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" />
        {!started && !gameOver && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl px-6 py-4 text-center space-y-1">
              <div className="text-sm font-black text-slate-800 dark:text-white">堆叠塔</div>
              <div className="text-[10px] text-slate-500">点击落下方块，精准对齐</div>
              <div className="text-[10px] text-slate-500">连续精准可获得连击加分</div>
            </div>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 text-center space-y-2">
              <div className="text-lg font-black text-slate-800 dark:text-white">倒塌了！</div>
              <div className="text-sm text-slate-500">堆了 {score} 层</div>
              <button type="button" onClick={(e) => { e.stopPropagation(); restart(); }}
                className="px-6 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 active:scale-95 transition-all">
                再来一局
              </button>
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={restart}
        className="w-full py-1.5 rounded-lg bg-blue-500 text-white text-[10px] font-bold hover:bg-blue-600 active:scale-95 transition-all">
        重新开始
      </button>
      <div className="text-[10px] text-slate-400">点击/空格落下方块 · 精准对齐得分更多</div>
    </div>
  );
}
