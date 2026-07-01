import { jsonError, jsonOk } from "@/lib/api";
import { sendDuePublishingJobsToBuffer } from "@/lib/buffer/publishing";
import { deleteExpiredScheduledBufferPosts } from "@/lib/content/scheduled-cleanup";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    assertAuthorizedCron(request);
    assertContentOsSupabaseWriteSafety();

    const supabase = createSupabaseAdminClient();
    const publishResult = await sendDuePublishingJobsToBuffer(supabase, {
      horizonHours: 14 * 24,
      limit: 100,
    });
    const cleanupResult = await deleteExpiredScheduledBufferPosts(supabase);

    return jsonOk({
      ...publishResult,
      scheduled_cleanup: cleanupResult,
    });
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Unauthorized"
        ? 401
        : error instanceof Error &&
            error.message === "CRON_SECRET is not configured."
          ? 503
          : 400;

    return jsonError(error, status);
  }
}

function assertAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret) {
    throw new Error("CRON_SECRET is not configured.");
  }

  if (authHeader !== `Bearer ${secret}`) {
    throw new Error("Unauthorized");
  }
}
