"use client";

import { useEffect } from "react";

export default function GamesApp() {
  useEffect(() => {
    window.dispatchEvent(new Event("open-games-panel"));
    window.dispatchEvent(new Event("close-toolbox"));
  }, []);

  return null;
}
