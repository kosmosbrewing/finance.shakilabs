// 페이지 제목 단일 소스 — 프리렌더(scripts/prerender*.mjs)·라우터 meta·뷰 SEOHead가 모두 여기서 제목을 가져온다.
//
// 왜 한 곳인가: 같은 페이지의 제목이 프리렌더 <title>, 라우터 meta(document.title·GA page_title),
// 뷰 useHead 세 곳에 따로 적혀 있었고, /insurance·/compare·/quit·/about 등은 크롤러가 받는 제목과
// 하이드레이션 뒤 제목이 서로 달랐다.
//
// 레시피(함대 공통, 2026-10-03):
//  - 계산기·도구·가이드: `<페이지 제목> | ShakiLabs`
//  - 홈: `<앱 이름> | ShakiLabs`, 허브(/all)·소개·약관·개인정보·404: `<페이지 제목> · <앱 이름> | ShakiLabs`
//    — 앱 이름을 빼면 "이용약관 | ShakiLabs"가 12개 앱에서 같은 제목이 된다.
//  - 페이지 제목은 40자 이하, 검색 구절은 앞 28자 안 — 네이버 검색 결과가 제목을 약 35자에서 자른다.
// 브랜드 접미사는 brandTitle() 한 함수만 붙인다. 아래 표에는 접미사를 넣지 않는다.
// 숫자·연도는 데이터와 같아야 한다("2026"은 계산 기준 연도, "N개"는 실제 개수).

export const SITE_BRAND = "ShakiLabs";
export const BRAND_SUFFIX = ` | ${SITE_BRAND}`;
// 앱 이름은 홈 제목이자 정책 페이지의 구분자다. 홈 첫 화면이 건보료 계산기 + 연봉 실수령액 모드라
// 두 검색 구절을 그대로 이름에 둔다.
export const APP_NAME = "연봉 실수령액·건보료 계산기";
export const PAGE_TITLE_MAX_CHARS = 40;
export const SEARCH_PHRASE_WINDOW = 28;

// 이미 붙은 접미사(중복 포함)는 떼고 정확히 한 번만 붙인다 — 어느 경로로 와도 이중 부착이 없다.
const BRAND_SUFFIX_RE = /(?:\s*\|\s*ShakiLabs)+\s*$/;

export function brandTitle(pageTitle) {
  const base = String(pageTitle ?? "").replace(BRAND_SUFFIX_RE, "").trim();
  return `${base || APP_NAME}${BRAND_SUFFIX}`;
}

function withAppName(pageTitle) {
  return `${pageTitle} · ${APP_NAME}`;
}

// 앱 이름이 붙는 페이지(홈 제외). 게이트가 이 목록으로 두 레시피를 가른다.
export const APP_NAME_ROUTES = Object.freeze(["/all", "/about", "/terms", "/privacy", "/404"]);

export const NOT_FOUND_TITLE = withAppName("페이지를 찾을 수 없습니다");

// /all의 화면 h1 = 프리렌더 h1 = 제목 앞부분. 한 상수에서 파생해 세 곳이 어긋나지 않게 한다.
// 계산기 개수는 제목 대신 설명에 둔다 — 앱 이름까지 붙이면 "N개"를 넣을 자리가 없다.
export const ALL_CALCULATORS_HEADING = "2026 세금·연봉·수당 계산기 모음";

export const PAGE_TITLES = Object.freeze({
  "/": APP_NAME,
  "/insurance": "2026 건강보험료로 연봉 계산기 · 4대보험",
  "/salary": "2026 연봉 실수령액 계산기 · 4대보험 + 소득세 자동 계산",
  "/comprehensive-tax": "2026 종합소득세 계산기 · 프리랜서·사업소득 세금",
  "/freelancer": "2026 프리랜서 세금 계산기 · 3.3% 종합소득세",
  "/freelance-rate": "2026 프리랜서 세후 단가 역산 계산기 · 원천세 제외 실수령",
  "/compare": "이직 연봉 비교 계산기 · 실수령액 차이 비교 2026",
  // 네이버 30일 노출 742·CTR 2.3%("연봉협상 인상률" 476회) — 검색 구절을 맨 앞에, 협상 전후 비교를 약속한다
  "/raise": "연봉 인상률 계산기 · 협상 전후 실수령액 비교 2026",
  "/bonus": "2026 성과급 실수령 계산기 · 상여금 세금·4대보험 공제",
  "/annual-leave": "2026 연차 수당 계산기 · 미사용 연차 보상금 계산",
  "/overtime": "2026 연장·야간·휴일수당 계산기 · 초과근무 수당 계산",
  "/pension": "2026 국민연금 수령액 계산기 · 예상 연금액·납부액 조회",
  "/monthly-rent-deduction": "2026 월세 세액공제 계산기 · 연말정산 월세 환급액",
  "/irp": "2026 IRP 세액공제 계산기 · 개인형 퇴직연금 절세 효과",
  "/4-insurance-employer": "2026 사업주 4대보험 계산기 · 고용주 부담금·인건비 계산",
  "/withholding": "원천세 계산기 · 소득세로 연봉 추정 2026",
  "/quit": "퇴사 계산기 2026 · 퇴직금·실업급여·생존기간",
  "/parental-leave": "2026 육아휴직 급여 계산기 · 6+6 부모육아휴직제 반영",
  "/year-end-settlement": "2026 연말정산 계산기 · 환급액·세액공제 시뮬레이터",
  "/unemployment": "2026 실업급여 계산기 · 구직급여 수급액·수급기간",
  "/regional-health": "지역가입자 건강보험료 계산기 · 퇴사 후 건보 비교",
  "/dependent": "2026 건보 피부양자 자격 판정기 · 소득·재산 기준",
  "/unpaid-wage": "임금체불 지연이자 계산기 · 퇴직 후 연 20%·재직 5~6%",
  "/eitc": "2026 근로장려금·자녀장려금 계산기 · 가구 유형별 지급액",
  "/weekly-holiday-pay": "2026 주휴수당 계산기 · 아르바이트 주휴수당·실질 시급",
  "/wage-converter": "2026 시급 월급 연봉 환산기 · 주휴수당 포함·미포함",
  "/severance-pay": "2026 퇴직금 계산기 · 퇴직소득세·실수령 퇴직금",
  "/2027": "2027년 달라지는 세금·지원금 한눈에 · 세법개정안·예산안 정리",
  "/guide/resignation": "퇴사 전 계산 순서 가이드 · 퇴직금→실업급여→건보료",
  "/guide/job-change": "이직 연봉 협상 계산 순서 · 실수령·4대보험·인상률",
  // "5개"는 scenario-chains.mjs year-end 체인의 단계 수다
  "/guide/year-end": "연말정산 준비 순서 가이드 · 공제 계산기 5개 점검",
  "/guide/part-time": "알바 급여 계산 순서 · 시급 환산→주휴수당→연장수당",
  "/all": withAppName(ALL_CALCULATORS_HEADING),
  "/about": withAppName("서비스 소개"),
  "/terms": withAppName("이용약관"),
  "/privacy": withAppName("개인정보처리방침"),
});

