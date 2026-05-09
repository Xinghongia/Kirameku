"use client";

import { useState } from "react";

interface BmiResult {
  bmi: number;
  msg: string;
}

function getBmiLevel(bmi: number): { label: string; color: string; bg: string } {
  if (bmi < 18.5) return { label: "偏瘦", color: "text-blue-500", bg: "bg-blue-500" };
  if (bmi < 24) return { label: "正常", color: "text-green-500", bg: "bg-green-500" };
  if (bmi < 28) return { label: "偏胖", color: "text-amber-500", bg: "bg-amber-500" };
  return { label: "肥胖", color: "text-red-500", bg: "bg-red-500" };
}

function getBmiPercent(bmi: number): number {
  // 映射 BMI 15~40 到 0~100%
  return Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100));
}

export default function BmiApp() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<BmiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCalc = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) {
      setError("请输入有效的身高和体重");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`https://v2.xxapi.cn/api/bmi?height=${h}&weight=${w}`);
      const json = await res.json();
      if (json.code === 200 && json.data) {
        setResult(json.data);
      } else {
        setError(json.msg || "计算失败");
      }
    } catch {
      setError("网络请求失败");
    } finally {
      setLoading(false);
    }
  };

  const level = result ? getBmiLevel(result.bmi) : null;
  const percent = result ? getBmiPercent(result.bmi) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* 输入区 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-slate-400 mb-1 block">身高 (cm)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 mb-1 block">体重 (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="70"
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleCalc}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50"
      >
        {loading ? "计算中..." : "开始计算"}
      </button>

      {error && (
        <div className="text-xs text-red-500 text-center">{error}</div>
      )}

      {/* 结果 */}
      {result && level && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
          {/* BMI 数值 */}
          <div className="text-center">
            <div className={`text-4xl font-black ${level.color}`}>
              {result.bmi.toFixed(1)}
            </div>
            <div className={`text-sm font-bold mt-1 ${level.color}`}>
              {level.label}
            </div>
          </div>

          {/* 进度条 */}
          <div>
            <div className="flex justify-between text-[9px] text-slate-400 mb-1">
              <span>偏瘦</span>
              <span>正常</span>
              <span>偏胖</span>
              <span>肥胖</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-blue-400" />
                <div className="flex-1 bg-green-400" />
                <div className="flex-1 bg-amber-400" />
                <div className="flex-1 bg-red-400" />
              </div>
              {/* 指针 */}
              <div
                className="absolute top-0 h-full w-0.5 bg-white shadow transition-all duration-500"
                style={{ left: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-300 mt-0.5">
              <span>18.5</span>
              <span>24</span>
              <span>28</span>
            </div>
          </div>

          {/* 建议 */}
          <div className="text-[11px] text-slate-600 dark:text-slate-300 text-center leading-relaxed">
            {result.msg}
          </div>
        </div>
      )}
    </div>
  );
}
