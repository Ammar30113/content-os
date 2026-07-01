import {
  assertSafeRemoteHttpUrl,
  readResponseBufferWithLimit,
} from "@/lib/http/remote-url";

const MAX_SOURCE_RESPONSE_BYTES = 1024 * 1024;

export async function summarizeSourceUrl(sourceUrl: string) {
  try {
    const safeSourceUrl = await assertSafeRemoteHttpUrl(sourceUrl);
    const response = await fetch(safeSourceUrl, {
      signal: AbortSignal.timeout(7000),
      headers: {
        "User-Agent": "Content OS internal research bot",
      },
    });

    if (!response.ok) {
      return `Unavailable: source returned HTTP ${response.status}.`;
    }

    const contentType = response.headers.get("content-type") || "";

    if (
      contentType &&
      !contentType.startsWith("text/") &&
      !contentType.includes("json") &&
      !contentType.includes("xml")
    ) {
      return `Unavailable: source returned unsupported content type ${contentType}.`;
    }

    const text = (
      await readResponseBufferWithLimit(response, MAX_SOURCE_RESPONSE_BYTES)
    ).toString("utf8");
    const cleanText = text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      return "Unavailable: source did not contain readable text.";
    }

    return cleanText.slice(0, 1800);
  } catch (error) {
    return `Unavailable: ${
      error instanceof Error ? error.message : "source fetch failed"
    }.`;
  }
}
