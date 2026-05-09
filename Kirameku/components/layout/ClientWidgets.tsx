"use client";

import dynamic from "next/dynamic";

const FloatingPlayer = dynamic(() => import("@/components/music/FloatingPlayer"), { ssr: false });
const Live2D = dynamic(() => import("@/components/widgets/Live2D"), { ssr: false });
const Toolbox = dynamic(() => import("@/components/widgets/Toolbox"), { ssr: false });
const GamesPanel = dynamic(() => import("@/components/widgets/GamesPanel"), { ssr: false });

export default function ClientWidgets() {
  return (
    <>
      <FloatingPlayer />
      <Live2D />
      <Toolbox />
      <GamesPanel />
    </>
  );
}
