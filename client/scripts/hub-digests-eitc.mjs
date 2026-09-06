// Cross-band digests for /eitc and its three household pages.
//
// /eitc/:household is the one variant family that stayed self-canonical, because household type
// changes the statutory ceiling and the payout. That decision only holds up if the four pages
// actually reach different conclusions, so the hub gets the cross-household view (where the three
// curves sit relative to each other) and each household page gets the scan that only makes sense
// for that household - what its own bracket does against minimum-wage work, against the income tax
// its recipients already pay, and against the household boundary next to it.
//
// Comments stay ASCII: scripts/ feeds font-subset-config.mjs.
// Never write "자주 묻는" here - prerender.mjs skips its FAQ append when the body already has it.

import {
  calculateSalaryBreakdown,
  EITC_BRACKET_TABLE,
  eitcAmountFor,
  formatManWonValue,
  formatPercent,
  formatWon,
  INCOME_TAX_BRACKETS,
  wageConversion,
  weeklyHolidayPayForHours,
} from "./calc-engine.mjs";
import { MIN_WAGE_HOURLY_2026 } from "./hub-digests.mjs";

const won = (value) => formatWon(value);
const manWon = (value) => `${formatManWonValue(value)}원`;
const pct = (value, digits = 1) => formatPercent(value, digits);
const salaryOf = (grossAnnual) =>
  calculateSalaryBreakdown({
    grossAnnual,
    nonTaxableMonthly: 200_000,
    dependents: 1,
    children: 0,
    retirementIncluded: false,
  });
const marginalRateOf = (grossAnnual) => {
  const { taxableBase } = salaryOf(grossAnnual);
  return INCOME_TAX_BRACKETS.find((bracket) => taxableBase <= bracket.limit).rate * 1.1;
};

const SINGLE = EITC_BRACKET_TABLE.single;
const SINGLE_INCOME = EITC_BRACKET_TABLE["single-income"];
const DOUBLE_INCOME = EITC_BRACKET_TABLE["double-income"];
const HOUSEHOLDS = Object.entries(EITC_BRACKET_TABLE);

// Full-time minimum wage, used as the yardstick every household page is measured against.
const MIN_WAGE_ANNUAL = wageConversion(MIN_WAGE_HOURLY_2026).annualTotal;

const phaseInSlope = (bracket) => bracket.maxAmount / bracket.phaseInEnd;
const phaseOutSlope = (bracket) => bracket.maxAmount / (bracket.phaseOutEnd - bracket.plateauEnd);
const perTenThousand = (slope) => Math.round(slope * 10_000);

// The scan that produced the finding below: the single-household curve is above the single-income
// curve at very low incomes, because its phase-in slope is steeper. Find where that stops.
function singleOvertakesSingleIncomeUpTo() {
  let last = 0;
  for (let income = 0; income <= 4_000_000; income += 10_000) {
    if (eitcAmountFor(income, SINGLE) > eitcAmountFor(income, SINGLE_INCOME)) last = income;
  }
  return last;
}

// =========================
// /eitc hub - the three curves side by side
// =========================

