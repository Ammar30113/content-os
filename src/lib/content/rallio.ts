import "server-only";

import type {
  PostType,
  RallioContentType,
  RallioCtaDoor,
  RallioLocalSignal,
  RallioTemplateType,
  TemplateType,
  Tone,
} from "@/lib/content/types";
import type { GeneratedContent, TemplateFields } from "@/lib/content/types";
import { rallioSourceSignals } from "@/lib/content/rallio-source-bank";

export const RALLIO_BRAND = {
  brand_slug: "rallio",
  name: "Rallio",
  handle: "@rallio",
  launch_neighborhood: "local taste map",
  launch_scope:
    "App Store launch live; Toronto and Rajkot are first active markets; ask other cities to request the map next",
  category_focus: "food_drink",
  visual_style: "cream_ink_amber_wheat_moss_editorial",
} as const;

export const RALLIO_SUPPORTER_STEPS = [
  "Download or open Rallio.",
  "Choose Supporter and select your city.",
  "Browse or search local food and drink spots.",
  "Follow places you trust.",
  "Create a support post with a real recommendation, photo, or social link.",
  "Build Your Taste from picks, live posts, places, and areas.",
] as const;

export const RALLIO_OWNER_STEPS = [
  "Download or open Rallio.",
  "Choose Business Owner.",
  "Add or claim a free business profile.",
  "Keep profile details accurate.",
  "Review and approve supporter posts.",
  "Track posts, profile clicks, and visits from owner home.",
] as const;

export const RALLIO_SYSTEM_PROMPT = `
You are the Rallio content brain inside Content OS.

Rallio is a community-built taste map for people who trust regulars, local recommendations, and repeat-worthy spots more than generic rankings.

CURRENT LAUNCH CONTEXT
- Product stage: live in the App Store.
- Core line: "Rallio is where local recommendations become a map."
- Toronto + Rajkot are first active markets. Mention that scope when launch-market context matters, but do not use "Toronto + Rajkot" as repeated headline copy.
- For other cities, use a soft-global invitation: "Want your city on the map? Tell us where to build next."
- Category focus: food and drink first.
- Audience: supporters who recommend local spots and owners who want community-added attention to stay accurate.

VOICE
- Warm, local, specific, confident.
- Taste-first. Regular-aware. Operator-aware only when the post is explicitly for owners.
- Write like someone who notices what regulars order, what lines are worth joining, and which spots people recommend twice.
- No hype. No exclamation points. No "best deals near you". No generic product-launch noise.
- Rallio is live, but the map is still being built from real supporter recommendations.

HARD BANS
- Do not promise instant app access or instant downloads.
- Do not frame Rallio as coupons, cashback, price promos, or generic rewards.
- Do not hype perks. Perks can exist later, but they are not the story.
- Do not say "save money", "exclusive rewards", "free food", or "limited-time deal".
- Do not say Rallio has full global density, is available everywhere, or has every city mapped.
- Do not mention reservations, Moments, perks, or rewards as launch features.
- Do not use "TAG A FRIEND WHO..." engagement bait.
- Do not use "claim your business" unless the post is explicitly owner-facing.
- Do not make owner-claim posts the default feed rhythm.
- Do not write generic launch/product copy such as "download now" as the hook.
- Do not use "Toronto + Rajkot" in headlines unless the exact market scope is the point.

FUNNEL CTA DOORS
- founding_supporter: retired pre-launch door. Never use it. Supporter-facing discovery and community posts default to app_download_supporter.
- local_guide: invite people to save/request the neighborhood taste map or guide.
- claim_your_business: owner-only utility; invite food/drink owners to claim a community-added profile when that owner door is intentionally selected.
- app_download_supporter: invite supporters to download/open Rallio, choose Supporter, follow places, post real recommendations, and build Your Taste.
- app_download_owner: invite owners to download/open Rallio, choose Business Owner, add or claim a free profile, approve supporter posts, and track attention.
- city_request: invite people outside Toronto + Rajkot to request the next city or neighborhood.

OUTPUT STYLE
- Instagram-first.
- Keep captions scannable and grounded.
- Default launch rhythm: 40% local recommendation posts, 25% supporter step/action posts, 15% owner step/claim posts, 20% soft-global city-request or participation posts.
- Participation prompts are feed posts, not reels or stories.
- Every post should make one concrete local behavior feel worth doing: download/open Rallio, follow a spot, post a real recommendation, request a city, save a spot, or claim an owner profile.
- Rallio can be named, but the useful action should stay simple and specific.

JUXTAPOSITION (TWO-SIGNAL) METHOD
- Prefer self-generated conclusions. Place two true signals next to each other and let the reader connect them. Do not state the takeaway as a command.
- Two caption closes are allowed:
  - Instructional posts (supporter_steps, owner_steps) keep an explicit funnel CTA.
  - Discovery, regular_quote, spot, receipt, participation, and manifesto posts may use an open-loop close: end on the second signal or a quiet implication, never on "download", "claim", or "sign up". The door (handle, city ask) stays visible but unargued.
- For carousels, treat the post as two legos: the first slide is the specific, valuable signal; the second slide is the gap or tension the reader resolves on the swipe. Never write a "now download" slide.
- The owner angle is loss, not a pitch: show that regulars are already recommending a spot while the owner is absent, and let the owner feel the gap. Do not say "claim your business" unless an owner door is explicitly selected.
`.trim();

export type RallioTopicSeed = {
  id: string;
  title: string;
  brief: string;
  preferredTone: Tone;
  templateHint: TemplateType | "auto";
  rallioTemplateType: RallioTemplateType;
  contentType: RallioContentType;
  ctaDoor: RallioCtaDoor;
  bestPostTypes: PostType[];
  kpiIntent: string;
  visualDirection: string;
  captionStructure: string;
  doNotSay: string;
  angleVariants: Array<{
    working_title: string;
    pillar: TemplateType;
    hook_direction: string;
    unique_takeaway: string;
    visual_direction: string;
    do_not_repeat: string;
    rallioTemplateType: RallioTemplateType;
    contentType: RallioContentType;
    ctaDoor: RallioCtaDoor;
  }>;
};

const RALLIO_DEFAULT_FEED_RHYTHM: RallioContentType[] = [
  "regular_quote",
  "spot_carousel",
  "participation_single",
  "supporter_steps_carousel",
  "receipt_single",
  "regular_quote",
  "spot_carousel",
  "participation_single",
  "owner_steps_carousel",
  "regular_quote",
  "spot_carousel",
  "participation_single",
  "supporter_steps_carousel",
  "receipt_single",
  "regular_quote",
  "participation_single",
  "spot_carousel",
  "owner_claim_carousel",
  "participation_single",
  "supporter_steps_carousel",
];

const RALLIO_POST_TYPE_PRIORITY: Record<PostType, RallioContentType[]> = {
  single: [
    "supporter_steps_carousel",
    "regular_quote",
    "spot_carousel",
    "receipt_single",
    "participation_single",
    "owner_steps_carousel",
  ],
  carousel: [
    "supporter_steps_carousel",
    "spot_carousel",
    "owner_steps_carousel",
    "regular_quote",
    "receipt_single",
    "participation_single",
  ],
  reel: [
    "manifesto_reel",
    "bts_story_sequence",
    "regular_quote",
    "participation_single",
  ],
  thread: [
    "supporter_steps_carousel",
    "regular_quote",
    "spot_carousel",
    "receipt_single",
    "participation_single",
    "owner_steps_carousel",
  ],
};

