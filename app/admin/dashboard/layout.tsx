import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminSessionGuard } from "@/components/admin/AdminSessionGuard";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionGuard>
      <div className="mx-auto w-full max-w-[1280px] px-4 py-5 md:px-8 md:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <AdminSidebar />
          <div className="min-w-0 flex-1">
            <div className="glass-surface rounded-2xl p-4 md:p-5">{children}</div>
          </div>
        </div>
      </div>
    </AdminSessionGuard>
  );
}
