"use client";

import { useState } from "react";

const POPULAR_CITIES = [
  { label: "上海", value: "Asia/Shanghai" },
  { label: "东京", value: "Asia/Tokyo" },
  { label: "首尔", value: "Asia/Seoul" },
  { label: "新加坡", value: "Asia/Singapore" },
  { label: "迪拜", value: "Asia/Dubai" },
  { label: "伦敦", value: "Europe/London" },
  { label: "巴黎", value: "Europe/Paris" },
  { label: "柏林", value: "Europe/Berlin" },
  { label: "莫斯科", value: "Europe/Moscow" },
  { label: "纽约", value: "America/New_York" },
  { label: "芝加哥", value: "America/Chicago" },
  { label: "洛杉矶", value: "America/Los_Angeles" },
  { label: "温哥华", value: "America/Vancouver" },
  { label: "悉尼", value: "Australia/Sydney" },
  { label: "奥克兰", value: "Pacific/Auckland" },
];

interface TimeResult {
  datetime: string;
  offset_string: string;
  timezone: string;
  weekday: string;
  timestamp_unix: number;
}

export default function WorldTimeApp() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TimeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchTime(tz: string) {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/uapis?path=misc/worldtime&city=${encodeURIComponent(tz)}`);
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

  function handleSearch() {
    if (!query.trim()) return;
    fetchTime(query.trim());
  }

  function parseDatetime(dt: string) {
    try {
      const d = new Date(dt);
      return {
        date: d.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }),
        time: d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
    } catch {
      return { date: dt.slice(0, 10), time: dt.slice(11, 19) };
    }
  }

  const weekdayMap: Record<string, string> = {
    Monday: "周一", Tuesday: "周二", Wednesday: "周三",
    Thursday: "周四", Friday: "周五", Saturday: "周六", Sunday: "周日",
  };

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="输入城市或时区，如 Asia/Tokyo"
          className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none border border-transparent focus:border-sky-500 transition-colors"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-3 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-40 transition-colors shrink-0"
        >
          {loading ? "..." : "查询"}
        </button>
      </div>

      {/* 常用城市 */}
      <div>
        <p className="text-[10px] text-slate-400 mb-2">常用城市</p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_CITIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => { setQuery(c.value); fetchTime(c.value); }}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 错误 */}
      {error && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {/* 结果 */}
      {result && (() => {
        const { date, time } = parseDatetime(result.datetime);
        return (
          <div className="rounded-2xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 dark:from-sky-500/20 dark:to-indigo-500/20 border border-sky-500/20 p-4">
            <div className="text-center mb-3">
              <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {time}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {date}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 px-3 py-2">
                <span className="text-slate-400 block text-[10px]">时区</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{result.timezone}</span>
              </div>
              <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 px-3 py-2">
                <span className="text-slate-400 block text-[10px]">UTC偏移</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{result.offset_string}</span>
              </div>
              <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 px-3 py-2">
                <span className="text-slate-400 block text-[10px]">星期</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{weekdayMap[result.weekday] || result.weekday}</span>
              </div>
              <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 px-3 py-2">
                <span className="text-slate-400 block text-[10px]">Unix时间戳</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium tabular-nums">{result.timestamp_unix}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 使用提示 */}
      {!result && !error && !loading && (
        <p className="text-[10px] text-slate-400 text-center">
          支持城市名或标准时区格式，如 Asia/Shanghai、America/New_York
        </p>
      )}
    </div>
  );
}
