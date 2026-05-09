"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "game-shooter-best";
const W = 360;
const H = 540;
const PLAYER_W = 36;
const PLAYER_H = 40;
const BULLET_SPEED = 520;
const PLAYER_SPEED = 280;
const FIRE_RATE = 0.16;

// ── Types ──
interface Vec { x: number; y: number; }
interface Bullet extends Vec { dx: number; dy: number; w: number; h: number; }
interface Enemy {
  x: number; y: number; w: number; h: number;
  hp: number; maxHp: number; speed: number;
  type: "scout" | "fighter" | "tank" | "boss";
  color: string; score: number;
  t: number; // age in seconds for movement patterns
}
interface PowerUp extends Vec { type: "shield" | "multi" | "bomb"; }
interface Particle extends Vec { vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }
interface Star { x: number; y: number; speed: number; size: number; alpha: number; }

// ── Helpers ──
function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function overlap(a: {x:number;y:number;w:number;h:number}, b: {x:number;y:number;w:number;h:number}) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const ENEMY_DEFS: Record<string, { w: number; h: number; hp: number; speed: number; score: number; color: string }> = {
  scout:  { w: 24, h: 26, hp: 1, speed: 180, score: 10, color: "#ef4444" },
  fighter:{ w: 30, h: 32, hp: 2, speed: 130, score: 25, color: "#a855f7" },
  tank:   { w: 38, h: 40, hp: 5, speed: 80,  score: 50, color: "#f97316" },
  boss:   { w: 80, h: 60, hp: 80, speed: 60, score: 500, color: "#dc2626" },
};

