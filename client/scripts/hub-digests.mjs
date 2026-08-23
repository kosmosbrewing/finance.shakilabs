// Cross-band digests for the four highest-traffic base routes.
//
// Why this exists: every interpretive paragraph this site writes lived inside an amount variant
// (/insurance/140000, /compare/7000-vs-8000 …), and those variants canonicalize into their base
// route — so 79% of the prose sits outside the sitemap where no reviewer or crawler reads it.
// The fix is not to un-consolidate. It is to give the base route the one thing a variant cannot
// have: a view across ALL the amounts at once.
//
// So nothing here is a copy of a variant paragraph. A variant answers "where does 140,000원 sit";
// these functions answer "where do the boundaries themselves sit, and which page is on each side"
// — a question that only has an answer when you hold the whole family in one hand.
//
// Every figure is produced by calc-engine.mjs at build time from the same constants the variants
// use, so a rate change moves the hub prose and the variant pages in one edit.

import {
  calculateSalaryBreakdown,
  comprehensiveTotalTaxOf,
  computeComprehensiveTax,
  formatManWonValue,
  formatPercent,
  formatWon,
  INCOME_TAX_BRACKETS,
  PERSONAL_DEDUCTION_PER_PERSON,
  RATES_2026,
  severancePayEstimate,
  SEVERANCE_ASSUMED_MONTHLY,
  SIMPLE_EXPENSE_RATE_BASE,
  SIMPLE_EXPENSE_RATE_EXCESS,
  SIMPLE_EXPENSE_THRESHOLD,
  unemploymentDailyAllowance,
  UNEMPLOYMENT_DAILY_MIN,
} from "./calc-engine.mjs";
import {
  COMPARE_PAIRS,
  COMPREHENSIVE_TAX_AMOUNTS,
  FREELANCER_AMOUNTS,
  INSURANCE_AMOUNTS,
  QUIT_YEARS,
  SALARY_AMOUNTS,
} from "./seo-routes.mjs";
import {
  CALLOUT_STYLE,
  P_STYLE,
  TABLE_STYLE,
  TD_STYLE,
  TH_STYLE,
} from "./hub-styles.mjs";

// =========================
// 파생 상수 — 변종 빌더(prerender-content.mjs)와 허브 다이제스트가 공유한다.
// 여기에서 한 번만 파생시켜야 법령 개정 시 양쪽이 어긋날 수 없다.
// =========================
export const MIN_WAGE_HOURLY_2026 = 10_320;
// 주휴 포함 월 209시간 환산 — 전일제 최저임금 월급
export const MIN_WAGE_MONTHLY_2026 = MIN_WAGE_HOURLY_2026 * 209;
export const MIN_WAGE_FEE = Math.floor(
  MIN_WAGE_MONTHLY_2026 * RATES_2026.healthInsurance.employee
);
export const PENSION_CAP_TAXABLE = RATES_2026.nationalPension.maxMonthlyIncome;
export const PENSION_CAP_FEE = Math.floor(
  PENSION_CAP_TAXABLE * RATES_2026.healthInsurance.employee
);
export const PENSION_CAP_DEDUCTION = Math.floor(
  PENSION_CAP_TAXABLE * RATES_2026.nationalPension.employee
);
// 피부양자 소득요건 — 기존 검증 문구(연 2,000만원 이하)와 동일 상수
export const DEPENDENT_INCOME_CEILING = 20_000_000;

// 표준 시나리오(부양가족 1인·비과세 식대 월 20만원)는 사이트 전역의 기준 가정이다.
const NON_TAXABLE_MONTHLY = 200_000;
// 분리과세 세율 — 임대·기타소득이 종합합산을 피할 때 적용되는 정률
const SEPARATE_TAX_RATE = 0.14;

function salaryOf(grossAnnual, dependents = 1, children = 0) {
  return calculateSalaryBreakdown({
    grossAnnual,
    nonTaxableMonthly: NON_TAXABLE_MONTHLY,
    dependents,
    children,
    retirementIncluded: false,
  });
}

// 연봉 천만 단위 밴드 + 밴드 내 위치 — 인접 금액 페이지 간 서술이 실제로 갈리게 하는 파생 워딩
export function salaryBandLabel(annual) {
  if (annual >= 100_000_000) {
    return `${formatManWonValue(Math.round(annual / 10_000))}원`;
  }
  const tenMillions = Math.floor(annual / 10_000_000);
  const position = (annual % 10_000_000) / 10_000_000;
  const suffix = position < 0.34 ? "초반" : position < 0.67 ? "중반" : "후반";
  return `${tenMillions}천만원대 ${suffix}`;
}

// 과세표준이 속한 소득세 구간 (calc-engine의 누진 구간 상수 사용)
export function findIncomeTaxBracket(taxableBase) {
  return INCOME_TAX_BRACKETS.find((bracket) => taxableBase <= bracket.limit);
}

// 누진 구간을 사람이 읽는 라벨로 (calc-engine INCOME_TAX_BRACKETS 기준)
export function incomeTaxBracketLabel(bracket) {
  const limitLabel = Number.isFinite(bracket.limit)
    ? `${formatManWonValue(Math.round(bracket.limit / 10_000))}원`
    : null;
  const baseLabel = `${formatManWonValue(Math.round(bracket.baseIncome / 10_000))}원`;
  if (bracket.baseIncome === 0) return `${limitLabel} 이하`;
  if (!limitLabel) return `${baseLabel} 초과`;
  return `${baseLabel}~${limitLabel}`;
}

const manWon = (value) => `${formatManWonValue(value)}원`;
const ratePercent = (rate) => formatPercent(rate, 0);
// 비율 차이는 %가 아니라 %p로 적어야 "세율 24%와 실효 9.4%의 차이"가 오독되지 않는다
const pointGap = (a, b) => `${((a - b) * 100).toFixed(1)}%p`;

// =========================
// 다이제스트 렌더러
// =========================
function renderTable(table) {
  const head = `<thead><tr>${table.head
    .map((h) => `<th style="${TH_STYLE}">${h}</th>`)
    .join("")}</tr></thead>`;
  const rows = table.rows
    .map(
      (row) =>
        `<tr${row.highlight ? ' style="background:hsl(var(--accent));"' : ""}>${row.cells
          .map((cell) => `<td style="${TD_STYLE}">${cell}</td>`)
          .join("")}</tr>`
    )
    .join("");
  return `<table style="${TABLE_STYLE}">${head}<tbody>${rows}</tbody></table>`;
}

// LANDING_CONTENT(prerender-content.mjs)는 섹션당 `<h2>` + `<p>` 하나 + `extra` HTML을 렌더한다.
// 그래서 첫 문단만 body로 넘기고 나머지(문단·표·콜아웃)를 extra 문자열로 접는다.
export function toLandingSection(digest) {
  const parts = [];
  for (const body of digest.body.slice(1)) parts.push(`<p style="${P_STYLE}">${body}</p>`);
  if (digest.table) parts.push(renderTable(digest.table));
  if (digest.tableNote) parts.push(`<p style="${P_STYLE}">${digest.tableNote}</p>`);
  if (digest.callout) parts.push(`<div style="${CALLOUT_STYLE}">${digest.callout}</div>`);
  return { h2: digest.h2, body: digest.body[0], extra: parts.join("") };
}

