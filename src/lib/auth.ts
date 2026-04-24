import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getEnvStatus } from "@/lib/env";
import {
  createSupabaseServerClient,
  type ContentOsSupabaseClient,
} from "@/lib/supabase/server";

export type AuthenticatedPageContext =
  | {
      ok: true;
      user: User;
      supabase: ContentOsSupabaseClient;
    }
  | {
      ok: false;
      reason: "config";
      message: string;
    };

export async function getAuthenticatedPageContext(
  next = "/app/dashboard",
): Promise<AuthenticatedPageContext> {
  const envStatus = getEnvStatus();

  if (!envStatus.ok) {
    return {
      ok: false,
      reason: "config",
      message: envStatus.message,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/auth?next=${encodeURIComponent(next)}`);
  }

  return {
    ok: true,
    user,
    supabase,
  };
}

export async function requireApiUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to perform this action.");
  }

  return { supabase, user };
}
