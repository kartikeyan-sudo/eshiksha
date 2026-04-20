"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EbookGrid } from "@/components/ebook/EbookGrid";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuTabs } from "@/components/ui/NeuTabs";
import { NeuToast } from "@/components/ui/NeuToast";
import { downloadEbookFile, getCurrentUser, listEbooks, listLibrary, listReadingProgress } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import type { Ebook, ReadingProgress } from "@/lib/types";

export default function LibraryPage() {
  const router = useRouter();
  const [owned, setOwned] = useState<Ebook[]>([]);
  const [allEbooks, setAllEbooks] = useState<Ebook[]>([]);
  const [progressRows, setProgressRows] = useState<ReadingProgress[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("error");

  useEffect(() => {
    listEbooks().then(setAllEbooks).catch(() => setAllEbooks([]));

    const token = getClientToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    getCurrentUser(token)
      .then(() =>
        Promise.all([
          listLibrary(token),
          listReadingProgress(token).catch(() => []),
        ]),
      )
      .then(([libraryRows, progressResult]) => {
        setOwned(libraryRows);
        setProgressRows(progressResult);
      })
      .catch((error) => {
        setOwned([]);
        setProgressRows([]);
        setToastVariant("error");
        setMessage(error instanceof Error ? error.message : "Could not load your library");
        setToastOpen(true);
        router.replace("/login");
      });
  }, [router]);

  const progressByEbook = progressRows.reduce<Record<number, ReadingProgress>>((acc, item) => {
    acc[item.ebookId] = item;
    return acc;
  }, {});

  const inProgress = owned.filter((ebook) => {
    const progress = progressByEbook[ebook.id];
    if (!progress) {
      return false;
    }
    return progress.progressPercent > 0 && progress.progressPercent < 100;
  });

  const completed = owned.filter((ebook) => {
    const progress = progressByEbook[ebook.id];
    return Boolean(progress && progress.progressPercent >= 100);
  });

  // Most recently updated in-progress book
  const continueReading = inProgress.length > 0
    ? inProgress.reduce((latest, ebook) => {
        const latestProgress = progressByEbook[latest.id];
        const currentProgress = progressByEbook[ebook.id];
        if (!latestProgress?.updatedAt || !currentProgress?.updatedAt) return latest;
        return new Date(currentProgress.updatedAt) > new Date(latestProgress.updatedAt) ? ebook : latest;
      }, inProgress[0])
    : null;

  const renderOwnedSection = (items: Ebook[]) => (
    items.length > 0 ? (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
        {items.map((ebook) => {
          const progress = progressByEbook[ebook.id];
          return (
            <div key={ebook.id} className="premium-card flex flex-col items-start gap-3 p-4">
              <div className="flex gap-4 w-full">
                <img
                  src={ebook.coverUrl}
                  alt=""
                  className="h-24 w-16 rounded-lg object-cover flex-shrink-0 shadow-sm"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/ebook/${ebook.id}`}>
                    <p className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2 hover:text-[var(--accent)] transition-colors">
                      {ebook.title}
                    </p>
                  </Link>
                  
                  {/* Progress Bar inside Card */}
                  <div className="mt-3 w-full">
                    <div className="h-1.5 w-full rounded-full bg-[var(--accent-soft)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress?.progressPercent || 0}%`,
                          background: `linear-gradient(90deg, var(--accent), var(--accent-secondary))`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-semibold uppercase tracking-wider">
                      {progress ? `${progress.progressPercent}% completed` : "Not started"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 w-full mt-auto">
                <Link href={`/ebook/${ebook.id}`} className="flex-1">
                  <NeuButton className="w-full text-xs font-semibold py-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                    </svg>
                    Resume
                  </NeuButton>
                </Link>
                <NeuButton
                  variant="secondary"
                  className="px-3"
                  onClick={() => onDownload(ebook.id)}
                  loading={downloadingId === ebook.id}
                  aria-label="Download PDF"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </NeuButton>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="empty-state">
        <span className="text-5xl">📚</span>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">No ebooks here yet</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">Browse our catalog and keep reading to build progress.</p>
        <Link href="/">
          <NeuButton>Explore Ebooks</NeuButton>
        </Link>
      </div>
    )
  );

  const onDownload = async (ebookId: number) => {
    const token = getClientToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setDownloadingId(ebookId);
    try {
      const ebook = owned.find((item) => item.id === ebookId);
      const blob = await downloadEbookFile(ebookId, token);
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${ebook?.title || `ebook-${ebookId}`}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 pb-24 md:px-8 md:pb-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">My Library</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{owned.length} ebook{owned.length !== 1 ? "s" : ""} in your collection</p>
        </div>
        <Link href="/">
          <NeuButton variant="secondary" className="text-xs gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Browse More
          </NeuButton>
        </Link>
      </div>

      {/* Continue Reading Banner */}
      {continueReading && (
        <section className="hero-section p-6 md:p-8 animate-fade-in">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src={continueReading.coverUrl}
                alt={continueReading.title}
                className="h-20 w-14 rounded-lg object-cover shadow-lg border-2 border-white/20"
              />
              <div>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Continue Reading</p>
                <h2 className="text-xl font-bold text-white mt-1">{continueReading.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 w-32 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${progressByEbook[continueReading.id]?.progressPercent || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/80">{progressByEbook[continueReading.id]?.progressPercent || 0}%</span>
                </div>
              </div>
            </div>
            <Link href={`/ebook/${continueReading.id}`}>
              <button className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[var(--accent)] shadow-lg transition-transform hover:scale-105">
                Resume Reading →
              </button>
            </Link>
          </div>
        </section>
      )}

      <NeuTabs
        tabs={[
          {
            label: `All (${owned.length})`,
            content: renderOwnedSection(owned),
          },
          {
            label: `In Progress (${inProgress.length})`,
            content: renderOwnedSection(inProgress),
          },
          {
            label: `Completed (${completed.length})`,
            content: renderOwnedSection(completed),
          },
          {
            label: `Browse (${allEbooks.length})`,
            content: <EbookGrid items={allEbooks} />,
          },
        ]}
      />

      <NeuToast message={message} open={toastOpen} variant={toastVariant} onClose={() => setToastOpen(false)} />
    </div>
  );
}
