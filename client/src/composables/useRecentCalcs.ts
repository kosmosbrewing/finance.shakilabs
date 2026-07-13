import { ref, readonly, type DeepReadonly, type Ref } from "vue";
import { z } from "zod";

export type RecentCalcEntry = {
  type:
    | "salary"
    | "insurance"
    | "comprehensive-tax"
    | "freelancer"
    | "compare"
    | "quit"
    | "withholding"
    | "freelance-rate"
    | "raise"
    | "bonus"
    | "overtime"
    | "weekly-holiday-pay"
    | "wage-converter"
    | "severance-pay";
  timestamp: number;
  label: string;
  path: string;
  summary: string;
};

const STORAGE_KEY = "recent-calcs:v1";
export const MAX_RECENT_CALCS = 5;
export const RECENT_CALC_RETENTION_DAYS = 7;
const RETENTION_MS = RECENT_CALC_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const recentCalcSchema = z.object({
  type: z.enum([
    "salary", "insurance", "comprehensive-tax", "freelancer", "compare",
    "quit", "withholding", "freelance-rate", "raise", "bonus", "overtime",
    "weekly-holiday-pay", "wage-converter", "severance-pay",
  ]),
  timestamp: z.number().int().nonnegative(),
  label: z.string().min(1).max(120),
  path: z.string().min(1).max(2_000).startsWith("/"),
  summary: z.string().min(1).max(500),
});

export function parseRecentCalcEntries(
  raw: string | null,
  now = Date.now(),
): RecentCalcEntry[] {
  if (!raw) return [];

  try {
    const parsed = z.array(recentCalcSchema).safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    return parsed.data
      .filter((entry) => entry.timestamp >= now - RETENTION_MS && entry.timestamp <= now + 60_000)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_RECENT_CALCS);
  } catch {
    return [];
  }
}

// 싱글톤 — hydration 이후 클라이언트 저장소와 동기화
const entries = ref<RecentCalcEntry[]>([]);
const hydrated = ref(false);

function loadFromStorage(): RecentCalcEntry[] {
  if (typeof window === "undefined") return [];

  try {
    return parseRecentCalcEntries(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function persist(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value));
  } catch {
    // 용량 초과·프라이빗 모드 등 무시
  }
}

export function hydrateRecentCalcs(): void {
  if (hydrated.value) return;
  entries.value = loadFromStorage();
  hydrated.value = true;
  persist();
}

export function addEntry(entry: Omit<RecentCalcEntry, "timestamp">): void {
  hydrateRecentCalcs();
  const now = Date.now();
  const parsed = recentCalcSchema.safeParse({ ...entry, timestamp: now });
  if (!parsed.success) return;
  // type + label 기준 중복 제거
  const filtered = entries.value.filter(
    (e) => !(e.type === entry.type && e.label === entry.label)
  );
  entries.value = [parsed.data, ...filtered].slice(0, MAX_RECENT_CALCS);
  persist();
}

export function clearAll(): void {
  hydrateRecentCalcs();
  entries.value = [];
  persist();
}

export function useRecentCalcs(): {
  entries: DeepReadonly<Ref<RecentCalcEntry[]>>;
  hydrated: DeepReadonly<Ref<boolean>>;
  hydrate: typeof hydrateRecentCalcs;
  addEntry: typeof addEntry;
  clearAll: typeof clearAll;
} {
  return {
    entries: readonly(entries),
    hydrated: readonly(hydrated),
    hydrate: hydrateRecentCalcs,
    addEntry,
    clearAll,
  };
}
