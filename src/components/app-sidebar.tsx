import Link from "next/link";
import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Settings,
} from "lucide-react";

const navigationItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/app/posts", label: "Posts", icon: FileText },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="flex min-h-screen w-full flex-col border-r border-zinc-800 bg-[#0a0a0b] text-zinc-200 md:sticky md:top-0 md:w-64">
      <div className="border-b border-zinc-800 p-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded bg-[#d4ff00] text-sm font-bold text-[#0a0a0b]">
            CO
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">
              Content OS
            </span>
            <span className="block text-xs text-zinc-500">@wordofaii</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded px-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded bg-zinc-900 text-zinc-300">
                <Icon size={16} strokeWidth={1.8} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-xs font-medium text-zinc-400">Workflow</p>
          <p className="mt-1 text-sm font-semibold text-white">
            5 posts under 20 min
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Idea to AI package to branded image to schedule.
          </p>
        </div>
      </div>
    </aside>
  );
}
