import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "@document-kits/viewer/viewer.css";
import { ThemeInitializer } from "../components/layout/ThemeInitializer";
import { GlobalLoader } from "../components/layout/GlobalLoader";

function toOrigin(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

const preconnectOrigins = Array.from(
  new Set(
    [
      toOrigin(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"),
      toOrigin(
        process.env.NEXT_PUBLIC_S3_ENDPOINT ||
          process.env.NEXT_PUBLIC_S3_BASE_URL ||
          process.env.NEXT_PUBLIC_AWS_S3_ENDPOINT ||
          "",
      ),
    ].filter(Boolean),
  ),
);

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EShikhsha | Premium Cybersecurity Ebook Platform",
  description: "Discover, preview, and purchase premium cybersecurity ebooks. Learn, practice, and master security skills with EShikhsha's curated collection.",
  keywords: ["ebooks", "cybersecurity", "learning", "PDF", "online books", "security training"],
  openGraph: {
    title: "EShikhsha | Premium Cybersecurity Ebook Platform",
    description: "Discover, preview, and purchase premium cybersecurity ebooks.",
    type: "website",
    siteName: "EShikhsha",
  },
  twitter: {
    card: "summary_large_image",
    title: "EShikhsha | Premium Cybersecurity Ebook Platform",
    description: "Discover, preview, and purchase premium cybersecurity ebooks.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {preconnectOrigins.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} />
        ))}
      </head>
      <body className="min-h-full">
        <ThemeInitializer />
        <GlobalLoader />
        <div className="relative">
          {children}
        </div>
      </body>
    </html>
  );
}
