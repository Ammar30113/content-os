export function getUnknownErrorMessage(
  error: unknown,
  fallback = "Unexpected error.",
) {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message.trim() !== "[object Object]"
  ) {
    return error.message.trim();
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const directMessages = [record.error, record.detail, record.message];

    for (const directMessage of directMessages) {
      if (
        typeof directMessage === "string" &&
        directMessage.trim() &&
        directMessage.trim() !== "[object Object]"
      ) {
        return directMessage.trim();
      }

      if (directMessage && typeof directMessage === "object") {
        const nestedMessage = (directMessage as Record<string, unknown>).message;

        if (typeof nestedMessage === "string" && nestedMessage.trim()) {
          return nestedMessage.trim();
        }
      }
    }

    try {
      const serialized = JSON.stringify(error);

      if (serialized && serialized !== "{}") {
        return serialized.slice(0, 700);
      }
    } catch {
      // Use fallback below.
    }
  }

  return fallback;
}
