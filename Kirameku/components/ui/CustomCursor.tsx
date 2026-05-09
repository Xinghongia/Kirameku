"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
    };

    const onEnter = () => {
      ring.style.width = "40px";
      ring.style.height = "40px";
      ring.style.borderColor = "rgba(56, 189, 248, 0.6)";
    };

    const onLeave = () => {
      ring.style.width = "28px";
      ring.style.height = "28px";
      ring.style.borderColor = "rgba(56, 189, 248, 0.3)";
    };

    const loop = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = `translate(${ringX - 14}px, ${ringY - 14}px)`;
      requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", onMove);

    // hover 时放大环
    const interactiveSelector = "a, button, input, textarea, [role='button'], .cursor-pointer";
    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(interactiveSelector)) onEnter();
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(interactiveSelector)) onLeave();
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <>
      {/* 内圈小点 */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full bg-sky-400"
        style={{ width: 8, height: 8, willChange: "transform" }}
      />
      {/* 外圈跟随环 */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full border-2 border-sky-400/30"
        style={{ width: 28, height: 28, willChange: "transform", transition: "width 0.2s, height 0.2s, border-color 0.2s" }}
      />
      <style>{`@media (pointer: fine) { * { cursor: none !important; } }`}</style>
    </>
  );
}
