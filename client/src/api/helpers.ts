// 백엔드 API 호출 래퍼 (Supabase 직접 호출 → 백엔드 경유)

const API_BASE = (
  (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ||
  "/api/salary-calc"
).replace(/\/+$/, "");

type ApiErrorKind = "network" | "server";

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

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch (error) {
    throw new ApiRequestError({
      kind: "network",
      message: "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
      cause: error,
    });
  }

  if (!response.ok) {
    throw new ApiRequestError({
      kind: "server",
      status: response.status,
      message: getServerErrorMessage(response.status, await readErrorMessage(response)),
    });
  }

  return (await response.json()) as T;
}
