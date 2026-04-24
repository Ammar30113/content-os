type StatusCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "teal" | "amber" | "blue" | "slate";
};

const toneClassName = {
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  blue: "border-sky-200 bg-sky-50 text-sky-900",
  slate: "border-slate-200 bg-white text-slate-900",
  teal: "border-teal-200 bg-teal-50 text-teal-900",
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
