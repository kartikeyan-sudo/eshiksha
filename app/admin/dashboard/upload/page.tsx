import { UploadForm } from "@/components/admin/UploadForm";
import { BackButton } from "@/components/ui/BackButton";

export default function AdminDashboardUploadPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-1 py-2 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Upload Ebook</h1>
          <p className="text-sm text-[var(--text-muted)]">Add new content with cover, metadata, tags, and preview settings.</p>
        </div>
        <BackButton />
      </div>
      <UploadForm />
    </div>
  );
}
