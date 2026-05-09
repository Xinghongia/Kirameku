"use client";

import { useState } from "react";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  source: string;
  position: number;
  score: number;
  publish_time?: string;
}

interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResult[];
  process_time_ms: number;
}

type SortType = "relevance" | "date";
type TimeRange = "" | "day" | "week" | "month" | "year";

const timeRangeLabels: Record<TimeRange, string> = {
  "": "不限",
  day: "一天内",
  week: "一周内",
  month: "一月内",
  year: "一年内",
};

export default function SearchApp() {
  const [query, setQuery] = useState("");
  const [site, setSite] = useState("");
  const [filetype, setFiletype] = useState("");
  const [sort, setSort] = useState<SortType>("relevance");
  const [timeRange, setTimeRange] = useState<TimeRange>("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const body: Record<string, unknown> = { query: q, sort };
      if (site.trim()) body.site = site.trim();
      if (filetype.trim()) body.filetype = filetype.trim();
      if (timeRange) body.time_range = timeRange;

      const res = await fetch("/api/uapis?path=search/aggregate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "搜索失败");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }

  function fmtTime(iso?: string) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
      return "";
    }
  }

  function getFavicon(domain: string) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 搜索框 */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="搜索任何内容..."
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none border border-transparent focus:border-sky-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowFilter(!showFilter)}
            className={`px-2.5 py-2 rounded-xl text-sm transition-colors shrink-0 ${
              showFilter ? "bg-sky-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-3 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-40 transition-colors shrink-0"
          >
            {loading ? "..." : "搜索"}
          </button>
        </div>

        {/* 筛选面板 */}
        {showFilter && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/5 p-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="限定网站，如 github.com"
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none border border-slate-200 dark:border-slate-700 focus:border-sky-500 transition-colors"
              />
              <input
                type="text"
                value={filetype}
                onChange={(e) => setFiletype(e.target.value)}
                placeholder="文件类型，如 pdf"
                className="w-28 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none border border-slate-200 dark:border-slate-700 focus:border-sky-500 transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 self-center mr-1">排序</span>
              {(["relevance", "date"] as SortType[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    sort === s ? "bg-sky-500 text-white" : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {s === "relevance" ? "相关性" : "时间"}
                </button>
              ))}
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
              <span className="text-[10px] text-slate-400 self-center mr-1">时间</span>
              {(["", "day", "week", "month", "year"] as TimeRange[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeRange(t)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    timeRange === t ? "bg-sky-500 text-white" : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {timeRangeLabels[t]}
                </button>
              ))}
            </div>
          </div>
        )}
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
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</div>
      )}

      {/* 结果 */}
      {result && !loading && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400">找到 {result.total_results} 条结果</span>
            <span className="text-[10px] text-slate-400 tabular-nums">{result.process_time_ms}ms</span>
          </div>
          {result.results.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 p-3 hover:border-sky-500/30 dark:hover:border-sky-500/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={getFavicon(item.domain)}
                  alt=""
                  className="w-4 h-4 rounded-sm"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="text-[9px] text-green-600 dark:text-green-400 truncate">{item.domain}</span>
                {item.publish_time && (
                  <span className="text-[9px] text-slate-400 tabular-nums ml-auto shrink-0">{fmtTime(item.publish_time)}</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-sky-700 dark:text-sky-400 line-clamp-1 mb-0.5">{item.title}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.snippet}</p>
            </a>
          ))}
          {result.results.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">没有找到相关结果</p>
          )}
        </div>
      )}

      {/* 初始提示 */}
      {!result && !loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[10px] text-slate-400 text-center">支持中文搜索，可限定网站、文件类型、时间范围</p>
        </div>
      )}
    </div>
  );
}
