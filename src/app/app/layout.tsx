import { AppSidebar } from "@/components/app-sidebar";
import { ConfigRequired } from "@/components/config-required";
import { getAuthenticatedPageContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppAreaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getAuthenticatedPageContext();

  if (!context.ok) {
    return <ConfigRequired message={context.message} />;
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] text-zinc-100 md:grid md:grid-cols-[16rem_1fr]">
      <AppSidebar />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
