import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !["PROFESSOR", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080810" }}>
      <AdminSidebar
        userName={session.user.name ?? "Admin"}
        userRole={session.user.role}
        userPoints={session.user.points ?? 0}
      />
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}
