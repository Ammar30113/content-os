"use client";

import { ErrorState } from "@/components/error-state";

export default function AppError({ error }: { error: Error }) {
  return (
    <div className="p-6 lg:p-8">
      <ErrorState message={error.message} />
    </div>
  );
}
