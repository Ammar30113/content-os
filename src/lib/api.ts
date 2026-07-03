import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { HttpError, getUnknownErrorMessage } from "@/lib/errors";
import { logError } from "@/lib/log";

type ResolvedError = {
  status: number;
  message: string;
  // Whether this represents an unexpected/internal failure worth logging.
  internal: boolean;
};

export function jsonError(error: unknown, fallbackStatus = 400) {
  const resolved = resolveError(error, fallbackStatus);

  if (resolved.internal) {
    logError("api", error, { status: resolved.status });
  }

  return NextResponse.json({ error: resolved.message }, { status: resolved.status });
}

export function jsonOk<T>(payload: T) {
  return NextResponse.json(payload);
}

function resolveError(error: unknown, fallbackStatus: number): ResolvedError {
  if (error instanceof ZodError) {
    return {
      status: 422,
      message: error.issues.map((issue) => issue.message).join(" ") || "Invalid request.",
      internal: false,
    };
  }

  if (error instanceof HttpError) {
    return {
      status: error.status,
      message: error.publicMessage,
      internal: error.status >= 500,
    };
  }

  // OpenAI (and other fetch-based SDK) errors expose a numeric HTTP status.
  const upstreamStatus = getUpstreamStatus(error);

  if (upstreamStatus === 429) {
    return {
      status: 429,
      message: "The AI service is rate limited right now. Wait a moment and try again.",
      internal: true,
    };
  }

  if (upstreamStatus && upstreamStatus >= 500) {
    return {
      status: 503,
      message: "An upstream AI service is temporarily unavailable. Try again shortly.",
      internal: true,
    };
  }

  // Unknown/plain error. Preserve the (intentional) message for client-facing
  // 4xx failures, but never echo raw internals back on a 5xx.
  if (fallbackStatus >= 500) {
    return {
      status: fallbackStatus,
      message: "Something went wrong on our side. Please try again.",
      internal: true,
    };
  }

  return {
    status: fallbackStatus,
    message: getUnknownErrorMessage(error),
    internal: false,
  };
}

function getUpstreamStatus(error: unknown): number | null {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;

    if (typeof status === "number") {
      return status;
    }
  }

  return null;
}
