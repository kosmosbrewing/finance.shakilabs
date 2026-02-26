// 프리렌더 대상 라우트
export const INSURANCE_AMOUNTS = [
  50_000,
  80_000,
  100_000,
  120_000,
  140_000,
  160_000,
  180_000,
  200_000,
  230_000,
  250_000,
  280_000,
  300_000,
  350_000,
  400_000,
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

export const COMPARE_PAIRS = [
  [3000, 4000],
  [4000, 5000],
  [5000, 6000],
  [6000, 7000],
  [7000, 8000],
  [8000, 10000],
];

export const QUIT_YEARS = [1, 3, 5, 10];

export const SEO_ROUTES = [
  "/",
  "/insurance",
  "/salary",
  "/compare",
  "/quit",
  "/about",
  "/privacy",
  ...INSURANCE_AMOUNTS.map((amount) => `/insurance/${amount}`),
  ...SALARY_AMOUNTS.map((amount) => `/salary/${amount}`),
  ...COMPARE_PAIRS.map(([a, b]) => `/compare/${a}-vs-${b}`),
  ...QUIT_YEARS.map((years) => `/quit/${years}years`),
];
