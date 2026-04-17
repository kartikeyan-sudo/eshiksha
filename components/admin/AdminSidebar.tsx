"use client";

import Link from "next/link";
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

  const handleLogout = () => {
    clearClientAuth();
    router.replace("/admin");
  };

  return (
    <aside className="glass-surface flex flex-col rounded-2xl p-4 w-full lg:w-64 lg:min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-white text-sm font-bold shadow-lg">
          A
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">Admin Panel</p>
          <p className="text-xs text-[var(--text-muted)]">EShikhsha</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
        {sidebarLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap",
                isActive
                  ? "bg-[var(--accent)] text-white shadow-md"
                  : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]",
              )}
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
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Logout */}
      <div className="mt-4 border-t border-[var(--glass-border)] pt-4 hidden lg:block">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors duration-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
