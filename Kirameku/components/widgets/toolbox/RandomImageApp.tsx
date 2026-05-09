"use client";

import { useState, useRef } from "react";
import PortalOverlay from "./PortalOverlay";

const BASE = "https://uapis.cn/api/v1/random/image";

const categories = [
  { id: "", name: "全局随机" },
  { id: "acg", name: "二次元" },
  { id: "landscape", name: "风景" },
  { id: "anime", name: "混合动漫" },
  { id: "pc_wallpaper", name: "电脑壁纸" },
  { id: "mobile_wallpaper", name: "手机壁纸" },
  { id: "general_anime", name: "动漫" },
  { id: "ai_drawing", name: "AI绘画" },
  { id: "bq", name: "表情包" },
  { id: "furry", name: "福瑞" },
];

const subTypes: Record<string, { id: string; name: string }[]> = {
  acg: [
    { id: "", name: "全部" },
    { id: "pc", name: "横屏" },
    { id: "mb", name: "竖屏" },
  ],
  bq: [
    { id: "", name: "全部" },
    { id: "eciyuan", name: "二次元" },
    { id: "ikun", name: "ikun" },
    { id: "xiongmao", name: "熊猫" },
    { id: "waiguoren", name: "外国人" },
    { id: "maomao", name: "猫猫" },
  ],
  furry: [
    { id: "", name: "全部" },
    { id: "z4k", name: "z4k" },
    { id: "szs8k", name: "szs8k" },
    { id: "s4k", name: "s4k" },
    { id: "4k", name: "4k" },
  ],
};

export default function RandomImageApp() {
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const availableTypes = subTypes[category] || [];

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setType("");
  };

  const fetchImage = () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    const url = `${BASE}?${params.toString()}&t=${Date.now()}`;
    setImgUrl(url);
  };

  const handleLoad = () => {
    setLoading(false);
    setError("");
  };

  const handleError = () => {
    setLoading(false);
    setError("图片加载失败，换个分类试试");
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
              category === cat.id
                ? "bg-indigo-500 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Sub types */}
      {availableTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                type === t.id
                  ? "bg-purple-500 text-white shadow-md"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Image area */}
      <div className="flex-1 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center relative min-h-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-100/80 dark:bg-slate-800/80">
            <svg className="w-8 h-8 text-indigo-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        )}
        {error && !loading && (
          <p className="text-xs text-slate-400 text-center px-4">{error}</p>
        )}
        {!imgUrl && !loading && !error && (
          <p className="text-xs text-slate-400">点击下方按钮获取随机图片</p>
        )}
        {imgUrl && (
          <img
            ref={imgRef}
            src={imgUrl}
            alt="随机图片"
            className="w-full h-full object-contain cursor-zoom-in"
            onLoad={handleLoad}
            onError={handleError}
            onClick={() => !loading && !error && setZoomed(true)}
          />
        )}
      </div>

      {/* Fetch button */}
      <button
        type="button"
        onClick={fetchImage}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-bold shadow-lg hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? "加载中..." : "换一张"}
      </button>
      {/* Lightbox */}
      {zoomed && imgUrl && (
        <PortalOverlay>
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center cursor-zoom-out"
            onClick={() => setZoomed(false)}
          >
            <img src={imgUrl} alt="随机图片" className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </PortalOverlay>
      )}
    </div>
  );
}