export function eitcCurveShapeDigest() {
  const rows = HOUSEHOLDS.map(([slug, bracket]) => ({
    slug,
    bracket,
    inSlope: phaseInSlope(bracket),
    outSlope: phaseOutSlope(bracket),
    plateauWidth: bracket.plateauEnd - bracket.phaseInEnd,
    phaseOutWidth: bracket.phaseOutEnd - bracket.plateauEnd,
  }));
  const steepest = rows.reduce((max, row) => (row.outSlope > max.outSlope ? row : max), rows[0]);
  const gentlest = rows.reduce((min, row) => (row.outSlope < min.outSlope ? row : min), rows[0]);
  const overtakeLimit = singleOvertakesSingleIncomeUpTo();
  const overtakeGap =
    eitcAmountFor(overtakeLimit, SINGLE) - eitcAmountFor(overtakeLimit, SINGLE_INCOME);

  return {
    h2: "세 가구 유형의 곡선은 딱 한 구간에서만 뒤집힌다",
    body: [
      `가구 유형이 바뀌면 소득 상한과 최대 지급액이 함께 움직이므로, 세 유형을 같은 소득 축 위에 올려놓고 기울기를 재면 "어느 유형이 유리한가"라는 질문에 구간별로 다른 답이 나옵니다. 아래 기울기는 조세특례제한법 산식에서 파생한 값으로, 총급여 1만원이 지급액을 얼마나 움직이는지를 뜻합니다.`,
    ],
    blocks: [
      {
        h3: `점증 기울기는 세 유형이 사실상 같다 — 총급여 1만원당 ${perTenThousand(gentlest.inSlope) === perTenThousand(steepest.inSlope) ? won(perTenThousand(rows[0].inSlope)) : `${won(Math.min(...rows.map((row) => perTenThousand(row.inSlope))))}~${won(Math.max(...rows.map((row) => perTenThousand(row.inSlope))))}`}`,
        body: [
          `${rows
            .map((row) => `${row.bracket.label}는 ${pct(row.inSlope, 2)}(1만원당 ${won(perTenThousand(row.inSlope))})`)
            .join(", ")}입니다. 세 값이 소수점 아래에서만 갈리는데, 최대액과 점증 구간 끝이 거의 같은 비율로 설계돼 있기 때문입니다. 그래서 <strong>점증 구간에 있는 한</strong> 가구 유형은 결론을 거의 바꾸지 못하고, 일을 늘렸을 때 붙는 금액이 유형과 무관하게 비슷합니다.`,
        ],
      },
      {
        h3: `점감 기울기는 갈린다 — ${steepest.bracket.label}가 1만원당 ${won(perTenThousand(steepest.outSlope))}로 가장 가파르다`,
        body: [
          `${rows
            .map((row) => `${row.bracket.label}는 ${pct(row.outSlope, 2)}(1만원당 ${won(perTenThousand(row.outSlope))})`)
            .join(", ")}입니다. ${steepest.bracket.label}의 점감 폭이 ${won(steepest.phaseOutWidth)}으로 최대액 ${won(steepest.bracket.maxAmount)}을 짧은 거리에서 소진해야 하는 반면, ${gentlest.bracket.label}는 ${won(gentlest.phaseOutWidth)}에 걸쳐 천천히 줄기 때문입니다. 그래서 점감 구간에 들어선 뒤로는 <strong>같은 소득 증가가 유형마다 다른 크기로 장려금을 깎습니다</strong>.`,
        ],
      },
      {
        h3: `그 기울기 차이 때문에 총급여 ${won(overtakeLimit)} 이하에서는 단독 가구가 홑벌이보다 많이 받는다`,
        body: [
          `점증 기울기가 단독 ${pct(phaseInSlope(SINGLE), 2)}, 홑벌이 ${pct(phaseInSlope(SINGLE_INCOME), 2)}로 단독 쪽이 근소하게 가파릅니다. 소득 축을 1만원 단위로 훑으면 총급여 ${won(overtakeLimit)}까지는 단독 가구의 지급액이 홑벌이보다 큽니다 — 그 지점에서 ${won(eitcAmountFor(overtakeLimit, SINGLE))} 대 ${won(eitcAmountFor(overtakeLimit, SINGLE_INCOME))}, 차이 ${won(overtakeGap)}입니다. "가구가 커질수록 항상 유리하다"는 통념이 성립하지 않는 유일한 구간이며, 금액은 작지만 순서가 실제로 뒤집힙니다.`,
        ],
      },
      {
        h3: "그래서 유형보다 구간이 먼저다 — 평탄 구간 폭이 유형마다 1.8배 차이 난다",
        body: [
          `최대액을 그대로 받는 평탄 구간은 ${rows.map((row) => `${row.bracket.label} ${won(row.plateauWidth)}`).join(", ")}입니다. 폭이 좁을수록 소득이 조금만 움직여도 최대액에서 밀려나므로, 단독 가구는 총급여 200만원 차이로도 결론이 바뀌고 맞벌이 가구는 같은 200만원에 거의 영향을 받지 않습니다. 본인 유형을 확인하는 것보다 <strong>본인 총급여가 어느 구간에 있는지</strong>를 먼저 보아야 하는 이유입니다.`,
        ],
      },
    ],
    table: {
      head: ["가구 유형", "점증 기울기(1만원당)", "평탄 구간 폭", "점감 기울기(1만원당)", "점감 구간 폭", "최대 지급액"],
      rows: rows.map((row) => ({
        highlight: row.slug === steepest.slug,
        cells: [
          row.bracket.label,
          `${pct(row.inSlope, 2)} (${won(perTenThousand(row.inSlope))})`,
          won(row.plateauWidth),
          `${pct(row.outSlope, 2)} (${won(perTenThousand(row.outSlope))})`,
          won(row.phaseOutWidth),
          `<strong>${won(row.bracket.maxAmount)}</strong>`,
        ],
      })),
    },
    tableNote: `기울기는 조세특례제한법 산식의 구간 정의에서 직접 파생한 값이며, 국세청 산정표의 구간 단위·단수 조정에 따라 실제 지급액은 소액 차이가 날 수 있습니다.`,
  };
}

export function eitcEffectiveRateDigest() {
  const rows = HOUSEHOLDS.map(([slug, bracket]) => {
    const middle = Math.floor((bracket.plateauEnd + bracket.phaseOutEnd) / 2);
    const marginal = marginalRateOf(middle);
    const outSlope = phaseOutSlope(bracket);
    return {
      slug,
      bracket,
      middle,
      marginal,
      outSlope,
      combined: marginal + outSlope,
      atCeiling: salaryOf(bracket.phaseOutEnd),
    };
  });
  const worst = rows.reduce((max, row) => (row.combined > max.combined ? row : max), rows[0]);
  const own = 30_000_000;
  const asSingleIncome = eitcAmountFor(own + 2_990_000, SINGLE_INCOME);
  const asDoubleIncome = eitcAmountFor(own + 3_010_000, DOUBLE_INCOME);

  return {
    h2: "점감 구간의 실질 한계세율은 어느 세율표에도 적혀 있지 않다",
    body: [
      `점감 구간에서 총급여가 1만원 늘면 소득세를 그만큼 더 내는 동시에 장려금이 줄어듭니다. 두 효과는 같은 방향으로 작동하므로 <strong>더해서</strong> 보아야 하고, 그 합이 그 구간에 있는 사람이 실제로 마주하는 한계 부담입니다. 아래 소득세 한계세율은 부양가족 1인·비과세 식대 월 ${won(200_000)} 기준으로 계산했습니다.`,
    ],
    blocks: [
      {
        h3: `${worst.bracket.label}의 점감 구간 실질 한계 부담은 ${pct(worst.combined, 2)}에 이른다`,
        body: [
          `${rows
            .map(
              (row) =>
                `${row.bracket.label}가 점감 구간 한가운데인 총급여 ${won(row.middle)}에 있으면 소득세 한계세율 ${pct(row.marginal, 1)}에 장려금 감소율 ${pct(row.outSlope, 2)}가 더해져 ${pct(row.combined, 2)}`,
            )
            .join(", ")}입니다. 소득세율표만 보면 6~15% 구간의 저소득 가구인데, 실제로는 <strong>중상위 구간에 해당하는 한계 부담</strong>을 지고 있습니다. 근로장려금이 근로 유인을 목적으로 하면서도 점감 구간에서는 정반대 방향으로 작동하는 이유가 여기 있습니다.`,
        ],
      },
      {
        h3: `배우자 총급여 ${won(3_000_000)} 경계에서 지급액이 ${won(asDoubleIncome - asSingleIncome)} 뛴다`,
        body: [
          `본인 총급여 ${won(own)}인 가구를 놓고 배우자 급여만 ${won(2_990_000)}에서 ${won(3_010_000)}으로 2만원 올려 보면, 가구 유형이 홑벌이에서 맞벌이로 바뀌면서 지급액이 ${won(asSingleIncome)}에서 ${won(asDoubleIncome)}이 됩니다. 홑벌이 상한 ${won(SINGLE_INCOME.phaseOutEnd)}을 넘어 0원이던 가구가 맞벌이 상한 ${won(DOUBLE_INCOME.phaseOutEnd)} 안으로 들어오기 때문입니다. 배우자가 2만원을 더 벌어 ${won(asDoubleIncome - asSingleIncome)}이 생기는 이 계단은 앞의 실질 한계 부담과 <strong>정확히 반대 방향</strong>으로 서 있습니다.`,
        ],
      },
      {
        h3: "장려금이 0이 되는 지점에서 소득세는 이미 시작돼 있다",
        body: [
          `${rows
            .map((row) => `${row.bracket.label}의 상한 총급여 ${won(row.bracket.phaseOutEnd)}에서 결정세액은 ${won(row.atCeiling.determinedTax)}`)
            .join(", ")}입니다. 즉 장려금이 사라지는 순간에도 이미 세금을 내고 있으므로, 두 제도 사이에 "아무것도 없는 구간"이 존재하지 않습니다. 지원이 끊기는 지점과 과세가 시작되는 지점이 겹쳐 있다는 뜻이며, 이 겹침 구간이 앞서 계산한 실질 한계 부담을 만듭니다.`,
        ],
      },
      {
        h3: `재산 절벽의 깊이는 유형에 따라 ${(DOUBLE_INCOME.maxAmount / SINGLE.maxAmount).toFixed(1)}배 차이가 난다`,
        body: [
          `가구원 전체 재산 합계가 1억7,000만원 이상이면 산정액의 50%만, 2억4,000만원 이상이면 0원이 지급됩니다. 최대액을 받던 가구 기준으로 1억7,000만원 경계에서 잃는 금액은 ${HOUSEHOLDS.map(([, bracket]) => `${bracket.label} ${won(Math.floor(bracket.maxAmount / 2))}`).join(", ")}이고, 2억4,000만원 경계에서는 최대액 전액입니다. 재산에는 전세보증금이 포함되고 부채는 차감되지 않으므로, 소득 요건을 여유 있게 통과한 가구가 이 두 지점에서 탈락하는 일이 흔합니다.`,
        ],
      },
    ],
    callout: `<strong>신청 시기와 감액</strong> — 정기 신청은 5월, 근로소득자 반기 신청은 상반기분 9월·하반기분 다음 해 3월입니다. 기한 후 신청은 지급액이 5% 감액되므로 최대액을 받는 가구 기준으로 ${HOUSEHOLDS.map(([, bracket]) => `${bracket.label} ${won(Math.floor(bracket.maxAmount * 0.05))}`).join(", ")}을 잃습니다. 위 금액은 조세특례제한법 산식 기준 간이 추정치이며, 재산 평가 기준일은 전년도 6월 1일입니다.`,
  };
}

