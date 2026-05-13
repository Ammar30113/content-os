"use client";

import { ChangeEvent, FormEvent, ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FilePlus2, ImageUp, Save, Shuffle, Sparkles } from "lucide-react";

import {
  type BrandSlug,
  type BatchAngle,
  contentModes,
  imageModes,
  platforms,
  postQuantities,
  postTypes,
  templateHints,
  tones,
} from "@/lib/content/types";
import { readApiJson } from "@/lib/http/read-api-json";

type Platform = (typeof platforms)[number];
type ImageMode = (typeof imageModes)[number];
type ContentMode = (typeof contentModes)[number];
type TopicSourceMode = "auto" | "evergreen" | "live";

type FormState = {
  auto_topic: boolean;
  topic_source: TopicSourceMode;
  brand_slug: BrandSlug;
  title: string;
  brief: string;
  source_url: string;
  platform: Platform;
  selected_platforms: Platform[];
  content_mode: ContentMode;
  recognizable_figure: string;
  current_event: string;
  contrarian_take: string;
  builder_lesson: string;
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
};

function createDefaultForm(brandSlug: BrandSlug = "word_of_ai"): FormState {
  const isRallio = brandSlug === "rallio";

  return {
  auto_topic: true,
  topic_source: isRallio ? "evergreen" : "auto",
  brand_slug: brandSlug,
  title: "",
  brief: "",
  source_url: "",
  platform: "instagram",
  selected_platforms: ["instagram"],
  content_mode: "standard",
  recognizable_figure: "",
  current_event: "",
  contrarian_take: "",
  builder_lesson: "",
  post_type: "single",
  tone: isRallio ? "founder" : "educational",
  template_hint: "auto",
  quantity: "1",
  image_mode: "template",
  roulette_seed_id: "",
  rallio_content_type: undefined,
  rallio_cta_door: undefined,
  rallio_template_type: undefined,
  rallio_visual_style: undefined,
  rallio_kpi_intent: undefined,
  };
}

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

type TopicRoulettePayload = {
  brand_slug?: BrandSlug;
  title: string;
  brief: string;
  source_url: string;
  tone: FormState["tone"];
  template_hint: FormState["template_hint"];
  content_mode: ContentMode;
  selected_platforms: Platform[];
  rallio_content_type?: string;
  rallio_cta_door?: string;
  rallio_template_type?: string;
  rallio_visual_style?: string;
  rallio_kpi_intent?: string;
  roulette: {
    seed_id: string;
    source: "evergreen_bank" | "live_hackernews" | "rallio_bank";
    visual_direction: string;
    contrast_setup: string;
    anti_generic_notes: string;
  };
};

