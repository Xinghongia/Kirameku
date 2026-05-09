"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Loader2 } from "lucide-react";
import PostCard, { type PostOut } from "@/components/posts/PostCard";
import { getCategories, getPosts, type CategoryItem } from "@/app/api";

export default function PostsPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 12;

  // 获取分类
  useEffect(() => {
    getCategories()
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.sort - b.sort);
        setCategories(sorted);
      })
      .catch(() => {});
  }, []);

  // 获取文章
  useEffect(() => {
    queueMicrotask(() => setLoading(true));
    getPosts({
      status: "published",
      page: 1,
      size: pageSize,
      ...(activeCategory ? { category: activeCategory } : {}),
    })
      .then((data) => {
        setPosts(data);
        setHasMore(data.length === pageSize);
      })
      .catch(() => { setPosts([]); })
      .finally(() => { setLoading(false); });
  }, [activeCategory, pageSize]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    setLoading(true);
    getPosts({
      status: "published",
      page: next,
      size: pageSize,
      ...(activeCategory ? { category: activeCategory } : {}),
    })
      .then((data) => {
        setPosts((prev) => [...prev, ...data]);
        setHasMore(data.length === pageSize);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
      {/* 页头 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 md:mb-10"
      >
        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
          <BookOpen className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
            文章
          </h1>
        </div>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 ml-7 md:ml-10">
          记录技术探索、学术研究与生活感悟
        </p>
      </motion.div>

      {/* 分类筛选 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-5 md:mb-8 flex flex-wrap gap-1.5 md:gap-2"
      >
        <FilterTab
          label="全部"
          count={null}
          active={activeCategory === null}
          onClick={() => setActiveCategory(null)}
        />
        {categories.map((cat) => (
          <FilterTab
            key={cat.id}
            label={cat.name}
            count={cat.post_count}
            active={activeCategory === cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
          />
        ))}
      </motion.div>

      {/* 文章网格 */}
      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <BookOpen className="w-12 h-12 mb-4 opacity-40" />
          <p>暂无文章</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory ?? "all"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
          >
            {posts.map((post, i) => (
              <div key={post.id}>
                <PostCard post={post} index={i} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* 加载更多 */}
      {hasMore && posts.length > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mt-10"
        >
          <button
            type="button"
            onClick={handleLoadMore}
            className="px-5 py-2 md:px-8 md:py-3 rounded-2xl bg-white/10 dark:bg-white/[0.05] backdrop-blur-xl border border-white/20 text-sm md:text-base text-slate-700 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-white/[0.1] transition-all duration-300 hover:-translate-y-0.5"
          >
            加载更多
          </button>
        </motion.div>
      )}

      {/* 加载中指示器（加载更多时） */}
      {loading && posts.length > 0 && (
        <div className="flex justify-center mt-10">
          <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
        </div>
      )}
    </div>
  );
}

/* ---------- 分类标签组件 ---------- */

function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-3 py-1.5 md:px-5 md:py-2 rounded-2xl text-xs md:text-sm font-medium transition-all duration-300 ${
        active
          ? "text-white shadow-lg shadow-sky-500/20"
          : "text-slate-600 dark:text-slate-400 bg-white/10 dark:bg-white/[0.05] backdrop-blur-xl border border-white/20 hover:bg-white/20 dark:hover:bg-white/[0.1]"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeCategoryBg"
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">
        {label}
        {count !== null && count > 0 && (
          <span
            className={`ml-1.5 text-xs ${
              active ? "text-white/70" : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {count}
          </span>
        )}
      </span>
    </button>
  );
}
