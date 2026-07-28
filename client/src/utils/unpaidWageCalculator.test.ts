import { describe, expect, it } from "vitest";
import { calculateUnpaidWageInterest } from "./unpaidWageCalculator";

describe("calculateUnpaidWageInterest", () => {
  it("퇴직 단계는 14일 유예를 제외하고 연 20%를 적용한다", () => {
    const result = calculateUnpaidWageInterest({
      unpaidAmount: 3_650_000,
      overdueDays: 114,
      stage: "retired",
    });
    expect(result.annualRate).toBe(0.2);
    expect(result.effectiveDays).toBe(100);
    // 365만원 × 20% ÷ 365일 = 하루 2,000원 × 100일
    expect(result.dailyInterest).toBe(2_000);
    expect(result.totalInterest).toBe(200_000);
    expect(result.totalWithPrincipal).toBe(3_850_000);
  });

  it("퇴직 후 14일 이내에는 지연이자가 발생하지 않는다", () => {
    const atGrace = calculateUnpaidWageInterest({
      unpaidAmount: 5_000_000,
      overdueDays: 14,
      stage: "retired",
    });
    expect(atGrace.effectiveDays).toBe(0);
    expect(atGrace.totalInterest).toBe(0);

    const afterGrace = calculateUnpaidWageInterest({
      unpaidAmount: 5_000_000,
      overdueDays: 15,
      stage: "retired",
    });
    expect(afterGrace.effectiveDays).toBe(1);
    expect(afterGrace.totalInterest).toBeGreaterThan(0);
  });

  it("재직·소송 단계는 입력 일수 전체에 각 이율을 적용한다", () => {
    const civil = calculateUnpaidWageInterest({
      unpaidAmount: 3_650_000,
      overdueDays: 100,
      stage: "civil",
    });
    expect(civil.annualRate).toBe(0.05);
    expect(civil.effectiveDays).toBe(100);
    expect(civil.totalInterest).toBe(50_000);

    const litigation = calculateUnpaidWageInterest({
      unpaidAmount: 3_650_000,
      overdueDays: 100,
      stage: "litigation",
    });
    expect(litigation.annualRate).toBe(0.12);
    expect(litigation.totalInterest).toBe(120_000);
  });

  it("음수·0 입력을 안전하게 처리한다", () => {
    const result = calculateUnpaidWageInterest({
      unpaidAmount: -100,
      overdueDays: -5,
      stage: "civil",
    });
    expect(result.totalInterest).toBe(0);
    expect(result.totalWithPrincipal).toBe(0);
  });
});
