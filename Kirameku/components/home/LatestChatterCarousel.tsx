"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { MessageSquare, Heart } from "lucide-react";
import { getChatters } from "@/app/api";
import type { ChatterItem } from "@/app/api";

function ChatterImage({ src }: { src: string }) {
  const [isLandscape, setIsLandscape] = useState(true);
  return (
    <div
      className={`rounded-lg overflow-hidden relative shrink-0 ${
        isLandscape ? "w-[100px] h-[56px]" : "w-[56px] h-[72px]"
      }`}
    >
      <Image
        src={src}
        fill
        sizes={isLandscape ? "100px" : "56px"}
        draggable={false}
        className="object-cover"
        alt=""
        onLoad={(e) => {
          const img = e.currentTarget;
          setIsLandscape(img.naturalWidth >= img.naturalHeight);
        }}
      />
    </div>
  );
}

const SWIPE_THRESHOLD = 80;

function relativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return dateStr.replace("T", " ").slice(5, 16);
}

export default function LatestChatterCarousel() {
  const router = useRouter();
  const [items, setItems] = useState<ChatterItem[]>([]);
  const [topIndex, setTopIndex] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const didDrag = useRef(false);

  useEffect(() => {
    getChatters({ status: "published", page: 1, size: 50 })
      .then((data) => {
        if (!data.length) return;
        const latestDate = data[0].created_at.slice(0, 10);
        const latestDay = data.filter(
          (c) => c.created_at.slice(0, 10) === latestDate
        );
        setItems(latestDay);
      })
      .catch(() => {});
  }, []);

  const goNext = useCallback(() => {
    setTopIndex((prev) => (prev + 1) % items.length);
    setOffset({ x: 0, y: 0 });
  }, [items.length]);

  function handlePointerDown(clientX: number, clientY: number) {
    startX.current = clientX;
    startY.current = clientY;
    didDrag.current = false;
    setIsDragging(true);
  }

  function handlePointerMove(clientX: number, clientY: number) {
    if (!isDragging) return;
    const dx = clientX - startX.current;
    const dy = clientY - startY.current;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      didDrag.current = true;
    }
    setOffset({ x: dx, y: dy });
  }

  function handlePointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    const dist = Math.sqrt(offset.x ** 2 + offset.y ** 2);
    if (dist > SWIPE_THRESHOLD) {
      goNext();
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }

  function handleClick() {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    const current = items[topIndex];
    if (current) {
      router.push(`/moments?onlyView=${current.id}`);
    } else {
      router.push("/moments");
    }
  }

  if (!items.length) {
    return (
      <div className="w-full h-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl min-h-[160px] md:min-h-[220px] flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
        <MessageSquare className="w-10 h-10 opacity-40" />
        <span className="text-sm">暂无说说</span>
      </div>
    );
  }

  const rotation = offset.x * 0.06;
  const dist = Math.sqrt(offset.x ** 2 + offset.y ** 2);
  const opacity = Math.max(0, 1 - dist / 300);

  return (
    <div
      className="w-full h-full rounded-3xl overflow-hidden relative min-h-[160px] md:min-h-[220px] select-none cursor-grab active:cursor-grabbing touch-none"
      onMouseDown={(e) => {
        e.preventDefault();
        handlePointerDown(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) =>
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)
      }
      onTouchMove={(e) =>
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
      }
      onTouchEnd={handlePointerUp}
      onClick={handleClick}
    >
      {[...items].reverse().map((item, reverseIdx) => {
        const idx = items.length - 1 - reverseIdx;
        const stackPos =
          (idx - topIndex + items.length) % items.length;
        if (stackPos > 2) return null;

        const isTop = stackPos === 0;
        const scale = 1 - stackPos * 0.04;
        const translateY = stackPos * 8;

        return (
          <motion.div
            key={item.id}
            animate={{
              scale: isTop && isDragging ? 1 : scale,
              y: isTop && isDragging ? offset.y : translateY,
              x: isTop ? offset.x : 0,
              rotate: isTop ? rotation : 0,
              opacity: isTop ? opacity : 0.6 - stackPos * 0.2,
              zIndex: items.length - stackPos,
            }}
            transition={
              isTop && isDragging
                ? { duration: 0 }
                : { type: "spring", stiffness: 400, damping: 30 }
            }
            className={`absolute inset-0 rounded-3xl border shadow-lg p-3 md:p-5 flex flex-col justify-between pointer-events-none overflow-hidden ${
              isTop
                ? "bg-white dark:bg-slate-800 border-white/50 dark:border-white/10"
                : "bg-slate-200 dark:bg-slate-700 border-slate-200 dark:border-slate-700"
            }`}
          >
            {isTop ? (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {item.mood && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium">
                        {item.mood}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {relativeTime(item.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {item.content}
                  </p>
                  {item.images.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {item.images.slice(0, 3).map((img, i) => (
                        <ChatterImage key={i} src={img} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
                  <Heart className="w-3.5 h-3.5" />
                  <span>{item.likes}</span>
                </div>
              </>
            ) : null}
          </motion.div>
        );
      })}

      {items.length > 1 && (
        <div className="absolute bottom-4 right-5 z-30 flex gap-1.5">
          {items.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === topIndex ? "w-4 bg-sky-400" : "w-1 bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
