"use client";

import { useState, useEffect } from "react";

const API = "https://v2.xxapi.cn/api/bilibilihot";

export default function BilibiliHotApp() {
  const [list, setList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((json) => {
        if (json.code === 200 && Array.isArray(json.data)) {
          setList(json.data);
        } else {
          setError(json.msg || "获取失败");
        }
      })
      .catch(() => setError("网络请求失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-slate-400 animate-pulse">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {list.map((item, i) => (
        <a
          key={i}
          href={`https://search.bilibili.com/all?keyword=${encodeURIComponent(item)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
        >
          <span
            className={`shrink-0 w-5 h-5 rounded text-[10px] font-black flex items-center justify-center ${
              i < 3
                ? "bg-red-500 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
            }`}
          >
            {i + 1}
          </span>
          <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-sky-500 transition-colors truncate">
            {item}
          </span>
        </a>
      ))}
    </div>
  );
}