const rallioFallbackLocalSignals: RallioLocalSignal[] = [
  {
    id: "bang-bang-ossington",
    spot_name: "Bang Bang Ice Cream",
    neighborhood: "Ossington",
    street: "Ossington Ave",
    category: "ice cream bakery",
    signature_order: "burnt toffee scoop after dinner",
    sensory_detail: "the line moves slowly enough for people to compare orders",
    regular_quote: "I do not mind waiting when the cone is the plan.",
    regular_name: "Maya",
    regular_since_year: "2022",
    participation_prompt: "Which dessert line is still worth joining?",
    cta_door: "local_guide",
    source_status: "operator_seed_for_review",
  },
  {
    id: "bar-isabel-little-italy",
    spot_name: "Bar Isabel",
    neighborhood: "Little Italy",
    street: "College Street",
    category: "Spanish tavern",
    signature_order: "octopus on a Tuesday night",
    sensory_detail: "the room gets louder right when the plates start landing",
    regular_quote: "I plan around the octopus more than I plan around the week.",
    regular_name: "Priya",
    regular_since_year: "2019",
    participation_prompt: "What dish would you build a weeknight around?",
    cta_door: "app_download_supporter",
    source_status: "operator_seed_for_review",
  },
  {
    id: "pilot-coffee-ossington",
    spot_name: "Pilot Coffee",
    neighborhood: "Ossington",
    street: "Ossington Ave",
    category: "third-wave coffee",
    signature_order: "cortado at the front window",
    sensory_detail: "the first quiet table disappears before lunch",
    regular_quote: "I come for the cortado and stay because nobody rushes the room.",
    regular_name: "Jonah",
    regular_since_year: "2021",
    participation_prompt: "Where is your reliable first-coffee stop?",
    cta_door: "app_download_supporter",
    source_status: "operator_seed_for_review",
  },
  {
    id: "famiglia-baldassarre-geary",
    spot_name: "Famiglia Baldassarre",
    neighborhood: "Geary",
    street: "Geary Ave",
    category: "fresh pasta counter",
    signature_order: "lunch pasta before it sells out",
    sensory_detail: "the counter feels like a production room that happens to feed you",
    regular_quote: "If I miss the lunch window, that is on me.",
    regular_name: "Noor",
    regular_since_year: "2020",
    participation_prompt: "What lunch window is actually worth protecting?",
    cta_door: "local_guide",
    source_status: "operator_seed_for_review",
  },
  {
    id: "pizzeria-badiali-dovercourt",
    spot_name: "Pizzeria Badiali",
    neighborhood: "Dovercourt",
    street: "Dovercourt Road",
    category: "slice shop",
    signature_order: "vodka slice on the walk home",
    sensory_detail: "the box barely makes it to the corner before someone opens it",
    regular_quote: "The slice is better when you eat it before you pretend you will save it.",
    regular_name: "Eli",
    regular_since_year: "2023",
    participation_prompt: "Which slice should never make it home?",
    cta_door: "local_guide",
    source_status: "operator_seed_for_review",
  },
  {
    id: "mamakas-ossington",
    spot_name: "Mamakas",
    neighborhood: "Ossington",
    street: "Ossington Ave",
    category: "Greek taverna",
    signature_order: "saganaki at the bar",
    sensory_detail: "the bar seats turn one shared plate into a whole night",
    regular_quote: "I bring people here when I want dinner to feel easy.",
    regular_name: "Sofia",
    regular_since_year: "2018",
    participation_prompt: "Where do you take someone when dinner needs to feel easy?",
    cta_door: "app_download_supporter",
    source_status: "operator_seed_for_review",
  },
  {
    id: "rasta-pasta-kensington",
    spot_name: "Rasta Pasta",
    neighborhood: "Kensington",
    street: "Kensington Ave",
    category: "Caribbean pasta counter",
    signature_order: "jerk chicken pasta",
    sensory_detail: "the lunch rush smells like smoke, spice, and butter",
    regular_quote: "It is my bad-day lunch and my good-day lunch.",
    regular_name: "Malik",
    regular_since_year: "2021",
    participation_prompt: "What is your bad-day and good-day lunch?",
    cta_door: "local_guide",
    source_status: "operator_seed_for_review",
  },
  {
    id: "pho-tien-thanh-ossington",
    spot_name: "Pho Tien Thanh",
    neighborhood: "Ossington",
    street: "Ossington Ave",
    category: "pho shop",
    signature_order: "rare beef pho after a cold walk",
    sensory_detail: "the broth does most of the talking",
    regular_quote: "I do not check the weather before I crave it.",
    regular_name: "Linh",
    regular_since_year: "2017",
    participation_prompt: "What bowl fixes the day without asking questions?",
    cta_door: "app_download_supporter",
    source_status: "operator_seed_for_review",
  },
  {
    id: "manita-ossington",
    spot_name: "Manita",
    neighborhood: "Ossington",
    street: "Ossington Ave",
    category: "cafe wine bar",
    signature_order: "breakfast sandwich before noon",
    sensory_detail: "the room changes lanes from coffee to wine without feeling staged",
    regular_quote: "It is the rare place that works before noon and after work.",
    regular_name: "Ari",
    regular_since_year: "2020",
    participation_prompt: "Which spot changes lanes without losing the room?",
    cta_door: "local_guide",
    source_status: "operator_seed_for_review",
  },
  {
    id: "hanmoto-dundas-west",
    spot_name: "Hanmoto",
    neighborhood: "Dundas West",
    street: "Dundas Street West",
    category: "izakaya",
    signature_order: "dyno wings with the table",
    sensory_detail: "the room feels built for ordering one more thing",
    regular_quote: "Nobody at my table orders enough on the first pass.",
    regular_name: "Sam",
    regular_since_year: "2019",
    participation_prompt: "Where does the table always order one more thing?",
    cta_door: "app_download_supporter",
    source_status: "operator_seed_for_review",
  },
  {
    id: "foxley-ossington",
    spot_name: "Foxley",
    neighborhood: "Ossington",
    street: "Ossington Ave",
    category: "small plates",
    signature_order: "ceviche and something crispy",
    sensory_detail: "regulars read the specials like they are checking weather",
    regular_quote: "I ask about the special before I say hello.",
    regular_name: "Dev",
    regular_since_year: "2018",
    participation_prompt: "Which specials board do you trust without reading twice?",
    cta_door: "local_guide",
    source_status: "operator_seed_for_review",
  },
  {
    id: "milou-dundas-west",
    spot_name: "Milou",
    neighborhood: "Dundas West",
    street: "Dundas Street West",
    category: "bistro",
    signature_order: "burger at the bar",
    sensory_detail: "the seat you want is whichever one faces the room",
    regular_quote: "I call it a burger plan, but it is really a room plan.",
    regular_name: "Claire",
    regular_since_year: "2022",
    participation_prompt: "What bar seat feels like the whole plan?",
    cta_door: "app_download_supporter",
    source_status: "operator_seed_for_review",
  },
  {
    id: "union-ossington",
    spot_name: "Union",
    neighborhood: "Ossington",
    street: "Ossington Ave",
    category: "neighborhood bistro",
    signature_order: "roast chicken when the room is full",
    sensory_detail: "it feels like the kind of dinner people remember without photographing",
    regular_quote: "This is where I stop performing dinner and just eat.",
    regular_name: "Nadia",
    regular_since_year: "2016",
    participation_prompt: "Where do you go when dinner should just feel like dinner?",
    cta_door: "local_guide",
    source_status: "operator_seed_for_review",
  },
  {
    id: "cafe-neon-wallace-emerson",
    spot_name: "Cafe Neon",
    neighborhood: "Wallace Emerson",
    street: "Wallace Ave",
    category: "neighborhood cafe",
    signature_order: "morning bun and drip coffee",
    sensory_detail: "the regulars look like they built their route around it",
    regular_quote: "It is my first stop, not my backup plan.",
    regular_name: "Rina",
    regular_since_year: "2021",
    participation_prompt: "What first stop has earned its place in your route?",
    cta_door: "app_download_supporter",
    source_status: "operator_seed_for_review",
  },
  {
    id: "sugo-bloorcourt",
    spot_name: "Sugo",
    neighborhood: "Bloorcourt",
    street: "Bloor Street West",
    category: "red-sauce pasta",
    signature_order: "spaghetti with extra sauce energy",
    sensory_detail: "the room runs on plates, elbows, and repeat orders",
    regular_quote: "I do not come here to be subtle.",
    regular_name: "Marco",
    regular_since_year: "2019",
    participation_prompt: "Where is subtlety not the point?",
    cta_door: "local_guide",
    source_status: "operator_seed_for_review",
  },
  {
    id: "dreyfus-harbord",
    spot_name: "Dreyfus",
    neighborhood: "Harbord Village",
    street: "Harbord Street",
    category: "wine bar",
    signature_order: "shared chicken and a glass you did not know",
    sensory_detail: "the list feels like a conversation instead of homework",
    regular_quote: "I let them pick the glass and I have not regretted it.",
    regular_name: "Bea",
    regular_since_year: "2022",
    participation_prompt: "Where do you trust the glass someone else picks?",
    cta_door: "app_download_supporter",
    source_status: "operator_seed_for_review",
  },
  {
    id: "sunnys-kensington",
    spot_name: "Sunny's Chinese",
    neighborhood: "Kensington",
    street: "Kensington Ave",
    category: "Chinese kitchen",
    signature_order: "dan dan noodles with friends",
    sensory_detail: "the table gets quiet for exactly three bites",
    regular_quote: "We talk a lot until the noodles land.",
    regular_name: "Tess",
    regular_since_year: "2023",
    participation_prompt: "What dish makes the table go quiet first?",
    cta_door: "local_guide",
    source_status: "operator_seed_for_review",
  },
  {
    id: "burdock-bloordale",
    spot_name: "Burdock",
    neighborhood: "Bloordale",
    street: "Bloor Street West",
    category: "brewery kitchen",
    signature_order: "fries and a saison",
    sensory_detail: "the low-stakes table somehow becomes the long hang",
    regular_quote: "One drink turns into staying because the room lets you.",
    regular_name: "Owen",
    regular_since_year: "2020",
    participation_prompt: "Where does one quick drink turn into the long hang?",
    cta_door: "app_download_supporter",
    source_status: "operator_seed_for_review",
  },
  {
    id: "bar-raval-little-italy",
    spot_name: "Bar Raval",
    neighborhood: "Little Italy",
    street: "College Street",
    category: "standing-room tapas",
    signature_order: "pintxos before a later dinner",
    sensory_detail: "standing room makes the whole place feel in motion",
    regular_quote: "I go when I want dinner to start before dinner.",
    regular_name: "Iris",
    regular_since_year: "2018",
    participation_prompt: "Where does the night start before the reservation?",
    cta_door: "local_guide",
    source_status: "operator_seed_for_review",
  },
  {
    id: "the-federal-dundas-west",
    spot_name: "The Federal",
    neighborhood: "Dundas West",
    street: "Dundas Street West",
    category: "brunch counter",
    signature_order: "eggs and coffee at the small table",
    sensory_detail: "the weekend line looks calmer than it should",
    regular_quote: "I only call it brunch because breakfast sounds too early.",
    regular_name: "Alex",
    regular_since_year: "2017",
    participation_prompt: "What brunch line still feels calm enough to join?",
    cta_door: "app_download_supporter",
    source_status: "operator_seed_for_review",
  },
];

