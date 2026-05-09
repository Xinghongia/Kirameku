"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMusic } from "@/components/providers/MusicProvider";

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "00:00";
  const m = Math.floor(time / 60).toString().padStart(2, "0");
  const s = Math.floor(time % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function CloudPlayer() {
  const router = useRouter();
  const {
    currentSong, isPlaying, progress, currentTime, duration, currentLyric,
    togglePlay, nextSong, prevSong, handleSeek, isLoading, saying, refreshSaying,
  } = useMusic();

  const [displayedLyric, setDisplayedLyric] = useState("");
  const prevLyricRef = useRef("");
  const charRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);


  // Typewriter effect for lyrics
  useEffect(() => {
    if (currentLyric === prevLyricRef.current) return;
    prevLyricRef.current = currentLyric;
    charRef.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedLyric("");

    if (!currentLyric) return;
    intervalRef.current = setInterval(() => {
      charRef.current++;
      if (charRef.current <= currentLyric.length) {
        setDisplayedLyric(currentLyric.slice(0, charRef.current));
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentLyric]);

  if (isLoading) {
    return (
      <div className="h-full w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex items-center justify-center min-h-[200px] md:min-h-[280px]">
        <div className="text-sm text-slate-400 animate-pulse">加载音乐中...</div>
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div
        onClick={() => router.push("/music")}
        className="h-full w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 flex flex-col items-center justify-center gap-4 min-h-[200px] md:min-h-[280px] cursor-pointer transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl group"
      >
        <svg className="w-10 h-10 text-indigo-400 dark:text-indigo-500 opacity-60" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5 3.871 3.871 0 01-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5 3.871 3.871 0 01-2.748-1.179z" />
        </svg>
        <p
          className="text-sm text-slate-700 dark:text-slate-200 font-semibold text-center leading-relaxed tracking-wide"
          style={{ fontFamily: "Georgia, 'Noto Serif SC', serif" }}
        >
          {saying || "点击前往音乐页面"}
        </p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); refreshSaying(); }}
          title="换一句"
          className="text-xs text-slate-400 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          换一句
        </button>
      </div>
    );
  }

  const safeTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePlay();
  };
  const safePrevSong = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    prevSong();
  };
  const safeNextSong = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    nextSong();
  };
  const safeHandleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    handleSeek(Number(e.target.value));
  };

  return (
    <>
      <style>{`
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #6366f1; cursor: pointer; transition: transform 0.1s; }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.3); }
      `}</style>

      <div
        onClick={() => router.push("/music")}
        className="h-full w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 md:p-6 flex flex-col justify-between transition-all duration-700 hover:scale-[1.02] relative group overflow-hidden cursor-pointer min-h-[200px] md:min-h-[280px]"
      >
        <div className={`absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 blur-[50px] rounded-full transition-opacity duration-1000 ${isPlaying ? "opacity-100" : "opacity-30"}`} />

        {/* Cover + Info */}
        <div className="flex items-center gap-3 md:gap-5 relative z-10 mb-3 md:mb-6 mt-1 md:mt-2">
          <div
            className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 border-white/50 shadow-lg flex-shrink-0 overflow-hidden relative"
            style={{ animation: isPlaying ? "spin 6s linear infinite" : "none" }}
          >
            <img src={currentSong.cover} alt="cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-300 shadow-inner" />
          </div>
          <div className="flex-col overflow-hidden w-full">
            <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 tracking-widest uppercase bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-sm shadow-sm">
              Cloud Music
            </span>
            <h3 className="text-base md:text-xl font-bold text-slate-900 dark:text-white truncate drop-shadow-sm mt-1">
              {currentSong.title}
            </h3>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-medium truncate drop-shadow-sm">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Lyric */}
        <div className="relative z-10 mb-2 h-6 overflow-hidden">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">
            {displayedLyric || "暂无歌词"}
            {isPlaying && <span className="inline-block w-[3px] h-4 bg-indigo-400 align-middle ml-1 animate-pulse" />}
          </p>
        </div>

        {/* Progress + Controls */}
        <div className="relative z-10 mt-auto">
          <div
            className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-bold mb-3"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range" min="0" max="100" value={progress} onChange={safeHandleSeek}
              title="播放进度"
              className="flex-1 h-1.5 bg-white/40 dark:bg-slate-700/50 rounded-full appearance-none outline-none cursor-pointer shadow-inner"
              style={{ background: `linear-gradient(to right, #818cf8 ${progress}%, rgba(148,163,184,0.4) ${progress}%)` }}
            />
            <span className="w-10">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button type="button" onClick={safePrevSong} title="上一首" className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative z-20">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <button type="button" onClick={safeTogglePlay} title={isPlaying ? "暂停" : "播放"} className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 hover:scale-110 transition-all border-2 border-white/50 dark:border-slate-600 relative z-20">
              {isPlaying
                ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                : <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              }
            </button>
            <button type="button" onClick={safeNextSong} title="下一首" className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative z-20">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
