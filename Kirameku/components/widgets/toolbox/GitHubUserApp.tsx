"use client";

import { useState } from "react";

interface Org {
  login: string;
  description: string;
  html_url: string;
  avatar_url: string;
}

interface Repo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers: number;
  forks: number;
  fork: boolean;
  archived: boolean;
}

interface ContributionDay {
  date: string;
  contribution_count: number;
  color: string;
  weekday: number;
}

interface Week {
  first_day: string;
  contribution_days: ContributionDay[];
}

interface Timeline {
  month: string;
  contribution_count: number;
}

interface Activity {
  scope: string;
  from: string;
  to: string;
  total_contributions: number;
  total_commit_contributions: number;
  total_issue_contributions: number;
  total_pull_request_contributions: number;
  total_pull_request_review_contributions: number;
  contribution_calendar: { weeks: Week[]; total_contributions: number };
  timeline: Timeline[];
}

interface UserResult {
  login: string;
  name: string;
  bio: string;
  company: string;
  location: string;
  blog: string;
  twitter_username: string;
  email: string;
  html_url: string;
  avatar_url: string;
  type: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  organizations?: Org[];
  pinned_repositories?: Repo[];
  repositories?: Repo[];
  activity?: Activity;
}

function fmtNum(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + "w";
  return n.toLocaleString();
}

export default function GitHubUserApp() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<UserResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    const user = query.trim();
    if (!user) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = new URLSearchParams({
        path: "github/user",
        user,
        activity: "true",
        pinned: "true",
        repos: "true",
        repos_limit: "6",
      });
      const res = await fetch(`/api/uapis?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "查询失败");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }

  const weekdays = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="flex flex-col h-full gap-3">
      {/* 搜索 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="GitHub 用户名"
          className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none border border-transparent focus:border-sky-500 transition-colors"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
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
          {/* 用户头像 + 基本信息 */}
          <div className="rounded-xl bg-gradient-to-br from-slate-500/10 to-slate-500/5 dark:from-slate-500/20 dark:to-slate-500/10 border border-slate-200/50 dark:border-white/5 p-3">
            <div className="flex items-center gap-3">
              <img src={result.avatar_url} alt={result.login} className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <a href={result.html_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-sky-500 transition-colors truncate">
                    {result.name || result.login}
                  </a>
                  <span className="text-[10px] text-slate-400">@{result.login}</span>
                </div>
                {result.bio && <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{result.bio}</p>}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {result.company && <span className="text-[9px] text-slate-400">{result.company}</span>}
                  {result.location && <span className="text-[9px] text-slate-400">{result.location}</span>}
                </div>
              </div>
            </div>
            {/* 统计 */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: "Repos", v: result.public_repos },
                { label: "Followers", v: result.followers },
                { label: "Following", v: result.following },
                { label: "Gists", v: result.public_gists },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{fmtNum(s.v)}</p>
                  <p className="text-[9px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 组织 */}
          {result.organizations && result.organizations.length > 0 && (
            <div className="rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 p-3">
              <p className="text-[10px] font-bold text-slate-500 mb-2">所属组织</p>
              <div className="flex flex-wrap gap-2">
                {result.organizations.map((org) => (
                  <a key={org.login} href={org.html_url} target="_blank" rel="noopener noreferrer" title={org.description || org.login}>
                    <img src={org.avatar_url} alt={org.login} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 hover:ring-2 hover:ring-sky-500/40 transition-all" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 贡献日历 */}
          {result.activity?.contribution_calendar && (
            <div className="rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-500">贡献日历</p>
                <p className="text-[9px] text-slate-400">
                  近一年 {result.activity.contribution_calendar.total_contributions} 次贡献
                </p>
              </div>
              <div className="overflow-x-auto">
                <div className="inline-flex gap-px">
                  {/* 星期标签 */}
                  <div className="flex flex-col gap-px mr-0.5">
                    {weekdays.map((d, i) => (
                      <div key={i} className="h-[10px] flex items-center">
                        <span className="text-[8px] text-slate-400 leading-none">{d}</span>
                      </div>
                    ))}
                  </div>
                  {/* 格子 */}
                  {result.activity.contribution_calendar.weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-px">
                      {Array.from({ length: 7 }, (_, di) => {
                        const day = week.contribution_days.find((d) => d.weekday === di);
                        return (
                          <div
                            key={di}
                            className="w-[10px] h-[10px] rounded-[2px]"
                            style={{ backgroundColor: day ? day.color : "transparent" }}
                            title={day ? `${day.date}: ${day.contribution_count} 次贡献` : ""}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              {/* 贡献统计 */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                <span className="text-[9px] text-slate-400">Commit {result.activity.total_commit_contributions}</span>
                <span className="text-[9px] text-slate-400">Issue {result.activity.total_issue_contributions}</span>
                <span className="text-[9px] text-slate-400">PR {result.activity.total_pull_request_contributions}</span>
                <span className="text-[9px] text-slate-400">Review {result.activity.total_pull_request_review_contributions}</span>
              </div>
              {/* 月度时间线 */}
              {result.activity.timeline.length > 0 && (
                <div className="flex gap-1 mt-2 overflow-x-auto">
                  {result.activity.timeline.slice(-12).map((t) => (
                    <div key={t.month} className="flex flex-col items-center gap-0.5 min-w-0">
                      <div className="w-full h-8 flex items-end justify-center">
                        <div
                          className="w-3 bg-sky-400/60 rounded-t-sm"
                          style={{ height: `${Math.max(4, Math.min(32, t.contribution_count * 8))}px` }}
                        />
                      </div>
                      <span className="text-[7px] text-slate-400 tabular-nums">{t.month.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pinned Repos */}
          {result.pinned_repositories && result.pinned_repositories.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 mb-1.5">Pinned</p>
              <div className="space-y-1.5">
                {result.pinned_repositories.map((repo) => (
                  <a
                    key={repo.full_name}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 p-2.5 hover:border-sky-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{repo.name}</span>
                      {repo.archived && <span className="text-[8px] px-1 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">归档</span>}
                    </div>
                    {repo.description && <p className="text-[9px] text-slate-400 line-clamp-1">{repo.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {repo.language && <span className="text-[9px] text-slate-500">{repo.language}</span>}
                      <span className="text-[9px] text-slate-400">★ {fmtNum(repo.stargazers)}</span>
                      <span className="text-[9px] text-slate-400">⑂ {fmtNum(repo.forks)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recent Repos */}
          {result.repositories && result.repositories.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 mb-1.5">最近活跃</p>
              <div className="space-y-1.5">
                {result.repositories.map((repo) => (
                  <a
                    key={repo.full_name}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 p-2.5 hover:border-sky-500/40 transition-colors"
                  >
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{repo.name}</span>
                    {repo.description && <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">{repo.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {repo.language && <span className="text-[9px] text-slate-500">{repo.language}</span>}
                      <span className="text-[9px] text-slate-400">★ {fmtNum(repo.stargazers)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 初始提示 */}
      {!result && !loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[10px] text-slate-400 text-center">输入 GitHub 用户名查看开发者画像和贡献日历</p>
        </div>
      )}
    </div>
  );
}
