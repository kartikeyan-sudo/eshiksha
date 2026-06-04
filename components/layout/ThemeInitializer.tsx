"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    try {
      document.documentElement.dataset.theme = "dark";
      localStorage.setItem("theme", "dark");
      window.dispatchEvent(new CustomEvent("theme-changed", { detail: "dark" }));
    } catch {
      document.documentElement.dataset.theme = "dark";
    }
  }, []);

  return null;
}
