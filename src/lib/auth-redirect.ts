const DEFAULT_AUTH_REDIRECT = "/app/dashboard";

export function normalizeInternalRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value) ||
    /%(?:2f|5c)/i.test(value)
  ) {
    return fallback;
  }

  try {
    const baseUrl = new URL("https://content-os.internal");
    const targetUrl = new URL(value, baseUrl);

    if (targetUrl.origin !== baseUrl.origin) {
      return fallback;
    }

    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
  } catch {
    return fallback;
  }
}
