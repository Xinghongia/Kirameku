"use client";

import { useState, useEffect, useCallback } from "react";

const API = "https://v2.xxapi.cn/api/horoscope";

const SIGNS = [
  { id: "aries", label: "白羊", symbol: "♈", date: "3.21-4.19" },
  { id: "taurus", label: "金牛", symbol: "♉", date: "4.20-5.20" },
  { id: "gemini", label: "双子", symbol: "♊", date: "5.21-6.21" },
  { id: "cancer", label: "巨蟹", symbol: "♋", date: "6.22-7.22" },
  { id: "leo", label: "狮子", symbol: "♌", date: "7.23-8.22" },
  { id: "virgo", label: "处女", symbol: "♍", date: "8.23-9.22" },
  { id: "libra", label: "天秤", symbol: "♎", date: "9.23-10.23" },
  { id: "scorpio", label: "天蝎", symbol: "♏", date: "10.24-11.22" },
  { id: "sagittarius", label: "射手", symbol: "♐", date: "11.23-12.21" },
  { id: "capricorn", label: "摩羯", symbol: "♑", date: "12.22-1.19" },
  { id: "aquarius", label: "水瓶", symbol: "♒", date: "1.20-2.18" },
  { id: "pisces", label: "双鱼", symbol: "♓", date: "2.19-3.20" },
] as const;

type TimeType = "today" | "week" | "month" | "year";

const TIME_TABS: { id: TimeType; label: string }[] = [
  { id: "today", label: "今日" },
  { id: "week", label: "本周" },
  { id: "month", label: "本月" },
  { id: "year", label: "本年" },
];

const DIM_LABELS: Record<string, string> = {
  all: "综合",
  love: "爱情",
  work: "事业",
  money: "财运",
  health: "健康",
};

const DIM_COLORS: Record<string, string> = {
  all: "text-indigo-500",
  love: "text-pink-500",
  work: "text-sky-500",
  money: "text-amber-500",
  health: "text-green-500",
};

const DIM_BG: Record<string, string> = {
  all: "bg-indigo-500",
  love: "bg-pink-500",
  work: "bg-sky-500",
  money: "bg-amber-500",
  health: "bg-green-500",
};

interface FortuneData {
  fortune: Record<string, number>;
  fortunetext: Record<string, string>;
  index: Record<string, string>;
  title: string;
  shortcomment: string;
  time: string;
  type: string;
  luckycolor: string;
  luckyconstellation: string;
  luckynumber: string;
  todo: { ji: string; yi: string };
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="w-3 h-3" viewBox="0 0 20 20" fill={i <= count ? "#fbbf24" : "currentColor"}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function HoroscopeApp() {
  const [sign, setSign] = useState<string>("aries");
  const [time, setTime] = useState<TimeType>("today");
  const [data, setData] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`${API}?type=${sign}&time=${time}`);
      const json = await res.json();
      if (json.code === 200 && json.data) {
        setData(json.data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [sign, time]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentSign = SIGNS.find((s) => s.id === sign);

  return (
    <div className="flex flex-col gap-2">
      {/* 星座选择 — 横向滚动 */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {SIGNS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSign(s.id)}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
              sign === s.id
                ? "bg-indigo-50 dark:bg-indigo-900/20"
                : "hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className={`text-lg ${sign === s.id ? "text-indigo-500" : "text-slate-400"}`}>{s.symbol}</span>
            <span className={`text-[9px] font-bold ${sign === s.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* 时间切换 */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
        {TIME_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTime(t.id)}
            className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-colors ${
              time === t.id
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="text-sm text-slate-400 animate-pulse">加载中...</div>
        </div>
      ) : data ? (
        <>
          {/* 标题 */}
          <div className="text-center">
            <div className="text-lg font-black text-slate-800 dark:text-white">{data.title}</div>
            <div className="text-[11px] text-indigo-500 font-medium">{data.shortcomment}</div>
          </div>

          {/* 运势条 */}
          <div className="space-y-1.5">
            {["all", "love", "work", "money", "health"].map((dim) => {
              const stars = data.fortune?.[dim] ?? 0;
              const pct = data.index?.[dim] ?? "0%";
              const isOpen = detail === dim;
              return (
                <div key={dim}>
                  <button
                    type="button"
                    onClick={() => setDetail(isOpen ? null : dim)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className={`text-[10px] font-bold w-7 ${DIM_COLORS[dim]}`}>{DIM_LABELS[dim]}</span>
                    <StarRating count={stars} />
                    <span className="text-[10px] text-slate-400 ml-auto">{pct}</span>
                  </button>
                  {isOpen && data.fortunetext?.[dim] && (
                    <div className="px-2 py-2 ml-7 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {data.fortunetext[dim]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 幸运信息 */}
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-400">幸运色</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{data.luckycolor || "—"}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-400">幸运数</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{data.luckynumber || "—"}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 text-center">
              <div className="text-[9px] text-slate-400">速配星座</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{data.luckyconstellation || "—"}</div>
            </div>
          </div>

          {/* 宜忌 */}
          {data.todo && (
            <div className="flex gap-2">
              <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                <div className="text-[9px] font-bold text-green-500 mb-0.5">宜</div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300">{data.todo.yi}</div>
              </div>
              <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                <div className="text-[9px] font-bold text-red-500 mb-0.5">忌</div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300">{data.todo.ji}</div>
              </div>
            </div>
          )}

          <div className="text-[9px] text-slate-300 dark:text-slate-600 text-right">{data.time}</div>
        </>
      ) : (
        <div className="text-center text-sm text-slate-400 py-8">暂无数据</div>
      )}
    </div>
  );
}
