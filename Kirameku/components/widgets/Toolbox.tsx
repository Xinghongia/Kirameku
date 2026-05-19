"use client";

import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const CalendarApp = lazy(() => import("./toolbox/CalendarApp"));
const CalculatorApp = lazy(() => import("./toolbox/CalculatorApp"));
const ClockApp = lazy(() => import("./toolbox/ClockApp"));
const DiceApp = lazy(() => import("./toolbox/DiceApp"));
const FortuneDrawApp = lazy(() => import("./toolbox/FortuneDrawApp"));
const HitokotoApp = lazy(() => import("./toolbox/HitokotoApp"));
const PasswordGeneratorApp = lazy(() => import("./toolbox/PasswordGeneratorApp"));
const QRCodeApp = lazy(() => import("./toolbox/QRCodeApp"));
const UnitConverterApp = lazy(() => import("./toolbox/UnitConverterApp"));
const NoteApp = lazy(() => import("./toolbox/NoteApp"));
const BaseConverterApp = lazy(() => import("./toolbox/BaseConverterApp"));
const CoinFlipApp = lazy(() => import("./toolbox/CoinFlipApp"));
const RPSApp = lazy(() => import("./toolbox/RPSApp"));
const DujitangApp = lazy(() => import("./toolbox/DujitangApp"));
const HistoryApp = lazy(() => import("./toolbox/HistoryApp"));
const WeatherApp = lazy(() => import("./toolbox/WeatherApp"));
const RandomImageApp = lazy(() => import("./toolbox/RandomImageApp"));
const BmiApp = lazy(() => import("./toolbox/BmiApp"));
const BilibiliHotApp = lazy(() => import("./toolbox/BilibiliHotApp"));
const GoldPriceApp = lazy(() => import("./toolbox/GoldPriceApp"));
const JiakaoApp = lazy(() => import("./toolbox/JiakaoApp"));
const HoroscopeApp = lazy(() => import("./toolbox/HoroscopeApp"));
const GenshinApp = lazy(() => import("./toolbox/GenshinApp"));
const Random4kApp = lazy(() => import("./toolbox/Random4kApp"));
const GuanyinApp = lazy(() => import("./toolbox/GuanyinApp"));
const GamesApp = lazy(() => import("./toolbox/GamesApp"));
const WorldTimeApp = lazy(() => import("./toolbox/WorldTimeApp"));
const HotBoardApp = lazy(() => import("./toolbox/HotBoardApp"));
const PhoneInfoApp = lazy(() => import("./toolbox/PhoneInfoApp"));
const ProgrammerHistoryApp = lazy(() => import("./toolbox/ProgrammerHistoryApp"));
const TrackingApp = lazy(() => import("./toolbox/TrackingApp"));
const MovieBoxOfficeApp = lazy(() => import("./toolbox/MovieBoxOfficeApp"));
const GitHubRepoApp = lazy(() => import("./toolbox/GitHubRepoApp"));
const GitHubUserApp = lazy(() => import("./toolbox/GitHubUserApp"));
const SearchApp = lazy(() => import("./toolbox/SearchApp"));

interface AppDef {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.LazyExoticComponent<React.ComponentType>;
}