// =========================
// /insurance — 고지액을 가르는 제도선
// =========================
function insuranceRowOf(fee) {
  const monthlyTaxable = Math.floor(fee / RATES_2026.healthInsurance.employee);
  const estimatedAnnual = (monthlyTaxable + NON_TAXABLE_MONTHLY) * 12;
  const result = salaryOf(estimatedAnnual);
  return {
    fee,
    monthlyTaxable,
    estimatedAnnual,
    result,
    bracket: findIncomeTaxBracket(result.taxableBase),
  };
}

// 연봉 5,000만원에 해당하는 고지액 — 변종 빌더가 같은 식을 쓰므로 여기서 한 번만 파생시킨다
const FIFTY_MILLION_FEE = Math.floor(
  (50_000_000 / 12 - NON_TAXABLE_MONTHLY) * RATES_2026.healthInsurance.employee
);

const INSURANCE_ZONES = [
  { label: "최저임금선 아래", upper: MIN_WAGE_FEE },
  { label: "최저임금선~연봉 5천만원선", upper: FIFTY_MILLION_FEE },
  { label: "연봉 5천만원선~연금 상한선", upper: PENSION_CAP_FEE },
  { label: "연금 상한선 위", upper: Number.POSITIVE_INFINITY },
];

function insuranceZones() {
  let lower = 0;
  return INSURANCE_ZONES.map((zone) => {
    const fees = INSURANCE_AMOUNTS.filter((fee) => fee >= lower && fee < zone.upper);
    lower = zone.upper;
    const representative = fees[Math.floor(fees.length / 2)];
    return { ...zone, fees, row: insuranceRowOf(representative) };
  });
}

export function insuranceBracketDigest() {
  const zones = insuranceZones();
  const cheapest = insuranceRowOf(INSURANCE_AMOUNTS[0]);
  const dearest = insuranceRowOf(INSURANCE_AMOUNTS[INSURANCE_AMOUNTS.length - 1]);

  return {
    h2: "고지액을 넷으로 가르는 세 개의 제도선",
    body: [
      `이 계산기가 다루는 월 ${formatWon(INSURANCE_AMOUNTS[0])}~${formatWon(INSURANCE_AMOUNTS[INSURANCE_AMOUNTS.length - 1])} 구간은 균일한 띠가 아닙니다. 세 개의 제도선이 이 구간을 넷으로 가르고, 어느 쪽에 있느냐에 따라 고지서를 읽는 방법 자체가 달라집니다. 첫 번째는 전일제 최저임금에 해당하는 ${formatWon(MIN_WAGE_FEE)}, 두 번째는 연봉 5,000만원에 해당하는 ${formatWon(FIFTY_MILLION_FEE)}, 세 번째는 국민연금 기준소득월액 상한에 해당하는 ${formatWon(PENSION_CAP_FEE)}입니다.`,
      `첫 번째 선 아래에서는 역산 자체를 의심해야 합니다. 2026년 최저시급 ${formatWon(MIN_WAGE_HOURLY_2026)}을 주 40시간(주휴 포함 월 209시간)으로 환산한 월급 ${formatWon(MIN_WAGE_MONTHLY_2026)}의 건보료가 ${formatWon(MIN_WAGE_FEE)}이므로, 그보다 낮은 고지액은 전일제 근무에서 나오기 어렵습니다. 단시간 근로이거나 입사·복직으로 일할 계산된 달일 가능성이 큽니다.`,
      `두 번째 선을 넘으면 공제의 성격이 바뀌기 시작하고, 세 번째 선을 넘으면 국민연금 공제가 ${formatWon(PENSION_CAP_DEDUCTION)}에서 멈춥니다. 급여가 더 올라도 연금 부담은 그대로이고 건강보험·장기요양·고용보험과 소득세만 비례해 늘어나는 구간입니다.`,
      `표를 세로로 훑으면 한 가지가 눈에 띕니다. 건강보험료는 보수월액에 ${formatPercent(RATES_2026.healthInsurance.employee, 3)} 정률이라, 고지액이 ${formatWon(cheapest.fee)}에서 ${formatWon(dearest.fee)}으로 ${(dearest.fee / cheapest.fee).toFixed(0)}배가 되면 추정 연봉도 ${(dearest.estimatedAnnual / cheapest.estimatedAnnual).toFixed(1)}배로 거의 같이 커집니다. 반면 4대보험과 소득세를 합친 체감 공제율은 ${formatPercent(cheapest.result.effectiveTaxRate)}에서 ${formatPercent(dearest.result.effectiveTaxRate)}로, ${(dearest.result.effectiveTaxRate / cheapest.result.effectiveTaxRate).toFixed(1)}배 오르는 데 그칩니다. 고지액은 소득에 비례하지만 전체 부담은 그렇지 않다는 뜻이라, 같은 "고지액 2배"라도 어느 구간에서 2배가 되느냐에 따라 실수령이 받는 타격은 달라집니다.`,
    ],
    table: {
      head: ["구간 (고지액 범위)", "대표 페이지", "추정 연봉", "소득세 한계세율", "체감 공제율"],
      rows: zones.map((zone) => ({
        cells: [
          `<strong>${zone.label}</strong><br>${formatWon(zone.fees[0])}~${formatWon(zone.fees[zone.fees.length - 1])} · ${zone.fees.length}쪽`,
          `<a href="/finance/insurance/${zone.row.fee}">${formatWon(zone.row.fee)}</a>`,
          `약 ${manWon(Math.round(zone.row.estimatedAnnual / 10_000))}`,
          ratePercent(zone.row.bracket.rate),
          formatPercent(zone.row.result.effectiveTaxRate),
        ],
      })),
    },
    tableNote: `대표 페이지는 각 구간의 가운데 금액이며, 추정 연봉은 비과세 식대 월 ${formatWon(NON_TAXABLE_MONTHLY)}·부양가족 1인 가정입니다. 체감 공제율은 4대보험과 소득세를 합친 값으로, 첫 구간 대표(${formatPercent(zones[0].row.result.effectiveTaxRate)})와 마지막 구간 대표(${formatPercent(zones[zones.length - 1].row.result.effectiveTaxRate)}) 사이가 ${pointGap(zones[zones.length - 1].row.result.effectiveTaxRate, zones[0].row.result.effectiveTaxRate)} 벌어집니다.`,
    callout: `<strong>고지액이 같아도 구간이 다를 수 있습니다</strong> — 보수 외 소득(이자·배당·임대)이 연 ${formatManWonValue(DEPENDENT_INCOME_CEILING / 10_000)}원을 넘으면 소득월액 보험료가 별도로 부과되어 고지서 합계가 부풀려집니다. 이 표는 보수월액 보험료만 있는 경우를 기준으로 합니다.`,
  };
}

