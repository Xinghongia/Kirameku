"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, Heart, Clock, Pin } from "lucide-react";

export interface PostOut {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover: string;
  category: string;
  tags: string[];
  status: string;
  is_pinned: boolean;
  views: number;
  likes: number;
  word_count: number;
  reading_time: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PostCardProps {
  post: PostOut;
  index: number;
}

export default function PostCard({ post, index }: PostCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    setTilt({ rotateX, rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
    >
      <Link href={`/posts/${post.slug}`}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="group relative rounded-3xl overflow-hidden cursor-pointer"
          style={{
            perspective: "1000px",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="relative transition-transform duration-200 ease-out"
            style={{
              transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* 封面图 */}
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src={post.cover || "/images/default-cover.jpg"}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {/* 渐变遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* 置顶标记 */}
              {post.is_pinned && (
                <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-amber-500/90 backdrop-blur-sm text-white text-[10px] md:text-xs font-medium">
                  <Pin className="w-3 h-3" />
                  置顶
                </div>
              )}

              {/* 分类标签 */}
              {post.category && (
                <div className="absolute top-2 right-2 md:top-4 md:right-4 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-sky-500/80 backdrop-blur-sm text-white text-[10px] md:text-xs font-medium">
                  {post.category}
                </div>
              )}

              {/* 底部信息 */}
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5">
                <h3 className="text-base md:text-lg font-bold text-white mb-1 md:mb-2 line-clamp-2 leading-snug">
                  {post.title}
                </h3>
                <p className="text-white/70 text-xs md:text-sm line-clamp-2 mb-2 md:mb-3">
                  {post.description}
                </p>
                <div className="flex items-center justify-between text-white/60 text-xs">
                  <div className="flex items-center gap-3">
                    {dateStr && <span>{dateStr}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.reading_time} 分钟
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likes}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 标签栏
            {post.tags.length > 0 && (
              <div className="px-5 py-3 bg-white/5 dark:bg-white/[0.03] backdrop-blur-xl border-t border-white/10">
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )} */}

            {/* 3D 光泽效果 */}
            <div
              className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-200"
              style={{
                background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
              }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
