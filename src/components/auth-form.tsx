"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";

import { normalizeInternalRedirectPath } from "@/lib/auth-redirect";
import { getPublicEnvStatus } from "@/lib/env-public";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = normalizeInternalRedirectPath(searchParams.get("next"));
  const callbackError = searchParams.get("error");
  const initialError =
    callbackError === "confirmation_failed"
      ? "Could not confirm the email link. Try signing in, or create and confirm the user from the Supabase dashboard."
      : null;
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const envStatus = useMemo(() => getPublicEnvStatus(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const result =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
              },
            });

      if (result.error) {
        throw result.error;
      }

      if (mode === "sign-up" && !result.data.session) {
        setMessage("Account created. Check your email if confirmation is on.");
        return;
      }

      setMessage("Signed in. Opening Content OS...");
      router.push(nextPath);
      router.refresh();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? formatAuthError(authError.message)
          : "Authentication failed.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
      <div className="grid grid-cols-2 gap-2 rounded bg-black/30 p-1">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`h-10 rounded text-sm font-semibold transition ${
            mode === "sign-in"
              ? "bg-[#d4ff00] text-[#0a0a0b]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`h-10 rounded text-sm font-semibold transition ${
            mode === "sign-up"
              ? "bg-[#d4ff00] text-[#0a0a0b]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Sign up
        </button>
      </div>

      {!envStatus.ok ? (
        <div className="mt-5 rounded border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
          {envStatus.message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#d4ff00]"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">Password</span>
          <input
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-11 w-full rounded border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#d4ff00]"
            placeholder="Minimum 6 characters"
          />
        </label>
        <button
          type="submit"
          disabled={isLoading || !envStatus.ok}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-[#d4ff00] px-4 text-sm font-semibold text-[#0a0a0b] transition hover:bg-[#e7ff68] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "sign-in" ? <LogIn size={17} /> : <UserPlus size={17} />}
          {isLoading
            ? "Working..."
            : mode === "sign-in"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded border border-[#d4ff00]/30 bg-[#d4ff00]/10 p-3 text-sm text-[#ecff8a]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function formatAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many")
  ) {
    return "Supabase email rate limit exceeded. Wait for the limit to reset, use the existing confirmed account, or create/confirm your user in the Supabase dashboard.";
  }

  return message;
}
