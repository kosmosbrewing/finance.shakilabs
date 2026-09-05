// Cross-band digests for /withholding and /severance-pay (Tier 2, second half).
//
// Same contract as hub-digests.mjs: every figure is produced by calc-engine.mjs at build time,
// nothing is a transcribed constant, and each section answers a question that only has an answer
// when the whole amount family is held at once — where a boundary sits, where a curve bends, and
// which two adjacent pages fall on opposite sides of it.
//
// The withholding sections lean on the exact reverse (bisection over the salary engine) that the
// screen also uses, so the hub, its seven variants and the calculator agree to the won.

import {
  averageWageWindowDays,
  calcIrpTaxCredit,
  calculateSalaryBreakdown,
  formatManWonValue,
  formatPercent,
  formatWon,
  RATES_2026,
  SEVERANCE_ASSUMED_MONTHLY,
  severanceIncomeTax,
  severancePayEstimate,
  severanceYearDeduction,
  withholdingReverse,
} from "./calc-engine.mjs";
import { SEVERANCE_PAY_AMOUNTS, WITHHOLDING_AMOUNTS } from "./seo-routes.mjs";
import { findIncomeTaxBracket, MIN_WAGE_HOURLY_2026, MIN_WAGE_MONTHLY_2026 } from "./hub-digests.mjs";

const NON_TAXABLE_MONTHLY = 200_000;
const manWon = (value) => `${formatManWonValue(value)}원`;
const manWonOf = (won) => manWon(Math.round(won / 10_000));
const ratePercent = (rate) => formatPercent(rate, 0);

function salaryOf(grossAnnual, dependents = 1, children = 0) {
  return calculateSalaryBreakdown({
    grossAnnual,
    nonTaxableMonthly: NON_TAXABLE_MONTHLY,
    dependents,
    children,
    retirementIncluded: false,
  });
}

// =========================
// /withholding — 소득세 1만원의 값어치
// =========================
// Household used for the "4인 가구" column: spouse + two children under 20 (child credit applies).
const FAMILY_OF_FOUR = { dependents: 4, children: 2 };
const TAX_STEP = 10_000;

function withholdingRow(tax) {
  const single = withholdingReverse(tax).estimatedAnnual;
  const nextSingle = withholdingReverse(tax + TAX_STEP).estimatedAnnual;
  const family = withholdingReverse(tax, FAMILY_OF_FOUR).estimatedAnnual;
  const result = salaryOf(single);
  return {
    tax,
    single,
    family,
    familyGap: family - single,
    // 소득세 1만원이 더 찍힐 때 추정 연봉이 얼마나 움직이는가 — 구간별 역산 감도
    slope: nextSingle - single,
    bracket: findIncomeTaxBracket(result.taxableBase),
    result,
  };
}