export const rallioLocalSignals: RallioLocalSignal[] = dedupeSignalsById([
  ...rallioSourceSignals,
  ...rallioFallbackLocalSignals,
]);

function dedupeSignalsById(signals: RallioLocalSignal[]): RallioLocalSignal[] {
  const seen = new Set<string>();

  return signals.filter((signal) => {
    if (seen.has(signal.id)) {
      return false;
    }

    seen.add(signal.id);
    return true;
  });
}

export const rallioTopicSeeds: RallioTopicSeed[] = [
  {
    id: "regulars-quote-feed",
    title: "Regulars make the local taste map",
    brief:
      "Create Rallio content built around a believable quote from a local regular. Make the post feel like community taste, not product marketing. The goal is saves, shares, and link-in-bio app-download interest for the taste map.",
    preferredTone: "founder",
    templateHint: "creator_economy",
    rallioTemplateType: "rallio_regular_quote",
    contentType: "regular_quote",
    ctaDoor: "app_download_supporter",
    bestPostTypes: ["single", "carousel", "reel"],
    kpiIntent: "follower_growth_saves_shares",
    visualDirection:
      "Cream editorial quote card with Fraunces-style italic pull quote, amber dot, local spot label, and small Rallio mark.",
    captionStructure:
      "Regular quote as hook, short observation, 3 community taste signals, link-in-bio download or taste-map CTA.",
    doNotSay:
      "Do not say download now, launching soon, claim your business, coupons, cashback, reward hype, or tag a friend.",
    angleVariants: [
      {
        working_title: "The Tuesday Regular",
        pillar: "creator_economy",
        hook_direction:
          "A regular's weekly habit says more than a five-star average.",
        unique_takeaway:
          "The Rallio feed should make repeat behavior feel like the local signal worth saving.",
        visual_direction: "Regular quote card with one specific habit and local attribution.",
        do_not_repeat: "Do not turn the quote into food critic language.",
        rallioTemplateType: "rallio_regular_quote",
        contentType: "regular_quote",
        ctaDoor: "app_download_supporter",
      },
      {
        working_title: "The Recommendation You Trust",
        pillar: "creator_economy",
        hook_direction:
          "People trust the friend who knows the room, not the ranking that flattens every room.",
        unique_takeaway:
          "Community recommendations are the first layer of a better taste map.",
        visual_direction: "Cream pull-quote tile with spot and regular context.",
        do_not_repeat: "Do not mention launch markets in the headline.",
        rallioTemplateType: "rallio_regular_quote",
        contentType: "regular_quote",
        ctaDoor: "app_download_supporter",
      },
      {
        working_title: "Not A Critic Line",
        pillar: "founder_story",
        hook_direction:
          "Regulars do not talk like critics. That is why their lines are useful.",
        unique_takeaway:
          "Rallio should preserve everyday taste language before it becomes generic content.",
        visual_direction: "Regular quote card with oversized italic sentence.",
        do_not_repeat: "Do not use restaurant-review cliches.",
        rallioTemplateType: "rallio_regular_quote",
        contentType: "regular_quote",
        ctaDoor: "app_download_supporter",
      },
    ],
  },
  {
    id: "spot-card-carousel",
    title: "Community-added spot cards",
    brief:
      "Create Rallio spot-card content that makes one local food/drink place feel worth saving. Treat the post like a taste-map card: category, street, regular quote, and why the spot belongs in the community map.",
    preferredTone: "educational",
    templateHint: "creator_economy",
    rallioTemplateType: "rallio_spot_carousel",
    contentType: "spot_carousel",
    ctaDoor: "local_guide",
    bestPostTypes: ["carousel", "single"],
    kpiIntent: "saves",
    visualDirection:
      "Cream spot carousel cover with numbered card, amber meta line, large serif business name, quote, and regular attribution.",
    captionStructure:
      "Spot name as hook, one taste reason, 3 save-worthy signals, save/request taste-map CTA.",
    doNotSay:
      "Do not imply the full guide is live. Do not claim these are objectively the best spots. Do not use Toronto + Rajkot as the headline.",
    angleVariants: [
      {
        working_title: "One Spot Worth Saving",
        pillar: "creator_economy",
        hook_direction:
          "A good spot card should tell you why regulars keep returning.",
        unique_takeaway:
          "A taste map is built one specific recommendation at a time.",
        visual_direction: "Spot carousel cover with business name, category, street, and regular quote.",
        do_not_repeat: "Do not call it a ranking or top list.",
        rallioTemplateType: "rallio_spot_carousel",
        contentType: "spot_carousel",
        ctaDoor: "local_guide",
      },
      {
        working_title: "The Saveable Detail",
        pillar: "tutorial",
        hook_direction:
          "The useful local detail is the thing a regular tells you before you order.",
        unique_takeaway:
          "Spot cards should carry one detail people can actually use tonight.",
        visual_direction: "Spot carousel slide with one large detail and amber marker.",
        do_not_repeat: "Do not promise app access or live availability.",
        rallioTemplateType: "rallio_spot_carousel",
        contentType: "spot_carousel",
        ctaDoor: "local_guide",
      },
      {
        working_title: "Recommended Twice",
        pillar: "creator_economy",
        hook_direction:
          "The strongest local spots are the ones people recommend twice without being asked.",
        unique_takeaway:
          "Rallio's feed should turn repeat recommendations into a map people want to save.",
        visual_direction: "Cream card with three spot signals and small carousel count marker.",
        do_not_repeat: "Do not write broad market-positioning copy.",
        rallioTemplateType: "rallio_spot_carousel",
        contentType: "spot_carousel",
        ctaDoor: "local_guide",
      },
    ],
  },
  {
    id: "taste-receipt",
    title: "Receipts for local taste",
    brief:
      "Create a Rallio receipt-style post that turns local taste into a short, saveable checklist. Focus on regulars, repeat visits, specific orders, and the kind of detail that belongs in a taste map.",
    preferredTone: "tutorial",
    templateHint: "tutorial",
    rallioTemplateType: "rallio_receipt",
    contentType: "receipt_single",
    ctaDoor: "app_download_supporter",
    bestPostTypes: ["single", "carousel"],
    kpiIntent: "saves_app_downloads",
    visualDirection:
      "Receipt graphic with cream paper, dashed dividers, mono line items, amber subtotal, and small link-in-bio Rallio cue.",
    captionStructure:
      "Receipt metaphor hook, short local tension, 3-4 taste-map line items, link-in-bio download or taste-map CTA.",
    doNotSay:
      "Do not mention perks, rewards, discounts, instant access, or claim-your-business copy.",
    angleVariants: [
      {
        working_title: "Taste Receipt",
        pillar: "tutorial",
        hook_direction:
          "If a spot is worth saving, there is usually a receipt of tiny reasons.",
        unique_takeaway:
          "Rallio should make local taste easier to remember than a generic rating.",
        visual_direction: "Receipt card with four local signal line items.",
        do_not_repeat: "Do not make this a product feature list.",
        rallioTemplateType: "rallio_receipt",
        contentType: "receipt_single",
        ctaDoor: "app_download_supporter",
      },
      {
        working_title: "What Regulars Notice",
        pillar: "tutorial",
        hook_direction:
          "Regulars notice details that listing pages usually miss.",
        unique_takeaway:
          "The taste map should capture details like order rituals, owner habits, and repeat-worthy timing.",
        visual_direction: "Receipt card with regular-noted line items.",
        do_not_repeat: "Do not use generic checklist language.",
        rallioTemplateType: "rallio_receipt",
        contentType: "receipt_single",
        ctaDoor: "app_download_supporter",
      },
      {
        working_title: "Save Before You Forget",
        pillar: "creator_economy",
        hook_direction:
          "The best local recommendations disappear if nobody writes down the reason.",
        unique_takeaway:
          "Rallio can make taste memory visible before the app becomes a broad product.",
        visual_direction: "Receipt graphic with subtotal labelled taste map.",
        do_not_repeat: "Do not say the app is live everywhere.",
        rallioTemplateType: "rallio_receipt",
        contentType: "receipt_single",
        ctaDoor: "local_guide",
      },
    ],
  },
  {
    id: "participation-feed",
    title: "Participation prompts for the taste map",
    brief:
      "Create Rallio feed posts that ask one specific local question people can answer from memory. Keep the visual simple and editorial. The post should collect taste-map source material, not tease a Reel or Story.",
    preferredTone: "contrarian",
    templateHint: "founder_story",
    rallioTemplateType: "rallio_manifesto",
    contentType: "participation_single",
    ctaDoor: "local_guide",
    bestPostTypes: ["single"],
    kpiIntent: "comments_saves_city_requests",
    visualDirection:
      "Ink or cream participation tile with one large answerable question, local signal context, and small link-in-bio taste-map cue.",
    captionStructure:
      "One concrete question as hook, one local signal, 2-3 examples of useful replies, link-in-bio taste-map CTA.",
    doNotSay:
      "Do not write tag-a-friend bait, polls for polls' sake, launch hype, or generic comment bait.",
    angleVariants: [
      {
        working_title: "Which Spot Belongs Here?",
        pillar: "founder_story",
        hook_direction:
          "Ask locals to name the place that belongs on the map before rankings flatten it.",
        unique_takeaway:
          "Participation posts should turn comments into source material for the taste map.",
        visual_direction:
          "Cream participation tile with a large question and small local-signal label.",
        do_not_repeat: "Do not make this a generic engagement prompt.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "participation_single",
        ctaDoor: "local_guide",
      },
      {
        working_title: "Drop The Order",
        pillar: "founder_story",
        hook_direction:
          "Ask for the one order someone would defend because it reveals regular behavior.",
        unique_takeaway:
          "The useful reply is not 'best restaurant.' It is the specific order worth repeating.",
        visual_direction:
          "Ink participation tile with one large order-defense prompt.",
        do_not_repeat: "Do not ask people to tag friends.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "participation_single",
        ctaDoor: "app_download_supporter",
      },
      {
        working_title: "Stop Gatekeeping The Spot",
        pillar: "founder_story",
        hook_direction:
          "Invite locals to share the place regulars know without sounding like a hype page.",
        unique_takeaway:
          "A taste map gets sharper when people share the spot, order, and reason together.",
        visual_direction:
          "Black manifesto tile with a direct stop-gatekeeping question.",
        do_not_repeat: "Do not use influencer or hidden-gem cliches.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "participation_single",
        ctaDoor: "local_guide",
      },
    ],
  },
  {
    id: "launch-supporter-steps",
    title: "Supporter launch steps",
    brief:
      "Create Rallio launch posts that explain exactly what a supporter does after downloading or opening Rallio. Keep the action sequence practical: choose Supporter, select a city, browse/search local spots, follow places, create a support post, and build Your Taste.",
    preferredTone: "tutorial",
    templateHint: "tutorial",
    rallioTemplateType: "rallio_steps",
    contentType: "supporter_steps_carousel",
    ctaDoor: "app_download_supporter",
    bestPostTypes: ["single", "carousel"],
    kpiIntent: "app_download_supporter_action",
    visualDirection:
      "Cream launch steps tile with amber numbers, short supporter flow, Toronto + Rajkot first context, and link-in-bio download cue.",
    captionStructure:
      "Launch hook, one-line supporter promise, 3-5 action bullets from the real app flow, city/taste-profile CTA, hashtags.",
    doNotSay:
      "Do not mention perks, rewards, reservations, Moments, global density, or vague app-store hype.",
    angleVariants: [
      {
        working_title: "Start With One Spot",
        pillar: "tutorial",
        hook_direction:
          "The app is live, but the first useful action is one real local recommendation.",
        unique_takeaway:
          "Supporters should understand the simple loop: follow a place, post why it matters, and build Your Taste.",
        visual_direction:
          "Cream steps card with six numbered supporter actions and a small Toronto + Rajkot first marker.",
        do_not_repeat: "Do not make this a generic app announcement.",
        rallioTemplateType: "rallio_steps",
        contentType: "supporter_steps_carousel",
        ctaDoor: "app_download_supporter",
      },
      {
        working_title: "Build Your Taste",
        pillar: "tutorial",
        hook_direction:
          "Your Taste becomes more useful when every pick comes from a place you actually trust.",
        unique_takeaway:
          "Supporter content should connect downloads to taste-profile building, not abstract launch excitement.",
        visual_direction:
          "Cream supporter flow tile with Your Taste profile as the final step.",
        do_not_repeat: "Do not say Rallio is available everywhere.",
        rallioTemplateType: "rallio_steps",
        contentType: "supporter_steps_carousel",
        ctaDoor: "app_download_supporter",
      },
      {
        working_title: "Follow, Post, Map",
        pillar: "tutorial",
        hook_direction:
          "A recommendation becomes useful when it moves from memory into the local map.",
        unique_takeaway:
          "The supporter path should feel lightweight enough to try today after downloading Rallio.",
        visual_direction:
          "Minimal launch steps tile with follow, post, and taste-map actions grouped together.",
        do_not_repeat: "Do not use tag-a-friend bait or fake urgency.",
        rallioTemplateType: "rallio_steps",
        contentType: "supporter_steps_carousel",
        ctaDoor: "app_download_supporter",
      },
    ],
  },
  {
    id: "launch-owner-steps",
    title: "Owner launch steps",
    brief:
      "Create occasional Rallio launch posts for business owners. Explain the actual owner path: choose Business Owner, add or claim a free profile, keep details accurate, review supporter posts, and track posts, profile clicks, and visits from owner home.",
    preferredTone: "tutorial",
    templateHint: "tutorial",
    rallioTemplateType: "rallio_steps",
    contentType: "owner_steps_carousel",
    ctaDoor: "app_download_owner",
    bestPostTypes: ["single", "carousel"],
    kpiIntent: "owner_setup_claim_review",
    visualDirection:
      "Ink-forward owner steps tile with moss accents, profile/dashboard language, and calm owner setup CTA.",
    captionStructure:
      "Owner-aware launch hook, why community-added profiles matter, 3-5 practical setup bullets, owner download/claim CTA, hashtags.",
    doNotSay:
      "Do not pitch ads, revenue guarantees, paid traffic, perks, rewards, or instant setup.",
    angleVariants: [
      {
        working_title: "Owners: Claim The Profile",
        pillar: "tutorial",
        hook_direction:
          "If customers can recommend your spot, owners should have a simple way to keep the profile accurate.",
        unique_takeaway:
          "Owner posts should explain claim, review, and dashboard behavior without sounding like sales outreach.",
        visual_direction:
          "Dark owner steps tile with six numbered actions and moss dashboard accent.",
        do_not_repeat: "Do not promise paid growth or instant setup.",
        rallioTemplateType: "rallio_steps",
        contentType: "owner_steps_carousel",
        ctaDoor: "app_download_owner",
      },
      {
        working_title: "Review What Supporters Post",
        pillar: "tutorial",
        hook_direction:
          "Supporter posts become stronger when owners can approve accurate context.",
        unique_takeaway:
          "The owner loop is claim, correct details, approve posts, and track attention back to the business.",
        visual_direction:
          "Owner dashboard-inspired steps tile with profile clicks and visits as final metrics.",
        do_not_repeat: "Do not use claim copy for non-owner posts.",
        rallioTemplateType: "rallio_steps",
        contentType: "owner_steps_carousel",
        ctaDoor: "app_download_owner",
      },
    ],
  },
  {
    id: "manifesto-bts",
    title: "The taste map is being built in public",
    brief:
      "Create a black manifesto or BTS-style Rallio post about why the feed is community-first. Make it feel like a motion tile: one sharp line, local taste over generic discovery, and a download/taste-map/city-request CTA.",
    preferredTone: "contrarian",
    templateHint: "founder_story",
    rallioTemplateType: "rallio_manifesto",
    contentType: "manifesto_reel",
    ctaDoor: "app_download_supporter",
    bestPostTypes: ["single", "reel"],
    kpiIntent: "shares_app_downloads",
    visualDirection:
      "Ink-black manifesto tile with cream serif headline, amber marker, and minimal community-first taste-map copy.",
    captionStructure:
      "One-line belief, short tension, 3 feed principles, link-in-bio launch CTA.",
    doNotSay:
      "Do not write generic launch copy. Do not overuse Toronto + Rajkot. Do not mention rewards or owner claims.",
    angleVariants: [
      {
        working_title: "Regulars Over Ratings",
        pillar: "founder_story",
        hook_direction:
          "The local feed gets better when regulars become the signal.",
        unique_takeaway:
          "Rallio is building toward a taste map, not another generic discovery feed.",
        visual_direction: "Black manifesto tile with one large thesis.",
        do_not_repeat: "Do not use app-launch language.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "manifesto_reel",
        ctaDoor: "app_download_supporter",
      },
      {
        working_title: "Not A Promo Feed",
        pillar: "founder_story",
        hook_direction:
          "Local discovery does not need louder promos. It needs better memory.",
        unique_takeaway:
          "The first Rallio loop should collect what people would actually recommend.",
        visual_direction: "Ink tile with three small feed principles.",
        do_not_repeat: "Do not use coupon or deal framing.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "manifesto_reel",
        ctaDoor: "app_download_supporter",
      },
      {
        working_title: "Build The Map Quietly",
        pillar: "founder_story",
        hook_direction:
          "The best local maps are built from patient recommendations, not launch noise.",
        unique_takeaway:
          "Launch growth should feel like helping shape the map before it opens wider.",
        visual_direction: "BTS manifesto tile with link-in-bio launch cue.",
        do_not_repeat: "Do not make a city-versus-city point.",
        rallioTemplateType: "rallio_manifesto",
        contentType: "bts_story_sequence",
        ctaDoor: "app_download_supporter",
      },
    ],
  },
  {
    id: "owner-claim-flow",
    title: "Owner utility for community-added profiles",
    brief:
      "Create occasional Rallio owner-utility content for food/drink operators whose spots were community-added. Explain the profile claim as a practical way to correct details and add context. Keep it respectful and secondary to the community feed.",
    preferredTone: "founder",
    templateHint: "tutorial",
    rallioTemplateType: "rallio_owner_claim",
    contentType: "owner_claim_carousel",
    ctaDoor: "claim_your_business",
    bestPostTypes: ["carousel"],
    kpiIntent: "owner_setup",
    visualDirection:
      "Dark owner-claim phone/profile card with moss owner marker, community-added badge, small stats, and takes-about-a-minute CTA.",
    captionStructure:
      "Owner-aware hook, why the community-added profile exists, 3 practical owner steps, link-in-bio owner CTA.",
    doNotSay:
      "Do not sound like sales outreach. Do not promise paid traffic, revenue, perks, rewards, or instant setup.",
    angleVariants: [
      {
        working_title: "Claim The Story After Launch",
        pillar: "founder_story",
        hook_direction:
          "If regulars added your spot, the profile should still be easy for the owner to correct.",
        unique_takeaway:
          "Claiming is a lightweight owner utility, not the main community-feed story.",
        visual_direction: "Dark phone/profile card with community-added badge and owner CTA.",
        do_not_repeat: "Do not pitch ads.",
        rallioTemplateType: "rallio_owner_claim",
        contentType: "owner_claim_carousel",
        ctaDoor: "claim_your_business",
      },
      {
        working_title: "Better Local Context",
        pillar: "tutorial",
        hook_direction:
          "A local profile should carry owner context without replacing regular recommendations.",
        unique_takeaway:
          "Owner claim posts should help operators add missing context while keeping the feed community-led.",
        visual_direction: "Dark owner utility card with three calm steps.",
        do_not_repeat: "Do not mention coupons, perks, or reward hype.",
        rallioTemplateType: "rallio_owner_claim",
        contentType: "owner_claim_carousel",
        ctaDoor: "claim_your_business",
      },
    ],
  },
];

