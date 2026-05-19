"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAlbums, getAlbumPhotos } from "@/app/api";

interface Photo {
  id: number;
  url: string;
  caption: string;
}

export default function PhotoWallPreview() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const startX = useRef(0);
  const endX = useRef(0);
  const didSwipe = useRef(false);
  const isDragging = useRef(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const targetTitle = isMobile ? "2" : "1";
    getAlbums()
      .then((albums) => {
        const target = albums.find((a) => a.title === targetTitle);
        if (!target) return;
        return getAlbumPhotos(target.id);
      })
      .then((data) => {
        if (data?.length) setPhotos(data.reverse());
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [photos.length]);

  // 预加载下一张，避免切图时重新请求
  useEffect(() => {
    if (photos.length < 2) return;
    const next = (currentIndex + 1) % photos.length;
    const img = new Image();
    img.src = photos[next].url;
  }, [currentIndex, photos]);

  const goNext = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  function handlePointerDown(clientX: number) {
    startX.current = clientX;
    endX.current = clientX;
    didSwipe.current = false;
    isDragging.current = true;
  }

  function handlePointerMove(clientX: number) {
    if (!isDragging.current) return;
    endX.current = clientX;
  }

  function handlePointerUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = startX.current - endX.current;
    if (Math.abs(diff) > 40) {
      didSwipe.current = true;
      if (diff > 0) goNext();
      else goPrev();
    }
  }

  function handleClick() {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    router.push("/photowall");
  }

  if (!photos.length) {
    return (
      <div
        onClick={handleClick}
        className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden min-h-[240px] md:min-h-[420px] h-full flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500 cursor-pointer"
      >
        <svg
          className="w-12 h-12 opacity-40"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
        <span className="text-sm">暂无照片</span>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden relative group min-h-[240px] md:min-h-[420px] h-full flex flex-col select-none cursor-pointer touch-none"
      onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
      onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
      onTouchEnd={handlePointerUp}
      onMouseDown={(e) => {
        e.preventDefault();
        handlePointerDown(e.clientX);
      }}
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
    >
      {/* 只渲染当前一张图，通过 JS 预加载下一张，AnimatePresence 做交叉渐隐 */}
      <AnimatePresence>
        <motion.div
          key={photos[currentIndex].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <img
            src={photos[currentIndex].url}
            draggable={false}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 pointer-events-none"
            alt=""
          />
        </motion.div>
      </AnimatePresence>

      {photos.length > 1 && (
        <div className="absolute bottom-4 right-6 z-30 flex gap-2">
          {photos.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentIndex
                  ? "w-6 bg-pink-400"
                  : "w-2 bg-white/40 hover:bg-white/80"
              }`}
              aria-label={`切换到第 ${i + 1} 张照片`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
