type StatusCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "lime" | "violet" | "coral" | "slate";
};

const toneClassName = {
  coral: "border-[#ff6b4a]/30 bg-[#ff6b4a]/10 text-[#ffb7a7]",
  lime: "border-[#d4ff00]/30 bg-[#d4ff00]/10 text-[#ecff8a]",
  slate: "border-zinc-800 bg-zinc-950 text-zinc-100",
  violet: "border-violet-400/30 bg-violet-400/10 text-violet-200",
};

export function StatusCard({
  label,
  value,
  detail,
  tone = "slate",
}: StatusCardProps) {
  return (
    <div className={`rounded border p-5 ${toneClassName[tone]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 opacity-75">{detail}</p>
    </div>
  );
}
