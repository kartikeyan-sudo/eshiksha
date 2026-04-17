import { UploadForm } from "@/components/admin/UploadForm";
import { BackButton } from "@/components/ui/BackButton";

export default function AdminDashboardUploadPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8">
      <BackButton />
      <UploadForm />
    </div>
  );
}
