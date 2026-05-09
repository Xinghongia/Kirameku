"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Heart, ChevronLeft } from "lucide-react";
import Lightbox from "@/components/photos/Lightbox";
import { getChatters, type ChatterItem } from "@/app/api";
import { siteConfig } from "@/siteConfig";

interface Moment {
  id: string;
  content: string;
  images: string[];
  mood: string;
  likes: number;
  created_at: string;
}

interface Photo {
  id: string;
  url: string;
  caption: string;
  orientation: "landscape" | "portrait";
}

const rotations = [-2, 1.5, -1, 2, -1.5, 1, -0.5, 1.5];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(dateStr);
}

export default function MomentsPage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [onlyViewId, setOnlyViewId] = useState<string | null>(() => searchParams.get("onlyView"));
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<{
    photos: Photo[];
    index: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getChatters({ status: "published", page: 1, size: 50 });
        if (!active) return;
        const mapped: Moment[] = data.map((item: ChatterItem) => ({
          id: String(item.id),
          content: item.content,
          images: item.images || [],
          mood: item.mood || "",
          likes: item.likes,
          created_at: item.created_at,
        }));
        setMoments(mapped);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const dayGroups = useMemo(() => {
    const map = new Map<string, Moment[]>();
    for (const m of moments) {
      const key = m.created_at.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      date: key,
      label: formatDate(items[0].created_at),
      moments: items,
    }));
  }, [moments]);

  const visibleGroups = onlyViewId
    ? dayGroups
        .map((g) => ({
          ...g,
          moments: g.moments.filter((m) => m.id === onlyViewId),
        }))
        .filter((g) => g.moments.length > 0)
    : dayGroups;

  function toggleLike(id: string) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-12"
        >
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <MessageSquare className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
            <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
              说说
            </h1>
          </div>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 ml-7 md:ml-10">
            记录生活中的小确幸
          </p>
        </motion.div>
        <div className="space-y-3 md:space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 md:h-24 rounded-2xl bg-white/40 dark:bg-slate-800/40 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-12">
      {/* 页头 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 md:mb-12"
      >
        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
          <MessageSquare className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
            说说
          </h1>
        </div>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 ml-7 md:ml-10">
          记录生活中的小确幸
        </p>
      </motion.div>

      {/* 只看模式返回 */}
      {onlyViewId && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          type="button"
          onClick={() => setOnlyViewId(null)}
          className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500 hover:text-sky-500 transition-colors mb-4 md:mb-8"
        >
          <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
          返回全部
        </motion.button>
      )}

      {/* 空状态 */}
      {!loading && moments.length === 0 && (
        <div className="text-center py-12 md:py-20 text-slate-400">
          <MessageSquare className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-40" />
          <p className="text-sm md:text-base">暂无说说</p>
        </div>
      )}

      {/* 日期分组 */}
      {visibleGroups.map((group, groupIdx) => (
        <motion.div
          key={group.date}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: groupIdx * 0.1 }}
          className="mb-8 md:mb-14 last:mb-0"
        >
          {/* 日期标签 */}
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-5">
            <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">
              {group.label}
            </span>
            <span className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
              {group.moments.length} 条
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
          </div>

          {/* 卡片堆叠区 */}
          <div
            className="relative"
            style={{
              minHeight:
                group.moments.length > 1
                  ? 100 + (group.moments.length - 1) * 18
                  : "auto",
            }}
          >
            {group.moments.map((moment, i) => {
              const rot = rotations[i % rotations.length];
              const offsetX = i % 2 === 0 ? -4 : 4;
              const isExpanded = expandedId === moment.id;
              const hasImages = moment.images && moment.images.length > 0;

              return (
                <motion.div
                  key={moment.id}
                  layout
                  ref={(el) => {
                    if (isExpanded && el) {
                      setTimeout(() => {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "nearest",
                        });
                      }, 100);
                    }
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotate: isExpanded ? 0 : onlyViewId ? 0 : rot,
                    x: isExpanded ? 0 : onlyViewId ? 0 : offsetX,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: i * 0.05,
                  }}
                  whileHover={
                    !isExpanded && !onlyViewId
                      ? { rotate: 0, x: 0, y: -4, scale: 1.01 }
                      : undefined
                  }
                  onClick={() =>
                    setExpandedId(isExpanded ? null : moment.id)
                  }
                  className={`${
                    group.moments.length > 1 && !onlyViewId
                      ? "absolute left-0 right-0"
                      : "relative"
                  } cursor-pointer`}
                  style={{
                    zIndex: isExpanded ? 50 : group.moments.length - i,
                    ...(group.moments.length > 1 && !onlyViewId
                      ? { top: i * 18 }
                      : {}),
                  }}
                >
                  <div className="rounded-2xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                    {/* 叠放态：简洁预览 */}
                    {!isExpanded && !onlyViewId && (
                      <div className="px-3 py-3 md:px-5 md:py-4">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] md:text-xs text-slate-400">
                            {relativeTime(moment.created_at)}
                          </span>
                          {moment.mood && (
                            <span className="text-[10px] md:text-xs">{moment.mood}</span>
                          )}
                          {hasImages && (
                            <span className="text-[10px] md:text-xs text-slate-400">
                              📷
                            </span>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {moment.content}
                        </p>
                      </div>
                    )}

                    {/* 展开态：完整内容 */}
                    {(isExpanded || onlyViewId) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="p-3 md:p-5"
                      >
                        {/* 头部 */}
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <Image
                              src="/images/hong.jpg"
                              alt="avatar"
                              width={24}
                              height={24}
                              className="rounded-full object-cover md:w-7 md:h-7"
                            />
                            <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {siteConfig.authorName}
                            </span>
                            <span className="text-[10px] md:text-xs text-slate-400">
                              {relativeTime(moment.created_at)}
                            </span>
                          </div>
                          {moment.mood && (
                            <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                              {moment.mood}
                            </span>
                          )}
                        </div>

                        {/* 内容 */}
                        <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3 md:mb-4 whitespace-pre-wrap">
                          {moment.content}
                        </p>

                        {/* 图片网格 */}
                        {hasImages && (
                          <div
                            className={`grid gap-1.5 md:gap-2 mb-3 md:mb-4 ${
                              moment.images.length <= 2
                                ? "grid-cols-2"
                                : "grid-cols-3"
                            }`}
                          >
                            {moment.images.map((img, idx) => {
                              const photos: Photo[] = moment.images.map(
                                (url, i) => ({
                                  id: `${moment.id}-${i}`,
                                  url,
                                  caption: "",
                                  orientation: "landscape" as const,
                                })
                              );
                              return (
                                <div
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightbox({ photos, index: idx });
                                  }}
                                  className="relative rounded-lg md:rounded-xl overflow-hidden cursor-pointer group/img aspect-square"
                                >
                                  <Image
                                    src={img}
                                    alt=""
                                    fill
                                    sizes="(max-width: 640px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-300 group-hover/img:scale-105"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* 底部操作 */}
                        <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-slate-200/50 dark:border-white/5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(moment.id);
                            }}
                            className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-slate-400 hover:text-pink-500 transition-colors"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-all duration-300 ${
                                likedIds.has(moment.id)
                                  ? "fill-pink-500 text-pink-500 scale-110"
                                  : ""
                              }`}
                            />
                            <span>
                              {moment.likes +
                                (likedIds.has(moment.id) ? 1 : 0)}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOnlyViewId(
                                onlyViewId === moment.id
                                  ? null
                                  : moment.id
                              );
                            }}
                            className="text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors"
                          >
                            {onlyViewId === moment.id
                              ? "返回全部"
                              : "只看这条"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* 展开遮罩 */}
      <AnimatePresence>
        {expandedId && !onlyViewId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedId(null)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* 灯箱 */}
      <Lightbox
        photos={lightbox?.photos ?? []}
        index={lightbox?.index ?? 0}
        open={!!lightbox}
        onClose={() => setLightbox(null)}
        onPrev={() =>
          setLightbox((lb) =>
            lb
              ? {
                  ...lb,
                  index:
                    (lb.index - 1 + lb.photos.length) % lb.photos.length,
                }
              : null
          )
        }
        onNext={() =>
          setLightbox((lb) =>
            lb
              ? {
                  ...lb,
                  index: (lb.index + 1) % lb.photos.length,
                }
              : null
          )
        }
      />
    </div>
  );
}
