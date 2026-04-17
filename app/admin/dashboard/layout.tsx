import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminSessionGuard } from "@/components/admin/AdminSessionGuard";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionGuard>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <AdminSidebar />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </AdminSessionGuard>
  );
}
