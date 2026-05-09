"use client";

import { useState } from "react";

interface IPResult {
  ip: string;
  region: string;
  isp: string;
  llc: string;
  asn: string;
  latitude: number;
  longitude: number;
  beginip: string;
  endip: string;
  district?: string;
  time_zone?: string;
}

export default function MyIPApp() {
  const [result, setResult] = useState<IPResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleQuery(enhanced = false) {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = new URLSearchParams({ path: "network/myip" });
      if (enhanced) params.set("source", "commercial");
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
      {/* 按钮 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleQuery(false)}
          disabled={loading}
          className="flex-1 px-3 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-40 transition-colors"
        >
          {loading ? "..." : "查询我的 IP"}
        </button>
        <button
          type="button"
          onClick={() => handleQuery(true)}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-40 transition-colors shrink-0"
          title="更详细的地理信息，响应稍慢"
        >
          精确
        </button>
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
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* IP 大字 */}
          <div className="rounded-xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 dark:from-sky-500/20 dark:to-indigo-500/20 border border-sky-500/20 p-4 text-center">
            <p className="text-2xl font-black text-sky-600 dark:text-sky-400 tabular-nums tracking-wider">{result.ip}</p>
            <p className="text-[10px] text-slate-400 mt-1">你的公网 IP 地址</p>
          </div>

          {/* 详情 */}
          <div className="rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 p-3 space-y-2">
            {[
              { label: "地理位置", value: result.region },
              { label: "行政区", value: result.district },
              { label: "运营商", value: result.llc || result.isp },
              { label: "ASN", value: result.asn },
              { label: "时区", value: result.time_zone },
              { label: "坐标", value: `${result.latitude}, ${result.longitude}` },
              { label: "IP 段", value: `${result.beginip} ~ ${result.endip}` },
            ].filter((item) => item.value).map((item) => (
              <div key={item.label} className="flex justify-between items-center text-xs">
                <span className="text-slate-400 shrink-0">{item.label}</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium text-right tabular-nums ml-2">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 初始提示 */}
      {!result && !loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[10px] text-slate-400 text-center">点击按钮查看你的公网 IP 和地理位置</p>
        </div>
      )}
    </div>
  );
}
