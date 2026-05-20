import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import {
  buildRallioRouletteBrief,
  selectRallioSeed,
} from "@/lib/content/rallio";
import { postTypes } from "@/lib/content/types";

const inputSchema = z.object({
  post_type: z.enum(postTypes).default("single"),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  recent_titles: z.array(z.string()).optional().default([]),
});

export async function POST(request: Request) {
  try {
    await requireApiUser();
    const input = inputSchema.parse(await request.json());

    const seed = selectRallioSeed({
      postType: input.post_type,
      quantity: input.quantity,
      recentText: input.recent_titles.join(" "),
    });
    const angle = seed.angleVariants[0];

    return jsonOk({
      title: angle.working_title,
      brief: buildRallioRouletteBrief(seed, input.quantity),
      source_url: "",
      tone: seed.preferredTone,
      template_hint: seed.templateHint,
      selected_platforms: ["instagram"],
      rallio_content_type: seed.contentType,
      rallio_cta_door: seed.ctaDoor,
      rallio_template_type: seed.rallioTemplateType,
      rallio_visual_style: seed.visualDirection,
      rallio_kpi_intent: seed.kpiIntent,
      roulette: {
        seed_id: seed.id,
        source: "rallio_bank" as const,
        visual_direction: seed.visualDirection,
        contrast_setup: angle.hook_direction,
        anti_generic_notes: seed.doNotSay,
      },
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
