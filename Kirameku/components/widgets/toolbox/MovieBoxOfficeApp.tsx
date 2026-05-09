"use client";

import { useState, useEffect } from "react";

interface Movie {
  rank: number;
  movie_id: number;
  movie_name: string;
  release_info: string;
  release_status: string;
  release_days?: number;
  box_office: string;
  box_office_rate: string;
  split_box_office: string;
  split_box_office_rate: string;
  show_count: number;
  show_count_rate: string;
  avg_show_view: string;
  avg_seat_view: string;
  sum_box_office: string;
  sum_split_box_office: string;
  detail_url: string;
}

interface MarketData {
  box_office: string;
  split_box_office: string;
  show_count: string;
  view_count: string;
}

interface BoxOfficeResult {
  update_time: string;
  market: MarketData;
  list: Movie[];
  total_items: number;
}

const rankColors = ["bg-amber-500", "bg-slate-400", "bg-amber-700"];

export default function MovieBoxOfficeApp() {
  const [data, setData] = useState<BoxOfficeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/uapis?path=misc/movie-box-office")
      .then((res) => res.json().then((d) => ({ ok: res.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) setError(data.message || "获取失败");
        else setData(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "网络错误"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full gap-3">
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

      {/* 内容 */}
      {data && !loading && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* 大盘汇总 */}
          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-500/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">今日大盘</span>
              <span className="text-[9px] text-slate-400 tabular-nums">{data.update_time}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-base font-black text-amber-600 dark:text-amber-400">{data.market.box_office}</p>
                <p className="text-[9px] text-slate-500">总票房</p>
              </div>
              <div className="text-center">
                <p className="text-base font-black text-orange-600 dark:text-orange-400">{data.market.view_count}</p>
                <p className="text-[9px] text-slate-500">总人次</p>
              </div>
            </div>
          </div>

          {/* 影片列表 */}
          <div className="space-y-2">
            {data.list.slice(0, 15).map((movie) => (
              <a
                key={movie.movie_id}
                href={movie.detail_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {/* 排名 */}
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                      rankColors[movie.rank - 1] || "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    {movie.rank}
                  </span>
                  {/* 片名 + 上映信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{movie.movie_name}</span>
                      {movie.release_info && (
                        <span className="text-[9px] text-slate-400 shrink-0">{movie.release_info}</span>
                      )}
                    </div>
                  </div>
                  {/* 票房 */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{movie.box_office}</p>
                    <p className="text-[9px] text-slate-400">{movie.box_office_rate}</p>
                  </div>
                </div>
                {/* 详情行 */}
                <div className="flex items-center gap-3 mt-1.5 pl-7">
                  <span className="text-[9px] text-slate-400">排片 {movie.show_count_rate}</span>
                  <span className="text-[9px] text-slate-400">场均 {movie.avg_show_view}人</span>
                  <span className="text-[9px] text-slate-400">累计 {movie.sum_box_office}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
