"use client";

import { useEffect, useState } from "react";

export function SplashLoader() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const duration = 1500; // 1.5s
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(nextProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        // Wake up backend
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        fetch(`${apiUrl}/api/health`).catch(() => null);
        
        setTimeout(() => setVisible(false), 200);
      }
    }, 16);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="splash-container animate-fade-in">
      <div className="flex flex-col items-center">
        <div className="text-4xl font-black tracking-tighter text-white mb-2">
          ESHIKSHA<span className="text-[var(--accent)]">.</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-bold">
          Universal Protocol v2.0
        </div>
        <div className="splash-progress-bar">
          <div 
            className="splash-progress-fill" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </div>
  );
}