const allApps: AppDef[] = [
  // ── 热门资讯 ──
  {
    id: "search",
    name: "智能搜索",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="#3b82f6" strokeWidth="1.5" />
        <path d="M16 16l4.5 4.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 11h6M11 8v6" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
    component: SearchApp,
  },
  {
    id: "hotboard",
    name: "全网热榜",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 14h8M9 11h6" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    component: HotBoardApp,
  },
  {
    id: "bilibilihot",
    name: "B站热榜",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M4 7h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" stroke="#00a1d6" strokeWidth="1.5" />
        <path d="M8 4l4 3 4-3" stroke="#00a1d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 13l2 2 4-4" stroke="#00a1d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    component: BilibiliHotApp,
  },
  {
    id: "games",
    name: "小游戏",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="12" rx="3" stroke="#6366f1" strokeWidth="1.5" />
        <circle cx="8" cy="12" r="1.5" fill="#6366f1" />
        <path d="M14 11h2M15 10v2" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="18" cy="10" r="0.5" fill="#6366f1" />
        <circle cx="18" cy="14" r="0.5" fill="#6366f1" />
      </svg>
    ),
    component: GamesApp,
  },
  {
    id: "weather",
    name: "天气",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#0ea5e9" strokeWidth="1.5" />
        <path d="M12 1v2M12 13v2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M1 8h2M19 8h2M4.22 11.78l1.42-1.42M16.36 5.64l1.42-1.42" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 19a4 4 0 014-4h0a3 3 0 013-3 3 3 0 013 3h0a4 4 0 010 8H6z" stroke="#0ea5e9" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    component: WeatherApp,
  },
  {
    id: "goldprice",
    name: "今日金价",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#f59e0b">Au</text>
      </svg>
    ),
    component: GoldPriceApp,
  },
  {
    id: "movieboxoffice",
    name: "实时票房",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M7 4v16M17 4v16M2 10h20M2 16h20" stroke="#f59e0b" strokeWidth="1" opacity="0.3" />
        <path d="M10 8l2 3 2-3" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    component: MovieBoxOfficeApp,
  },
  {
    id: "githubuser",
    name: "GitHub用户",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#3b82f6" strokeWidth="1.5" />
        <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    component: GitHubUserApp,
  },
  {
    id: "githubrepo",
    name: "GitHub仓库",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    component: GitHubRepoApp,
  },
  {
    id: "programmer-history",
    name: "程序员历史",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="#8b5cf6" strokeWidth="1.5" />
        <path d="M7 12l2-2-2-2M11 8h4M17 12l-2 2 2 2M13 16h-4" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    component: ProgrammerHistoryApp,
  },
  {
    id: "history",
    name: "历史今天",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#6366f1" strokeWidth="1.5" />
        <polyline points="12 6 12 12 16 14" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="1" fill="#6366f1" />
      </svg>
    ),
    component: HistoryApp,
  },

  // ── 趣味测试 ──
  {
    id: "horoscope",
    name: "星座运势",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#8b5cf6" strokeWidth="1.5" />
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" stroke="#8b5cf6" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2" fill="#8b5cf6" opacity="0.3" />
      </svg>
    ),
    component: HoroscopeApp,
  },
  {
    id: "guanyin",
    name: "观音灵签",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#8b5cf6" strokeWidth="1.5" />
        <path d="M8 14c0 0 1.5 2 4 2s4-2 4-2" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="10" r="1" fill="#8b5cf6" />
        <circle cx="15" cy="10" r="1" fill="#8b5cf6" />
        <path d="M12 2v4" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    component: GuanyinApp,
  },
  {
    id: "bmi",
    name: "BMI",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#10b981" strokeWidth="1.5" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 6v4M10 8h4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 18l2-4M17 18l-2-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    component: BmiApp,
  },
  {
    id: "jiakao",
    name: "驾考题库",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6366f1" strokeWidth="1.5" />
        <path d="M7 12h2M15 12h2M12 9v6" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="19" r="1.5" stroke="#6366f1" strokeWidth="1.5" />
        <circle cx="16" cy="19" r="1.5" stroke="#6366f1" strokeWidth="1.5" />
      </svg>
    ),
    component: JiakaoApp,
  },

  // ── 图片壁纸 ──
  {
    id: "randomimage",
    name: "随机图片",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="#10b981" strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="2" stroke="#10b981" strokeWidth="1.5" />
        <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    component: RandomImageApp,
  },
  {
    id: "genshin",
    name: "原神图片",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#eab308" strokeWidth="1.5" />
        <path d="M12 7l2.5 5H9.5L12 7z" stroke="#eab308" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 12v5" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1" fill="#eab308" />
      </svg>
    ),
    component: GenshinApp,
  },
  {
    id: "random4k",
    name: "4K图片",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="#0ea5e9" strokeWidth="1.5" />
        <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0ea5e9">4K</text>
      </svg>
    ),
    component: Random4kApp,
  },
  {
    id: "fortune",
    name: "抽签",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M9 3L7 21M17 3l-2 18M5 7h14M4 12h16M5 17h14" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="8" y="1" width="8" height="4" rx="2" stroke="#eab308" strokeWidth="1.5" />
      </svg>
    ),
    component: FortuneDrawApp,
  },

  // ── 娱乐互动 ──
  {
    id: "hitokoto",
    name: "一言",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    component: HitokotoApp,
  },
  {
    id: "dujitang",
    name: "毒鸡汤",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C7 3 3 7 3 12c0 3 1.5 5.5 4 7l-1 2h12l-1-2c2.5-1.5 4-4 4-7 0-5-4-9-9-9z" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14s1 1.5 3 1.5 3-1.5 3-1.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9.5" cy="10" r="1" fill="#f59e0b" />
        <circle cx="14.5" cy="10" r="1" fill="#f59e0b" />
        <path d="M15 3.5c1 .5 2 1.5 2 2.5" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    component: DujitangApp,
  },
  {
    id: "dice",
    name: "骰子",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="#f97316" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="1.5" fill="#f97316" />
        <circle cx="16" cy="8" r="1.5" fill="#f97316" />
        <circle cx="12" cy="12" r="1.5" fill="#f97316" />
        <circle cx="8" cy="16" r="1.5" fill="#f97316" />
        <circle cx="16" cy="16" r="1.5" fill="#f97316" />
      </svg>
    ),
    component: DiceApp,
  },
  {
    id: "coin",
    name: "硬币",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="6" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#f59e0b">$</text>
      </svg>
    ),
    component: CoinFlipApp,
  },
  {
    id: "rps",
    name: "猜拳",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M18 11V6a2 2 0 00-4 0v1" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 10V4a2 2 0 00-4 0v6" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 10.5V8a2 2 0 00-4 0v8a8 8 0 0016 0v-5a2 2 0 00-4 0" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    component: RPSApp,
  },

  // ── 实用工具 ──
  {
    id: "qrcode",
    name: "二维码",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="#8b5cf6" strokeWidth="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="#8b5cf6" strokeWidth="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="#8b5cf6" strokeWidth="1.5" />
        <rect x="5" y="5" width="3" height="3" rx="0.5" fill="#8b5cf6" />
        <rect x="16" y="5" width="3" height="3" rx="0.5" fill="#8b5cf6" />
        <rect x="5" y="16" width="3" height="3" rx="0.5" fill="#8b5cf6" />
        <rect x="14" y="14" width="3" height="3" rx="0.5" fill="#8b5cf6" />
        <rect x="18" y="14" width="3" height="3" rx="0.5" fill="#8b5cf6" />
        <rect x="14" y="18" width="3" height="3" rx="0.5" fill="#8b5cf6" />
        <rect x="18" y="18" width="3" height="3" rx="0.5" fill="#8b5cf6" />
      </svg>
    ),
    component: QRCodeApp,
  },
  {
    id: "password",
    name: "密码",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="#10b981" strokeWidth="1.5" />
        <path d="M8 11V7a4 4 0 118 0v4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.5" fill="#10b981" />
        <path d="M12 17.5V19" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    component: PasswordGeneratorApp,
  },
  {
    id: "note",
    name: "记事本",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="3" width="14" height="18" rx="2" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M9 7h6M9 11h6M9 15h4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 7h2v2H5z" fill="#fbbf24" opacity="0.3" />
      </svg>
    ),
    component: NoteApp,
  },
  {
    id: "converter",
    name: "换算",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M17 4v16M7 20V4" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M21 8l-4-4-4 4M3 16l4 4 4-4" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 4h8M13 20h8" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    component: UnitConverterApp,
  },
  {
    id: "base",
    name: "进制",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    component: BaseConverterApp,
  },
  {
    id: "calculator",
    name: "计算器",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="#f59e0b" strokeWidth="1.5" />
        <rect x="7" y="5" width="10" height="4" rx="1" fill="#fbbf24" opacity="0.3" />
        <circle cx="8" cy="13" r="1" fill="#f59e0b" />
        <circle cx="12" cy="13" r="1" fill="#f59e0b" />
        <circle cx="16" cy="13" r="1" fill="#f59e0b" />
        <circle cx="8" cy="17" r="1" fill="#f59e0b" />
        <circle cx="12" cy="17" r="1" fill="#f59e0b" />
        <circle cx="16" cy="17" r="1" fill="#f59e0b" />
      </svg>
    ),
    component: CalculatorApp,
  },
  {
    id: "calendar",
    name: "日历",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6366f1" strokeWidth="1.5" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="15" r="1" fill="#6366f1" />
        <circle cx="12" cy="15" r="1" fill="#a78bfa" />
        <circle cx="16" cy="15" r="1" fill="#6366f1" />
      </svg>
    ),
    component: CalendarApp,
  },
  {
    id: "tracking",
    name: "快递查询",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="13" rx="2" stroke="#0ea5e9" strokeWidth="1.5" />
        <path d="M16 7V5a4 4 0 00-8 0v2" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 11v4M10 13h4" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    component: TrackingApp,
  },
  {
    id: "phoneinfo",
    name: "手机归属地",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke="#10b981" strokeWidth="1.5" />
        <circle cx="12" cy="18" r="1" fill="#10b981" />
        <path d="M9 6h6" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    component: PhoneInfoApp,
  },
  {
    id: "worldtime",
    name: "世界时间",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#0ea5e9" strokeWidth="1.5" />
        <path d="M12 3c-3 4-3 8 0 9s3 5 0 9" stroke="#0ea5e9" strokeWidth="1.5" />
        <path d="M3 12h18" stroke="#0ea5e9" strokeWidth="1.5" />
        <path d="M4.5 7.5h15M4.5 16.5h15" stroke="#0ea5e9" strokeWidth="1" opacity="0.4" />
      </svg>
    ),
    component: WorldTimeApp,
  },
  {
    id: "clock",
    name: "时钟",
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#8b5cf6" strokeWidth="1.5" />
        <path d="M12 7v5l3 3" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1" fill="#8b5cf6" />
      </svg>
    ),
    component: ClockApp,
  },
];