// Supporter/owner setup and owner-claim posts are deliberately a minority of
// the feed; everything else is value content people actually save and share.
const RALLIO_SETUP_CONTENT_TYPES = new Set<RallioContentType>([
  "supporter_steps_carousel",
  "owner_steps_carousel",
  "owner_claim_carousel",
]);

export function selectRallioSeed({
  postType,
  recentText,
}: {
  postType: PostType;
  quantity: number;
  recentText: string;
}) {
  const defaultSeeds = rallioTopicSeeds.filter(
    (seed) => seed.contentType !== "owner_claim_carousel",
  );
  const preferred = defaultSeeds.filter((seed) =>
    seed.bestPostTypes.includes(postType),
  );
  const priority = RALLIO_POST_TYPE_PRIORITY[postType];
  const pool = sortSeedsByContentPriority(
    preferred.length ? preferred : defaultSeeds,
    priority,
  );
  const recent = normalizeRecentText(recentText);
  const fresh = pool.filter((seed) => !seedMatchesRecent(seed, recent));
  const candidates = fresh.length ? fresh : pool;

  // Pick value content (quotes, spots, receipts, participation) most of the
  // time and only allow a supporter/owner setup post about one pick in four, so
  // single-post generation stops repeating supporter and owner profile posts.
  const valueCandidates = candidates.filter(
    (seed) => !RALLIO_SETUP_CONTENT_TYPES.has(seed.contentType),
  );
  const setupCandidates = candidates.filter((seed) =>
    RALLIO_SETUP_CONTENT_TYPES.has(seed.contentType),
  );

  if (
    valueCandidates.length &&
    (!setupCandidates.length || Math.random() > 0.25)
  ) {
    return pickRandomItem(valueCandidates);
  }

  return pickRandomItem(candidates);
}