export function insuranceCrossoverDigest() {
  const crossover = INSURANCE_AMOUNTS.map(insuranceRowOf).find(
    ({ result }) => result.totalTax >= result.totalInsurance
  );
  const before = insuranceRowOf(
    INSURANCE_AMOUNTS[INSURANCE_AMOUNTS.indexOf(crossover.fee) - 1]
  );
  const top = insuranceRowOf(INSURANCE_AMOUNTS[INSURANCE_AMOUNTS.length - 1]);

  return {
    h2: "공제의 무게중심이 세금으로 넘어가는 고지액",
    body: [
      `건보료 페이지를 낮은 금액부터 높은 금액까지 한 줄로 세우면, 어느 지점에서 4대보험 합계와 세금 합계의 크기가 뒤집힙니다. 이 계산기 범위에서 그 지점은 월 고지액 ${formatWon(crossover.fee)}입니다. 바로 아래인 ${formatWon(before.fee)}에서는 월 4대보험 ${formatWon(before.result.totalInsurance)}이 소득세·지방소득세 ${formatWon(before.result.totalTax)}보다 크지만, ${formatWon(crossover.fee)}에서는 세금 ${formatWon(crossover.result.totalTax)}이 4대보험 ${formatWon(crossover.result.totalInsurance)}을 앞지릅니다.`,
      `뒤집히는 원인은 두 힘이 반대로 움직이기 때문입니다. 국민연금이 상한(보수월액 ${formatWon(PENSION_CAP_TAXABLE)})에 닿으면 보험료 증가가 멈추는 반면, 소득세는 누진 구조라 계속 가팔라집니다. 그래서 고지액이 가장 높은 ${formatWon(top.fee)} 페이지에서는 격차가 더 벌어져 세금 ${formatWon(top.result.totalTax)}이 4대보험 ${formatWon(top.result.totalInsurance)}의 ${formatPercent(top.result.totalTax / top.result.totalInsurance)}에 이릅니다.`,
      `실무적으로는 이 선을 기준으로 관리할 항목이 달라집니다. 선 아래라면 보험료 부과 기준인 보수월액이 정확한지(4월 보수총액신고 반영 여부)가 더 중요하고, 선 위라면 연말정산 공제 항목을 챙기는 쪽의 금액 효과가 더 큽니다.`,
    ],
  };
}

// =========================
// /salary — 부양가족 1명의 값어치
// =========================
const SALARY_DIGEST_SAMPLES = [2000, 3000, 4000, 5000, 7000, 9000, 12000, 20000];

function dependentRow(amount) {
  const gross = amount * 10_000;
  const base = salaryOf(gross);
  const two = salaryOf(gross, 2);
  const four = salaryOf(gross, 4, 2);
  const bracket = findIncomeTaxBracket(base.taxableBase);
  // 인적공제 1명 = 150만원 × 한계세율 × 지방소득세 10% 가산 ÷ 12개월
  const formula = Math.round((PERSONAL_DEDUCTION_PER_PERSON * bracket.rate * 1.1) / 12);
  const twoGain = two.monthlyNet - base.monthlyNet;
  return {
    amount,
    base,
    twoGain,
    fourGain: four.monthlyNet - base.monthlyNet,
    bracket,
    formula,
    exact: twoGain === formula,
  };
}

export function salaryDependentDigest() {
  const rows = SALARY_DIGEST_SAMPLES.map(dependentRow);
  // "이 연봉 이상은 공식이 정확히 맞는다"는 주장이므로 표 샘플이 아니라 프리셋 전체에서 확인한다.
  // 위쪽에 예외가 하나라도 있으면 그 위 연봉이 경계가 되도록 뒤에서부터 훑는다.
  const allRows = SALARY_AMOUNTS.map(dependentRow);
  let boundaryIndex = allRows.length;
  for (let i = allRows.length - 1; i >= 0; i -= 1) {
    if (!allRows[i].exact) break;
    boundaryIndex = i;
  }
  const firstExact = allRows[boundaryIndex];
  const lastInexact = allRows[boundaryIndex - 1];
  const top = rows[rows.length - 1];

  return {
    h2: "부양가족 1명의 값어치는 연봉대마다 다르다",
    body: [
      `부양가족을 한 명 더 등록해도 4대보험은 1원도 줄지 않습니다. 국민연금·건강보험·장기요양·고용보험은 보수월액에만 붙기 때문입니다. 달라지는 것은 소득세뿐이고, 그래서 절감액은 그 사람의 한계세율에 비례합니다. 아래 표는 이 계산기가 다루는 연봉대를 가로질러 그 값어치가 얼마나 벌어지는지를 한 화면에 놓은 것입니다.`,
      `규칙 자체는 단순합니다. 인적공제는 1명당 ${formatWon(PERSONAL_DEDUCTION_PER_PERSON)}이므로, 월 절감액은 <strong>${formatWon(PERSONAL_DEDUCTION_PER_PERSON)} × 한계세율 × 1.1(지방소득세) ÷ 12</strong>가 됩니다. 실제로 연봉 ${manWon(firstExact.amount)} 이상에서는 이 공식값과 계산 결과가 정확히 일치합니다.`,
      `공식이 어긋나는 쪽은 아래입니다. 연봉 ${manWon(lastInexact.amount)}에서 부양가족 2인의 실제 절감은 월 ${formatWon(lastInexact.twoGain)}으로, 공식값 ${formatWon(lastInexact.formula)}의 ${formatPercent(lastInexact.twoGain / lastInexact.formula, 0)}에 그칩니다. 인적공제가 과세표준을 줄이면 산출세액이 줄고, 산출세액에 연동된 근로소득세액공제도 함께 줄어 절감분의 상당 부분이 상쇄되기 때문입니다. 저연봉 구간에서 "부양가족을 넣어도 별로 안 줄더라"는 체감은 착각이 아니라 구조입니다.`,
    ],
    table: {
      head: [
        "연봉",
        "월 소득세 (부양가족 1인)",
        "2인일 때 월 절감",
        "4인·자녀 2명일 때 월 절감",
        "1명당 공식값",
      ],
      rows: rows.map((row) => ({
        highlight: row.amount === firstExact.amount,
        cells: [
          `<a href="/finance/salary/${row.amount}">${manWon(row.amount)}</a>`,
          formatWon(row.base.totalTax),
          formatWon(row.twoGain),
          `<strong>${formatWon(row.fourGain)}</strong>`,
          `${formatWon(row.formula)} (${ratePercent(row.bracket.rate)})`,
        ],
      })),
    },
    tableNote: `비과세 식대 월 ${formatWon(NON_TAXABLE_MONTHLY)} 기준이며, 4인은 배우자 포함 부양가족 4명에 자녀 2명(자녀세액공제 포함) 가정입니다. 같은 4인 가구라도 연봉 ${manWon(rows[0].amount)}에서는 월 ${formatWon(rows[0].fourGain)}, 연봉 ${manWon(top.amount)}에서는 월 ${formatWon(top.fourGain)}으로 약 ${(top.fourGain / Math.max(1, rows[0].fourGain)).toFixed(0)}배 차이 납니다. 저연봉 구간의 절감액이 그 달 소득세 총액(${formatWon(rows[0].base.totalTax)})과 같다는 것은, 낼 세금이 이미 바닥나 더 줄일 것이 남지 않았다는 뜻입니다.`,
  };
}

