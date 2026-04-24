export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded bg-zinc-900" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded bg-zinc-900" />
        <div className="h-32 animate-pulse rounded bg-zinc-900" />
        <div className="h-32 animate-pulse rounded bg-zinc-900" />
      </div>
    </div>
  );
}
