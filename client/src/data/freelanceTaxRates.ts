export type IndustryKey = "it" | "education" | "design" | "writing" | "other";
export type IncomeType = "business" | "other_income";

export const FREELANCE_INDUSTRIES: Record<
  IndustryKey,
  { label: string; baseRate: number; excessRate: number }
> = {
  it: { label: "IT·개발·엔지니어링", baseRate: 0.641, excessRate: 0.497 },
  education: { label: "강의·과외·교육", baseRate: 0.617, excessRate: 0.497 },
  design: { label: "디자인·영상·창작", baseRate: 0.641, excessRate: 0.497 },
  writing: { label: "작가·번역·저술", baseRate: 0.641, excessRate: 0.497 },
  other: { label: "기타 인적용역", baseRate: 0.641, excessRate: 0.497 },
};

export const DEFAULT_INDUSTRY: IndustryKey = "it";

export const INDUSTRY_EXPENSE_THRESHOLD = 40_000_000;
export const BUSINESS_WITHHOLDING_RATE = 0.033;
export const OTHER_INCOME_WITHHOLDING_RATE = 0.088;
export const OTHER_INCOME_EXPENSE_RATE = 0.6;

export const LOCAL_PENSION_RATE = 0.095;
export const LOCAL_PENSION_MIN_MONTHLY = 410_000;
export const LOCAL_PENSION_MAX_MONTHLY = 6_590_000;
