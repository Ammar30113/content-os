export const REQUIRED_SUPABASE_PROJECT_REF = "rxcxgnmnwonqzizjrgoh";
export const EXPECTED_SUPABASE_URL =
  "https://rxcxgnmnwonqzizjrgoh.supabase.co";

export type SupabaseUrlSafetyResult =
  | {
      configured: false;
      ok: true;
      projectUrl: null;
      message: string;
    }
  | {
      configured: true;
      ok: true;
      projectUrl: string;
      message: string;
    }
  | {
      configured: true;
      ok: false;
      projectUrl: string;
      message: string;
    };

export function checkSupabaseProjectUrl(
  projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): SupabaseUrlSafetyResult {
  if (!projectUrl) {
    return {
      configured: false,
      ok: true,
      projectUrl: null,
      message: "Supabase URL is not configured yet.",
    };
  }

  if (isExpectedSupabaseProjectUrl(projectUrl)) {
    return {
      configured: true,
      ok: true,
      projectUrl,
      message: "Supabase URL matches the expected Content OS project.",
    };
  }

  return {
    configured: true,
    ok: false,
    projectUrl,
    message: `Supabase URL must exactly match ${EXPECTED_SUPABASE_URL}.`,
  };
}

function isExpectedSupabaseProjectUrl(projectUrl: string) {
  try {
    const url = new URL(projectUrl);

    return (
      url.protocol === "https:" &&
      url.hostname === `${REQUIRED_SUPABASE_PROJECT_REF}.supabase.co` &&
      !url.port &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export function assertConfiguredSupabaseProjectUrl(
  projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
) {
  const result = checkSupabaseProjectUrl(projectUrl);

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}
