"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EbookGrid } from "@/components/ebook/EbookGrid";
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
    return progress && progress.progressPercent > 0 && progress.progressPercent < 100;
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
    } catch {
       setMessage("Download failed. Please try again.");
       setToastVariant("error");
       setToastOpen(true);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="w-full min-h-screen pt-32 pb-20 container mx-auto px-6 space-y-16">
      
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-6xl font-black tracking-tighter text-white">MY LIBRARY</h1>
        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
          {owned.length} Elite Protocols in your possession
        </p>
      </div>

      {/* Continue Reading */}
      {continueReading && (
        <section className="glass-panel p-8 md:p-12 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <img 
              src={continueReading.coverUrl} 
              alt={continueReading.title} 
              className="w-48 aspect-[3/4] object-cover rounded-2xl shadow-2xl transition-transform group-hover:scale-105" 
            />
            <div className="flex-1 space-y-8 text-center md:text-left">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Jump Back In</span>
                <h2 className="text-4xl md:text-5xl font-black text-white">{continueReading.title}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progressByEbook[continueReading.id]?.progressPercent || 0}%` }} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-white/40">
                  {progressByEbook[continueReading.id]?.progressPercent || 0}% Completed
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/ebook/${continueReading.id}/read`} className="btn-premium">Resume Protocol</Link>
                <button 
                  onClick={() => onDownload(continueReading.id)}
                  disabled={downloadingId === continueReading.id}
                  className="btn-glass text-white disabled:opacity-50"
                >
                  {downloadingId === continueReading.id ? "Downloading..." : "Download Offline"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Collection Grid */}
      <section className="space-y-12">
         <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <h2 className="text-3xl font-black tracking-tighter text-white">COLLECTION</h2>
            <div className="flex gap-4">
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 underline underline-offset-8">All</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-white/20">In Progress</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Completed</span>
            </div>
         </div>

         {owned.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {owned.map((ebook) => (
                <div key={ebook.id} className="space-y-4">
                   <Link href={`/ebook/${ebook.id}`} className="block aspect-[3/4] rounded-2xl overflow-hidden glass-panel group">
                      <img src={ebook.coverUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                   </Link>
                   <div className="space-y-2">
                      <h3 className="font-black text-white text-lg line-clamp-1">{ebook.title}</h3>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{ebook.category}</span>
                         <Link href={`/ebook/${ebook.id}/read`} className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Read Now →</Link>
                      </div>
                   </div>
                </div>
             ))}
           </div>
         ) : (
           <div className="py-20 text-center space-y-8">
              <div className="text-6xl">📚</div>
              <h3 className="text-2xl font-black text-white">Empty Vault</h3>
              <p className="text-white/40 font-medium">You haven't unlocked any elite protocols yet.</p>
              <Link href="/" className="btn-premium inline-block">Explore Library</Link>
           </div>
         )}
      </section>

      <NeuToast message={message} open={toastOpen} variant={toastVariant} onClose={() => setToastOpen(false)} />
    </div>
  );
}
