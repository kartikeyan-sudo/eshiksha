"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { NeuToast } from "./NeuToast";

type Notification = {
  id: string;
  message: string;
  variant: "success" | "error" | "info";
  timestamp: number;
};

type NotificationContextType = {
  addNotification: (message: string, variant?: "success" | "error" | "info") => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, variant: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [{ id, message, variant, timestamp: Date.now() }, ...prev]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {notifications.map((n) => (
          <div key={n.id} className="pointer-events-auto animate-slide-in-right">
             <div className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] border shadow-2xl backdrop-blur-xl transition-all ${
               n.variant === 'success' ? 'bg-[var(--success)]/10 border-[var(--success)] text-[var(--success)]' :
               n.variant === 'error' ? 'bg-[var(--danger)]/10 border-[var(--danger)] text-[var(--danger)]' :
               'bg-white/10 border-white/10 text-white'
             }`}>
                <div className="text-xl">
                  {n.variant === 'success' ? '✓' : n.variant === 'error' ? '⚠️' : '🔔'}
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">System Message</p>
                  <p className="text-sm font-bold uppercase tracking-tight">{n.message}</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
