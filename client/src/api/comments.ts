import { z } from "zod";
import type { Comment } from "./types";
import { isApiConfigured, apiFetch } from "./helpers";

// 프론트 검증용 스키마 (content 길이만)
const createCommentSchema = z.object({
  content: z.string().min(1, "내용을 입력해주세요").max(100, "100자 이내로 작성해주세요"),
});

export async function fetchComments(pageKey: string, limit = 20): Promise<Comment[]> {
  if (!isApiConfigured()) return [];

  const params = new URLSearchParams({ pageKey, limit: String(limit) });
  const { comments } = await apiFetch<{ comments: Comment[] }>(
    `/comments?${params}`
  );
  return comments;
}

export async function createComment(payload: {
  content: string;
  pageKey: string;
}): Promise<Comment> {
  if (!isApiConfigured()) {
    throw new Error("API is not configured");
  }

  // 프론트 사전 검증
  createCommentSchema.parse({ content: payload.content });

  return apiFetch<Comment>("/comments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
