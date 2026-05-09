"use client";

import { useState } from "react";

interface Track {
  time: string;
  context: string;
}

interface TrackingResult {
  tracking_number: string;
  carrier_name: string;
  status: string;
  status_code: string;
  is_completed: boolean;
  completed_at: string;
  track_count: number;
  tracks: Track[];
}

const statusColors: Record<string, string> = {
  pending: "bg-slate-400",
  picked_up: "bg-blue-500",
  in_transit: "bg-amber-500",
  out_for_delivery: "bg-orange-500",
  delivered: "bg-green-500",
  exception: "bg-red-500",
  unknown: "bg-slate-400",
};

export default function TrackingApp() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleQuery() {
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = new URLSearchParams({ path: "misc/tracking/query", tracking_number: trackingNumber.trim() });
      if (phone.trim()) params.set("phone", phone.trim());
      const res = await fetch(`/api/uapis?${params.toString()}`);
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

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 输入 */}
      <div className="space-y-2">
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && handleQuery()}
          placeholder="输入快递单号"
          className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none border border-transparent focus:border-sky-500 transition-colors"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            placeholder="手机尾号（可选）"
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none border border-transparent focus:border-sky-500 transition-colors tabular-nums"
          />
          <button
            type="button"
            onClick={handleQuery}
            disabled={loading || !trackingNumber.trim()}
            className="px-3 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-40 transition-colors shrink-0"
          >
            {loading ? "..." : "查询"}
          </button>
        </div>
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
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {/* 结果 */}
      {result && !loading && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* 快递信息头 */}
          <div className="rounded-xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 dark:from-sky-500/20 dark:to-indigo-500/20 border border-sky-500/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{result.carrier_name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium ${statusColors[result.status_code] || "bg-slate-400"}`}>
                {result.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">{result.tracking_number}</p>
            {result.completed_at && (
              <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">
                签收时间: {result.completed_at}
              </p>
            )}
          </div>

          {/* 物流轨迹 */}
          <div className="space-y-0">
            {result.tracks.map((track, i) => (
              <div key={i} className="flex gap-3">
                {/* 时间线 */}
                <div className="flex flex-col items-center shrink-0 w-5">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${i === 0 ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                  {i < result.tracks.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 min-h-[20px]" />
                  )}
                </div>
                {/* 内容 */}
                <div className="pb-3 min-w-0">
                  <p className={`text-xs leading-relaxed ${i === 0 ? "text-slate-800 dark:text-slate-200 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                    {track.context}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">{track.time}</p>
                </div>
              </div>
            ))}
            {result.tracks.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">暂无物流轨迹</p>
            )}
          </div>
        </div>
      )}

      {/* 初始提示 */}
      {!result && !loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[10px] text-slate-400 text-center">
            支持中通、圆通、韵达、申通、极兔、顺丰、京东、EMS、德邦等
          </p>
        </div>
      )}
    </div>
  );
}
