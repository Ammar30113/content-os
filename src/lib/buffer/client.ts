import "server-only";

import sharp from "sharp";

import {
  getAppUrl,
  getBufferChannelEnvName,
  getBufferEnv,
  type BufferBrand,
  type BufferPlatform,
} from "@/lib/env";
import {
  assertSafeRemoteHttpUrl,
  readResponseBufferWithLimit,
} from "@/lib/http/remote-url";

const BUFFER_GRAPHQL_ENDPOINT = "https://api.buffer.com";
// Instagram (and therefore Buffer) caps a carousel at 10 images.
const BUFFER_INSTAGRAM_MAX_CAROUSEL = 10;
const BUFFER_INSTAGRAM_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const BUFFER_IMAGE_MIN_BYTES = 1024;
const INSTAGRAM_IMAGE_MIN_WIDTH = 320;
const INSTAGRAM_IMAGE_MAX_WIDTH = 1440;
const INSTAGRAM_IMAGE_MIN_ASPECT_RATIO = 0.8;
const INSTAGRAM_IMAGE_MAX_ASPECT_RATIO = 1.91;

type BufferGraphQLError = {
  message?: string;
};

type BufferCreatePostSuccess = {
  __typename: "PostActionSuccess";
  post: {
    id: string;
    text?: string | null;
    dueAt?: string | null;
  };
};

type BufferMutationError = {
  __typename: "MutationError";
  message: string;
};

type BufferCreatePostPayload = BufferCreatePostSuccess | BufferMutationError;

type BufferCreatePostResponse = {
  data?: {
    createPost?: BufferCreatePostPayload | null;
  };
  errors?: BufferGraphQLError[];
};

export type BufferPostResult = {
  id: string;
  dueAt: string | null;
};

type CreateBufferPostInput = {
  postId: string;
  platform: BufferPlatform;
  brandSlug: BufferBrand;
  text: string;
  imageUrl: string | null;
  // Ordered carousel slide URLs. When two or more are present, the post is sent
  // as a multi-image carousel and `imageUrl` is ignored.
  imageUrls?: string[] | null;
  scheduledFor: string;
};

const createPostMutation = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess {
        post {
          id
          text
          dueAt
        }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export function getBufferChannelId(platform: BufferPlatform, brandSlug: BufferBrand) {
  const env = getBufferEnv();
  const channelId = env.brandChannels[brandSlug]?.[platform] || null;

  if (!channelId) {
    throw new Error(
      `Buffer channel for ${formatBufferBrandName(brandSlug)} ${platform} is not configured. Add ${getBufferChannelEnvName(platform, brandSlug)} in Vercel.`,
    );
  }

  return channelId;
}

export async function createBufferPost({
  postId,
  platform,
  brandSlug,
  text,
  imageUrl,
  imageUrls,
  scheduledFor,
}: CreateBufferPostInput): Promise<BufferPostResult> {
  const env = getBufferEnv();
  const channelId = getBufferChannelId(platform, brandSlug);
  const input: Record<string, unknown> = {
    channelId,
    text,
    schedulingType: "automatic",
    mode: "customScheduled",
    dueAt: scheduledFor,
  };

  const bufferImageUrls = getBufferImageUrls({
    postId,
    platform,
    imageUrl,
    imageUrls,
  });

  if (bufferImageUrls.length) {
    // Validate every slide so a carousel never ships with a missing or
    // non-JPEG image. A partial carousel is worse than a clear failure.
    for (const url of bufferImageUrls) {
      await assertBufferMediaUrlReady(url, platform);
    }

    const altText = `${formatBufferBrandName(brandSlug)} social post graphic`;

    input.assets = bufferImageUrls.map((url) => ({
      image: {
        url,
        metadata: {
          altText,
          dimensions: {
            width: 1080,
            height: 1080,
          },
        },
      },
    }));
  }

  if (platform === "instagram") {
    input.metadata = {
      instagram: {
        type: "post",
        shouldShareToFeed: true,
      },
    };
  }

  const response = await fetch(BUFFER_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: createPostMutation,
      variables: { input },
    }),
  });

  const payload = (await response.json()) as BufferCreatePostResponse;

  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors?.map((error) => error.message).filter(Boolean).join(" ") ||
        `Buffer request failed with status ${response.status}.`,
    );
  }

  const result = payload.data?.createPost;

  if (!result) {
    throw new Error("Buffer did not return a post result.");
  }

  if (result.__typename === "MutationError") {
    throw new Error(result.message || "Buffer rejected the post.");
  }

  const success = result as BufferCreatePostSuccess;

  if (!success.post?.id) {
    throw new Error("Buffer returned an unsupported post response.");
  }

  return {
    id: success.post.id,
    dueAt: success.post.dueAt || null,
  };
}

function formatBufferBrandName(brandSlug: BufferBrand) {
  return brandSlug === "signal" ? "Signal" : "Rallio";
}

