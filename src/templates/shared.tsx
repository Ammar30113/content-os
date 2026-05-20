export const CANVAS_SIZE = 1080;

export function safeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function displayHeadline(value: unknown, fallback = "", limit = 74) {
  const text = safeText(value, fallback)
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();

  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

export function compactText(value: unknown, fallback = "", limit = 116) {
  const text = safeText(value, fallback);

  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

export function safeArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
