import { afterEach, describe, expect, it, vi } from "vitest";
import { createCalculatorAnalytics } from "@/utils/calculatorAnalytics";
import { CALCULATOR_ROUTES, calculatorRouteOf, resolveCalculatorId } from "@/utils/calculatorIds";

function makeSessionStub() {
  const seen = new Set<string>();
  return {
    seen,
    hasSeenResult: (id: string) => seen.has(id),
    markResultSeen: (id: string) => void seen.add(id),
  };
}

describe("calculatorAnalytics", () => {
  afterEach(() => vi.useRealTimers());

  it("첫 입력과 안정된 결과를 값 없이 기록한다", () => {
    vi.useFakeTimers();
    const track = vi.fn();
    const session = makeSessionStub();
    const analytics = createCalculatorAnalytics({
      calculatorId: () => "insurance",
      pagePath: () => "/finance/insurance",
      track,
      debounceMs: 100,
      ...session,
    });

    analytics.recordInteraction();
    analytics.recordInteraction();
    expect(track).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(track.mock.calls.map(([eventName]) => eventName)).toEqual([
      "calculator_start",
      "calculator_submit",
      "result_view",
    ]);
    expect(track.mock.calls[2]?.[1]).toEqual({
      calculator_id: "insurance",
      page_path: "/finance/insurance",
      calculation_mode: "automatic",
    });
  });

  // 입력 한 글자마다 result_view가 나가면 "결과를 본 사용자" 지표가 타이핑 횟수가 된다.
  it("result_view는 같은 계산기·세션에서 1회만, calculator_submit은 매번 나간다", () => {
    vi.useFakeTimers();
    const track = vi.fn();
    const session = makeSessionStub();
    const analytics = createCalculatorAnalytics({
      calculatorId: () => "insurance",
      pagePath: () => "/finance/insurance",
      track,
      debounceMs: 100,
      ...session,
    });

    analytics.recordInteraction();
    vi.advanceTimersByTime(100);
    analytics.recordInteraction();
    vi.advanceTimersByTime(100);
    analytics.recordInteraction();
    vi.advanceTimersByTime(100);

    const names = track.mock.calls.map(([eventName]) => eventName);
    expect(names.filter((name) => name === "calculator_submit")).toHaveLength(3);
    expect(names.filter((name) => name === "result_view")).toHaveLength(1);
  });

  it("세션 기록은 계산기별로 분리된다", () => {
    vi.useFakeTimers();
    const track = vi.fn();
    const session = makeSessionStub();
    const options = { pagePath: () => "/finance/x", track, debounceMs: 100, ...session };

    const first = createCalculatorAnalytics({ calculatorId: () => "insurance", ...options });
    first.recordInteraction();
    vi.advanceTimersByTime(100);

    const second = createCalculatorAnalytics({ calculatorId: () => "regional-health", ...options });
    second.recordInteraction();
    vi.advanceTimersByTime(100);

    expect(
      track.mock.calls
        .filter(([name]) => name === "result_view")
        .map(([, params]) => (params as { calculator_id: string }).calculator_id),
    ).toEqual(["insurance", "regional-health"]);
  });
});

describe("calculatorIds", () => {
  // page_view가 겪은 파편화(입력마다 /insurance/140000처럼 URL이 바뀜)를 이벤트에서 재현하지 않는다.
  it("값 세그먼트·쿼리·해시를 떼고 라우트 슬러그만 남긴다", () => {
    expect(resolveCalculatorId("/insurance/140000")).toBe("insurance");
    expect(resolveCalculatorId("/salary?gross=52000000")).toBe("salary");
    expect(resolveCalculatorId("/compare/4000-vs-5000")).toBe("compare");
    expect(resolveCalculatorId("/eitc/double-income")).toBe("eitc");
    expect(resolveCalculatorId("/4-insurance-employer")).toBe("4-insurance-employer");
  });

  it("계산기가 아닌 경로에는 id를 주지 않는다", () => {
    expect(resolveCalculatorId("/")).toBe("");
    expect(resolveCalculatorId("/about")).toBe("");
    expect(resolveCalculatorId("/guide/resignation")).toBe("");
  });

  it("모든 등록 라우트가 왕복한다", () => {
    for (const route of CALCULATOR_ROUTES) {
      expect(calculatorRouteOf(resolveCalculatorId(route))).toBe(route);
    }
  });
});
