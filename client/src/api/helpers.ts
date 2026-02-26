// 백엔드 API 호출 래퍼 (Supabase 직접 호출 → 백엔드 경유)

const API_BASE = (
  (import.meta.env.VITE_API_BASE as string | undefined)?.trim() ||
  "/api/salary-calc"
).replace(/\/+$/, "");

export function isApiConfigured(): boolean {
  return Boolean(API_BASE);
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      (body as { error?: string }).error ||
      `API error ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
