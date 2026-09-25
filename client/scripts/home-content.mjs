// Home page copy and hub catalog — the single source shared by the Vue view (src/views/HomeView.vue)
// and the static prerender (scripts/prerender-content.mjs, scripts/prerender.mjs).
// The home used to redirect to /salary while the prerendered HTML showed a hub, so crawlers and
// users saw different pages. Keeping both sides on this file is what stops that drift returning.
import { SCENARIO_CHAINS } from "./scenario-chains.mjs";

export const HOME_H1 = "2026 연봉 실수령액·세금 계산기 — 상황별 시작점";

// H1 아래 도입은 한 줄이다(2026-09-25): 도입 두 문단(4줄) + 섹션 제목 + 계산기 아래 설명(5줄)이
// 계산기를 위아래로 감싸 "읽는 페이지"처럼 보였다. 무엇을 넣으면 무엇이 나오는지는 계산기 자체가
// 말하므로, 도입은 사이트가 무엇인지 한 줄만 말한다. 옛 두 번째 문단(HOME_DESCRIPTION)은 폐기.
export const HOME_INTRO =
  "2026년 요율로 갱신한 급여·세금·수당·퇴직·절세 계산기 26개를 한곳에 모았습니다.";

// Section order is load-bearing: the view renders the same headings in the same order,
// and HOME_LINKS_AFTER_SECTION decides where the hub link block is spliced in.
export const HOME_SECTIONS = [
  {
    id: "quick-calc",
    h2: "건보료·연봉으로 월 실수령액 바로 보기",
    // 계산기 왼쪽 칸, 입력 아래에 붙는 두 문장. 화면이 스스로 설명하는 것(기본값·모드 전환·상세 설정)은
    // 되풀이하지 않고, 화면만 봐서는 모르는 것 — 무엇으로 역산하는지, 상세 화면과 값이 같은지 — 만 남긴다.
    body: "급여명세서의 건강보험료(근로자 부담분)로 보수월액을 되짚어 연봉과 월 실수령액을 추정합니다. 건강보험료·연봉 계산기 화면과 같은 계산 엔진이라 같은 값을 넣으면 1원 단위까지 같은 금액이 나옵니다.",
  },
];

// 홈 FAQ — "어느 계산기를 열 것인가"만 답한다.
//
// 요율·근거·운영 방침을 묻는 문답은 여기 두지 않는다. 그 주제는 /all로 옮겼고, 같은 내용을
// 홈 FAQ로 다시 쓰면 이관이 아니라 복제가 된다. 화면 아코디언·프리렌더 본문·FAQPage 스키마가
// 모두 이 배열 하나에서 나오므로 세 곳이 갈라질 수 없다.
export const HOME_FAQS = [
  {
    q: "계산기가 26개인데 어느 것부터 열어야 하나요?",
    a: "지금 손에 있는 숫자로 고르면 빠릅니다. 급여명세서의 건강보험료나 세전 연봉 하나라면 이 화면 맨 위 계산기에서 '건보료로 계산'과 '연봉으로 계산'을 골라 바로 보면 되고, 제안받은 연봉이 두 개라면 이직 연봉 비교, 퇴사를 앞두고 있다면 퇴사 계산기가 출발점입니다. 무엇을 넣어야 할지 모르겠다면 아래 목록에서 줄마다 적어 둔 '무엇을 넣으면 무엇이 나오는지'를 읽고 가장 가까운 줄을 고르세요.",
  },
  {
    q: "맨 위 계산기와 건강보험료·연봉 계산기 화면은 결과가 다른가요?",
    a: "같은 값을 넣으면 1원 단위까지 같습니다. 두 곳은 입력 칸과 계산 엔진이 같습니다. 상세 화면에는 이 화면에 없는 것이 더 붙습니다 — 건보료·연봉 구간표, 공제 항목별 표와 차트, 다음에 열어 볼 계산기 추천, 결과를 그대로 보내는 공유 링크입니다.",
  },
  {
    q: "계산기 하나로 끝나지 않는 상황은 어떻게 하나요?",
    a: "퇴사나 이직처럼 사건 하나가 계산기 여러 개에 걸치면 이 화면 맨 아래 상황별 순서 가이드를 여세요. 이직 준비·퇴사 준비·연말정산·아르바이트 네 가지가 있고, 단계마다 어느 계산기를 왜 여는지와 앞 단계에서 나온 금액을 어디에 넣는지가 적혀 있습니다.",
  },
  {
    q: "찾는 계산이 목록에 없으면 어떻게 하나요?",
    a: "이 사이트의 26개는 급여·세금·수당·퇴직·절세 다섯 갈래를 채운 목록이라 그 밖의 주제는 다루지 않습니다. 자동차 세금, 대출 상환, 부동산처럼 다른 영역의 계산은 이 화면 아래 관련 서비스 목록에 걸어 둔 다른 계산기 사이트에서 찾을 수 있습니다.",
  },
];

