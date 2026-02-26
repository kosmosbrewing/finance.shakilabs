export const UNEMPLOYMENT_2026 = {
  rate: 0.6,
  dailyMax: 68_100, // 2026년 상한액 (2025년 66,000 → 인상)
  dailyMin: 66_048, // 2026년 하한액: 최저시급 10,030 × 8h × 80% ≈ 66,048 (고용부 고시)
  durationTable: {
    // 피보험기간 키: 0=1년미만, 1=1~3년, 3=3~5년, 5=5~10년, 10=10년이상
    under50: { 0: 120, 1: 150, 3: 180, 5: 210, 10: 240 },
    over50:  { 0: 150, 1: 180, 3: 210, 5: 240, 10: 270 },
  },
} as const;

export type DurationBucket = 0 | 1 | 3 | 5 | 10;
export type QuitReason = "layoff" | "dismissal" | "contract_end" | "voluntary";
