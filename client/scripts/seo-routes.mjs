// 프리렌더 대상 라우트
// 건보료 축: GA 유입 1위 축이라 1만원 단위로 촘촘히 커버 (인접 구간 비교표가 페이지별 고유 해석 제공)
export const INSURANCE_AMOUNTS = [
  50_000,
  60_000,
  70_000,
  80_000,
  90_000,
  100_000,
  110_000,
  120_000,
  130_000,
  140_000,
  150_000,
  160_000,
  170_000,
  180_000,
  190_000,
  200_000,
  210_000,
  220_000,
  230_000,
  240_000,
  250_000,
  260_000,
  270_000,
  280_000,
  300_000,
  320_000,
  350_000,
  380_000,
  400_000,
  450_000,
  500_000,
];

export const SALARY_AMOUNTS = [
  2000,
  2500,
  3000,
  3500,
  4000,
  4500,
  5000,
  5500,
  6000,
  7000,
  8000,
  9000,
  10000,
  12000,
  15000,
  20000,
  30000,
  50000,
];

export const COMPREHENSIVE_TAX_AMOUNTS = [
  1000,
  2000,
  3000,
  4000,
  5000,
  6000,
  8000,
  10000,
  15000,
  20000,
];

export const FREELANCER_AMOUNTS = [2000, 3000, 4000, 5000, 8000, 10000];

export const COMPARE_PAIRS = [
  [3000, 5000],
  [3000, 4000],
  [4000, 5000],
  [5000, 6000],
  [6000, 7000],
  [7000, 8000],
  [8000, 10000],
];

export const QUIT_YEARS = [1, 3, 5, 10];

export const WITHHOLDING_AMOUNTS = [
  30_000, 50_000, 100_000, 150_000, 200_000, 300_000, 500_000,
];

export const YEAR_END_AMOUNTS = [3000, 4500, 5200, 6000, 7500, 10000];

export const PARENTAL_LEAVE_AMOUNTS = [250, 300, 350, 400, 450, 500];

export const UNEMPLOYMENT_AMOUNTS = [250, 350, 500];
export const REGIONAL_HEALTH_AMOUNTS = [250, 350, 500];

export const WEEKLY_HOLIDAY_PAY_AMOUNTS = [10320, 11000, 12000, 15000];
export const WAGE_CONVERTER_AMOUNTS = [10320, 12000, 15000, 20000];
export const SEVERANCE_PAY_AMOUNTS = [1, 3, 5, 10];

export const SEO_ROUTES = [
  "/insurance",
  "/salary",
  "/raise",
  "/bonus",
  "/annual-leave",
  "/overtime",
  "/pension",
  "/monthly-rent-deduction",
  "/irp",
  "/4-insurance-employer",
  "/comprehensive-tax",
  "/freelancer",
  ...FREELANCER_AMOUNTS.map((amount) => `/freelancer/${amount}`),
  "/freelance-rate",
  "/compare",
  "/quit",
  "/all",
  "/about",
  "/terms",
  "/privacy",
  ...INSURANCE_AMOUNTS.map((amount) => `/insurance/${amount}`),
  ...SALARY_AMOUNTS.map((amount) => `/salary/${amount}`),
  ...COMPREHENSIVE_TAX_AMOUNTS.map((amount) => `/comprehensive-tax/${amount}`),
  ...COMPARE_PAIRS.map(([a, b]) => `/compare/${a}-vs-${b}`),
  ...QUIT_YEARS.map((years) => `/quit/${years}years`),
  "/withholding",
  ...WITHHOLDING_AMOUNTS.map((amount) => `/withholding/${amount}`),
  "/year-end-settlement",
  ...YEAR_END_AMOUNTS.map((amount) => `/year-end-settlement/${amount}`),
  "/parental-leave",
  ...PARENTAL_LEAVE_AMOUNTS.map((amount) => `/parental-leave/${amount}`),
  "/unemployment",
  ...UNEMPLOYMENT_AMOUNTS.map((amount) => `/unemployment/${amount}`),
  "/regional-health",
  ...REGIONAL_HEALTH_AMOUNTS.map((amount) => `/regional-health/${amount}`),
  "/weekly-holiday-pay",
  ...WEEKLY_HOLIDAY_PAY_AMOUNTS.map((amount) => `/weekly-holiday-pay/${amount}`),
  "/wage-converter",
  ...WAGE_CONVERTER_AMOUNTS.map((amount) => `/wage-converter/${amount}`),
  "/severance-pay",
  ...SEVERANCE_PAY_AMOUNTS.map((amount) => `/severance-pay/${amount}`),
];