export default function ShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [combo, setCombo] = useState(0);

  const frameRef = useRef<number | null>(null);
  const playerRef = useRef<Vec>({ x: W / 2 - PLAYER_W / 2, y: H - 60 });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const waveRef = useRef(1);
  const comboRef = useRef(0);
  const comboTimerRef = useRef(0);
  const gameOverRef = useRef(false);
  const startedRef = useRef(false);
  const fireTimer = useRef(0);
  const waveTimer = useRef(0);
  const waveEnemiesLeft = useRef(0);
  const pendingSpawns = useRef(0);
  const bossActive = useRef(false);
  const shieldRef = useRef(0);
  const multiShotRef = useRef(0);
  const bombRef = useRef(1);
  const screenShake = useRef(0);
  const moveDir = useRef({ left: false, right: false, up: false, down: false });
  const touchRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const waveGeneration = useRef(0);

  // ── Init ──
  const initGame = useCallback(() => {
    playerRef.current = { x: W / 2 - PLAYER_W / 2, y: H - 60 };
    bulletsRef.current = [];
    enemiesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    waveRef.current = 1;
    comboRef.current = 0;
    comboTimerRef.current = 0;
    gameOverRef.current = false;
    startedRef.current = false;
    fireTimer.current = 0;
    waveTimer.current = 0;
    waveEnemiesLeft.current = 0;
    pendingSpawns.current = 0;
    bossActive.current = false;
    shieldRef.current = 0;
    multiShotRef.current = 0;
    bombRef.current = 1;
    screenShake.current = 0;
    waveGeneration.current++;
    setScore(0);
    setLives(3);
    setWave(1);
    setCombo(0);
    setGameOver(false);
    setStarted(false);
    // Stars
    starsRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      speed: 30 + Math.random() * 80, size: 0.5 + Math.random() * 1.5, alpha: 0.2 + Math.random() * 0.5,
    }));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBest(Number(saved));
    initGame();
  }, [initGame]);

  // ── Particles ──
  const spawnExplosion = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.5,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  };

  // ── Wave spawning ──
  const spawnWave = useCallback((w: number) => {
    const gen = waveGeneration.current;
    if (w % 5 === 0 && !bossActive.current) {
      bossActive.current = true;
      const bossHp = 60 + w * 10;
      enemiesRef.current.push({
        x: W / 2 - 40, y: -70, ...ENEMY_DEFS.boss,
        hp: bossHp, maxHp: bossHp, type: "boss",
      });
      waveEnemiesLeft.current = 1;
      pendingSpawns.current = 0;
    } else {
      const count = Math.min(3 + Math.floor(w * 0.8), 12);
      waveEnemiesLeft.current = 0;
      pendingSpawns.current = count;
      const types: ("scout" | "fighter" | "tank")[] = ["scout"];
      if (w >= 2) types.push("fighter");
      if (w >= 4) types.push("tank");
      for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const def = ENEMY_DEFS[type];
        setTimeout(() => {
          if (gameOverRef.current || waveGeneration.current !== gen) return;
          pendingSpawns.current--;
          waveEnemiesLeft.current++;
          enemiesRef.current.push({
            x: rand(10, W - def.w - 10),
            y: -def.h - rand(0, 60),
            ...def, type, t: Math.random() * Math.PI * 2,
          });
        }, i * 300);
      }
    }
  }, []);

  // ── Draw ──
  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    // Screen shake
    const shake = screenShake.current > 0 ? screenShake.current * 4 : 0;
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.clearRect(-10, -10, W + 20, H + 20);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#060c1a");
    grad.addColorStop(0.5, "#0f1b33");
    grad.addColorStop(1, "#162244");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars (parallax)
    starsRef.current.forEach((s) => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Bullets
    bulletsRef.current.forEach((b) => {
      if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.h) || b.h <= 0) return;
      const bgrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      bgrad.addColorStop(0, "#fde047");
      bgrad.addColorStop(1, "#f97316");
      ctx.fillStyle = bgrad;
      ctx.fillRect(b.x - b.w / 2, b.y, b.w, b.h);
    });

    // Power-ups
    powerUpsRef.current.forEach((p) => {
      const colors = { shield: "#3b82f6", multi: "#a855f7", bomb: "#ef4444" };
      const labels = { shield: "S", multi: "M", bomb: "B" };
      ctx.fillStyle = colors[p.type];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labels[p.type], p.x, p.y);
    });

    // Enemies
    enemiesRef.current.forEach((e) => {
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

      if (e.type === "boss") {
        // Boss body
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -e.h / 2);
        ctx.lineTo(e.w / 2, 0);
        ctx.lineTo(e.w / 3, e.h / 2);
        ctx.lineTo(-e.w / 3, e.h / 2);
        ctx.lineTo(-e.w / 2, 0);
        ctx.closePath();
        ctx.fill();
        // Boss glow
        ctx.strokeStyle = "rgba(255,100,100,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
        // Boss eye
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(0, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(0, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        // Boss HP bar
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(-e.w / 2, -e.h / 2 - 10, e.w, 5);
        const hpRatio = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#eab308" : "#ef4444";
        ctx.fillRect(-e.w / 2, -e.h / 2 - 10, e.w * hpRatio, 5);
      } else if (e.type === "tank") {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -e.h / 2);
        ctx.lineTo(e.w / 2, e.h / 4);
        ctx.lineTo(e.w / 3, e.h / 2);
        ctx.lineTo(-e.w / 3, e.h / 2);
        ctx.lineTo(-e.w / 2, e.h / 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.arc(0, 0, e.w * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === "fighter") {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -e.h / 2);
        ctx.lineTo(e.w / 2, e.h / 3);
        ctx.lineTo(e.w / 4, e.h / 2);
        ctx.lineTo(-e.w / 4, e.h / 2);
        ctx.lineTo(-e.w / 2, e.h / 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Scout
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -e.h / 2);
        ctx.lineTo(e.w / 2, e.h / 2);
        ctx.lineTo(-e.w / 2, e.h / 2);
        ctx.closePath();
        ctx.fill();
      }

      // HP indicator for non-boss with hp > 1
      if (e.type !== "boss" && e.maxHp > 1) {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(-e.w / 2, -e.h / 2 - 6, e.w, 3);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(-e.w / 2, -e.h / 2 - 6, e.w * (e.hp / e.maxHp), 3);
      }

      ctx.restore();
    });

    // Player
    const p = playerRef.current;
    ctx.save();
    ctx.translate(p.x + PLAYER_W / 2, p.y + PLAYER_H / 2);
    // Shield effect
    if (shieldRef.current > 0) {
      ctx.strokeStyle = `rgba(59,130,246,${0.4 + Math.sin(Date.now() / 100) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_W * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Body
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.moveTo(0, -PLAYER_H / 2);
    ctx.lineTo(PLAYER_W / 2, PLAYER_H / 3);
    ctx.lineTo(PLAYER_W / 4, PLAYER_H / 2);
    ctx.lineTo(-PLAYER_W / 4, PLAYER_H / 2);
    ctx.lineTo(-PLAYER_W / 2, PLAYER_H / 3);
    ctx.closePath();
    ctx.fill();
    // Wings
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.moveTo(-PLAYER_W / 2, PLAYER_H / 3);
    ctx.lineTo(-PLAYER_W / 2 - 8, PLAYER_H / 2);
    ctx.lineTo(-PLAYER_W / 4, PLAYER_H / 3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(PLAYER_W / 2, PLAYER_H / 3);
    ctx.lineTo(PLAYER_W / 2 + 8, PLAYER_H / 2);
    ctx.lineTo(PLAYER_W / 4, PLAYER_H / 3);
    ctx.closePath();
    ctx.fill();
    // Cockpit
    ctx.fillStyle = "#93c5fd";
    ctx.beginPath();
    ctx.arc(0, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    // Engine
    ctx.fillStyle = multiShotRef.current > 0 ? "#a855f7" : "#f97316";
    ctx.beginPath();
    ctx.moveTo(-5, PLAYER_H / 2);
    ctx.lineTo(0, PLAYER_H / 2 + 8 + Math.random() * 5);
    ctx.lineTo(5, PLAYER_H / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Particles
    particlesRef.current.forEach((pt) => {
      const alpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color.replace(")", `,${alpha})`).replace("rgb(", "rgba(");
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // HUD
    // Lives
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("♥".repeat(livesRef.current), 8, 8);
    // Score
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${scoreRef.current}`, W - 8, 8);
    // Wave
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Wave ${waveRef.current}`, W / 2, 8);
    // Combo
    if (comboRef.current >= 3) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${comboRef.current}x COMBO`, W / 2, 24);
    }
    // Bombs
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`💣×${bombRef.current}`, 8, 26);
    // Power-up timers
    let py = 42;
    if (shieldRef.current > 0) {
      ctx.fillStyle = "#3b82f6";
      ctx.fillText(`🛡 ${shieldRef.current.toFixed(1)}s`, 8, py);
      py += 14;
    }
    if (multiShotRef.current > 0) {
      ctx.fillStyle = "#a855f7";
      ctx.fillText(`✦ ${multiShotRef.current.toFixed(1)}s`, 8, py);
    }

    ctx.restore(); // screen shake
  }, []);

  // ── Tick ──
  const tick = useCallback((dt: number) => {
    if (gameOverRef.current || !startedRef.current) return;

    const player = playerRef.current;
    const bullets = bulletsRef.current;
    const enemies = enemiesRef.current;
    const powerUps = powerUpsRef.current;
    const particles = particlesRef.current;

    // Player movement
    if (moveDir.current.left) player.x -= PLAYER_SPEED * dt;
    if (moveDir.current.right) player.x += PLAYER_SPEED * dt;
    if (moveDir.current.up) player.y -= PLAYER_SPEED * dt;
    if (moveDir.current.down) player.y += PLAYER_SPEED * dt;
    player.x = clamp(player.x, 0, W - PLAYER_W);
    player.y = clamp(player.y, 0, H - PLAYER_H);

    // Stars
    starsRef.current.forEach((s) => {
      s.y += s.speed * dt;
      if (s.y > H) { s.y = -2; s.x = Math.random() * W; }
    });

    // Power-up timers
    if (shieldRef.current > 0) shieldRef.current = Math.max(0, shieldRef.current - dt);
    if (multiShotRef.current > 0) multiShotRef.current = Math.max(0, multiShotRef.current - dt);
    comboTimerRef.current -= dt;
    if (comboTimerRef.current <= 0) { comboRef.current = 0; setCombo(0); }

    // Screen shake decay
    if (screenShake.current > 0) screenShake.current = Math.max(0, screenShake.current - dt * 4);

    // Auto fire
    fireTimer.current += dt;
    if (fireTimer.current >= FIRE_RATE) {
      fireTimer.current = 0;
      const bx = player.x + PLAYER_W / 2;
      const by = player.y;
      if (multiShotRef.current > 0) {
        bullets.push({ x: bx, y: by, dx: 0, dy: -BULLET_SPEED, w: 3, h: 12 });
        bullets.push({ x: bx - 8, y: by + 5, dx: -BULLET_SPEED * 0.15, dy: -BULLET_SPEED, w: 3, h: 10 });
        bullets.push({ x: bx + 8, y: by + 5, dx: BULLET_SPEED * 0.15, dy: -BULLET_SPEED, w: 3, h: 10 });
      } else {
        bullets.push({ x: bx, y: by, dx: 0, dy: -BULLET_SPEED, w: 3, h: 12 });
      }
    }

    // Move bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx * dt;
      b.y += b.dy * dt;
      if (!isFinite(b.x) || !isFinite(b.y) || b.y < -20 || b.x < -20 || b.x > W + 20) bullets.splice(i, 1);
    }

    // Wave management
    if (enemies.length === 0 && waveEnemiesLeft.current <= 0 && pendingSpawns.current <= 0) {
      waveTimer.current += dt;
      if (waveTimer.current >= 1.5) {
        waveTimer.current = 0;
        waveRef.current++;
        setWave(waveRef.current);
        spawnWave(waveRef.current);
      }
    }

    // Move enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.t += dt;

      if (e.type === "boss") {
        // Boss: move to center, then sway
        const targetY = 80;
        if (e.y < targetY) e.y += e.speed * dt;
        else e.x += Math.sin(e.t * 1.5) * 80 * dt;
        e.x = clamp(e.x, 0, W - e.w);

        // Boss shoots
        if (Math.random() < dt * 2) {
          const bx = e.x + e.w / 2;
          const by = e.y + e.h;
          if (isFinite(bx) && isFinite(by) && isFinite(player.x) && isFinite(player.y)) {
            const angle = Math.atan2(player.y + PLAYER_H / 2 - by, player.x + PLAYER_W / 2 - bx);
            bullets.push({ x: bx, y: by, dx: Math.cos(angle) * 200, dy: Math.sin(angle) * 200, w: 4, h: 8 });
          }
        }
      } else if (e.type === "fighter") {
        // Zigzag
        e.y += e.speed * dt;
        e.x += Math.sin(e.t * 3) * 100 * dt;
        e.x = clamp(e.x, 0, W - e.w);
      } else if (e.type === "tank") {
        e.y += e.speed * dt;
      } else {
        // Scout
        e.y += e.speed * dt;
      }

      // Off screen
      if (e.y > H + 50) {
        enemies.splice(i, 1);
        if (e.type !== "boss") waveEnemiesLeft.current = Math.max(0, waveEnemiesLeft.current - 1);
        continue;
      }

      // Collision with player
      const playerBox = { x: player.x, y: player.y, w: PLAYER_W, h: PLAYER_H };
      if (overlap(playerBox, e)) {
        if (shieldRef.current <= 0) {
          livesRef.current--;
          setLives(livesRef.current);
          screenShake.current = 1;
          spawnExplosion(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, "rgb(96,165,250)", 8);
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
        }
        if (e.type !== "boss") {
          spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color);
          enemies.splice(i, 1);
          waveEnemiesLeft.current = Math.max(0, waveEnemiesLeft.current - 1);
        }
        continue;
      }

      // Bullet collision with enemies
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.dy > 0) continue; // enemy bullet
        const bulletBox = { x: b.x - b.w / 2, y: b.y, w: b.w, h: b.h };
        if (overlap(bulletBox, e)) {
          bullets.splice(j, 1);
          e.hp--;
          spawnExplosion(b.x, b.y, "rgb(250,204,21)", 4);
          if (e.hp <= 0) {
            spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color, e.type === "boss" ? 30 : 15);
            enemies.splice(i, 1);
            if (e.type === "boss") {
              bossActive.current = false;
              screenShake.current = 1.5;
              waveEnemiesLeft.current = 0;
            } else {
              waveEnemiesLeft.current = Math.max(0, waveEnemiesLeft.current - 1);
            }
            // Combo
            comboRef.current++;
            comboTimerRef.current = 2;
            setCombo(comboRef.current);
            const comboMult = comboRef.current >= 5 ? 3 : comboRef.current >= 3 ? 2 : 1;
            scoreRef.current += e.score * comboMult;
            setScore(scoreRef.current);
            // Drop power-up
            if (Math.random() < (e.type === "boss" ? 1 : 0.15)) {
              const types: PowerUp["type"][] = ["shield", "multi", "bomb"];
              powerUps.push({
                x: e.x + e.w / 2, y: e.y + e.h / 2,
                type: types[Math.floor(Math.random() * types.length)],
              });
            }
          }
          break;
        }
      }
    }

    // Enemy bullets hitting player
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (b.dy <= 0) continue;
      const playerBox = { x: player.x, y: player.y, w: PLAYER_W, h: PLAYER_H };
      const bulletBox = { x: b.x - b.w / 2, y: b.y, w: b.w, h: b.h };
      if (overlap(bulletBox, playerBox)) {
        bullets.splice(i, 1);
        if (shieldRef.current <= 0) {
          livesRef.current--;
          setLives(livesRef.current);
          screenShake.current = 0.8;
          spawnExplosion(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, "rgb(96,165,250)", 8);
          if (livesRef.current <= 0) {
            gameOverRef.current = true;
            setGameOver(true);
            setBest((b2) => {
              const nb = Math.max(b2, scoreRef.current);
              localStorage.setItem(STORAGE_KEY, String(nb));
              return nb;
            });
            return;
          }
        }
      }
    }

    // Power-up collection
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const pu = powerUps[i];
      pu.y += 60 * dt;
      if (pu.y > H + 20) { powerUps.splice(i, 1); continue; }
      const puBox = { x: pu.x - 12, y: pu.y - 12, w: 24, h: 24 };
      const playerBox = { x: player.x, y: player.y, w: PLAYER_W, h: PLAYER_H };
      if (overlap(puBox, playerBox)) {
        powerUps.splice(i, 1);
        if (pu.type === "shield") shieldRef.current = 5;
        else if (pu.type === "multi") multiShotRef.current = 6;
        else if (pu.type === "bomb") bombRef.current = Math.min(bombRef.current + 1, 3);
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }
  }, [spawnWave]);

  // ── Game loop ──
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

  // ── Keyboard ──
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); moveDir.current.left = true; }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); moveDir.current.right = true; }
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); moveDir.current.up = true; }
      if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); moveDir.current.down = true; }
      if (e.key === " " || e.key === "b") {
        e.preventDefault();
        if (bombRef.current > 0 && startedRef.current && !gameOverRef.current) {
          bombRef.current--;
          screenShake.current = 1.2;
          // Destroy all non-boss enemies
          enemiesRef.current.forEach((en) => {
            if (en.type !== "boss") {
              spawnExplosion(en.x + en.w / 2, en.y + en.h / 2, en.color, 10);
              scoreRef.current += en.score;
            }
          });
          enemiesRef.current = enemiesRef.current.filter((en) => en.type === "boss");
          waveEnemiesLeft.current = enemiesRef.current.length;
          setScore(scoreRef.current);
          // Clear enemy bullets
          bulletsRef.current = bulletsRef.current.filter((b) => b.dy < 0);
        }
      }
      if (!startedRef.current && !gameOverRef.current) {
        startedRef.current = true;
        setStarted(true);
        spawnWave(1);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") moveDir.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") moveDir.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w") moveDir.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") moveDir.current.down = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [spawnWave]);

  // ── Touch ──
  const handleTouchStart = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = (e.touches[0].clientX - rect.left) * (W / rect.width);
    const ty = (e.touches[0].clientY - rect.top) * (H / rect.height);
    touchRef.current = { x: tx, y: ty, px: playerRef.current.x, py: playerRef.current.y };
    if (!startedRef.current && !gameOverRef.current) {
      startedRef.current = true;
      setStarted(true);
      spawnWave(1);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tx = (e.touches[0].clientX - rect.left) * (W / rect.width);
    const ty = (e.touches[0].clientY - rect.top) * (H / rect.height);
    playerRef.current.x = clamp(touchRef.current.px + (tx - touchRef.current.x), 0, W - PLAYER_W);
    playerRef.current.y = clamp(touchRef.current.py + (ty - touchRef.current.y), 0, H - PLAYER_H);
  };

  const handleTouchEnd = () => { touchRef.current = null; };

  // Double-tap for bomb
  const lastTapRef = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300 && bombRef.current > 0 && startedRef.current && !gameOverRef.current) {
      bombRef.current--;
      screenShake.current = 1.2;
      enemiesRef.current.forEach((en) => {
        if (en.type !== "boss") spawnExplosion(en.x + en.w / 2, en.y + en.h / 2, en.color, 10);
      });
      enemiesRef.current = enemiesRef.current.filter((en) => en.type === "boss");
      waveEnemiesLeft.current = enemiesRef.current.length;
      bulletsRef.current = bulletsRef.current.filter((b) => b.dy < 0);
    }
    lastTapRef.current = now;
  };

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
          <div className="text-[9px] text-slate-400 font-bold">波次</div>
          <div className="text-sm font-black text-blue-500">{wave}</div>
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleDoubleTap}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" />
        {!started && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl px-6 py-4 text-center space-y-1">
              <div className="text-sm font-black text-slate-800 dark:text-white">飞机大战</div>
              <div className="text-[10px] text-slate-500">触摸跟随移动 · 双击放炸弹</div>
              <div className="text-[10px] text-slate-500">方向键移动 · 空格放炸弹</div>
            </div>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 text-center space-y-2">
              <div className="text-lg font-black text-slate-800 dark:text-white">游戏结束</div>
              <div className="text-sm text-slate-500">得分：{score} · Wave {wave}</div>
              <button type="button" onClick={(e) => { e.stopPropagation(); restart(); }}
                className="px-6 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 active:scale-95 transition-all">
                再来一局
              </button>
            </div>
          </div>
        )}
      </div>

      <button type="button" onClick={restart}
        className="w-full py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 active:scale-95 transition-all">
        重新开始
      </button>
      <div className="text-[10px] text-slate-400">自动射击 · 收集道具增强</div>
    </div>
  );
}
