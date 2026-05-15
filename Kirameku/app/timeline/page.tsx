"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, BookOpen, Eye, Heart, Calendar } from "lucide-react";
import { getPosts, type PostItem } from "@/app/api";

// ── 分类样式 ──────────────────────────────────────────

function getCatTextColor(cat: string): string {
  const map: Record<string, string> = {
    技术: "text-cyan-600 dark:text-cyan-400",
    生活: "text-violet-600 dark:text-violet-400",
    学术: "text-amber-600 dark:text-amber-400",
    随笔: "text-pink-600 dark:text-pink-400",
    项目: "text-emerald-600 dark:text-emerald-400",
    教程: "text-blue-600 dark:text-blue-400",
  };
  return map[cat] || "text-slate-500 dark:text-slate-400";
}

function getCatBgColor(cat: string): string {
  const map: Record<string, string> = {
    技术: "bg-cyan-500/10",
    生活: "bg-violet-500/10",
    学术: "bg-amber-500/10",
    随笔: "bg-pink-500/10",
    项目: "bg-emerald-500/10",
    教程: "bg-blue-500/10",
  };
  return map[cat] || "bg-slate-500/10";
}

function getCatColor(cat: string): string {
  const map: Record<string, string> = {
    技术: "#22d3ee",
    生活: "#a78bfa",
    学术: "#fbbf24",
    随笔: "#f472b6",
    项目: "#34d399",
    教程: "#60a5fa",
  };
  return map[cat] || "#94a3b8";
}

// ── 日期工具 ──────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── 主组件 ────────────────────────────────────────────

