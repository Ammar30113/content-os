import Link from "next/link";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] px-6 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <section>
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-sm font-semibold text-zinc-300"
          >
            <span className="grid size-9 place-items-center rounded bg-[#C8923A] text-[#0a0a0b]">
              R
            </span>
            Rallio Content OS
          </Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-[#C8923A]">
            Private workspace
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Turn local taste into a week of Rallio posts.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">
            Sign in to generate Instagram packages, render branded templates,
            and schedule your weekly publishing queue.
          </p>
        </section>
        <Suspense
          fallback={
            <div className="h-96 animate-pulse rounded border border-white/10 bg-white/[0.04]" />
          }
        >
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
