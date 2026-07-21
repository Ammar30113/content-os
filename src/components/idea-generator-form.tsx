"use client";

import { ChangeEvent, FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FilePlus2, ImageUp, Save, Shuffle, Sparkles } from "lucide-react";

import {
  type BrandSlug,
  type BatchAngle,
  imageModes,
  postQuantities,
  postTypes,
  templateHints,
  tones,
} from "@/lib/content/types";
import { getApiErrorMessage, readApiJson } from "@/lib/http/read-api-json";
import type { RallioLocalSignal } from "@/lib/content/types";

type ImageMode = (typeof imageModes)[number];

const signalPostTypes = postTypes.filter((type) => type === "single");

const rallioPostTypes = postTypes.filter(
  (type) => type === "single" || type === "carousel" || type === "reel",
);

// Each carousel renders three slides, so cap carousel batches to keep the
// render queue fast and avoid long, failure-prone generation runs.
const CAROUSEL_MAX_QUANTITY = 5;
const carouselPostQuantities = postQuantities.filter(
  (quantity) => Number(quantity) <= CAROUSEL_MAX_QUANTITY,
);

type FormState = {
  brand_slug: BrandSlug;
  auto_topic: boolean;
  title: string;
  brief: string;
  source_url: string;
  post_type: string;
  tone: string;
  template_hint: string;
  quantity: string;
  image_mode: ImageMode;
  roulette_seed_id: string;
  rallio_content_type?: string;
  rallio_cta_door?: string;
  rallio_template_type?: string;
  rallio_visual_style?: string;
  rallio_kpi_intent?: string;
  rallio_signal?: RallioLocalSignal;
  participation_prompt?: string;
  signal_content_type?: string;
  signal_cta_door?: string;
  signal_template_type?: string;
  signal_visual_style?: string;
  signal_kpi_intent?: string;
};

function createDefaultForm(): FormState {
  return {
    brand_slug: "rallio",
    auto_topic: false,
    title: "",
    brief: "",
    source_url: "",
    post_type: "single",
    tone: "founder",
    template_hint: "auto",
    quantity: "1",
    image_mode: "template",
    roulette_seed_id: "",
  };
}

function scopeFormToBrand(form: FormState, brandSlug: BrandSlug): FormState {
  if (brandSlug === "signal") {
    return {
      ...form,
      brand_slug: "signal",
      post_type: "single",
      rallio_content_type: undefined,
      rallio_cta_door: undefined,
      rallio_template_type: undefined,
      rallio_visual_style: undefined,
      rallio_kpi_intent: undefined,
      rallio_signal: undefined,
      participation_prompt: undefined,
    };
  }

  return {
    ...form,
    brand_slug: "rallio",
    signal_content_type: undefined,
    signal_cta_door: undefined,
    signal_template_type: undefined,
    signal_visual_style: undefined,
    signal_kpi_intent: undefined,
  };
}

type TopicRoulettePayload = {
  brand_slug?: BrandSlug;
  title: string;
  brief: string;
  source_url: string;
  tone: string;
  template_hint: string;
  selected_platforms: string[];
  rallio_content_type?: string;
  rallio_cta_door?: string;
  rallio_template_type?: string;
  rallio_visual_style?: string;
  rallio_kpi_intent?: string;
  rallio_signal?: RallioLocalSignal;
  participation_prompt?: string;
  signal_content_type?: string;
  signal_cta_door?: string;
  signal_template_type?: string;
  signal_visual_style?: string;
  signal_kpi_intent?: string;
  roulette: {
    seed_id: string;
    source: "rallio_bank" | "signal_bank";
    visual_direction: string;
    contrast_setup: string;
    anti_generic_notes: string;
  };
};

type ActionState = {
  loading: boolean;
  message: string | null;
  error: string | null;
};

type ReferenceImage = {
  asset_id: string;
  file_name: string;
  image_url: string;
};

type GeneratedPostSummary = {
  hook?: string | null;
  headline?: string | null;
  pillar?: string | null;
  local_signal_id?: string | null;
  business_name?: string | null;
  spot_category?: string | null;
  launch_neighborhood?: string | null;
  regular_quote?: string | null;
  participation_prompt?: string | null;
};

