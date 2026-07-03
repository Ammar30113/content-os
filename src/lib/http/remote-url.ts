import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal"];

export function normalizeRemoteHttpUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("URL must be a valid HTTP or HTTPS address.");
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("URL must use HTTP or HTTPS.");
  }

  if (url.username || url.password) {
    throw new Error("URL credentials are not allowed.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (
    hostname === "localhost" ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    isPrivateOrReservedAddress(hostname)
  ) {
    throw new Error("URL must not target a local or private network address.");
  }

  return url;
}

export async function assertSafeRemoteHttpUrl(value: string) {
  const url = normalizeRemoteHttpUrl(value);

  if (!isIP(url.hostname.replace(/^\[|\]$/g, ""))) {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });

    if (
      !addresses.length ||
      addresses.some(({ address }) => isPrivateOrReservedAddress(address))
    ) {
      throw new Error("URL resolved to a local or private network address.");
    }
  }

  return url.toString();
}

// Fetch a remote URL with SSRF protection that survives redirects. A plain
// `fetch` follows 3xx responses automatically, so validating only the initial
// URL leaves a hole: a public URL can 302 to `http://169.254.169.254/…` or an
// internal host and the redirect is followed unchecked. This resolves each hop
// manually and re-validates the destination before following it.
export async function safeFetch(
  input: string,
  init: RequestInit = {},
  { maxRedirects = 3 }: { maxRedirects?: number } = {},
): Promise<Response> {
  let currentUrl = await assertSafeRemoteHttpUrl(input);

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const response = await fetch(currentUrl, { ...init, redirect: "manual" });

    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location = response.headers.get("location");

    if (!location) {
      return response;
    }

    // Release the redirect response's socket before following the next hop.
    await response.body?.cancel().catch(() => {});
    currentUrl = await assertSafeRemoteHttpUrl(
      new URL(location, currentUrl).toString(),
    );
  }

  throw new Error("Too many redirects while fetching the remote URL.");
}

export async function readResponseBufferWithLimit(
  response: Response,
  maxBytes: number,
) {
  const contentLength = Number(response.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(`Remote response exceeds the ${formatByteLimit(maxBytes)} limit.`);
  }

  if (!response.body) {
    return Buffer.alloc(0);
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      receivedBytes += value.byteLength;

      if (receivedBytes > maxBytes) {
        await reader.cancel();
        throw new Error(`Remote response exceeds the ${formatByteLimit(maxBytes)} limit.`);
      }

      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, receivedBytes);
}

function isPrivateOrReservedAddress(value: string): boolean {
  const normalized = value.toLowerCase();
  const ipVersion = isIP(normalized);

  if (ipVersion === 4) {
    const [a, b] = normalized.split(".").map(Number);

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (ipVersion === 6) {
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("2001:db8:") ||
      (normalized.startsWith("::ffff:") &&
        isPrivateOrReservedAddress(normalized.slice("::ffff:".length)))
    );
  }

  return false;
}

function formatByteLimit(bytes: number) {
  const megabytes = bytes / (1024 * 1024);

  return Number.isInteger(megabytes) ? `${megabytes} MB` : `${bytes} byte`;
}