export function salaryPensionCapDigest() {
  const capAnnual = (PENSION_CAP_TAXABLE + NON_TAXABLE_MONTHLY) * 12;
  const firstCapped = SALARY_AMOUNTS.find(
    (amount) => salaryOf(amount * 10_000).taxableMonthly >= PENSION_CAP_TAXABLE
  );
  const index = SALARY_AMOUNTS.indexOf(firstCapped);
  const below = SALARY_AMOUNTS[index - 1];
  const belowBelow = SALARY_AMOUNTS[index - 2];
  const cappedRate = salaryOf(firstCapped * 10_000).effectiveTaxRate;
  const belowRate = salaryOf(below * 10_000).effectiveTaxRate;
  const belowBelowRate = salaryOf(belowBelow * 10_000).effectiveTaxRate;

  return {
    h2: "국민연금 공제가 멈추는 연봉",
    body: [
      `위 표의 실효세율 열이 계속 가팔라지기만 하는 것은 아닙니다. 국민연금은 기준소득월액 상한 ${formatWon(PENSION_CAP_TAXABLE)}(2026.7.1 시행)에서 멈추므로, 비과세 식대 월 ${formatWon(NON_TAXABLE_MONTHLY)} 기준으로 연봉 ${manWon(Math.round(capAnnual / 10_000))}을 넘어서면 국민연금 공제가 ${formatWon(PENSION_CAP_DEDUCTION)}에 고정됩니다. 이 계산기의 프리셋 중에는 연봉 ${manWon(firstCapped)}부터가 그 구간입니다.`,
      `효과는 실효세율 상승폭에서 드러납니다. 연봉 ${manWon(belowBelow)}에서 ${manWon(below)}으로 올라갈 때 실효세율은 ${pointGap(belowRate, belowBelowRate)} 오르지만, ${manWon(below)}에서 ${manWon(firstCapped)}으로 같은 폭을 올릴 때는 ${pointGap(cappedRate, belowRate)}만 오릅니다. 소득세는 계속 누진으로 올라가는데 연금 보험료 증가가 사라져 두 힘이 상쇄되기 때문입니다.`,
      `그래서 고연봉 구간의 인상 협상은 "세금이 다 가져간다"는 통념과 실제가 조금 다릅니다. 세율은 분명히 높지만 상한에 걸린 항목이 늘어날수록 인상분 중 남는 비율은 오히려 완만해집니다. 두 연봉을 나란히 놓고 확인하려면 <a href="/finance/compare">이직 연봉 비교 계산기</a>에서 인상분이 어디로 가는지 항목별로 볼 수 있습니다.`,
    ],
  };
}

// =========================
// /comprehensive-tax — 한계세율과 실효세율의 격차
// =========================
function comprehensiveRows() {
  return COMPREHENSIVE_TAX_AMOUNTS.map((amount) => {
    const calc = computeComprehensiveTax(amount * 10_000);
    const bracket = findIncomeTaxBracket(calc.taxableBase);
    const effective = calc.totalTax / calc.income;
    // 추가 수입 100만원: 경비율 인정 후 남는 과세표준에 한계세율·지방소득세 10% 가산
    const perMillion = Math.floor(
      Math.floor(1_000_000 * (1 - calc.marginalExpenseRate)) * bracket.rate * 1.1
    );
    return { amount, calc, bracket, effective, gap: bracket.rate - effective, perMillion };
  });
}

export function comprehensiveTaxGapDigest() {
  const rows = comprehensiveRows();
  const narrowest = rows.reduce((min, row) => (row.gap < min.gap ? row : min), rows[0]);
  const widest = rows.reduce((max, row) => (row.gap > max.gap ? row : max), rows[0]);
  const narrowIndex = rows.indexOf(narrowest);
  const afterNarrow = rows[narrowIndex + 1];

  return {
    h2: "한계세율과 실효세율의 격차가 수입대마다 다른 이유",
    body: [
      "세율을 묻는 질문에는 답이 두 개 있습니다. 지금 100만원을 더 벌면 그 돈에 몇 %가 붙느냐(한계세율)와, 올해 번 돈 전체 대비 실제로 몇 %를 냈느냐(실효세율)입니다. 두 값은 늘 다르고, 무엇보다 그 <strong>격차 자체가 수입 규모에 따라 좁아졌다 다시 벌어집니다</strong>. 수입 한 구간만 보고 있으면 이 움직임이 보이지 않습니다.",
      `격차가 가장 좁은 지점은 연 수입 ${manWon(narrowest.amount)}으로 ${pointGap(narrowest.bracket.rate, narrowest.effective)}입니다. 그런데 바로 다음 구간인 ${manWon(afterNarrow.amount)}에서 격차는 ${pointGap(afterNarrow.bracket.rate, afterNarrow.effective)}로 세 배 가까이 튑니다. 단순경비율이 꺾이는 4,000만원 선과 누진세율이 ${ratePercent(narrowest.bracket.rate)}에서 ${ratePercent(afterNarrow.bracket.rate)}로 올라가는 지점이 같은 자리에서 겹치기 때문입니다.`,
      `추가 수입 100만원에 붙는 세금으로 환산하면 체감이 분명해집니다. ${manWon(narrowest.amount)}까지는 100만원을 더 벌 때 세금이 ${formatWon(narrowest.perMillion)} 늘어나는 데 그치지만, ${manWon(afterNarrow.amount)} 구간에서는 ${formatWon(afterNarrow.perMillion)}으로 ${(afterNarrow.perMillion / narrowest.perMillion).toFixed(1)}배가 됩니다. 연말에 매출을 다음 해로 미룰지 판단할 때 실제로 봐야 하는 숫자는 실효세율이 아니라 이 열입니다.`,
    ],
    table: {
      head: ["연 수입", "한계세율", "실효세율 (수입 대비)", "격차", "추가 수입 100만원당 세금"],
      rows: rows.map((row) => ({
        highlight: row === widest,
        cells: [
          `<a href="/finance/comprehensive-tax/${row.amount}">${manWon(row.amount)}</a>`,
          ratePercent(row.bracket.rate),
          formatPercent(row.effective),
          `${pointGap(row.bracket.rate, row.effective)}`,
          `<strong>${formatWon(row.perMillion)}</strong>`,
        ],
      })),
    },
    tableNote: `기본공제 1인·표준세액공제만 반영한 단독 사업자 기준입니다. 격차가 가장 벌어지는 구간은 연 수입 ${manWon(widest.amount)}으로 ${pointGap(widest.bracket.rate, widest.effective)}이며, 이 구간에서는 실효세율 ${formatPercent(widest.effective)}만 보고 판단하면 추가 수입에 붙는 부담을 크게 과소평가하게 됩니다.`,
  };
}

