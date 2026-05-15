"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearClientAuth, getClientAuthState } from "@/lib/auth";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/library", label: "Library" },
  { href: "/orders", label: "Orders" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    role: "user" as "user" | "admin",
    token: null as string | null,
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    const syncAuth = () => setAuthState(getClientAuthState());
    syncAuth();
    window.addEventListener("auth-changed", syncAuth);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  const onLogout = () => {
    clearClientAuth();
    router.replace("/login");
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? "py-4" : "py-8"}`}>
      <nav className={`container mx-auto px-6 flex items-center justify-between transition-all duration-300 ${
        isScrolled ? "glass-panel py-3 rounded-full" : "bg-transparent py-0"
      }`}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="text-2xl font-black tracking-tighter text-white">
            ESHIKSHA<span className="text-blue-500">.</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-black uppercase tracking-[0.2em] transition-all hover:text-white ${
                  isActive ? "text-white" : "text-white/40"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop Right */}
        <div className="flex items-center gap-6">
          {authState.isAuthenticated ? (
            <div className="flex items-center gap-4">
               {authState.role === 'admin' && (
                <Link href="/admin/dashboard" className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300">
                  Admin Panel
                </Link>
               )}
               <button 
                onClick={onLogout} 
                className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-red-400 transition-colors"
               >
                Logout
               </button>
            </div>
          ) : (
            <Link href="/login" className="px-6 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all">
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
