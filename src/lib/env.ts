import "server-only";

import {
  EXPECTED_SUPABASE_URL,
  REQUIRED_SUPABASE_PROJECT_REF,
  assertConfiguredSupabaseProjectUrl,
  checkSupabaseProjectUrl,
} from "@/lib/supabase-safety";

type EnvStatus = {
  ok: boolean;
  supabaseUrl: string | null;
  appUrl: string;
  projectRef: string | null;
  expectedProjectRef: string;
  expectedSupabaseUrl: string;
  message: string;
};

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getEnvStatus(): EnvStatus {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const safety = checkSupabaseProjectUrl(supabaseUrl || undefined);
  const projectRef = supabaseUrl
    ? supabaseUrl.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] || null
    : null;

  return {
    ok:
      safety.ok &&
      Boolean(supabaseUrl) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseUrl,
    appUrl: getAppUrl(),
    projectRef,
    expectedProjectRef: REQUIRED_SUPABASE_PROJECT_REF,
    expectedSupabaseUrl: EXPECTED_SUPABASE_URL,
    message: !supabaseUrl
      ? "NEXT_PUBLIC_SUPABASE_URL is not configured."
      : !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured."
        : safety.message,
  };
}

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required.");
  }

  assertConfiguredSupabaseProjectUrl(url);

  return { url, anonKey };
}

export function getSupabaseServiceEnv() {
  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required on the server.");
  }

  return { ...publicEnv, serviceRoleKey };
}

export function getOpenAIEnv() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate content.");
  }

  return {
    apiKey,
    model,
  };
}

export function assertContentOsSupabaseWriteSafety() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error(
      "Database writes are disabled because NEXT_PUBLIC_SUPABASE_URL is not configured.",
    );
  }

  assertConfiguredSupabaseProjectUrl(url);
}