export const HOME_FAQ_H2 = "자주 묻는 질문";
export const HOME_FAQ_INTRO = "계산기별 질문은 각 계산기 화면 아래에 따로 있습니다.";

// 홈 종합 가이드 — loan 홈의 SeoRichGuide 자리. 상황 → 계산기 매핑만 다룬다.
//
// 왜 h3인가: 홈이 길었던 이유는 총량이 아니라 h2가 10개였던 것이다(섹션마다 h2 하나).
// 상황별 안내는 한 덩어리의 가이드이지 서로 다른 절이 아니므로 h2 하나 아래 h3로 묶는다.
export const HOME_GUIDE = {
  h2: "지금 상황에 맞는 계산기 고르기",
  // 리드는 두 줄로 묶는다. 아래 세 절이 같은 이야기를 더 자세히 하므로, 리드에서 상황을
  // 다시 열거하면 한 패널 안에서 같은 문장을 두 번 읽히게 된다(개편 전 홈의 실패 패턴).
  intro:
    "무엇을 열지는 지금 가진 숫자와 달력이 정합니다. 아래 세 갈래 중 지금 상황에 가장 가까운 것부터 보세요.",
  sections: [
    {
      h3: "숫자 하나만 들고 왔을 때",
      body: "연봉 협상이나 입사를 앞두고 있고 가진 숫자가 세전 연봉 하나뿐이면, 연봉 실수령액 계산기가 4대보험과 소득세를 갈라 월 실수령액까지 내려갑니다. 반대로 통장에 찍히는 금액이나 급여명세서의 건강보험료만 알고 있다면 건강보험료 역산 계산기가 그 값에서 연봉을 되짚습니다. 시급으로 일한다면 시급↔월급↔연봉 환산기가 주휴수당 포함·미포함 두 가지 기준을 동시에 보여줍니다.",
    },
    {
      h3: "두 가지를 비교해야 할 때",
      body: "두 회사를 저울질하는 중이라면 이직 연봉 비교가 두 제안의 월 실수령 차이를 같은 기준으로 나란히 계산합니다. 인상률만 놓고 보면 커 보이던 차이가 세후로는 줄어드는 경우가 많아, 협상 자리에서는 인상률(%)이 아니라 월 실수령 증가액(원)으로 환산해 두는 편이 낫습니다. 연봉 인상률 계산기와 성과급 실수령 계산기도 같은 방식으로 세후 기준을 맞춰 줍니다.",
    },
    {
      h3: "달력이 정해 주는 계산",
      body: "1~2월에는 연말정산 계산기로 환급액과 부족한 공제를 먼저 점검하고, 월세 세액공제와 IRP 세액공제로 빠진 항목이 없는지 확인합니다. 5월은 종합소득세 신고 기간이라 부업·프리랜서 소득이 있으면 종합소득세 계산기가 필요하고, 근로장려금은 같은 시기에 신청 요건을 따집니다. 퇴사를 앞두고 있다면 퇴직금·실업급여·지역가입자 건보료 세 가지를 함께 계산해야 퇴사 후 현금 흐름이 보이므로, 퇴사일이 정해진 달 안에 미리 돌려 두는 편이 안전합니다.",
    },
  ],
};

export const HOME_GUIDE_LINKS_H3 = "상황이 여러 계산기에 걸칠 때";
export const HOME_GUIDE_LINKS_INTRO =
  "단계마다 무엇을 여는지와 앞 단계 결과를 어디에 넣는지가 적힌 순서 가이드입니다.";

export const HOME_LINKS_H2 = "분야별 계산기 전체 목록";
export const HOME_LINKS_INTRO =
  "줄마다 무엇을 넣으면 무엇이 나오는지 적어 두었습니다. 지금 궁금한 것에 가장 가까운 줄을 고르세요.";
