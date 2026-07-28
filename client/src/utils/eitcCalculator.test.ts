import { describe, expect, it } from "vitest";
import { calculateEitc } from "./eitcCalculator";

const base = {
  household: "single" as const,
  annualIncome: 6_000_000,
  childCount: 0,
  totalProperty: 100_000_000,
};

describe("calculateEitc", () => {
  it("평탄 구간에서는 최대액을 지급한다", () => {
    expect(calculateEitc(base).eitcAfterProperty).toBe(1_650_000);
    expect(
      calculateEitc({ ...base, household: "doubleIncome", annualIncome: 10_000_000 }).eitcAfterProperty,
    ).toBe(3_300_000);
  });

  it("점증 구간은 비례 계산한다", () => {
    // 단독 200만/400만 = 최대액의 50%
    expect(calculateEitc({ ...base, annualIncome: 2_000_000 }).eitcBase).toBe(825_000);
  });

  it("점감 구간과 소득 상한을 적용한다", () => {
    // 단독 상한 2,200만 도달 시 0원
    expect(calculateEitc({ ...base, annualIncome: 22_000_000 }).eitcBase).toBe(0);
    // 점감 중간값: (2,200만-1,550만)/(2,200만-900만) × 165만 = 82.5만
    expect(calculateEitc({ ...base, annualIncome: 15_500_000 }).eitcBase).toBe(825_000);
    // 맞벌이 상한 4,400만
    expect(
      calculateEitc({ ...base, household: "doubleIncome", annualIncome: 44_000_000 }).eitcBase,
    ).toBe(0);
  });

  it("재산 1.7억 이상은 50% 감액, 2.4억 이상은 지급 제외", () => {
    const half = calculateEitc({ ...base, totalProperty: 170_000_000 });
    expect(half.isHalfReduced).toBe(true);
    expect(half.eitcAfterProperty).toBe(825_000);

    const excluded = calculateEitc({ ...base, totalProperty: 240_000_000 });
    expect(excluded.isExcludedByProperty).toBe(true);
    expect(excluded.total).toBe(0);
  });

  it("자녀장려금은 홑벌이·맞벌이만 지급한다", () => {
    expect(calculateEitc({ ...base, childCount: 2 }).ctcBase).toBe(0);
    const singleIncome = calculateEitc({
      ...base,
      household: "singleIncome",
      annualIncome: 20_000_000,
      childCount: 2,
    });
    expect(singleIncome.ctcBase).toBe(2_000_000);
  });

  it("자녀장려금 점감 구간은 자녀당 50만~100만원 사이다", () => {
    const midPhase = calculateEitc({
      ...base,
      household: "singleIncome",
      annualIncome: 45_500_000,
      childCount: 1,
    });
    expect(midPhase.ctcBase).toBe(750_000);
    const atLimit = calculateEitc({
      ...base,
      household: "singleIncome",
      annualIncome: 70_000_000,
      childCount: 1,
    });
    expect(atLimit.ctcBase).toBe(0);
  });
});
