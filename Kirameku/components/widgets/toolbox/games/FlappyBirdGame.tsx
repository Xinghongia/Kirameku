"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "game-flappy-best";
const W = 320;
const H = 480;
const BIRD = 20;
const PIPE_W = 52;
const GAP = 140;
const GRAVITY = 1600;
const FLAP = -420;
const SPEED = 160;

interface Bird { y: number; vy: number; }
interface Pipe { x: number; gapY: number; passed: boolean; }

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const birdRef = useRef<Bird>({ y: H / 2, vy: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const gameOverRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
  }, []);

  const flap = useCallback(() => {
    if (gameOverRef.current) return;
    if (!startedRef.current) {
      startedRef.current = true;
      setStarted(true);
      pipesRef.current = [];
      scoreRef.current = 0;
      setScore(0);
    }
    birdRef.current.vy = FLAP;
  }, []);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#70c5ce");
    grad.addColorStop(1, "#d4f1f4");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = "#ded895";
    ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = "#c8b464";
    ctx.fillRect(0, H - 60, W, 4);

    // Pipes
    ctx.fillStyle = "#73bf2e";
    pipesRef.current.forEach((p) => {
      // Top pipe
      ctx.fillRect(p.x, 0, PIPE_W, p.gapY - GAP / 2);
      ctx.fillStyle = "#5ea325";
      ctx.fillRect(p.x - 3, p.gapY - GAP / 2 - 20, PIPE_W + 6, 20);
      ctx.fillStyle = "#73bf2e";
      // Bottom pipe
      ctx.fillRect(p.x, p.gapY + GAP / 2, PIPE_W, H - 60 - (p.gapY + GAP / 2));
      ctx.fillStyle = "#5ea325";
      ctx.fillRect(p.x - 3, p.gapY + GAP / 2, PIPE_W + 6, 20);
      ctx.fillStyle = "#73bf2e";
    });

    // Bird
    const bird = birdRef.current;
    ctx.fillStyle = "#f5c842";
    ctx.beginPath();
    ctx.arc(W / 3, bird.y, BIRD / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(W / 3 + 5, bird.y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(W / 3 + 6, bird.y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8772a";
    ctx.beginPath();
    ctx.moveTo(W / 3 + BIRD / 2, bird.y);
    ctx.lineTo(W / 3 + BIRD / 2 + 8, bird.y - 3);
    ctx.lineTo(W / 3 + BIRD / 2 + 8, bird.y + 3);
    ctx.closePath();
    ctx.fill();

    // Score
    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 3;
    ctx.strokeText(String(scoreRef.current), W / 2, 50);
    ctx.fillText(String(scoreRef.current), W / 2, 50);
  }, []);

  const tick = useCallback((dt: number) => {
    if (gameOverRef.current) return;
    const bird = birdRef.current;
    bird.vy += GRAVITY * dt;
    bird.y += bird.vy * dt;

    // Ground collision
    if (bird.y + BIRD / 2 >= H - 60) {
      bird.y = H - 60 - BIRD / 2;
      gameOverRef.current = true;
      setGameOver(true);
      setBest((b) => {
        const nb = Math.max(b, scoreRef.current);
        localStorage.setItem(STORAGE_KEY, String(nb));
        return nb;
      });
      return;
    }
    // Ceiling
    if (bird.y - BIRD / 2 < 0) bird.y = BIRD / 2;

    // Pipes
    const pipes = pipesRef.current;
    if (pipes.length === 0 || pipes[pipes.length - 1].x < W - 200) {
      pipes.push({ x: W + 10, gapY: 100 + Math.random() * (H - 280), passed: false });
    }

    pipes.forEach((p) => {
      p.x -= SPEED * dt;
      // Score
      if (!p.passed && p.x + PIPE_W < W / 3) {
        p.passed = true;
        scoreRef.current++;
        setScore(scoreRef.current);
      }
      // Collision
      const bx = W / 3, by = bird.y;
      if (bx + BIRD / 2 > p.x && bx - BIRD / 2 < p.x + PIPE_W) {
        if (by - BIRD / 2 < p.gapY - GAP / 2 || by + BIRD / 2 > p.gapY + GAP / 2) {
          gameOverRef.current = true;
          setGameOver(true);
          setBest((b) => {
            const nb = Math.max(b, scoreRef.current);
            localStorage.setItem(STORAGE_KEY, String(nb));
            return nb;
          });
        }
      }
    });

    pipesRef.current = pipes.filter((p) => p.x + PIPE_W > -10);
    draw();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!started || gameOver) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
      lastTime = now;
      tick(dt);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [started, tick, gameOver]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); flap(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flap]);

  const restart = () => {
    birdRef.current = { y: H / 2, vy: 0 };
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    gameOverRef.current = false;
    setGameOver(false);
    startedRef.current = false;
    setStarted(false);
    draw();
  };

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[260px] md:max-w-xs mx-auto select-none py-2">
      {/* 分数 */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">分数</div>
          <div className="text-sm font-black text-slate-800 dark:text-white">{score}</div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">最高</div>
          <div className="text-sm font-black text-amber-500">{best}</div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative rounded-xl overflow-hidden w-full cursor-pointer"
        onClick={flap}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" />
        {!started && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl px-6 py-3 text-center">
              <div className="text-sm font-black text-slate-800 dark:text-white">点击开始</div>
              <div className="text-[10px] text-slate-500 mt-1">点击或空格键飞翔</div>
            </div>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 text-center space-y-2">
              <div className="text-lg font-black text-slate-800 dark:text-white">游戏结束</div>
              <div className="text-sm text-slate-500">得分：{score}</div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); restart(); }}
                className="px-6 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 active:scale-95 transition-all"
              >
                再来一局
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={restart}
        className="w-full py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 active:scale-95 transition-all"
      >
        重新开始
      </button>

      <div className="text-[10px] text-slate-400">点击或空格键飞翔</div>
    </div>
  );
}
