"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Heart, ChevronLeft, Send, Reply, LogOut,
  ChevronDown, ChevronUp,
} from "lucide-react";
import Lightbox from "@/components/photos/Lightbox";
import {
  getChatters, getChatterComments, createChatterComment, likeChatter,
  likeChatterComment,
  type ChatterItem, type ChatterCommentItem,
} from "@/app/api";
import { getGithubUser } from "@/app/api/messages";
import type { GitHubUser } from "@/app/api/types";
import { siteConfig } from "@/siteConfig";

interface Moment {
  id: string;
  content: string;
  images: string[];
  mood: string;
  likes: number;
  comments_count: number;
  created_at: string;
}

interface Photo {
  id: string;
  url: string;
  caption: string;
  orientation: "landscape" | "portrait";
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const rotations = [-2, 1.5, -1, 2, -1.5, 1, -0.5, 1.5];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 3) return `${days}天前`;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function flattenReplies(
  replies: ChatterCommentItem[],
  parentMap?: Map<number, string>
): (ChatterCommentItem & { replyToUser?: string })[] {
  const map = parentMap ?? new Map<number, string>();
  const result: (ChatterCommentItem & { replyToUser?: string })[] = [];
  for (const r of replies) {
    const replyToUser = map.get(r.parent_id!);
    result.push(replyToUser ? { ...r, replyToUser } : r);
    if (r.replies?.length) {
      map.set(r.id, r.github_user?.login ?? "匿名用户");
      result.push(...flattenReplies(r.replies, map));
    }
  }
  return result;
}

