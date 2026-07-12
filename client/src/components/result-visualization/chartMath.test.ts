import { describe, expect, it } from "vitest";
import {
  comparisonScale,
  normalizeChartSegments,
  type ChartSegment,
} from "@/components/result-visualization/chartMath";

const segments: ChartSegment[] = [
  { key: "net", label: "실수령", value: 75, color: "green" },
  { key: "tax", label: "공제", value: 25, color: "red" },
];

describe("chartMath", () => {
  it("구성비와 누적 시작점을 계산한다", () => {
    const result = normalizeChartSegments(segments);

    expect(result[0]).toMatchObject({ ratio: 0.75, offset: 0 });
    expect(result[1]).toMatchObject({ ratio: 0.25, offset: 0.75 });
    expect(result.reduce((sum, segment) => sum + segment.ratio, 0)).toBeCloseTo(1);
  });

  it("0 이하와 유효하지 않은 값은 차트에서 제외한다", () => {
    const result = normalizeChartSegments([
      ...segments,
      { key: "zero", label: "0", value: 0, color: "gray" },
      { key: "negative", label: "음수", value: -10, color: "gray" },
      { key: "invalid", label: "오류", value: Number.NaN, color: "gray" },
    ]);

    expect(result.map((segment) => segment.key)).toEqual(["net", "tax"]);
  });

  it("비교 막대는 모든 지표에서 가장 큰 값을 공통 척도로 사용한다", () => {
    expect(
      comparisonScale([
        { key: "gross", label: "월 급여", before: 300, after: 330 },
        { key: "net", label: "실수령", before: 250, after: 270 },
      ]),
    ).toBe(330);
  });
});