type GeneratePayload = {
  idea: { id: string };
  post: {
    id: string;
    hook?: string | null;
    headline?: string | null;
    pillar?: string | null;
  };
  content: {
    hook: string;
    headline: string;
    pillar: string;
    template_type: string;
    template_fields: Record<string, unknown>;
  };
};

type BatchPlanPayload = {
  idea: { id: string };
  plan: {
    campaign_title: string;
    strategy_summary: string;
    angles: BatchAngle[];
  };
};

export function IdeaGeneratorForm() {
  const [form, setForm] = useState<FormState>(createDefaultForm);
  const [state, setState] = useState<ActionState>({
    loading: false,
    message: null,
    error: null,
  });
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(
    null,
  );
  const router = useRouter();
  const brandCopy = getBrandFormCopy(form.brand_slug);
  const isReel = isReelForm(form);
  const isCarousel = !isReel && form.post_type === "carousel";

  function updateField<K extends keyof FormState>(name: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateBrand(brandSlug: BrandSlug) {
    setForm((current) => ({
      ...current,
      brand_slug: brandSlug,
      post_type: "single",
      quantity: "1",
      image_mode: "template",
      roulette_seed_id: "",
      rallio_content_type: undefined,
      rallio_cta_door: undefined,
      rallio_template_type: undefined,
      rallio_visual_style: undefined,
      rallio_kpi_intent: undefined,
      rallio_signal: undefined,
      participation_prompt: undefined,
      signal_content_type: undefined,
      signal_cta_door: undefined,
      signal_template_type: undefined,
      signal_visual_style: undefined,
      signal_kpi_intent: undefined,
    }));
  }

  function updatePostType(value: string) {
    setForm((current) => ({
      ...current,
      post_type: value,
      quantity:
        value === "reel"
          ? "1"
          : value === "carousel" &&
              Number(current.quantity) > CAROUSEL_MAX_QUANTITY
            ? String(CAROUSEL_MAX_QUANTITY)
            : current.quantity,
      image_mode: value === "reel" ? "template" : current.image_mode,
    }));
  }

  function handleReferenceFile(event: ChangeEvent<HTMLInputElement>) {
    setReferenceFile(event.target.files?.[0] || null);
    setReferenceImage(null);
  }

  function getQuantity(targetForm = form) {
    if (isReelForm(targetForm)) {
      return 1;
    }

    const parsed = Number(targetForm.quantity);

    if (!Number.isFinite(parsed)) {
      return 1;
    }

    const max = targetForm.post_type === "carousel" ? CAROUSEL_MAX_QUANTITY : 20;

    return Math.min(max, Math.max(1, Math.trunc(parsed)));
  }

  function buildRequestPayload(
    reference: ReferenceImage | null,
    quantity?: number,
    targetForm = form,
  ) {
    const effectiveQuantity = quantity || getQuantity(targetForm);
    const targetIsReel = isReelForm(targetForm);
    const scopedForm = scopeFormToBrand(targetForm, targetForm.brand_slug);

    return {
      ...scopedForm,
      image_mode: targetIsReel ? "template" : scopedForm.image_mode,
      platform: "instagram" as const,
      selected_platforms: ["instagram" as const],
      reference_image_url: reference?.image_url || "",
      reference_image_asset_id: reference?.asset_id,
      quantity: effectiveQuantity,
      generation_count: effectiveQuantity,
    };
  }

  async function pickAutoTopic(quantity: number): Promise<TopicRoulettePayload> {
    const response = await fetch("/api/generate-rallio-topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand_slug: form.brand_slug,
        post_type: form.post_type,
        quantity,
      }),
    });
    const payload = await readApiJson<TopicRoulettePayload & { error?: unknown }>(
      response,
    );

    if (!response.ok) {
      throw new Error(
        getApiErrorMessage(payload.error, `Could not pick a ${brandCopy.name} topic.`),
      );
    }

    return payload as TopicRoulettePayload;
  }

  async function resolveGenerationForm(quantity: number): Promise<FormState> {
    if (!form.auto_topic) {
      return form;
    }

    setState({
      loading: true,
      message: `Picking a ${brandCopy.topicBankName} topic...`,
      error: null,
    });

    const roulette = await pickAutoTopic(quantity);
    const requestedBrand = form.brand_slug;

    if (roulette.brand_slug && roulette.brand_slug !== requestedBrand) {
      throw new Error(
        `${brandCopy.topicBankName} returned ${roulette.brand_slug} metadata. Re-select ${brandCopy.name} and try again.`,
      );
    }

    const nextForm: FormState = {
      ...form,
      brand_slug: requestedBrand,
      title: roulette.title,
      brief: roulette.brief,
      source_url: roulette.source_url || "",
      tone: roulette.tone,
      template_hint: roulette.template_hint,
      roulette_seed_id: roulette.roulette.seed_id,
      rallio_content_type: roulette.rallio_content_type,
      rallio_cta_door: roulette.rallio_cta_door,
      rallio_template_type: roulette.rallio_template_type,
      rallio_visual_style: roulette.rallio_visual_style,
      rallio_kpi_intent: roulette.rallio_kpi_intent,
      rallio_signal: roulette.rallio_signal,
      participation_prompt: roulette.participation_prompt,
      signal_content_type: roulette.signal_content_type,
      signal_cta_door: roulette.signal_cta_door,
      signal_template_type: roulette.signal_template_type,
      signal_visual_style: roulette.signal_visual_style,
      signal_kpi_intent: roulette.signal_kpi_intent,
    };
    // Auto-picked topics stay request-scoped. Writing them into form state
    // would surface the machine-built brief in "Write my own" mode and leak
    // stale roulette metadata into later manual generations.
    return scopeFormToBrand(nextForm, requestedBrand);
  }

  async function uploadReferenceImage() {
    if (referenceImage) {
      return referenceImage;
    }

    if (!referenceFile) {
      return null;
    }

    setState({
      loading: true,
      message: "Uploading reference image...",
      error: null,
    });

    const uploadData = new FormData();
    uploadData.append("image", referenceFile);

    const response = await fetch("/api/media/reference-upload", {
      method: "POST",
      body: uploadData,
    });
    const payload = await readApiJson<{
      asset: { id: string };
      image_url: string;
      error?: unknown;
    }>(response);

    if (!response.ok) {
      throw new Error(
        getApiErrorMessage(payload.error, "Could not upload reference image."),
      );
    }

    const uploaded = {
      asset_id: payload.asset.id,
      file_name: referenceFile.name,
      image_url: payload.image_url,
    };
    setReferenceImage(uploaded);

    return uploaded;
  }

  async function saveIdea() {
    setState({ loading: true, message: "Saving idea...", error: null });

    try {
      const activeForm = await resolveGenerationForm(getQuantity());
      const reference = await uploadReferenceImage();
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRequestPayload(reference, undefined, activeForm)),
      });
      const payload = await readApiJson<{ error?: unknown }>(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload.error, "Could not save idea."));
      }

      setState({ loading: false, message: "Idea saved.", error: null });
      router.refresh();
    } catch (error) {
      setState({
        loading: false,
        message: null,
        error: getApiErrorMessage(error, "Could not save idea."),
      });
    }
  }

  async function createBatchPlan(
    quantity: number,
    reference: ReferenceImage | null,
    activeForm: FormState,
  ) {
    const response = await fetch("/api/generate-batch-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestPayload(reference, quantity, activeForm)),
    });
    const payload = await readApiJson<BatchPlanPayload & { error?: unknown }>(
      response,
    );

    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload.error, "Could not plan campaign."));
    }

    return payload as BatchPlanPayload;
  }

  async function generateOnePackage({
    index,
    quantity,
    ideaId,
    batchAngle,
    generatedSoFar,
    reference,
    activeForm,
  }: {
    index: number;
    quantity: number;
    ideaId?: string;
    batchAngle?: BatchAngle;
    generatedSoFar?: GeneratedPostSummary[];
    reference: ReferenceImage | null;
    activeForm: FormState;
  }) {
    const response = await fetch("/api/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...buildRequestPayload(reference, quantity, activeForm),
        idea_id: ideaId,
        batch_angle: batchAngle,
        recent_context: {
          generated_so_far: generatedSoFar || [],
        },
        generation_index: index,
      }),
    });
    const payload = await readApiJson<GeneratePayload & { error?: unknown }>(
      response,
    );

    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload.error, "Could not generate content."));
    }

    return payload as GeneratePayload;
  }

  async function renderCarouselSlides(
    postId: string,
    templateFields: Record<string, unknown>,
  ) {
    let response: Response;

    try {
      response = await fetch("/api/render-carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          template_fields: templateFields,
        }),
      });
    } catch (error) {
      return getApiErrorMessage(error, "Carousel render failed.");
    }

    const payload = await readApiJson<{ error?: unknown }>(response);

    if (!response.ok) {
      return getApiErrorMessage(payload.error, "Carousel render failed.");
    }

    return null;
  }

  async function renderPackageImage(
    payload: {
      post: { id: string };
      content: {
        template_type: string;
        template_fields: Record<string, unknown>;
      };
    },
    activeForm: FormState,
  ) {
    // Carousel posts must render every slide so they actually publish as a
    // carousel. If slide rendering fails, surface that instead of silently
    // degrading to a single-image post.
    if (!isReelForm(activeForm) && activeForm.post_type === "carousel") {
      const carouselError = await renderCarouselSlides(
        payload.post.id,
        payload.content.template_fields,
      );

      if (!carouselError) {
        return null;
      }

      return carouselError;
    }

    let renderResponse: Response;

    try {
      renderResponse = await fetch("/api/render-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: payload.post.id,
          template_type: payload.content.template_type,
          template_fields: payload.content.template_fields,
        }),
      });
    } catch (error) {
      return getApiErrorMessage(error, "Image render failed.");
    }

    const renderPayload = await readApiJson<{ error?: unknown }>(renderResponse);

    if (!renderResponse.ok) {
      return getApiErrorMessage(renderPayload.error, "Image render failed.");
    }

    return null;
  }

  async function generatePackage() {
    const quantity = getQuantity();
    const createdPostIds: string[] = [];
    const imageFailures: string[] = [];
    const slotFailures: string[] = [];
    const generatedSoFar: GeneratedPostSummary[] = [];

    setState({
      loading: true,
      message:
        quantity === 1
          ? "Preparing content package..."
          : `Preparing ${quantity}-post campaign...`,
      error: null,
    });

    try {
      const activeForm = await resolveGenerationForm(quantity);
      const reference = await uploadReferenceImage();

      if (!isReelForm(activeForm) && activeForm.image_mode === "uploaded" && !reference) {
        throw new Error("Choose a reference image before using it as the final image.");
      }

      if (quantity === 1) {
        setState({
          loading: true,
          message: "Generating structured content package...",
          error: null,
        });

        const payload = await generateOnePackage({
          index: 1,
          quantity,
          reference,
          activeForm,
        });
        createdPostIds.push(payload.post.id);

        if (shouldRenderImage(activeForm)) {
          setState({
            loading: true,
            message: "Rendering branded template image...",
            error: null,
          });

          const imageError = await renderPackageImage(payload, activeForm);

          if (imageError) {
            imageFailures.push(`1: ${imageError}`);
          }
        }
      } else {
        setState({
          loading: true,
          message: `Planning ${quantity}-post campaign...`,
          error: null,
        });

        const batchPlan = await createBatchPlan(quantity, reference, activeForm);
        const angles = batchPlan.plan.angles;

        for (const angle of angles) {
          setState({
            loading: true,
            message: `Generating ${angle.index}/${quantity}: ${angle.working_title}`,
            error: null,
          });

          // One failed slot must not abandon the rest of the campaign. Record
          // the failure, keep the batch moving, and report it at the end.
          let payload: GeneratePayload;

          try {
            payload = await generateOnePackage({
              index: angle.index,
              quantity,
              ideaId: batchPlan.idea.id,
              batchAngle: angle,
              generatedSoFar,
              reference,
              activeForm,
            });
          } catch (error) {
            slotFailures.push(
              `${angle.index} (${angle.working_title}): ${truncateFailure(
                getApiErrorMessage(error, "Generation failed."),
              )}`,
            );
            continue;
          }

          createdPostIds.push(payload.post.id);
          generatedSoFar.push({
            hook: payload.content.hook || payload.post.hook,
            headline: payload.content.headline || payload.post.headline,
            pillar: payload.content.pillar || payload.post.pillar,
            local_signal_id:
              typeof payload.content.template_fields.local_signal_id === "string"
                ? payload.content.template_fields.local_signal_id
                : null,
            business_name:
              typeof payload.content.template_fields.business_name === "string"
                ? payload.content.template_fields.business_name
                : null,
            spot_category:
              typeof payload.content.template_fields.spot_category === "string"
                ? payload.content.template_fields.spot_category
                : null,
            launch_neighborhood:
              typeof payload.content.template_fields.launch_neighborhood === "string"
                ? payload.content.template_fields.launch_neighborhood
                : null,
            regular_quote:
              typeof payload.content.template_fields.regular_quote === "string"
                ? payload.content.template_fields.regular_quote
                : null,
            participation_prompt:
              typeof payload.content.template_fields.participation_prompt === "string"
                ? payload.content.template_fields.participation_prompt
                : null,
          });

          if (shouldRenderImage(activeForm)) {
            setState({
              loading: true,
              message: `Rendering ${angle.index}/${quantity}: ${angle.working_title}`,
              error: null,
            });

            const imageError = await renderPackageImage(payload, activeForm);

            if (imageError) {
              imageFailures.push(`${angle.index}: ${imageError}`);
            }
          }
        }
      }

      if (quantity > 1 && !createdPostIds.length) {
        throw new Error(
          `No posts were generated. First failure: ${
            slotFailures[0] || "Unknown error."
          }`,
        );
      }

      const failureMessage = imageFailures.length
        ? ` ${imageFailures.length} image${imageFailures.length === 1 ? "" : "s"} failed and can be regenerated from the post editor.`
        : "";
      const isReelPackage = isReelForm(activeForm);
      const imageModeMessage =
        isReelPackage
          ? " Reel script is ready for manual video production."
          : activeForm.image_mode === "uploaded"
          ? " Uploaded image was used as the final image."
          : "";

      setState({
        loading: false,
        message:
          quantity === 1
            ? `Content package ready.${imageModeMessage}${failureMessage}`
            : `${createdPostIds.length} of ${quantity} content packages ready.${imageModeMessage}${failureMessage}`,
        error: slotFailures.length
          ? `${slotFailures.length} post${slotFailures.length === 1 ? "" : "s"} failed and can be regenerated: ${slotFailures.join("; ")}`
          : null,
      });

      // Stay on the form when slots failed so the failure summary stays
      // visible; the created posts are waiting in the review grid.
      if (!slotFailures.length) {
        router.push(
          quantity === 1 && createdPostIds[0]
            ? `/app/posts/${createdPostIds[0]}`
            : "/app/posts",
        );
      }

      router.refresh();
    } catch (error) {
      const imageFailureMessage = imageFailures.length
        ? ` ${imageFailures.length} image${imageFailures.length === 1 ? "" : "s"} also failed and can be regenerated from the post editor.`
        : "";
      const partialMessage = createdPostIds.length
        ? ` ${createdPostIds.length} post${createdPostIds.length === 1 ? "" : "s"} were created before the failure.`
        : "";

      setState({
        loading: false,
        message: null,
        error: `${getApiErrorMessage(error, "Could not generate content package.")}${partialMessage}${imageFailureMessage}`,
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await generatePackage();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border border-zinc-800 bg-zinc-950 p-5"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded border border-[#C8923A]/40 bg-[#C8923A]/10 text-[#f5ebdc]">
          <FilePlus2 size={18} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">
            New {brandCopy.name} post
          </h2>
          <p className="text-sm text-zinc-500">
            {brandCopy.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <section className="rounded border border-zinc-800 bg-[#0a0a0b] p-4">
          <p className="text-sm font-medium text-zinc-300">Brand</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <TopicSourceButton
              active={form.brand_slug === "rallio"}
              title="Rallio"
              description="Taste-map posts, local recommendations, city requests, and owner/supporter setup."
              icon={<Check size={15} className="text-[#f5ebdc]" />}
              onClick={() => updateBrand("rallio")}
            />
            <TopicSourceButton
              active={form.brand_slug === "signal"}
              title="Signal"
              description="Private urge reset, discipline systems, pattern awareness, and App Store download posts."
              icon={<Check size={15} className="text-[#f5ebdc]" />}
              onClick={() => updateBrand("signal")}
            />
          </div>
        </section>

        <section className="rounded border border-zinc-800 bg-[#0a0a0b] p-4">
          <p className="text-sm font-medium text-zinc-300">Topic source</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <TopicSourceButton
              active={form.auto_topic}
              title={brandCopy.autoTopicTitle}
              description={brandCopy.autoTopicDescription}
              icon={<Shuffle size={15} className="text-[#f5ebdc]" />}
              onClick={() => updateField("auto_topic", true)}
            />
            <TopicSourceButton
              active={!form.auto_topic}
              title="Write my own"
              description="Provide your own topic, brief, and optional source URL."
              icon={<Check size={15} className="text-[#f5ebdc]" />}
              onClick={() => updateField("auto_topic", false)}
            />
          </div>
        </section>

        {!form.auto_topic ? (
          <>
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">Topic / niche</span>
              <input
                required
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#C8923A]"
                placeholder={brandCopy.topicPlaceholder}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-300">
                Brief / constraints
              </span>
              <textarea
                required
                value={form.brief}
                onChange={(event) => updateField("brief", event.target.value)}
                className="mt-2 min-h-32 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#C8923A]"
                placeholder={brandCopy.briefPlaceholder}
              />
            </label>
          </>
        ) : (
          <div className="rounded border border-[#C8923A]/30 bg-[#C8923A]/10 p-3 text-sm leading-6 text-[#f5ebdc]">
            {brandCopy.autoTopicExplainer}
          </div>
        )}
        {!form.auto_topic ? (
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">
              Source URL optional
            </span>
            <input
              type="url"
              value={form.source_url}
              onChange={(event) => updateField("source_url", event.target.value)}
              className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#C8923A]"
              placeholder="https://..."
            />
          </label>
        ) : null}

        <section className="rounded border border-zinc-800 bg-[#0a0a0b] p-4">
          <p className="text-sm font-medium text-zinc-300">
            {isReel ? "Reference image" : "Reference / final image"}
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleReferenceFile}
            className="mt-3 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 py-2 text-sm text-zinc-300"
          />
          {isReel ? (
            <p className="mt-3 rounded border border-zinc-800 bg-zinc-950 p-3 text-sm leading-6 text-zinc-400">
              Reel packages use the image as optional visual reference only.
            </p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <ImageModeButton
                active={form.image_mode === "template"}
                title="Render template"
                description={brandCopy.templateImageDescription}
                onClick={() => updateField("image_mode", "template")}
              />
              <ImageModeButton
                active={form.image_mode === "uploaded"}
                title="Use uploaded"
                description="Bypass template image."
                onClick={() => updateField("image_mode", "uploaded")}
              />
            </div>
          )}
          {referenceFile || referenceImage ? (
            <p className="mt-3 text-xs text-zinc-500">
              {referenceImage
                ? `Uploaded: ${referenceImage.file_name}`
                : `Selected: ${referenceFile?.name}`}
            </p>
          ) : null}
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Post type"
            value={form.post_type}
            options={form.brand_slug === "rallio" ? rallioPostTypes : signalPostTypes}
            onChange={updatePostType}
          />
          <SelectField
            label="Tone"
            value={form.tone}
            options={tones}
            onChange={(value) => updateField("tone", value)}
          />
          <SelectField
            label="Template"
            value={form.template_hint}
            options={templateHints}
            onChange={(value) => updateField("template_hint", value)}
          />
          <SelectField
            label="Posts"
            value={form.quantity}
            options={
              isReel ? ["1"] : isCarousel ? carouselPostQuantities : postQuantities
            }
            onChange={(value) => updateField("quantity", value)}
          />
        </div>
        <div className="rounded border border-[#C8923A]/30 bg-[#C8923A]/10 p-3 text-sm leading-6 text-[#f5ebdc]">
          {isReel
            ? "Rallio reels generate a script-only package for manual video production and publishing."
            : isCarousel
              ? `Carousels render 3 ordered slides each, including supporter and owner step posts, so batches are capped at ${CAROUSEL_MAX_QUANTITY} to keep generation fast and reliable.`
              : brandCopy.routingNote}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={saveIdea}
          disabled={state.loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded border border-zinc-700 px-4 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50"
        >
          <Save size={17} />
          Save idea
        </button>
        <button
          type="submit"
          disabled={state.loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded border border-[#C8923A]/50 bg-[#C8923A]/15 px-4 text-sm font-semibold text-[#f5ebdc] transition hover:bg-[#C8923A]/20 disabled:opacity-50"
        >
          <Sparkles size={17} />
          {state.loading
            ? "Working..."
            : getQuantity() === 1
              ? isReel
                ? "Generate reel script"
                : "Generate content package"
              : `Generate ${getQuantity()} packages`}
        </button>
      </div>

      {state.message ? (
        <p className="mt-4 rounded border border-[#C8923A]/30 bg-[#C8923A]/10 p-3 text-sm text-[#f5ebdc]">
          {state.message}
        </p>
      ) : null}
      {state.error ? (
        <p className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function getBrandFormCopy(brandSlug: BrandSlug) {
  if (brandSlug === "signal") {
    return {
      name: "Signal",
      subtitle:
        "Generate private urge-reset, discipline, pattern-awareness, and App Store launch content for Instagram.",
      topicBankName: "Signal discipline bank",
      autoTopicTitle: "Generate from Signal discipline bank",
      autoTopicDescription:
        "Uses protocol steps, trigger patterns, identity anchors, privacy notes, and app-download CTAs.",
      topicPlaceholder:
        "10-minute reset, late-night phone loop, identity anchor, private check-in",
      briefPlaceholder:
        "What behavior loop, protocol step, privacy point, or app action should this post make concrete?",
      autoTopicExplainer:
        "Auto-pick fills a Signal feed topic, content type, CTA door, template style, and visual direction from the Signal discipline bank. Posts stay feed-only, practical, private, and App Store oriented.",
      templateImageDescription: "Default Signal dark-mode image.",
      routingNote:
        "Signal posts are Instagram-only. They route to the Signal Buffer channel for App Store download, SOS protocol, pattern-map, privacy, and identity-anchor posts with no Rallio-channel fallback.",
    };
  }

  return {
    name: "Rallio",
    subtitle: "Generate community-first taste-map content for Instagram.",
    topicBankName: "Rallio community bank",
    autoTopicTitle: "Generate from Rallio signal bank",
    autoTopicDescription:
      "Uses source details, regular quotes, and participation prompts.",
    topicPlaceholder:
      "Bang Bang Ice Cream, Ossington 30, Tuesday regular at Bar Isabel",
    briefPlaceholder:
      "What's the angle? Who's the regular? Why does this spot belong on the taste map?",
    autoTopicExplainer:
      "Auto-pick fills a feed-growth topic, taste-map source details, participation prompt, funnel door, tone, template type, and visual direction from the Rallio signal bank. Owner utility stays occasional in batch planning.",
    templateImageDescription: "Default Rallio image.",
    routingNote:
      "Rallio posts are Instagram-only. They route to the Rallio Buffer channel for App Store launch posts, supporter/owner setup steps, city requests, and taste-map participation with no legacy-channel fallback.",
  };
}

function truncateFailure(message: string, max = 160) {
  return message.length > max ? `${message.slice(0, max)}…` : message;
}

function isReelForm(form: Pick<FormState, "brand_slug" | "post_type">) {
  return form.brand_slug === "rallio" && form.post_type === "reel";
}

function shouldRenderImage(
  form: Pick<FormState, "brand_slug" | "post_type" | "image_mode">,
) {
  return !isReelForm(form) && form.image_mode === "template";
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#C8923A]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function ImageModeButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded border p-3 text-left transition ${
        active
          ? "border-[#C8923A]/60 bg-[#C8923A]/10"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-white">
        {active ? <ImageUp size={15} className="text-[#f5ebdc]" /> : null}
        {title}
      </span>
      <span className="mt-1 block text-xs leading-5 text-zinc-500">
        {description}
      </span>
    </button>
  );
}

function TopicSourceButton({
  active,
  title,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded border p-3 text-left transition ${
        active
          ? "border-[#C8923A]/60 bg-[#C8923A]/10"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-white">
        {active ? icon : null}
        {title}
      </span>
      <span className="mt-1 block text-xs leading-5 text-zinc-500">
        {description}
      </span>
    </button>
  );
}
