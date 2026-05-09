"use client";

import { useState } from "react";

interface PhoneResult {
  city: string;
  province: string;
  sp: string;
}

const spColors: Record<string, string> = {
  "移动": "bg-green-500",
  "联通": "bg-red-500",
  "电信": "bg-sky-500",
};

export default function PhoneInfoApp() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<PhoneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleQuery() {
    if (!/^1\d{10}$/.test(phone.trim())) {
      setError("请输入有效的11位手机号码");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/uapis?path=misc/phoneinfo&phone=${phone.trim()}`);
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
    <div className="space-y-4">
      {/* 输入框 */}
      <div className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          onKeyDown={(e) => e.key === "Enter" && handleQuery()}
          placeholder="输入11位手机号码"
          className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none border border-transparent focus:border-sky-500 transition-colors tabular-nums"
        />
        <button
          type="button"
          onClick={handleQuery}
          disabled={loading || phone.length !== 11}
          className="px-3 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-40 transition-colors shrink-0"
        >
          {loading ? "..." : "查询"}
        </button>
      </div>

      {/* 错误 */}
      {error && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {/* 结果 */}
      {result && (
        <div className="rounded-2xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 dark:from-sky-500/20 dark:to-indigo-500/20 border border-sky-500/20 p-4">
          {/* 号码展示 */}
          <div className="text-center mb-4">
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-wider">
              {phone}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-center">
              <span className="text-slate-400 block text-[10px] mb-0.5">省份</span>
              <span className="text-slate-700 dark:text-slate-200 font-bold text-sm">{result.province}</span>
            </div>
            <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-center">
              <span className="text-slate-400 block text-[10px] mb-0.5">城市</span>
              <span className="text-slate-700 dark:text-slate-200 font-bold text-sm">{result.city}</span>
            </div>
            <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-center">
              <span className="text-slate-400 block text-[10px] mb-0.5">运营商</span>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                <span className={`w-2 h-2 rounded-full ${spColors[result.sp] || "bg-slate-400"}`} />
                {result.sp}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 提示 */}
      {!result && !error && !loading && (
        <p className="text-[10px] text-slate-400 text-center">
          输入中国大陆手机号码，查询归属地和运营商
        </p>
      )}
    </div>
  );
}
