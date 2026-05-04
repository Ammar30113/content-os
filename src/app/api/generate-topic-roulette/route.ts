import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import {
  buildRouletteBrief,
  selectRouletteSeed,
} from "@/lib/content/topic-roulette";
import { platforms, postTypes } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";

const rouletteInputSchema = z.object({
  post_type: z.enum(postTypes),
  quantity: z.coerce.number().int().min(1).max(20),
  selected_platforms: z
    .array(z.enum(platforms))
    .min(1)
    .optional()
    .default(["instagram", "x"]),
});

const recentPostSchema = z.object({
  headline: z.string().nullable(),
  hook: z.string().nullable(),
  pillar: z.string().nullable(),
});

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = rouletteInputSchema.parse(await request.json());
    const { supabase } = await requireApiUser();

    const { data: recentPosts } = await supabase
      .from("generated_posts")
      .select("headline, hook, pillar")
      .order("created_at", { ascending: false })
      .limit(20);

    const safeRecentPosts = z.array(recentPostSchema).parse(recentPosts || []);
    const seed = selectRouletteSeed({
      postType: input.post_type,
      quantity: input.quantity,
      selectedPlatforms: input.selected_platforms,
      recentPosts: safeRecentPosts,
    });
    const selectedAngles = seed.angleVariants.slice(
      0,
      Math.max(1, Math.min(input.quantity, seed.angleVariants.length)),
    );

    return jsonOk({
      title: seed.title,
      brief: buildRouletteBrief(seed, input.quantity),
      source_url: "",
      tone: seed.preferredTone,
      template_hint: seed.templateHint,
      content_mode: "standard",
      selected_platforms: input.selected_platforms,
      roulette: {
        seed_id: seed.id,
        source: "evergreen_bank",
        visual_direction: seed.visualDirection,
        contrast_setup: seed.contrastSetup,
        anti_generic_notes: seed.antiGenericNotes,
        angle_hints: selectedAngles,
      },
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
