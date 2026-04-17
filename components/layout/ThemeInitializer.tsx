"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const theme = saved === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      window.dispatchEvent(new CustomEvent("theme-changed", { detail: theme }));
    } catch {
      document.documentElement.dataset.theme = "light";
    }
  }, []);

  return null;
}