// 부수입 500만원을 종합에 합산했을 때 실제로 늘어나는 세액.
// 한계세율 × 1.1로 어림하면 구간 경계를 걸치는 수입에서 틀리므로 누진 산식을 그대로 태운다.
const SIDE_INCOME = 5_000_000;
function addedTaxOf(calc) {
  return (
    comprehensiveTotalTaxOf(calc.taxableBase + SIDE_INCOME) -
    comprehensiveTotalTaxOf(calc.taxableBase)
  );
}
const SEPARATE_TAX_ON_SIDE_INCOME = Math.floor(SIDE_INCOME * SEPARATE_TAX_RATE * 1.1);

export function comprehensiveTaxSeparateDigest() {
  const rows = comprehensiveRows();
  const firstAbove = rows.find((row) => row.bracket.rate > SEPARATE_TAX_RATE);
  const lastBelow = rows[rows.indexOf(firstAbove) - 1];
  const belowAdded = addedTaxOf(lastBelow.calc);
  const aboveAdded = addedTaxOf(firstAbove.calc);

  return {
    h2: `분리과세 ${ratePercent(SEPARATE_TAX_RATE)}보다 세율이 높아지는 수입 지점`,
    body: [
      `주택임대 수입(연 2,000만원 이하)이나 기타소득처럼 종합소득에 합산하지 않고 ${ratePercent(SEPARATE_TAX_RATE)} 정률로 끝낼 수 있는 소득이 있습니다. 이때 "분리가 유리한가"는 취향이 아니라 산수입니다. 본업 수입의 한계세율이 ${ratePercent(SEPARATE_TAX_RATE)}보다 높으면 분리가, 낮으면 합산이 유리합니다.`,
      `이 계산기 프리셋에서 그 경계는 연 수입 ${manWon(lastBelow.amount)}과 ${manWon(firstAbove.amount)} 사이에 있습니다. ${manWon(lastBelow.amount)}의 과세표준 ${formatWon(lastBelow.calc.taxableBase)}은 한계세율 ${ratePercent(lastBelow.bracket.rate)} 구간(${incomeTaxBracketLabel(lastBelow.bracket)})에 있어 ${ratePercent(SEPARATE_TAX_RATE)}보다 낮지만, ${manWon(firstAbove.amount)}의 과세표준 ${formatWon(firstAbove.calc.taxableBase)}은 ${ratePercent(firstAbove.bracket.rate)} 구간(${incomeTaxBracketLabel(firstAbove.bracket)})으로 올라섭니다.`,
      `숫자로 확인하면 이렇습니다. 임대·기타소득 ${formatWon(SIDE_INCOME)}이 얹힌다고 할 때, 분리과세를 택하면 어느 수입대에서든 ${formatWon(SEPARATE_TAX_ON_SIDE_INCOME)}(지방소득세 포함)으로 끝납니다. 반면 종합에 합산하면 본업 수입 ${manWon(lastBelow.amount)}에서는 ${formatWon(belowAdded)}만 늘어 합산이 ${formatWon(SEPARATE_TAX_ON_SIDE_INCOME - belowAdded)} 유리하지만, ${manWon(firstAbove.amount)}에서는 ${formatWon(aboveAdded)}이 늘어 분리 쪽이 ${formatWon(aboveAdded - SEPARATE_TAX_ON_SIDE_INCOME)} 유리해집니다. 본업 수입이 늘어난 해에 같은 부수입의 최적 선택이 뒤집힐 수 있다는 뜻입니다.`,
    ],
    callout: `<strong>주의</strong> — 분리과세 임대소득의 기본공제(등록 400만원·미등록 200만원)는 임대소득 외 종합소득금액이 ${formatManWonValue(DEPENDENT_INCOME_CEILING / 10_000)}원 이하일 때만 적용됩니다. 본업 소득금액이 그 선을 넘으면 공제 없이 전액에 ${ratePercent(SEPARATE_TAX_RATE)}가 붙으므로, 위 판단에 이 조건을 함께 넣어야 합니다.`,
  };
}

// =========================
// /compare — 인상분 유지율
// =========================
function comparePairRows() {
  return COMPARE_PAIRS.map(([a, b]) => {
    const from = salaryOf(a * 10_000);
    const to = salaryOf(b * 10_000);
    const grossDiff = to.grossAnnual - from.grossAnnual;
    const netDiff = to.annualNet - from.annualNet;
    const fromBracket = findIncomeTaxBracket(from.taxableBase);
    const toBracket = findIncomeTaxBracket(to.taxableBase);
    const crossesCap =
      from.taxableMonthly < PENSION_CAP_TAXABLE && to.taxableMonthly >= PENSION_CAP_TAXABLE;
    const crossesBracket = fromBracket !== toBracket;
    return {
      a,
      b,
      grossDiff,
      retention: netDiff / grossDiff,
      crossesCap,
      crossesBracket,
      fromBracket,
      toBracket,
    };
  });
}

