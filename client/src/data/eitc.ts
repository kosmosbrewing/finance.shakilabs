// 근로장려금·자녀장려금 상수 (2026년 신청분 = 2025년 귀속 기준)
// 근거: 조세특례제한법 제100조의5(근로장려금 산정), 제100조의30(자녀장려금)
// 검증일: 2026-07-27 — 단독 2,200만·홑벌이 3,200만·맞벌이 4,400만 상한, 최대 165/285/330만원
export type EitcHousehold = "single" | "singleIncome" | "doubleIncome";

export type EitcBracket = {
  label: string;
  phaseInEnd: number;
  plateauEnd: number;
  phaseOutEnd: number;
  maxAmount: number;
};

export const EITC_2026: Record<EitcHousehold, EitcBracket> = {
  single: {
    label: "단독 가구",
    phaseInEnd: 4_000_000,
    plateauEnd: 9_000_000,
    phaseOutEnd: 22_000_000,
    maxAmount: 1_650_000,
  },
  singleIncome: {
    label: "홑벌이 가구",
    phaseInEnd: 7_000_000,
    plateauEnd: 14_000_000,
    phaseOutEnd: 32_000_000,
    maxAmount: 2_850_000,
  },
  doubleIncome: {
    label: "맞벌이 가구",
    phaseInEnd: 8_000_000,
    plateauEnd: 17_000_000,
    phaseOutEnd: 44_000_000,
    maxAmount: 3_300_000,
  },
};

export const EITC_PROPERTY_2026 = {
  // 가구원 재산 합계 2.4억 이상 → 지급 제외
  exclusionLimit: 240_000_000,
  // 1.7억 이상 ~ 2.4억 미만 → 50% 감액
  halfReductionThreshold: 170_000_000,
} as const;

// 자녀장려금 (홑벌이·맞벌이만, 부양자녀 1인당)
export const CTC_2026 = {
  incomeLimit: 70_000_000,
  maxPerChild: 1_000_000,
  minPerChild: 500_000,
  phaseOutStart: 21_000_000,
} as const;

export const EITC_HOUSEHOLD_SLUGS: Record<string, EitcHousehold> = {
  "single": "single",
  "single-income": "singleIncome",
  "double-income": "doubleIncome",
};
