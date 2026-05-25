import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getUnknownErrorMessage } from "@/lib/errors";

export function jsonError(error: unknown, status = 400) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: error.issues.map((issue) => issue.message).join(" "),
      },
      { status },
    );
  }

  return NextResponse.json(
    {
      error: getUnknownErrorMessage(error),
    },
    { status },
  );
}

export function jsonOk<T>(payload: T) {
  return NextResponse.json(payload);
}