// 정적 본문의 읽기 순서를 화면과 맞춘다: 답(퀵계산기) → 전체 인덱스 → FAQ → 종합 가이드.
// HOME_SECTIONS가 1개로 줄어 인덱스는 항상 그 뒤(=1)에 들어가지만, 상수로 남겨 두는 이유는
// 프리렌더와 뷰가 같은 숫자를 근거로 순서를 만들기 때문이다(homeContent.test.ts가 대조한다).
export const HOME_LINKS_AFTER_SECTION = 1;

// 홈 도구 인덱스 — 26개 계산기 전체. 묶음·순서는 Vue 푸터(src/data/footerNav.ts)와 같다.
//
// 왜 전부 펴는가: 개편 전에는 그룹당 3개씩 15개만 있어서 나머지 11개는 본문에 길이 없었다
// (푸터에만 있었다). 홈은 26개 계산기로 가는 인덱스여야지 대표 몇 개를 고르는 자리가 아니다.
//
// 설명 문구는 /all·llms.txt와 다른 문장을 쓴다 — 같은 목록을 같은 문장으로 세 번 내보내면
// 그게 중복 콘텐츠 신호다. 여기는 "무엇을 넣으면 무엇이 나오는지"를 한 줄로 줄인 판이다.
//
// 라우트 집합이 카탈로그(= 사이트맵 = 푸터)와 어긋나면 scripts/calculator-catalog.mjs가
// 빌드를 세운다. 계산기를 추가하면 이 목록도 같이 움직여야 한다.
export const HOME_HUB_GROUPS = [
  {
    id: "pay",
    icon: "📊",
    title: "급여·연봉",
    items: [
      { to: "/salary", label: "연봉 실수령액 계산기", desc: "부양가족·비과세까지 넣어 정밀 계산" },
      { to: "/insurance", label: "건강보험료 역산 계산기", desc: "건보료만 알아도 연봉 추정" },
      { to: "/compare", label: "이직 연봉 비교", desc: "두 연봉의 월 실수령 차이" },
      { to: "/raise", label: "연봉 인상률 계산기", desc: "협상 전에 체감 인상률 확인" },
      { to: "/bonus", label: "성과급 실수령 계산기", desc: "상여금 지급 월의 세후 금액" },
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
      { to: "/freelance-rate", label: "프리랜서 단가 역산", desc: "받고 싶은 금액에서 거꾸로" },
      { to: "/4-insurance-employer", label: "사업주 4대보험 계산기", desc: "채용 한 명당 늘어나는 인건비" },
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
      { to: "/annual-leave", label: "연차수당 계산기", desc: "남은 연차를 돈으로 바꾸면" },
    ],
  },
  {
    id: "leave",
    icon: "🏠",
    title: "퇴직·구직",
    items: [
      { to: "/quit", label: "퇴사 계산기", desc: "퇴직금·실업급여·생존기간 종합" },
      { to: "/severance-pay", label: "퇴직금 계산기", desc: "퇴직소득세 뺀 실수령 퇴직금" },
      { to: "/unemployment", label: "실업급여 계산기", desc: "구직급여 수급액·수급기간" },
      { to: "/parental-leave", label: "육아휴직 급여 계산기", desc: "휴직 개월 차에 따라 달라지는 지급액" },
      { to: "/regional-health", label: "지역가입자 건보료 계산기", desc: "재산·소득으로 매기는 보험료" },
      { to: "/dependent", label: "건보 피부양자 판정기", desc: "부모·배우자를 올릴 수 있는지" },
      { to: "/unpaid-wage", label: "임금체불 지연이자 계산기", desc: "청구 근거가 되는 지연이자액" },
    ],
  },
  {
    id: "saving",
    icon: "🛡️",
    title: "절세·공제",
    items: [
      { to: "/year-end-settlement", label: "연말정산 계산기", desc: "환급액·세액공제 시뮬레이션" },
      { to: "/monthly-rent-deduction", label: "월세 세액공제 계산기", desc: "무주택 세대주의 월세 환급" },
      { to: "/irp", label: "IRP 세액공제 계산기", desc: "납입액 대비 절세 효과" },
      { to: "/pension", label: "국민연금 예상 수령액", desc: "지금 낸 보험료의 노후 월액" },
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
