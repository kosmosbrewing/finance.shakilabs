// Home page copy and hub catalog — the single source shared by the Vue view (src/views/HomeView.vue)
// and the static prerender (scripts/prerender-content.mjs, scripts/prerender.mjs).
// The home used to redirect to /salary while the prerendered HTML showed a hub, so crawlers and
// users saw different pages. Keeping both sides on this file is what stops that drift returning.
import { SCENARIO_CHAINS } from "./scenario-chains.mjs";

export const HOME_H1 = "2026 연봉 실수령액·세금 계산기 — 상황별 시작점";

export const HOME_INTRO =
  "세전 연봉에서 통장에 찍히는 금액까지, 그리고 이직·퇴사·연말정산까지 이어지는 계산을 한곳에서 처리합니다. 급여·세금·수당·퇴직·절세 다섯 갈래의 계산기를 2026년 요율로 갱신해 운영합니다.";

// Kept to one short line: the mini calculator's answer must stay above the fold.
export const HOME_DESCRIPTION =
  "연봉 한 칸만 넣으면 월 실수령액이 바로 나오고, 조건이 더 필요한 계산은 아래 허브에서 이어집니다.";

// Section order is load-bearing: the view renders the same headings in the same order,
// and HOME_LINKS_AFTER_SECTION decides where the hub link block is spliced in.
export const HOME_SECTIONS = [
  {
    id: "quick-calc",
    h2: "연봉 하나로 월 실수령액 먼저 보기",
    body: "위 계산기는 연봉 한 칸만 받습니다. 기본값 4,000만원이 이미 채워져 있어 페이지를 열자마자 월 실수령액이 보이고, 금액을 바꾸면 잠깐 기다렸다가 자동으로 다시 계산합니다. 부양가족은 본인 1명, 비과세는 월 20만원, 퇴직금은 별도라는 표준 조건으로 고정해 두었습니다. 조건을 바꾸거나 공제 항목별 금액을 뜯어보려면 연봉 실수령액 계산기로 넘어가면 됩니다. 두 화면은 같은 계산 엔진을 쓰기 때문에 같은 연봉을 넣으면 1원 단위까지 같은 금액이 나옵니다.",
  },
  {
    id: "situations",
    h2: "지금 상황에 맞는 계산기 고르기",
    body: "연봉 협상이나 입사를 앞두고 있다면 연봉 실수령액 계산기로 세후 금액부터 확인하세요. 두 회사를 저울질하는 중이라면 이직 연봉 비교가 월 실수령 차이를 나란히 보여줍니다. 급여명세서의 건강보험료만 알고 있다면 건강보험료 역산으로 추정 연봉을 되짚을 수 있고, 퇴사를 앞두고 있다면 퇴직금·실업급여·지역가입자 건보료 세 가지를 함께 계산해야 퇴사 후 현금 흐름이 보입니다. 1~2월에는 연말정산, 5월에는 종합소득세가 가장 많이 쓰입니다.",
  },
  {
    id: "rates",
    h2: "2026년 계산에 적용된 기준",
    body: "국민연금 근로자 부담 4.75%(기준소득월액 41만~659만원 구간), 건강보험 3.595%, 장기요양보험은 건강보험료의 13.14%, 고용보험 0.9%를 적용합니다. 소득세는 6~45% 8구간 누진세율에 지방소득세 10%를 더해 계산하며, 최저임금 시급 10,320원은 주휴수당·시급 환산 계산기에 그대로 반영됩니다. 요율이 바뀌면 계산기와 이 안내를 함께 갱신합니다.",
  },
  {
    id: "sources",
    h2: "계산 근거와 한계",
    body: "국세청 근로소득 간이세액표, 국민건강보험공단 보험료 고시, 국민연금공단 기준소득월액 고시, 고용노동부 고시를 근거로 계산합니다. 다만 회사가 잡아 둔 비과세 항목, 중도 입·퇴사, 성과급 지급 시점에 따라 실제 급여명세서와는 차이가 날 수 있습니다. 결과는 법적 효력이 없는 참고용 추정값이며, 확정 금액은 급여명세서와 원천징수영수증으로 확인하세요.",
  },
  {
    id: "no-signup",
    h2: "회원가입도, 설치도 없이",
    body: "모든 계산기는 브라우저에서 바로 동작합니다. 입력한 급여·세금 정보는 서버로 전송되지 않고 브라우저 안에서만 처리되므로 민감한 급여 정보를 남기지 않고 쓸 수 있습니다. 운영비는 광고로 충당하며 사용자에게 과금하지 않습니다.",
  },
  {
    id: "presets",
    h2: "자주 찾는 금액은 미리 계산해 두었습니다",
    body: "연봉 3,000·4,000·5,000만원, 건보료 10만·14만·20만원처럼 검색이 많은 값은 고정 주소를 가진 개별 페이지로 만들어 두었습니다. 주소를 열면 그 값이 채워진 상태로 계산 결과와 해설이 함께 나오므로, 검색 결과에서 바로 답을 확인하거나 링크를 그대로 공유할 수 있습니다.",
  },
  {
    id: "reading-order",
    h2: "여러 계산기를 순서대로 써야 할 때",
    body: "상황 하나를 판단하려면 계산기 한 개로는 부족한 경우가 많습니다. 이직이라면 제안 연봉의 세후 금액, 두 회사의 실수령 차이, 4대보험 부담 변화를 차례로 봐야 하고, 퇴사라면 퇴직금과 실업급여를 먼저 구한 뒤 퇴사 후 건강보험료를 빼야 실제로 버틸 수 있는 기간이 나옵니다. 이런 흐름은 상황별 가이드에 순서대로 정리해 두었습니다. 이직 준비, 퇴사 준비, 연말정산, 아르바이트 네 가지 가이드가 있으며 각 단계마다 어느 계산기를 왜 여는지 설명합니다.",
  },
  {
    id: "accuracy",
    h2: "숫자가 틀리면 알려주세요",
    body: "세율과 요율은 법령 개정과 정부 고시에 따라 연중에도 바뀝니다. 2026년 7월 국민연금 기준소득월액 상한이 659만원으로 오른 것처럼, 시행일이 지나면 계산 로직과 안내 문구를 함께 갱신합니다. 각 계산기 하단에는 적용한 기준과 시행일, 공식 출처 링크를 표시해 두었으니 중요한 신고나 정산 전에는 원문 고시와 교차 확인하세요. 계산 결과에서 오류를 발견하면 문의 메일로 알려주시면 확인 후 수정합니다.",
  },
];

