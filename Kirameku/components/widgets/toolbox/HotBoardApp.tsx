"use client";

import { useState } from "react";

const PLATFORMS = [
  { id: "weibo", name: "微博", color: "#e6162d" },
  { id: "zhihu", name: "知乎", color: "#0066ff" },
  { id: "douyin", name: "抖音", color: "#111" },
  { id: "bilibili", name: "B站", color: "#00a1d6" },
  { id: "baidu", name: "百度", color: "#2932e1" },
  { id: "toutiao", name: "头条", color: "#f85959" },
  { id: "tieba", name: "贴吧", color: "#4e6ef2" },
  { id: "douban-movie", name: "豆瓣电影", color: "#00b51d" },
  { id: "hupu", name: "虎扑", color: "#e74c3c" },
  { id: "v2ex", name: "V2EX", color: "#333" },
  { id: "ithome", name: "IT之家", color: "#d32f2f" },
  { id: "36kr", name: "36氪", color: "#0479ff" },
  { id: "juejin", name: "掘金", color: "#1e80ff" },
  { id: "sspai", name: "少数派", color: "#d7191a" },
  { id: "netease-music", name: "网易云", color: "#c20c0c" },
  { id: "qq-music", name: "QQ音乐", color: "#31c27c" },
  { id: "lol", name: "LOL", color: "#c89b3c" },
  { id: "genshin", name: "原神", color: "#e8a946" },
  { id: "honkai", name: "崩坏3", color: "#6c3fa0" },
  { id: "starrail", name: "星铁", color: "#5b7fab" },
];

interface HotItem {
  index: number;
  title: string;
  hot_value: string;
  url: string;
  extra?: Record<string, string>;
  cover?: string;
}

interface HotResult {
  type: string;
  update_time: string;
  list: HotItem[];
}

export default function HotBoardApp() {
  const [platform, setPlatform] = useState("weibo");
  const [result, setResult] = useState<HotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchHot(type: string) {
    setPlatform(type);
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/uapis?path=misc/hotboard&type=${type}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "查询失败");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }

  function formatHot(val: string) {
    const n = Number(val);
    if (isNaN(n)) return val;
    if (n >= 100000000) return (n / 100000000).toFixed(1) + "亿";
    if (n >= 10000) return (n / 10000).toFixed(1) + "万";
    return n.toLocaleString();
  }

  const currentPlatform = PLATFORMS.find((p) => p.id === platform);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 平台选择 */}
      <div className="flex flex-wrap gap-1.5">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => fetchHot(p.id)}
            className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-all ${
              platform === p.id
                ? "text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
            style={platform === p.id ? { backgroundColor: p.color } : undefined}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* 加载 */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <svg className="w-6 h-6 text-sky-400 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* 错误 */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {/* 热榜列表 */}
      {result && !loading && (
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {result.update_time && (
            <p className="text-[10px] text-slate-400 mb-2">
              更新于 {result.update_time}
            </p>
          )}
          {result.list.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <span
                className={`w-5 text-center text-[10px] font-bold shrink-0 ${
                  i < 3
                    ? "text-white rounded-sm"
                    : "text-slate-400"
                }`}
                style={i < 3 ? { backgroundColor: currentPlatform?.color || "#e6162d" } : undefined}
              >
                {item.index || i + 1}
              </span>
              <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1 group-hover:text-sky-500 transition-colors">
                {item.title}
              </span>
              {item.hot_value && (
                <span className="text-[9px] text-slate-400 shrink-0 tabular-nums">
                  {formatHot(item.hot_value)}
                </span>
              )}
            </a>
          ))}
          {result.list.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">暂无数据</p>
          )}
        </div>
      )}

      {/* 初始提示 */}
      {!result && !loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-slate-400">选择平台查看实时热榜</p>
        </div>
      )}
    </div>
  );
}
