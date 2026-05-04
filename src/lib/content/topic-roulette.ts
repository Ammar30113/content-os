import "server-only";

import type { Platform, PostType, TemplateType, Tone } from "@/lib/content/types";

export type RouletteAngleHint = {
  working_title: string;
  pillar: TemplateType;
  hook_direction: string;
  unique_takeaway: string;
  visual_direction: string;
  do_not_repeat: string;
};

export type TopicRouletteSeed = {
  id: string;
  title: string;
  brief: string;
  preferredTone: Tone;
  templateHint: TemplateType | "auto";
  bestPostTypes: PostType[];
  visualDirection: string;
  contrastSetup: string;
  antiGenericNotes: string;
  angleVariants: RouletteAngleHint[];
};

type SelectRouletteSeedInput = {
  postType: PostType;
  quantity: number;
  selectedPlatforms: Platform[];
  recentPosts: Array<{
    headline: string | null;
    hook: string | null;
    pillar: string | null;
  }>;
};

export const topicRouletteSeeds: TopicRouletteSeed[] = [
  {
    id: "agent-manager-gap",
    title: "AI agents need managers, not cheerleaders",
    brief:
      "Create a practical campaign for AI builders about why agent workflows fail when founders treat agents like magic workers instead of managed teammates. Focus on delegation, context, review loops, and deciding what should stay human.",
    preferredTone: "contrarian",
    templateHint: "tutorial",
    bestPostTypes: ["single", "carousel", "thread"],
    visualDirection:
      "Muted builder desk template with a prompt recipe or workflow checklist. Avoid neon-heavy visuals.",
    contrastSetup:
      "Contrast founders who throw tasks at agents with founders who define the job, provide context, inspect outputs, and tighten the loop.",
    antiGenericNotes:
      "Do not say AI is a tool or use it wisely. Make this about actions: writes briefs, scopes tasks, reviews outputs, saves reusable prompts.",
    angleVariants: [
      {
        working_title: "The Agent Manager Gap",
        pillar: "tutorial",
        hook_direction:
          "Most AI agent failures are management failures, not model failures.",
        unique_takeaway:
          "An agent needs a job description before it needs another model upgrade.",
        visual_direction: "Prompt recipe block with three manager actions.",
        do_not_repeat: "Do not frame this as generic prompt engineering advice.",
      },
      {
        working_title: "Stop Delegating Vague Work",
        pillar: "founder_story",
        hook_direction:
          "Founders are outsourcing tasks before they understand the workflow.",
        unique_takeaway:
          "The human job shifts from doing the task to designing the loop.",
        visual_direction: "Founder note with one sharp quote and workflow labels.",
        do_not_repeat: "Do not reuse the manager/job-description metaphor.",
      },
      {
        working_title: "The Review Loop Is The Product",
        pillar: "tool_stack",
        hook_direction:
          "The best AI stack is useless without a review loop.",
        unique_takeaway:
          "Research, draft, review, and ship should be separate agent roles.",
        visual_direction: "Three role cards: Research agent, Drafting agent, Review agent.",
        do_not_repeat: "Do not list tools unless they support the role split.",
      },
      {
        working_title: "Where Agents Break",
        pillar: "meme",
        hook_direction:
          "AI agents say done, then ask for the context again.",
        unique_takeaway:
          "The joke should reveal that missing context creates fake progress.",
        visual_direction: "Dry builder meme setup/punchline text card.",
        do_not_repeat: "Do not make the punchline about robots replacing people.",
      },
    ],
  },
  {
    id: "ai-search-trust-shift",
    title: "AI search is changing how people decide what to trust",
    brief:
      "Create a Word of AI campaign about the shift from search rankings to answer engines. Teach builders why authority, source clarity, product proof, and useful explanations matter more when AI summarizes the web for users.",
    preferredTone: "news",
    templateHint: "news_digest",
    bestPostTypes: ["single", "carousel", "thread"],
    visualDirection:
      "Text-first newsroom style with one warning, one search/answer contrast, and a muted authority marker.",
    contrastSetup:
      "Contrast teams that chase keywords with teams that publish proof, explain tradeoffs, cite sources, and answer real buying questions.",
    antiGenericNotes:
      "Avoid SEO is dead cliches. Be specific about content actions builders can take.",
    angleVariants: [
      {
        working_title: "SEO Is Not Enough",
        pillar: "news_digest",
        hook_direction:
          "AI search does not reward the same kind of content that old search rewarded.",
        unique_takeaway:
          "Answer engines pull from trust signals, not just keyword density.",
        visual_direction: "News digest with search vs answer browser labels.",
        do_not_repeat: "Do not say SEO is dead without explaining the behavior shift.",
      },
      {
        working_title: "Proof Beats Keywords",
        pillar: "tutorial",
        hook_direction:
          "The content moat is no longer writing more. It is showing proof.",
        unique_takeaway:
          "Builders need examples, screenshots, comparisons, and named tradeoffs.",
        visual_direction: "Prompt recipe card for proof-based content.",
        do_not_repeat: "Do not repeat the answer engine framing.",
      },
      {
        working_title: "The New Trust Layer",
        pillar: "creator_economy",
        hook_direction:
          "AI search makes boring authority content easier to ignore.",
        unique_takeaway:
          "The winners will sound like operators, not content farms.",
        visual_direction: "Quote/stat layout with a single trust-layer line.",
        do_not_repeat: "Do not use generic personal-brand advice.",
      },
    ],
  },
  {
    id: "prompt-recipes-over-prompt-lists",
    title: "Prompt recipes beat prompt lists",
    brief:
      "Create a practical campaign for builders who save endless prompt lists but rarely turn them into repeatable workflows. Focus on role, task, context, constraints, examples, review criteria, and output format.",
    preferredTone: "tutorial",
    templateHint: "tutorial",
    bestPostTypes: ["single", "carousel", "thread"],
    visualDirection:
      "Minimal prompt block with a reusable recipe. Keep the image clean and save-worthy.",
    contrastSetup:
      "Contrast people who paste random prompts with people who define role, context, constraints, examples, and review checks.",
    antiGenericNotes:
      "Avoid prompt like a pro. Use concrete workflow steps and review behavior.",
    angleVariants: [
      {
        working_title: "Prompt Lists Are A Trap",
        pillar: "tutorial",
        hook_direction:
          "Saving 100 prompts does not make your workflow better.",
        unique_takeaway:
          "A prompt becomes useful when it has review criteria and context.",
        visual_direction: "Prompt recipe block with five fields.",
        do_not_repeat: "Do not turn this into a listicle of prompts.",
      },
      {
        working_title: "The Missing Prompt Field",
        pillar: "tool_stack",
        hook_direction:
          "Most bad prompts are missing the same thing: how to judge the output.",
        unique_takeaway:
          "Review criteria forces the model to aim at the right target.",
        visual_direction: "Tool stack style with prompt fields instead of tools.",
        do_not_repeat: "Do not reuse the 100 prompts framing.",
      },
      {
        working_title: "Use AI Like A Process",
        pillar: "founder_story",
        hook_direction:
          "The founder advantage is not better prompts. It is better loops.",
        unique_takeaway:
          "A saved workflow beats a clever one-off prompt.",
        visual_direction: "Founder note with a reusable loop diagram in text.",
        do_not_repeat: "Do not mention product CTAs.",
      },
    ],
  },
  {
    id: "tool-fatigue-stack-discipline",
    title: "Tool fatigue is killing AI builders",
    brief:
      "Create a campaign about why builders do not need another AI tab. They need fewer tools with clearer jobs. Focus on stack discipline, handoffs, audit trails, and deciding which tool owns which part of the workflow.",
    preferredTone: "contrarian",
    templateHint: "tool_stack",
    bestPostTypes: ["single", "carousel"],
    visualDirection:
      "Three-card stack layout with role-based labels, not placeholder Tool A labels.",
    contrastSetup:
      "Contrast builders who add every new AI tool with builders who assign tools to one job, test handoffs, and remove duplicates.",
    antiGenericNotes:
      "Avoid productivity hacks. Make the post about stack behavior and decision criteria.",
    angleVariants: [
      {
        working_title: "Your Stack Has Too Many Brains",
        pillar: "tool_stack",
        hook_direction:
          "Most AI stacks fail because every tool is trying to be the brain.",
        unique_takeaway:
          "Assign one tool to research, one to draft, one to review.",
        visual_direction: "Three role cards: Research, Draft, Review.",
        do_not_repeat: "Do not name random trendy tools unless the input gives them.",
      },
      {
        working_title: "The Handoff Test",
        pillar: "tutorial",
        hook_direction:
          "An AI tool only belongs in your stack if the handoff is clear.",
        unique_takeaway:
          "Test where information enters, changes, and gets reviewed.",
        visual_direction: "Checklist layout with handoff criteria.",
        do_not_repeat: "Do not repeat three-role card layout.",
      },
      {
        working_title: "New Tool, Same Problem",
        pillar: "meme",
        hook_direction:
          "The founder downloads another AI tool and still cannot ship the draft.",
        unique_takeaway:
          "The joke should point at tool collecting instead of workflow design.",
        visual_direction: "Meme text card with setup and punchline.",
        do_not_repeat: "Do not make this a generic SaaS roast.",
      },
    ],
  },
  {
    id: "taste-is-the-ai-moat",
    title: "Taste is becoming the AI builder moat",
    brief:
      "Create a campaign about why AI lowers the cost of producing output, but raises the value of judgment. Focus on selecting ideas, editing outputs, knowing what to delete, and making sharper calls.",
    preferredTone: "founder",
    templateHint: "creator_economy",
    bestPostTypes: ["single", "carousel", "reel"],
    visualDirection:
      "Editorial quote/stat treatment with a muted line and one strong claim.",
    contrastSetup:
      "Contrast builders who publish first drafts with builders who edit, compare alternatives, delete weak ideas, and ship only the useful version.",
    antiGenericNotes:
      "Do not say human creativity matters. Show what taste does in the workflow.",
    angleVariants: [
      {
        working_title: "Taste Is The Bottleneck",
        pillar: "creator_economy",
        hook_direction:
          "AI made output cheap. That made taste more expensive.",
        unique_takeaway:
          "The edge is knowing which output deserves to ship.",
        visual_direction: "Large pull quote with one clean subhead.",
        do_not_repeat: "Do not frame this as AI vs humans.",
      },
      {
        working_title: "First Drafts Are Everywhere",
        pillar: "founder_story",
        hook_direction:
          "The internet is filling with AI first drafts.",
        unique_takeaway:
          "Builders who edit harder will look more trustworthy.",
        visual_direction: "Founder note with first draft vs final draft contrast.",
        do_not_repeat: "Do not reuse cheap output phrasing.",
      },
      {
        working_title: "The Delete Button Is The Skill",
        pillar: "tutorial",
        hook_direction:
          "The highest-leverage AI skill is deleting weak outputs.",
        unique_takeaway:
          "A review checklist creates better taste under speed.",
        visual_direction: "Prompt recipe with reject/edit/ship checklist.",
        do_not_repeat: "Do not use generic quality advice.",
      },
    ],
  },
  {
    id: "ai-coding-review-debt",
    title: "AI coding assistants create review debt",
    brief:
      "Create a practical campaign about how AI coding tools speed up code creation but increase the need for review, tests, and architectural judgment. Write for builders using Cursor, Claude Code, Codex, or similar tools.",
    preferredTone: "educational",
    templateHint: "tutorial",
    bestPostTypes: ["single", "carousel", "thread"],
    visualDirection:
      "Prompt/code review card with a small code snippet or review checklist.",
    contrastSetup:
      "Contrast builders who accept AI code immediately with builders who inspect diffs, run tests, trace edge cases, and remove overbuilt abstractions.",
    antiGenericNotes:
      "Avoid AI will not replace developers. Focus on exact review actions.",
    angleVariants: [
      {
        working_title: "AI Code Is Not Done",
        pillar: "tutorial",
        hook_direction:
          "The faster AI writes code, the more important review becomes.",
        unique_takeaway:
          "Speed creates review debt if you do not inspect the diff.",
        visual_direction: "Code review checklist block.",
        do_not_repeat: "Do not use replacement discourse.",
      },
      {
        working_title: "The Diff Is The Source Of Truth",
        pillar: "tool_stack",
        hook_direction:
          "Your AI coding workflow should start after the model stops talking.",
        unique_takeaway:
          "The real workflow is prompt, diff, test, simplify, ship.",
        visual_direction: "Four-step workflow card.",
        do_not_repeat: "Do not repeat review debt headline.",
      },
      {
        working_title: "Vibe Coding Needs Guardrails",
        pillar: "founder_story",
        hook_direction:
          "Vibe coding ships fast until the app has real users.",
        unique_takeaway:
          "Guardrails keep speed from turning into cleanup work.",
        visual_direction: "Founder note with a warning and checklist.",
        do_not_repeat: "Do not mock beginners.",
      },
    ],
  },
  {
    id: "ai-wrapper-fatigue",
    title: "Every product is getting an AI wrapper",
    brief:
      "Create a dry, useful campaign about AI wrapper fatigue. The point is not to dunk on AI features; it is to teach builders how to tell the difference between a useful AI workflow and a label slapped onto an old product.",
    preferredTone: "viral",
    templateHint: "meme",
    bestPostTypes: ["single", "reel", "carousel"],
    visualDirection:
      "Meme or creator-economy card with a clean setup and punchline. Keep it sharp, not mean.",
    contrastSetup:
      "Contrast teams that add AI labels with teams that remove steps, expose better decisions, and reduce real user work.",
    antiGenericNotes:
      "Avoid broad anti-AI takes. The useful point is how to judge feature substance.",
    angleVariants: [
      {
        working_title: "It's AI Powered",
        pillar: "meme",
        hook_direction:
          "Every company right now: same workflow, new AI label.",
        unique_takeaway:
          "A real AI feature should remove a step, not rename it.",
        visual_direction: "Meme setup/punchline text card.",
        do_not_repeat: "Do not depend on a copyrighted movie image.",
      },
      {
        working_title: "AI Feature Or AI Sticker",
        pillar: "tutorial",
        hook_direction:
          "There is a simple test for whether an AI feature matters.",
        unique_takeaway:
          "Ask what decision it improves or what step it removes.",
        visual_direction: "Checklist with feature substance test.",
        do_not_repeat: "Do not reuse every company right now.",
      },
      {
        working_title: "The Wrapper Trap",
        pillar: "creator_economy",
        hook_direction:
          "AI wrappers get attention. Workflow changes keep users.",
        unique_takeaway:
          "Distribution can sell the wrapper once; utility keeps it alive.",
        visual_direction: "Quote card with wrapper vs workflow contrast.",
        do_not_repeat: "Do not mention product promotion.",
      },
    ],
  },
  {
    id: "founder-attention-operating-system",
    title: "Founders need an attention operating system",
    brief:
      "Create a campaign about using AI to reduce founder context switching. Focus on capture, triage, batching, review, and publishing decisions. Tie it to creator/operators building in public without pitching any product.",
    preferredTone: "founder",
    templateHint: "founder_story",
    bestPostTypes: ["single", "carousel", "thread"],
    visualDirection:
      "Founder note with a calm, minimal operating-system framework.",
    contrastSetup:
      "Contrast founders who react to every idea with founders who capture inputs, batch decisions, review outputs, and schedule deliberate next actions.",
    antiGenericNotes:
      "Do not pitch productivity. Make this about the operating rhythm.",
    angleVariants: [
      {
        working_title: "Your Attention Needs A Queue",
        pillar: "founder_story",
        hook_direction:
          "The founder problem is not lack of ideas. It is unmanaged inputs.",
        unique_takeaway:
          "A queue turns scattered ideas into reviewed decisions.",
        visual_direction: "Founder note with capture/triage/review/ship.",
        do_not_repeat: "Do not mention Content OS by name.",
      },
      {
        working_title: "Batch The Thinking",
        pillar: "tutorial",
        hook_direction:
          "AI helps more when it batches thinking instead of interrupting it.",
        unique_takeaway:
          "Separate idea capture from content review and scheduling.",
        visual_direction: "Prompt recipe for batching decisions.",
        do_not_repeat: "Do not reuse queue metaphor.",
      },
      {
        working_title: "Operators Don't Need More Tabs",
        pillar: "creator_economy",
        hook_direction:
          "Creators burn out when every idea becomes a new task.",
        unique_takeaway:
          "The workflow should decide what waits, what ships, and what dies.",
        visual_direction: "Creator economy quote/stat style.",
        do_not_repeat: "Do not use hustle language.",
      },
    ],
  },
];