export const HOME_GUIDE_H2 = "지금 상황에 맞는 계산기 고르기";
export const HOME_LINKS_H2 = "대표 계산기 바로가기";
// Splice the hub links right after the "situations" section so the static body follows
// the same reading order as the rendered page.
export const HOME_LINKS_AFTER_SECTION = 2;

// Five branches of the catalog. The view renders these as cards; the prerender flattens them
// into the link list and the ItemList schema, so all three stay in one order.
export const HOME_HUB_GROUPS = [
  {
    id: "pay",
    icon: "📊",
    title: "급여·연봉",
    items: [
      { to: "/salary", label: "연봉 실수령액 계산기", desc: "부양가족·비과세까지 넣어 정밀 계산" },
      { to: "/insurance", label: "건강보험료 역산 계산기", desc: "건보료만 알아도 연봉 추정" },
      { to: "/compare", label: "이직 연봉 비교", desc: "두 연봉의 월 실수령 차이" },
    ],
  },
  {
    id: "tax",
    icon: "💰",
    title: "세금·신고",
    items: [
      { to: "/comprehensive-tax", label: "종합소득세 계산기", desc: "사업·부업 소득 5월 신고 대비" },
      { to: "/freelancer", label: "프리랜서 세금 계산기", desc: "3.3% 원천징수 후 정산액" },
      { to: "/withholding", label: "원천세 계산기", desc: "떼인 소득세로 연봉 되짚기" },
    ],
  },
  {
    id: "allowance",
    icon: "⏰",
    title: "수당·시급",
    items: [
      { to: "/weekly-holiday-pay", label: "주휴수당 계산기", desc: "주 15시간 이상 근무의 추가 수당" },
      { to: "/wage-converter", label: "시급↔월급↔연봉 환산기", desc: "주휴수당 포함·미포함 양방향" },
      { to: "/overtime", label: "연장·야간·휴일수당", desc: "가산율 적용 후 수당" },
    ],
  },
  {
    id: "leave",
    icon: "🏠",
    title: "퇴직·구직",
    items: [
      { to: "/severance-pay", label: "퇴직금 계산기", desc: "퇴직소득세 뺀 실수령 퇴직금" },
      { to: "/unemployment", label: "실업급여 계산기", desc: "구직급여 수급액·수급기간" },
      { to: "/quit", label: "퇴사 계산기", desc: "퇴직금·실업급여·생존기간 종합" },
    ],
  },
  {
    id: "saving",
    icon: "🛡️",
    title: "절세·공제",
    items: [
      { to: "/year-end-settlement", label: "연말정산 계산기", desc: "환급액·세액공제 시뮬레이션" },
      { to: "/irp", label: "IRP 세액공제 계산기", desc: "납입액 대비 절세 효과" },
      { to: "/eitc", label: "근로장려금 계산기", desc: "가구 유형별 지급액 판정" },
    ],
  },
];

export const HOME_ALL_LINK = { to: "/all", label: "전체 계산기 모아보기" };

function flattenHubItems() {
  return HOME_HUB_GROUPS.flatMap((group) => group.items);
}

// Static link list injected into the prerendered home body (absolute app paths).
export const HOME_PRERENDER_LINKS = [
  ...flattenHubItems().map((item) => ({ path: `/finance${item.to}`, label: item.label })),
  ...SCENARIO_CHAINS.map((chain) => ({
    path: `/finance${chain.route}`,
    label: `${chain.name} 계산 순서 가이드`,
  })),
  { path: `/finance${HOME_ALL_LINK.to}`, label: HOME_ALL_LINK.label },
];

// ItemList schema entries — same catalog, same order as the visible hub.
export const HOME_ITEM_LIST = [
  ...flattenHubItems().map((item) => ({ name: item.label, path: item.to })),
  { name: HOME_ALL_LINK.label, path: HOME_ALL_LINK.to },
];
