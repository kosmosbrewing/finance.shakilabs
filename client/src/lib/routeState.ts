import type { LocationQuery, LocationQueryRaw } from "vue-router";
import { copyUsingExecCommand } from "@/lib/utils";

type QueryPrimitive = string | number | boolean | null | undefined;
type QueryLike = LocationQuery | LocationQueryRaw | Record<string, unknown>;

function toSortedQueryRecord(
  input: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).sort(([a], [b]) => a.localeCompare(b))
  );
}

// 쿼리 값이 배열일 때 첫 번째 문자열만 사용
export function queryFirst(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : null;
  }
  return typeof value === "string" ? value : null;
}

export function parseQueryInt(value: unknown): number | null {
  const raw = queryFirst(value);
  if (raw == null) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseQueryFloat(value: unknown): number | null {
  const raw = queryFirst(value);
  if (raw == null) return null;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseQueryBoolean(value: unknown, fallback = false): boolean {
  const raw = queryFirst(value);
  if (raw == null) return fallback;

  const normalized = raw.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "y") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "n") {
    return false;
  }
  return fallback;
}

export function buildQuery(
  input: Record<string, QueryPrimitive>,
  options?: { booleanMode?: "numeric" | "literal" }
): Record<string, string> {
  const booleanMode = options?.booleanMode ?? "numeric";
  const query: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value == null) continue;

    if (typeof value === "boolean") {
      query[key] =
        booleanMode === "literal"
          ? (value ? "true" : "false")
          : (value ? "1" : "0");
      continue;
    }

    const stringValue = String(value).trim();
    if (stringValue.length === 0) continue;
    query[key] = stringValue;
  }

  return toSortedQueryRecord(query);
}

export function normalizeQuery(queryLike: QueryLike): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(queryLike)) {
    const first = queryFirst(value);
    if (first == null || first.length === 0) continue;
    normalized[key] = first;
  }

  return toSortedQueryRecord(normalized);
}

export function toQueryString(queryLike: QueryLike): string {
  return new URLSearchParams(normalizeQuery(queryLike)).toString();
}

export function isSameQuery(a: QueryLike, b: QueryLike): boolean {
  return toQueryString(a) === toQueryString(b);
}

export function buildAbsoluteUrl(
  path: string,
  query?: Record<string, QueryPrimitive>
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const queryString = query ? toQueryString(buildQuery(query)) : "";

  return queryString
    ? `${window.location.origin}${normalizedPath}?${queryString}`
    : `${window.location.origin}${normalizedPath}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API 실패 시 execCommand 폴백 시도
    }
  }

  return copyUsingExecCommand(text);
}
