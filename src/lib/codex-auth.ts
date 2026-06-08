import "server-only";

import { assertContentOsSupabaseWriteSafety, getCodexServiceEnv } from "@/lib/env";
import {
  createSupabaseAdminClient,
  type ContentOsSupabaseClient,
} from "@/lib/supabase/server";

export class CodexUnauthorizedError extends Error {
  constructor(message = "Unauthorized Codex request.") {
    super(message);
    this.name = "CodexUnauthorizedError";
  }
}

export type CodexContext = {
  supabase: ContentOsSupabaseClient;
  ownerUserId: string;
};

function extractBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

// Length-independent constant-time comparison so a wrong token cannot be
// recovered through response-timing analysis.
function timingSafeEquals(a: string, b: string) {
  let mismatch = a.length ^ b.length;
  const max = Math.max(a.length, b.length);

  for (let i = 0; i < max; i += 1) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }

  return mismatch === 0;
}

// Authenticates a service-to-service Codex request via the shared bearer token.
// Codex calls carry no end-user Supabase session, so this returns a service-role
// (RLS-bypassing) client plus the user_id that must own any rows Codex touches.
// Always scope queries with `.eq("user_id", ownerUserId)` since RLS is bypassed.
export function requireCodexContext(request: Request): CodexContext {
  assertContentOsSupabaseWriteSafety();
  const { serviceToken, ownerUserId } = getCodexServiceEnv();
  const provided = extractBearerToken(request);

  if (!provided || !timingSafeEquals(provided, serviceToken)) {
    throw new CodexUnauthorizedError();
  }

  return { supabase: createSupabaseAdminClient(), ownerUserId };
}

// 401 for auth failures, 400 for everything else.
export function codexErrorStatus(error: unknown) {
  return error instanceof CodexUnauthorizedError ? 401 : 400;
}
