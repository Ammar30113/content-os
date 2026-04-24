import Link from "next/link";

const operatingSignals = [
  { label: "Ideas captured", value: "42", detail: "9 ready for briefs" },
  { label: "Posts in motion", value: "18", detail: "4 need review" },
  { label: "Scheduled", value: "12", detail: "next 14 days" },
];

const workflowSteps = [
  "Capture briefs, rough ideas, and source notes",
  "Move posts through draft, review, and scheduled states",
  "Keep publishing calendars and channel settings in one place",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded bg-[#d4ff00] text-sm font-semibold text-[#0a0a0b]">
              CO
            </div>
            <div>
              <p className="text-sm font-semibold">Content OS</p>
              <p className="text-xs text-zinc-500">@wordofaii workspace</p>
            </div>
          </div>
          <Link
            href="/auth"
            className="inline-flex h-10 items-center justify-center rounded border border-white/10 bg-white px-4 text-sm font-medium text-[#0a0a0b] shadow-sm transition hover:bg-zinc-200"
          >
            Sign in
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium text-[#d4ff00]">
              Private AI content operating system
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-6xl">
              Content OS
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">
              A focused internal tool for turning ideas, briefs, and URLs into
              complete Word of AI post packages with branded 1080x1080 images.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth"
                className="inline-flex h-11 items-center justify-center rounded bg-[#d4ff00] px-5 text-sm font-semibold text-[#0a0a0b] transition hover:bg-[#e7ff68]"
              >
                Start creating
              </Link>
              <Link
                href="/app/ideas"
                className="inline-flex h-11 items-center justify-center rounded border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Review ideas
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {operatingSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded border border-white/10 bg-white/[0.04] p-4 shadow-sm"
                >
                  <p className="text-2xl font-semibold text-white">
                    {signal.value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-300">
                    {signal.label}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {signal.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  Workspace preview
                </p>
                <p className="text-xs text-slate-400">Today&apos;s pipeline</p>
              </div>
              <div className="rounded bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                Draft mode
              </div>
            </div>
            <div className="grid gap-0 md:grid-cols-[180px_1fr]">
              <aside className="border-b border-white/10 bg-[#0a0a0b] p-4 md:border-b-0 md:border-r">
                {["Dashboard", "Ideas", "Posts", "Calendar", "Settings"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className={`mb-2 rounded px-3 py-2 text-sm ${
                        index === 0
                          ? "bg-[#d4ff00] text-[#0a0a0b]"
                          : "text-zinc-400"
                      }`}
                    >
                      {item}
                    </div>
                  ),
                )}
              </aside>
              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Queue", "Review", "Scheduled"].map((label, index) => (
                    <div
                      key={label}
                      className="rounded border border-white/10 bg-white/[0.04] p-4"
                    >
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {[8, 5, 12][index]}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="rounded border border-white/10 bg-white/[0.04]">
                  {workflowSteps.map((step, index) => (
                    <div
                      key={step}
                      className="flex gap-3 border-b border-white/10 px-4 py-4 last:border-b-0"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded bg-[#d4ff00] text-xs font-semibold text-[#0a0a0b]">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-slate-200">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
