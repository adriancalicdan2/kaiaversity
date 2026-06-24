import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";
import { MobileNav } from "@/components/shared/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admissions");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0A0F" }}>
      {/* Sidebar — hidden on mobile, shown on md+ */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", paddingBottom: 80 }}>
        {children}
      </main>

      {/* Mobile nav — shown only on small screens */}
      <MobileNav />
    </div>
  );
}
