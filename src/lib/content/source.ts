export async function summarizeSourceUrl(sourceUrl: string) {
  try {
    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(7000),
      headers: {
        "User-Agent": "Content OS internal research bot",
      },
    });

    if (!response.ok) {
      return `Unavailable: source returned HTTP ${response.status}.`;
    }

    const text = await response.text();
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