const STORAGE_KEY = "toolbox-order";
const APP_KEY = "toolbox-active-app";

function loadOrder(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const ids = JSON.parse(saved);
      if (Array.isArray(ids)) {
        const allIds = allApps.map((a) => a.id);
        const valid = ids.filter((id: string) => allIds.includes(id));
        const missing = allIds.filter((id) => !valid.includes(id));
        return [...valid, ...missing];
      }
    }
  } catch { }
  return allApps.map((a) => a.id);
}

function SortableAppIcon({
  app,
  onClick,
}: {
  app: AppDef;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className=""
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95 w-full"
      >
        {app.icon}
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{app.name}</span>
      </button>
    </div>
  );
}

type ResizeDir = "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

function ResizeHandle({
  dir,
  onResize,
}: {
  dir: ResizeDir;
  onResize: (dw: number, dh: number) => void;
}) {
  const prevPos = useRef({ x: 0, y: 0 });

  const cursorMap: Record<ResizeDir, string> = {
    top: "cursor-ns-resize",
    bottom: "cursor-ns-resize",
    left: "cursor-ew-resize",
    right: "cursor-ew-resize",
    "top-left": "cursor-nwse-resize",
    "bottom-right": "cursor-nwse-resize",
    "top-right": "cursor-nesw-resize",
    "bottom-left": "cursor-nesw-resize",
  };

  const posMap: Record<ResizeDir, string> = {
    top: "top-0 left-2 right-2 h-2",
    bottom: "bottom-2 left-2 right-2 h-2",
    left: "top-2 bottom-2 left-0 w-2",
    right: "top-2 bottom-2 right-0 w-2",
    "top-left": "top-0 left-0 w-5 h-5",
    "top-right": "top-0 right-0 w-5 h-5",
    "bottom-left": "bottom-2 left-0 w-5 h-5",
    "bottom-right": "bottom-2 right-0 w-5 h-5",
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={false}
      dragSnapToOrigin
      onDragStart={(_e, info) => {
        prevPos.current = { x: info.point.x, y: info.point.y };
      }}
      onDrag={(_e, info) => {
        const dx = info.point.x - prevPos.current.x;
        const dy = info.point.y - prevPos.current.y;
        prevPos.current = { x: info.point.x, y: info.point.y };
        let dw = 0, dh = 0;
        if (dir.includes("right")) dw = dx;
        if (dir.includes("left")) dw = -dx;
        if (dir.includes("bottom")) dh = dy;
        if (dir.includes("top")) dh = -dy;
        onResize(dw, dh);
      }}
      className={`absolute z-40 ${posMap[dir]} ${cursorMap[dir]}`}
    />
  );
}

