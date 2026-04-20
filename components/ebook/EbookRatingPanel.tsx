"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getEbookRatings, getMyEbookRating, upsertEbookRating } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import type { EbookRatingSummary } from "@/lib/types";

type EbookRatingPanelProps = {
  ebookId: number;
};

function Stars({ value, onSelect }: { value: number; onSelect?: (value: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const star = index + 1;
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onSelect?.(star)}
            className={`text-xl transition-transform duration-150 ${onSelect ? "cursor-pointer hover:scale-125" : "cursor-default"} ${active ? "text-amber-500" : "text-[var(--text-muted)] opacity-40"}`}
            aria-label={`Rate ${star} star`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export function EbookRatingPanel({ ebookId }: EbookRatingPanelProps) {
  const [summary, setSummary] = useState<EbookRatingSummary | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRatings = useCallback(async () => {
    const [summaryResult, token] = await Promise.all([getEbookRatings(ebookId), Promise.resolve(getClientToken())]);
    setSummary(summaryResult);

    if (token) {
      const mine = await getMyEbookRating(ebookId, token).catch(() => ({ rating: null }));
      if (mine.rating) {
        setMyRating(mine.rating.rating);
        setReview(mine.rating.review || "");
      }
    }
  }, [ebookId]);

  useEffect(() => {
    void loadRatings();
  }, [loadRatings]);

  const submit = async () => {
    const token = getClientToken();
    if (!token || myRating < 1) return;

    setSaving(true);
    try {
      await upsertEbookRating({ ebookId, rating: myRating, review }, token);
      await loadRatings();
    } finally {
      setSaving(false);
    }
  };

  const topReviews = useMemo(() => summary?.reviews.slice(0, 3) || [], [summary]);

  return (
    <section className="glass-surface rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <span className="text-xl">⭐</span>
          Ratings & Reviews
        </h3>
        <div className="flex items-center gap-3">
          <Stars value={Math.round(summary?.averageRating || 0)} />
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            {(summary?.averageRating || 0).toFixed(1)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            ({summary?.totalRatings || 0} ratings)
          </span>
        </div>
      </div>

      {/* Submit Rating */}
      <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--surface)] p-5 space-y-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Rate this ebook</p>
        <Stars value={myRating} onSelect={setMyRating} />
        <textarea
          value={review}
          onChange={(event) => setReview(event.target.value)}
          placeholder="Share what was useful in this book..."
          rows={3}
          className="w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={saving || myRating < 1}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            "Submit Rating"
          )}
        </button>
      </div>

      {/* Reviews List */}
      {topReviews.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Recent Reviews</h4>
          {topReviews.map((item) => (
            <article key={item.id} className="rounded-xl border border-[var(--glass-border)] bg-[var(--surface)] p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                    {(item.userEmail || "R")[0].toUpperCase()}
                  </div>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">{item.userEmail || "Reader"}</p>
                </div>
                <Stars value={item.rating} />
              </div>
              {item.review ? <p className="text-sm text-[var(--text-primary)] leading-relaxed">{item.review}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
