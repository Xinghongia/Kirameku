"use client";

import { useState, useCallback } from "react";
import PortalOverlay from "./PortalOverlay";

const API = "https://v2.xxapi.cn/api/ys?return=json";

export default function GenshinApp() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const fetchImage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const json = await res.json();
      if (json.code === 200 && json.data) {
        setUrl(json.data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={fetchImage}
        className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 active:scale-95 transition-all"
      >
        {loading ? "加载中..." : "随机一张"}
      </button>

      {url && (
        <div
          className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-zoom-in"
          onClick={() => setFullscreen(true)}
        >
          <img
            src={url}
            alt="genshin"
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      )}

      {!url && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <svg className="w-12 h-12 mb-2 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="2" strokeWidth="1.5" />
            <path d="M3 16l5-5 4 4 3-3 6 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs">点击按钮获取随机原神图片</span>
        </div>
      )}

      {/* 全屏预览 */}
      {fullscreen && url && (
        <PortalOverlay>
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center cursor-zoom-out"
            onClick={() => setFullscreen(false)}
          >
            <img src={url} alt="genshin" className="max-w-[95vw] max-h-[95vh] object-contain" />
            <button
              type="button"
              title="关闭"
              onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </PortalOverlay>
      )}
    </div>
  );
}
