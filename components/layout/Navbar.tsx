"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearClientAuth, getClientAuthState } from "@/lib/auth";
import { NeuButton } from "@/components/ui/NeuButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
  { href: "/orders", label: "Orders" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    role: "user" as "user" | "admin",
    token: null as string | null,
  });

  useEffect(() => {
    const syncAuth = () => setAuthState(getClientAuthState());
    syncAuth();
    window.addEventListener("auth-changed", syncAuth);
    window.addEventListener("focus", syncAuth);
    return () => {
      window.removeEventListener("auth-changed", syncAuth);
      window.removeEventListener("focus", syncAuth);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const onLogout = () => {
    clearClientAuth();
    setIsOpen(false);
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 px-3 pb-2 pt-3 md:px-6">
      <nav className="glass-navbar relative mx-auto w-full max-w-7xl rounded-2xl px-5 py-3.5 md:px-8" aria-label="Primary">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow">
              ES
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                EShikhsha
              </span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1.5 md:flex">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]"
                  }`}
                >
                  {item.label}
                  {isActive ? (
                    <span className="absolute bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
                  ) : null}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right */}
          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />
            {authState.isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-white text-xs font-bold shadow-sm">
                  {authState.role === "admin" ? "A" : "U"}
                </div>
                <NeuButton variant="ghost" onClick={onLogout} className="text-xs">
                  Logout
                </NeuButton>
              </div>
            ) : (
              <Link href="/login">
                <NeuButton variant="primary" className="text-xs">Sign In</NeuButton>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
            >
              {isOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen ? (
          <div className="animate-fade-in absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 space-y-1 rounded-xl border border-[var(--glass-border)] bg-[var(--surface)] p-3 shadow-lg md:hidden">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={`m-${item.href}`}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 border-t border-[var(--glass-border)] pt-3">
              {authState.isAuthenticated ? (
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
