"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic } from "@/components/providers/MusicProvider";

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

// SVG Icons
const Icons = {
  prev: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>,
  next: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>,
  play: <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>,
  pause: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>,
  loop: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11V9a4 4 0 014-4h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 23l-4-4 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  ),
  single: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11V9a4 4 0 014-4h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 23l-4-4 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13v2a4 4 0 01-4 4H3" />
      <text x="10" y="15" fill="currentColor" stroke="none" fontSize="8" fontWeight="bold">1</text>
    </svg>
  ),
  random: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  ),
  volumeHigh: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  ),
  volumeLow: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  ),
  volumeMute: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ),
  lyrics: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
    </svg>
  ),
  playlist: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h10" />
    </svg>
  ),
};

const modeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  loop: { icon: Icons.loop, label: "列表循环" },
  single: { icon: Icons.single, label: "单曲循环" },
  random: { icon: Icons.random, label: "随机播放" },
};

// Reusable glass card with homepage-style hover
function MusicCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl md:rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 md:p-6 transition-all duration-700 hover:shadow-2xl hover:scale-[1.01] ${className}`}>
      {children}
    </div>
  );
}

export default function MusicPage() {
  const {
    playlist, currentIndex, currentSong, isPlaying, progress, currentTime, duration,
    currentLyric, allLyrics, isLoading, volume, isMuted, playMode,
    togglePlay, nextSong, prevSong, handleSeek, playSong,
    setVolume, toggleMute, togglePlayMode,
  } = useMusic();

  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"lyrics" | "playlist">("lyrics");

  const activeLyricIndex = useMemo(() => {
    if (!allLyrics.length) return -1;
    for (let i = allLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= allLyrics[i].time) return i;
    }
    return 0;
  }, [currentTime, allLyrics]);

  useEffect(() => {
    if (activeLyricRef.current && lyricContainerRef.current) {
      const container = lyricContainerRef.current;
      const el = activeLyricRef.current;
      const offset = el.offsetTop - container.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    }
  }, [activeLyricIndex]);

  const volumeIcon = isMuted ? Icons.volumeMute : volume > 0.5 ? Icons.volumeHigh : Icons.volumeLow;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        <MusicCard>
          <div className="flex items-center justify-center h-40 md:h-64">
            <div className="text-sm md:text-base text-slate-600 dark:text-slate-300 animate-pulse font-medium">连接音乐云端中...</div>
          </div>
        </MusicCard>
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        <MusicCard>
          <div className="flex items-center justify-center h-40 md:h-64">
            <div className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-medium">暂无音乐，请在 siteConfig 中配置 cloudMusicIds</div>
          </div>
        </MusicCard>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-4xl mx-auto px-4 py-6 md:py-12"
    >
      {/* Background glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ backgroundImage: `url(${currentSong.cover})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      </div>

      {/* Hero */}
      <MusicCard className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">
          {/* Vinyl Disc */}
          <div className="relative shrink-0">
            <div className="w-36 h-36 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-3 rounded-full border border-white/5" />
              <div className="absolute inset-6 rounded-full border border-white/5" />
              <div className="absolute inset-9 rounded-full border border-white/5" />
              <div className="absolute inset-12 rounded-full border border-white/5" />
              <div
                className="w-[72px] h-[72px] md:w-24 md:h-24 rounded-full overflow-hidden shadow-inner"
                style={{ animation: isPlaying ? "spin 8s linear infinite" : "none" }}
              >
                <img src={currentSong.cover} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/80 shadow" />
            </div>
            {isPlaying && (
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl -z-10 animate-pulse" />
            )}
          </div>

          {/* Info + Controls */}
          <div className="flex-1 text-center sm:text-left w-full">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1 drop-shadow-sm">{currentSong.title}</h1>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-200 font-medium mb-4 md:mb-6">{currentSong.artist}</p>

            {/* Progress */}
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <span className="text-[10px] md:text-xs text-slate-600 dark:text-slate-300 font-bold w-8 md:w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
              <div className="flex-1 relative group">
                <div className="h-1.5 bg-slate-200/80 dark:bg-slate-600/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <input
                  type="range" min="0" max="100" value={progress}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  title="播放进度"
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-[10px] md:text-xs text-slate-600 dark:text-slate-300 font-bold w-8 md:w-10 tabular-nums">{formatTime(duration)}</span>
            </div>

            {/* Transport */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 md:gap-2">
              <button type="button" onClick={togglePlayMode} title={modeConfig[playMode].label}
                className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-500 hover:bg-white/30 dark:hover:bg-slate-700/50 transition-colors">
                {modeConfig[playMode].icon}
              </button>
              <button type="button" onClick={prevSong} title="上一首"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-indigo-500 hover:bg-white/30 dark:hover:bg-slate-700/50 transition-colors">
                {Icons.prev}
              </button>
              <button type="button" onClick={togglePlay} title={isPlaying ? "暂停" : "播放"}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 hover:scale-105 transition-all">
                {isPlaying ? Icons.pause : Icons.play}
              </button>
              <button type="button" onClick={nextSong} title="下一首"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-indigo-500 hover:bg-white/30 dark:hover:bg-slate-700/50 transition-colors">
                {Icons.next}
              </button>
              <div className="flex items-center gap-1 ml-1 md:ml-2">
                <button type="button" onClick={toggleMute} title={isMuted ? "取消静音" : "静音"}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-500 hover:bg-white/30 dark:hover:bg-slate-700/50 transition-colors">
                  {volumeIcon}
                </button>
                <input
                  type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  title="音量"
                  className="w-12 md:w-16 h-1 accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Current lyric - always reserve space to prevent jitter */}
            <div className="mt-3 md:mt-4 h-6 md:h-7 flex items-center">
              {currentLyric && (
                <span className="text-xs md:text-sm text-indigo-600 dark:text-indigo-300 font-bold italic drop-shadow-sm truncate w-full">
                  &ldquo;{currentLyric}&rdquo;
                </span>
              )}
            </div>
          </div>
        </div>
      </MusicCard>

      {/* Tab switch */}
      <div className="flex gap-1 mb-3 md:mb-4 rounded-xl md:rounded-2xl bg-white/30 dark:bg-slate-800/40 backdrop-blur-md border border-white/30 dark:border-white/10 p-1">
        <button type="button" onClick={() => setTab("lyrics")}
          className={`flex-1 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1 md:gap-1.5 ${
            tab === "lyrics"
              ? "bg-white/60 dark:bg-slate-700/70 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}>
          {Icons.lyrics} 歌词
        </button>
        <button type="button" onClick={() => setTab("playlist")}
          className={`flex-1 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1 md:gap-1.5 ${
            tab === "playlist"
              ? "bg-white/60 dark:bg-slate-700/70 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}>
          {Icons.playlist} 播放列表
        </button>
      </div>

      {/* Panels */}
      <AnimatePresence mode="wait">
        {tab === "lyrics" && (
          <motion.div key="lyrics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <MusicCard>
              <div
                ref={lyricContainerRef}
                className="h-[280px] md:h-[400px] overflow-y-auto"
                style={{ maskImage: "linear-gradient(transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(transparent, black 10%, black 90%, transparent)" }}
              >
                {allLyrics.length > 0 ? (
                  <div className="py-12 md:py-20 space-y-3 md:space-y-5">
                    {allLyrics.map((line, i) => (
                      <div
                        key={i}
                        ref={i === activeLyricIndex ? activeLyricRef : null}
                        className={`text-center transition-all duration-300 cursor-pointer select-none ${
                          i === activeLyricIndex
                            ? "text-base md:text-xl font-black text-indigo-600 dark:text-indigo-300 scale-105 drop-shadow-sm"
                            : i < activeLyricIndex
                            ? "text-xs md:text-sm text-slate-500 dark:text-slate-400"
                            : "text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium"
                        }`}
                        onClick={() => handleSeek((line.time / (duration || 1)) * 100)}
                      >
                        {line.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                    {Icons.lyrics}
                    <span className="text-xs md:text-sm font-medium">暂无歌词</span>
                  </div>
                )}
              </div>
            </MusicCard>
          </motion.div>
        )}

        {tab === "playlist" && (
          <motion.div key="playlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <MusicCard>
              <div className="space-y-1">
                {playlist.map((song, i) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => playSong(i)}
                    className={`w-full flex items-center gap-2 md:gap-3 px-2 py-2 md:px-3 md:py-3 rounded-lg md:rounded-xl transition-all duration-300 text-left group ${
                      i === currentIndex
                        ? "bg-indigo-500/10 dark:bg-indigo-500/20 shadow-sm"
                        : "hover:bg-white/40 dark:hover:bg-slate-700/40 hover:shadow-sm hover:scale-[1.005]"
                    }`}
                  >
                    {/* Index */}
                    <div className="w-5 md:w-6 text-center shrink-0">
                      {i === currentIndex && isPlaying ? (
                        <div className="flex items-end justify-center gap-[2px] h-4">
                          {[0, 1, 2].map((j) => (
                            <div key={j} className="w-1 bg-indigo-500 rounded-t-sm animate-pulse" style={{ height: `${6 + j * 4}px`, animationDelay: `${j * 150}ms` }} />
                          ))}
                        </div>
                      ) : (
                        <span className={`text-[10px] md:text-xs font-bold tabular-nums ${i === currentIndex ? "text-indigo-500" : "text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    {/* Cover */}
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden shrink-0 shadow-sm">
                      <img src={song.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs md:text-sm font-bold truncate ${i === currentIndex ? "text-indigo-600 dark:text-indigo-300" : "text-slate-800 dark:text-slate-100"}`}>
                        {song.title}
                      </div>
                      <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{song.artist}</div>
                    </div>
                    {/* Play indicator */}
                    {i === currentIndex && (
                      <div className="text-indigo-500 shrink-0">
                        {isPlaying ? Icons.pause : Icons.play}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </MusicCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
