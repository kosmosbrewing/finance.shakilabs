import { ref, readonly, type DeepReadonly, type Ref } from "vue";

export type RecentCalcEntry = {
  type: "salary" | "insurance" | "compare" | "quit";
  timestamp: number;
  label: string;
  path: string;
  summary: string;
};

const STORAGE_KEY = "recent-calcs:v1";
const MAX_ENTRIES = 5;

// 싱글톤 — useAlert.ts와 동일 패턴
const entries = ref<RecentCalcEntry[]>(loadFromStorage());

function loadFromStorage(): RecentCalcEntry[] {
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value));
  } catch {
    // 용량 초과·프라이빗 모드 등 무시
  }
}

export function addEntry(entry: Omit<RecentCalcEntry, "timestamp">): void {
  const now = Date.now();
  // type + label 기준 중복 제거
  const filtered = entries.value.filter(
    (e) => !(e.type === entry.type && e.label === entry.label)
  );
  entries.value = [{ ...entry, timestamp: now }, ...filtered].slice(0, MAX_ENTRIES);
  persist();
}

export function clearAll(): void {
  entries.value = [];
  persist();
}

export function useRecentCalcs(): {
  entries: DeepReadonly<Ref<RecentCalcEntry[]>>;
  addEntry: typeof addEntry;
  clearAll: typeof clearAll;
} {
  return {
    entries: readonly(entries),
    addEntry,
    clearAll,
  };
}
