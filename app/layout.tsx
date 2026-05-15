import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { NotificationProvider } from "../components/ui/NotificationCenter";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EShikhsha | Universal Premium Ebook Platform",
  description: "Elite protocol acquisition and verified scholarly dissemination.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
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
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="min-h-full bg-white selection:bg-black selection:text-white">
        <NotificationProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </div>
        </NotificationProvider>
      </body>
    </html>
  );
}
