// 상황별 계산기 체인 가이드 — 뷰(src)와 프리렌더(scripts)가 공유하는 단일 소스.
// 하나의 생활 사건(퇴사·이직·연말정산·알바)을 계산기 여러 개의 "순서"로 분해한다.
export const SCENARIO_CHAINS = [
  {
    slug: "resignation",
    route: "/guide/resignation",
    name: "퇴사 준비",
    heading: "퇴사 전 계산 순서 가이드",
    seoTitle: "퇴사 전 계산 순서 가이드 | 퇴직금→실업급여→건보료",
    seoDescription: "퇴사 결심부터 이직 공백기까지 — 퇴직금, 실업급여, 지역가입 건보료, 미지급 임금을 순서대로 계산하는 6단계 가이드. 2026년 기준.",
    intro: "퇴사 판단의 절반은 돈 계산입니다. 아래 순서대로 계산하면 \"공백기를 몇 달 버틸 수 있는가\"가 숫자로 나옵니다. 각 단계는 앞 단계의 결과를 전제로 이어집니다.",
    steps: [
      { to: "/quit", label: "퇴사 종합 시뮬레이션", why: "퇴직금·실업급여·월 고정비를 한 번에 훑어 생존기간의 감을 먼저 잡습니다. 세부 계산은 다음 단계에서 합니다." },
      { to: "/severance-pay", label: "퇴직금 정밀 계산", why: "직전 3개월 평균임금 기준 실수령액을 확인합니다. 상여·수당 포함 여부에 따라 금액이 크게 달라집니다." },
      { to: "/unemployment", label: "실업급여 예상액", why: "수급 요건과 예상 수급액·기간을 확인합니다. 2026년 상한은 1일 68,100원입니다." },
      { to: "/regional-health", label: "지역가입 건보료", why: "퇴사 다음 달부터 지역가입으로 전환됩니다. 보험료가 재직 때보다 커지는 경우가 많아 임의계속가입 판단 전에 꼭 확인해야 합니다." },
      { to: "/unpaid-wage", label: "미지급 임금·지연이자", why: "마지막 급여·연차수당·퇴직금은 퇴사 후 14일 안에 지급돼야 합니다. 늦어지면 지연이자까지 계산해 청구 근거를 만드세요." },
      { to: "/compare", label: "이직 연봉 비교", why: "다음 직장의 제안 연봉을 현재 연봉과 실수령 기준으로 비교해 공백기의 손익을 마무리합니다." },
    ],
    related: ["job-change"],
  },
  {
    slug: "job-change",
    route: "/guide/job-change",
    name: "이직·연봉 협상",
    heading: "이직 연봉 협상 계산 순서",
    seoTitle: "이직 연봉 협상 계산 순서 | 실수령·4대보험·인상률",
    seoDescription: "제안받은 연봉이 실제로 얼마나 오르는지 — 연봉 비교, 실수령액, 4대보험, 인상률, 성과급까지 5단계로 확인하는 이직 협상 가이드. 2026년 기준.",
    intro: "이직 제안서의 연봉 숫자와 통장에 들어오는 돈은 다릅니다. 협상 전에 아래 순서로 계산하면 \"세후로 얼마나 오르는가\"를 근거로 말할 수 있습니다.",
    steps: [
      { to: "/compare", label: "제안 연봉 vs 현재 연봉", why: "두 연봉의 실수령액 차이를 먼저 확인합니다. 명목 인상분과 세후 인상분의 괴리가 협상의 출발점입니다." },
      { to: "/salary", label: "제안 연봉 실수령액", why: "제안 연봉의 월 실수령액을 4대보험·소득세 공제 후 기준으로 확인합니다." },
      // 상한액은 RATES_2026.nationalPension.maxMonthlyIncome(659만)이 유일한 출처다.
      // 2026-07-01 고시로 상한이 오른 뒤에도 이 산문만 옛 값을 들고 있었다 — 엔진 상수를 쓰는
      // 계산기는 전부 옳았고, 하드코딩된 이 한 줄만 라이브에서 틀린 수치를 보여줬다.
      { to: "/insurance", label: "4대보험 부담 변화", why: "연봉이 오르면 보험료도 오릅니다. 국민연금 상한(월 659만 원, 2026.7.1 시행) 도달 여부에 따라 체감 인상률이 달라집니다." },
      { to: "/raise", label: "인상률 체감 확인", why: "제안 인상률을 연차·물가 기준과 비교해 실질 인상인지 확인합니다." },
      { to: "/bonus", label: "성과급 세후 계산", why: "사이닝 보너스·성과급은 지급 월에 세금이 몰립니다. 세후 금액으로 환산해 총 보상을 비교하세요." },
    ],
    related: ["resignation", "year-end"],
  },
  {
    slug: "year-end",
    route: "/guide/year-end",
    name: "연말정산 준비",
    heading: "연말정산 준비 순서 가이드",
    seoTitle: "연말정산 준비 순서 가이드 | 공제 계산기 5개 점검",
    seoDescription: "예상 환급액부터 부양가족, 월세, IRP, 근로장려금까지 — 연말정산에서 놓치기 쉬운 공제를 순서대로 점검하는 5단계 가이드. 2026년 기준.",
    intro: "연말정산은 마감 직전에 몰아서 하면 공제를 놓칩니다. 환급 예상액을 먼저 보고, 큰 공제부터 순서대로 점검하는 것이 남는 순서입니다.",
    steps: [
      { to: "/year-end-settlement", label: "예상 환급·추납 계산", why: "현재 조건으로 환급인지 추가 납부인지 먼저 확인합니다. 이 결과가 아래 단계들의 절세 여지를 알려줍니다." },
      { to: "/dependent", label: "부양가족 공제 판정", why: "인적공제는 1명당 과세표준을 150만 원 줄입니다. 소득·나이 요건을 판정기로 확인해 가족 중 대상자를 놓치지 마세요." },
      { to: "/monthly-rent-deduction", label: "월세 세액공제", why: "무주택 세대주라면 월세의 15~17%를 세액에서 바로 뺍니다. 전입신고·계약서 요건을 함께 확인하세요." },
      { to: "/irp", label: "IRP 납입 세액공제", why: "연말 전 납입으로 챙길 수 있는 마지막 공제입니다. 납입 한도와 환급률을 계산해 납입액을 정하세요." },
      { to: "/eitc", label: "근로장려금 자격 확인", why: "소득·재산 요건이 맞으면 정산과 별개로 장려금을 받을 수 있습니다. 맞벌이·단독 가구 기준이 다르니 판정기로 확인하세요." },
    ],
    related: ["job-change"],
  },
  {
    slug: "part-time",
    route: "/guide/part-time",
    name: "알바·단기 근로",
    heading: "알바 급여 계산 순서",
    seoTitle: "알바 급여 계산 순서 | 시급 환산→주휴수당→연장수당",
    seoDescription: "시급 월급 환산, 주휴수당 요건, 연장·야간수당, 연차수당, 못 받은 임금까지 알바·단기 근로자가 순서대로 확인하는 5단계 가이드. 2026년 최저시급 10,320원 기준.",
    intro: "알바 급여는 시급만 보면 못 받는 돈이 생깁니다. 주휴수당과 가산수당은 요건만 맞으면 당연히 받는 돈입니다. 아래 순서로 내 급여를 검산해 보세요.",
    steps: [
      { to: "/wage-converter", label: "시급 → 월급 환산", why: "내 시급이 월급으로 얼마인지, 2026년 최저시급 10,320원 기준을 지키는지 먼저 확인합니다." },
      { to: "/weekly-holiday-pay", label: "주휴수당 확인", why: "주 15시간 이상 개근하면 하루치 임금이 추가로 발생합니다. 요건 충족 여부와 금액을 계산하세요." },
      { to: "/overtime", label: "연장·야간·휴일수당", why: "5인 이상 사업장이라면 연장·야간·휴일 근로에 50% 가산이 붙습니다. 스케줄 기준으로 가산액을 계산하세요." },
      { to: "/annual-leave", label: "연차수당 계산", why: "1년 미만이라도 한 달 개근마다 연차 1일이 생깁니다. 못 쓴 연차는 수당으로 청구할 수 있습니다." },
      { to: "/unpaid-wage", label: "미지급 임금 정리", why: "앞 단계에서 계산한 금액과 실제 받은 돈의 차액을 정리하면 그대로 청구 근거가 됩니다." },
    ],
    related: ["resignation"],
  },
];

