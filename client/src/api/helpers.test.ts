import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, apiFetch, isApiConfigured } from "@/api/helpers";

const originalFetch = globalThis.fetch;

describe("api helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("API 기본 경로가 비어 있지 않다", () => {
    expect(isApiConfigured()).toBe(true);
  });

  it("성공 응답은 JSON 본문을 반환한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    ) as typeof fetch;

    await expect(apiFetch<{ ok: boolean }>("/health")).resolves.toEqual({ ok: true });
  });

  it("네트워크 에러는 별도 종류로 감싼다", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch")) as typeof fetch;

    await expect(apiFetch("/health")).rejects.toMatchObject({
      name: "ApiRequestError",
      kind: "network",
      status: null,
      message: "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
    } satisfies Partial<ApiRequestError>);
  });

  it("4xx 에러는 client 종류와 응답 메시지를 사용한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "입력값이 올바르지 않아요." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    ) as typeof fetch;

    await expect(apiFetch("/salary")).rejects.toMatchObject({
      kind: "client",
      status: 400,
      message: "입력값이 올바르지 않아요.",
    } satisfies Partial<ApiRequestError>);
  });

  it("5xx 에러는 server 종류와 상태별 기본 문구를 사용한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("upstream failed", { status: 503 })
    ) as typeof fetch;

    await expect(apiFetch("/salary")).rejects.toMatchObject({
      kind: "server",
      status: 503,
      message: "서버 응답이 불안정해요. 잠시 후 다시 시도해 주세요.",
    } satisfies Partial<ApiRequestError>);
  });

  it("429 에러는 재시도 안내 문구를 반환한다", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("rate limited", { status: 429 })
    ) as typeof fetch;

    await expect(apiFetch("/salary")).rejects.toMatchObject({
      kind: "client",
      status: 429,
      message: "요청이 많아요. 잠시 후 다시 시도해 주세요.",
    } satisfies Partial<ApiRequestError>);
  });
});