// =========================
// /eitc/single - measured against part-time minimum-wage work
// =========================

export function eitcSinglePartTimeDigest() {
  const hoursGrid = [10, 13, 14, 15, 20, 25];
  const rows = hoursGrid.map((hours) => {
    const pay = weeklyHolidayPayForHours(MIN_WAGE_HOURLY_2026, hours);
    const annual = pay.estimatedMonthlyPay * 12;
    return {
      hours,
      monthly: pay.estimatedMonthlyPay,
      annual,
      amount: eitcAmountFor(annual, SINGLE),
      zone:
        annual < SINGLE.phaseInEnd ? "점증" : annual <= SINGLE.plateauEnd ? "평탄(최대)" : "점감",
    };
  });
  const before = rows.find((row) => row.hours === 14);
  const after = rows.find((row) => row.hours === 15);
  const benefitDrop = before.amount - after.amount;
  const wageGain = after.annual - before.annual;

  return {
    h2: "주휴수당이 켜지는 순간 이 가구는 최대액 구간에서 밀려난다",
    body: [
      `단독 가구의 평탄 구간은 총급여 ${won(SINGLE.phaseInEnd)}~${won(SINGLE.plateauEnd)}, 월로 환산하면 ${won(Math.floor(SINGLE.phaseInEnd / 12))}~${won(Math.floor(SINGLE.plateauEnd / 12))}입니다. 2026년 최저시급 ${won(MIN_WAGE_HOURLY_2026)}으로 주 몇 시간을 일해야 그 구간에 들어가는지 계산해 보면, 주휴수당 발생 요건인 주 15시간이 정확히 경계에 걸려 있습니다.`,
    ],
    blocks: [
      {
        h3: `주 14시간에서 15시간으로 한 시간 늘리면 장려금이 ${won(benefitDrop)} 줄어든다`,
        body: [
          `주 14시간은 주휴수당이 발생하지 않아 월 ${won(before.monthly)}, 연 ${won(before.annual)}으로 평탄 구간 안에 있어 최대액 ${won(before.amount)}을 받습니다. 그런데 주 15시간이 되면 주휴수당 3시간분이 붙어 월 ${won(after.monthly)}, 연 ${won(after.annual)}으로 점감 구간에 들어가 ${won(after.amount)}으로 떨어집니다. 임금은 연 ${won(wageGain)} 늘고 장려금은 ${won(benefitDrop)} 줄어 합계로는 ${won(wageGain - benefitDrop)} 이득이지만, <strong>주휴수당의 ${pct(benefitDrop / wageGain, 1)}가 장려금 감소로 상쇄됩니다</strong>.`,
        ],
      },
      {
        h3: `그래서 최대액을 받는 근무 시간대는 주 15시간 <em>미만</em>에 몰려 있다`,
        body: [
          `표를 보면 평탄 구간에 해당하는 것은 ${rows
            .filter((row) => row.zone === "평탄(최대)")
            .map((row) => `주 ${row.hours}시간`)
            .join("·")}이고, 주 15시간부터는 전부 점감입니다. 단독 가구의 평탄 구간 폭이 ${won(SINGLE.plateauEnd - SINGLE.phaseInEnd)}으로 세 유형 중 가장 좁기 때문에 생기는 현상이며, 이 제도가 겨냥한 소득대가 <strong>주휴수당이 발생하지 않는 초단시간 근로</strong>와 겹쳐 있다는 뜻입니다.`,
        ],
      },
      {
        h3: `최저임금으로 전일제를 일하면 단독 가구는 대상에서 벗어난다`,
        body: [
          `최저시급 ${won(MIN_WAGE_HOURLY_2026)}으로 주 40시간을 일하면 주휴수당을 포함해 연 ${won(MIN_WAGE_ANNUAL)}입니다. 단독 가구의 지급 상한 총급여는 ${won(SINGLE.phaseOutEnd)}이므로 이 연봉은 상한을 ${won(MIN_WAGE_ANNUAL - SINGLE.phaseOutEnd)} 넘어서고, 지급액은 0원입니다. 반면 같은 연봉이 홑벌이 가구라면 ${won(eitcAmountFor(MIN_WAGE_ANNUAL, SINGLE_INCOME))}을 받습니다. 즉 단독 가구에게 이 제도는 <strong>전일제 최저임금 아래</strong>에서만 작동합니다.`,
        ],
      },
      {
        h3: "재산 요건에서는 원룸 보증금이 소득보다 먼저 걸린다",
        body: [
          `재산 1억7,000만원 이상이면 산정액의 50%만 지급되므로, 단독 가구가 최대액을 받던 상황이라면 ${won(Math.floor(SINGLE.maxAmount / 2))}을 잃습니다. 재산에는 전세보증금이 그대로 들어가고 부채는 차감되지 않기 때문에, 연 소득이 ${won(SINGLE.plateauEnd)}뿐인 1인 가구도 보증금 1억7,000만원짜리 오피스텔에 살면 절반만 받습니다. 소득 요건은 여유 있게 통과하는데 재산에서 걸리는 전형적인 경우입니다.`,
        ],
      },
    ],
    table: {
      head: ["주 소정근로", "월 급여(주휴 포함)", "연간 총급여", "구간", "예상 근로장려금"],
      rows: rows.map((row) => ({
        highlight: row.hours === 14 || row.hours === 15,
        cells: [
          `주 ${row.hours}시간`,
          won(row.monthly),
          won(row.annual),
          row.zone,
          `<strong>${won(row.amount)}</strong>`,
        ],
      })),
    },
    tableNote: `2026년 최저시급 ${won(MIN_WAGE_HOURLY_2026)}·월 4.345주·개근 기준이며, 주 15시간 미만은 근로기준법 제55조의 주휴수당 요건을 충족하지 않아 주휴분이 빠져 있습니다. 강조한 두 행이 주휴수당이 켜지는 경계입니다.`,
  };
}