export const SCENARIO_CHAIN_ROUTES = Object.freeze(SCENARIO_CHAINS.map((chain) => chain.route));

export function getScenarioChain(route) {
  return SCENARIO_CHAINS.find((chain) => chain.route === route) ?? null;
}

export function getScenarioChainBySlug(slug) {
  return SCENARIO_CHAINS.find((chain) => chain.slug === slug) ?? null;
}

/** RouterLink용 base 상대 경로(/quit)를 정적 HTML용 절대 경로(/finance/quit)로 바꾼다.
 *  런타임 RouterLink는 base가 /finance라 접두어 없이 맞지만, 프리렌더가 뱉는 raw href는
 *  그대로면 404가 난다(2026-07-31 라이브에서 21개 링크가 404였다). */
const APP_BASE = "/finance";
const toHref = (path) => (path.startsWith(APP_BASE) ? path : `${APP_BASE}${path}`);

export function buildScenarioChainHtml(route) {
  const chain = getScenarioChain(route);
  if (!chain) return null;

  const steps = chain.steps
    .map((step, index) => `
      <li style="margin:0 0 14px;">
        <h2 style="font-size:18px;margin:0 0 4px;">${index + 1}단계 · <a href="${toHref(step.to)}">${step.label}</a></h2>
        <p style="margin:0;">${step.why}</p>
      </li>`)
    .join("");

  const related = chain.related
    .map((slug) => getScenarioChainBySlug(slug))
    .filter(Boolean)
    .map((linked) => `<li><a href="${toHref(linked.route)}">${linked.heading}</a></li>`)
    .join("");

  return `
    <article data-seo-prerender style="max-width:920px;margin:0 auto;padding:24px 16px;line-height:1.7;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">${chain.heading}</h1>
      <p>${chain.intro}</p>
      <ol style="list-style:none;padding:0;margin:16px 0;">${steps}</ol>
      <h2>다른 상황 가이드</h2>
      <ul>${related}<li><a href="${toHref("/all")}">전체 계산기 모음</a></li></ul>
      <p>계산 기준: 2026년 세율·요율. 최종 신고·급여 정산 전에는 관계 기관과 회사 기준을 확인하세요.</p>
    </article>`;
}
