"use client";

import { useState } from "react";

interface RepoResult {
  full_name: string;
  description: string;
  homepage: string;
  default_branch: string;
  visibility: string;
  archived: boolean;
  language: string;
  topics: string[];
  license: string;
  stargazers: number;
  forks: number;
  open_issues: number;
  watchers: number;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  languages: Record<string, number>;
  latest_release: {
    tag_name: string;
    name: string;
    published_at: string;
    html_url: string;
    prerelease: boolean;
  } | null;
}

function fmtNum(n: number) {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + "亿";
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  return n.toLocaleString();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function GitHubRepoApp() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RepoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    const repo = query.trim();
    if (!repo || !repo.includes("/")) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/uapis?path=github/repo&repo=${encodeURIComponent(repo)}`);
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

  const langEntries = result?.languages
    ? Object.entries(result.languages).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];
  const totalBytes = langEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 输入 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="owner/repo，如 torvalds/linux"
          className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none border border-transparent focus:border-sky-500 transition-colors"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.includes("/")}
          className="px-3 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-40 transition-colors shrink-0"
        >
          {loading ? "..." : "查询"}
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
          {/* 头部 */}
          <a
            href={`https://github.com/${result.full_name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-gradient-to-br from-slate-500/10 to-slate-500/5 dark:from-slate-500/20 dark:to-slate-500/10 border border-slate-200/50 dark:border-white/5 p-3 hover:border-sky-500/40 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{result.full_name}</span>
              {result.archived && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">已归档</span>
              )}
            </div>
            {result.description && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{result.description}</p>
            )}
          </a>

          {/* 统计 */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Stars", value: result.stargazers, icon: "★" },
              { label: "Forks", value: result.forks, icon: "⑂" },
              { label: "Issues", value: result.open_issues, icon: "◉" },
              { label: "Watch", value: result.watchers, icon: "⊙" },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 py-2">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{fmtNum(s.value)}</p>
                <p className="text-[9px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* 语言占比 */}
          {langEntries.length > 0 && (
            <div className="rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 p-3">
              <p className="text-[10px] font-bold text-slate-500 mb-2">语言构成</p>
              {/* 进度条 */}
              <div className="flex h-2 rounded-full overflow-hidden mb-2">
                {langEntries.map(([lang, bytes], i) => {
                  const colors = ["bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-purple-500", "bg-pink-500"];
                  return (
                    <div
                      key={lang}
                      className={`${colors[i]} h-full`}
                      style={{ width: `${(bytes / totalBytes) * 100}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {langEntries.map(([lang, bytes], i) => {
                  const colors = ["text-sky-500", "text-amber-500", "text-emerald-500", "text-purple-500", "text-pink-500"];
                  return (
                    <span key={lang} className="flex items-center gap-1 text-[9px]">
                      <span className={`w-2 h-2 rounded-full ${colors[i].replace("text-", "bg-")}`} />
                      <span className="text-slate-600 dark:text-slate-400">{lang}</span>
                      <span className="text-slate-400">{((bytes / totalBytes) * 100).toFixed(1)}%</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 详情 */}
          <div className="rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 p-3 space-y-2">
            {result.language && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">主要语言</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{result.language}</span>
              </div>
            )}
            {result.license && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">开源协议</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{result.license}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">默认分支</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{result.default_branch}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">创建时间</span>
              <span className="text-slate-700 dark:text-slate-300 tabular-nums">{fmtDate(result.created_at)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">最近更新</span>
              <span className="text-slate-700 dark:text-slate-300 tabular-nums">{fmtDate(result.updated_at)}</span>
            </div>
          </div>

          {/* 最新 Release */}
          {result.latest_release && (
            <a
              href={result.latest_release.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-3 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                  Latest Release
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{result.latest_release.tag_name}</span>
                {result.latest_release.prerelease && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Pre</span>
                )}
              </div>
              {result.latest_release.name !== result.latest_release.tag_name && (
                <p className="text-[10px] text-slate-500">{result.latest_release.name}</p>
              )}
              <p className="text-[9px] text-slate-400 mt-0.5">{fmtDate(result.latest_release.published_at)}</p>
            </a>
          )}

          {/* Topics */}
          {result.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.topics.map((t) => (
                <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 初始提示 */}
      {!result && !loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[10px] text-slate-400 text-center">输入 GitHub 仓库名查询，格式如 owner/repo</p>
        </div>
      )}
    </div>
  );
}
