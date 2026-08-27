// 계산기 카탈로그 — "이 사이트에 어떤 계산기가 있는가"의 단일 출처.
//
// 왜 생겼나: 같은 목록이 세 벌 있었고 세 벌 다 서로 달랐다.
//   - public/llms.txt        23개 (URL 23개)
//   - prerender-layout.mjs   22개 (크롤러가 JS 없이 보는 푸터)
//   - src/data/footerNav.ts  26개 (Vue 푸터)
// 수익 스프린트가 /dependent·/unpaid-wage·/eitc를 추가하면서 Vue 푸터만 갱신됐기 때문이다.
// 손으로 센 숫자는 다음 계산기를 추가할 때 또 어긋나므로, 개수는 아래에서 파생만 하고
// 어디에도 적지 않는다.
//
// 검증 두 방향(둘 다 빌드 시점에 throw):
//   1. 카탈로그 라우트 집합 === seo-routes.mjs가 사이트맵에서 파생한 CALCULATOR_ROUTES
//   2. 카탈로그 라우트 집합 === src/data/footerNav.ts(Vue 푸터)의 링크 집합
// 1번은 "라우트는 추가했는데 카탈로그를 잊음", 2번은 "화면 푸터만 갱신"을 각각 잡는다.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CALCULATOR_ROUTES } from "./seo-routes.mjs";

// 분류는 Vue 푸터(footerNav.ts)와 같은 5개 묶음을 쓴다 — 화면과 llms.txt가 다른 분류를 쓰면
// "같은 목록"이라는 주장 자체가 흔들린다.
export const CALCULATOR_CATALOG = [
  {
    category: "급여·연봉",
    items: [
      {
        route: "/salary",
        label: "연봉 실수령액 계산기",
        summary: "연봉에서 4대보험+소득세 공제 후 월 실수령액 계산",
      },
      {
        route: "/insurance",
        label: "건강보험료 역산 계산기",
        summary: "건보료로 역산한 예상 연봉 계산",
      },
      {
        route: "/compare",
        label: "이직 연봉 비교",
        summary: "두 연봉의 실수령 차이 비교",
      },
      {
        route: "/raise",
        label: "연봉 인상률 계산기",
        summary: "연봉 인상 시 실수령액 변화 시뮬레이션",
      },
      {
        route: "/bonus",
        label: "성과급 실수령 계산기",
        summary: "상여금 세후 실수령액 계산",
      },
    ],
  },
  {
    category: "세금·신고",
    items: [
      {
        route: "/comprehensive-tax",
        label: "종합소득세 계산기",
        summary: "사업·프리랜서 소득 종합소득세 계산",
      },
      {
        route: "/freelancer",
        label: "프리랜서 세금 계산기",
        summary: "3.3% 원천징수 프리랜서 세금 계산",
      },
      {
        route: "/withholding",
        label: "원천세 역산 계산기",
        summary: "소득세로 연봉 역추정",
      },
      {
        route: "/freelance-rate",
        label: "프리랜서 단가 역산",
        summary: "원천세 제외 실수령 단가 계산",
      },
      {
        route: "/4-insurance-employer",
        label: "사업주 4대보험 계산기",
        summary: "고용주 부담금·인건비 계산",
      },
    ],
  },
  {
    category: "수당·시급",
    items: [
      {
        route: "/weekly-holiday-pay",
        label: "주휴수당 계산기",
        summary: "아르바이트 주휴수당·실질 시급 계산",
      },
      {
        route: "/wage-converter",
        label: "시급↔월급↔연봉 환산기",
        summary: "주휴수당 포함·미포함 환산",
      },
      {
        route: "/overtime",
        label: "연장·야간·휴일수당 계산기",
        summary: "초과근무 수당 계산",
      },
      {
        route: "/annual-leave",
        label: "연차수당 계산기",
        summary: "미사용 연차 보상금 계산",
      },
    ],
  },
  {
    category: "퇴직·구직",
    items: [
      {
        route: "/quit",
        label: "퇴사 계산기",
        summary: "퇴직금·실업급여·생존기간 종합 시뮬레이션",
      },
      {
        route: "/severance-pay",
        label: "퇴직금 계산기",
        summary: "퇴직소득세 공제 후 실수령 퇴직금",
      },
      {
        route: "/unemployment",
        label: "실업급여 계산기",
        summary: "구직급여 수급액·수급기간 계산",
      },
      {
        route: "/parental-leave",
        label: "육아휴직 급여 계산기",
        summary: "6+6 부모육아휴직제 급여 계산",
      },
      {
        route: "/regional-health",
        label: "지역가입자 건보료 계산기",
        summary: "퇴사 후 건보·임의계속가입 비교",
      },
      {
        route: "/dependent",
        label: "피부양자 자격 판정",
        summary: "합산소득·재산세 과세표준 기준 건강보험 피부양자 자격 판정",
      },
      {
        route: "/unpaid-wage",
        label: "임금체불 지연이자 계산기",
        summary: "밀린 임금·퇴직금의 지연이자 계산 (퇴직 후 연 20%)",
      },
    ],
  },
  {
    category: "절세·공제",
    items: [
      {
        route: "/year-end-settlement",
        label: "연말정산 계산기",
        summary: "환급액·세액공제 시뮬레이션",
      },
      {
        route: "/monthly-rent-deduction",
        label: "월세 세액공제 계산기",
        summary: "연말정산 월세 환급액 계산",
      },
      {
        route: "/irp",
        label: "IRP 세액공제 계산기",
        summary: "개인형 퇴직연금 절세 효과 계산",
      },
      {
        route: "/pension",
        label: "국민연금 수령액 계산기",
        summary: "예상 연금액·납부액 조회",
      },
      {
        route: "/eitc",
        label: "근로장려금 계산기",
        summary: "가구 유형별 근로장려금·자녀장려금 예상 지급액 계산",
      },
    ],
  },
];

