import "server-only";

import type { BrandSlug } from "@/lib/content/types";
import {
  getAppUrl,
  getBufferChannelEnvName,
  getBufferEnv,
  type BufferPlatform,
} from "@/lib/env";

const BUFFER_GRAPHQL_ENDPOINT = "https://api.buffer.com";
const BUFFER_INSTAGRAM_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const BUFFER_IMAGE_MIN_BYTES = 1024;

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
  brandSlug?: BrandSlug;
  text: string;
  imageUrl: string | null;
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

export function getBufferChannelId(
  platform: BufferPlatform,
  brandSlug: BrandSlug = "word_of_ai",
) {
  const env = getBufferEnv();
  const channelId = env.brandChannels[brandSlug]?.[platform];

  if (!channelId) {
    throw new Error(
      `Buffer channel for ${formatBrandName(brandSlug)} ${platform} is not configured. Add ${getBufferChannelEnvName(platform, brandSlug)} in Vercel.`,
    );
  }

  return channelId;
}

export async function createBufferPost({
  postId,
  platform,
  brandSlug = "word_of_ai",
  text,
  imageUrl,
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

  const bufferImageUrl = getBufferImageUrl({
    postId,
    platform,
    imageUrl,
  });

  if (bufferImageUrl) {
    await assertBufferMediaUrlReady(bufferImageUrl, platform);

    input.assets = {
      images: [
        {
          url: bufferImageUrl,
          metadata: {
            altText:
              brandSlug === "rallio"
                ? "Rallio social post graphic"
                : "Word of AI social post graphic",
            dimensions: {
              width: 1080,
              height: 1080,
            },
          },
        },
      ],
    };
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

function formatBrandName(brandSlug: BrandSlug) {
  return brandSlug === "rallio" ? "Rallio" : "Word of AI";
}

function getBufferImageUrl({
  postId,
  platform,
  imageUrl,
}: {
  postId: string;
  platform: BufferPlatform;
  imageUrl: string | null;
}) {
  if (!imageUrl) {
    return null;
  }

  if (platform === "x" && process.env.BUFFER_ATTACH_IMAGES_TO_X !== "true") {
    return null;
  }

  const appUrl = getAppUrl();

  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(appUrl)) {
    return imageUrl;
  }

  return `${appUrl}/api/public/post-image/${postId}.jpg`;
}

async function assertBufferMediaUrlReady(url: string, platform: BufferPlatform) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Buffer media preflight failed: image URL returned ${response.status}. Regenerate the image before sending.`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const body = Buffer.from(await response.arrayBuffer());

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
