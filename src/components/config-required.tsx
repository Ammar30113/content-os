import Link from "next/link";

type ConfigRequiredProps = {
  message: string;
};

export function ConfigRequired({ message }: ConfigRequiredProps) {
  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl rounded border border-white/10 bg-white/[0.04] p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d4ff00]">
          Setup required
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Content OS is paused.</h1>
        <p className="mt-4 leading-7 text-zinc-300">{message}</p>
        <p className="mt-4 leading-7 text-zinc-400">
          Add the Content OS Supabase values to `.env.local`. Writes stay
          blocked unless the URL includes `rxcxgnmnwonqzizjrgoh`.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded bg-[#d4ff00] px-4 text-sm font-semibold text-[#0a0a0b]"
        >
          Back to landing
        </Link>
      </div>
    </main>
  );
}