export function selectRouletteSeed({
  postType,
  quantity,
  selectedPlatforms,
  recentPosts,
}: SelectRouletteSeedInput) {
  const recentText = recentPosts
    .flatMap((post) => [post.headline, post.hook, post.pillar])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const preferred = topicRouletteSeeds.filter((seed) =>
    seed.bestPostTypes.includes(postType),
  );
  const pool = preferred.length ? preferred : topicRouletteSeeds;
  const freshPool = pool.filter((seed) => !isRecentlyUsed(seed, recentText));
  const candidates = freshPool.length ? freshPool : pool;
  const channelOffset = selectedPlatforms.includes("linkedin") ? 2 : 0;
  const postTypeOffset = Math.max(0, ["single", "carousel", "reel", "thread"].indexOf(postType));
  const dayOffset = Math.floor(Date.now() / 86_400_000);
  const index = (dayOffset + quantity + channelOffset + postTypeOffset) % candidates.length;

  return candidates[index] || topicRouletteSeeds[0];
}

export function buildRouletteBrief(seed: TopicRouletteSeed, quantity: number) {
  const angleHints = seed.angleVariants
    .slice(0, Math.max(1, Math.min(quantity, seed.angleVariants.length)))
    .map(
      (angle, index) =>
        `${index + 1}. ${angle.working_title}: ${angle.hook_direction} Takeaway: ${angle.unique_takeaway}. Visual: ${angle.visual_direction}. Avoid: ${angle.do_not_repeat}`,
    )
    .join("\n");

  return [
    seed.brief,
    "",
    `Visual direction: ${seed.visualDirection}`,
    `Contrast setup: ${seed.contrastSetup}`,
    `Anti-generic notes: ${seed.antiGenericNotes}`,
    "",
    "Suggested campaign angles:",
    angleHints,
  ].join("\n");
}

function isRecentlyUsed(seed: TopicRouletteSeed, recentText: string) {
  if (!recentText) {
    return false;
  }

  const titleTokens = seed.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 4);
  const idTokens = seed.id.split("-").filter((token) => token.length > 4);
  const tokens = [...new Set([...titleTokens, ...idTokens])];

  return tokens.some((token) => recentText.includes(token));
}