export function selectRallioAngle(seed: RallioTopicSeed, recentText: string) {
  const recent = normalizeRecentText(recentText);
  const fresh = seed.angleVariants.filter((angle) => !angleMatchesRecent(angle, recent));

  return pickRandomItem(fresh.length ? fresh : seed.angleVariants);
}

function pickRandomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] || items[0];
}

export function getRallioContentTypeForSlot(
  slot: number,
  rhythmOffset = 0,
): RallioContentType {
  const index =
    (Math.max(0, slot - 1) + rhythmOffset) % RALLIO_DEFAULT_FEED_RHYTHM.length;

  return RALLIO_DEFAULT_FEED_RHYTHM[index];
}

export function getRallioSignalOffset(seed?: string | null) {
  if (!seed) {
    return 0;
  }

  return Array.from(seed).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  ) % rallioLocalSignals.length;
}

export function getRallioBatchSlotGuide(
  slot: number,
  signalOffset = 0,
  excludeSignalIds?: ReadonlySet<string>,
) {
  // The offset rotates the feed rhythm, angle candidates, and title banks so
  // consecutive batches do not start from the same slots and working titles.
  const rhythmOffset = signalOffset % RALLIO_DEFAULT_FEED_RHYTHM.length;
  const contentType = getRallioContentTypeForSlot(slot, rhythmOffset);
  const occurrenceIndex =
    countContentTypeOccurrences(contentType, slot, rhythmOffset) - 1;
  const candidates = getAngleVariantsForContentType(contentType);
  const candidate =
    candidates[(occurrenceIndex + signalOffset) % candidates.length] ||
    candidates[0];
  const localSignal = getRallioLocalSignalForSlot(
    slot + signalOffset,
    excludeSignalIds,
  );

  if (!candidate) {
    throw new Error(`No Rallio batch guide candidates found for ${contentType}.`);
  }

  const isCityRequestSlot =
    contentType === "participation_single" && occurrenceIndex % 2 === 0;
  const templateType = candidate.rallioTemplateType || templateForContentType(contentType);
  const workingTitle = getBatchWorkingTitle(
    candidate.working_title,
    contentType,
    occurrenceIndex,
    localSignal,
    isCityRequestSlot,
    signalOffset,
  );
  const participationPrompt = getParticipationPrompt(
    contentType,
    localSignal,
    isCityRequestSlot,
  );
  const plannedCtaDoor: RallioCtaDoor =
    contentType === "supporter_steps_carousel"
      ? "app_download_supporter"
      : contentType === "owner_steps_carousel"
        ? "app_download_owner"
        : isCityRequestSlot
          ? "city_request"
          : contentType === "owner_claim_carousel"
            ? candidate.ctaDoor
            : localSignal.cta_door;
  const ctaDoor = normalizeRallioCtaDoor(contentType, plannedCtaDoor);
  const signalTakeaway = buildSignalTakeaway(localSignal, contentType);

  return {
    slot,
    seedId: candidate.seed.id,
    seedTitle: candidate.seed.title,
    contentType,
    templateType,
    coreTemplateType: mapRallioTemplateToCoreType(templateType),
    ctaDoor,
    visualStyle: candidate.visual_direction,
    kpiIntent: candidate.seed.kpiIntent,
    workingTitle,
    hookDirection: candidate.hook_direction,
    uniqueTakeaway: `${candidate.unique_takeaway} ${signalTakeaway}`,
    captionStructure: candidate.seed.captionStructure,
    doNotRepeat: [
      candidate.do_not_repeat,
      "Do not reuse this batch's spot, category, quote, participation prompt, or local signal.",
    ].join(" "),
    localSignal,
    participationPrompt,
    slotBrief: [
      `${contentType} / ${templateType}`,
      workingTitle,
      `${localSignal.spot_name} / ${localSignal.category} / ${localSignal.neighborhood}`,
      candidate.hook_direction,
      signalTakeaway,
      `Participation: ${participationPrompt}`,
      `Visual: ${candidate.visual_direction}`,
    ].join(" — "),
  };
}

