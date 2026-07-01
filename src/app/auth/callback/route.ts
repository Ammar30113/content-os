import { NextRequest, NextResponse } from "next/server";

import { normalizeInternalRedirectPath } from "@/lib/auth-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeInternalRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL(
      `/auth?next=${encodeURIComponent(next)}&error=confirmation_failed`,
      requestUrl.origin,
    ),
  );
}
