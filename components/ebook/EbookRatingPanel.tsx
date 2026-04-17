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
            className={`text-lg ${onSelect ? "cursor-pointer" : "cursor-default"} ${active ? "text-amber-500" : "text-[var(--text-muted)]"}`}
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
    <section className="glass-surface rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Ratings and Reviews</h3>
        <div className="flex items-center gap-2">
          <Stars value={Math.round(summary?.averageRating || 0)} />
          <span className="text-sm text-[var(--text-secondary)]">
            {(summary?.averageRating || 0).toFixed(1)} ({summary?.totalRatings || 0})
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--glass-border)] bg-[var(--surface)] p-4">
        <p className="text-sm font-medium text-[var(--text-primary)]">Rate this ebook</p>
        <div className="mt-2">
          <Stars value={myRating} onSelect={setMyRating} />
        </div>
        <textarea
          value={review}
          onChange={(event) => setReview(event.target.value)}
          placeholder="Share what was useful in this book"
          rows={3}
          className="mt-3 w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={saving || myRating < 1}
          className="mt-3 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Submit rating"}
        </button>
      </div>

      {topReviews.length > 0 ? (
        <div className="mt-4 space-y-2">
          {topReviews.map((item) => (
            <article key={item.id} className="rounded-xl border border-[var(--glass-border)] bg-[var(--surface)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[var(--text-secondary)]">{item.userEmail || "Reader"}</p>
                <Stars value={item.rating} />
              </div>
              {item.review ? <p className="mt-2 text-sm text-[var(--text-primary)]">{item.review}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