function getBatchWorkingTitle(
  fallback: string,
  contentType: RallioContentType,
  occurrenceIndex: number,
  localSignal: RallioLocalSignal,
  isCityRequestSlot = false,
  variantOffset = 0,
) {
  const variantIndex = occurrenceIndex + variantOffset;

  if (contentType === "participation_single" && isCityRequestSlot) {
    const cityRequestTitles = [
      "Which City Should We Map Next?",
      "Request The Next City",
      "Tell Us Where To Build Next",
      "Where Should Rallio Start Next?",
      "Your City Can Be Next",
    ];

    return cityRequestTitles[variantIndex % cityRequestTitles.length] || fallback;
  }

  const signalTitleBank: Record<RallioContentType, string[]> = {
    supporter_steps_carousel: [
      "Start With One Spot",
      "Build Your Taste",
      "Follow, Post, Map",
      `Start In ${shortNeighborhood(localSignal.neighborhood)}`,
      "Your First Rallio Post",
    ],
    owner_steps_carousel: [
      "Owners: Claim The Profile",
      "Review What Supporters Post",
      `${shortSpotName(localSignal.spot_name)} Owner Setup`,
      "Claim, Review, Track",
      "The Owner Home Loop",
    ],
    regular_quote: [
      `${localSignal.regular_name}'s ${shortNeighborhood(localSignal.neighborhood)} Order`,
      `The ${shortNeighborhood(localSignal.neighborhood)} Regular`,
      `${shortSpotName(localSignal.spot_name)} Regular`,
      `A Regular At ${shortSpotName(localSignal.spot_name)}`,
      `${localSignal.signature_order}`,
    ],
    spot_carousel: [
      localSignal.spot_name,
      `${shortSpotName(localSignal.spot_name)} Belongs Here`,
      `${shortNeighborhood(localSignal.neighborhood)} Save`,
      `One ${localSignal.category} Worth Saving`,
      `${shortSpotName(localSignal.spot_name)} Detail`,
    ],
    receipt_single: [
      `${shortSpotName(localSignal.spot_name)} Receipt`,
      `${shortNeighborhood(localSignal.neighborhood)} Taste Receipt`,
      `Why Regulars Return`,
      `The Repeat Visit Ledger`,
      `${localSignal.category} Signals`,
    ],
    participation_single: [
      localSignal.participation_prompt,
      `What Belongs In ${shortNeighborhood(localSignal.neighborhood)}?`,
      `Drop The ${localSignal.category} Order`,
      `Stop Gatekeeping ${shortNeighborhood(localSignal.neighborhood)}`,
      `Reply With The Local Signal`,
    ],
    manifesto_reel: [
      "What Belongs On The Map",
      "Drop The Order",
      "Stop Gatekeeping Local Taste",
      "Built From Regulars",
      "Local Memory Wins",
    ],
    bts_story_sequence: [
      "What We Are Collecting",
      "Help Shape The Map",
      "The Feed That Builds The App",
      "Small Signals First",
      "Reply With A Spot",
    ],
    owner_claim_carousel: [
      `${shortSpotName(localSignal.spot_name)} Profile`,
      "Community-Added, Owner-Corrected",
      "The Owner Context Layer",
      "A Profile Regulars Started",
      `${shortNeighborhood(localSignal.neighborhood)} Owner Context`,
    ],
  };
  const fallbackTitleBank: Record<RallioContentType, string[]> = {
    supporter_steps_carousel: [
      "Start With One Spot",
      "Build Your Taste",
      "Follow, Post, Map",
      "Your First Rallio Post",
      "From Pick To Profile",
    ],
    owner_steps_carousel: [
      "Owners: Claim The Profile",
      "Review What Supporters Post",
      "Claim, Review, Track",
      "The Owner Home Loop",
      "Keep The Profile Accurate",
    ],
    regular_quote: [
      "The Tuesday Regular",
      "The Recommendation You Trust",
      "Not A Critic Line",
      "The Counter Seat",
      "The House Order",
    ],
    spot_carousel: [
      "One Spot Worth Saving",
      "The Saveable Detail",
      "Recommended Twice",
      "The Corner Pick",
      "The Line Worth Knowing",
    ],
    receipt_single: [
      "Taste Receipt",
      "What Regulars Notice",
      "Save Before You Forget",
      "The Repeat Visit Ledger",
      "Three Reasons, One Receipt",
    ],
    participation_single: [
      "Which Spot Belongs Here?",
      "Drop The Order",
      "Stop Gatekeeping The Spot",
      "Reply With A Local Signal",
      "What Should We Add?",
    ],
    manifesto_reel: [
      "Regulars Over Ratings",
      "Not A Promo Feed",
      "Taste Map, Not Top Ten",
      "Built From Regulars",
      "Local Memory Wins",
    ],
    bts_story_sequence: [
      "Build The Map Quietly",
      "Behind The Taste Map",
      "What We Are Collecting",
      "The Feed That Builds The App",
      "Small Signals First",
    ],
    owner_claim_carousel: [
      "Claim The Story After Launch",
      "Better Local Context",
      "Community-Added, Owner-Corrected",
      "The Owner Context Layer",
      "A Profile Regulars Started",
    ],
  };

  const signalTitles = signalTitleBank[contentType];
  const fallbackTitles = fallbackTitleBank[contentType];

  return (
    signalTitles[variantIndex % signalTitles.length] ||
    fallbackTitles[variantIndex % fallbackTitles.length] ||
    fallback
  );
}

export function getRallioLocalSignalForSlot(
  slot: number,
  excludeSignalIds?: ReadonlySet<string>,
): RallioLocalSignal {
  const start = Math.max(0, slot - 1);

  if (excludeSignalIds?.size) {
    // Walk forward from the slot's natural position to the first signal that
    // has not been used recently, so planned signals stay fresh across batches.
    for (let step = 0; step < rallioLocalSignals.length; step += 1) {
      const candidate =
        rallioLocalSignals[(start + step) % rallioLocalSignals.length];

      if (!excludeSignalIds.has(candidate.id)) {
        return candidate;
      }
    }
  }

  return rallioLocalSignals[start % rallioLocalSignals.length];
}

export function selectRallioLocalSignal(recentText = ""): RallioLocalSignal {
  const recent = normalizeRecentText(recentText);
  const fresh = rallioLocalSignals.filter(
    (signal) => !signalMatchesRecent(signal, recent),
  );

  return pickRandomItem(fresh.length ? fresh : rallioLocalSignals);
}

function signalMatchesRecent(signal: RallioLocalSignal, recent: string) {
  return [
    signal.id,
    signal.spot_name,
    signal.signature_order,
    signal.regular_quote,
  ].some((value) => recentIncludes(recent, value));
}

export function rallioSignalToTemplateFields(
  signal?: RallioLocalSignal | null,
): Partial<TemplateFields> {
  if (!signal) {
    return {};
  }

  return {
    local_signal_id: signal.id,
    source_status: signal.source_status,
    business_name: signal.spot_name,
    launch_neighborhood: signal.neighborhood,
    spot_category: signal.category,
    spot_address: signal.street,
    signature_order: signal.signature_order,
    sensory_detail: signal.sensory_detail,
    participation_prompt: signal.participation_prompt,
    regular_quote: signal.regular_quote,
    recommender_quote: signal.regular_quote,
    quote: signal.regular_quote,
    attribution: signal.regular_name,
    regular_neighborhood: signal.neighborhood,
    recommender_neighborhood: signal.neighborhood.toLowerCase(),
    regular_since_year: signal.regular_since_year,
    recommender_since: `'${signal.regular_since_year.slice(-2)}`,
  };
}