// 소득세가 0원으로 찍히는 최대 연봉 — 그 아래에서는 역산 자체가 성립하지 않는다
function zeroTaxCeiling(options = {}) {
  let lo = 1_000_000;
  let hi = 300_000_000;
  for (let i = 0; i < 60; i += 1) {
    const mid = Math.floor((lo + hi) / 2);
    const { monthlyIncomeTax } = calculateSalaryBreakdown({
      grossAnnual: mid,
      nonTaxableMonthly: NON_TAXABLE_MONTHLY,
      dependents: options.dependents ?? 1,
      children: options.children ?? 0,
      retirementIncluded: false,
    });
    if (monthlyIncomeTax === 0) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}

export function withholdingSensitivityDigest() {
  const rows = WITHHOLDING_AMOUNTS.map(withholdingRow);
  const first = rows[0];
  const second = rows[1];
  const last = rows[rows.length - 1];
  const steepest = rows.reduce((max, row) => (row.slope > max.slope ? row : max), rows[0]);
  const flattest = rows.reduce((min, row) => (row.slope < min.slope ? row : min), rows[0]);
  const widestFamily = rows.reduce((max, row) => (row.familyGap > max.familyGap ? row : max), rows[0]);
  const narrowestFamily = rows.reduce((min, row) => (row.familyGap < min.familyGap ? row : min), rows[0]);
  const zeroSingle = zeroTaxCeiling();
  const zeroFamily = zeroTaxCeiling(FAMILY_OF_FOUR);
  // 지방소득세를 합쳐 넣는 실수 — 입력값이 1.1배가 되었을 때 추정 연봉이 얼마나 부풀려지는가
  const combinedError = (row) =>
    withholdingReverse(Math.round(row.tax * 1.1)).estimatedAnnual - row.single;

  return {
    h2: "소득세 1만원이 연봉을 얼마나 움직이는가",
    body: [
      `역산은 저울과 같아서, 소득세 눈금 하나가 연봉을 얼마나 밀어 올리는지는 구간마다 다릅니다. 월 소득세 ${formatWon(first.tax)}에서는 눈금 ${formatWon(TAX_STEP)}이 연봉 <strong>${manWonOf(steepest.slope)}</strong>에 해당하지만, ${formatWon(second.tax)}부터는 ${manWonOf(second.slope)} 안팎으로 절반 이하로 줄고, ${formatWon(last.tax)}에서는 ${manWonOf(flattest.slope)}까지 내려옵니다. 명세서 숫자가 조금만 달라도 낮은 구간에서는 추정 연봉이 크게 튀고, 높은 구간에서는 거의 움직이지 않는다는 뜻입니다.`,
      `가장 아래 구간이 유난히 가파른 이유는 근로소득세액공제입니다. 산출세액이 작을 때는 그 55%를 공제로 돌려주기 때문에, 연봉이 올라도 명세서의 소득세는 절반 속도로만 늘어납니다. 반대로 ${formatWon(last.tax)} 구간은 과세표준이 ${ratePercent(last.bracket.rate)} 구간에 들어가 있어 연봉 증가분에 세금이 빠르게 붙고, 그래서 같은 눈금 하나가 더 작은 연봉 폭을 가리킵니다.`,
      `부양가족 보정도 정액이 아닙니다. 같은 월 소득세를 배우자와 자녀 둘이 있는 4인 가구가 냈다면 추정 연봉은 1인 가구보다 높아야 하는데, 그 차이가 ${formatWon(widestFamily.tax)}에서는 ${manWonOf(widestFamily.familyGap)}, ${formatWon(narrowestFamily.tax)}에서는 ${manWonOf(narrowestFamily.familyGap)}입니다. 인적공제 450만원과 자녀세액공제 55만원이 절감해 주는 세금은 한계세율에 비례하므로, 세율이 높은 구간에서는 더 적은 연봉 차이로도 같은 세액 차이가 만들어지기 때문입니다.`,
    ],
    table: {
      head: ["월 소득세", "추정 연봉 (1인)", "추정 연봉 (4인·자녀 2)", "소득세 +1만원당 연봉", "한계세율"],
      rows: rows.map((row) => ({
        highlight: row === steepest,
        cells: [
          `<a href="/finance/withholding/${row.tax}">${formatWon(row.tax)}</a>`,
          manWonOf(row.single),
          manWonOf(row.family),
          `<strong>${manWonOf(row.slope)}</strong>`,
          ratePercent(row.bracket.rate),
        ],
      })),
    },
    tableNote: `비과세 식대 월 ${formatWon(NON_TAXABLE_MONTHLY)}, 연봉 계산기와 같은 산식으로 월 소득세가 입력값과 같아지는 최소 연봉을 찾은 값입니다. 명세서의 소득세와 지방소득세를 합쳐 넣으면 입력이 1.1배가 되어 ${formatWon(first.tax)}에서는 ${manWonOf(combinedError(first))}, ${formatWon(last.tax)}에서는 ${manWonOf(combinedError(last))}만큼 연봉이 부풀려집니다.`,
    callout: `<strong>소득세 0원은 역산할 수 없습니다</strong> — 1인 가구는 연봉 ${manWonOf(zeroSingle)}, 4인 가구(자녀 2)는 ${manWonOf(zeroFamily)}까지 월 소득세가 0원으로 찍힙니다. 명세서의 소득세 칸이 비어 있다면 이 계산기가 아니라 <a href="/finance/insurance">건보료 역산</a>이 맞는 도구입니다. 건강보험료는 첫 달부터 정률로 붙기 때문입니다.`,
  };
}

// =========================
// /withholding — 기납부 세액이 정하는 환급의 천장
// =========================
const PENSION_ACCOUNT_MAX = 9_000_000;

function refundRow(tax) {
  const annual = withholdingReverse(tax).estimatedAnnual;
  // 연간 기납부 = 소득세 × 12 + 지방소득세 10%. 이보다 많이 돌려받을 수는 없다.
  const prepaid = tax * 12 + Math.floor(tax * 12 * 0.1);
  const credit = calcIrpTaxCredit({
    annualSalary: annual,
    pensionSavings: 6_000_000,
    irpContribution: 3_000_000,
  });
  // 세액공제는 결정세액을 줄이고 지방소득세도 그만큼 따라 줄어 체감 효과는 1.1배
  const creditEffect = Math.floor(credit.taxCredit * 1.1);
  const usable = Math.min(prepaid, creditEffect);
  // 기납부를 전부 돌려받는 데 필요한 최소 납입액 — 그 위로는 넣어도 올해 세금은 더 줄지 않는다
  const contributionToZero = Math.min(
    PENSION_ACCOUNT_MAX,
    Math.ceil(prepaid / (credit.taxCreditRate * 1.1) / 10_000) * 10_000
  );
  return { tax, annual, prepaid, credit, creditEffect, usable, contributionToZero };
}

export function withholdingRefundCeilingDigest() {
  const rows = WITHHOLDING_AMOUNTS.map(refundRow);
  const firstFull = rows.find((row) => row.prepaid >= row.creditEffect);
  const lastPartial = rows[rows.indexOf(firstFull) - 1];
  const bottom = rows[0];
  const top = rows[rows.length - 1];

  return {
    h2: "명세서의 소득세가 연말정산 환급의 천장이다",
    body: [
      `연말정산 환급은 낸 세금을 돌려받는 절차이므로, 아무리 공제를 모아도 <strong>한 해 동안 원천징수된 금액 이상은 돌아오지 않습니다</strong>. 그래서 월 소득세 한 줄은 연봉을 알려 주는 단서이면서 동시에 올해 환급의 상한선입니다. 월 ${formatWon(bottom.tax)}이면 지방소득세를 합쳐 연 ${formatWon(bottom.prepaid)}이 천장이고, 월 ${formatWon(top.tax)}이면 ${formatWon(top.prepaid)}입니다.`,
      `이 천장은 공제를 얼마나 채울지도 결정합니다. 연금저축 600만원과 IRP 300만원을 합쳐 한도 ${formatWon(PENSION_ACCOUNT_MAX)}을 채우면 총급여 5,500만원 이하에서 세액공제 15%, 지방소득세까지 ${formatWon(rows[0].creditEffect)}이 줄어듭니다. 그런데 월 소득세 ${formatWon(lastPartial.tax)}(연 기납부 ${formatWon(lastPartial.prepaid)})까지는 이 금액을 다 쓸 수 없습니다. 기납부가 공제 효과보다 작아 ${formatPercent(lastPartial.usable / lastPartial.creditEffect, 0)}만 실제 환급으로 이어지고, 나머지는 결정세액이 이미 0원이라 사라집니다.`,
      `뒤집어 읽으면 필요한 납입액이 나옵니다. 월 소득세 ${formatWon(bottom.tax)}인 사람은 연금계좌에 ${formatWon(bottom.contributionToZero)}만 넣어도 그해 소득세가 전부 돌아오므로, 한도 ${formatWon(PENSION_ACCOUNT_MAX)}을 채우는 것은 노후 저축으로는 의미가 있어도 올해 세금 면에서는 ${formatWon(PENSION_ACCOUNT_MAX - bottom.contributionToZero)}이 공제를 만들지 못합니다. 반면 월 ${formatWon(firstFull.tax)}부터는 한도를 다 채워도 ${formatWon(firstFull.prepaid - firstFull.creditEffect)}이 남아, 월세·의료비·기부금 같은 다른 세액공제를 얹을 여지가 생깁니다.`,
    ],
    table: {
      head: ["월 소득세", "연 기납부 (지방세 포함)", "연금계좌 900만원의 공제 효과", "실제 환급되는 몫", "소득세 0원까지 필요한 납입"],
      rows: rows.map((row) => ({
        highlight: row === firstFull,
        cells: [
          `<a href="/finance/withholding/${row.tax}">${formatWon(row.tax)}</a>`,
          formatWon(row.prepaid),
          formatWon(row.creditEffect),
          `<strong>${formatWon(row.usable)}</strong>`,
          row.contributionToZero >= PENSION_ACCOUNT_MAX
            ? `${formatWon(PENSION_ACCOUNT_MAX)}으로 부족`
            : formatWon(row.contributionToZero),
        ],
      })),
    },
    tableNote: `공제율은 추정 연봉이 5,500만원 이하면 15%, 초과면 12%를 적용했고, 다른 공제는 넣지 않은 값입니다. 월 소득세 ${formatWon(top.tax)} 구간에서 공제 효과가 ${formatWon(top.creditEffect)}으로 낮은 것은 추정 연봉 ${manWonOf(top.annual)}이 5,500만원을 넘어 공제율이 12%로 내려가기 때문입니다.`,
  };
}

// =========================
// /severance-pay — 퇴직소득세가 0원인 평균임금선
// =========================
const MIN_WAGE_FULL_TIME = MIN_WAGE_MONTHLY_2026;

// 퇴직소득세가 처음 1원이라도 붙는 퇴직금 — 근속연수공제와 환산급여공제(800만원 전액 구간)의 합
function taxFreeSeveranceCeiling(years) {
  let lo = 0;
  let hi = 500_000_000;
  for (let i = 0; i < 60; i += 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (severanceIncomeTax(mid, years) > 0) hi = mid;
    else lo = mid + 1;
  }
  return lo - 1;
}

function severanceRow(years) {
  const estimate = severancePayEstimate(years);
  const ceiling = taxFreeSeveranceCeiling(years);
  const minWageSeverance = Math.floor(MIN_WAGE_FULL_TIME * years);
  return {
    years,
    ...estimate,
    ceiling,
    // 천원 아래는 이진탐색 잔차라 버린다 — 근속 1·3·5년이 같은 선 위에 있음을 표가 그대로 보여야 한다
    ceilingWage: Math.floor(ceiling / years / 1000) * 1000,
    minWageSeverance,
    minWageTax: severanceIncomeTax(minWageSeverance, years),
    effectiveTaxRate: estimate.estimatedTax / estimate.severance,
  };
}

export function severanceTaxFreeLineDigest() {
  const rows = SEVERANCE_PAY_AMOUNTS.map(severanceRow);
  const first = rows[0];
  const last = rows[rows.length - 1];
  const minWageTaxed = rows.filter((row) => row.minWageTax > 0);
  const minWageFree = rows.filter((row) => row.minWageTax === 0);
  // 같은 세전 퇴직금을 근속만 바꿔 넣었을 때 — 연분연승의 크기
  const sameSeverance = last.severance;
  const sameRows = SEVERANCE_PAY_AMOUNTS.map((years) => ({
    years,
    tax: severanceIncomeTax(sameSeverance, years),
  }));
  // 근속 1년에 3,300만원은 월 평균임금 3,300만원이라는 뜻이라 비교 기준으로 부적절하다 — 3년부터 본다
  const sameShort = sameRows.find((row) => row.years >= 3 && row.tax > 0);
  const sameLong = sameRows[sameRows.length - 1];

  return {
    h2: "퇴직소득세가 한 푼도 붙지 않는 평균임금선",
    body: [
      `퇴직소득세에는 세금이 0원으로 끝나는 구간이 있고, 그 경계는 근속마다 다른 자리에 있습니다. 근속연수공제를 뺀 뒤 1년치로 환산한 급여가 800만원 이하면 환산급여공제가 전액을 덮기 때문입니다. 이 계산기의 근속 ${first.years}년부터 ${rows[rows.length - 2].years}년까지는 그 경계가 월 평균임금 약 <strong>${formatWon(first.ceilingWage)}</strong>으로 같지만, ${last.years}년에서는 약 ${formatWon(last.ceilingWage)}으로 올라갑니다. 근속 5년을 넘긴 연수부터 근속연수공제 단가가 두 배가 되어 무세 구간이 넓어지기 때문입니다.`,
      `이 선을 2026년 최저임금 전일제 월급 ${formatWon(MIN_WAGE_FULL_TIME)}(시급 ${formatWon(MIN_WAGE_HOURLY_2026)} × 209시간)에 대 보면 결과가 갈립니다. ${minWageTaxed.map((row) => `${row.years}년`).join("·")} 근속으로 퇴직하면 퇴직금 ${minWageTaxed.map((row) => formatWon(row.minWageSeverance)).join("·")}에 세금이 ${minWageTaxed.map((row) => formatWon(row.minWageTax)).join("·")} 붙지만, ${minWageFree.map((row) => `${row.years}년`).join("·")} 근속의 퇴직금 ${minWageFree.map((row) => formatWon(row.minWageSeverance)).join("·")}에는 <strong>세금이 0원</strong>입니다. 더 오래 일해 더 큰 퇴직금을 받는데 세금은 오히려 사라지는 구간이 최저임금 바로 위에 놓여 있습니다.`,
      `같은 세전 퇴직금이라도 근속이 다르면 세금이 다르다는 점은 더 극단적입니다. ${formatWon(sameSeverance)}을 근속 ${sameShort.years}년에 받으면 퇴직소득세가 ${formatWon(sameShort.tax)}이지만, 같은 금액을 ${sameLong.years}년 근속으로 받으면 ${sameLong.tax === 0 ? "0원" : formatWon(sameLong.tax)}${sameLong.tax > 0 ? `, ${(sameShort.tax / sameLong.tax).toFixed(1)}분의 1` : ""}입니다. 표준 시나리오(평균임금 ${formatWon(first.avgWage)})의 실효세율이 ${first.years}~${rows[rows.length - 2].years}년에서 ${formatPercent(first.effectiveTaxRate, 2)}로 평평하다가 ${last.years}년에 ${formatPercent(last.effectiveTaxRate, 2)}로 내려가는 것도 같은 구조에서 나옵니다.`,
    ],
    table: {
      head: ["근속", "세금 0원 최대 퇴직금", "해당 월 평균임금", "최저임금 전일제 퇴직금", "그때의 퇴직소득세", "표준 시나리오 실효세율"],
      rows: rows.map((row) => ({
        highlight: row.minWageTax === 0 && row.years === last.years,
        cells: [
          `<a href="/finance/severance-pay/${row.years}">${row.years}년</a>`,
          formatWon(row.ceiling),
          `<strong>${formatWon(row.ceilingWage)}</strong>`,
          formatWon(row.minWageSeverance),
          row.minWageTax === 0 ? "<strong>0원</strong>" : formatWon(row.minWageTax),
          formatPercent(row.effectiveTaxRate, 2),
        ],
      })),
    },
    tableNote: `근속연수공제는 5년까지 연 ${formatWon(severanceYearDeduction(1))}, 6~10년은 연 ${formatWon(severanceYearDeduction(6) - severanceYearDeduction(5))}이며 지방소득세 10%를 포함한 값입니다. "세금 0원 최대 퇴직금"은 근속연수공제와 환산급여공제 800만원 구간을 더한 금액으로, 근속 ${first.years}년은 ${formatWon(first.ceiling)}, ${last.years}년은 ${formatWon(last.ceiling)}입니다.`,
    callout: `<strong>이 선 위에서는 상여가 세금을 더 빨리 키웁니다</strong> — 표준 시나리오는 월급 ${formatWon(SEVERANCE_ASSUMED_MONTHLY)}에 상여를 얹어 평균임금 ${formatWon(first.avgWage)}으로 잡습니다. 상여분 ${formatWon(first.avgWage - SEVERANCE_ASSUMED_MONTHLY)}이 근속 ${last.years}년의 퇴직금을 ${formatWon(last.severance - SEVERANCE_ASSUMED_MONTHLY * last.years)} 늘리는 동안 세금은 ${formatWon(last.estimatedTax - severanceIncomeTax(SEVERANCE_ASSUMED_MONTHLY * last.years, last.years))} 늘어, 상여로 늘어난 몫에는 ${formatPercent((last.estimatedTax - severanceIncomeTax(SEVERANCE_ASSUMED_MONTHLY * last.years, last.years)) / (last.severance - SEVERANCE_ASSUMED_MONTHLY * last.years), 1)}가 붙습니다. 평균 실효세율 ${formatPercent(last.effectiveTaxRate, 2)}의 세 배 가까운 한계세율입니다.`,
  };
}

// =========================
// /severance-pay — 퇴사 날짜가 퇴직금을 움직이는 폭
// =========================
const WINDOW_YEAR = 2026;
// 표준 시나리오의 3개월 임금 총액 — 평균임금 × 3
const THREE_MONTH_WAGES = Math.floor(SEVERANCE_ASSUMED_MONTHLY * 1.1) * 3;

function windowRow(monthIndex) {
  // 각 달의 마지막 날을 마지막 근무일로 두면 퇴직일은 다음 달 1일이 된다
  const lastWorkedDay = new Date(WINDOW_YEAR, monthIndex + 1, 0);
  const days = averageWageWindowDays(lastWorkedDay);
  const dailyWage = Math.floor(THREE_MONTH_WAGES / days);
  const years = SEVERANCE_PAY_AMOUNTS[SEVERANCE_PAY_AMOUNTS.length - 1];
  const severance = Math.floor(dailyWage * 30 * years);
  return {
    month: monthIndex + 1,
    lastWorkedDay,
    days,
    dailyWage,
    years,
    severance,
    tax: severanceIncomeTax(severance, years),
  };
}

export function severanceWindowDaysDigest() {
  const rows = Array.from({ length: 12 }, (_, index) => windowRow(index));
  const best = rows.reduce((max, row) => (row.severance > max.severance ? row : max), rows[0]);
  const worst = rows.reduce((min, row) => (row.severance < min.severance ? row : min), rows[0]);
  const ninety = rows.filter((row) => row.days === 90);
  const longest = rows.filter((row) => row.days === worst.days);
  const years = best.years;
  const tableSeverance = severancePayEstimate(years).severance;
  const swing = best.severance - worst.severance;
  const monthLabel = (row) => `${row.month}월 ${row.lastWorkedDay.getDate()}일`;

  return {
    h2: "마지막 근무일이 어느 달인지에 따라 퇴직금이 달라진다",
    body: [
      `평균임금은 퇴직일 전 3개월의 임금 총액을 <strong>그 기간의 실제 일수</strong>로 나눕니다. 3개월의 달력 일수는 89일에서 92일까지 흔들리므로, 임금 총액이 똑같아도 마지막 근무일이 어느 달인지에 따라 1일 평균임금이 달라지고 퇴직금이 따라 움직입니다. 근속 ${years}년·3개월 임금 ${formatWon(THREE_MONTH_WAGES)}으로 ${WINDOW_YEAR}년 열두 달의 말일을 전부 넣어 보면, 가장 유리한 ${monthLabel(best)} 퇴사(산정기간 ${best.days}일)는 퇴직금 ${formatWon(best.severance)}, 가장 불리한 ${worst.days}일 산정기간의 ${longest.length}개 달(${longest.map((row) => `${row.month}월`).join("·")} 말일 퇴사)은 ${formatWon(worst.severance)}으로 <strong>${formatWon(swing)}</strong>(${formatPercent(swing / worst.severance, 2)}) 차이가 납니다.`,
      `위 표의 근속 ${years}년 퇴직금 ${formatWon(tableSeverance)}은 산정기간이 정확히 90일인 경우(${ninety.map(monthLabel).join("·")} 퇴사)에만 성립하는 값입니다. 열두 달 중 ${rows.length - ninety.length}개월은 그보다 많거나 적게 나오며, 이 차이는 회사가 잘못 계산한 것이 아니라 법정 산식이 달력을 그대로 따르기 때문에 생깁니다. 고용노동부 퇴직금 계산기도 같은 방식으로 92일 예시를 씁니다.`,
      `세금까지 넣어도 순서는 바뀌지 않습니다. ${monthLabel(best)} 퇴사의 퇴직소득세는 ${formatWon(best.tax)}, ${monthLabel(worst)} 퇴사는 ${formatWon(worst.tax)}으로 세금 차이는 ${formatWon(best.tax - worst.tax)}에 그쳐, 세후로도 ${formatWon(swing - (best.tax - worst.tax))}이 그대로 남습니다. 퇴사일을 고를 여지가 있다면 연차 정산이나 상여 지급월과 함께 이 산정기간 일수도 확인할 항목입니다. 2월이 끼는 3개월이 짧고, 31일이 두 번 드는 3개월이 가장 길기 때문입니다.`,
    ],
    table: {
      head: ["마지막 근무일", "산정기간", "1일 평균임금", `근속 ${years}년 퇴직금`, "90일 기준과의 차이"],
      rows: rows.map((row) => ({
        highlight: row === best,
        cells: [
          monthLabel(row),
          `${row.days}일`,
          formatWon(row.dailyWage),
          `<strong>${formatWon(row.severance)}</strong>`,
          row.severance === tableSeverance
            ? "—"
            : `${row.severance > tableSeverance ? "+" : "−"}${formatWon(Math.abs(row.severance - tableSeverance))}`,
        ],
      })),
    },
    tableNote: `퇴직일은 마지막 근무일의 다음 날이고, 3개월 임금 총액은 표준 시나리오의 평균임금 ${formatWon(Math.floor(SEVERANCE_ASSUMED_MONTHLY * 1.1))} × 3으로 두었습니다. 마지막 근무일이 월 중간이면 산정기간이 표와 다르게 나올 수 있으므로 <a href="/finance/severance-pay">계산기</a>에 실제 날짜를 넣어 확인하세요.`,
  };
}
