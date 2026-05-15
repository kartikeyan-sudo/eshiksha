import Link from "next/link";

const footerSections = [
  {
    title: "Platform",
    links: [
      { href: "/", label: "Home" },
      { href: "/library", label: "My Library" },
      { href: "/orders", label: "Orders" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/login", label: "Sign In" },
      { href: "/signup", label: "Create Account" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="hidden px-4 pb-6 pt-10 md:block md:px-6">
      <div className="glass-surface mx-auto w-full max-w-7xl rounded-2xl px-6 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-white text-xs font-bold">
                ES
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                EShikhsha
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
              Premium cybersecurity ebooks — learn, practice, and master security skills with our curated collection.
            </p>
          </div>

          {/* Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider + Copyright */}
        <div className="mt-8 border-t border-[var(--glass-border)] pt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} EShikhsha. All rights reserved.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Built with Next.js + Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}
