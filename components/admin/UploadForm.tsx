"use client";

import { useState } from "react";
import { uploadEbook } from "@/lib/api";
import { getClientToken } from "@/lib/auth";
import { NeuButton } from "@/components/ui/NeuButton";
import { NeuInput } from "@/components/ui/NeuInput";
import { NeuToast } from "@/components/ui/NeuToast";

export function UploadForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [previewPages, setPreviewPages] = useState("3");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(false);
  const [message, setMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getClientToken();
    if (!token) {
      setToastVariant("error");
      setMessage("Please login as admin first");
      setToast(true);
      return;
    }

    if (!pdfFile || !coverFile) {
      setToastVariant("error");
      setMessage("Both PDF and cover image are required");
      setToast(true);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("preview_pages", previewPages);
      formData.append("category", category);
      formData.append("tags", tags);
      formData.append("is_free", String(isFree));
      formData.append("pdf", pdfFile);
      formData.append("cover", coverFile);

      await uploadEbook(formData, token);
      setToastVariant("success");
      setMessage("Ebook uploaded successfully");
      setTitle("");
      setDescription("");
      setPrice("");
      setPreviewPages("3");
      setCategory("General");
      setTags("");
      setIsFree(false);
      setPdfFile(null);
      setCoverFile(null);
      setToast(true);
    } catch (error) {
      setToastVariant("error");
      setMessage(error instanceof Error ? error.message : "Upload failed");
      setToast(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="glass-surface animate-fade-in rounded-2xl p-6 md:p-8">
        <h2 className="mb-6 text-xl font-bold text-[var(--text-primary)]">Ebook Upload Form</h2>

        <form
          className="space-y-5"
          onSubmit={onUpload}
        >
          {/* PDF Upload Zone */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              PDF File
            </label>
            <label
              className="neu-inset flex flex-col items-center justify-center gap-3 rounded-xl p-8 cursor-pointer hover:bg-[var(--accent-soft)] transition-colors duration-200 border-2 border-dashed border-[var(--glass-border)]"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {pdfFile?.name || "Drop PDF here or click to browse"}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">PDF files up to 50MB</p>
              </div>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPdfFile(file);
                }}
              />
            </label>
          </div>

          <NeuInput
            label="Cover Image"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            required
          />

          <NeuInput
            label="Title"
            placeholder="Enter ebook title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              placeholder="Describe the ebook content..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="neu-inset w-full rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NeuInput
              label="Price ($)"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <NeuInput
              label="Preview Pages"
              type="number"
              min={1}
              max={20}
              placeholder="3"
              value={previewPages}
              onChange={(e) => setPreviewPages(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <NeuInput
              label="Category"
              placeholder="Cybersecurity"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <NeuInput
              label="Tags (comma separated)"
              placeholder="React, Beginner, API Security"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(event) => {
                const next = event.target.checked;
                setIsFree(next);
                if (next) setPrice("0");
              }}
              className="h-4 w-4 rounded border-[var(--glass-border)]"
            />
            Mark this ebook as free
          </label>

          {/* Upload Progress */}
          {uploading ? (
            <div className="neu-inset rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Uploading...</span>
                <span className="text-xs text-[var(--accent)]">Processing</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                <div className="h-full animate-pulse rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--info)] w-3/4" />
              </div>
            </div>
          ) : null}

          <NeuButton type="submit" className="w-full" loading={uploading}>
            {uploading ? "Uploading..." : "Upload Ebook"}
          </NeuButton>
        </form>
      </div>

      <NeuToast message={message} open={toast} variant={toastVariant} onClose={() => setToast(false)} />
    </>
  );
}