export function IdeaGeneratorForm({
  brandSlug = "word_of_ai",
}: {
  brandSlug?: BrandSlug;
}) {
  const isRallio = brandSlug === "rallio";
  const [form, setForm] = useState<FormState>(() => createDefaultForm(brandSlug));
  const [showAdvancedAutoTopic, setShowAdvancedAutoTopic] = useState(false);
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

  const selectedPlatforms = useMemo(
    () => (form.selected_platforms.length ? form.selected_platforms : ["instagram"]),
    [form.selected_platforms],
  );

  function getSelectedPlatforms(targetForm = form) {
    if (targetForm.brand_slug === "rallio") {
      return ["instagram"] satisfies Platform[];
    }

    return targetForm.selected_platforms.length
      ? targetForm.selected_platforms
      : (["instagram"] satisfies Platform[]);
  }

  function updateField<K extends keyof FormState>(name: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function togglePlatform(platform: Platform) {
    if (isRallio) {
      return;
    }

    setForm((current) => {
      const selected = current.selected_platforms.includes(platform)
        ? current.selected_platforms.filter((item) => item !== platform)
        : [...current.selected_platforms, platform];

      if (!selected.length) {
        return current;
      }

      return {
        ...current,
        selected_platforms: selected,
        platform: selected[0],
      };
    });
  }

  function handleReferenceFile(event: ChangeEvent<HTMLInputElement>) {
    setReferenceFile(event.target.files?.[0] || null);
    setReferenceImage(null);
  }

  function getQuantity() {
    const parsed = Number(form.quantity);

    if (!Number.isFinite(parsed)) {
      return 1;
    }

    return Math.min(20, Math.max(1, Math.trunc(parsed)));
  }

  function buildRequestPayload(
    reference: ReferenceImage | null,
    quantity?: number,
    targetForm = form,
  ) {
    const activePlatforms = getSelectedPlatforms(targetForm);

    return {
      ...targetForm,
      brand_slug: brandSlug,
      platform: activePlatforms[0],
      selected_platforms: activePlatforms,
      reference_image_url: reference?.image_url || "",
      reference_image_asset_id: reference?.asset_id,
      quantity: quantity || getQuantity(),
      generation_count: quantity || getQuantity(),
    };
  }

  async function createTopicRoulette(quantity: number) {
    const response = await fetch("/api/generate-topic-roulette", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_type: form.post_type,
        quantity,
        selected_platforms: getSelectedPlatforms(form),
        source: form.topic_source,
        brand_slug: brandSlug,
      }),
    });
    const payload = await readApiJson<TopicRoulettePayload & { error?: string }>(
      response,
    );

    if (!response.ok) {
      throw new Error(payload.error || "Could not pick a topic.");
    }

    return payload as TopicRoulettePayload;
  }

  async function resolveGenerationForm(quantity: number) {
    if (!form.auto_topic) {
      return form;
    }

    setState({
      loading: true,
      message:
        isRallio
          ? "Picking a Rallio launch topic..."
          : form.topic_source === "live"
          ? "Looking for a live AI topic..."
          : form.topic_source === "evergreen"
            ? "Picking evergreen Word of AI topic..."
            : "Picking a hybrid Word of AI topic...",
      error: null,
    });

    const roulette = await createTopicRoulette(quantity);
    const nextForm: FormState = {
      ...form,
      brand_slug: brandSlug,
      content_mode: roulette.content_mode,
      selected_platforms: roulette.selected_platforms,
      platform: roulette.selected_platforms[0] || "instagram",
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
      recognizable_figure: "",
      current_event: "",
      contrarian_take: "",
      builder_lesson: "",
    };

    setForm(nextForm);
    return nextForm;
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
      error?: string;
    }>(response);

    if (!response.ok) {
      throw new Error(payload.error || "Could not upload reference image.");
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
      const payload = await readApiJson<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error || "Could not save idea.");
      }

      setState({ loading: false, message: "Idea saved.", error: null });
      router.refresh();
    } catch (error) {
      setState({
        loading: false,
        message: null,
        error: error instanceof Error ? error.message : "Could not save idea.",
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
    const payload = await readApiJson<BatchPlanPayload & { error?: string }>(
      response,
    );

    if (!response.ok) {
      throw new Error(payload.error || "Could not plan campaign.");
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
    const payload = await readApiJson<GeneratePayload & { error?: string }>(
      response,
    );

    if (!response.ok) {
      throw new Error(payload.error || "Could not generate content.");
    }

    return payload as GeneratePayload;
  }

  async function renderPackageImage(payload: {
    post: { id: string };
    content: {
      template_type: string;
      template_fields: Record<string, unknown>;
    };
  }) {
    const renderResponse = await fetch("/api/render-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_id: payload.post.id,
        template_type: payload.content.template_type,
        template_fields: payload.content.template_fields,
      }),
    });
    const renderPayload = await readApiJson<{ error?: string }>(renderResponse);

    if (!renderResponse.ok) {
      return renderPayload.error || "Image render failed.";
    }

    return null;
  }

  async function generatePackage() {
    const quantity = getQuantity();
    const createdPostIds: string[] = [];
    const imageFailures: string[] = [];
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

      if (activeForm.image_mode === "uploaded" && !reference) {
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

        if (activeForm.image_mode === "template") {
          setState({
            loading: true,
            message: "Rendering branded template image...",
            error: null,
          });

          const imageError = await renderPackageImage(payload);

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

          const payload = await generateOnePackage({
            index: angle.index,
            quantity,
            ideaId: batchPlan.idea.id,
            batchAngle: angle,
            generatedSoFar,
            reference,
            activeForm,
          });
          createdPostIds.push(payload.post.id);
          generatedSoFar.push({
            hook: payload.content.hook || payload.post.hook,
            headline: payload.content.headline || payload.post.headline,
            pillar: payload.content.pillar || payload.post.pillar,
          });

          if (activeForm.image_mode === "template") {
            setState({
              loading: true,
              message: `Rendering ${angle.index}/${quantity}: ${angle.working_title}`,
              error: null,
            });

            const imageError = await renderPackageImage(payload);

            if (imageError) {
              imageFailures.push(`${angle.index}: ${imageError}`);
            }
          }
        }
      }

      const failureMessage = imageFailures.length
        ? ` ${imageFailures.length} image${imageFailures.length === 1 ? "" : "s"} failed and can be regenerated from the post editor.`
        : "";
      const imageModeMessage =
        activeForm.image_mode === "uploaded"
          ? " Uploaded image was used as the final image."
          : "";

      setState({
        loading: false,
        message:
          quantity === 1
            ? `Content package ready.${imageModeMessage}${failureMessage}`
            : `${createdPostIds.length} content packages ready.${imageModeMessage}${failureMessage}`,
        error: null,
      });

      router.push(
        quantity === 1 && createdPostIds[0]
          ? `/app/posts/${createdPostIds[0]}`
          : "/app/posts",
      );
      router.refresh();
    } catch (error) {
      setState({
        loading: false,
        message: null,
        error:
          error instanceof Error
            ? `${error.message}${createdPostIds.length ? ` ${createdPostIds.length} post${createdPostIds.length === 1 ? "" : "s"} were created before the failure.` : ""}`
            : "Could not generate content package.",
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
        <span className="grid size-10 place-items-center rounded border border-[#b8c28a]/40 bg-[#b8c28a]/10 text-[#d7ddb8]">
          <FilePlus2 size={18} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">
            {isRallio ? "New Rallio post" : "New content idea"}
          </h2>
          <p className="text-sm text-zinc-500">
            {isRallio
              ? "Generate taste-first Ossington content for manual review."
              : "Brief it once, generate the package, render or attach the image."}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <section className="rounded border border-zinc-800 bg-[#0a0a0b] p-4">
          <p className="text-sm font-medium text-zinc-300">Topic source</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <TopicSourceButton
              active={form.auto_topic}
              title="Auto-pick topic"
              description={
                isRallio
                  ? "Use the Rallio launch content bank."
                  : "Use hybrid, live, or evergreen topic sourcing."
              }
              icon={<Shuffle size={15} className="text-[#d7ddb8]" />}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  auto_topic: true,
                  content_mode: "standard",
                  selected_platforms: current.selected_platforms.length
                    ? current.selected_platforms
                    : ["instagram"],
                }))
              }
            />
            <TopicSourceButton
              active={!form.auto_topic}
              title="Write my own"
              description="Use a topic, brief, source URL, or Authority POV."
              icon={<Check size={15} className="text-[#d7ddb8]" />}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  auto_topic: false,
                }))
              }
            />
          </div>
          {form.auto_topic ? (
            <div className="mt-3 grid gap-3">
              {!isRallio ? (
              <div className="grid gap-2 md:grid-cols-3">
                <TopicSourceModeButton
                  active={form.topic_source === "auto"}
                  title="Hybrid"
                  description="Mixes live AI topics with evergreen builder themes."
                  onClick={() => updateField("topic_source", "auto")}
                />
                <TopicSourceModeButton
                  active={form.topic_source === "live"}
                  title="Live"
                  description="Prioritizes recent AI/builder stories from public sources."
                  onClick={() => updateField("topic_source", "live")}
                />
                <TopicSourceModeButton
                  active={form.topic_source === "evergreen"}
                  title="Evergreen"
                  description="Uses durable Word of AI themes that stay relevant."
                  onClick={() => updateField("topic_source", "evergreen")}
                />
              </div>
              ) : null}
              <div className="rounded border border-[#b8c28a]/30 bg-[#b8c28a]/10 p-3 text-sm leading-6 text-[#eef4cc]">
                {isRallio
                  ? "Auto-pick fills a Rallio launch topic, funnel CTA door, tone, and visual direction. Choose only post type and count, or open advanced controls to attach a reference image."
                  : "Auto-pick fills the topic, brief, tone, and template. Choose only post type and count, or open advanced controls to override channels and image handling."}
              </div>
            </div>
          ) : null}
        </section>

        {form.auto_topic ? (
          <button
            type="button"
            onClick={() => setShowAdvancedAutoTopic((current) => !current)}
            className="w-fit rounded border border-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600 hover:text-white"
          >
            {showAdvancedAutoTopic ? "Hide advanced controls" : "Show advanced controls"}
          </button>
        ) : null}

        {!isRallio && (!form.auto_topic || showAdvancedAutoTopic) ? (
        <section className="rounded border border-zinc-800 bg-[#0a0a0b] p-4">
          <p className="text-sm font-medium text-zinc-300">Content mode</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ContentModeButton
              active={form.content_mode === "standard"}
              title="Standard campaign"
              description="Pillars, tutorials, news, tools, founder notes, and memes."
              onClick={() => updateField("content_mode", "standard")}
            />
            <ContentModeButton
              active={form.content_mode === "authority_pov"}
              title="Authority POV"
              description="Use a known figure or current event to land a builder take."
              onClick={() => updateField("content_mode", "authority_pov")}
            />
          </div>
        </section>
        ) : null}

        {(!form.auto_topic || showAdvancedAutoTopic) &&
        form.content_mode === "authority_pov" ? (
          <section className="grid gap-4 rounded border border-[#c98270]/30 bg-[#c98270]/10 p-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#f0c9bf]">
                Recognizable figure / company
              </span>
              <input
                value={form.recognizable_figure}
                onChange={(event) =>
                  updateField("recognizable_figure", event.target.value)
                }
                className="mt-2 h-11 w-full rounded border border-[#c98270]/30 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#c98270]"
                placeholder="Sam Altman, Jensen Huang, Anthropic, Perplexity"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#f0c9bf]">
                Current event / topical hook
              </span>
              <input
                value={form.current_event}
                onChange={(event) => updateField("current_event", event.target.value)}
                className="mt-2 h-11 w-full rounded border border-[#c98270]/30 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#c98270]"
                placeholder="New model launch, AI agent mistake, funding round"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-[#f0c9bf]">
                Contrarian take
              </span>
              <input
                value={form.contrarian_take}
                onChange={(event) =>
                  updateField("contrarian_take", event.target.value)
                }
                className="mt-2 h-11 w-full rounded border border-[#c98270]/30 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#c98270]"
                placeholder="The real story is not the feature, it is the workflow it makes normal."
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-[#f0c9bf]">
                Builder lesson
              </span>
              <textarea
                value={form.builder_lesson}
                onChange={(event) => updateField("builder_lesson", event.target.value)}
                className="mt-2 min-h-24 w-full rounded border border-[#c98270]/30 bg-[#0a0a0b] px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#c98270]"
                placeholder="What should founders/builders learn from this example?"
              />
            </label>
          </section>
        ) : null}

        {!form.auto_topic || showAdvancedAutoTopic ? (
          <>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">
            Topic / niche
            {form.auto_topic ? <span className="text-zinc-500"> optional</span> : null}
          </span>
          <input
            required={!form.auto_topic}
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#b8c28a]"
            placeholder="AI won't replace you, lazy AI users will"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">
            Brief / constraints
            {form.auto_topic || form.content_mode === "authority_pov" ? (
              <span className="text-zinc-500"> optional</span>
            ) : null}
          </span>
          <textarea
            required={!form.auto_topic && form.content_mode !== "authority_pov"}
            value={form.brief}
            onChange={(event) => updateField("brief", event.target.value)}
            className="mt-2 min-h-32 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#b8c28a]"
            placeholder={
              form.content_mode === "authority_pov"
                ? "Optional. Add extra constraints only if the authority fields above need more context."
                : "What should this post teach, react to, or make people save?"
            }
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">
            Source URL optional
          </span>
          <input
            type="url"
            value={form.source_url}
            onChange={(event) => updateField("source_url", event.target.value)}
            className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#b8c28a]"
            placeholder="https://..."
          />
        </label>
          </>
        ) : null}

        {!form.auto_topic || showAdvancedAutoTopic ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <section className="rounded border border-zinc-800 bg-[#0a0a0b] p-4">
            <p className="text-sm font-medium text-zinc-300">
              Channels to prepare
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {platforms.map((platform) => {
                const active = selectedPlatforms.includes(platform);

                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`inline-flex h-9 items-center gap-2 rounded border px-3 text-sm font-semibold transition ${
                      active
                        ? "border-[#b8c28a]/60 bg-[#b8c28a]/10 text-[#d7ddb8]"
                        : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {active ? <Check size={15} /> : null}
                    {platform}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded border border-zinc-800 bg-[#0a0a0b] p-4">
            <p className="text-sm font-medium text-zinc-300">
              Reference / final image
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleReferenceFile}
              className="mt-3 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 py-2 text-sm text-zinc-300"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <ImageModeButton
                active={form.image_mode === "template"}
                title="Render template"
              description={isRallio ? "Default Rallio image." : "Default Word of AI image."}
                onClick={() => updateField("image_mode", "template")}
              />
              <ImageModeButton
                active={form.image_mode === "uploaded"}
                title="Use uploaded"
                description="Bypass template image."
                onClick={() => updateField("image_mode", "uploaded")}
              />
            </div>
            {referenceFile || referenceImage ? (
              <p className="mt-3 text-xs text-zinc-500">
                {referenceImage
                  ? `Uploaded: ${referenceImage.file_name}`
                  : `Selected: ${referenceFile?.name}`}
              </p>
            ) : null}
          </section>
          </div>
        ) : null}

        <div
          className={`grid gap-4 md:grid-cols-2 ${
            form.auto_topic && !showAdvancedAutoTopic
              ? "xl:grid-cols-2"
              : "xl:grid-cols-4"
          }`}
        >
          <SelectField
            label="Post type"
            value={form.post_type}
            options={postTypes}
            onChange={(value) => updateField("post_type", value)}
          />
          {!form.auto_topic || showAdvancedAutoTopic ? (
          <SelectField
            label="Tone"
            value={form.tone}
            options={tones}
            onChange={(value) => updateField("tone", value)}
          />
          ) : null}
          {!form.auto_topic || showAdvancedAutoTopic ? (
          <SelectField
            label="Template"
            value={form.template_hint}
            options={templateHints}
            onChange={(value) => updateField("template_hint", value)}
          />
          ) : null}
          <SelectField
            label="Posts"
            value={form.quantity}
            options={postQuantities}
            onChange={(value) => updateField("quantity", value)}
          />
        </div>
        {isRallio ? (
          <div className="rounded border border-[#c8923a]/30 bg-[#c8923a]/10 p-3 text-sm leading-6 text-[#f5ebdc]">
            Rallio posts are Instagram-only and manual review/export for now.
            Buffer is disabled until a Rallio channel exists.
          </div>
        ) : null}
        {form.template_hint === "meme" ? (
          <div className="rounded border border-[#c98270]/30 bg-[#c98270]/10 p-3 text-sm leading-6 text-[#f0c9bf]">
            Meme mode uses weekly public trend context when generating. For
            batches, each post is prompted to adapt a different trend format
            instead of repeating the same joke.
          </div>
        ) : null}
        {form.content_mode === "authority_pov" ? (
          <div className="rounded border border-[#b8c28a]/30 bg-[#b8c28a]/10 p-3 text-sm leading-6 text-[#eef4cc]">
            Authority POV mode keeps product CTAs paused and generates a
            peer-level take, Reel script, and text overlay around the figure or
            event you provide.
          </div>
        ) : null}
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded border border-[#b8c28a]/50 bg-[#b8c28a]/15 px-4 text-sm font-semibold text-[#eef4cc] transition hover:bg-[#b8c28a]/20 disabled:opacity-50"
        >
          <Sparkles size={17} />
          {state.loading
            ? "Working..."
            : getQuantity() === 1
              ? "Generate content package"
              : `Generate ${getQuantity()} packages`}
        </button>
      </div>

      {state.message ? (
        <p className="mt-4 rounded border border-[#b8c28a]/30 bg-[#b8c28a]/10 p-3 text-sm text-[#eef4cc]">
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
        className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#b8c28a]"
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
      className={`rounded border p-3 text-left transition ${
        active
          ? "border-[#b8c28a]/60 bg-[#b8c28a]/10"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-white">
        {active ? <ImageUp size={15} className="text-[#d7ddb8]" /> : null}
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
      className={`rounded border p-3 text-left transition ${
        active
          ? "border-[#b8c28a]/60 bg-[#b8c28a]/10"
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

function TopicSourceModeButton({
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
      className={`rounded border p-3 text-left transition ${
        active
          ? "border-[#b8c28a]/60 bg-[#b8c28a]/10"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-white">
        {active ? <Check size={15} className="text-[#d7ddb8]" /> : null}
        {title}
      </span>
      <span className="mt-1 block text-xs leading-5 text-zinc-500">
        {description}
      </span>
    </button>
  );
}

function ContentModeButton({
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
      className={`rounded border p-3 text-left transition ${
        active
          ? "border-[#b8c28a]/60 bg-[#b8c28a]/10"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-white">
        {active ? <Check size={15} className="text-[#d7ddb8]" /> : null}
        {title}
      </span>
      <span className="mt-1 block text-xs leading-5 text-zinc-500">
        {description}
      </span>
    </button>
  );
}
