import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { sendPublishingJobToBuffer } from "@/lib/buffer/publishing";
import { platforms } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";

const sendToBufferSchema = z.object({
  post_id: z.string().uuid(),
  platform: z.enum(platforms).optional(),
});

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = sendToBufferSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();
    let query = supabase
      .from("publishing_jobs")
      .select("id, status")
      .eq("post_id", input.post_id)
      .eq("user_id", user.id);

    if (input.platform) {
      query = query.eq("platform", input.platform);
    }

    const { data: jobs, error } = await query.order("scheduled_for", {
      ascending: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!jobs?.length) {
      throw new Error("Schedule this post before sending it to Buffer.");
    }

    const pendingJobs = jobs.filter((job) => job.status !== "ready");

    if (!pendingJobs.length) {
      return jsonOk({ sent: [], message: "All selected channels are already in Buffer." });
    }

    const sent = [];

    for (const job of pendingJobs) {
      sent.push(
        await sendPublishingJobToBuffer(supabase, job.id, {
          userId: user.id,
        }),
      );
    }

    return jsonOk({ sent });
  } catch (error) {
    return jsonError(error, 400);
  }
}
