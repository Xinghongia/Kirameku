"use client";

import { useEffect } from "react";

export default function VisitorTracker() {
  useEffect(() => {
    if (sessionStorage.getItem("visitor_recorded")) return;

    fetch("/api/visitors/record", {
      method: "POST",
      headers: {
        "x-path": window.location.pathname,
      },
    })
      .then(() => {
        sessionStorage.setItem("visitor_recorded", "1");
      })
      .catch(() => {});
  }, []);

  return null;
}
