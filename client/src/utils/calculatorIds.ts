// 계산기 이벤트 식별자(calculator_id)의 단일 출처.
//
// 왜 라우트 슬러그인가: 이전에는 뷰마다 손으로 지은 이름("salary_net",
// "health_insurance_reverse", "unpaid_wage_interest")을 썼다. 배선된 4개가 전부 다른
// 작명 규칙이었고, 나머지 22개는 이름조차 없었다. 라우트에서 파생하면 계산기를 추가할 때
// 이름을 새로 짓는 단계 자체가 사라진다.
//
// 파라미터는 반드시 떨어져 나간다: /insurance/140000 · /salary/3000 같은 SEO 변종은
// InsuranceView가 입력마다 URL을 갈아끼우는 경로다. 이벤트 파라미터에 fullPath를 그대로
// 넣으면 page_view가 이미 겪은 카디널리티 폭발(7/10 진단)이 이벤트 쪽에서 재현된다.
//
// 이 목록은 scripts/verify-calculator-analytics.mjs가 사이트맵에서 파생한
// CALCULATOR_ROUTES와 대조한다 — 손으로 센 개수는 어디에도 적지 않는다.
export const CALCULATOR_ROUTES = [
  "/4-insurance-employer",
  "/annual-leave",
  "/bonus",
  "/compare",
  "/comprehensive-tax",
  "/dependent",
  "/eitc",
  "/freelance-rate",
  "/freelancer",
  "/insurance",
  "/irp",
  "/monthly-rent-deduction",
  "/overtime",
  "/parental-leave",
  "/pension",
  "/quit",
  "/raise",
  "/regional-health",
  "/salary",
  "/severance-pay",
  "/unemployment",
  "/unpaid-wage",
  "/wage-converter",
  "/weekly-holiday-pay",
  "/withholding",
  "/year-end-settlement",
] as const;

export type CalculatorRoute = (typeof CALCULATOR_ROUTES)[number];

const CALCULATOR_ROUTE_SET: ReadonlySet<string> = new Set(CALCULATOR_ROUTES);

/** 라우트 슬러그 → calculator_id. 값 세그먼트·쿼리·해시는 전부 떨어뜨린다. */
export function resolveCalculatorId(routePath: string): string {
  const firstSegment = (routePath.split(/[?#]/, 1)[0] ?? "")
    .split("/")
    .filter(Boolean)[0];
  if (!firstSegment) return "";
  return CALCULATOR_ROUTE_SET.has(`/${firstSegment}`) ? firstSegment : "";
}

/** calculator_id에 대응하는 정규 라우트 경로 (링크·이벤트 to 파라미터용). */
export function calculatorRouteOf(calculatorId: string): string {
  return CALCULATOR_ROUTE_SET.has(`/${calculatorId}`) ? `/${calculatorId}` : "";
}