export function compareRetentionDigest() {
  const rows = comparePairRows();
  const best = rows.reduce((max, row) => (row.retention > max.retention ? row : max), rows[0]);
  const worst = rows.reduce((min, row) => (row.retention < min.retention ? row : min), rows[0]);
  const rebound = rows[rows.indexOf(worst) + 1] ?? null;

  const boundaryLabel = (row) => {
    const marks = [];
    if (row.crossesBracket) {
      marks.push(`소득세 ${ratePercent(row.fromBracket.rate)} → ${ratePercent(row.toBracket.rate)}`);
    }
    if (row.crossesCap) marks.push("국민연금 상한 통과");
    return marks.length ? marks.join(" · ") : "없음 (같은 구간 안)";
  };

  return {
    h2: "인상분 유지율 — 세전 100만원 중 통장에 남는 돈",
    body: [
      "제안을 비교할 때 가장 쓸모 있는 한 개의 숫자는 <strong>유지율</strong>입니다. 세전 인상분 100만원 가운데 실제로 통장에 남는 비율을 뜻하고, 세전 인상액에 이 비율을 곱하면 곧바로 세후 증가액이 나옵니다. 조합 하나만 보면 그냥 하나의 퍼센트지만, 여덟 조합을 나란히 세우면 이 값이 <strong>단조롭게 낮아지지 않는다</strong>는 사실이 드러납니다.",
      `가장 높은 조합은 ${manWon(best.a)} → ${manWon(best.b)}(${formatPercent(best.retention)})이고, 가장 낮은 조합은 ${manWon(worst.a)} → ${manWon(worst.b)}(${formatPercent(worst.retention)})입니다.${
        rebound
          ? ` 그런데 더 높은 연봉대인 ${manWon(rebound.a)} → ${manWon(rebound.b)} 조합의 유지율은 ${formatPercent(rebound.retention)}로, 오히려 ${pointGap(rebound.retention, worst.retention)} 반등합니다.`
          : ""
      } 연봉이 높아질수록 유지율이 계속 나빠질 것 같지만 실제로는 그렇지 않습니다.`,
      `이유는 두 제도선이 서로 다른 방향으로 작용하기 때문입니다. ${manWon(worst.a)} → ${manWon(worst.b)} 조합은 소득세 구간이 ${ratePercent(worst.fromBracket.rate)}에서 ${ratePercent(worst.toBracket.rate)}로 올라가 인상분 일부에 더 높은 세율이 붙습니다. 반면 그다음 조합은 보수월액이 국민연금 기준소득월액 상한 ${formatWon(PENSION_CAP_TAXABLE)}을 넘어서면서 연금 공제가 ${formatWon(PENSION_CAP_DEDUCTION)}에 고정돼, 인상분에 붙던 ${formatPercent(RATES_2026.nationalPension.employee, 2)}가 사라집니다.`,
      `이 표를 거꾸로 읽으면 협상 목표를 세전 금액으로 환산할 수 있습니다. 월 실수령을 ${formatWon(100_000)} 늘리려면 연 ${formatWon(1_200_000)}의 세후 증가가 필요한데, 세전으로는 유지율이 가장 높은 ${manWon(best.a)} → ${manWon(best.b)} 구간에서 약 ${formatWon(Math.round(1_200_000 / best.retention))}, 가장 낮은 ${manWon(worst.a)} → ${manWon(worst.b)} 구간에서는 약 ${formatWon(Math.round(1_200_000 / worst.retention))}을 더 받아야 합니다. 같은 목표에 필요한 세전 금액이 구간에 따라 ${formatWon(Math.round(1_200_000 / worst.retention) - Math.round(1_200_000 / best.retention))} 차이 나므로, 인상률을 먼저 말하기 전에 본인 구간의 유지율부터 확인하는 편이 낫습니다.`,
    ],
    table: {
      head: ["비교 조합", "세전 인상분 (연)", "인상분 유지율", "건너는 제도 경계선"],
      rows: rows.map((row) => ({
        highlight: row === worst,
        cells: [
          `<a href="/finance/compare/${row.a}-vs-${row.b}">${manWon(row.a)} → ${manWon(row.b)}</a>`,
          formatWon(row.grossDiff),
          `<strong>${formatPercent(row.retention)}</strong>`,
          boundaryLabel(row),
        ],
      })),
    },
    tableNote: `부양가족 1인·비과세 식대 월 ${formatWon(NON_TAXABLE_MONTHLY)} 기준입니다. 유지율은 세후 연 증가액을 세전 연 증가액으로 나눈 값이라, 제안 연봉의 세전 인상분에 그대로 곱하면 세후 증가액을 암산할 수 있습니다.`,
    callout: `<strong>쓰는 법</strong> — 세전 ${formatWon(5_000_000)} 인상 제안을 받았다면, 본인 구간 유지율이 ${formatPercent(worst.retention)}일 때 연 세후 증가액은 약 ${formatWon(Math.round(5_000_000 * worst.retention))}(월 ${formatWon(Math.round((5_000_000 * worst.retention) / 12))})입니다. 이 금액이 이직에 따르는 비용을 덮는지가 실제 판단 기준입니다.`,
  };
}

// =========================
// /quit — 근속연수를 가로지르는 두 개의 시선
// =========================
const QUIT_MONTHLY_LIVING = 2_000_000;

// 수급일수는 나이·가입기간 구간표를 따른다. quitHub와 buildQuitContent가 같은 계단을 쓰므로
// 한 곳에서만 파생시켜야 세 화면이 어긋나지 않는다.
export function unemploymentDaysFor(years) {
  if (years >= 10) return 240;
  if (years >= 5) return 210;
  if (years >= 3) return 180;
  if (years >= 1) return 150;
  return 120;
}

function quitRow(years) {
  const estimate = severancePayEstimate(years);
  const { dailyAmount, rawDaily } = unemploymentDailyAllowance(estimate.avgWage);
  const days = unemploymentDaysFor(years);
  const unemploymentTotal = dailyAmount * days;
  return {
    years,
    ...estimate,
    dailyAmount,
    rawDaily,
    days,
    unemploymentTotal,
    // 세전 총재원과 세후 총재원을 같이 들고 다녀야 "세금이 몇 달을 깎았나"를 뺄셈으로 보여줄 수 있다
    grossFunding: estimate.severance + unemploymentTotal,
    netFunding: estimate.netSeverance + unemploymentTotal,
    effectiveTaxRate: estimate.estimatedTax / estimate.severance,
  };
}

export function quitSeveranceTaxDigest() {
  const rows = QUIT_YEARS.map(quitRow);
  const flat = rows.filter((row) => row.years <= 5);
  const last = rows[rows.length - 1];
  const first = rows[0];
  // 세금이 갉아먹는 생존 일수 — 개월이 아니라 일로 환산해야 크기가 정직하게 보인다
  const daysLost = (row) => (row.estimatedTax / QUIT_MONTHLY_LIVING) * 30;

  return {
    h2: "퇴직소득세는 근속 5년을 넘는 순간 가벼워진다",
    body: [
      `위 표의 퇴직금은 세전 금액이고, 생존기간 계산에서도 퇴직소득세를 뺐습니다. 그 빠진 값을 근속 ${first.years}년부터 ${last.years}년까지 한 줄로 세워 보면, 퇴직소득세가 <strong>근속에 비례해 늘지 않는다</strong>는 사실이 드러납니다. 한 페이지에서 근속 하나만 보면 그냥 하나의 금액이지만, 네 근속을 나란히 놓으면 실효세율이 어느 지점에서 꺾이는지가 보입니다.`,
      `근속 ${flat[0].years}년부터 ${flat[flat.length - 1].years}년까지는 실효세율이 ${formatPercent(flat[0].effectiveTaxRate, 2)}로 완전히 평평합니다. 퇴직금도 근속연수공제도 근속에 정비례해 늘어나(각각 연 ${formatWon(first.severance)}·연 ${formatWon(first.yearDeduction)}) 환산급여가 그대로이기 때문입니다. 그런데 ${last.years}년에서는 ${formatPercent(last.effectiveTaxRate, 2)}로 내려갑니다. 근속연수공제 단가가 5년 초과분부터 연 ${formatWon(1_000_000)}에서 ${formatWon(2_000_000)}으로 두 배가 되어, 과세 대상이 되는 몫 자체가 줄기 때문입니다.`,
      `크기를 생활비로 환산하면 체감이 분명해집니다. 월 ${formatWon(QUIT_MONTHLY_LIVING)} 기준으로 퇴직소득세가 갉아먹는 생존 시간은 근속 ${first.years}년에서 약 ${daysLost(first).toFixed(1)}일, ${last.years}년에서도 약 ${daysLost(last).toFixed(1)}일에 그칩니다. 위 표의 생존 개월 수가 세금을 넣어도 바뀌지 않는 이유입니다. 퇴사 재무에서 실제로 무서운 항목은 퇴직소득세가 아니라, 재직 중에는 없던 지역가입 건강보험료 쪽입니다.`,
    ],
    table: {
      head: ["근속", "퇴직금 (세전)", "근속연수공제", "퇴직소득세", "실효세율", "세후 퇴직금"],
      rows: rows.map((row) => ({
        highlight: row.years === last.years,
        cells: [
          `<a href="/finance/quit/${row.years}years">${row.years}년</a>`,
          formatWon(row.severance),
          formatWon(row.yearDeduction),
          formatWon(row.estimatedTax),
          `<strong>${formatPercent(row.effectiveTaxRate, 2)}</strong>`,
          formatWon(row.netSeverance),
        ],
      })),
    },
    tableNote: `평균임금 ${formatWon(first.avgWage)}(월 급여 ${formatWon(SEVERANCE_ASSUMED_MONTHLY)}·상여 포함 1.1배) 가정이며, 지방소득세를 포함한 값입니다. 실효세율은 퇴직소득세를 세전 퇴직금으로 나눈 값으로, 근속 ${last.years}년의 세금 ${formatWon(last.estimatedTax)}은 ${first.years}년(${formatWon(first.estimatedTax)})의 ${(last.estimatedTax / first.estimatedTax).toFixed(1)}배지만 퇴직금은 ${last.years}배라 부담 비율은 오히려 내려갑니다.`,
  };
}

