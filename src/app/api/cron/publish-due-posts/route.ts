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
      horizonHours: 48,
      limit: 20,
    });
    const cleanupResult = await deleteExpiredScheduledBufferPosts(supabase);

    return jsonOk({
      ...publishResult,
      scheduled_cleanup: cleanupResult,
    });
  } catch (error) {
    return jsonError(error, error instanceof Error && error.message === "Unauthorized" ? 401 : 400);
  }
}

function assertAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret) {
    if (authHeader !== `Bearer ${secret}`) {
      throw new Error("Unauthorized");
    }

    return;
  }

  if (request.headers.get("user-agent")?.includes("vercel-cron")) {
    return;
  }

  throw new Error("Unauthorized");
}