export function eitcSingleMarginDigest() {
  const inSlope = phaseInSlope(SINGLE);
  const outSlope = phaseOutSlope(SINGLE);
  const turningPoint = SINGLE.plateauEnd;
  const midPhaseOut = Math.floor((SINGLE.plateauEnd + SINGLE.phaseOutEnd) / 2);
  const marginal = marginalRateOf(midPhaseOut);
  const atCeiling = salaryOf(SINGLE.phaseOutEnd);
  const asSingleIncome = eitcAmountFor(20_000_000, SINGLE_INCOME);
  const asSingle = eitcAmountFor(20_000_000, SINGLE);

  return {
    h2: `총급여 ${won(turningPoint)}에서 1만원의 부호가 뒤집힌다`,
    body: [
      `단독 가구의 산식은 총급여 ${won(SINGLE.phaseInEnd)}까지 점증, ${won(SINGLE.plateauEnd)}까지 평탄, ${won(SINGLE.phaseOutEnd)}에서 0원입니다. 그래서 "1만원을 더 벌면 장려금이 어떻게 되는가"라는 질문의 답이 구간마다 다르고, 부호까지 바뀝니다.`,
    ],
    blocks: [
      {
        h3: `1만원의 값어치가 +${won(perTenThousand(inSlope))}에서 −${won(perTenThousand(outSlope))}로 바뀐다`,
        body: [
          `점증 구간에서는 총급여 1만원이 장려금을 ${won(perTenThousand(inSlope))} 늘리지만, ${won(turningPoint)}을 넘어선 뒤로는 같은 1만원이 ${won(perTenThousand(outSlope))}을 깎습니다. 두 값의 부호가 반대라 <strong>평탄 구간의 양 끝이 이 계산기에서 가장 유리한 지점</strong>이고, 그 사이 ${won(SINGLE.plateauEnd - SINGLE.phaseInEnd)} 구간에서만 소득이 늘어도 장려금이 그대로입니다.`,
        ],
      },
      {
        h3: `점감 구간에서는 소득세와 합쳐 실질 ${pct(marginal + outSlope, 2)}를 부담한다`,
        body: [
          `점감 구간 한가운데인 총급여 ${won(midPhaseOut)}에서 소득세 한계세율은 ${pct(marginal, 1)}(지방소득세 포함)입니다. 여기에 장려금 감소율 ${pct(outSlope, 2)}를 더하면 ${pct(marginal + outSlope, 2)}로, 세율표상으로는 가장 낮은 구간에 있는 사람이 실제로는 그 세 배 가까운 한계 부담을 집니다. 상한 총급여 ${won(SINGLE.phaseOutEnd)}에 이르면 장려금은 0원이 되는데 결정세액은 ${won(atCeiling.determinedTax)}이 남아 있습니다.`,
        ],
      },
      {
        h3: `가구 유형이 바뀌면 같은 총급여에서 ${won(asSingleIncome - asSingle)}이 달라진다`,
        body: [
          `총급여 ${won(20_000_000)}인 사람이 단독 가구라면 ${won(asSingle)}, 홑벌이 가구라면 ${won(asSingleIncome)}을 받습니다. 차이가 ${won(asSingleIncome - asSingle)}인데, 단독 가구는 이미 점감 구간의 끝자락(상한 ${won(SINGLE.phaseOutEnd)})에 있는 반면 홑벌이는 아직 점감 초반이기 때문입니다. 그래서 70세 이상 직계존속을 부양하고 있는지, 부양자녀가 있는지를 확인하는 일이 <strong>소득을 조절하는 것보다 훨씬 큰 금액</strong>을 좌우합니다.`,
        ],
      },
      {
        h3: "이 페이지의 숫자는 근로장려금만이고 자녀장려금은 정의상 0원이다",
        body: [
          `자녀장려금은 18세 미만 부양자녀가 있어야 받는데, 부양자녀가 있으면 단독 가구가 아니라 홑벌이 가구로 분류됩니다. 그래서 단독 가구 페이지의 금액에는 자녀장려금이 더해질 여지가 없고, 표의 값이 곧 실제 입금액입니다. 반대로 홑벌이·맞벌이 페이지의 금액은 자녀 1인당 최대 100만원이 별도로 얹히므로, 세 페이지의 금액을 나란히 비교할 때는 이 차이를 먼저 감안해야 합니다.`,
        ],
      },
    ],
    callout: `<strong>단독 가구 판정</strong> — 배우자·부양자녀·70세 이상 직계존속이 모두 없어야 단독 가구이며, 연령 요건은 폐지되어 20대도 신청할 수 있습니다. 위 금액은 조세특례제한법 산식 기준 간이 추정치로 국세청 산정표의 구간 단위·단수 조정에 따라 소액 차이가 날 수 있습니다.`,
  };
}

