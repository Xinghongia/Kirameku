"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, ExternalLink } from "lucide-react";
import { getBookmarks } from "@/app/api";
import type { BookmarkCategory, BookmarkSite } from "@/app/api";

/** 如果有自定义 icon 就用，否则自动获取网站 favicon */
function getIcon(site: BookmarkSite): string {
  if (site.icon) return site.icon;
  try {
    const origin = new URL(site.url).origin;
    return `${origin}/favicon.ico`;
  } catch {
    return "";
  }
}

export default function BookmarkPage() {
  const [data, setData] = useState<BookmarkCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookmarks()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 md:mb-12"
      >
        <div className="flex items-center gap-3">
          <Bookmark className="w-7 h-7 md:w-8 md:h-8 text-sky-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            收藏夹
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-2 ml-10 md:ml-11 text-sm md:text-base">
          收集常用的好用站点和工具
        </p>
      </motion.div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          {data.length === 0 ? "暂无收藏" : "没有找到匹配的站点"}
        </div>
      ) : (
        <div className="space-y-10 md:space-y-14">
          {data.map((category, catIndex) => (
            <motion.section
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: catIndex * 0.1 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-2.5 mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">
                  {category.name}
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
                  {category.sites.length}
                </span>
              </div>
              {category.description && (
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-4 -mt-2">
                  {category.description}
                </p>
              )}

              {/* Site Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
                {category.sites.map((site, siteIndex) => (
                  <motion.a
                    key={site.id}
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: catIndex * 0.1 + siteIndex * 0.03
                    }}
                    className="group relative flex items-center gap-2.5 p-2.5 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-transparent hover:border-sky-200 dark:hover:border-sky-800 transition-all duration-300 cursor-pointer"
                  >
                    {/* Icon */}
                    <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-slate-100/60 dark:bg-slate-700/40 flex items-center justify-center group-hover:animate-[icon-jelly_2s_ease-in-out]">
                      {getIcon(site) ? (
                        <img
                          src={getIcon(site)}
                          alt={site.name}
                          className="w-full h-full object-cover"
                          onError={e => {
                            const t = e.target as HTMLImageElement;
                            t.style.display = "none";
                            const span = t.nextElementSibling as HTMLElement;
                            if (span) span.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <span
                        className="text-sm font-bold text-sky-500 items-center justify-center"
                        style={{ display: getIcon(site) ? "none" : "flex" }}
                      >
                        {site.name[0]}
                      </span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {site.name}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                        {site.description}
                      </p>
                    </div>
                    {/* Hover: top-right tags + link */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {site.platforms.slice(0, 2).map(p => (
                        <span
                          key={p}
                          className="text-[8px] font-medium tracking-wider uppercase text-sky-500/70"
                        >
                          {p}
                        </span>
                      ))}
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
