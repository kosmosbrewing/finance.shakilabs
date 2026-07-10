const GUIDES = {
  "/raise": {
    title: "2026 연봉 인상률 계산기 | 연봉 협상 실수령액 비교",
    description: "현재 연봉과 제안 인상률을 입력해 세전 연봉과 월 실수령 증가액을 비교합니다. 기본 연봉만 반영하며 성과급은 제외합니다.",
    heading: "연봉 인상률 계산기",
    usage: "연봉 협상안을 세전 인상률이 아니라 실제 월급 증가액으로 비교할 때 사용합니다.",
    method: "인상 후 연봉을 계산한 뒤 현재 연봉과 같은 2026년 보험료·소득세 기준을 적용해 월 실수령 차이를 구합니다.",
    limit: "성과급, 스톡옵션, 회사별 비과세 항목과 연말정산 차이는 반영하지 않습니다.",
    links: [["/finance/compare", "이직 연봉 비교"], ["/finance/salary", "연봉 실수령액 계산"]],
  },
  "/bonus": {
    title: "2026 성과급 실수령 계산기 | 상여금 세금·4대보험 공제",
    description: "기본 연봉과 성과급을 합산해 예상 세금·보험료 증가분과 성과급 실수령액을 계산합니다.",
    heading: "성과급 실수령 계산기",
    usage: "성과급 제안액 중 실제로 남을 금액과 실효 수령률을 미리 확인할 때 사용합니다.",
    method: "성과급을 포함한 연간 공제액과 기본 연봉 공제액의 차이를 성과급 공제로 보고 실수령액을 추정합니다.",
    limit: "지급월 원천징수액과 연말정산 확정세액은 지급 방식, 부양가족과 다른 소득에 따라 달라집니다.",
    links: [["/finance/salary", "연봉 실수령액 계산"], ["/finance/year-end-settlement", "연말정산 계산"]],
  },
  "/annual-leave": {
    title: "2026 연차 수당 계산기 | 미사용 연차 보상금 계산",
    description: "월 통상임금과 미사용 연차 일수로 예상 연차수당과 세후 수령액을 간이 계산합니다.",
    heading: "연차 수당 계산기",
    usage: "퇴사 또는 연차 정산 전에 미사용 일수의 예상 보상액을 확인할 때 사용합니다.",
    method: "월급과 고정수당을 기본 209시간으로 나눈 시간급에 1일 8시간과 지급 대상 일수를 곱합니다.",
    limit: "통상임금 범위, 연차 발생·소멸 여부와 회사 규정에 따라 실제 지급액이 달라질 수 있습니다.",
    links: [["/finance/overtime", "연장·야간·휴일수당"], ["/finance/severance-pay", "퇴직금 계산"]],
  },
  "/overtime": {
    title: "2026 연장·야간·휴일수당 계산기 | 초과근무 수당 계산",
    description: "통상임금과 연장·야간·휴일근로 시간을 입력해 추가 수당의 세전·세후 금액을 계산합니다.",
    heading: "연장·야간·휴일수당 계산기",
    usage: "급여에 포함되지 않은 초과근무 수당을 시간 유형별로 확인할 때 사용합니다.",
    method: "월 통상임금을 입력 근로시간으로 환산하고 연장·야간·휴일근로 시간에 해당 가산 배수를 적용합니다.",
    limit: "포괄임금 약정, 사업장 규모, 대체휴무와 통상임금 산입 범위는 별도로 확인해야 합니다.",
    links: [["/finance/annual-leave", "연차 수당 계산"], ["/finance/wage-converter", "시급·월급 환산"]],
  },
  "/pension": {
    title: "2026 국민연금 수령액 계산기 | 예상 연금액·납부액 조회",
    description: "평균 기준소득월액, 가입기간과 청구 나이로 국민연금 월 수령액을 간이 추정합니다.",
    heading: "국민연금 예상 수령액 계산기",
    usage: "가입기간이나 청구 시점을 바꿨을 때 예상 연금액의 방향과 규모를 비교할 때 사용합니다.",
    method: "평균소득과 가입기간을 기초로 추정한 연금액에 조기 청구 감액 또는 연기 청구 가산을 적용합니다.",
    limit: "확정 연금액은 실제 가입 이력과 재평가율이 필요하므로 국민연금공단 예상연금 조회로 확인해야 합니다.",
    links: [["/finance/insurance", "국민연금 보험료 확인"], ["/finance/irp", "IRP 세액공제"]],
  },
  "/monthly-rent-deduction": {
    title: "2026 월세 세액공제 계산기 | 연말정산 월세 환급액",
    description: "총급여와 월세 납부액으로 월세 세액공제 대상 금액과 예상 연말정산 환급액을 계산합니다.",
    heading: "월세 세액공제 계산기",
    usage: "연말정산 전에 월세 납부액 중 공제 가능한 금액을 가늠할 때 사용합니다.",
    method: "연간 월세와 법정 한도를 비교한 공제 대상 금액에 총급여 구간별 세액공제율을 적용합니다.",
    limit: "무주택, 주소 일치, 주택 규모·기준시가와 증빙 요건을 충족한다는 전제이며 결정세액이 적으면 환급도 줄어듭니다.",
    links: [["/finance/year-end-settlement", "연말정산 계산"], ["/finance/irp", "IRP 세액공제"]],
  },
  "/irp": {
    title: "2026 IRP 세액공제 계산기 | 개인형 퇴직연금 절세 효과",
    description: "연금저축과 IRP 납입액을 합산해 세액공제 대상 한도와 예상 절세액을 계산합니다.",
    heading: "IRP 세액공제 계산기",
    usage: "연말까지 연금계좌에 추가 납입할 금액과 예상 세액공제 효과를 비교할 때 사용합니다.",
    method: "연금저축 한도와 IRP 합산 한도를 순서대로 적용한 뒤 총급여 구간별 세액공제율을 곱합니다.",
    limit: "실제 환급액은 결정세액, 중도해지와 연금 외 수령 여부에 따라 달라질 수 있습니다.",
    links: [["/finance/year-end-settlement", "연말정산 계산"], ["/finance/pension", "국민연금 예상액"]],
  },
  "/4-insurance-employer": {
    title: "2026 사업주 4대보험 계산기 | 고용주 부담금·인건비 계산",
    description: "직원 월급을 기준으로 사업주가 부담하는 국민연금·건강보험·장기요양·고용보험료를 계산합니다.",
    heading: "사업주 4대보험 계산기",
    usage: "채용 전 직원 1인당 월·연 인건비와 급여 외 보험료 부담을 추정할 때 사용합니다.",
    method: "월 보수에 2026년 사업주 부담 요율과 보험별 상·하한을 적용해 월 부담금과 연간 비용을 합산합니다.",
    limit: "업종별 산재보험, 고용안정·직업능력개발 부담과 보수총액 정산은 포함하지 않습니다.",
    links: [["/finance/insurance", "근로자 4대보험"], ["/finance/salary", "연봉 실수령액 계산"]],
  },
  "/freelance-rate": {
    title: "2026 프리랜서 세후 단가 역산 계산기 | 원천세 제외 실수령",
    description: "목표 세후 수입과 근무일·시간을 기준으로 필요한 월 청구액, 일 단가와 시급을 역산합니다.",
    heading: "프리랜서 세후 단가 역산 계산기",
    usage: "프로젝트 견적이나 계약 협상에서 목표 실수령을 달성할 청구 단가를 정할 때 사용합니다.",
    method: "목표 실수령액에 원천징수와 예상 종합소득세 부담을 반영해 월 매출을 역산하고 일수·시간으로 나눕니다.",
    limit: "실제 필요경비, 다른 소득, 부양가족, 부가가치세와 사업 형태에 따라 확정 세액은 달라집니다.",
    links: [["/finance/freelancer", "프리랜서 세금 계산"], ["/finance/comprehensive-tax", "종합소득세 계산"]],
  },
};

export const PRERENDER_GUIDE_ROUTES = Object.freeze(Object.keys(GUIDES));

export function getPrerenderGuide(route) {
  return GUIDES[route] ?? null;
}

export function buildPrerenderGuide(route) {
  const guide = getPrerenderGuide(route);
  if (!guide) return null;

  const links = guide.links
    .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`)
    .join("");

  return `
    <article data-seo-prerender style="max-width:920px;margin:0 auto;padding:24px 16px;line-height:1.7;">
      <h1 style="font-size:28px;line-height:1.3;margin:0 0 12px;">${guide.heading}</h1>
      <p>${guide.description}</p>
      <h2>언제 사용하는 계산기인가요?</h2>
      <p>${guide.usage}</p>
      <h2>계산 방식</h2>
      <p>${guide.method}</p>
      <h2>결과 해석 전 확인할 점</h2>
      <p>${guide.limit}</p>
      <h2>함께 확인할 계산기</h2>
      <ul>${links}</ul>
      <p>계산 기준 확인일: 2026-07-10. 최종 신고·급여 정산 전에는 관계 기관과 회사 기준을 확인하세요.</p>
    </article>`;
}
