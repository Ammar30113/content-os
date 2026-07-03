// Errors that carry an intended HTTP status and a message that is SAFE to return
// to the client. Throw these from routes/helpers instead of a bare `Error` when
// the failure has a meaningful status (not-found, unauthorized, conflict…), so
// `jsonError` maps it correctly instead of collapsing everything to 400.
export class HttpError extends Error {
  readonly status: number;
  readonly publicMessage: string;

  constructor(status: number, publicMessage: string, options?: { cause?: unknown }) {
    super(publicMessage, options);
    this.name = "HttpError";
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export class ValidationError extends HttpError {
  constructor(publicMessage: string, options?: { cause?: unknown }) {
    super(422, publicMessage, options);
    this.name = "ValidationError";
  }
}

export class AuthError extends HttpError {
  constructor(
    publicMessage = "You must be signed in to perform this action.",
    options?: { cause?: unknown },
  ) {
    super(401, publicMessage, options);
    this.name = "AuthError";
  }
}

export class NotFoundError extends HttpError {
  constructor(publicMessage = "Not found.", options?: { cause?: unknown }) {
    super(404, publicMessage, options);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends HttpError {
  constructor(publicMessage: string, options?: { cause?: unknown }) {
    super(409, publicMessage, options);
    this.name = "ConflictError";
  }
}

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
