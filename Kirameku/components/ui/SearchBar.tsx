"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { postsData } from "@/data/posts";
import { chattersData } from "@/data/chatters";

interface SearchItem {
  slug: string;
  type: "post" | "chatter";
  title: string;
  description: string;
  tags: string[];
  date: string;
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const Highlight = ({ text = "", query = "" }) => {
  if (!query.trim() || !text) return <>{text}</>;

  const safeQuery = escapeRegExp(query);
  const regex = new RegExp(`(${safeQuery})`, "gi");
  const parts = String(text).split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-300 dark:bg-yellow-500/80 text-slate-900 dark:text-white px-1 mx-[1px] rounded-[4px] shadow-sm font-bold transition-all"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allItems: SearchItem[] = useMemo(
    () => [
      ...postsData.map((p) => ({
        ...p,
        type: "post" as const,
      })),
      ...chattersData.map((c) => ({
        ...c,
        type: "chatter" as const,
      })),
    ],
    []
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();

    return allItems.filter((item) => {
      const titleMatch = (item.title || "").toLowerCase().includes(query);
      const descMatch = (item.description || "").toLowerCase().includes(query);
      const tagMatch = (item.tags || []).some((tag) =>
        tag.toLowerCase().includes(query)
      );
      return titleMatch || descMatch || tagMatch;
    });
  }, [searchQuery, allItems]);

  return (
    <div
      className="relative w-full max-w-2xl mx-auto mb-10 z-[100]"
      ref={containerRef}
    >
      <form className="relative group" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          className="w-full pl-14 pr-6 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-slate-200 transition-all placeholder-slate-500 dark:placeholder-slate-400 font-medium text-lg relative z-0"
          placeholder="搜寻标题、描述或标签..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          spellCheck="false"
        />

        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none select-none z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors drop-shadow-sm"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </form>

      <AnimatePresence>
        {isOpen && searchQuery.trim() !== "" && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden max-h-[450px] overflow-y-auto z-20"
          >
            {searchResults.length > 0 ? (
              <div className="flex flex-col py-3">
                {searchResults.map((item) => (
                  <Link
                    href={
                      item.type === "post"
                        ? `/posts/${item.slug}`
                        : `/messages/${item.slug}`
                    }
                    key={`${item.type}-${item.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-5 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 transition-colors group border-b border-slate-100/50 dark:border-slate-800/50 last:border-0 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            item.type === "post"
                              ? "bg-indigo-500/10 text-indigo-500"
                              : "bg-purple-500/10 text-purple-500"
                          }`}
                        >
                          {item.type === "post" ? "文章" : "杂谈"}
                        </span>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 transition-colors line-clamp-1">
                          <Highlight text={item.title} query={searchQuery} />
                        </h4>
                      </div>
                      {item.date && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md shrink-0 mt-1">
                          {item.date}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        <Highlight
                          text={item.description}
                          query={searchQuery}
                        />
                      </p>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-0.5 opacity-60"
                            >
                              <line x1="4" y1="9" x2="20" y2="9" />
                              <line x1="4" y1="15" x2="20" y2="15" />
                              <line x1="10" y1="3" x2="8" y2="21" />
                              <line x1="16" y1="3" x2="14" y2="21" />
                            </svg>
                            <Highlight text={tag} query={searchQuery} />
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6 text-slate-400"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  数据海中未发现关于 &quot;
                  <span className="text-indigo-500 font-bold">
                    {searchQuery}
                  </span>
                  &quot; 的踪迹
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