// =========================
// /eitc/single-income - two benefits taper together
// =========================

const CHILD_BENEFIT_MAX = 1_000_000;
const CHILD_BENEFIT_MIN = 500_000;
const CHILD_PHASE_OUT_START = 21_000_000;
const CHILD_PHASE_OUT_END = 70_000_000;

export function eitcSingleIncomeDoubleTaperDigest() {
  const workSlope = phaseOutSlope(SINGLE_INCOME);
  const childSlope =
    (CHILD_BENEFIT_MAX - CHILD_BENEFIT_MIN) / (CHILD_PHASE_OUT_END - CHILD_PHASE_OUT_START);
  const combined = workSlope + childSlope;
  const grid = [14_000_000, 21_000_000, 25_000_000, 30_000_000, 32_000_000];
  const rows = grid.map((income) => ({
    income,
    work: eitcAmountFor(income, SINGLE_INCOME),
    child:
      income <= CHILD_PHASE_OUT_START
        ? CHILD_BENEFIT_MAX
        : Math.max(
            CHILD_BENEFIT_MIN,
            Math.floor(
              CHILD_BENEFIT_MAX - (income - CHILD_PHASE_OUT_START) * childSlope,
            ),
          ),
  }));
  const atStart = rows.find((row) => row.income === CHILD_PHASE_OUT_START);
  const marginal = marginalRateOf(CHILD_PHASE_OUT_START);

  return {
    h2: `총급여 ${won(CHILD_PHASE_OUT_START)}에서 두 장려금이 동시에 줄기 시작한다`,
    body: [
      `홑벌이 가구는 근로장려금과 자녀장려금을 중복해서 받을 수 있고, 두 제도의 점감 시작점이 서로 다릅니다. 근로장려금은 총급여 ${won(SINGLE_INCOME.plateauEnd)}부터, 자녀장려금은 ${won(CHILD_PHASE_OUT_START)}부터 줄어들기 시작합니다. 시작점이 다르기 때문에 ${won(CHILD_PHASE_OUT_START)}을 지나면 <strong>두 감소율이 겹칩니다</strong>. 아래 자녀장려금은 부양자녀 1명 기준입니다.`,
    ],
    blocks: [
      {
        h3: `겹치는 구간의 감소율은 ${pct(combined, 2)} — 1만원 더 벌면 ${won(Math.round(combined * 10_000))}이 사라진다`,
        body: [
          `근로장려금의 점감 기울기는 ${pct(workSlope, 2)}로 세 가구 유형 중 가장 가파르고, 자녀장려금은 ${won(CHILD_BENEFIT_MAX)}에서 ${won(CHILD_BENEFIT_MIN)}까지 ${won(CHILD_PHASE_OUT_END - CHILD_PHASE_OUT_START)}에 걸쳐 줄어드니 ${pct(childSlope, 2)}입니다. 그래서 둘을 더하면 ${pct(combined, 2)}이고, 여기에 소득세 한계세율 ${pct(marginal, 1)}까지 얹으면 ${pct(combined + marginal, 2)}가 됩니다. 이것이 총급여 ${won(CHILD_PHASE_OUT_START)}인 홑벌이 가구가 실제로 마주하는 한계 부담인데, 어느 세율표에도 이 숫자는 적혀 있지 않습니다.`,
        ],
      },
      {
        h3: `그 지점의 실제 입금액은 근로장려금 ${won(atStart.work)}에 자녀장려금 ${won(atStart.child)}을 더한 ${won(atStart.work + atStart.child)}이다`,
        body: [
          `근로장려금 표만 보면 총급여 ${won(CHILD_PHASE_OUT_START)}에서 ${won(atStart.work)}이지만, 부양자녀가 한 명 있으면 자녀장려금 ${won(atStart.child)}이 별도로 지급되어 합계가 ${won(atStart.work + atStart.child)}입니다. 자녀가 두 명이면 ${won(atStart.work + atStart.child * 2)}입니다. 그래서 이 페이지의 표는 실제 수령액의 <strong>일부만</strong> 보여 주는 셈이고, 두 제도를 함께 계산해야 비로소 결론이 나옵니다.`,
        ],
      },
      {
        h3: `부양자녀의 아르바이트 소득 100만원이 가구 유형을 바꿔 ${won(eitcAmountFor(20_000_000, SINGLE_INCOME) - eitcAmountFor(20_000_000, SINGLE))}을 지운다`,
        body: [
          `부양자녀는 18세 미만이면서 연간 소득금액 100만원 이하여야 인정됩니다. 자녀가 그 선을 넘으면 부양자녀에서 빠지기 때문에, 다른 부양가족이 없다면 가구 유형 자체가 단독으로 내려갑니다. 총급여 ${won(20_000_000)}인 가구를 예로 들면 홑벌이 기준 ${won(eitcAmountFor(20_000_000, SINGLE_INCOME))}이 단독 기준 ${won(eitcAmountFor(20_000_000, SINGLE))}으로 줄어 ${won(eitcAmountFor(20_000_000, SINGLE_INCOME) - eitcAmountFor(20_000_000, SINGLE))}이 사라지고, 자녀장려금까지 함께 없어집니다.`,
        ],
      },
      {
        h3: "최저임금 전일제 홑벌이 가구는 여전히 대상이다",
        body: [
          `최저시급 ${won(MIN_WAGE_HOURLY_2026)}으로 주 40시간을 일하면 연 ${won(MIN_WAGE_ANNUAL)}입니다. 홑벌이 가구의 상한은 ${won(SINGLE_INCOME.phaseOutEnd)}이라 이 연봉은 아직 점감 구간 안이고, 그래서 근로장려금 ${won(eitcAmountFor(MIN_WAGE_ANNUAL, SINGLE_INCOME))}을 받습니다. 반면 같은 연봉이 단독 가구라면 0원이므로, <strong>배우자나 부양가족의 존재가 최저임금 전일제 근로자의 수급 여부를 가릅니다</strong>.`,
        ],
      },
    ],
    table: {
      head: ["연간 총급여", "근로장려금", "자녀장려금(자녀 1명)", "합계"],
      rows: rows.map((row) => ({
        highlight: row.income === CHILD_PHASE_OUT_START,
        cells: [
          won(row.income),
          won(row.work),
          won(row.child),
          `<strong>${won(row.work + row.child)}</strong>`,
        ],
      })),
    },
    tableNote: `자녀장려금은 부양자녀 1인당 총급여 ${won(CHILD_PHASE_OUT_START)}까지 ${won(CHILD_BENEFIT_MAX)} 전액, 이후 ${won(CHILD_PHASE_OUT_END)}까지 점감해 최소 ${won(CHILD_BENEFIT_MIN)}이 지급되는 구조를 선형으로 환산한 값입니다. 자녀장려금을 받으면 자녀세액공제액에서 차감 조정이 있으므로 연말정산 결과와 함께 보아야 정확합니다.`,
  };
}

