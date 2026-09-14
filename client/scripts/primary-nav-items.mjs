// 2차 내비(데스크톱 인라인) · 모바일 좌측 드로어 · 프리렌더 정적 드로어가 공유하는 단일 출처.
//
// 왜 scripts/에 두나: 프리렌더 레이아웃(prerender-layout.mjs)은 Node에서 돌기 때문에
// .ts를 읽지 못한다. 목록을 양쪽에 적어 두면 계산기를 추가할 때 한쪽만 늘어나고,
// 그 어긋남은 드로어를 열어 보기 전까지 어느 게이트에도 걸리지 않는다.
// 이 저장소는 이미 같은 이유로 scripts/*.mjs + *.d.mts를 src에서 직접 import한다
// (home-content.mjs, next-calculators.mjs 등).

/** @type {readonly {key: string, label: string, to: string, matchPaths: readonly string[]}[]} */
export const PRIMARY_NAV_ITEMS = [
  { key: "insurance", label: "건보료", to: "/insurance", matchPaths: ["/insurance"] },
  { key: "salary", label: "연봉 실수령", to: "/salary", matchPaths: ["/salary"] },
  {
    key: "comprehensive-tax",
    label: "종합소득세",
    to: "/comprehensive-tax",
    // 프리랜서 계산기는 종합소득세 탭에 속한다 — 활성 판정이 두 경로를 함께 본다
    matchPaths: ["/comprehensive-tax", "/freelancer"],
  },
  {
    key: "year-end-settlement",
    label: "연말정산",
    to: "/year-end-settlement",
    matchPaths: ["/year-end-settlement"],
  },
  { key: "severance-pay", label: "퇴직금", to: "/severance-pay", matchPaths: ["/severance-pay"] },
  { key: "unemployment", label: "실업급여", to: "/unemployment", matchPaths: ["/unemployment"] },
  {
    key: "weekly-holiday-pay",
    label: "주휴수당",
    to: "/weekly-holiday-pay",
    matchPaths: ["/weekly-holiday-pay"],
  },
  {
    key: "parental-leave",
    label: "육아휴직",
    to: "/parental-leave",
    matchPaths: ["/parental-leave"],
  },
  {
    key: "wage-converter",
    label: "시급 환산",
    to: "/wage-converter",
    matchPaths: ["/wage-converter"],
  },
  { key: "all", label: "전체 계산기", to: "/all", matchPaths: ["/all"] },
];

/** 현재 경로에 해당하는 탭. 인라인 내비와 드로어가 같은 규칙으로 판정해야 한다. */
export function findActiveNavItem(path) {
  return PRIMARY_NAV_ITEMS.find((item) =>
    item.matchPaths.some((match) => path === match || path.startsWith(`${match}/`)),
  );
}