function getParticipationPrompt(
  contentType: RallioContentType,
  signal: RallioLocalSignal,
  isCityRequestSlot = false,
) {
  if (contentType === "supporter_steps_carousel") {
    return "What spot would you start with on Rallio?";
  }

  if (contentType === "owner_steps_carousel") {
    return "Which profile should an owner keep accurate first?";
  }

  if (contentType === "participation_single") {
    if (isCityRequestSlot) {
      return "Which city or neighborhood should Rallio map next?";
    }

    return signal.participation_prompt || "Which spot belongs on the taste map?";
  }

  if (contentType === "manifesto_reel") {
    return "Which spot belongs on the taste map?";
  }

  if (contentType === "bts_story_sequence") {
    return "Reply with the spot regulars know.";
  }

  if (contentType === "receipt_single") {
    return "Drop the one order you would defend.";
  }

  return signal.participation_prompt;
}

function buildSignalTakeaway(
  signal: RallioLocalSignal,
  contentType: RallioContentType,
) {
  if (contentType === "supporter_steps_carousel") {
    return `Use ${signal.spot_name} as the example first spot, but make the post explain the supporter flow: download/open Rallio, choose Supporter and city, browse or search, follow places, create a support post, and build Your Taste.`;
  }

  if (contentType === "owner_steps_carousel") {
    return `Use ${signal.spot_name} as the example owner context, but make the post explain the owner flow: download/open Rallio, choose Business Owner, add or claim a free profile, keep details accurate, approve supporter posts, and track posts, profile clicks, and visits.`;
  }

  if (contentType === "owner_claim_carousel") {
    return `Use ${signal.spot_name} as the concrete community-added profile context, but keep the angle owner-facing and occasional.`;
  }

  if (contentType === "participation_single") {
    return `Use ${signal.spot_name} in ${signal.neighborhood} as the seed context, but make the post an answerable participation prompt: ${signal.participation_prompt}.`;
  }

  return `Use ${signal.spot_name} in ${signal.neighborhood} as the concrete local signal: ${signal.signature_order}; ${signal.sensory_detail}.`;
}

function shortSpotName(value: string) {
  return value.replace(/\s+(Ice Cream|Coffee|Chinese|Brewery|Taverna)$/i, "").trim();
}

function shortNeighborhood(value: string) {
  return value.split(/\s+/).slice(0, 2).join(" ");
}

function countContentTypeOccurrences(
  contentType: RallioContentType,
  slot: number,
  rhythmOffset = 0,
) {
  return Array.from({ length: Math.max(1, slot) }, (_, index) =>
    getRallioContentTypeForSlot(index + 1, rhythmOffset),
  ).filter((candidate) => candidate === contentType).length;
}

function getAngleVariantsForContentType(contentType: RallioContentType) {
  const matchingAngles = rallioTopicSeeds.flatMap((seed) =>
    seed.angleVariants
      .filter((angle) => angle.contentType === contentType)
      .map((angle) => ({ ...angle, seed })),
  );

  if (matchingAngles.length) {
    return matchingAngles;
  }

  const seedAngles = rallioTopicSeeds
    .filter((seed) => seed.contentType === contentType)
    .flatMap((seed) =>
      seed.angleVariants.map((angle) => ({ ...angle, seed })),
    );

  return seedAngles.length
    ? seedAngles
    : rallioTopicSeeds.flatMap((seed) =>
        seed.angleVariants.map((angle) => ({ ...angle, seed })),
      );
}

function sortSeedsByContentPriority(
  seeds: RallioTopicSeed[],
  priority: RallioContentType[],
) {
  return [...seeds].sort((left, right) => {
    const leftIndex = priority.indexOf(left.contentType);
    const rightIndex = priority.indexOf(right.contentType);
    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    return normalizedLeft - normalizedRight;
  });
}

function normalizeRecentText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function seedMatchesRecent(seed: RallioTopicSeed, recent: string) {
  return [
    seed.id,
    seed.title,
    seed.contentType,
    seed.rallioTemplateType,
    ...seed.angleVariants.flatMap((angle) => [
      angle.working_title,
      angle.hook_direction,
      angle.contentType,
      angle.rallioTemplateType,
    ]),
  ].some((value) => recentIncludes(recent, value));
}

function angleMatchesRecent(
  angle: RallioTopicSeed["angleVariants"][number],
  recent: string,
) {
  return [
    angle.working_title,
    angle.hook_direction,
    angle.contentType,
    angle.rallioTemplateType,
  ].some((value) => recentIncludes(recent, value));
}

function recentIncludes(recent: string, value: string) {
  const normalized = normalizeRecentText(value);

  return normalized.length >= 4 && recent.includes(normalized);
}

export function buildRallioRouletteBrief(seed: RallioTopicSeed, quantity: number) {
  const angles =
    quantity > 1
      ? Array.from({ length: quantity }, (_, index) => {
          const guide = getRallioBatchSlotGuide(index + 1);

          return `${index + 1}. ${guide.workingTitle}: ${guide.slotBrief}. Required signal: ${guide.localSignal.spot_name}, ${guide.localSignal.neighborhood}, ${guide.localSignal.signature_order}. Participation prompt: ${guide.participationPrompt}`;
        }).join("\n")
      : seed.angleVariants
          .slice(0, Math.max(1, Math.min(quantity, seed.angleVariants.length)))
          .map(
            (angle, index) =>
              `${index + 1}. ${angle.working_title}: ${angle.unique_takeaway}`,
          )
          .join("\n");
  const rhythm =
    quantity > 1
      ? Array.from({ length: quantity }, (_, index) => {
          const contentType = getRallioContentTypeForSlot(index + 1);
          const templateType = templateForContentType(contentType);

          return `${index + 1}. ${contentType} / ${templateType}`;
        }).join("\n")
      : "";

  return [
    seed.brief,
    "",
    `Launch scope: ${RALLIO_BRAND.launch_scope}`,
    "Toronto + Rajkot can be mentioned when launch-market context matters, but headlines should default to useful local action, neighborhood taste, regulars, owner setup, or city-request participation.",
    "Category focus: food/drink spots people would recommend twice.",
    "Use the assigned local signal as source context. Vary spot names, categories, neighborhoods, quotes, and participation prompts across the batch.",
    "Launch action posts must match the submitted app flow: supporters choose Supporter/city, browse/search, follow places, create support posts, and build Your Taste; owners choose Business Owner, add/claim a free profile, keep details accurate, approve supporter posts, and track posts/clicks/visits.",
    "Participation prompts are feed-post copy, not reels or stories. Use prompts like: Which spot belongs on the taste map? Drop the one order you'd defend. What place should locals stop gatekeeping? Reply with the spot regulars know.",
    "Default launch feed rhythm: 40% local recommendations, 25% supporter step/action posts, 15% owner step/claim posts, and 20% city-request or participation prompts.",
    quantity > 1
      ? `Use this visual rhythm for this batch unless the user overrides it:\n${rhythm}`
      : "For a single post, use the selected seed as the visual direction.",
    `CTA door: ${seed.ctaDoor}.`,
    `KPI intent: ${seed.kpiIntent}.`,
    `Visual direction: ${seed.visualDirection}`,
    `Caption structure: ${seed.captionStructure}`,
    `Do not say: ${seed.doNotSay}`,
    "",
    "Campaign angles:",
    angles,
  ].join("\n");
}

export function mapRallioTemplateToCoreType(
  rallioTemplateType: RallioTemplateType | null | undefined,
): TemplateType {
  if (rallioTemplateType === "rallio_steps") {
    return "tutorial";
  }

  if (rallioTemplateType === "rallio_owner_claim") {
    return "tutorial";
  }

  if (rallioTemplateType === "rallio_receipt") {
    return "tutorial";
  }

  if (rallioTemplateType === "rallio_spot_carousel") {
    return "creator_economy";
  }

  if (rallioTemplateType === "rallio_regular_quote") {
    return "creator_economy";
  }

  return "founder_story";
}

// Signal-only fields must never survive on a Rallio post. The image renderer
// routes to the Signal template when it sees signal_template_type, so a leaked
// value would render a Rallio post with Signal branding.
const SIGNAL_ONLY_FIELD_KEYS = [
  "signal_template_type",
  "signal_content_type",
  "signal_cta_door",
  "signal_visual_style",
  "signal_kpi_intent",
  "signal_state",
  "signal_protocol_steps",
  "signal_trigger",
  "signal_redirect_action",
  "signal_identity_line",
  "signal_privacy_line",
  "signal_principle",
  "signal_app_feature",
] as const;

function omitTemplateFields(
  fields: TemplateFields,
  keys: readonly string[],
): TemplateFields {
  const result: TemplateFields = { ...fields };

  for (const key of keys) {
    delete (result as Record<string, unknown>)[key];
  }

  return result;
}

