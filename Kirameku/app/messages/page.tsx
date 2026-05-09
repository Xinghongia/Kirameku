"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  Heart,
  MessageCircle,
  Send,
  LogOut,
  Reply,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
import {
  getMessages,
  createMessage,
  likeMessage,
  getGithubUser,
  type MessageItem,
  type GitHubUser,
} from "@/app/api/messages";

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}月${day}日`;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<GitHubUser | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("github_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    const saved = localStorage.getItem("liked_messages");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set()
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 处理 GitHub 登录回调
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("github_token", token);
      getGithubUser(token).then((u) => {
        setUser(u);
        localStorage.setItem("github_user", JSON.stringify(u));
      });
      // 清除 URL 中的 token
      router.replace("/messages");
    } else {
      // 验证已有 token 是否还有效
      const savedToken = localStorage.getItem("github_token");
      if (savedToken) {
        getGithubUser(savedToken)
          .then((u) => {
            setUser(u);
            localStorage.setItem("github_user", JSON.stringify(u));
          })
          .catch(() => {
            localStorage.removeItem("github_token");
            localStorage.removeItem("github_user");
            setUser(null);
          });
      }
    }
  }, [searchParams, router]);

  // 加载留言
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [data] = await Promise.all([
          getMessages({ page: 1, size: 50 }),
        ]);
        if (!active) return;
        setMessages(data);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  function handleLogin() {
    window.location.href = "/api/auth/github/login";
  }

  function handleLogout() {
    localStorage.removeItem("github_token");
    localStorage.removeItem("github_user");
    setUser(null);
  }

  async function handleSubmit() {
    if (!inputValue.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newMsg = await createMessage({
        content: inputValue.trim(),
        parent_id: replyTo?.id,
      });
      if (replyTo) {
        // 回复：添加到父留言的 replies
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyTo.id
              ? { ...m, replies: [...m.replies, newMsg] }
              : m
          )
        );
        setExpandedReplies((prev) => new Set([...prev, replyTo.id]));
      } else {
        // 新留言：添加到顶部
        setMessages((prev) => [newMsg, ...prev]);
      }
      setInputValue("");
      setReplyTo(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "发送失败";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(msgId: number) {
    const alreadyLiked = likedIds.has(msgId);
    try {
      const updated = await likeMessage(msgId, alreadyLiked);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (alreadyLiked) next.delete(msgId);
        else next.add(msgId);
        localStorage.setItem("liked_messages", JSON.stringify([...next]));
        return next;
      });
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) return { ...m, likes: updated.likes };
          return {
            ...m,
            replies: m.replies.map((r) =>
              r.id === msgId ? { ...r, likes: updated.likes } : r
            ),
          };
        })
      );
    } catch {
      // ignore
    }
  }

  function toggleReplies(msgId: number) {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }

  function startReply(msg: MessageItem) {
    setReplyTo(msg);
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function cancelReply() {
    setReplyTo(null);
    setInputValue("");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-12">
      {/* 页头 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5 md:mb-10"
      >
        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
          <Newspaper className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
            杂谈
          </h1>
        </div>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 ml-7 md:ml-10">
          登录 GitHub，留下你的足迹
        </p>
      </motion.div>

      {/* 登录/用户信息 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4 md:mb-8"
      >
        {user ? (
          <div className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-3 rounded-2xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-white/10">
            <Image
              src={user.avatar}
              alt={user.login}
              width={32}
              height={32}
              className="rounded-full md:w-9 md:h-9"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user.login}
              </span>
              {user.bio && (
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.bio}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-slate-400 hover:text-red-500 transition-colors px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5" />
              退出
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-3 rounded-2xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-600 transition-all group w-full"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center">
              <GithubIcon className="w-4 h-4 md:w-5 md:h-5 text-white dark:text-slate-900" />
            </div>
            <div className="text-left">
              <div className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                登录 GitHub
              </div>
              <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                登录后即可留言和回复
              </div>
            </div>
          </button>
        )}
      </motion.div>


      {/* 输入框 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-5 md:mb-10"
      >
        <div className="rounded-2xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-white/10 overflow-hidden">
          {/* 回复提示 */}
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-1.5 md:gap-2 px-3 pt-2 md:px-5 md:pt-3 pb-0 text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                  <Reply className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span>
                    回复{" "}
                    <span className="font-medium text-sky-600 dark:text-sky-400">
                      {replyTo.github_user?.login ?? "匿名"}
                    </span>
                  </span>
                  <span className="truncate flex-1 opacity-60">
                    {replyTo.content.slice(0, 50)}
                  </span>
                  <button
                    type="button"
                    onClick={cancelReply}
                    className="text-slate-400 hover:text-red-500 transition-colors ml-1 md:ml-2"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-3 md:p-4">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                user
                  ? replyTo
                    ? "写下你的回复..."
                    : "说点什么吧..."
                  : "登录后即可留言..."
              }
              disabled={!user}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
              className="w-full bg-transparent text-xs md:text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex items-center justify-between mt-2 pt-2 md:mt-3 md:pt-3 border-t border-slate-200/50 dark:border-white/5">
              <span className="text-[10px] md:text-xs text-slate-400">
                {user ? "Ctrl + Enter 发送" : ""}
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!user || !inputValue.trim() || submitting}
                className="flex items-center gap-1 md:gap-1.5 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-sky-500 text-white text-[10px] md:text-xs font-medium hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-3 h-3 md:w-3.5 md:h-3.5" />
                {submitting ? "发送中..." : replyTo ? "回复" : "发送"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 空状态 */}
      {!loading && messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 md:py-20 text-slate-400"
        >
          <Newspaper className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-40" />
          <p className="text-sm md:text-base">还没有留言，来抢沙发吧~</p>
        </motion.div>
      )}

      {/* 留言列表 */}
      <div className="space-y-3 md:space-y-5">
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
          >
            <MessageCard
              msg={msg}
              likedIds={likedIds}
              expandedReplies={expandedReplies}
              onLike={handleLike}
              onReply={startReply}
              onToggleReplies={toggleReplies}
              user={user}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MessageCard({
  msg,
  likedIds,
  expandedReplies,
  onLike,
  onReply,
  onToggleReplies,
  user,
}: {
  msg: MessageItem;
  likedIds: Set<number>;
  expandedReplies: Set<number>;
  onLike: (id: number) => void;
  onReply: (msg: MessageItem) => void;
  onToggleReplies: (id: number) => void;
  user: GitHubUser | null;
}) {
  const isExpanded = expandedReplies.has(msg.id);
  const replyCount = msg.replies?.length ?? 0;

  return (
    <div className="rounded-2xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-3 md:p-5">
        {/* 用户信息 */}
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
          {msg.github_user ? (
            <Image
              src={msg.github_user.avatar}
              alt={msg.github_user.login}
              width={32}
              height={32}
              className="rounded-full md:w-9 md:h-9"
            />
          ) : (
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white text-xs md:text-sm font-bold">
              ?
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {msg.github_user?.login ?? "匿名用户"}
            </span>
            {msg.github_user?.bio && (
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 truncate">
                {msg.github_user.bio}
              </p>
            )}
          </div>
          <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 shrink-0">
            {relativeTime(msg.created_at)}
          </span>
        </div>

        {/* 内容 */}
        <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-3 md:mb-4">
          {msg.content}
        </p>

        {/* 操作栏 */}
        <div className="flex items-center gap-2 md:gap-4 pt-2 md:pt-3 border-t border-slate-200/50 dark:border-white/5">
          <button
            type="button"
            onClick={() => onLike(msg.id)}
            className={`flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs transition-colors ${
              likedIds.has(msg.id)
                ? "text-pink-500"
                : "text-slate-400 hover:text-pink-500"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-all duration-300 ${
                likedIds.has(msg.id) ? "fill-pink-500 scale-110" : ""
              }`}
            />
            <span>{msg.likes}</span>
          </button>

          <button
            type="button"
            onClick={() => onReply(msg)}
            className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-slate-400 hover:text-sky-500 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>回复</span>
          </button>

          {replyCount > 0 && (
            <button
              type="button"
              onClick={() => onToggleReplies(msg.id)}
              className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-slate-400 hover:text-blue-500 transition-colors ml-auto"
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 md:w-3.5 md:h-3.5" />
              ) : (
                <ChevronDown className="w-3 h-3 md:w-3.5 md:h-3.5" />
              )}
              <span>
                {replyCount} 条回复
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 回复列表 */}
      <AnimatePresence>
        {isExpanded && replyCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
              {msg.replies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  likedIds={likedIds}
                  onLike={onLike}
                  onReply={onReply}
                  user={user}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReplyCard({
  reply,
  likedIds,
  onLike,
  onReply,
  user,
}: {
  reply: MessageItem;
  likedIds: Set<number>;
  onLike: (id: number) => void;
  onReply: (msg: MessageItem) => void;
  user: GitHubUser | null;
}) {
  return (
    <div className="px-3 py-2 md:px-5 md:py-3 border-b border-slate-200/30 dark:border-white/5 last:border-0">
      <div className="flex items-start gap-2 md:gap-3">
        {reply.github_user ? (
          <Image
            src={reply.github_user.avatar}
            alt={reply.github_user.login}
            width={24}
            height={24}
            className="rounded-full mt-0.5 md:w-7 md:h-7"
          />
        ) : (
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-white text-[10px] md:text-xs font-bold mt-0.5">
            ?
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
            <span className="text-[10px] md:text-xs font-semibold text-slate-700 dark:text-slate-300">
              {reply.github_user?.login ?? "匿名用户"}
            </span>
            <span className="text-[10px] md:text-xs text-slate-400">
              {relativeTime(reply.created_at)}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
            {reply.content}
          </p>
          <div className="flex items-center gap-2 md:gap-3 mt-1.5 md:mt-2">
            <button
              type="button"
              onClick={() => onLike(reply.id)}
              className={`flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs transition-colors ${
                likedIds.has(reply.id)
                  ? "text-pink-500"
                  : "text-slate-400 hover:text-pink-500"
              }`}
            >
              <Heart
                className={`w-3 h-3 md:w-3.5 md:h-3.5 ${
                  likedIds.has(reply.id) ? "fill-pink-500" : ""
                }`}
              />
              <span>{reply.likes}</span>
            </button>
            {user && (
              <button
                type="button"
                onClick={() => onReply(reply)}
                className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-slate-400 hover:text-sky-500 transition-colors"
              >
                <Reply className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span>回复</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
