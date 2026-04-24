import Link from "next/link";

const navigationItems = [
  { href: "/app/dashboard", label: "Dashboard", glyph: "D" },
  { href: "/app/ideas", label: "Ideas", glyph: "I" },
  { href: "/app/posts", label: "Posts", glyph: "P" },
  { href: "/app/calendar", label: "Calendar", glyph: "C" },
  { href: "/app/settings", label: "Settings", glyph: "S" },
];

export function AppSidebar() {
  return (
    <aside className="flex min-h-screen w-full flex-col border-r border-slate-800 bg-slate-950 text-slate-200 md:sticky md:top-0 md:w-64">
      <div className="border-b border-slate-800 p-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded bg-teal-300 text-sm font-bold text-slate-950">
            CO
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">
              Content OS
            </span>
            <span className="block text-xs text-slate-500">
              Internal alpha
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-11 items-center gap-3 rounded px-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded bg-slate-800 text-xs font-semibold text-slate-300">
              {item.glyph}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded border border-slate-800 bg-slate-900 p-3">
          <p className="text-xs font-medium text-slate-400">Environment</p>
          <p className="mt-1 text-sm font-semibold text-white">
            Local foundation
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Supabase and OpenAI keys are placeholders until configured.
          </p>
        </div>
      </div>
    </aside>
  );
}
