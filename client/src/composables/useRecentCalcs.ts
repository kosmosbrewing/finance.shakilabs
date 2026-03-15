import { ref, readonly, type DeepReadonly, type Ref } from "vue";

export type RecentCalcEntry = {
  type:
    | "salary"
    | "insurance"
    | "comprehensive-tax"
    | "compare"
    | "quit"
    | "withholding"
    | "freelance-rate"
    | "raise"
    | "bonus"
    | "overtime";
  timestamp: number;
  label: string;
  path: string;
  summary: string;
};

const STORAGE_KEY = "recent-calcs:v1";
const MAX_ENTRIES = 5;

// 싱글톤 — hydration 이후 클라이언트 저장소와 동기화
const entries = ref<RecentCalcEntry[]>([]);
const hydrated = ref(false);

function loadFromStorage(): RecentCalcEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ENTRIES);
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
}

export function addEntry(entry: Omit<RecentCalcEntry, "timestamp">): void {
  hydrateRecentCalcs();
  const now = Date.now();
  // type + label 기준 중복 제거
  const filtered = entries.value.filter(
    (e) => !(e.type === entry.type && e.label === entry.label)
  );
  entries.value = [{ ...entry, timestamp: now }, ...filtered].slice(0, MAX_ENTRIES);
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
