import "server-only";

type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? error.cause.message : error.cause,
    };
  }

  return { value: error };
}

// Single chokepoint for server-side error/warn reporting. Today it writes to the
// platform log (Vercel captures stderr); swap the sink here for Sentry/Logtail
// without touching any call site.
export function logError(scope: string, error: unknown, context?: LogContext) {
  console.error(
    `[${scope}]`,
    JSON.stringify({ ...context, error: serializeError(error) }),
  );
}

export function logWarn(scope: string, message: string, context?: LogContext) {
  console.warn(`[${scope}]`, JSON.stringify({ message, ...context }));
}
