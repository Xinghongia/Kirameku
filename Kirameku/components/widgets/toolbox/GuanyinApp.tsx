"use client";

import { useState, useCallback } from "react";

const API = "https://v2.xxapi.cn/api/guanyinrandom";

interface GuanyinData {
  explanation: string;
  fortune: string;
  image: string;
  meaning: string;
  name: string;
  palace: string;
  poem_version_1: string;
  poem_version_2: string;
}

const FORTUNE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "上上签": { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
  "上签": { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
  "中签": { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  "下签": { bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-700" },
  "下下签": { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500 dark:text-slate-500", border: "border-slate-300 dark:border-slate-600" },
};

export default function GuanyinApp() {
  const [data, setData] = useState<GuanyinData | null>(null);
  const [loading, setLoading] = useState(false);

  const draw = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const json = await res.json();
      if (json.code === 200 && json.data) {
        setData(json.data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const colors = data?.fortune ? (FORTUNE_COLORS[data.fortune] || FORTUNE_COLORS["中签"]) : null;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={draw}
        className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 active:scale-95 transition-all"
      >
        {loading ? "求签中..." : "求一支签"}
      </button>

      {data && colors && (
        <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4 space-y-3`}>
          {/* 签图 */}
          {data.image && (
            <div className="flex justify-center">
              <img src={data.image} alt={data.name} className="h-28 object-contain" loading="lazy" />
            </div>
          )}

          {/* 签名 & 宫位 */}
          <div className="text-center space-y-1">
            <div className={`text-base font-black ${colors.text}`}>{data.name}</div>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${colors.text} ${colors.bg} border ${colors.border}`}>{data.fortune}</span>
              <span className="text-[10px] text-slate-400">{data.palace}</span>
            </div>
          </div>

          {/* 诗句 */}
          {data.poem_version_1 && (
            <div className="text-center">
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-loose whitespace-pre-line">{data.poem_version_1}</div>
            </div>
          )}

          {/* 卦象 */}
          {data.meaning && (
            <div>
              <div className="text-[9px] font-bold text-slate-400 mb-0.5">卦象</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{data.meaning}</div>
            </div>
          )}

          {/* 解曰 */}
          {data.explanation && (
            <div>
              <div className="text-[9px] font-bold text-slate-400 mb-0.5">解曰</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{data.explanation}</div>
            </div>
          )}

          {/* 仙机 (第二版本诗句) */}
          {data.poem_version_2 && (
            <div>
              <div className="text-[9px] font-bold text-slate-400 mb-0.5">仙机</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-loose whitespace-pre-line">{data.poem_version_2}</div>
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <svg className="w-12 h-12 mb-2 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeWidth="1.5" />
            <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-xs">点击按钮求一支观音灵签</span>
        </div>
      )}
    </div>
  );
}
