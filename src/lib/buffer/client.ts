import "server-only";

import { getBufferEnv, type BufferPlatform } from "@/lib/env";

const BUFFER_GRAPHQL_ENDPOINT = "https://api.buffer.com";

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
      `Buffer channel for ${platform} is not configured. Add BUFFER_${platform.toUpperCase()}_CHANNEL_ID in Vercel.`,
    );
  }

  return channelId;
}

export async function createBufferPost({
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

  if (imageUrl) {
    input.assets = {
      images: [
        {
          url: imageUrl,
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