export function eitcSingleIncomeBoundaryDigest() {
  const own = 20_000_000;
  const asSingleIncome = eitcAmountFor(own + 2_990_000, SINGLE_INCOME);
  const asDoubleIncome = eitcAmountFor(own + 3_010_000, DOUBLE_INCOME);
  const plateauMonthlyLow = Math.floor(SINGLE_INCOME.phaseInEnd / 12);
  const plateauMonthlyHigh = Math.floor(SINGLE_INCOME.plateauEnd / 12);
  const plateauHours = weeklyHolidayPayForHours(MIN_WAGE_HOURLY_2026, 20);
  const atCeiling = salaryOf(SINGLE_INCOME.phaseOutEnd);

  return {
    h2: `배우자 급여 ${won(3_000_000)}이 이 페이지와 옆 페이지를 가른다`,
    body: [
      `홑벌이 가구는 ① 배우자 총급여가 ${won(3_000_000)} 미만이거나 ② 배우자 없이 부양자녀 또는 70세 이상 직계존속이 있는 가구입니다. 첫 번째 정의는 배우자 급여 한 줄에 걸려 있어, 그 금액이 조금만 움직이면 판정도 지급액도 함께 바뀝니다.`,
    ],
    blocks: [
      {
        h3: `배우자 급여 2만원 차이가 지급액을 ${won(asDoubleIncome - asSingleIncome)} 바꾼다`,
        body: [
          `본인 총급여 ${won(own)}인 가구에서 배우자 급여가 ${won(2_990_000)}이면 홑벌이로 판정되어 합산 ${won(own + 2_990_000)} 기준 ${won(asSingleIncome)}, ${won(3_010_000)}이면 맞벌이로 판정되어 합산 ${won(own + 3_010_000)} 기준 ${won(asDoubleIncome)}입니다. 상한이 ${won(SINGLE_INCOME.phaseOutEnd)}에서 ${won(DOUBLE_INCOME.phaseOutEnd)}으로 올라가고 점감 기울기도 완만해지기 때문입니다. 그래서 배우자가 2만원을 더 벌었을 뿐인데 ${won(asDoubleIncome - asSingleIncome)}이 늘어납니다. 경계 근처라면 <strong>두 유형을 모두 계산해 비교</strong>해야 하는 이유입니다.`,
        ],
      },
      {
        h3: `평탄 구간은 월 ${won(plateauMonthlyLow)}~${won(plateauMonthlyHigh)} — 최저임금 주 20시간 언저리다`,
        body: [
          `홑벌이 가구가 최대액 ${won(SINGLE_INCOME.maxAmount)}을 받는 총급여는 ${won(SINGLE_INCOME.phaseInEnd)}~${won(SINGLE_INCOME.plateauEnd)}, 월로는 ${won(plateauMonthlyLow)}~${won(plateauMonthlyHigh)}입니다. 최저시급으로 주 20시간을 일하면 주휴수당을 포함해 월 ${won(plateauHours.estimatedMonthlyPay)}이므로 이 구간 안에 들어옵니다. 단독 가구의 평탄 구간이 주 15시간 미만에 몰려 있던 것과 달리, 홑벌이 가구의 최대액 구간은 <strong>주휴수당이 발생하는 시간대</strong>와 겹칩니다.`,
        ],
      },
      {
        h3: "한부모 가구도 같은 표를 쓰지만 배우자 조건은 처음부터 적용되지 않는다",
        body: [
          `배우자가 없어도 부양자녀나 70세 이상 직계존속이 있으면 홑벌이입니다. 이 경로로 들어온 가구에는 배우자 급여 ${won(3_000_000)} 경계가 애초에 없기 때문에, 위에서 계산한 ${won(asDoubleIncome - asSingleIncome)}짜리 계단도 존재하지 않습니다. 대신 부양자녀의 소득이나 직계존속의 나이가 바뀌면 단독 가구로 내려가는 다른 계단이 생깁니다 — 같은 표를 쓰는 두 종류의 가구가 서로 다른 위험에 노출돼 있습니다.`,
        ],
      },
      {
        h3: `상한 ${won(SINGLE_INCOME.phaseOutEnd)}에서도 결정세액 ${won(atCeiling.determinedTax)}은 남는다`,
        body: [
          `홑벌이 가구의 지급 상한 총급여 ${won(SINGLE_INCOME.phaseOutEnd)}에서 근로장려금은 0원이 되지만, 이 연봉의 결정세액은 부양가족 1인 기준으로 ${won(atCeiling.determinedTax)}, 월 실수령은 ${won(atCeiling.monthlyNet)}입니다. 장려금이 끊긴 자리에 세금은 그대로 남기 때문에, 상한을 조금 넘긴 가구는 지원도 감면도 없는 구간에 놓입니다. 다만 이 연봉대에서는 연말정산 공제 항목이 실제로 작동하기 시작하므로, 장려금 대신 <strong>공제 쪽으로 전략을 옮길 수 있는 지점</strong>이기도 합니다.`,
        ],
      },
    ],
    callout: `<strong>중복 신청 주의</strong> — 같은 부양자녀를 다른 가구가 함께 올리면 양쪽 모두 정정 대상이 됩니다. 연말정산 인적공제와 근로장려금 가구원 판정에 같은 자녀를 중복으로 올리지 않았는지 확인하세요. 위 금액은 조세특례제한법 산식 기준 간이 추정치입니다.`,
  };
}