export default function MomentsPage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [onlyViewId, setOnlyViewId] = useState<string | null>(() => searchParams.get("onlyView"));
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const saved = localStorage.getItem("liked_chatters");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [lightbox, setLightbox] = useState<{
    photos: Photo[];
    index: number;
  } | null>(null);

  // 评论相关
  const [user, setUser] = useState<GitHubUser | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("github_user");
    if (saved) { try { return JSON.parse(saved); } catch { return null; } }
    return null;
  });
  const [commentInput, setCommentInput] = useState("");
  const [replyTo, setReplyTo] = useState<ChatterCommentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentsMap, setCommentsMap] = useState<Record<string, ChatterCommentItem[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [likedCommentIds, setLikedCommentIds] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    const saved = localStorage.getItem("liked_chatter_comments");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 恢复 GitHub 登录状态
  useEffect(() => {
    const savedToken = localStorage.getItem("github_token");
    if (savedToken && !user) {
      getGithubUser(savedToken)
        .then((u) => { setUser(u); localStorage.setItem("github_user", JSON.stringify(u)); })
        .catch(() => { localStorage.removeItem("github_token"); localStorage.removeItem("github_user"); });
    }
  }, []);

  // "只看这条" 时加载评论
  useEffect(() => {
    if (!onlyViewId) return;
    const cid = parseInt(onlyViewId);
    if (isNaN(cid) || commentsMap[onlyViewId]) return;
    setCommentsLoading((p) => ({ ...p, [onlyViewId]: true }));
    getChatterComments(cid)
      .then((data) => setCommentsMap((p) => ({ ...p, [onlyViewId]: data })))
      .catch(() => {})
      .finally(() => setCommentsLoading((p) => ({ ...p, [onlyViewId]: false })));
  }, [onlyViewId, commentsMap]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getChatters({ status: "published", page: 1, size: 50 });
        if (!active) return;
        setMoments(data.map((item: ChatterItem) => ({
          id: String(item.id),
          content: item.content,
          images: item.images || [],
          mood: item.mood || "",
          likes: item.likes,
          comments_count: item.comments_count,
          created_at: item.created_at,
        })));
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  const dayGroups = useMemo(() => {
    const map = new Map<string, Moment[]>();
    for (const m of moments) {
      const key = m.created_at.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ date: key, label: formatDate(items[0].created_at), moments: items }));
  }, [moments]);

  const visibleGroups = onlyViewId
    ? dayGroups.map((g) => ({ ...g, moments: g.moments.filter((m) => m.id === onlyViewId) })).filter((g) => g.moments.length > 0)
    : dayGroups;

  async function toggleLike(id: string) {
    const chatterId = parseInt(id);
    if (isNaN(chatterId)) return;
    const alreadyLiked = likedIds.has(id);
    try {
      const result = await likeChatter(chatterId, alreadyLiked);
      setLikedIds((p) => {
        const n = new Set(p);
        if (alreadyLiked) n.delete(id); else n.add(id);
        localStorage.setItem("liked_chatters", JSON.stringify([...n]));
        return n;
      });
      setMoments((p) =>
        p.map((m) => m.id === id ? { ...m, likes: result.likes } : m)
      );
    } catch {}
  }

  function handleLogin() { sessionStorage.setItem("github_redirect", window.location.pathname); window.location.href = "/api/auth/github/login"; }
  function handleLogout() { localStorage.removeItem("github_token"); localStorage.removeItem("github_user"); setUser(null); }
  function cancelReply() { setReplyTo(null); setCommentInput(""); }

  async function handleCommentLike(commentId: number) {
    const alreadyLiked = likedCommentIds.has(commentId);
    try {
      const updated = await likeChatterComment(commentId, alreadyLiked);
      setLikedCommentIds((p) => {
        const n = new Set(p);
        if (alreadyLiked) n.delete(commentId); else n.add(commentId);
        localStorage.setItem("liked_chatter_comments", JSON.stringify([...n]));
        return n;
      });
      // 更新 commentsMap 中的点赞数
      setCommentsMap((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].map((c) => updateCommentLikes(c, commentId, updated.likes));
        }
        return next;
      });
    } catch {}
  }

  function updateCommentLikes(c: ChatterCommentItem, targetId: number, likes: number): ChatterCommentItem {
    if (c.id === targetId) return { ...c, likes };
    if (c.replies?.length) return { ...c, replies: c.replies.map((r) => updateCommentLikes(r, targetId, likes)) };
    return c;
  }

  function startReply(c: ChatterCommentItem) {
    setReplyTo(c); setCommentInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function findTopLevelId(comments: ChatterCommentItem[], targetId: number): number | null {
    for (const c of comments) {
      if (c.id === targetId) return c.id;
      for (const r of c.replies ?? []) { if (r.id === targetId) return c.id; for (const rr of r.replies ?? []) { if (rr.id === targetId) return c.id; } }
    }
    return null;
  }

  async function handleSubmitComment(chatterId: number) {
    if (!commentInput.trim() || submitting || !user) return;
    setSubmitting(true);
    try {
      const nc = await createChatterComment({ chatter_id: chatterId, content: commentInput.trim(), parent_id: replyTo?.id });
      const sid = String(chatterId);
      if (replyTo) {
        const pid = findTopLevelId(commentsMap[sid] ?? [], replyTo.id) ?? replyTo.id;
        setCommentsMap((p) => ({ ...p, [sid]: (p[sid] ?? []).map((c) => c.id === pid ? { ...c, replies: [...c.replies, nc] } : c) }));
        setExpandedReplies((p) => new Set([...p, pid]));
      } else {
        setCommentsMap((p) => ({ ...p, [sid]: [...(p[sid] ?? []), nc] }));
      }
      setMoments((p) => p.map((m) => m.id === sid ? { ...m, comments_count: m.comments_count + 1 } : m));
      setCommentInput(""); setReplyTo(null);
    } catch { alert("发送失败"); } finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 md:mb-12">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <MessageSquare className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
            <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">说说</h1>
          </div>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 ml-7 md:ml-10">记录生活中的小确幸</p>
        </motion.div>
        <div className="space-y-3 md:space-y-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 md:h-24 rounded-2xl bg-white/40 dark:bg-slate-800/40 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-12">
      {/* 页头 */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 md:mb-12">
        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
          <MessageSquare className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">说说</h1>
        </div>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 ml-7 md:ml-10">记录生活中的小确幸</p>
      </motion.div>

      {onlyViewId && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} type="button" onClick={() => setOnlyViewId(null)}
          className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500 hover:text-sky-500 transition-colors mb-4 md:mb-8">
          <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />返回全部
        </motion.button>
      )}

      {!loading && moments.length === 0 && (
        <div className="text-center py-12 md:py-20 text-slate-400">
          <MessageSquare className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-40" />
          <p className="text-sm md:text-base">暂无说说</p>
        </div>
      )}

      {visibleGroups.map((group, groupIdx) => (
        <motion.div key={group.date} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: groupIdx * 0.1 }} className="mb-8 md:mb-14 last:mb-0">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-5">
            <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">{group.label}</span>
            <span className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">{group.moments.length} 条</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
          </div>

          <div className="relative" style={{ minHeight: group.moments.length > 1 ? 100 + (group.moments.length - 1) * 18 : "auto" }}>
            {group.moments.map((moment, i) => {
              const rot = rotations[i % rotations.length];
              const offsetX = i % 2 === 0 ? -4 : 4;
              const isExpanded = expandedId === moment.id;
              const hasImages = moment.images && moment.images.length > 0;

              return (
                <motion.div key={moment.id} layout
                  ref={(el) => { if (isExpanded && el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100); }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, rotate: isExpanded ? 0 : onlyViewId ? 0 : rot, x: isExpanded ? 0 : onlyViewId ? 0 : offsetX }}
                  transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.05 }}
                  whileHover={!isExpanded && !onlyViewId ? { rotate: 0, x: 0, y: -4, scale: 1.01 } : undefined}
                  onClick={() => setExpandedId(isExpanded ? null : moment.id)}
                  className={`${group.moments.length > 1 && !onlyViewId ? "absolute left-0 right-0" : "relative"} cursor-pointer`}
                  style={{ zIndex: isExpanded ? 50 : group.moments.length - i, ...(group.moments.length > 1 && !onlyViewId ? { top: i * 18 } : {}) }}>
                  <div className="rounded-2xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                    {!isExpanded && !onlyViewId && (
                      <div className="px-3 py-3 md:px-5 md:py-4">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                          <span className="text-[10px] md:text-xs text-slate-400">{relativeTime(moment.created_at)}</span>
                          {moment.mood && <span className="text-[10px] md:text-xs">{moment.mood}</span>}
                          {hasImages && <span className="text-[10px] md:text-xs text-slate-400">📷</span>}
                        </div>
                        <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{moment.content}</p>
                      </div>
                    )}

                    {(isExpanded || onlyViewId) && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <div className="p-3 md:p-5">
                          <div className="flex items-center justify-between mb-2 md:mb-3">
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <Image src="/images/hong.jpg" alt="avatar" width={24} height={24} className="rounded-full object-cover md:w-7 md:h-7" />
                              <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">{siteConfig.authorName}</span>
                              <span className="text-[10px] md:text-xs text-slate-400">{relativeTime(moment.created_at)}</span>
                            </div>
                            {moment.mood && (
                              <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">{moment.mood}</span>
                            )}
                          </div>

                          <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3 md:mb-4 whitespace-pre-wrap">{moment.content}</p>

                          {hasImages && (
                            <div className={`grid gap-1.5 md:gap-2 mb-3 md:mb-4 ${moment.images.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                              {moment.images.map((img, idx) => {
                                const photos: Photo[] = moment.images.map((url, pi) => ({ id: `${moment.id}-${pi}`, url, caption: "", orientation: "landscape" as const }));
                                return (
                                  <div key={idx} onClick={(e) => { e.stopPropagation(); setLightbox({ photos, index: idx }); }}
                                    className="relative rounded-lg md:rounded-xl overflow-hidden cursor-pointer group/img aspect-square">
                                    <Image src={img} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover/img:scale-105" />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-slate-200/50 dark:border-white/5">
                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleLike(moment.id); }}
                              className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-slate-400 hover:text-pink-500 transition-colors">
                              <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-all duration-300 ${likedIds.has(moment.id) ? "fill-pink-500 text-pink-500 scale-110" : ""}`} />
                              <span>{moment.likes}</span>
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setOnlyViewId(onlyViewId === moment.id ? null : moment.id); }}
                              className="text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors">
                              {onlyViewId === moment.id ? "返回全部" : "只看这条"}
                            </button>
                          </div>
                        </div>

                        {onlyViewId && (<>
                          {/* ---- 评论区 ---- */}
                          <div className="border-t border-slate-200/50 dark:border-white/5 px-3 md:px-5 py-3 md:py-4" onClick={(e) => e.stopPropagation()}>
                            {user ? (
                              <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-xl bg-white/40 dark:bg-slate-700/30">
                                <Image src={user.avatar} alt={user.login} width={24} height={24} className="rounded-full md:w-7 md:h-7" />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-1">{user.login}</span>
                                <button type="button" onClick={handleLogout}
                                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors">
                                  <LogOut className="w-3 h-3" />退出
                                </button>
                              </div>
                            ) : (
                              <button type="button" onClick={handleLogin}
                                className="flex items-center gap-2 mb-3 w-full px-2 py-1.5 rounded-xl bg-white/40 dark:bg-slate-700/30 hover:bg-white/60 dark:hover:bg-slate-700/50 transition-all">
                                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center">
                                  <GithubIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white dark:text-slate-900" />
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">登录 GitHub 参与讨论</span>
                              </button>
                            )}

                            {/* 输入框 */}
                            <div className="rounded-xl bg-white/40 dark:bg-slate-700/30 overflow-hidden mb-3">
                              <AnimatePresence>
                                {replyTo && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="flex items-center gap-1.5 px-2 pt-2 pb-0 text-[10px] text-slate-500 dark:text-slate-400">
                                      <Reply className="w-3 h-3" />
                                      <span>回复 <span className="font-medium text-sky-600 dark:text-sky-400">{replyTo.github_user?.login ?? "匿名"}</span></span>
                                      <span className="truncate flex-1 opacity-60 ml-1">{replyTo.content.slice(0, 40)}</span>
                                      <button type="button" onClick={cancelReply} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">✕</button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              <div className="p-2">
                                <textarea ref={inputRef} value={commentInput} onChange={(e) => setCommentInput(e.target.value)}
                                  placeholder={user ? "说点什么..." : "登录后即可评论..."} disabled={!user} rows={2}
                                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitComment(parseInt(moment.id)); }}
                                  className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none outline-none disabled:cursor-not-allowed disabled:opacity-50" />
                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/30 dark:border-white/5">
                                  <span className="text-[10px] text-slate-400">{"Ctrl + Enter 发送"}</span>
                                  <button type="button" onClick={() => handleSubmitComment(parseInt(moment.id))}
                                    disabled={!user || !commentInput.trim() || submitting}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500 text-white text-[10px] font-medium hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                    <Send className="w-3 h-3" />{submitting ? "发送中..." : replyTo ? "回复" : "发送"}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {commentsLoading[moment.id] && (
                              <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 rounded-xl bg-white/30 dark:bg-slate-700/20 animate-pulse" />)}</div>
                            )}

                            {!commentsLoading[moment.id] && (commentsMap[moment.id]?.length ?? 0) > 0 && (
                              <div className="space-y-2">
                                {commentsMap[moment.id].map((comment) => (
                                  <CommentCard key={comment.id} comment={comment} expandedReplies={expandedReplies}
                                    onReply={startReply}
                                    onToggleReplies={(id) => setExpandedReplies((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
                                    likedCommentIds={likedCommentIds}
                                    onCommentLike={handleCommentLike} />
                                ))}
                              </div>
                            )}

                            {!commentsLoading[moment.id] && !commentsMap[moment.id]?.length && (
                              <p className="text-center text-[10px] text-slate-400 py-2">暂无评论</p>
                            )}
                          </div>
                        </>)}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}

      <AnimatePresence>
        {expandedId && !onlyViewId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setExpandedId(null)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
        )}
      </AnimatePresence>

      <Lightbox photos={lightbox?.photos ?? []} index={lightbox?.index ?? 0} open={!!lightbox}
        onClose={() => setLightbox(null)}
        onPrev={() => setLightbox((lb) => lb ? { ...lb, index: (lb.index - 1 + lb.photos.length) % lb.photos.length } : null)}
        onNext={() => setLightbox((lb) => lb ? { ...lb, index: (lb.index + 1) % lb.photos.length } : null)} />
    </div>
  );
}

