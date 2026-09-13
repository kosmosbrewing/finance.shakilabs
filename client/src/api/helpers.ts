// 백엔드 API 호출 래퍼 (Supabase 직접 호출 → 백엔드 경유)

const API_BASE = (
  (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ||
  "/api/finance"
).replace(/\/+$/, "");

// timeout은 network와 구분한다 — "응답이 없다"와 "연결이 안 된다"의 안내 문구가 다르고,
// 호출부가 재시도 버튼을 띄울지 판단하는 근거도 다르다.
type ApiErrorKind = "network" | "timeout" | "client" | "server";

// 응답이 오지 않는 요청을 그대로 두면 로딩 상태가 영구히 고착된다.
// fetch에는 기본 타임아웃이 없다: 익명 게시판의 "불러오는 중" 스피너가
// 영원히 돌던 원인이 정확히 이것이었다(응답 없음 → try/finally의 finally가 실행되지 않음).
const DEFAULT_TIMEOUT_MS = 8000;

interface ApiErrorOptions {
  kind: ApiErrorKind;
  status?: number | null;
  message: string;
  cause?: unknown;
}

interface ErrorPayload {
  error?: string;
  message?: string;
}

export class ApiRequestError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor({ kind, status = null, message, cause }: ApiErrorOptions) {
    super(message, { cause });
    this.name = "ApiRequestError";
    this.kind = kind;
    this.status = status;
  }
}

export function isApiConfigured(): boolean {
  return Boolean(API_BASE);
}

function normalizeMessage(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function readErrorMessage(response: Response): Promise<string | null> {
  const payload = (await response.clone().json().catch(() => null)) as ErrorPayload | null;
  return normalizeMessage(payload?.error) ?? normalizeMessage(payload?.message);
}

function getServerErrorMessage(status: number, fallback: string | null): string {
  if (fallback) return fallback;
  if (status >= 500) {
    return "서버 응답이 불안정해요. 잠시 후 다시 시도해 주세요.";
  }
  if (status === 404) {
    return "요청한 데이터를 찾지 못했어요.";
  }
  if (status === 401 || status === 403) {
    return "접근 권한을 확인한 뒤 다시 시도해 주세요.";
  }
  if (status === 429) {
    return "요청이 많아요. 잠시 후 다시 시도해 주세요.";
  }
  return "요청을 처리하지 못했어요. 입력값을 다시 확인해 주세요.";
}

function getErrorKind(status: number): ApiErrorKind {
  return status >= 500 ? "server" : "client";
}

export interface ApiFetchOptions extends RequestInit {
  /** 응답 대기 상한(ms). 0 이하면 타임아웃을 걸지 않는다. */
  timeoutMs?: number;
}

function createTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal;
  clear: () => void;
  timedOut: () => boolean;
} {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
    timedOut: () => timedOut,
  };
}

export async function apiFetch<T>(
  path: string,
  init?: ApiFetchOptions
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...requestInit } = init ?? {};
  const guard = timeoutMs > 0 ? createTimeoutSignal(timeoutMs) : null;
  let response: Response;

  try {
    response = await fetch(url, {
      ...requestInit,
      signal: guard?.signal ?? requestInit.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch (error) {
    if (guard?.timedOut()) {
      throw new ApiRequestError({
        kind: "timeout",
        message: "응답이 너무 오래 걸려요. 다시 시도해 주세요.",
        cause: error,
      });
    }
    throw new ApiRequestError({
      kind: "network",
      message: "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
      cause: error,
    });
  } finally {
    guard?.clear();
  }

  if (!response.ok) {
    throw new ApiRequestError({
      kind: getErrorKind(response.status),
      status: response.status,
      message: getServerErrorMessage(response.status, await readErrorMessage(response)),
    });
  }

  // 200이어도 본문이 JSON이 아닐 수 있다 (라우팅이 어긋나 SPA 셸 HTML이 돌아오는 경우).
  // 이때 response.json()이 던지는 SyntaxError를 그대로 흘리면
  // "Unexpected token '<', \"<!DOCTYPE\"..." 같은 내부 메시지가 화면에 노출된다.
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiRequestError({
      kind: "server",
      status: response.status,
      message: "응답 형식이 올바르지 않아요. 잠시 후 다시 시도해 주세요.",
      cause: error,
    });
  }
}