export function normalizeRallioMetadata(
  fields: TemplateFields,
  fallback?: {
    contentType?: RallioContentType;
    ctaDoor?: RallioCtaDoor;
    templateType?: RallioTemplateType;
    visualStyle?: string;
    kpiIntent?: string;
  },
): TemplateFields {
  const contentType: RallioContentType =
    fallback?.contentType || fields.content_type || "regular_quote";
  const ctaDoor = normalizeRallioCtaDoor(
    contentType,
    fallback?.ctaDoor || fields.cta_door || "app_download_supporter",
  );
  const rallioTemplateType: RallioTemplateType =
    fallback?.templateType ||
    fields.rallio_template_type ||
    templateForContentType(contentType);
  const launchStepFields = buildLaunchStepTemplateDefaults(contentType, fields);

  return {
    ...omitTemplateFields(fields, SIGNAL_ONLY_FIELD_KEYS),
    ...launchStepFields,
    brand_slug: "rallio",
    brand_handle: RALLIO_BRAND.handle,
    launch_neighborhood: cleanNeighborhood(fields.launch_neighborhood),
    category_focus: fields.category_focus || RALLIO_BRAND.category_focus,
    content_type: contentType,
    cta_door: ctaDoor,
    rallio_template_type: rallioTemplateType,
    visual_style: fallback?.visualStyle || fields.visual_style || RALLIO_BRAND.visual_style,
    kpi_intent: fallback?.kpiIntent || fields.kpi_intent || "manual_review",
    door_label: fields.door_label || formatRallioDoorLabel(ctaDoor),
    bio_rotation_hint: fields.bio_rotation_hint || bioHintForDoor(ctaDoor),
  };
}

function buildLaunchStepTemplateDefaults(
  contentType: RallioContentType,
  fields: TemplateFields,
): Partial<TemplateFields> {
  if (contentType === "supporter_steps_carousel") {
    const supporterSteps = Array.isArray(fields.supporter_steps)
      ? fields.supporter_steps.filter(Boolean)
      : [];

    return {
      step_audience: "supporter",
      supporter_steps: supporterSteps.length
        ? supporterSteps
        : [...RALLIO_SUPPORTER_STEPS],
    };
  }

  if (contentType === "owner_steps_carousel") {
    const ownerSteps = Array.isArray(fields.owner_steps)
      ? fields.owner_steps.filter(Boolean)
      : [];

    return {
      step_audience: "owner",
      owner_steps: ownerSteps.length ? ownerSteps : [...RALLIO_OWNER_STEPS],
    };
  }

  return {};
}

export function normalizeRallioCtaDoor(
  contentType: RallioContentType | null | undefined,
  ctaDoor: RallioCtaDoor | null | undefined,
): RallioCtaDoor {
  if (contentType === "supporter_steps_carousel") {
    return "app_download_supporter";
  }

  if (contentType === "owner_steps_carousel") {
    return "app_download_owner";
  }

  if (contentType === "owner_claim_carousel") {
    return "claim_your_business";
  }

  // Post-launch: the founding_supporter door is retired. Supporter-facing
  // discovery and community posts drive app downloads by default.
  if (!ctaDoor || ctaDoor === "founding_supporter") {
    return "app_download_supporter";
  }

  // Owner-only doors do not belong on supporter-facing content; route them to
  // the supporter download door rather than the dead founding door.
  if (ctaDoor === "app_download_owner" || ctaDoor === "claim_your_business") {
    return "app_download_supporter";
  }

  // Honor an intentional supporter-side door (app_download_supporter,
  // city_request, local_guide, ossington_30_guide).
  return ctaDoor;
}

const NEIGHBORHOOD_PLACEHOLDERS = new Set([
  "local taste map",
  "taste map",
  "local",
  "neighborhood",
  "city",
  "n/a",
]);

function cleanNeighborhood(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (NEIGHBORHOOD_PLACEHOLDERS.has(trimmed.toLowerCase())) return undefined;
  return trimmed;
}

export function templateForContentType(
  contentType: RallioContentType | undefined,
): RallioTemplateType {
  if (contentType === "spot_carousel") {
    return "rallio_spot_carousel";
  }

  if (contentType === "receipt_single") {
    return "rallio_receipt";
  }

  if (contentType === "regular_quote") {
    return "rallio_regular_quote";
  }

  if (contentType === "owner_claim_carousel") {
    return "rallio_owner_claim";
  }

  if (
    contentType === "supporter_steps_carousel" ||
    contentType === "owner_steps_carousel"
  ) {
    return "rallio_steps";
  }

  if (contentType === "participation_single") {
    return "rallio_manifesto";
  }

  return "rallio_manifesto";
}

export function formatRallioDoorLabel(ctaDoor: RallioCtaDoor) {
  if (ctaDoor === "app_download_supporter") {
    return "Download Rallio";
  }

  if (ctaDoor === "app_download_owner") {
    return "Owner setup";
  }

  if (ctaDoor === "city_request") {
    return "Request your city";
  }

  if (ctaDoor === "local_guide" || ctaDoor === "ossington_30_guide") {
    return "Taste map";
  }

  if (ctaDoor === "claim_your_business") {
    return "Owner profile";
  }

  return "Download Rallio";
}

export function bioHintForDoor(ctaDoor: RallioCtaDoor) {
  if (ctaDoor === "app_download_supporter") {
    return "Rotate bio to the App Store download door for supporter launch posts.";
  }

  if (ctaDoor === "app_download_owner") {
    return "Rotate bio to the owner setup door for owner-facing launch posts.";
  }

  if (ctaDoor === "city_request") {
    return "Rotate bio to the city-request door for soft-global launch posts.";
  }

  if (ctaDoor === "local_guide" || ctaDoor === "ossington_30_guide") {
    return "Rotate bio to the taste-map guide door for 48 hours after this post.";
  }

  if (ctaDoor === "claim_your_business") {
    return "Rotate bio to the owner profile door only for owner-facing posts.";
  }

  return "Default link-in-bio Rallio launch door.";
}

export function enforceRallioCopySafety(content: GeneratedContent): GeneratedContent {
  const strictBanned = [
    "download now",
    "instant download",
    "cashback",
    "free food",
    "exclusive rewards",
    "limited-time deal",
    "limited time deal",
    "coupon",
    "coupons",
    "promo code",
    "save money",
    "available everywhere",
    "global app is live",
    "global taste map is live",
    "every city is mapped",
    "every city is ready",
    "worldwide coverage",
    "reservations",
    "moments",
    "tag a friend who",
    "launching soon",
  ];
  const contextualBanned = [
    "deal",
    "deals",
    "discount",
    "discounts",
    "perk",
    "perks",
    "reward",
    "rewards",
  ];
  const strictBannedWords = ["instant"];
  const joined = [
    content.hook,
    content.headline,
    content.subhead,
    content.caption,
    content.cta,
    content.x_version,
    content.linkedin_version,
  ]
    .join(" ")
    .toLowerCase();
  const hit =
    strictBanned.find((phrase) => joined.includes(phrase)) ||
    strictBannedWords.find((word) =>
      new RegExp(`\\b${escapeRegExp(word)}\\b`).test(joined),
    ) ||
    findUnsafeContextualTerm(joined, contextualBanned);

  if (hit) {
    throw new Error(`Rallio safety gate blocked banned phrasing: "${hit}".`);
  }

  if (joined.includes("!")) {
    throw new Error("Rallio safety gate blocked exclamation-point feed copy.");
  }

  const marketMentions = joined.match(/toronto\s*\+\s*rajkot/g)?.length || 0;
  if (marketMentions > 1) {
    throw new Error(
      'Rallio safety gate blocked repeated "Toronto + Rajkot" phrasing.',
    );
  }

  const ctaDoor = content.template_fields.cta_door;
  const contentType = content.template_fields.content_type;
  if (ctaDoor === "claim_your_business" && contentType !== "owner_claim_carousel") {
    throw new Error(
      "Rallio safety gate blocked claim_your_business on non-owner content.",
    );
  }

  const isOwnerFacing =
    ctaDoor === "claim_your_business" ||
    ctaDoor === "app_download_owner" ||
    contentType === "owner_claim_carousel" ||
    contentType === "owner_steps_carousel";

  if (
    !isOwnerFacing &&
    /\b(claim your business|owner claim|claim the profile|claim it)\b/.test(joined)
  ) {
    throw new Error(
      "Rallio safety gate blocked owner-claim copy on a non-owner post.",
    );
  }

  return content;
}

function findUnsafeContextualTerm(text: string, terms: string[]) {
  for (const term of terms) {
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "g");
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      if (!isRejectingContextUse(text, match.index)) {
        return term;
      }
    }
  }

  return null;
}

function isRejectingContextUse(text: string, index: number) {
  const prefix = text.slice(Math.max(0, index - 120), index).toLowerCase();

  return /(no|not|never|without|avoid|avoids|against|instead of|rather than|do not|don't|isn't|is not|not selling|not another|not about|beyond)\s+[\w\s-]{0,80}$/.test(
    prefix,
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
