import { afterEach, describe, expect, it, vi } from "vitest";
import { createCalculatorAnalytics } from "@/utils/calculatorAnalytics";

describe("calculatorAnalytics", () => {
  afterEach(() => vi.useRealTimers());

  it("첫 입력과 안정된 결과를 값 없이 기록한다", () => {
    vi.useFakeTimers();
    const track = vi.fn();
    const analytics = createCalculatorAnalytics({
      calculatorId: () => "health_insurance",
      pagePath: () => "/finance/insurance",
      track,
      debounceMs: 100,
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
      calculator_id: "health_insurance",
      page_path: "/finance/insurance",
      calculation_mode: "automatic",
    });
  });
});