function CommentCard({ comment, expandedReplies, onReply, onToggleReplies, likedCommentIds, onCommentLike }: {
  comment: ChatterCommentItem; expandedReplies: Set<number>;
  onReply: (c: ChatterCommentItem) => void; onToggleReplies: (id: number) => void;
  likedCommentIds: Set<number>; onCommentLike: (id: number) => void;
}) {
  const isExpanded = expandedReplies.has(comment.id);
  const flat = flattenReplies(comment.replies ?? []);
  const replyCount = flat.length;

  return (
    <div className="rounded-xl bg-white/40 dark:bg-slate-700/30 overflow-hidden">
      <div className="p-2 md:p-3">
        <div className="flex items-center gap-2 mb-1.5">
          {comment.github_user ? (
            <Image src={comment.github_user.avatar} alt={comment.github_user.login} width={22} height={22} className="rounded-full md:w-6 md:h-6" />
          ) : (
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white text-[10px] font-bold">?</div>
          )}
          <span className="text-[10px] md:text-xs font-semibold text-slate-700 dark:text-slate-300">{comment.github_user?.login ?? "匿名用户"}</span>
          <span className="text-[10px] text-slate-400 ml-auto">{relativeTime(comment.created_at)}</span>
        </div>
        <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap mb-1.5 md:mb-2 ml-7 md:ml-8">{comment.content}</p>
        <div className="flex items-center gap-2 ml-7 md:ml-8">
          <button type="button" onClick={() => onCommentLike(comment.id)} className={`flex items-center gap-0.5 text-[10px] transition-colors ${likedCommentIds.has(comment.id) ? "text-pink-500" : "text-slate-400 hover:text-pink-500"}`}>
            <Heart className={`w-3 h-3 ${likedCommentIds.has(comment.id) ? "fill-pink-500" : ""}`} />
            <span>{comment.likes}</span>
          </button>
          <button type="button" onClick={() => onReply(comment)} className="flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-sky-500 transition-colors">
              <Reply className="w-3 h-3" />回复
            </button>
          {replyCount > 0 && (
            <button type="button" onClick={() => onToggleReplies(comment.id)} className="flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-blue-500 transition-colors ml-auto">
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {replyCount} 条回复
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && replyCount > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="border-t border-slate-200/30 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/20">
              {flat.map((reply) => <ReplyCard key={reply.id} reply={reply} onReply={onReply} likedCommentIds={likedCommentIds} onCommentLike={onCommentLike} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReplyCard({ reply, onReply, likedCommentIds, onCommentLike }: {
  reply: ChatterCommentItem & { replyToUser?: string }; onReply: (c: ChatterCommentItem) => void;
  likedCommentIds: Set<number>; onCommentLike: (id: number) => void;
}) {
  return (
    <div className="px-2 py-1.5 md:px-3 md:py-2 border-b border-slate-200/20 dark:border-white/5 last:border-0">
      <div className="flex items-start gap-1.5 md:gap-2">
        {reply.github_user ? (
          <Image src={reply.github_user.avatar} alt={reply.github_user.login} width={18} height={18} className="rounded-full mt-0.5 md:w-5 md:h-5" />
        ) : (
          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white text-[8px] font-bold mt-0.5">?</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{reply.github_user?.login ?? "匿名用户"}</span>
            <span className="text-[9px] text-slate-400">{relativeTime(reply.created_at)}</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed whitespace-pre-wrap">
            {reply.replyToUser && <span className="text-sky-500 dark:text-sky-400 mr-1">回复 @{reply.replyToUser}：</span>}
            {reply.content}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <button type="button" onClick={() => onCommentLike(reply.id)} className={`flex items-center gap-0.5 text-[9px] transition-colors ${likedCommentIds.has(reply.id) ? "text-pink-500" : "text-slate-400 hover:text-pink-500"}`}>
              <Heart className={`w-2.5 h-2.5 ${likedCommentIds.has(reply.id) ? "fill-pink-500" : ""}`} />
              <span>{reply.likes}</span>
            </button>
            <button type="button" onClick={() => onReply(reply)} className="flex items-center gap-0.5 text-[9px] text-slate-400 hover:text-sky-500 transition-colors">
              <Reply className="w-2.5 h-2.5" />回复
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
