"use client";

import { ErrorState } from "@/components/error-state";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error;
  // In this Next 16 build the error boundary is handed `unstable_retry` (the
  // renamed `reset`) to re-render the segment's children.
  unstable_retry: () => void;
}) {
  // Server Component errors are redacted to a generic digest in production, so
  // showing `error.message` verbatim is non-actionable there. Surface a friendly
  // message and only include the raw detail in development.
  const detail =
    process.env.NODE_ENV === "development" && error.message
      ? error.message
      : "This page hit an unexpected error. Try again, and if it keeps happening, reload.";

  return (
    <div className="space-y-4 p-6 lg:p-8">
      <ErrorState message={detail} />
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="rounded border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        Try again
      </button>
    </div>
  );
}
