import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { sendPublishingJobToBuffer } from "@/lib/buffer/publishing";
import { ensurePublishingJobsForPost } from "@/lib/content/publishing-workflow";
import { platforms } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";

const sendToBufferSchema = z.object({
  post_id: z.string().uuid(),
  platform: z.enum(platforms).optional(),
  scheduled_for: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = sendToBufferSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();

    const ensured = await ensurePublishingJobsForPost(supabase, {
      postId: input.post_id,
      userId: user.id,
      scheduledFor: input.scheduled_for,
    });

    const targetJobs = input.platform
      ? ensured.jobs.filter((job) => job.platform === input.platform)
      : ensured.jobs;

    if (input.platform && !targetJobs.length) {
      throw new Error(
        `${input.platform} is not configured for Buffer handoff on this post.`,
      );
    }

    const pendingJobs = targetJobs.filter(
      (job) => job.status === "queued" || job.status === "failed",
    );

    if (!pendingJobs.length) {
      return jsonOk({
        sent: [],
        post: ensured.post,
        scheduled_for: ensured.scheduledFor,
        message:
          "All selected channels are already queued in Buffer. Content OS will keep this post scheduled until it is confirmed published.",
      });
    }

    const sent = [];

    for (const job of pendingJobs) {
      sent.push(
        await sendPublishingJobToBuffer(supabase, job.id, {
          userId: user.id,
        }),
      );
    }

    return jsonOk({
      sent,
      post: ensured.post,
      scheduled_for: ensured.scheduledFor,
      message:
        "Sent to Buffer and kept scheduled in Content OS. Mark it published after Instagram confirms it went live.",
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