export function quitFundingMixDigest() {
  const rows = QUIT_YEARS.map(quitRow);
  const crossover = rows.find((row) => row.severance > row.unemploymentTotal);
  const before = rows[rows.indexOf(crossover) - 1];
  const first = rows[0];
  const last = rows[rows.length - 1];
  const share = (row) => row.unemploymentTotal / row.grossFunding;

  return {
    h2: "재원의 무게가 실업급여에서 퇴직금으로 넘어가는 근속",
    body: [
      `퇴사 자금은 퇴직금과 실업급여 두 갈래인데, 둘 중 어느 쪽이 주력인지는 근속에 따라 <strong>뒤바뀝니다</strong>. 근속 ${first.years}년에서는 총재원 ${formatWon(first.grossFunding)} 가운데 실업급여가 ${formatPercent(share(first))}를 차지해 퇴직금의 ${(first.unemploymentTotal / first.severance).toFixed(1)}배지만, 근속 ${last.years}년에서는 실업급여 비중이 ${formatPercent(share(last))}로 내려가고 퇴직금이 실업급여의 ${(last.severance / last.unemploymentTotal).toFixed(1)}배가 됩니다.`,
      `역전이 일어나는 지점은 근속 ${before.years}년과 ${crossover.years}년 사이입니다. ${before.years}년에서는 실업급여 ${formatWon(before.unemploymentTotal)}이 퇴직금 ${formatWon(before.severance)}보다 크지만, ${crossover.years}년에서는 퇴직금 ${formatWon(crossover.severance)}이 실업급여 ${formatWon(crossover.unemploymentTotal)}을 앞지릅니다.`,
      `두 재원이 전혀 다른 식으로 자라기 때문입니다. 퇴직금은 근속에 정비례해 매끄럽게 늘지만, 실업급여는 일액이 아니라 <strong>수급일수만</strong> 계단식으로 늘어납니다. 이 표준 시나리오에서 일액은 네 근속 모두 ${formatWon(first.dailyAmount)}로 같습니다. 평균임금 ${formatWon(first.avgWage)}의 60%인 ${formatWon(first.rawDaily)}이 2026년 하한액 ${formatWon(UNEMPLOYMENT_DAILY_MIN)}에 못 미쳐 하한이 대신 적용되기 때문이고, 그래서 실업급여 총액의 차이는 오로지 ${first.days}일에서 ${last.days}일로 늘어난 일수에서만 나옵니다.`,
      `실무적으로 갈리는 것은 "무엇을 확인해야 하는가"입니다. 근속이 짧아 실업급여가 주력인 쪽은 <strong>수급 자격</strong>(이직 사유가 비자발적인지)이 재원의 절반 이상을 좌우하므로 이직확인서 사유 코드가 가장 중요합니다. 근속이 길어 퇴직금이 주력인 쪽은 자격보다 <strong>평균임금 산정</strong>(퇴직 전 3개월에 상여·연차수당이 제대로 들어갔는지)이 금액을 더 크게 움직입니다.`,
    ],
    table: {
      head: ["근속", "퇴직금", "실업급여 총액", "수급일수", "총재원 중 실업급여 비중"],
      rows: rows.map((row) => ({
        highlight: row.years === crossover.years,
        cells: [
          `<a href="/finance/quit/${row.years}years">${row.years}년</a>`,
          formatWon(row.severance),
          formatWon(row.unemploymentTotal),
          `${row.days}일`,
          `<strong>${formatPercent(share(row))}</strong>`,
        ],
      })),
    },
    callout: `<strong>하한액에 걸려 있다는 뜻</strong> — 일액이 하한 ${formatWon(UNEMPLOYMENT_DAILY_MIN)}에 붙어 있으면, 퇴사 전 급여가 올라도 실업급여는 1원도 늘지 않습니다. 평균임금이 월 약 ${formatWon(Math.ceil((UNEMPLOYMENT_DAILY_MIN / 0.6) * 30))}을 넘어서야 비로소 일액이 하한 위로 올라섭니다.`,
  };
}

// =========================
// /freelancer — 경비율 절벽과 3.3% 선납의 사각
// =========================
function freelancerRow(amount) {
  const calc = computeComprehensiveTax(amount * 10_000);
  return {
    amount,
    calc,
    effectiveExpenseRate: calc.expenses / calc.income,
    coverage: calc.withholdingPrepaid / calc.totalTax,
    shortfall: calc.totalTax - calc.withholdingPrepaid,
  };
}

