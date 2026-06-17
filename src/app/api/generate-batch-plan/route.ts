import { jsonError, jsonOk } from "@/lib/api";
import {
  getRallioBatchSlotGuide,
  getRallioSignalOffset,
} from "@/lib/content/rallio";
import { ideaInputSchema } from "@/lib/content/types";
import type { BatchAngle, RallioContentType } from "@/lib/content/types";
import { getSignalBatchSlotGuide, SIGNAL_BRAND } from "@/lib/content/signal";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { requireApiUser } from "@/lib/auth";
import { summarizeSourceUrl } from "@/lib/content/source";

const AUDIENCE_PAIN_POINTS: Record<RallioContentType, string> = {
  participation_single:
    "Locals have strong taste opinions but no useful place to put them before rankings flatten the conversation.",
  supporter_steps_carousel:
    "People download local apps and stall because nobody shows them the first useful action.",
  owner_steps_carousel:
    "Owners hear about community posts but do not know how to keep their profile accurate without a sales pitch.",
  manifesto_reel:
    "Generic discovery feeds all look the same, so people stop trusting recommendations entirely.",
  spot_carousel:
    "Good local spots get lost in listicles that never explain why regulars actually return.",
  receipt_single:
    "People forget the specific reasons a spot was worth saving by the time they need the recommendation.",
  regular_quote:
    "Five-star averages hide the repeat behavior that makes a recommendation trustworthy.",
  owner_claim_carousel:
    "Owners discover community-added profiles late and want a calm way to correct the details.",
  bts_story_sequence:
    "People want to help shape the taste map but do not know what kind of reply is actually useful.",
};

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = ideaInputSchema.parse(await request.json());
    const quantity = input.quantity || 1;
    const { supabase, user } = await requireApiUser();
    const sourceSummary = input.source_url
      ? await summarizeSourceUrl(input.source_url)
      : null;

    const { data: idea, error: ideaError } = await supabase
      .from("content_ideas")
      .insert({
        user_id: user.id,
        title: input.title,
        brief: input.brief,
        source_url: input.source_url || null,
        source_summary: sourceSummary,
        status: "draft",
      })
      .select()
      .single();

    if (ideaError || !idea) {
      throw new Error(ideaError?.message || "Could not create campaign idea.");
    }

    if (input.brand_slug === "signal") {
      const angles: BatchAngle[] = Array.from({ length: quantity }, (_, index) => {
        const guide = getSignalBatchSlotGuide(index + 1);

        return {
          index: guide.slot,
          brand_slug: "signal",
          working_title: guide.workingTitle,
          pillar: guide.coreTemplateType,
          template_type: guide.coreTemplateType,
          hook_direction: guide.hookDirection,
          audience_pain_point:
            "The user notices a familiar urge loop, late-night phone pull, bargaining script, or loss of structure and wants a private reset before acting automatically.",
          unique_takeaway: guide.uniqueTakeaway,
          caption_structure: guide.captionStructure,
          do_not_repeat: guide.doNotRepeat,
          rallio_template_type: null,
          rallio_content_type: null,
          rallio_cta_door: null,
          rallio_visual_style: null,
          rallio_kpi_intent: null,
          rallio_signal: null,
          participation_prompt: null,
          signal_template_type: guide.templateType,
          signal_content_type: guide.contentType,
          signal_cta_door: guide.ctaDoor,
          signal_visual_style: guide.visualStyle,
          signal_kpi_intent: guide.kpiIntent,
        };
      });

      return jsonOk({
        idea,
        plan: {
          campaign_title: `${SIGNAL_BRAND.name} Instagram launch system`,
          strategy_summary:
            "Signal posts are Instagram-only and focus on private urge interruption, discipline systems, pattern awareness, identity anchors, and app-download intent without explicit content, shame, surveillance, or book-quote copying.",
          angles,
        },
      });
    }

    // The batch plan is built from the deterministic Rallio slot guide. The
    // idea id seeds the rotation so each campaign starts from a different
    // point in the feed rhythm, title banks, and local signal bank.
    const signalOffset = getRallioSignalOffset(idea.id);
    const { data: recentPosts } = await supabase
      .from("generated_posts")
      .select("template_fields")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40);
    // Signals assigned to a slot are forced into the generated post, so keep
    // recently used ones out of the plan instead of fighting the novelty gate.
    const excludedSignalIds = new Set(
      (recentPosts || [])
        .map((post) =>
          post.template_fields && typeof post.template_fields === "object"
            ? (post.template_fields as Record<string, unknown>).local_signal_id
            : null,
        )
        .filter((value): value is string => typeof value === "string"),
    );
    const angles = Array.from({ length: quantity }, (_, index) => {
      const guide = getRallioBatchSlotGuide(index + 1, signalOffset, excludedSignalIds);
      excludedSignalIds.add(guide.localSignal.id);

      return {
        index: guide.slot,
        brand_slug: "rallio",
        working_title: guide.workingTitle,
        pillar: guide.coreTemplateType,
        template_type: guide.coreTemplateType,
        hook_direction: guide.hookDirection,
        audience_pain_point: AUDIENCE_PAIN_POINTS[guide.contentType],
        unique_takeaway: guide.uniqueTakeaway,
        caption_structure: guide.captionStructure,
        do_not_repeat: guide.doNotRepeat,
        participation_prompt: guide.participationPrompt,
        rallio_signal: guide.localSignal,
        rallio_template_type: guide.templateType,
        rallio_content_type: guide.contentType,
        rallio_cta_door: guide.ctaDoor,
        rallio_visual_style: guide.visualStyle,
        rallio_kpi_intent: guide.kpiIntent,
      };
    });

    return jsonOk({
      idea,
      plan: {
        campaign_title: input.title,
        strategy_summary: `Planned ${quantity}-post Rallio batch mixing local recommendations, supporter and owner launch steps, and participation or city-request prompts, rotated against recent batches.`,
        angles,
      },
    });
  } catch (error) {
    return jsonError(error, 400);
  }
}