function getBufferImageUrls({
  postId,
  platform,
  imageUrl,
  imageUrls,
}: {
  postId: string;
  platform: BufferPlatform;
  imageUrl: string | null;
  imageUrls?: string[] | null;
}): string[] {
  if (platform === "x" && process.env.BUFFER_ATTACH_IMAGES_TO_X !== "true") {
    return [];
  }

  const slides = (imageUrls || []).filter((url): url is string => Boolean(url));

  if (slides.length > 1) {
    if (slides.length > BUFFER_INSTAGRAM_MAX_CAROUSEL) {
      throw new Error(
        `Instagram carousels allow at most ${BUFFER_INSTAGRAM_MAX_CAROUSEL} images; this post has ${slides.length}. Re-render with fewer slides.`,
      );
    }

    return slides.map((url) => resolveCarouselSlideUrl(url));
  }

  const single = imageUrl || slides[0] || null;

  if (!single) {
    return [];
  }

  return [resolveSingleImageUrl({ postId, imageUrl: single })];
}

function resolveSingleImageUrl({
  postId,
  imageUrl,
}: {
  postId: string;
  imageUrl: string;
}) {
  const appUrl = getAppUrl();

  if (
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(appUrl) ||
    appUrl.includes("ngrok")
  ) {
    return imageUrl;
  }

  if (isGeneratedTemplateJpegUrl(imageUrl)) {
    return imageUrl;
  }

  return `${appUrl}/api/public/post-image/${postId}.jpg`;
}

// Carousel slides are freshly rendered JPEGs stored at public Supabase URLs, so
// Buffer can fetch them directly. Anything that is not a JPEG is rejected rather
// than silently routed through the single-image proxy (which would duplicate the
// cover across every slide).
function resolveCarouselSlideUrl(url: string) {
  if (!isPublicJpegUrl(url)) {
    throw new Error(
      "Carousel slide image must be a rendered JPEG URL. Re-render the carousel slides before sending to Buffer.",
    );
  }

  return url;
}

function isPublicJpegUrl(imageUrl: string) {
  try {
    const pathname = new URL(imageUrl).pathname;

    return /\.jpe?g$/i.test(pathname);
  } catch {
    return false;
  }
}

async function assertBufferMediaUrlReady(url: string, platform: BufferPlatform) {
  const safeUrl = await assertSafeRemoteHttpUrl(url);
  const response = await fetch(safeUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(
      `Buffer media preflight failed: image URL returned ${response.status}. Regenerate the image before sending.`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const body = await readResponseBufferWithLimit(
    response,
    platform === "instagram"
      ? BUFFER_INSTAGRAM_IMAGE_MAX_BYTES
      : BUFFER_INSTAGRAM_IMAGE_MAX_BYTES,
  );

  if (!contentType.startsWith("image/")) {
    throw new Error(
      `Buffer media preflight failed: expected an image, got ${contentType || "unknown content type"}.`,
    );
  }

  if (platform === "instagram" && !/^image\/jpe?g$/i.test(contentType)) {
    throw new Error(
      `Buffer media preflight failed: Instagram handoff image must be JPEG, got ${contentType}.`,
    );
  }

  if (platform === "instagram") {
    await assertInstagramImageMetadata(body);
  }

  if (body.byteLength < BUFFER_IMAGE_MIN_BYTES) {
    throw new Error(
      "Buffer media preflight failed: image file is unexpectedly small. Regenerate the image before sending.",
    );
  }

  if (
    platform === "instagram" &&
    body.byteLength > BUFFER_INSTAGRAM_IMAGE_MAX_BYTES
  ) {
    throw new Error(
      "Buffer media preflight failed: Instagram image is over 8 MB. Regenerate or upload a smaller image.",
    );
  }
}

async function assertInstagramImageMetadata(body: Buffer) {
  const metadata = await sharp(body).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (!width || !height) {
    throw new Error(
      "Buffer media preflight failed: image dimensions could not be read.",
    );
  }

  const aspectRatio = width / height;

  if (
    width < INSTAGRAM_IMAGE_MIN_WIDTH ||
    width > INSTAGRAM_IMAGE_MAX_WIDTH ||
    aspectRatio < INSTAGRAM_IMAGE_MIN_ASPECT_RATIO ||
    aspectRatio > INSTAGRAM_IMAGE_MAX_ASPECT_RATIO
  ) {
    throw new Error(
      `Buffer media preflight failed: Instagram image must be 320-1440px wide and between 4:5 and 1.91:1. Got ${width}x${height}.`,
    );
  }
}

function isGeneratedTemplateJpegUrl(imageUrl: string) {
  try {
    const pathname = new URL(imageUrl).pathname;

    return /\/template-\d+\.jpe?g$/i.test(pathname);
  } catch {
    return false;
  }
}
