import { getUnknownErrorMessage } from "@/lib/errors";

export async function readApiJson<T extends Record<string, unknown>>(
  response: Response,
): Promise<T> {
  const body = await response.text();

  if (!body) {
    return {} as T;
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    return {
      error: response.ok
        ? "Server returned an invalid JSON response."
        : body.slice(0, 700),
    } as unknown as T;
  }
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  return getUnknownErrorMessage(error, fallback);
}
