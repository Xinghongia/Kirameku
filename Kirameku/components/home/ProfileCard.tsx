"use client";

import { useState, useEffect } from "react";
import { getPostsCount, getAlbums, getChattersCount } from "@/app/api";
import { siteConfig } from "@/siteConfig";

export default function ProfileCard() {
  const [postCount, setPostCount] = useState(0);
  const [chatterCount, setChatterCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

  useEffect(() => {
    getPostsCount("published")
      .then((data) => setPostCount(data.count ?? 0))
      .catch(() => {});

    getChattersCount("published")
      .then((data) => setChatterCount(data.count ?? 0))
      .catch(() => {});

    getAlbums()
      .then((albums) => {
        setPhotoCount(albums.reduce((acc, a) => acc + (a.photo_count ?? 0), 0));
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 md:p-8 flex flex-col justify-between transition-all duration-700 group relative overflow-hidden w-full h-full min-h-[200px] md:min-h-[280px]"
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-purple-400 p-[3px] shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-110 hover:rotate-6 cursor-pointer">
              <img
                src={siteConfig.avatarUrl}
                alt="avatar"
                className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-800"
              />
            </div>
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2 tracking-wider transition-colors duration-700">
              {siteConfig.authorName}
            </h1>
            <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-md transition-colors duration-700">
              {siteConfig.bio}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-end md:items-center justify-between mt-4 md:mt-8 gap-4 md:gap-6 relative z-10">
        <div className="flex gap-6 w-full md:w-auto justify-around md:justify-start">
          <StatItem
            count={postCount}
            label="文章"
            color="text-indigo-600 dark:text-indigo-400"
          />
          <div className="w-px h-10 bg-slate-300/50 dark:bg-slate-700 hidden md:block" />
          <StatItem
            count={chatterCount}
            label="说说"
            color="text-purple-600 dark:text-purple-400"
          />
          <div className="w-px h-10 bg-slate-300/50 dark:bg-slate-700 hidden md:block" />
          <StatItem
            count={photoCount}
            label="照片"
            color="text-pink-600 dark:text-pink-400"
          />
        </div>

        <div className="flex gap-3 flex-wrap justify-end">
          {siteConfig.social?.github && (
            <SocialBtn type="github" url={siteConfig.social.github} />
          )}
          {siteConfig.social?.gitee && (
            <SocialBtn type="gitee" url={siteConfig.social.gitee} />
          )}
          {siteConfig.social?.email && (
            <SocialBtn type="email" url={`mailto:${siteConfig.social.email}`} />
          )}
          {siteConfig.social?.qq && (
            <SocialBtn type="qq" url={`tencent://message/?uin=${siteConfig.social.qq}`} />
          )}
          {siteConfig.social?.wechat && (
            <SocialBtn type="wechat" />
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: string;
}) {
  return (
    <div className="text-center group/stat">
      <div
        className={`text-xl md:text-2xl font-black ${color} transition-transform group-hover/stat:scale-110`}
      >
        {count}
      </div>
      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

function SocialBtn({
  type,
  url,
}: {
  type: string;
  url?: string;
}) {
  const getIcon = () => {
    switch (type) {
      case "github":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        );
      case "gitee":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482c0-.326.266-.592.592-.592h6.81c.328 0 .593.266.593.592v3.408a4.74 4.74 0 0 1-4.741 4.74H7.11A4.74 4.74 0 0 1 2.37 14.81V9.186a4.74 4.74 0 0 1 4.74-4.741h10.963v.888z" />
          </svg>
        );
      case "email":
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "qq":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2c-4.418 0-8 3.582-8 8 0 1.25.289 2.433.805 3.49-1.024 1.708-1.53 3.843-1.021 5.308.203.585.806.84 1.341.57.828-.418 1.625-1.025 2.296-1.722 1.335.539 2.862.854 4.579.854 1.716 0 3.243-.315 4.578-.854.671.697 1.468 1.304 2.296 1.722.535.27 1.138.015 1.341-.57.509-1.465.003-3.6-1.021-5.308C19.71 12.433 20 11.25 20 10c0-4.418-3.582-8-8-8zm-2.5 8c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2zm5 0c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2z" />
          </svg>
        );
      case "wechat":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.5 13.5c-3.59 0-6.5-2.42-6.5-5.4 0-2.98 2.91-5.4 6.5-5.4s6.5 2.42 6.5 5.4c0 2.98-2.91 5.4-6.5 5.4zm7.5 7.8c-2.76 0-5-2.02-5-4.5 0-2.48 2.24-4.5 5-4.5s5 2.02 5 4.5c0 2.48-2.24 4.5-5 4.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const content = (
    <div
      className="w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:scale-125 hover:-translate-y-1 transition-all duration-300 border border-white/40 dark:border-white/10 shadow-sm"
      title={type}
    >
      {getIcon()}
    </div>
  );

  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    content
  );
}
