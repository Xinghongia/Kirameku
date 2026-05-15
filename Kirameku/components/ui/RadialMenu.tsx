"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  MessageSquare,
  Newspaper,
  FolderGit2,
  Users,
  Camera,
  Clock,
  Music,
  User,
  Library,
  Bookmark,
} from "lucide-react";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/posts", label: "文章", icon: BookOpen },
  { href: "/moments", label: "说说", icon: MessageSquare },
  { href: "/messages", label: "杂谈", icon: Newspaper },
  { href: "/novel", label: "小说", icon: Library },
  { href: "/bookmark", label: "收藏夹", icon: Bookmark },
  { href: "/projects", label: "项目", icon: FolderGit2 },
  { href: "/friends", label: "友链", icon: Users },
  { href: "/photowall", label: "照片墙", icon: Camera },
  { href: "/timeline", label: "归档", icon: Clock },
  { href: "/music", label: "音乐", icon: Music },
  { href: "/about", label: "关于", icon: User },
];

export default function RadialMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const lastMouse = useRef({ x: 0, y: 0 });
  const RADIUS = 140;

  const getActiveIndex = useCallback((mouseX: number, mouseY: number) => {
    const distFromCenter = Math.hypot(mouseX - center.x, mouseY - center.y);
    if (distFromCenter < 30) return -1;
    let minDist = Infinity;
    let closest = -1;
    navItems.forEach((_, i) => {
      const angle = (i / navItems.length) * 2 * Math.PI - Math.PI / 2;
      const ix = center.x + Math.cos(angle) * RADIUS;
      const iy = center.y + Math.sin(angle) * RADIUS;
      const d = Math.hypot(mouseX - ix, mouseY - iy);
      if (d < minDist) { minDist = d; closest = i; }
    });
    return closest;
  }, [center.x, center.y]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        if (!e.repeat && lastMouse.current) {
          setOpen(true);
          setCenter({ x: lastMouse.current.x, y: lastMouse.current.y });
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        if (activeIndex >= 0) {
          router.push(navItems[activeIndex].href);
        }
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (open) {
        setActiveIndex(getActiveIndex(e.clientX, e.clientY));
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [open, activeIndex, getActiveIndex, router]);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      window.dispatchEvent(new CustomEvent("radial-nav-hover", { detail: { label: navItems[activeIndex].label } }));
    }
  }, [open, activeIndex]);

  if (pathname.startsWith("/garden")) return null;

  const cx = center.x;
  const cy = center.y;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          {/* 中心圆 */}
          <div
            className="absolute rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30"
            style={{
              left: cx - 30,
              top: cy - 30,
              width: 60,
              height: 60,
            }}
          />

          {/* 径向菜单项 */}
          {navItems.map((item, i) => {
            const angle = (i / navItems.length) * 2 * Math.PI - Math.PI / 2;
            const x = cx + Math.cos(angle) * RADIUS;
            const y = cy + Math.sin(angle) * RADIUS;
            const isActive = i === activeIndex;
            const Icon = item.icon;

            return (
              <motion.div
                key={item.href}
                initial={{ scale: 0, x: cx, y: cy }}
                animate={{ scale: 1, x: x - 32, y: y - 32 }}
                exit={{ scale: 0, x: cx, y: cy }}
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: i * 0.02 }}
                data-radial-nav={item.label}
                className="absolute flex flex-col items-center gap-1 pointer-events-auto"
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-100 ${
                    isActive
                      ? "bg-sky-500 shadow-lg shadow-sky-500/50 scale-110"
                      : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? "text-white" : "text-slate-600 dark:text-slate-300"}`} />
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap transition-all duration-100 z-10 ${
                    isActive ? "text-white scale-110" : "text-white/70"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            );
          })}

          {/* 提示文字 */}
          <div
            className="absolute text-white/60 text-sm"
            style={{ left: cx, top: cy + RADIUS + 60, transform: "translateX(-50%)" }}
          >
            松开 Tab 跳转
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
