"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { clearClientAuth } from "@/lib/auth";

const sidebarLinks = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
  },
  {
    href: "/admin/dashboard/orders",
    label: "Orders",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    href: "/admin/dashboard/users",
    label: "Users",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m20 0v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z",
  },
  {
    href: "/admin/dashboard/ebooks",
    label: "Ebooks",
    icon: "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
  },
  {
    href: "/admin/dashboard/categories",
    label: "Categories",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z",
  },
  {
    href: "/admin/dashboard/upload",
    label: "Upload Ebook",
    icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  },
  {
    href: "/admin/dashboard/database",
    label: "DB Management",
    icon: "M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm3 3h10m-10 4h10",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    clearClientAuth();
    router.replace("/admin");
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between glass-surface rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-sm">
            A
          </div>
          <p className="text-sm font-bold text-[var(--text-primary)]">Admin Panel</p>
        </div>
        <button className="text-[var(--text-primary)]" onClick={() => setIsOpen(true)} aria-label="Open Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        "glass-surface flex flex-col p-4 w-[280px] lg:w-64 h-[100dvh] lg:h-auto lg:min-h-[calc(100vh-8rem)] overflow-y-auto",
        "fixed inset-y-0 left-0 z-50 lg:static transition-transform duration-300 ease-in-out",
        "rounded-r-2xl lg:rounded-2xl rounded-l-none lg:rounded-l-2xl shadow-2xl lg:shadow-none bg-[var(--bg)] lg:bg-transparent",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Mobile Sidebar Header */}
        <div className="flex items-center justify-between mb-6 lg:hidden px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-sm">
              A
            </div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Menu</p>
          </div>
          <button className="text-[var(--text-muted)] p-1 rounded-lg hover:bg-[var(--surface-hover)]" onClick={() => setIsOpen(false)} aria-label="Close Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Header - Desktop Only */}
        <div className="mb-6 hidden lg:flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-white text-sm font-bold shadow-lg">
            A
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Admin Panel</p>
            <p className="text-xs text-[var(--text-muted)]">EShikhsha</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {sidebarLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-[var(--accent)] text-white shadow-md"
                    : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]",
                )}
                onClick={() => setIsOpen(false)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout */}
        <div className="mt-4 border-t border-[var(--glass-border)] pt-4">
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
