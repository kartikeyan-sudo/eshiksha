"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EbookGrid } from "@/components/ebook/EbookGrid";
import { NeuToast } from "@/components/ui/NeuToast";
import { downloadEbookFile, getCurrentUser, listEbooks, listLibrary, listReadingProgress } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import type { Ebook, ReadingProgress } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export default function LibraryPage() {
  const router = useRouter();
  const [owned, setOwned] = useState<Ebook[]>([]);
  const [allEbooks, setAllEbooks] = useState<Ebook[]>([]);
  const [progressRows, setProgressRows] = useState<ReadingProgress[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("error");
  const [activeTab, setActiveTab] = useState<"all" | "in-progress" | "completed" | "browse">("all");

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
    if (!progress) return false;
    return progress.progressPercent > 0 && progress.progressPercent < 100;
  });

  const completed = owned.filter((ebook) => {
    const progress = progressByEbook[ebook.id];
    return Boolean(progress && progress.progressPercent >= 100);
  });

  const continueReading = inProgress.length > 0
    ? inProgress.reduce((latest, ebook) => {
        const latestProgress = progressByEbook[latest.id];
        const currentProgress = progressByEbook[ebook.id];
        if (!latestProgress?.updatedAt || !currentProgress?.updatedAt) return latest;
        return new Date(currentProgress.updatedAt) > new Date(latestProgress.updatedAt) ? ebook : latest;
      }, inProgress[0])
    : null;

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

  const getFilteredItems = () => {
    switch (activeTab) {
      case "in-progress": return inProgress;
      case "completed": return completed;
      case "browse": return allEbooks;
      default: return owned;
    }
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-8 pb-24 md:px-8 md:pb-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--accent)]/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Active Collection
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">My Vault</h1>
          <p className="text-sm md:text-base text-[var(--text-muted)] font-medium max-w-md uppercase tracking-tight">
            {owned.length} Protocol{owned.length !== 1 ? "s" : ""} securely synchronized to your profile.
          </p>
        </div>
      </div>

      {/* Continue Reading */}
      {continueReading && (
        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 md:p-8 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer" onClick={() => router.push(`/ebook/${continueReading.id}`)}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <img src={continueReading.coverUrl} className="h-24 w-18 md:h-32 md:w-24 rounded-xl object-cover shadow-2xl" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Resume Learning</p>
                <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight uppercase line-clamp-1">{continueReading.title}</h2>
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-2 w-32 md:w-48 rounded-full bg-black/10 overflow-hidden">
                    <div className="h-full bg-black transition-all" style={{ width: `${progressByEbook[continueReading.id]?.progressPercent || 0}%` }} />
                  </div>
                  <span className="text-xs font-black text-black">{progressByEbook[continueReading.id]?.progressPercent || 0}%</span>
                </div>
              </div>
            </div>
            <button className="px-8 py-4 rounded-2xl bg-black text-white font-black text-sm uppercase tracking-widest">Continue →</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2 md:gap-4">
          {[
            { id: "all", label: `All Protocols (${owned.length})` },
            { id: "in-progress", label: `Active (${inProgress.length})` },
            { id: "completed", label: `Verified (${completed.length})` },
            { id: "browse", label: `Marketplace (${allEbooks.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? "bg-white text-black" : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "browse" ? (
          <EbookGrid items={allEbooks} />
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((ebook) => {
              const progress = progressByEbook[ebook.id];
              return (
                <div key={ebook.id} className="relative group flex flex-col bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img src={ebook.coverUrl} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2 py-1 rounded-md bg-black/60 text-[8px] font-black text-white uppercase tracking-widest backdrop-blur-md border border-white/10">
                        {ebook.category || "General"}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <h3 className="font-black text-white text-sm uppercase tracking-tight line-clamp-1">{ebook.title}</h3>
                    
                    <div className="space-y-1.5">
                      <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-[var(--accent)]" style={{ width: `${progress?.progressPercent || 0}%` }} />
                      </div>
                      <div className="flex justify-between text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        <span>{progress?.progressPercent || 0}% Complete</span>
                        {progress?.lastPage && <span>Page {progress.lastPage}</span>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/ebook/${ebook.id}`} className="flex-1">
                        <button className="w-full py-2.5 rounded-xl bg-white/5 text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all">Read</button>
                      </Link>
                      <button 
                        onClick={() => onDownload(ebook.id)} 
                        disabled={downloadingId === ebook.id}
                        className="p-2.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                        {downloadingId === ebook.id ? (
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl">🗄️</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Vault Empty</h2>
              <p className="text-sm text-[var(--text-muted)] max-w-xs uppercase font-medium">You haven't added any protocols to this section yet.</p>
            </div>
            <button onClick={() => setActiveTab("browse")} className="px-8 py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest">Explore Marketplace</button>
          </div>
        )}
      </div>

      <NeuToast message={message} open={toastOpen} variant={toastVariant} onClose={() => setToastOpen(false)} />
    </div>
  );
}
