import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { sendPublishingJobToBuffer } from "@/lib/buffer/publishing";
import {
  ensurePublishingJobsForPost,
  markPostBufferHandoffComplete,
} from "@/lib/content/publishing-workflow";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";

const bulkSendToBufferSchema = z.object({
  post_ids: z.array(z.string().uuid()).min(1).max(20),
});

type BulkResult = {
  post_id: string;
  ok: boolean;
  scheduled_for?: string;
  sent_count?: number;
  error?: string;
};

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = bulkSendToBufferSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();
    const results: BulkResult[] = [];

    for (const postId of input.post_ids) {
      try {
        const ensured = await ensurePublishingJobsForPost(supabase, {
          postId,
          userId: user.id,
        });
        const pendingJobs = ensured.jobs.filter(
          (job) => job.status !== "ready" && job.status !== "published",
        );
        const sent = [];

        for (const job of pendingJobs) {
          sent.push(
            await sendPublishingJobToBuffer(supabase, job.id, {
              userId: user.id,
            }),
          );
        }

        await markPostBufferHandoffComplete(supabase, {
          postId,
          userId: user.id,
        });

        results.push({
          post_id: postId,
          ok: true,
          scheduled_for: ensured.scheduledFor,
          sent_count: sent.length,
        });
      } catch (error) {
        results.push({
          post_id: postId,
          ok: false,
          error: error instanceof Error ? error.message : "Could not send to Buffer.",
        });
      }
    }

    return jsonOk({
      results,
      sent_count: results.filter((result) => result.ok).length,
      failed_count: results.filter((result) => !result.ok).length,
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
