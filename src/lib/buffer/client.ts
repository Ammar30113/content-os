import "server-only";

import sharp from "sharp";

import {
  getAppUrl,
  getBufferChannelEnvName,
  getBufferEnv,
  type BufferPlatform,
} from "@/lib/env";

const BUFFER_GRAPHQL_ENDPOINT = "https://api.buffer.com";
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

export function getBufferChannelId(platform: BufferPlatform) {
  const env = getBufferEnv();
  const channelId = env.channels[platform];

  if (!channelId) {
    throw new Error(
      `Buffer channel for Rallio ${platform} is not configured. Add ${getBufferChannelEnvName(platform)} in Vercel.`,
    );
  }

  return channelId;
}

export async function createBufferPost({
  postId,
  platform,
  text,
  imageUrl,
  scheduledFor,
}: CreateBufferPostInput): Promise<BufferPostResult> {
  const env = getBufferEnv();
  const channelId = getBufferChannelId(platform);
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

    input.assets = [
      {
        image: {
          url: bufferImageUrl,
          metadata: {
            altText: "Rallio social post graphic",
            dimensions: {
              width: 1080,
              height: 1080,
            },
          },
        },
      },
    ];
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