// =========================
// /eitc/double-income - the biggest maximum, reached by the fewest households
// =========================

export function eitcDoubleIncomeCombinedDigest() {
  const perPerson = [1_500_000, 1_800_000, 2_200_000];
  const rows = perPerson.map((monthly) => {
    const combined = monthly * 2 * 12;
    return {
      monthly,
      combined,
      amount: eitcAmountFor(combined, DOUBLE_INCOME),
      asIfSingleView: eitcAmountFor(monthly * 12, DOUBLE_INCOME),
    };
  });
  const bothMinWage = MIN_WAGE_ANNUAL * 2;
  const sample = rows[0];

  return {
    h2: "최대액은 가장 크지만 합산 판정이 그 이점을 대부분 되돌린다",
    body: [
      `맞벌이 가구의 최대 지급액 ${won(DOUBLE_INCOME.maxAmount)}은 세 유형 중 가장 큽니다. 그런데 소득 판정이 <strong>부부 합산</strong>이라, 본인 급여만 보고 표에서 행을 찾으면 실제보다 훨씬 큰 금액을 기대하게 됩니다. 아래는 부부가 같은 금액을 벌 때를 기준으로 두 읽기 방식을 나란히 놓은 결과입니다.`,
    ],
    blocks: [
      {
        h3: `각자 월 ${won(sample.monthly)}을 벌면 표에서 ${won(sample.asIfSingleView)}처럼 보이지만 실제로는 ${won(sample.amount)}이다`,
        body: [
          `부부가 각각 월 ${won(sample.monthly)}씩 벌면 1인당 연 ${won(sample.monthly * 12)}, 합산 ${won(sample.combined)}입니다. 본인 급여 ${won(sample.monthly * 12)}으로 표를 읽으면 ${won(sample.asIfSingleView)}이 나오지만 판정은 합산으로 하므로 실제 산정액은 ${won(sample.amount)}, 차이가 ${won(sample.asIfSingleView - sample.amount)}입니다. 맞벌이 가구가 가장 많이 오해하는 지점이며, 표의 "연간 총급여" 열은 언제나 <strong>부부를 더한 금액</strong>입니다.`,
        ],
      },
      {
        h3: `부부가 모두 최저임금 전일제면 합산 ${won(bothMinWage)}으로 상한을 넘어 0원이 된다`,
        body: [
          `최저시급 ${won(MIN_WAGE_HOURLY_2026)}으로 주 40시간을 일하면 주휴수당 포함 연 ${won(MIN_WAGE_ANNUAL)}입니다. 부부가 모두 그렇게 일하면 합산 ${won(bothMinWage)}으로, 맞벌이 상한 ${won(DOUBLE_INCOME.phaseOutEnd)}을 ${won(bothMinWage - DOUBLE_INCOME.phaseOutEnd)} 넘어섭니다. 최대액이 가장 크다는 사실과 실제로 받을 확률이 가장 낮다는 사실이 <strong>동시에 성립</strong>하는 이유이며, 맞벌이 기준은 사실상 한쪽이 단시간 근로일 때를 겨냥하고 있습니다.`,
        ],
      },
      {
        h3: `그래서 배우자가 일을 줄이면 오히려 장려금이 사라질 수 있다`,
        body: [
          `합산 소득이 ${won(33_010_000)}인 맞벌이 가구는 ${won(eitcAmountFor(33_010_000, DOUBLE_INCOME))}을 받습니다. 그런데 배우자 급여가 ${won(3_000_000)} 아래로 떨어져 홑벌이로 재분류되면 상한이 ${won(SINGLE_INCOME.phaseOutEnd)}으로 내려가 합산 ${won(32_990_000)}만으로도 지급액이 ${won(eitcAmountFor(32_990_000, SINGLE_INCOME))}이 됩니다. 소득이 줄었는데 장려금까지 함께 사라지는 <strong>역전</strong>이며, 경계 근처에서는 배우자 근로시간 조정이 손해가 될 수 있습니다.`,
        ],
      },
      {
        h3: `평탄 구간은 부부 합산 ${won(DOUBLE_INCOME.phaseInEnd)}~${won(DOUBLE_INCOME.plateauEnd)}, 1인당 월 ${won(Math.floor(DOUBLE_INCOME.phaseInEnd / 24))}~${won(Math.floor(DOUBLE_INCOME.plateauEnd / 24))}이다`,
        body: [
          `최대액 ${won(DOUBLE_INCOME.maxAmount)}을 그대로 받는 구간은 합산 ${won(DOUBLE_INCOME.phaseInEnd)}~${won(DOUBLE_INCOME.plateauEnd)}이고, 부부가 반씩 벌었다면 1인당 월 ${won(Math.floor(DOUBLE_INCOME.phaseInEnd / 24))}~${won(Math.floor(DOUBLE_INCOME.plateauEnd / 24))}입니다. "맞벌이"라는 이름과 달리 이 구간은 두 사람 모두 단시간 근로에 해당하는 소득대입니다. 대신 평탄 구간 폭이 ${won(DOUBLE_INCOME.plateauEnd - DOUBLE_INCOME.phaseInEnd)}으로 세 유형 중 가장 넓어, 한 번 들어오면 소득이 움직여도 금액이 잘 흔들리지 않습니다.`,
        ],
      },
    ],
    table: {
      head: ["1인당 월 급여", "부부 합산 연 총급여", "본인 급여만으로 읽은 금액", "실제 산정액(합산)", "차이"],
      rows: rows.map((row) => ({
        highlight: row.amount === 0,
        cells: [
          won(row.monthly),
          won(row.combined),
          won(row.asIfSingleView),
          `<strong>${won(row.amount)}</strong>`,
          won(row.asIfSingleView - row.amount),
        ],
      })),
    },
    tableNote: `부부가 같은 금액을 번다고 가정한 값입니다. 실제로는 두 사람의 총급여를 더한 금액으로 구간을 정하므로, 한쪽에 소득이 몰려 있어도 합산액이 같으면 산정액도 같습니다.`,
  };
}

