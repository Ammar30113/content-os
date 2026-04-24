import { AppSidebar } from "@/components/app-sidebar";

export default function AppAreaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 md:grid md:grid-cols-[16rem_1fr]">
      <AppSidebar />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
