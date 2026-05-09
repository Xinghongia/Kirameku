"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import PhotoCard from "./PhotoCard";
import type { Photo } from "@/data/photos";

export interface Album {
  id: number;
  title: string;
  updatedAt: string;
  photoCount: number;
  photos: Photo[];
}

const STACK_ANGLES = [-4, 0, 3];
const FAN_ANGLES = [-12, 0, 12];
const FAN_Y = [-4, -10, -4];

interface AlbumCardProps {
  album: Album;
  isExpanded: boolean;
  onToggle: () => void;
  onPhotoClick: (photos: Photo[], index: number) => void;
}

export default function AlbumCard({ album, isExpanded, onToggle, onPhotoClick }: AlbumCardProps) {
  const covers = album.photos.slice(0, 3).reverse();

  return (
    <div
      className="rounded-3xl overflow-hidden cursor-pointer"
      onClick={onToggle}
    >
      {/* 封面区域 */}
      <div className="relative px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4">
        {/* 堆叠照片 */}
        <motion.div
          className="relative h-36 md:h-48 mx-auto max-w-[200px] md:max-w-[260px]"
          initial="rest"
          animate={isExpanded ? "hover" : "rest"}
          whileHover="hover"
        >
          {covers.map((photo, i) => (
            <motion.div
              key={photo.id}
              className="absolute inset-0"
              style={{ zIndex: i + 1 }}
              variants={{
                rest: {
                  rotate: STACK_ANGLES[i] ?? 0,
                  y: i * 12,
                  scale: 1 - i * 0.04,
                  zIndex: i + 1,
                },
                hover: {
                  rotate: FAN_ANGLES[i] ?? 0,
                  y: FAN_Y[i] ?? 0,
                  scale: i === 1 ? 1 : 0.95,
                },
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                <Image
                  src={photo.url}
                  alt={photo.caption || album.title}
                  fill
                  className="object-cover"
                  sizes="260px"
                />
              </div>
            </motion.div>
          ))}

          {/* 照片数量徽标 */}
          <div className="absolute -bottom-2 right-0 z-20 px-2 py-0.5 md:px-2.5 rounded-full bg-sky-500 text-white text-[10px] md:text-xs font-bold shadow-lg shadow-sky-500/30">
            {album.photoCount} 张
          </div>
        </motion.div>

        {/* 相册信息 */}
        <div className="mt-4 md:mt-6 text-center">
          <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">
            {album.title}
          </h3>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1">
            {album.updatedAt.replace("T", " ").slice(0, 19)}
          </p>
        </div>
      </div>

      {/* 展开的照片网格 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="overflow-hidden"
          >
            <div className="px-4 pb-6 md:px-6">
              <div className="p-4 md:p-6 rounded-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-5">
                  {album.photos.map((photo, photoIndex) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      index={photoIndex}
                      onClick={() => onPhotoClick(album.photos, photoIndex)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
