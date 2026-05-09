"use client";

import { useState, useEffect } from "react";

interface HistoryEvent {
  year: number;
  title: string;
  description: string;
  category: string;
  importance: number;
  relevance_score: number;
  url: string;
}

interface HistoryResult {
  message: string;
  date: string;
  events: HistoryEvent[];
}

const catColors: Record<string, string> = {
  "公司创立": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "产品发布": "bg-green-500/10 text-green-600 dark:text-green-400",
  "技术突破": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "人物": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "标准制定": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "开源": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "安全事件": "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function ProgrammerHistoryApp() {
  const [data, setData] = useState<HistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/uapis?path=history/programmer/today")
      .then((res) => res.json().then((d) => ({ ok: res.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) setError(data.message || "获取失败");
        else setData(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "网络错误"))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {dateStr}
        </span>
        <span className="text-[10px] text-slate-400">程序员历史上的今天</span>
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

      {/* 事件列表 */}
      {data && !loading && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {data.events.map((event, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 p-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {event.year}
                </span>
                {event.category && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${catColors[event.category] || "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                    {event.category}
                  </span>
                )}
                {/* 重要性小点 */}
                <div className="flex gap-0.5 ml-auto" title={`重要性: ${event.importance}/10`}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <div
                      key={j}
                      className={`w-1.5 h-1.5 rounded-full ${
                        j < Math.round(event.importance / 2)
                          ? "bg-amber-400"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {event.url ? (
                  <a href={event.url} target="_blank" rel="noopener noreferrer" className="hover:text-sky-500 transition-colors">
                    {event.title}
                  </a>
                ) : event.title}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {event.description}
              </p>
            </div>
          ))}
          {data.events.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">今天没有相关历史事件</p>
          )}
        </div>
      )}
    </div>
  );
}