export const CALCULATOR_ITEMS = CALCULATOR_CATALOG.flatMap((group) => group.items);

function assertSameRouteSet(actual, expected, what) {
  const missing = expected.filter((route) => !actual.includes(route));
  const extra = actual.filter((route) => !expected.includes(route));
  if (missing.length === 0 && extra.length === 0) return;
  throw new Error(
    `[calculator-catalog] ${what}\n` +
      (missing.length ? `  빠진 라우트: ${missing.join(", ")}\n` : "") +
      (extra.length ? `  기준에 없는 라우트: ${extra.join(", ")}\n` : ""),
  );
}

const catalogRoutes = CALCULATOR_ITEMS.map((item) => item.route);

if (new Set(catalogRoutes).size !== catalogRoutes.length) {
  throw new Error("[calculator-catalog] 같은 라우트가 두 번 들어 있습니다");
}

assertSameRouteSet(
  catalogRoutes,
  CALCULATOR_ROUTES,
  "사이트맵에서 파생한 계산기 라우트와 카탈로그가 다릅니다 (seo-routes.mjs 기준)",
);

// Vue 푸터 미러 검증 (faq-data.mjs와 같은 "소스 미러" 패턴).
// footerNav.ts는 화면 푸터의 단일 출처이므로, 여기서 라우트 집합이 갈라지면
// 크롤러가 보는 정적 푸터와 사람이 보는 푸터가 서로 다른 목록을 갖게 된다.
const footerNavSource = readFileSync(
  resolve(import.meta.dirname, "..", "src/data/footerNav.ts"),
  "utf8",
);
// FOOTER_SECTIONS 블록만 본다 — 같은 파일의 FOOTER_ALL_LINK("/all")는 계산기가 아니라
// 허브 링크라서 목록에 섞이면 안 된다.
const footerSectionsBlock = footerNavSource.slice(
  footerNavSource.indexOf("FOOTER_SECTIONS"),
  footerNavSource.indexOf("FOOTER_ALL_LINK"),
);
if (!footerSectionsBlock) {
  throw new Error("[calculator-catalog] src/data/footerNav.ts에서 FOOTER_SECTIONS를 찾지 못했습니다");
}
const footerNavRoutes = [...footerSectionsBlock.matchAll(/\{\s*to:\s*"([^"]+)"/g)].map(
  ([, route]) => route,
);
// 파싱이 조용히 0건을 돌려주면 아무것도 검사하지 않으면서 통과 로그만 찍는다.
if (footerNavRoutes.length === 0) {
  throw new Error("[calculator-catalog] src/data/footerNav.ts에서 링크를 하나도 파싱하지 못했습니다");
}
assertSameRouteSet(
  footerNavRoutes,
  CALCULATOR_ROUTES,
  "src/data/footerNav.ts(Vue 푸터)와 계산기 라우트가 다릅니다",
);