export function freelancerExpenseCliffDigest() {
  const rows = FREELANCER_AMOUNTS.map(freelancerRow);
  const lastFlat = [...rows]
    .reverse()
    .find((row) => row.calc.income <= SIMPLE_EXPENSE_THRESHOLD);
  const firstOver = rows[rows.indexOf(lastFlat) + 1];
  const top = rows[rows.length - 1];

  return {
    h2: "경비율 절벽은 한 번에 떨어지지 않는다",
    body: [
      `단순경비율이 ${formatPercent(SIMPLE_EXPENSE_RATE_BASE, 1)}에서 ${formatPercent(SIMPLE_EXPENSE_RATE_EXCESS, 1)}로 꺾인다는 말은 흔히 "수입 ${formatWon(SIMPLE_EXPENSE_THRESHOLD)}을 넘으면 경비 인정이 반 토막"으로 읽힙니다. 실제로는 그렇지 않습니다. 낮은 율은 <strong>초과분에만</strong> 붙기 때문에, 수입 전체로 따진 실효 경비율은 절벽처럼 떨어지지 않고 천천히 미끄러집니다. 이 차이는 수입대 하나만 보고 있으면 절대 보이지 않고, 전 구간을 나란히 놓아야 드러납니다.`,
      `표의 실효 경비율 열을 보면 ${manWon(lastFlat.amount)}까지는 ${formatPercent(lastFlat.effectiveExpenseRate, 2)}로 평평하다가, 절벽을 갓 넘은 ${manWon(firstOver.amount)}에서 ${formatPercent(firstOver.effectiveExpenseRate, 2)}로 내려앉습니다. 그런데 이 계산기의 최대 수입인 ${manWon(top.amount)}에서도 실효 경비율은 여전히 ${formatPercent(top.effectiveExpenseRate, 2)}이고, ${formatPercent(SIMPLE_EXPENSE_RATE_EXCESS, 1)}에는 닿지 않습니다. 앞의 ${formatWon(SIMPLE_EXPENSE_THRESHOLD)}이 높은 율을 계속 붙들고 있기 때문이며, 수입이 아무리 커져도 ${formatPercent(SIMPLE_EXPENSE_RATE_EXCESS, 1)}에 수렴할 뿐 그 아래로는 내려가지 않습니다.`,
      `진짜 부담은 경비율 자체가 아니라 <strong>과세표준이 수입보다 빨리 자란다</strong>는 데 있습니다. ${manWon(lastFlat.amount)}에서 ${manWon(top.amount)}로 수입이 ${(top.calc.income / lastFlat.calc.income).toFixed(1)}배가 될 때 과세표준은 ${(top.calc.taxableBase / lastFlat.calc.taxableBase).toFixed(1)}배가 됩니다. 경비 인정률이 낮아진 몫이 그대로 과세표준에 얹히고, 그 위에 누진세율이 다시 곱해지므로 세액은 ${(top.calc.totalTax / lastFlat.calc.totalTax).toFixed(1)}배까지 벌어집니다.`,
    ],
    table: {
      head: ["연 수입", "인정 경비", "실효 경비율", "과세표준", "확정세액"],
      rows: rows.map((row) => ({
        highlight: row.amount === firstOver.amount,
        cells: [
          `<a href="/finance/freelancer/${row.amount}">${manWon(row.amount)}</a>`,
          formatWon(row.calc.expenses),
          `<strong>${formatPercent(row.effectiveExpenseRate, 2)}</strong>`,
          formatWon(row.calc.taxableBase),
          formatWon(row.calc.totalTax),
        ],
      })),
    },
    tableNote: `인적용역 단순경비율 기준입니다. 실효 경비율은 인정 경비를 수입으로 나눈 값이라, 장부를 쓸지 판단할 때 비교해야 하는 기준선이 바로 이 열입니다. 실제 경비가 이 비율을 넘는 해에만 장부 작성이 유리합니다 — ${manWon(top.amount)} 구간이라면 ${formatPercent(SIMPLE_EXPENSE_RATE_EXCESS, 1)}이 아니라 ${formatPercent(top.effectiveExpenseRate, 2)}가 손익분기점입니다.`,
  };
}

export function freelancerPrepaidGapDigest() {
  const rows = FREELANCER_AMOUNTS.map(freelancerRow);
  const owing = rows.filter((row) => row.shortfall > 0);
  const firstOwing = owing[0];
  const top = rows[rows.length - 1];
  const reserveRate = (row) => row.shortfall / row.calc.income;

  return {
    h2: "3.3%가 확정세액을 덮는 비율과 따로 떼어둘 돈",
    body: [
      `원천징수 ${formatPercent(0.033, 1)}는 세율이 아니라 선납금입니다. 그래서 실무에서 중요한 질문은 "3.3%가 맞느냐"가 아니라 <strong>"3.3%가 5월 고지서의 몇 %를 덮어 주느냐"</strong>입니다. 이 커버리지를 전 수입대에 걸쳐 계산하면 ${formatPercent(rows[0].coverage, 0)}에서 ${formatPercent(top.coverage, 0)}까지 내려갑니다.`,
      `커버리지가 100%를 밑도는 순간부터 5월은 환급이 아니라 납부의 달이 됩니다. 이 계산기 범위에서 그 지점은 연 수입 ${manWon(firstOwing.amount)}이며, 커버리지 ${formatPercent(firstOwing.coverage, 0)}로 확정세액 ${formatWon(firstOwing.calc.totalTax)} 가운데 ${formatWon(firstOwing.calc.withholdingPrepaid)}만 이미 내 있고 ${formatWon(firstOwing.shortfall)}이 모자랍니다.`,
      `모자란 몫을 수입 대비 비율로 바꾸면 그대로 <strong>적립률</strong>이 됩니다. ${manWon(firstOwing.amount)} 구간은 수입의 ${formatPercent(reserveRate(firstOwing), 2)}, ${manWon(top.amount)} 구간은 ${formatPercent(reserveRate(top), 2)}입니다. 즉 3.3%가 빠져나간 대금을 받을 때마다 그 위에 수입의 ${formatPercent(reserveRate(firstOwing), 1)}~${formatPercent(reserveRate(top), 1)}를 따로 떼어 두면 5월에 현금을 융통할 일이 없습니다. 월 단위로는 ${manWon(firstOwing.amount)} 구간이 ${formatWon(Math.round(firstOwing.shortfall / 12))}, ${manWon(top.amount)} 구간이 ${formatWon(Math.round(top.shortfall / 12))}입니다.`,
    ],
    table: {
      head: ["연 수입", "3.3%가 덮는 비율", "부족분 (5월 납부)", "권장 적립률", "월 적립액"],
      rows: rows.map((row) => ({
        highlight: row.amount === firstOwing.amount,
        cells: [
          `<a href="/finance/freelancer/${row.amount}">${manWon(row.amount)}</a>`,
          `<strong>${formatPercent(row.coverage, 0)}</strong>`,
          row.shortfall > 0 ? formatWon(row.shortfall) : `없음 (${formatWon(-row.shortfall)} 환급)`,
          row.shortfall > 0 ? formatPercent(reserveRate(row), 2) : "0%",
          row.shortfall > 0 ? formatWon(Math.round(row.shortfall / 12)) : "0원",
        ],
      })),
    },
    callout: `<strong>적립률은 한 해 늦게 따라온다</strong> — 위 비율은 그해 수입이 확정된 뒤의 값입니다. 수입이 빠르게 늘고 있다면 작년 구간이 아니라 <em>올해 예상 수입</em>의 구간으로 떼어 두어야 합니다. 전년 대비 수입이 뛴 해에 5월 납부액이 예상을 크게 벗어나는 것은 거의 이 시차 때문입니다.`,
  };
}
