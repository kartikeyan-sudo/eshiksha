"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearClientAuth, getClientAuthState } from "@/lib/auth";

const navLinks = [
  { href: "/", label: "Marketplace" },
  { href: "/library", label: "Library" },
  { href: "/orders", label: "Ledger" },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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

  const onLogout = () => {
    clearClientAuth();
    router.replace("/login");
  };

  return (
    <nav className="sticky top-0 z-[1000] w-full bg-white border-b-2 border-black px-6 md:px-12 py-4 flex items-center justify-between font-['Bebas_Neue'] uppercase tracking-widest">
      <div className="flex items-center gap-12">
         <Link href="/" className="text-3xl font-['Anton'] tracking-tighter text-black">
           ES.
         </Link>
         
         <div className="hidden md:flex items-center gap-8 text-lg">
           {navLinks.map((item) => (
             <Link
               key={item.href}
               href={item.href}
               className={`transition-all hover:text-[#b83227] ${
                 pathname === item.href ? "text-[#b83227] border-b-2 border-current" : "text-black"
               }`}
             >
               {item.label}
             </Link>
           ))}
         </div>
      </div>

      <div className="flex items-center gap-6 text-lg">
        {authState.role === "admin" && (
          <Link href="/admin/dashboard/orders" className="hidden md:block text-black hover:text-[#b83227]">
            Command Center
          </Link>
        )}
        
        {authState.isAuthenticated ? (
          <button 
            onClick={onLogout}
            className="px-4 py-1 border-2 border-black hover:bg-black hover:text-white transition-all"
          >
            Terminal Out
          </button>
        ) : (
          <Link href="/login" className="px-4 py-1 border-2 border-black hover:bg-black hover:text-white transition-all">
            Access Protocol
          </Link>
        )}
      </div>
    </nav>
  );
}
