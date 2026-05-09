"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "lucide-react";
import AlbumCard from "@/components/photos/AlbumCard";
import type { Album } from "@/components/photos/AlbumCard";
import Lightbox from "@/components/photos/Lightbox";
import type { Photo } from "@/data/photos";
import { getAlbums, getAlbumPhotos } from "@/app/api";

export default function PhotoWallPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotos, setCurrentPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const expandedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expandedId === null) return;
    const handler = (e: MouseEvent) => {
      if (lightboxOpen) return;
      if (expandedRef.current && !expandedRef.current.contains(e.target as Node)) {
        setExpandedId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expandedId, lightboxOpen]);

  useEffect(() => {
    async function fetchData() {
      try {
        const albumList = await getAlbums();
        albumList.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        const results = await Promise.all(
          albumList.map(async (album) => {
            const photos = await getAlbumPhotos(album.id);
            return {
              id: album.id,
              title: album.title,
              updatedAt: album.updated_at,
              photoCount: album.photo_count,
              photos: photos.reverse().map((p) => ({
                id: String(p.id),
                url: p.url,
                caption: p.caption,
                orientation: (p.orientation as Photo["orientation"]) || "landscape",
              })),
            };
          })
        );

        setAlbums(results);
      } catch {
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const openLightbox = (photos: Photo[], index: number) => {
    setCurrentPhotos(photos);
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
      {/* 页头 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 md:mb-12"
      >
        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
          <Camera className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">照片墙</h1>
        </div>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 ml-7 md:ml-10">用照片记录生活的每一个瞬间</p>
      </motion.div>

      {/* 加载状态 */}
      {loading ? (
        <div className="flex items-center justify-center py-20 md:py-32">
          <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 md:py-32 text-slate-400">
          <Camera className="w-8 h-8 md:w-12 md:h-12 mb-3 md:mb-4 opacity-40" />
          <p className="text-sm md:text-base">暂无照片</p>
        </div>
      ) : (
        /* 相册网格 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 select-none">
          {albums.map((album, albumIndex) => {
            const isExpanded = expandedId === album.id;
            const isHidden = expandedId !== null && !isExpanded;

            return (
              <AnimatePresence key={album.id}>
                {!isHidden && (
                  <motion.div
                    layout
                    initial={expandedId === null ? { opacity: 0, y: 30 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: expandedId === null ? albumIndex * 0.1 : 0 }}
                    className={isExpanded ? "sm:col-span-2 lg:col-span-3" : ""}
                  >
                    <div ref={isExpanded ? expandedRef : undefined}>
                      <AlbumCard
                        album={album}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedId((prev) => (prev === album.id ? null : album.id))}
                        onPhotoClick={openLightbox}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      )}

      {/* 灯箱 */}
      <Lightbox
        photos={currentPhotos}
        index={currentIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setCurrentIndex((i) => (i - 1 + currentPhotos.length) % currentPhotos.length)}
        onNext={() => setCurrentIndex((i) => (i + 1) % currentPhotos.length)}
      />
    </div>
  );
}
