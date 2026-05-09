"use client";

import { createPortal } from "react-dom";

export default function PortalOverlay({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div onMouseDown={(e) => e.stopPropagation()}>
      {children}
    </div>,
    document.body
  );
}
