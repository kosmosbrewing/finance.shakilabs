import { describe, expect, it } from "vitest";
import { parseRecentCalcEntries } from "./useRecentCalcs";

describe("recent calculations storage", () => {
  const now = new Date("2026-07-11T06:00:00Z").getTime();
  const entry = {
    type: "salary",
    label: "연봉 계산",
    path: "/salary?gross=50000000",
    summary: "월 실수령 결과",
  } as const;

  it("keeps valid entries for up to seven days", () => {
    const raw = JSON.stringify([{ ...entry, timestamp: now - 6 * 24 * 60 * 60 * 1000 }]);
    expect(parseRecentCalcEntries(raw, now)).toHaveLength(1);
  });

  it("drops expired and malformed browser data", () => {
    const expired = JSON.stringify([{ ...entry, timestamp: now - 8 * 24 * 60 * 60 * 1000 }]);
    expect(parseRecentCalcEntries(expired, now)).toEqual([]);
    expect(parseRecentCalcEntries(JSON.stringify([{ ...entry, path: "https://example.com", timestamp: now }]), now)).toEqual([]);
    expect(parseRecentCalcEntries("not-json", now)).toEqual([]);
  });
});