export default function TimelinePage() {
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [dragX, setDragX] = useState(0);
  const didDrag = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    getPosts({ status: "published", page: 1, size: 200 })
      .then(setAllPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () =>
      [...allPosts].sort(
        (a, b) =>
          new Date(b.published_at || b.created_at).getTime() -
          new Date(a.published_at || a.created_at).getTime()
      ),
    [allPosts]
  );

  // 响应式常量
  const CARD_W = isMobile ? 170 : 240;
  const CARD_H = isMobile ? 180 : 230;
  const CARD_GAP = isMobile ? 40 : 60;
  const RIVER_Y = isMobile ? 180 : 240;
  const SVG_TOP = -100;
  const AMPLITUDE = isMobile ? 50 : 80;
  const WAVELENGTH = isMobile ? 400 : 600;
  const PADDING = isMobile ? 300 : 600;

  const totalWidth = PADDING * 2 + sorted.length * (CARD_W + CARD_GAP) - CARD_GAP;
  const svgHeight = RIVER_Y + AMPLITUDE + CARD_H + 120 - SVG_TOP;

  // 河流路径
  const riverPath = useMemo(() => {
    const parts: string[] = [];
    const steps = Math.max(1, Math.ceil(totalWidth / 4));
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * totalWidth;
      const y =
        RIVER_Y +
        AMPLITUDE * 0.5 * Math.sin((x / WAVELENGTH) * Math.PI * 2) +
        AMPLITUDE * 0.3 * Math.sin((x / (WAVELENGTH * 0.6)) * Math.PI * 2 + 1) +
        AMPLITUDE * 0.2 * Math.sin((x / (WAVELENGTH * 1.5)) * Math.PI * 2 + 2.5);
      parts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return parts.join(" ");
  }, [totalWidth, RIVER_Y, AMPLITUDE, WAVELENGTH]);

  const riverPathBottom = useMemo(() => {
    const parts: string[] = [];
    const steps = Math.max(1, Math.ceil(totalWidth / 4));
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * totalWidth;
      const y =
        RIVER_Y +
        AMPLITUDE * 0.5 * Math.sin((x / WAVELENGTH) * Math.PI * 2) +
        AMPLITUDE * 0.3 * Math.sin((x / (WAVELENGTH * 0.6)) * Math.PI * 2 + 1) +
        AMPLITUDE * 0.2 * Math.sin((x / (WAVELENGTH * 1.5)) * Math.PI * 2 + 2.5);
      parts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${(y + 12).toFixed(1)}`);
    }
    return parts.join(" ");
  }, [totalWidth, RIVER_Y, AMPLITUDE, WAVELENGTH]);

  // 可视区域裁剪：只渲染屏幕范围 ± 2 张卡片
  const viewWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const visibleRange = useMemo(() => {
    const visibleLeft = -dragX - PADDING - (CARD_W + CARD_GAP) * 2;
    const visibleRight = -dragX + viewWidth + PADDING + (CARD_W + CARD_GAP) * 2;
    const startIdx = Math.max(0, Math.floor(visibleLeft / (CARD_W + CARD_GAP)));
    const endIdx = Math.min(sorted.length, Math.ceil(visibleRight / (CARD_W + CARD_GAP)) + 1);
    return { startIdx, endIdx };
  }, [dragX, viewWidth, sorted.length, CARD_W, CARD_GAP, PADDING]);

  // ── 加载态 ──
  if (loading) {
    return (
      <div className="w-full py-6 md:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <Clock className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
            <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">归档</h1>
          </div>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 ml-7 md:ml-10">时光河流 · 记录每一个瞬间</p>
        </motion.div>
        <div className="flex items-center justify-center py-20 md:py-32">
          <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── 空态 ──
  if (!sorted.length) {
    return (
      <div className="w-full py-6 md:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <Clock className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
            <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">归档</h1>
          </div>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 ml-7 md:ml-10">时光河流 · 记录每一个瞬间</p>
        </motion.div>
        <div className="flex flex-col items-center justify-center py-20 md:py-32 text-slate-400">
          <BookOpen className="w-8 h-8 md:w-12 md:h-12 mb-3 md:mb-4 opacity-40" />
          <p className="text-sm md:text-base">暂无文章</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 md:py-12">
      {/* 页头 */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 md:mb-4">
        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
          <Clock className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">归档</h1>
        </div>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 ml-7 md:ml-10">时光河流 · 共 {allPosts.length} 篇文章</p>
      </motion.div>

      {/* 拖动区 */}
      <div className="overflow-hidden pb-4 select-none">
        <motion.div
          drag="x"
          dragMomentum
          dragElastic={0.1}
          dragConstraints={{ left: -(totalWidth - (typeof window !== "undefined" ? window.innerWidth : 1200)), right: 0 }}
          initial={{ x: -(PADDING - (typeof window !== "undefined" ? (window.innerWidth - CARD_W) / 2 : 300)) }}
          onDrag={(_, info) => { setDragX(info.offset.x); }}
          onDragStart={() => { didDrag.current = true; }}
          onDragEnd={() => { setTimeout(() => { didDrag.current = false; }, 100); }}
          className="cursor-grab active:cursor-grabbing"
        >
          <svg width={totalWidth} height={svgHeight} viewBox={`0 ${SVG_TOP} ${totalWidth} ${svgHeight}`} className="block">
            <defs>
              <linearGradient id="river-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                <stop offset="5%" stopColor="#38bdf8" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.6" />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="river-grad-dark" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                <stop offset="5%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
              {!isMobile && (
                <>
                  <filter id="river-glow" x="-5%" y="-20%" width="110%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                  </filter>
                  <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                </>
              )}
            </defs>

            {/* 河流主体 */}
            <motion.path d={riverPath} fill="none" stroke="url(#river-grad)" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, ease: "easeInOut" }} />
            {/* 河流发光层（PC） */}
            {!isMobile && (
              <motion.path d={riverPath} fill="none" stroke="url(#river-grad)" strokeWidth="20" filter="url(#river-glow)" opacity="0.3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, ease: "easeInOut" }} />
            )}
            {/* 河流底部微光 */}
            <motion.path d={riverPathBottom} fill="none" stroke="url(#river-grad-dark)" strokeWidth="1" opacity="0.15" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, ease: "easeInOut" }} />

            {/* 流动粒子 */}
            {(isMobile ? [0, 0.3, 0.6] : [0, 0.15, 0.3, 0.5, 0.65, 0.8]).map((offset, i) => (
              <circle key={i} r="3" fill="#38bdf8" opacity="0.7" filter={isMobile ? undefined : "url(#dot-glow)"}>
                <animateMotion dur={`${8 + i * 1.5}s`} repeatCount="indefinite" begin={`${offset * (8 + i * 1.5)}s`}>
                  <mpath href="#river-flow-path" />
                </animateMotion>
              </circle>
            ))}
            <path id="river-flow-path" d={riverPath} fill="none" stroke="none" />

            {/* 文章卡片（可视区域裁剪） */}
            {sorted.slice(visibleRange.startIdx, visibleRange.endIdx).map((post, ri) => {
              const i = visibleRange.startIdx + ri;
              const x = PADDING + i * (CARD_W + CARD_GAP);
              const cx = x + CARD_W / 2;
              const waveY =
                RIVER_Y +
                AMPLITUDE * 0.5 * Math.sin((cx / WAVELENGTH) * Math.PI * 2) +
                AMPLITUDE * 0.3 * Math.sin((cx / (WAVELENGTH * 0.6)) * Math.PI * 2 + 1) +
                AMPLITUDE * 0.2 * Math.sin((cx / (WAVELENGTH * 1.5)) * Math.PI * 2 + 2.5);

              const isAbove = i % 2 === 0;
              const cardY = isAbove ? waveY - (isMobile ? 30 : 50) - CARD_H : waveY + (isMobile ? 30 : 50);
              const lineStartY = isAbove ? cardY + CARD_H : cardY;
              const lineEndY = waveY;
              const catColor = getCatColor(post.category);
              const dateStr = formatDate(post.published_at || post.created_at);

              return (
                <g key={post.id} className="cursor-pointer" onClick={() => { if (!didDrag.current) router.push(`/posts/${post.slug}`); }}>
                  {/* 连接线 */}
                  <line x1={cx} y1={lineStartY} x2={cx} y2={lineEndY} stroke={catColor} strokeWidth="1.5" opacity="0.4" strokeDasharray="4 3" />
                  {/* 河流节点 */}
                  <circle cx={cx} cy={waveY} r="6" fill="#ffffff" />
                  <circle cx={cx} cy={waveY} r="10" fill="#ffffff" opacity="0.25" />
                  {/* 时间标注 */}
                  <text x={cx} y={waveY + (isAbove ? 22 : -12)} textAnchor="middle" fill="#f8fafc" fontSize={isMobile ? "9" : "11"} fontWeight="700">
                    {dateStr}
                  </text>

                  {/* 卡片 */}
                  <foreignObject x={x} y={cardY} width={CARD_W} height={CARD_H} style={{ overflow: "visible" }}>
                    <div className={`w-full h-full rounded-xl md:rounded-2xl overflow-hidden border border-white/40 dark:border-white/10 shadow-lg transition-all duration-300 group ${isMobile ? "bg-white/80 dark:bg-slate-800/90" : "bg-white/60 dark:bg-slate-800/70 backdrop-blur-xl"}`}>
                      {post.cover ? (
                        <div className="relative overflow-hidden" style={{ height: isMobile ? 70 : 100 }}>
                          <img src={post.cover} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute bottom-1.5 left-2 md:bottom-2 md:left-3 flex items-center gap-1 text-white/80 text-[8px] md:text-[10px]">
                            <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            {dateStr}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center" style={{ height: isMobile ? 70 : 100 }}>
                          <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-slate-300 dark:text-slate-600" />
                          <span className="absolute bottom-1.5 left-2 md:bottom-2 md:left-3 text-[8px] md:text-[10px] text-slate-400">{dateStr}</span>
                        </div>
                      )}
                      <div className="p-2 md:p-3">
                        <h3 className="text-[10px] md:text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 mb-1 md:mb-1.5 group-hover:text-sky-500 transition-colors leading-snug">
                          {post.title}
                        </h3>
                        {post.description && (
                          <p className="text-[8px] md:text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-1.5 md:mb-2 leading-relaxed">
                            {post.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          {post.category ? (
                            <span className={`text-[7px] md:text-[9px] px-1 md:px-1.5 py-0.5 rounded-full font-medium ${getCatBgColor(post.category)} ${getCatTextColor(post.category)}`}>
                              {post.category}
                            </span>
                          ) : <span />}
                          <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 dark:text-slate-400 text-[8px] md:text-[10px]">
                            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5 md:w-3 md:h-3" />{post.views}</span>
                            <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 md:w-3 md:h-3" />{post.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </motion.div>
      </div>

      {/* 提示 */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-[10px] md:text-xs text-slate-400 mt-3 md:mt-4 max-w-6xl mx-auto">
        左右滑动浏览时光河流 · 点击文章卡片跳转阅读
      </motion.p>

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
