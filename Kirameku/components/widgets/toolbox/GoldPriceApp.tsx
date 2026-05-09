"use client";

import { useState, useEffect } from "react";

const API = "https://v2.xxapi.cn/api/goldprice";

type Tab = "recycle" | "bank" | "brand";

interface RecycleItem {
  gold_type: string;
  recycle_price: string;
  updated_date: string;
}

interface BankItem {
  bank: string;
  price: string;
}

interface BrandItem {
  brand: string;
  bullion_price: string;
  gold_price: string;
  platinum_price: string;
  updated_date: string;
}

interface GoldData {
  bank_gold_bar_price: BankItem[];
  gold_recycle_price: RecycleItem[];
  precious_metal_price: BrandItem[];
}

export default function GoldPriceApp() {
  const [data, setData] = useState<GoldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("recycle");

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((json) => {
        if (json.code === 200 && json.data) {
          setData(json.data);
        } else {
          setError(json.msg || "获取失败");
        }
      })
      .catch(() => setError("网络请求失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-slate-400 animate-pulse">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "recycle", label: "回收价" },
    { id: "bank", label: "银行金条" },
    { id: "brand", label: "品牌金价" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Tab */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors ${
              tab === t.id
                ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 回收价 */}
      {tab === "recycle" && data?.gold_recycle_price && (
        <div className="space-y-1">
          {data.gold_recycle_price.map((item, i) => (
            <div
              key={`${item.gold_type}-${i}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="text-xs text-slate-700 dark:text-slate-300">{item.gold_type}</span>
              <span className="text-xs font-black text-amber-500">{item.recycle_price} 元/克</span>
            </div>
          ))}
        </div>
      )}

      {/* 银行金条 */}
      {tab === "bank" && data?.bank_gold_bar_price && (
        <div className="space-y-1">
          {data.bank_gold_bar_price.map((item, i) => (
            <div
              key={`${item.bank}-${i}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="text-xs text-slate-700 dark:text-slate-300 truncate mr-2">{item.bank}</span>
              <span className="text-xs font-black text-amber-500 shrink-0">{item.price} 元/克</span>
            </div>
          ))}
        </div>
      )}

      {/* 品牌金价 */}
      {tab === "brand" && data?.precious_metal_price && (
        <div className="space-y-1">
          {data.precious_metal_price.map((item, i) => (
            <div
              key={`${item.brand}-${i}`}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.brand}</span>
                <span className="text-[9px] text-slate-400">{item.updated_date}</span>
              </div>
              <div className="flex gap-3 text-[10px]">
                <span className="text-slate-500">金条 <span className="font-bold text-amber-500">{item.bullion_price}</span></span>
                <span className="text-slate-500">黄金 <span className="font-bold text-amber-500">{item.gold_price}</span></span>
                <span className="text-slate-500">铂金 <span className="font-bold text-slate-400">{item.platinum_price}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