// 메타 설명을 본문 문장과 따로 두는 페이지. 프리렌더 가이드는 description을 본문 첫 문단으로도 쓰므로,
// 검색 결과용 설명을 고칠 때 본문이 같이 바뀌지 않게 분리한다.
export const META_DESCRIPTIONS = Object.freeze({
  "/raise":
    "현재 연봉과 인상률을 넣으면 협상 전후 월 실수령액·월 공제액과 연간 실수령 증가분을 비교합니다. 인상분 중 4대보험·소득세로 빠지는 금액도 보여 줍니다. 2026년 기준, 성과급 제외.",
});

export function pageTitle(route) {
  const title = PAGE_TITLES[route];
  if (!title) throw new Error(`[page-titles] No page title for ${route}`);
  return title;
}

// --- 금액·연수 변형 페이지 — 프리렌더와 뷰가 같은 숫자 표기를 쓰도록 포맷터도 여기 둔다 ---
function formatManWon(manWon) {
  if (manWon >= 10000) return `${(manWon / 10000).toLocaleString("ko-KR")}억`;
  return `${manWon.toLocaleString("ko-KR")}만`;
}

function formatWon(value) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function salaryVariantTitle(manWon) {
  return `연봉 ${formatManWon(manWon)} 실수령액 · 2026 월급 실수령 계산기`;
}

// 제목의 추정 연봉은 프리렌더 본문(buildPrerenderSection)과 같은 근사식이다 — 건보료율 3.595%, 비과세 월 20만원.
export function insuranceVariantTitle(feeWon) {
  const feeManWon = Math.round(feeWon / 10000);
  const taxableMonthly = Math.floor(feeWon / 0.03595);
  const estimatedManWon = Math.round(((taxableMonthly + 200_000) * 12) / 10_000);
  return `건보료 ${feeManWon}만원이면 연봉 약 ${estimatedManWon.toLocaleString("ko-KR")}만원 · 2026 기준`;
}

export function comprehensiveTaxVariantTitle(manWon) {
  return `종합소득 ${manWon}만원 세금 계산 · 2026 종합소득세 계산기`;
}

export function freelancerVariantTitle(manWon) {
  return `프리랜서 수입 ${formatManWon(manWon)} 세금 계산 · 2026 3.3% 종합소득세`;
}

// "만원"을 "만"으로 줄여 가장 긴 8,000 vs 10,000도 40자 안에 든다
export function compareVariantTitle(aManWon, bManWon) {
  return `연봉 ${aManWon.toLocaleString("ko-KR")}만 vs ${bManWon.toLocaleString("ko-KR")}만 비교 · 이직 실수령 차이 2026`;
}

export function quitVariantTitle(years) {
  return `${years}년 근속 퇴사 계산기 · 퇴직금·실업급여·생존기간 2026`;
}

export function withholdingVariantTitle(amountWon) {
  return `월 소득세 ${formatWon(amountWon)} → 연봉 계산기 · 2026`;
}

export function yearEndVariantTitle(manWon) {
  return `연봉 ${formatManWon(manWon)} 연말정산 환급액 계산 · 2026`;
}

export function parentalLeaveVariantTitle(manWon) {
  return `통상임금 ${formatManWon(manWon)} 육아휴직 급여 계산 · 2026`;
}

export function unemploymentVariantTitle(manWon) {
  return `월급 ${formatManWon(manWon)} 실업급여 계산기 · 2026 구직급여`;
}

export function regionalHealthVariantTitle(manWon) {
  return `월급 ${formatManWon(manWon)} 지역가입자 건보료 · 퇴사 후 건강보험`;
}

export function weeklyHolidayPayVariantTitle(hourlyWon) {
  return `시급 ${hourlyWon.toLocaleString("ko-KR")}원 주휴수당 계산 · 2026`;
}

export function wageConverterVariantTitle(hourlyWon) {
  return `시급 ${hourlyWon.toLocaleString("ko-KR")}원 월급·연봉 환산 · 2026`;
}

export function severancePayVariantTitle(years) {
  return `${years}년 근속 퇴직금 계산 · 2026`;
}

export function unpaidWageVariantTitle(manWon) {
  return `체불임금 ${formatManWon(manWon)} 지연이자 계산기 · 연 20% 기준`;
}

export function eitcVariantTitle(householdLabel) {
  return `${householdLabel} 근로장려금 계산기 · 2026 지급액 조회`;
}
