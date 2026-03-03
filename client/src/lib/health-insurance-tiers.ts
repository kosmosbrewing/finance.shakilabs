// 직장가입자 건강보험료 기준 소득 백분위
// - 소득 분위 기준(연봉 구간): 2024 건강보험 통계연보 기반 추정 (2026 통계연보 미발행)
// - 건보료(monthlyPremium): 2026년 확정 요율 3.595% (근로자 부담분) 적용
//   계산식: Math.floor(annualSalary / 12 * 0.03595)
export const HEALTH_INSURANCE_TIERS = [
  { percentile: 1, annualSalary: 200_000_000, monthlyPremium: 599_166 },
  { percentile: 5, annualSalary: 100_000_000, monthlyPremium: 299_583 },
  { percentile: 10, annualSalary: 72_000_000, monthlyPremium: 215_700 },
  { percentile: 25, annualSalary: 48_000_000, monthlyPremium: 143_800 },
  { percentile: 50, annualSalary: 33_000_000, monthlyPremium: 98_862 },
  { percentile: 75, annualSalary: 24_000_000, monthlyPremium: 71_900 },
  { percentile: 90, annualSalary: 18_000_000, monthlyPremium: 53_925 },
] as const;

export type PercentileResult = {
  percentile: number;
  label: string;
};

/**
 * 월 건강보험료를 기반으로 직장가입자 내 소득 백분위를 산출
 * - 최상위 티어 초과 → "상위 1% 이내"
 * - 최하위 티어 미만 → "상위 90% 이하"
 * - 중간 → 인접 두 구간 사이 선형 보간 ("상위 약 38%")
 */
export function findPercentile(monthlyPremium: number): PercentileResult {
  if (monthlyPremium <= 0) {
    return { percentile: 90, label: "상위 90% 이하" };
  }

  // 최상위 티어 초과
  if (monthlyPremium >= HEALTH_INSURANCE_TIERS[0].monthlyPremium) {
    return { percentile: 1, label: "상위 1% 이내" };
  }

  // 최하위 티어 미만
  const lastTier = HEALTH_INSURANCE_TIERS[HEALTH_INSURANCE_TIERS.length - 1];
  if (monthlyPremium < lastTier.monthlyPremium) {
    return { percentile: 90, label: "상위 90% 이하" };
  }

  // 중간 구간: 인접 두 구간 사이 선형 보간
  for (let i = 0; i < HEALTH_INSURANCE_TIERS.length - 1; i++) {
    const upper = HEALTH_INSURANCE_TIERS[i];
    const lower = HEALTH_INSURANCE_TIERS[i + 1];

    if (monthlyPremium >= lower.monthlyPremium) {
      const ratio =
        (upper.monthlyPremium - monthlyPremium) /
        (upper.monthlyPremium - lower.monthlyPremium);
      // 5% 단위로 올림 — 보수적 표기 (실제보다 순위를 높게 말하지 않음)
      const raw = upper.percentile + ratio * (lower.percentile - upper.percentile);
      const rounded = Math.min(90, Math.max(1, Math.ceil(raw / 5) * 5));
      return {
        percentile: rounded,
        label: `상위 약 ${rounded}%`,
      };
    }
  }

  return { percentile: 90, label: "상위 90% 이하" };
}
