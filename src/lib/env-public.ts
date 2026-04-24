import {
  EXPECTED_SUPABASE_URL,
  REQUIRED_SUPABASE_PROJECT_REF,
  checkSupabaseProjectUrl,
} from "@/lib/supabase-safety";

export function getPublicEnvStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const safety = checkSupabaseProjectUrl(supabaseUrl || undefined);

  return {
    ok: safety.ok && Boolean(supabaseUrl) && Boolean(anonKey),
    supabaseUrl,
    hasAnonKey: Boolean(anonKey),
    expectedProjectRef: REQUIRED_SUPABASE_PROJECT_REF,
    expectedSupabaseUrl: EXPECTED_SUPABASE_URL,
    message: !supabaseUrl
      ? "NEXT_PUBLIC_SUPABASE_URL is not configured."
      : !anonKey
        ? "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured."
        : safety.message,
  };
}