export default function Toolbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [appOrder, setAppOrder] = useState<string[]>([]);
  const btnRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const didDrag = useRef(false);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [btnRect, setBtnRect] = useState<{ left: number; top: number } | null>(null);
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 });
  const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 });
  const [panelW, setPanelW] = useState(288);
  const [panelH, setPanelH] = useState(560);
  const panelDidDrag = useRef(false);
  const panelDragControls = useDragControls();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    if (!initialized.current) {
      setAppOrder(loadOrder());
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (activeApp === "games") {
      localStorage.removeItem(APP_KEY);
    } else if (activeApp) {
      localStorage.setItem(APP_KEY, activeApp);
    }
  }, [activeApp]);

  // Update btnRect on open, drag, resize
  const updateBtnRect = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setBtnRect({ left: r.left, top: r.top });
    setFlipX(r.left + panelW > window.innerWidth);
    setFlipY(r.top - 64 - panelH < 0);
  }, [panelW, panelH]);

  useEffect(() => {
    if (isOpen) updateBtnRect();
  }, [isOpen, updateBtnRect]);

  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => updateBtnRect();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen, updateBtnRect]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveApp(null);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleClose = () => { setIsOpen(false); setActiveApp(null); };
    window.addEventListener("close-toolbox", handleClose);
    return () => window.removeEventListener("close-toolbox", handleClose);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAppOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
        return newOrder;
      });
    }
  }, []);

  const orderedApps = appOrder.length
    ? appOrder.map((id) => allApps.find((a) => a.id === id)).filter(Boolean) as AppDef[]
    : allApps;

  const currentApp = allApps.find((a) => a.id === activeApp);

  const panelStyle: React.CSSProperties = btnRect
    ? isMobile
      ? { position: "fixed", left: "8%", right: "8%", top: "10%", bottom: "10%" }
      : flipX
        ? { position: "fixed", right: window.innerWidth - btnRect.left - 48 - resizeOffset.x, ...(flipY ? { top: btnRect.top + 48 + 8 + resizeOffset.y } : { bottom: window.innerHeight - btnRect.top + 16 - resizeOffset.y }) }
        : { position: "fixed", left: btnRect.left + resizeOffset.x, ...(flipY ? { top: btnRect.top + 48 + 8 + resizeOffset.y } : { bottom: window.innerHeight - btnRect.top + 16 - resizeOffset.y }) }
    : {};

  return (
    <>
      {/* Panel */}
      <AnimatePresence>
        {isOpen && btnRect && (
          <motion.div
            drag={!isMobile}
            dragControls={panelDragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={false}
            onDragStart={() => { panelDidDrag.current = true; }}
            onDragEnd={(_e, info) => {
              setTimeout(() => { panelDidDrag.current = false; }, 100);
              setPanelOffset((prev) => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y }));
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ ...panelStyle, zIndex: 30, x: isMobile ? 0 : panelOffset.x, y: isMobile ? 0 : panelOffset.y, ...(isMobile ? {} : { width: panelW, height: panelH }) }}
            className="rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
            ref={panelRef}
          >
            {/* 顶部拖拽把手 */}
            <div
              onPointerDown={isMobile ? undefined : (e) => panelDragControls.start(e)}
              className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing"
            >
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {new Date().getHours().toString().padStart(2, "0")}:{new Date().getMinutes().toString().padStart(2, "0")}
              </span>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500" />
              </div>
            </div>

            {activeApp && currentApp ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setActiveApp(null); localStorage.removeItem(APP_KEY); }}
                    title="返回"
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{currentApp.name}</span>
                </div>
                <div className="p-4 flex-1 overflow-auto">
                  <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-slate-400 animate-pulse">加载中...</div>}>
                    <currentApp.component />
                  </Suspense>
                </div>
              </div>
            ) : (
              <div className="px-6 pt-5 pb-10 flex-1 overflow-y-auto overflow-x-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={orderedApps.map((a) => a.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 gap-5 md:gap-4">
                      {orderedApps.map((app) => (
                        <SortableAppIcon
                          key={app.id}
                          app={app}
                          onClick={() => setActiveApp(app.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* 底部指示条 */}
            <div className="flex justify-center py-2 shrink-0">
              <div className="w-24 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* 缩放把手 */}
            {!isMobile && (
              <>
                <ResizeHandle
                  dir="bottom-right"
                  onResize={(dw, dh) => {
                    setPanelW((w) => Math.min(Math.max(w + dw, 200), window.innerWidth - 32));
                    setPanelH((h) => Math.min(Math.max(h + dh, 300), window.innerHeight - 32));
                  }}
                />
                <ResizeHandle
                  dir="top-left"
                  onResize={(dw, dh) => {
                    const newW = Math.min(Math.max(panelW + dw, 200), window.innerWidth - 32);
                    const newH = Math.min(Math.max(panelH + dh, 300), window.innerHeight - 32);
                    const actualDw = newW - panelW;
                    const actualDh = newH - panelH;
                    setPanelW(newW);
                    setPanelH(newH);
                    setResizeOffset((p) => ({ x: p.x - actualDw, y: p.y - actualDh }));
                  }}
                />
                <ResizeHandle
                  dir="top-right"
                  onResize={(_dw, dh) => {
                    const newH = Math.min(Math.max(panelH + dh, 300), window.innerHeight - 32);
                    const actualDh = newH - panelH;
                    setPanelH(newH);
                    setResizeOffset((p) => ({ x: p.x, y: p.y - actualDh }));
                  }}
                />
                <ResizeHandle
                  dir="bottom-left"
                  onResize={(dw, _dh) => {
                    const newW = Math.min(Math.max(panelW + dw, 200), window.innerWidth - 32);
                    const actualDw = newW - panelW;
                    setPanelW(newW);
                    setResizeOffset((p) => ({ x: p.x - actualDw, y: p.y }));
                  }}
                />
              </>
            )}

            {/* 缩放角标 */}
            <div className="absolute bottom-1.5 right-1.5 pointer-events-none opacity-30">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M12 2L2 12M12 7L7 12M12 12L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-400 dark:text-slate-500" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮按钮 */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={false}
        onDragStart={() => { didDrag.current = true; }}
        onDrag={() => { if (isOpen) updateBtnRect(); }}
        onDragEnd={() => {
          setTimeout(() => { didDrag.current = false; }, 100);
          if (isOpen) updateBtnRect();
        }}
        className="fixed bottom-6 left-6 z-30"
        ref={btnRef}
      >
        <button
          type="button"
          onClick={() => {
            if (didDrag.current) return;
            if (isOpen) {
              setIsOpen(false);
              setActiveApp(null);
            } else {
              setPanelOffset({ x: 0, y: 0 });
              setResizeOffset({ x: 0, y: 0 });
              setPanelW(288);
              setPanelH(560);
              const saved = localStorage.getItem(APP_KEY);
              if (saved && saved !== "games") setActiveApp(saved);
              setIsOpen(true);
            }
          }}
          title="工具箱"
          className="w-12 h-12 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl flex items-center justify-center hover:shadow-2xl transition-all text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60 active:scale-95"
          style={{ touchAction: "none" }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
      </motion.div>
    </>
  );
}
