const statusClasses: Record<string, string> = {
  approved: "border-[#d4ff00]/30 bg-[#d4ff00]/10 text-[#ecff8a]",
  draft: "border-zinc-700 bg-zinc-900 text-zinc-300",
  failed: "border-red-500/30 bg-red-500/10 text-red-100",
  generated: "border-[#d4ff00]/30 bg-[#d4ff00]/10 text-[#ecff8a]",
  generating: "border-violet-400/30 bg-violet-400/10 text-violet-100",
  published: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  reviewing: "border-violet-400/30 bg-violet-400/10 text-violet-100",
  scheduled: "border-[#ff6b4a]/30 bg-[#ff6b4a]/10 text-[#ffb7a7]",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const label = status || "unknown";

  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${
        statusClasses[label] || statusClasses.draft
      }`}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}
