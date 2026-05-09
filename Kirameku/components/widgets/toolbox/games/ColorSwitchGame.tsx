"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "game-colorswitch-best";
const W = 320;
const H = 500;
const BALL_R = 8;
const GRAVITY = 800;
const JUMP_VEL = -220;
const COLORS = ["#ef4444", "#3b82f6", "#eab308", "#22c55e"];

interface Wheel {
  y: number;
  r: number;
  rotation: number;
  speed: number;
  passed: boolean;
}

interface ColorChanger {
  y: number;
  colorIdx: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

export default function ColorSwitchGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const scoreRef = useRef(0);
  const startedRef = useRef(false);
  const gameOverRef = useRef(false);
  const ballY = useRef(H * 0.7);
  const ballVY = useRef(0);
  const ballColor = useRef(0);
  const cameraY = useRef(0);
  const wheelsRef = useRef<Wheel[]>([]);
  const changersRef = useRef<ColorChanger[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number | null>(null);
  const nextSpawnY = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
  }, []);

  const spawnWheel = useCallback((atY: number) => {
    const speed = (0.5 + Math.random() * 1.5) * (Math.random() < 0.5 ? 1 : -1);
    wheelsRef.current.push({
      y: atY,
      r: 55 + Math.random() * 15,
      rotation: Math.random() * Math.PI * 2,
      speed,
      passed: false,
    });
    if (Math.random() < 0.4) {
      changersRef.current.push({
        y: atY - 50,
        colorIdx: Math.floor(Math.random() * 4),
      });
    }
  }, []);

  const initGame = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    ballY.current = H * 0.7;
    ballVY.current = 0;
    ballColor.current = 0;
    cameraY.current = 0;
    wheelsRef.current = [];
    changersRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    nextSpawnY.current = H * 0.7 - 200;

    for (let i = 0; i < 5; i++) {
      const y = H * 0.7 - 150 - i * 150;
      spawnWheel(y);
      nextSpawnY.current = y - 150;
    }
  }, [spawnWheel]);

  useEffect(() => { initGame(); }, [initGame]);

  const spawnParticles = (x: number, y: number, color: string, count = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 80;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.4,
        color, size: 2 + Math.random() * 2,
      });
    }
  };

  const jump = useCallback(() => {
    ballVY.current = JUMP_VEL;
    spawnParticles(W / 2, ballY.current, COLORS[ballColor.current], 4);
  }, []);

  const startGame = useCallback(() => {
    initGame();
    setScore(0);
    setGameOver(false);
    setStarted(false);
    gameOverRef.current = false;
    startedRef.current = false;
    jump();
    startedRef.current = true;
    setStarted(true);
  }, [initGame, jump]);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(0, cameraY.current);

    for (const wheel of wheelsRef.current) {
      const cx = W / 2;
      const cy = wheel.y;
      for (let i = 0; i < 4; i++) {
        const startAngle = wheel.rotation + (i * Math.PI) / 2;
        const endAngle = startAngle + Math.PI / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, wheel.r, startAngle, endAngle);
        ctx.arc(cx, cy, wheel.r - 20, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = COLORS[i];
        ctx.fill();
      }
    }

    for (const ch of changersRef.current) {
      const cx = W / 2;
      const cy = ch.y;
      ctx.fillStyle = COLORS[ch.colorIdx];
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx + 10, cy);
      ctx.lineTo(cx, cy + 10);
      ctx.lineTo(cx - 10, cy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    for (const pt of particlesRef.current) {
      const alpha = pt.life / pt.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ball — draw at world Y (camera transform handles offset)
    const bx = W / 2;
    const by = ballY.current;
    ctx.fillStyle = COLORS[ballColor.current];
    ctx.beginPath();
    ctx.arc(bx, by, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS[ballColor.current] + "40";
    ctx.beginPath();
    ctx.arc(bx, by, BALL_R + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(scoreRef.current), W / 2, 35);
  }, []);

  const tick = useCallback((dt: number) => {
    if (gameOverRef.current || !startedRef.current) return;

    ballVY.current += GRAVITY * dt;
    ballY.current += ballVY.current * dt;

    // Camera follows ball up
    const targetCam = Math.max(0, H * 0.5 - ballY.current);
    cameraY.current += (targetCam - cameraY.current) * 0.1;

    for (const wheel of wheelsRef.current) {
      wheel.rotation += wheel.speed * dt;
    }

    // Spawn wheels above
    const topEdge = ballY.current - H;
    while (nextSpawnY.current > topEdge) {
      spawnWheel(nextSpawnY.current);
      nextSpawnY.current -= 140 + Math.random() * 40;
    }

    // Cleanup
    const bottomEdge = ballY.current + H * 2;
    wheelsRef.current = wheelsRef.current.filter((w) => w.y < bottomEdge);
    changersRef.current = changersRef.current.filter((c) => c.y < bottomEdge);

    // Collision
    const bx = W / 2;
    const by = ballY.current;

    for (const wheel of wheelsRef.current) {
      const dy = by - wheel.y;
      const dist = Math.abs(dy);

      if (dist < wheel.r - 2 && dist > wheel.r - 24) {
        const angle = Math.atan2(dy, bx - W / 2) - wheel.rotation;
        const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const segment = Math.floor(normalized / (Math.PI / 2)) % 4;

        if (segment !== ballColor.current) {
          gameOverRef.current = true;
          setGameOver(true);
          spawnParticles(bx, by, COLORS[ballColor.current], 12);
          setBest((b) => {
            const nb = Math.max(b, scoreRef.current);
            localStorage.setItem(STORAGE_KEY, String(nb));
            return nb;
          });
          return;
        }
      }

      if (!wheel.passed && by < wheel.y - wheel.r) {
        wheel.passed = true;
        scoreRef.current++;
        setScore(scoreRef.current);
      }
    }

    for (let i = changersRef.current.length - 1; i >= 0; i--) {
      const ch = changersRef.current[i];
      if (Math.abs(by - ch.y) < 15) {
        ballColor.current = ch.colorIdx;
        spawnParticles(bx, ch.y, COLORS[ch.colorIdx], 8);
        changersRef.current.splice(i, 1);
      }
    }

    // Fell off screen
    if (ballY.current > H + 80) {
      gameOverRef.current = true;
      setGameOver(true);
      setBest((b) => {
        const nb = Math.max(b, scoreRef.current);
        localStorage.setItem(STORAGE_KEY, String(nb));
        return nb;
      });
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const pt = particlesRef.current[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 100 * dt;
      pt.life -= dt;
      if (pt.life <= 0) particlesRef.current.splice(i, 1);
    }
  }, [spawnWheel]);

  // Game loop
  useEffect(() => {
    if (!started || gameOver) {
      draw();
      return;
    }
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      tick(dt);
      draw();
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) { cancelAnimationFrame(frameRef.current); frameRef.current = null; }
    };
  }, [tick, draw, gameOver, started]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (gameOverRef.current) return;
        if (!startedRef.current) {
          startedRef.current = true;
          setStarted(true);
          jump();
        } else {
          jump();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [jump]);

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[280px] md:max-w-xs mx-auto select-none py-2">
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-purple-600 font-bold">分数</div>
          <div className="text-sm font-black text-purple-700 dark:text-purple-400">{score}</div>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">最高</div>
          <div className="text-sm font-black text-amber-500">{best}</div>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden w-full">
        {/* Canvas — always clickable for jumping */}
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full h-auto cursor-pointer"
          onClick={() => {
            if (gameOverRef.current) return;
            if (!startedRef.current) {
              startedRef.current = true;
              setStarted(true);
            }
            jump();
          }}
        />

        {/* Start overlay — transparent to clicks */}
        {!started && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl px-6 py-4 text-center space-y-1 shadow-lg">
              <div className="text-sm font-black text-slate-800 dark:text-white">色彩穿越</div>
              <div className="text-[10px] text-slate-500">点击任意位置跳跃</div>
              <div className="text-[10px] text-slate-500">◆ 可改变球的颜色</div>
            </div>
          </div>
        )}

        {/* Game over overlay — button on top */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
            <div className="text-lg font-black text-white">游戏结束</div>
            <div className="text-sm text-white/70">得分：{score}</div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); restartGame(); }}
              className="px-6 py-2 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 active:scale-95 transition-all"
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      <button type="button" onClick={restartGame}
        className="w-full py-1.5 rounded-lg bg-purple-500 text-white text-[10px] font-bold hover:bg-purple-600 active:scale-95 transition-all">
        重新开始
      </button>
      <div className="text-[10px] text-slate-400">点击/空格跳跃 · 穿过同色区域</div>
    </div>
  );
}
