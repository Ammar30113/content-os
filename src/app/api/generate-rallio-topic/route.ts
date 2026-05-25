import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import {
  buildRallioRouletteBrief,
  selectRallioAngle,
  selectRallioLocalSignal,
  selectRallioSeed,
} from "@/lib/content/rallio";
import { postTypes } from "@/lib/content/types";

const inputSchema = z.object({
  post_type: z.enum(postTypes).default("single"),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  recent_titles: z.array(z.string()).optional().default([]),
});

const recentPostSchema = z.object({
  headline: z.string().nullable(),
  hook: z.string().nullable(),
  template_type: z.string().nullable(),
  template_fields: z.unknown().nullable(),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireApiUser();
    const input = inputSchema.parse(await request.json());
    const { data: recentPosts } = await supabase
      .from("generated_posts")
      .select("headline, hook, template_type, template_fields")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);
    const safeRecentPosts = z.array(recentPostSchema).parse(recentPosts || []);
    const recentText = [
      ...input.recent_titles,
      ...safeRecentPosts.flatMap((post) => [
        post.headline,
        post.hook,
        post.template_type,
        templateFieldText(post.template_fields, "rallio_template_type"),
        templateFieldText(post.template_fields, "content_type"),
        templateFieldText(post.template_fields, "business_name"),
        templateFieldText(post.template_fields, "local_signal_id"),
      ]),
    ]
      .filter(Boolean)
      .join(" ");

    const seed = selectRallioSeed({
      postType: input.post_type,
      quantity: input.quantity,
      recentText,
    });
    const angle = selectRallioAngle(seed, recentText);
    const signal = selectRallioLocalSignal(recentText);

    return jsonOk({
      title: angle.working_title,
      brief: [
        buildRallioRouletteBrief(seed, input.quantity),
        input.quantity === 1
          ? `\nRequired local signal: ${signal.spot_name}, ${signal.neighborhood}, ${signal.category}. Order/detail: ${signal.signature_order}. Regular quote: "${signal.regular_quote}". Participation prompt: ${signal.participation_prompt}.`
          : "",
      ]
        .filter(Boolean)
        .join(""),
      source_url: "",
      tone: seed.preferredTone,
      template_hint: seed.templateHint,
      selected_platforms: ["instagram"],
      rallio_content_type: seed.contentType,
      rallio_cta_door: seed.ctaDoor,
      rallio_template_type: seed.rallioTemplateType,
      rallio_visual_style: seed.visualDirection,
      rallio_kpi_intent: seed.kpiIntent,
      rallio_signal: input.quantity === 1 ? signal : undefined,
      participation_prompt:
        input.quantity === 1 ? signal.participation_prompt : undefined,
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

function templateFieldText(fields: unknown, key: string) {
  if (!fields || typeof fields !== "object") {
    return "";
  }

  const value = (fields as Record<string, unknown>)[key];

  return typeof value === "string" ? value : "";
}
