import {
  CTC_2026,
  EITC_2026,
  EITC_PROPERTY_2026,
  type EitcHousehold,
} from "@/data/eitc";

export type EitcInput = {
  household: EitcHousehold;
  annualIncome: number;
  childCount: number;
  totalProperty: number;
};

export type EitcResult = {
  eitcBase: number;
  eitcAfterProperty: number;
  ctcBase: number;
  ctcAfterProperty: number;
  total: number;
  isExcludedByProperty: boolean;
  isHalfReduced: boolean;
  maxAmount: number;
};

// 점증(0~phaseInEnd) → 평탄(최대액) → 점감(phaseOutEnd에서 0) 산식의 간이 계산.
// 실제 산정표는 총급여 구간 단위와 단수 조정이 있어 소액 차이가 날 수 있다.
function eitcAmount(income: number, household: EitcHousehold): number {
  const bracket = EITC_2026[household];
  if (income >= bracket.phaseOutEnd) return 0;
  if (income < bracket.phaseInEnd) {
    return Math.floor((bracket.maxAmount * income) / bracket.phaseInEnd);
  }
  if (income <= bracket.plateauEnd) return bracket.maxAmount;
  return Math.floor(
    (bracket.maxAmount * (bracket.phaseOutEnd - income)) / (bracket.phaseOutEnd - bracket.plateauEnd),
  );
}

// 자녀장려금 — 홑벌이·맞벌이 가구, 총급여 7,000만원 미만, 자녀 1인당 50만~100만원
function ctcAmount(income: number, household: EitcHousehold, childCount: number): number {
  if (household === "single" || childCount <= 0) return 0;
  if (income >= CTC_2026.incomeLimit) return 0;
  if (income < CTC_2026.phaseOutStart) return CTC_2026.maxPerChild * childCount;
  const perChild = Math.max(
    CTC_2026.minPerChild,
    Math.floor(
      CTC_2026.maxPerChild
        - ((income - CTC_2026.phaseOutStart)
          * (CTC_2026.maxPerChild - CTC_2026.minPerChild))
          / (CTC_2026.incomeLimit - CTC_2026.phaseOutStart),
    ),
  );
  return perChild * childCount;
}

export function calculateEitc(input: EitcInput): EitcResult {
  const income = Math.max(0, input.annualIncome);
  const property = Math.max(0, input.totalProperty);
  const childCount = Math.max(0, Math.floor(input.childCount));

  const eitcBase = eitcAmount(income, input.household);
  const ctcBase = ctcAmount(income, input.household, childCount);

  const isExcludedByProperty = property >= EITC_PROPERTY_2026.exclusionLimit;
  const isHalfReduced = !isExcludedByProperty
    && property >= EITC_PROPERTY_2026.halfReductionThreshold;
  const factor = isExcludedByProperty ? 0 : isHalfReduced ? 0.5 : 1;

  const eitcAfterProperty = Math.floor(eitcBase * factor);
  const ctcAfterProperty = Math.floor(ctcBase * factor);

  return {
    eitcBase,
    eitcAfterProperty,
    ctcBase,
    ctcAfterProperty,
    total: eitcAfterProperty + ctcAfterProperty,
    isExcludedByProperty,
    isHalfReduced,
    maxAmount: EITC_2026[input.household].maxAmount,
  };
}
