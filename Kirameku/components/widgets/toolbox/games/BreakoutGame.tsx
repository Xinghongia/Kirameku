"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "game-breakout-best";
const W = 360;
const H = 500;
const PADDLE_W = 70;
const PADDLE_H = 12;
const BALL_R = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_W = (W - 20) / BRICK_COLS;
const BRICK_H = 18;
const BRICK_PAD = 2;
const BRICK_TOP = 60;
const BALL_SPEED = 320;

const BRICK_COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6"];

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const frameRef = useRef<number | null>(null);
  const paddleX = useRef(W / 2 - PADDLE_W / 2);
  const ballRef = useRef({ x: W / 2, y: H - 80, dx: BALL_SPEED * 0.6, dy: -BALL_SPEED });
  const bricksRef = useRef<boolean[][]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const gameOverRef = useRef(false);
  const wonRef = useRef(false);
  const startedRef = useRef(false);
  const dragRef = useRef<{ offsetX: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
  }, []);

  const createBricks = useCallback((lvl: number) => {
    const rows = Math.min(BRICK_ROWS + Math.floor(lvl / 3), 8);
    return Array.from({ length: rows }, () => Array(BRICK_COLS).fill(true));
  }, []);

  const resetBall = useCallback(() => {
    ballRef.current = { x: W / 2, y: H - 80, dx: BALL_SPEED * 0.6 * (Math.random() > 0.5 ? 1 : -1), dy: -BALL_SPEED };
    paddleX.current = W / 2 - PADDLE_W / 2;
  }, []);

  const initGame = useCallback(() => {
    bricksRef.current = createBricks(1);
    scoreRef.current = 0;
    livesRef.current = 3;
    levelRef.current = 1;
    gameOverRef.current = false;
    wonRef.current = false;
    startedRef.current = false;
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setWon(false);
    setStarted(false);
    resetBall();
  }, [createBricks, resetBall]);

  useEffect(() => { initGame(); }, [initGame]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Bricks
    const bricks = bricksRef.current;
    for (let r = 0; r < bricks.length; r++)
      for (let c = 0; c < BRICK_COLS; c++) {
        if (!bricks[r][c]) continue;
        const x = 10 + c * BRICK_W + BRICK_PAD;
        const y = BRICK_TOP + r * BRICK_H + BRICK_PAD;
        ctx.fillStyle = BRICK_COLORS[r % BRICK_COLORS.length];
        ctx.beginPath();
        ctx.roundRect(x, y, BRICK_W - BRICK_PAD * 2, BRICK_H - BRICK_PAD * 2, 3);
        ctx.fill();
      }

    // Paddle
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.roundRect(paddleX.current, H - 40, PADDLE_W, PADDLE_H, 6);
    ctx.fill();

    // Ball
    const ball = ballRef.current;
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    // Lives
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("♥".repeat(livesRef.current), 10, 20);

    // Score
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${scoreRef.current}`, W - 10, 20);
  }, []);

  const tick = useCallback((dt: number) => {
    if (gameOverRef.current || wonRef.current || !startedRef.current) return;

    const ball = ballRef.current;
    const bricks = bricksRef.current;

    ball.x += ball.dx * dt;
    ball.y += ball.dy * dt;

    // Wall collision
    if (ball.x - BALL_R <= 0) { ball.x = BALL_R; ball.dx = Math.abs(ball.dx); }
    if (ball.x + BALL_R >= W) { ball.x = W - BALL_R; ball.dx = -Math.abs(ball.dx); }
    if (ball.y - BALL_R <= 0) { ball.y = BALL_R; ball.dy = Math.abs(ball.dy); }

    // Bottom - lose life
    if (ball.y + BALL_R >= H) {
      livesRef.current--;
      setLives(livesRef.current);
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
      resetBall();
      return;
    }

    // Paddle collision
    if (
      ball.dy > 0 &&
      ball.y + BALL_R >= H - 40 &&
      ball.y + BALL_R <= H - 40 + PADDLE_H + 4 &&
      ball.x >= paddleX.current &&
      ball.x <= paddleX.current + PADDLE_W
    ) {
      ball.y = H - 40 - BALL_R;
      const hit = (ball.x - paddleX.current) / PADDLE_W - 0.5;
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      const angle = hit * Math.PI * 0.7;
      ball.dx = speed * Math.sin(angle);
      ball.dy = -speed * Math.cos(angle);
    }

    // Brick collision
    for (let r = 0; r < bricks.length; r++)
      for (let c = 0; c < BRICK_COLS; c++) {
        if (!bricks[r][c]) continue;
        const bx = 10 + c * BRICK_W;
        const by = BRICK_TOP + r * BRICK_H;
        if (
          ball.x + BALL_R > bx && ball.x - BALL_R < bx + BRICK_W &&
          ball.y + BALL_R > by && ball.y - BALL_R < by + BRICK_H
        ) {
          bricks[r][c] = false;
          scoreRef.current += 10;
          setScore(scoreRef.current);

          // Determine bounce direction
          const overlapL = ball.x + BALL_R - bx;
          const overlapR = bx + BRICK_W - (ball.x - BALL_R);
          const overlapT = ball.y + BALL_R - by;
          const overlapB = by + BRICK_H - (ball.y - BALL_R);
          const minOverlapX = Math.min(overlapL, overlapR);
          const minOverlapY = Math.min(overlapT, overlapB);
          if (minOverlapX < minOverlapY) ball.dx = -ball.dx;
          else ball.dy = -ball.dy;

          // Speed up slightly
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          if (speed < BALL_SPEED * 1.8) {
            const factor = 1.01;
            ball.dx *= factor;
            ball.dy *= factor;
          }
        }
      }

    // Check win
    if (bricks.every((row) => row.every((b) => !b))) {
      levelRef.current++;
      setLevel(levelRef.current);
      bricksRef.current = createBricks(levelRef.current);
      resetBall();
      // Speed up for next level
      ballRef.current.dx *= 1.1;
      ballRef.current.dy *= 1.1;
    }
  }, [resetBall, createBricks]);

  useEffect(() => {
    draw();
    if (gameOver || won || !started) return;
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
  }, [tick, draw, gameOver, won, started]);

  // Mouse control
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) * (W / rect.width);
    paddleX.current = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
    if (!startedRef.current && !gameOverRef.current) {
      startedRef.current = true;
      setStarted(true);
    }
  };

  // Touch control
  const handleTouchStart = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.touches[0].clientX - rect.left) * (W / rect.width);
    dragRef.current = { offsetX: x - paddleX.current };
    if (!startedRef.current && !gameOverRef.current) {
      startedRef.current = true;
      setStarted(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.touches[0].clientX - rect.left) * (W / rect.width);
    paddleX.current = Math.max(0, Math.min(W - PADDLE_W, x - dragRef.current.offsetX));
  };

  const handleTouchEnd = () => { dragRef.current = null; };

  const restart = () => {
    initGame();
    draw();
  };

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[280px] md:max-w-xs mx-auto select-none py-2">
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">分数</div>
          <div className="text-sm font-black text-slate-800 dark:text-white">{score}</div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">关卡</div>
          <div className="text-sm font-black text-blue-500">{level}</div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">生命</div>
          <div className="text-sm font-black text-red-500">{"♥".repeat(lives)}</div>
        </div>
        {best > 0 && (
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1.5 text-center">
            <div className="text-[9px] text-slate-400 font-bold">最高</div>
            <div className="text-sm font-black text-amber-500">{best}</div>
          </div>
        )}
      </div>

      <div
        className="relative rounded-xl overflow-hidden w-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" />
        {!started && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl px-6 py-3 text-center">
              <div className="text-sm font-black text-slate-800 dark:text-white">移动鼠标或触摸控制</div>
            </div>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 text-center space-y-2">
              <div className="text-lg font-black text-slate-800 dark:text-white">游戏结束</div>
              <div className="text-sm text-slate-500">得分：{score}</div>
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
      <div className="text-[10px] text-slate-400">移动挡板接住球</div>
    </div>
  );
}