export function eitcDoubleIncomeJointTestDigest() {
  const midPhaseOut = Math.floor((DOUBLE_INCOME.plateauEnd + DOUBLE_INCOME.phaseOutEnd) / 2);
  const marginal = marginalRateOf(midPhaseOut);
  const outSlope = phaseOutSlope(DOUBLE_INCOME);
  const atCeiling = salaryOf(DOUBLE_INCOME.phaseOutEnd);
  const singleCombined = marginalRateOf(Math.floor((SINGLE.plateauEnd + SINGLE.phaseOutEnd) / 2)) + phaseOutSlope(SINGLE);

  return {
    h2: "합산되는 것은 소득만이 아니다",
    body: [
      `맞벌이 가구 판정에서 부부를 합쳐 보는 항목은 소득, 재산, 그리고 신청 자격입니다. 세 가지가 모두 합산이기 때문에 "각자 기준으로는 통과"라는 계산이 어느 항목에서도 성립하지 않습니다.`,
    ],
    blocks: [
      {
        h3: `재산 절벽의 깊이가 ${won(DOUBLE_INCOME.maxAmount)}으로 세 유형 중 가장 크다`,
        body: [
          `재산 1억7,000만원 이상이면 산정액의 50%, 2억4,000만원 이상이면 0원입니다. 최대액을 받던 맞벌이 가구라면 첫 경계에서 ${won(Math.floor(DOUBLE_INCOME.maxAmount / 2))}, 두 번째 경계에서 ${won(DOUBLE_INCOME.maxAmount)}을 잃습니다. 최대액이 가장 크다는 사실이 여기서는 반대로 작동하며, 재산도 가구원 전체를 합산하므로 부부가 각각 자동차를 보유하면 소득 요건을 통과하고도 이 지점에서 걸리는 경우가 많습니다.`,
        ],
      },
      {
        h3: `점감 구간의 실질 한계 부담은 ${pct(marginal + outSlope, 2)}로 단독 가구의 ${pct(singleCombined, 2)}보다 높다`,
        body: [
          `점감 구간 한가운데인 합산 총급여 ${won(midPhaseOut)}에서 소득세 한계세율은 ${pct(marginal, 1)}입니다. 장려금 감소율 ${pct(outSlope, 2)}를 더하면 ${pct(marginal + outSlope, 2)}인데, 장려금 감소율 자체는 세 유형 중 가장 완만한데도 합계는 가장 높습니다. 합산 소득이 커서 소득세 구간이 이미 한 단계 올라가 있기 때문이며, 그래서 맞벌이 가구의 점감 구간은 <strong>세금 쪽이 주도</strong>합니다.`,
        ],
      },
      {
        h3: "신청은 한 사람만 하고 누가 하든 금액은 같다",
        body: [
          `근로장려금은 가구 단위 제도이므로 부부가 각각 신청해도 한 건만 인정되고, 국세청이 한 명을 신청자로 확정합니다. 산정액은 합산 소득으로 계산되므로 신청자가 누구든 동일하며, 지급 계좌와 안내 통지만 신청자 기준으로 처리됩니다. 그래서 "소득이 적은 쪽이 신청하면 더 받는다"는 식의 조정은 <strong>효과가 없습니다</strong>.`,
        ],
      },
      {
        h3: `상한 ${won(DOUBLE_INCOME.phaseOutEnd)}에서는 결정세액이 ${won(atCeiling.determinedTax)}까지 올라와 있다`,
        body: [
          `맞벌이 가구의 지급 상한인 합산 총급여 ${won(DOUBLE_INCOME.phaseOutEnd)}을 한 사람의 연봉으로 놓고 계산하면 결정세액이 ${won(atCeiling.determinedTax)}, 월 실수령이 ${won(atCeiling.monthlyNet)}입니다. 단독 가구 상한에서의 결정세액이 ${won(salaryOf(SINGLE.phaseOutEnd).determinedTax)}이었던 것과 비교하면 ${(atCeiling.determinedTax / salaryOf(SINGLE.phaseOutEnd).determinedTax).toFixed(0)}배입니다. 지급 상한이 높다는 것은 그만큼 <strong>이미 세금을 내고 있는 구간까지 제도가 들어와 있다</strong>는 뜻이고, 그 구간에서는 연말정산 공제가 장려금보다 큰 금액을 움직입니다.`,
        ],
      },
    ],
    callout: `<strong>맞벌이 판정</strong> — 부부 모두 총급여가 ${won(3_000_000)} 이상이어야 맞벌이이며, 한쪽이라도 미만이면 홑벌이로 분류됩니다. 재산 평가 기준일은 전년도 6월 1일이고 부채는 차감되지 않습니다. 위 금액은 조세특례제한법 산식 기준 간이 추정치입니다.`,
  };
}
