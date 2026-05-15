"use client";

import { useEffect, useState } from "react";

export function SplashLoader() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const start = Date.now();
    const duration = 1500; // 1.5s loading

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(nextProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(() => setVisible(false), 200);
      }
    }, 16);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className={`splash-loader ${!visible ? "hidden" : ""}`}>
      <div className="flex flex-col items-center">
        <div className="loader-logo">ESHIKSHA</div>
        <div className="loader-bar">
          <div 
            className="loader-progress" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-4 font-bold">
          {progress === 100 ? "Ready" : "Loading Premium Experience"}
        </p>
      </div>
    </div>
  );
}
