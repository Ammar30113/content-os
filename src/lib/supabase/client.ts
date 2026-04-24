"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicEnvStatus } from "@/lib/env-public";
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  const status = getPublicEnvStatus();

  if (!status.ok) {
    throw new Error(status.message);
  }

  return createBrowserClient<Database>(
    status.supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );
}
