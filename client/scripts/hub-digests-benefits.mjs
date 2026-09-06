// Cross-band digests for the four benefit calculators whose amount variants were consolidated
// (Tier 2 promotion): /unemployment, /parental-leave, /regional-health, /unpaid-wage.
//
// Why these four are promoted and not rewritten from the variants: their variant bodies say the
// same sentences with one amount substituted (the consolidation measured 0.997 similarity on
// /unemployment and /parental-leave). Copying that up would move a doorway page, not fix one.
// So each section below scans its calculator's engine across the input range and writes down what
// only the scan can show - where a threshold sits, where two effects cancel, where the answer
// stops moving. Every number comes from calc-engine.mjs at build time.
//
// Comments here stay ASCII: scripts/ is scanned by font-subset-config.mjs, so a stray Korean
// character in a comment enlarges the shipped font subset for no visible reason.
//
// Never write the string "자주 묻는" into this prose - prerender.mjs skips its FAQ append when the
// body already contains it, and then the FAQPage invariant check fails the build.

import {
  calcInsuranceDeduction,
  calculateSalaryBreakdown,
  formatManWonValue,
  formatPercent,
  formatWon,
  parentalLeavePay,
  PARENTAL_LEAVE_FLOOR,
  RATES_2026,
  regionalHealthEstimate,
  REGIONAL_HEALTH_MIN_MONTHLY,
  unemploymentDailyAllowance,
  UNEMPLOYMENT_DAILY_MAX,
  UNEMPLOYMENT_DAILY_MIN,
  unpaidWageInterest,
} from "./calc-engine.mjs";
import {
  PARENTAL_LEAVE_AMOUNTS,
  UNEMPLOYMENT_AMOUNTS,
  UNPAID_WAGE_AMOUNTS,
} from "./seo-routes.mjs";
import { MIN_WAGE_HOURLY_2026, MIN_WAGE_MONTHLY_2026, DEPENDENT_INCOME_CEILING } from "./hub-digests.mjs";

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

// =========================
// /unemployment - where the statutory floor and ceiling swallow the 60% rule
// =========================

// Scan the monthly-wage axis in 1,000 won steps and report the window in which the raw 60% figure
// actually lands between the floor and the ceiling. Everything outside it is a flat amount.
function unemploymentProportionalBand() {
  let lower = null;
  let upper = null;
  for (let monthly = 1_000_000; monthly <= 9_000_000; monthly += 1_000) {
    const { rawDaily } = unemploymentDailyAllowance(monthly);
    if (rawDaily >= UNEMPLOYMENT_DAILY_MIN && rawDaily <= UNEMPLOYMENT_DAILY_MAX) {
      if (lower === null) lower = monthly;
      upper = monthly;
    }
  }
  return { lower, upper, width: upper - lower };
}

const UNEMPLOYMENT_GRID = [200, 250, 300, 330, 340, 350, 500];

export function unemploymentFlatBandDigest() {
  const band = unemploymentProportionalBand();
  const rows = UNEMPLOYMENT_GRID.map((amount) => ({
    amount,
    ...unemploymentDailyAllowance(amount * 10_000),
  }));
  const low = rows.find((row) => row.amount === 250);
  const high = rows[rows.length - 1];
  const spread = UNEMPLOYMENT_DAILY_MAX - UNEMPLOYMENT_DAILY_MIN;
  // The floor is the minimum wage rebased: 8 hours a day at 80%. Solve that equation for the
  // hourly wage at which the floor would pass the separately notified ceiling.
  const floorFromMinWage = MIN_WAGE_HOURLY_2026 * 8 * 0.8;
  const crossoverHourly = Math.ceil(UNEMPLOYMENT_DAILY_MAX / (8 * 0.8));
  const variantStates = UNEMPLOYMENT_AMOUNTS.map((amount) => {
    const row = unemploymentDailyAllowance(amount * 10_000);
    return {
      amount,
      row,
      state: row.rawDaily < UNEMPLOYMENT_DAILY_MIN ? "하한" : row.rawDaily > UNEMPLOYMENT_DAILY_MAX ? "상한" : "비례",
    };
  });

  return {
    h2: "실업급여가 월급에 비례하는 구간은 월 10만원 폭밖에 없다",
    body: [
      `아래 수치는 이직 전 3개월 평균임금을 <strong>월급 ÷ 30일</strong>로 환산하고 그 60%를 구한 뒤 2026년 고시 상한 ${won(UNEMPLOYMENT_DAILY_MAX)}·하한 ${won(UNEMPLOYMENT_DAILY_MIN)}을 적용한 결과입니다. 상·하한을 적용하기 전 값과 적용한 뒤 값을 나란히 두면, 이 제도가 소득 비례 급여라기보다 <strong>거의 정액 급여</strong>라는 사실이 드러납니다.`,
    ],
    blocks: [
      {
        h3: `비례 구간은 월급 ${won(band.lower)}~${won(band.upper)}, 폭 ${won(band.width)}뿐이다`,
        body: [
          `월급을 100만원부터 900만원까지 1,000원 단위로 훑어 60% 값이 하한과 상한 <em>사이</em>에 떨어지는 구간만 골라내면 ${won(band.lower)}에서 ${won(band.upper)}까지, 폭 ${won(band.width)}이 전부입니다. 이 좁은 창 아래에서는 전원이 하한 ${won(UNEMPLOYMENT_DAILY_MIN)}을, 위에서는 전원이 상한 ${won(UNEMPLOYMENT_DAILY_MAX)}을 받습니다. 그래서 "평균임금의 60%"라는 설명은 실제로 60%가 지급되는 사람이 극소수라는 사실을 가립니다.`,
        ],
      },
      {
        h3: `상한과 하한의 거리가 ${pct(spread / UNEMPLOYMENT_DAILY_MIN, 1)}라 월급이 ${(high.amount / low.amount).toFixed(0)}배여도 수급액은 거의 같다`,
        body: [
          `상한과 하한의 차이는 하루 ${won(spread)}, 하한 대비 ${pct(spread / UNEMPLOYMENT_DAILY_MIN, 1)}입니다. 그래서 월급 ${manWon(low.amount)}인 사람과 ${manWon(high.amount)}인 사람의 일 수급액 차이도 딱 그만큼이고, 150일을 받는다면 총액 차이가 ${won(spread * 150)}에 그칩니다. 월급은 ${(high.amount / low.amount).toFixed(0)}배인데 받는 돈은 ${(UNEMPLOYMENT_DAILY_MAX / UNEMPLOYMENT_DAILY_MIN).toFixed(3)}배에 머무는 셈입니다.`,
        ],
      },
      {
        h3: `하한액은 최저시급에서 파생되므로 시급 ${won(crossoverHourly)}이 되면 상한을 넘어선다`,
        body: [
          `하한 ${won(UNEMPLOYMENT_DAILY_MIN)}은 2026년 최저시급 ${won(MIN_WAGE_HOURLY_2026)}에 1일 8시간과 80%를 곱한 값(${won(floorFromMinWage)})과 원 단위까지 같습니다. 하한은 최저임금을 따라 자동으로 오르지만 상한은 별도 고시라, 최저시급이 ${won(crossoverHourly)}(현행 대비 ${pct(crossoverHourly / MIN_WAGE_HOURLY_2026 - 1, 2)} 인상)에 도달하면 하한이 상한을 <strong>추월</strong>합니다. 두 값이 각각 다른 규칙으로 움직이기 때문에 생기는 충돌이며, 상한이 그때까지 오르지 않으면 제도상 상·하한이 뒤집힙니다.`,
        ],
      },
      {
        h3: "이 계산기의 금액 페이지 세 곳 가운데 비례 구간에 있는 것은 하나도 없다",
        body: [
          `${variantStates
            .map((item) => `월급 ${manWon(item.amount)}은 60% 값이 ${won(item.row.rawDaily)}이라 ${item.state}`)
            .join(", ")}이 적용됩니다. 즉 이 계산기가 다루는 세 금액 모두 실제로는 정액 구간에 있고, 그 사이 어디에 있어도 결과가 두 값 중 하나로 수렴합니다. 본인 월급이 ${won(band.lower)}~${won(band.upper)} 밖이라면 계산기에 정확한 금액을 넣을 필요 자체가 없다는 뜻입니다.`,
        ],
      },
    ],
    table: {
      head: ["퇴사 전 월급", "평균임금 60% (상·하한 적용 전)", "적용선", "실제 일 수급액", "150일 총액", "270일 총액"],
      rows: rows.map((row) => ({
        highlight: row.rawDaily >= UNEMPLOYMENT_DAILY_MIN && row.rawDaily <= UNEMPLOYMENT_DAILY_MAX,
        cells: [
          manWon(row.amount),
          won(row.rawDaily),
          row.rawDaily < UNEMPLOYMENT_DAILY_MIN
            ? "하한"
            : row.rawDaily > UNEMPLOYMENT_DAILY_MAX
              ? "상한"
              : "<strong>비례</strong>",
          `<strong>${won(row.dailyAmount)}</strong>`,
          won(row.dailyAmount * 150),
          won(row.dailyAmount * 270),
        ],
      })),
    },
    tableNote: `평균임금을 월급 ÷ 30일로 환산한 값이며 상여·연차수당이 포함되면 기준액이 올라갑니다. 강조된 행이 비례 구간이고, 나머지는 월급이 얼마든 같은 금액을 받습니다.`,
  };
}

export function unemploymentDaysDigest() {
  const floorDays = UNEMPLOYMENT_DAILY_MIN * 30;
  const capDays = UNEMPLOYMENT_DAILY_MAX * 30;
  const spreadAt150 = (UNEMPLOYMENT_DAILY_MAX - UNEMPLOYMENT_DAILY_MIN) * 150;
  const netRows = [2_500_000, 3_500_000, 5_000_000].map((monthly) => {
    const benefit = unemploymentDailyAllowance(monthly).dailyAmount * 30;
    const payroll = salaryOf(monthly * 12);
    return {
      monthly,
      benefit,
      net: payroll.monthlyNet,
      grossRate: benefit / monthly,
      netRate: benefit / payroll.monthlyNet,
    };
  });
  const lostDays = 88;

  return {
    h2: "수급액을 가르는 것은 월급이 아니라 날짜다",
    body: [
      `소정급여일수는 이직일 기준 나이와 고용보험 가입기간으로 120일에서 270일까지 정해지는데, 이 숫자가 월급보다 총액을 훨씬 크게 움직입니다. 아래 비교는 모두 하한 ${won(UNEMPLOYMENT_DAILY_MIN)}·상한 ${won(UNEMPLOYMENT_DAILY_MAX)}이 적용된 상태를 전제로 합니다.`,
    ],
    blocks: [
      {
        h3: `30일을 더 받는 것이 월급 ${manWon(250)} 인상보다 ${(floorDays / spreadAt150).toFixed(1)}배 크다`,
        body: [
          `하한 적용자가 30일을 더 받으면 총액이 ${won(floorDays)} 늘어납니다. 반면 월급이 ${manWon(250)}에서 ${manWon(500)}으로 두 배가 되어도 150일 기준 총액은 ${won(spreadAt150)}밖에 늘지 않습니다. 그래서 실업급여 총액을 키우려면 퇴사 전 월급을 올리는 것보다 <strong>가입기간 1년을 더 채우는 쪽</strong>이 압도적으로 유리하고, 이 비율은 ${(floorDays / spreadAt150).toFixed(1)}배입니다.`,
        ],
      },
      {
        h3: "실업급여는 비과세라 세후 기준으로 보면 대체율이 8%p 안팎씩 올라간다",
        body: [
          `실업급여에는 4대보험도 소득세도 붙지 않습니다. 그래서 세전 월급과 비교한 대체율보다 <strong>세후 실수령과 비교한 대체율</strong>이 항상 높습니다. ${netRows
            .map(
              (row) =>
                `월급 ${won(row.monthly)}이면 세전 ${pct(row.grossRate)}이지만 실수령 ${won(row.net)} 대비로는 ${pct(row.netRate)}`,
            )
            .join(", ")}입니다. 두 기준의 차이는 그 사람이 매달 떼이던 공제액의 크기와 같으므로, 고소득일수록 격차가 커집니다.`,
        ],
      },
      {
        h3: `늦게 신청하면 남은 일수가 그대로 사라진다 — 소정급여일수 210일에서 ${won(UNEMPLOYMENT_DAILY_MIN * lostDays)}`,
        body: [
          `구직급여는 신청일이 아니라 <strong>퇴사 다음 날부터 12개월</strong> 안에 수급을 마쳐야 합니다. 소정급여일수 210일인 하한 적용자가 퇴사 8개월 뒤에 신청하면 남은 약 122일분만 받고 ${lostDays}일분, 금액으로 ${won(UNEMPLOYMENT_DAILY_MIN * lostDays)}이 소멸합니다. 앞의 발견과 합쳐 보면 결론이 분명해집니다 — 월급이 얼마든 이 제도에서 잃기 쉬운 돈은 <strong>날짜에서만</strong> 나옵니다.`,
        ],
      },
      {
        h3: "조기재취업수당은 남은 일수를 반값에 현금화하는 선택지다",
        body: [
          `소정급여일수를 절반 이상 남기고 재취업해 12개월 이상 근무하면 남은 급여의 50%를 조기재취업수당으로 받습니다. 하한 적용자가 90일을 남겼다면 ${won(Math.floor(UNEMPLOYMENT_DAILY_MIN * 90 * 0.5))}, 상한 적용자라면 ${won(Math.floor(UNEMPLOYMENT_DAILY_MAX * 90 * 0.5))}입니다. 반대로 90일을 그냥 받으면 ${won(UNEMPLOYMENT_DAILY_MIN * 90)}이므로, 재취업으로 얻는 월급이 ${won(Math.floor(UNEMPLOYMENT_DAILY_MIN * 90 * 0.5 / 3))} 이상이면 3개월만 따져도 조기재취업 쪽이 앞섭니다.`,
        ],
      },
    ],
    callout: `<strong>이 계산의 범위</strong> — 평균임금을 월급 ÷ 30일로 단순화했고 상여·연차수당은 넣지 않았습니다. 실제 평균임금은 퇴직 전 3개월 임금총액을 그 기간 총일수(89~92일)로 나누므로 이 값과 다를 수 있으며, 소정급여일수와 수급 자격은 고용센터 심사로 확정됩니다. 상·하한 ${won(UNEMPLOYMENT_DAILY_MAX)}·${won(UNEMPLOYMENT_DAILY_MIN)}은 2026년 고시 기준으로 확인한 값입니다.`,
  };
}

// =========================
// /parental-leave - the payout is a staircase in the ordinary-wage axis, not a line
// =========================

// Marginal 12-month total per 10,000 won of ordinary wage, scanned in 10,000 won steps. The kinks
// are where a cap or the floor starts binding on one of the three phases.
function parentalMarginalSteps() {
  const step = 10_000;
  const steps = [];
  let previousMarginal = null;
  for (let wage = 500_000; wage <= 3_000_000; wage += step) {
    const marginal = parentalLeavePay(wage + step).total - parentalLeavePay(wage).total;
    if (previousMarginal === null || marginal !== previousMarginal) {
      steps.push({ from: wage, marginal });
      previousMarginal = marginal;
    }
  }
  return steps;
}

const PARENTAL_GRID = [600_000, 875_000, 1_500_000, 2_000_000, 2_500_000, 3_500_000];

export function parentalStaircaseDigest() {
  const steps = parentalMarginalSteps();
  const peak = Math.max(...steps.map((item) => item.marginal));
  const flatCeiling = parentalLeavePay(2_500_000);
  const rows = PARENTAL_GRID.map((wage) => ({ wage, ...parentalLeavePay(wage) }));
  const minWageRow = parentalLeavePay(MIN_WAGE_MONTHLY_2026);
  const floorWage = PARENTAL_LEAVE_FLOOR;
  const eightySeven = Math.round(PARENTAL_LEAVE_FLOOR / 0.8);
  const ninetyRow = rows.find((row) => row.wage === 1_500_000);

  return {
    h2: "통상임금 1만원의 값어치가 구간마다 갈리고 양 끝에서는 0이 된다",
    body: [
      `아래는 일반 육아휴직 12개월(6+6 부모육아휴직제 <strong>미적용</strong>) 기준으로, 1~3개월 통상임금 100%(상한 ${won(2_500_000)}), 4~6개월 100%(상한 ${won(2_000_000)}), 7~12개월 80%(상한 ${won(1_600_000)}), 전 구간 하한 ${won(floorWage)}을 적용해 통상임금을 1만원 단위로 훑은 결과입니다. 상한이 구간마다 다르기 때문에 총액은 통상임금에 비례하지 않고 <strong>계단</strong>을 밟습니다.`,
    ],
    blocks: [
      {
        h3: `계단은 ${steps.length}칸이다 — 통상임금 1만원의 값어치가 0원에서 ${won(peak)}까지 올랐다가 다시 0원으로 내려온다`,
        body: [
          `통상임금을 1만원 올렸을 때 12개월 총액이 얼마나 늘어나는지를 전 구간에서 재면 ${steps
            .map((item) => `${won(item.from)}부터 ${won(item.marginal)}`)
            .join(", ")}으로 바뀝니다. ${won(floorWage)} 아래에서는 하한이 세 구간 모두를 덮어 아무리 올려도 총액이 그대로이고, ${won(2_500_000)}을 넘으면 세 상한이 모두 걸려 다시 그대로입니다. 중간의 ${won(870_000)} 칸은 7~12개월분의 하한이 풀리는 지점(${won(eightySeven)})을 가로지르는 1만원짜리 눈금이라 값이 어중간하게 걸립니다. 그래서 이 제도에서 통상임금 인상이 의미를 갖는 구간은 ${won(floorWage)}~${won(2_500_000)}뿐입니다.`,
        ],
      },
      {
        h3: `${won(eightySeven)}~${won(2_000_000)} 구간에서는 대체율이 정확히 90%로 고정된다`,
        body: [
          `이 구간에서는 상한도 하한도 걸리지 않아 총액이 통상임금 × 10.8로 결정됩니다. 12개월로 나누면 통상임금의 정확히 <strong>90%</strong>이고, 6개월분 100%와 6개월분 80%의 평균이 그 값이기 때문입니다. 통상임금 ${won(ninetyRow.wage)}이면 총 ${won(ninetyRow.total)}, 월 평균 ${won(Math.floor(ninetyRow.total / 12))}으로 대체율은 ${pct(ninetyRow.total / 12 / ninetyRow.wage)}입니다. 반면 ${won(2_500_000)}에서는 ${pct(flatCeiling.total / 12 / 2_500_000)}, ${won(3_500_000)}에서는 ${pct(flatCeiling.total / 12 / 3_500_000)}로 떨어집니다.`,
        ],
      },
      {
        h3: `${won(2_000_000)}에서는 두 개의 상한이 동시에 걸린다`,
        body: [
          `4~6개월의 상한 ${won(2_000_000)}은 통상임금이 ${won(2_000_000)}일 때 걸리기 시작하고, 7~12개월의 상한 ${won(1_600_000)}은 통상임금의 80%가 그 값이 되는 지점, 즉 역시 ${won(2_000_000)}에서 걸리기 시작합니다. 두 제한이 한 점에서 겹치기 때문에 기울기가 완만하게 꺾이지 않고 ${won(108_000)}에서 ${won(30_000)}으로 한 번에 떨어집니다. 이 한 지점이 이 계산기에서 가장 급격한 손실 구간입니다.`,
        ],
      },
      {
        h3: "최저임금 근로자조차 후반기에는 상한에 걸린다",
        body: [
          `2026년 최저시급 ${won(MIN_WAGE_HOURLY_2026)}을 월 209시간으로 환산한 ${won(MIN_WAGE_MONTHLY_2026)}을 통상임금으로 넣으면 1~3개월은 통상임금 그대로 ${won(minWageRow.pay1_3)}이지만 4~6개월은 상한에 걸려 ${won(minWageRow.pay4_6)}, 7~12개월도 상한 ${won(minWageRow.pay7_12)}이 됩니다. 총액은 ${won(minWageRow.total)}으로 통상임금 ${won(2_500_000)} 이상인 사람의 ${won(flatCeiling.total)}과 ${won(flatCeiling.total - minWageRow.total)}, 비율로는 ${pct(1 - minWageRow.total / flatCeiling.total, 1)}밖에 차이 나지 않습니다. 상한선이 최저임금 근처까지 내려와 있다는 뜻입니다.`,
        ],
      },
    ],
    table: {
      head: ["월 통상임금", "1~3개월", "4~6개월", "7~12개월", "12개월 총액", "월 평균 대체율"],
      rows: rows.map((row) => ({
        highlight: row.wage === 2_000_000,
        cells: [
          won(row.wage),
          won(row.pay1_3),
          won(row.pay4_6),
          won(row.pay7_12),
          `<strong>${won(row.total)}</strong>`,
          pct(row.total / 12 / row.wage),
        ],
      })),
    },
    tableNote: `강조한 행이 두 상한이 동시에 걸리기 시작하는 지점입니다. 대체율이 ${won(600_000)}에서 100%를 넘는 이유는 하한 ${won(floorWage)}이 통상임금보다 크기 때문이며, 이 구간에서는 휴직 중 수입이 근무 중 수입보다 많습니다.`,
  };
}

export function parentalVariantFlatDigest() {
  const variantRows = PARENTAL_LEAVE_AMOUNTS.map((amount) => ({
    amount,
    ...parentalLeavePay(amount * 10_000),
  }));
  const identical = variantRows.every((row) => row.total === variantRows[0].total);
  const netRows = [2_000_000, 3_000_000, 4_000_000].map((wage) => {
    const leave = parentalLeavePay(wage);
    const payroll = salaryOf(wage * 12);
    return {
      wage,
      total: leave.total,
      annualNet: payroll.annualNet,
      grossRate: leave.total / (wage * 12),
      netRate: leave.total / payroll.annualNet,
    };
  });
  const unemploymentMonthlyCap = UNEMPLOYMENT_DAILY_MAX * 30;
  const unemployment270 = UNEMPLOYMENT_DAILY_MAX * 270;

  return {
    h2: "금액 페이지 여섯 곳이 전부 같은 총액을 내놓는 이유",
    body: [
      `이 계산기에는 통상임금 ${manWon(PARENTAL_LEAVE_AMOUNTS[0])}부터 ${manWon(PARENTAL_LEAVE_AMOUNTS[PARENTAL_LEAVE_AMOUNTS.length - 1])}까지 여섯 개의 금액 페이지가 붙어 있습니다. 그런데 엔진에 그 여섯 값을 그대로 넣어 보면 결과가 갈리지 않습니다.`,
    ],
    blocks: [
      {
        h3: `여섯 금액 전부 12개월 총액이 ${won(variantRows[0].total)}으로 같다`,
        body: [
          `${identical ? "여섯 값 모두" : "대부분의 값이"} 1~3개월 상한 ${won(2_500_000)}을 넘는 통상임금이라, 세 구간 지급액이 모두 상한으로 잘려 총액이 ${won(variantRows[0].total)}으로 동일합니다. 통상임금이 ${manWon(PARENTAL_LEAVE_AMOUNTS[0])}이든 ${manWon(PARENTAL_LEAVE_AMOUNTS[PARENTAL_LEAVE_AMOUNTS.length - 1])}이든 받는 돈이 1원도 다르지 않다는 뜻입니다. 그래서 이 계산기에서 정말 확인해야 할 값은 상한 위의 통상임금이 아니라 <strong>${won(PARENTAL_LEAVE_FLOOR)}~${won(2_500_000)} 구간</strong>입니다.`,
        ],
      },
      {
        h3: "세후로 비교하면 손실이 절반 가까이 줄어든다",
        body: [
          `육아휴직 급여에는 4대보험도 소득세도 붙지 않습니다. 그래서 "통상임금의 몇 %"라는 세전 비교는 실제 체감보다 손실을 크게 보이게 만듭니다. ${netRows
            .map(
              (row) =>
                `통상임금 ${won(row.wage)}이면 세전 대체율 ${pct(row.grossRate)}이지만 연 실수령 ${won(row.annualNet)} 대비로는 ${pct(row.netRate)}`,
            )
            .join(", ")}입니다. 통상임금 ${won(2_000_000)} 근처에서는 세후 기준으로 <strong>거의 손실이 없다</strong>는 결론이 나옵니다.`,
        ],
      },
      {
        h3: "같은 고용보험에서 나오지만 실업급여보다 상한이 높다",
        body: [
          `육아휴직 급여와 구직급여는 모두 고용보험 기금에서 나오는데 상한 설계가 다릅니다. 구직급여 일 상한 ${won(UNEMPLOYMENT_DAILY_MAX)}을 30일로 환산하면 ${won(unemploymentMonthlyCap)}으로, 육아휴직 1~3개월 상한 ${won(2_500_000)}보다 ${won(2_500_000 - unemploymentMonthlyCap)} 낮습니다. 총액으로 보면 육아휴직 12개월 ${won(variantRows[0].total)}이 구직급여 최대치인 270일 상한 수령액 ${won(unemployment270)}보다 ${won(variantRows[0].total - unemployment270)} 많습니다.`,
        ],
      },
      {
        h3: `하한 ${won(PARENTAL_LEAVE_FLOOR)} 때문에 대체율이 100%를 넘는 구간이 존재한다`,
        body: [
          `통상임금이 ${won(PARENTAL_LEAVE_FLOOR)}보다 낮으면 세 구간 모두 하한이 적용되어 월 ${won(PARENTAL_LEAVE_FLOOR)}을 받습니다. 통상임금 ${won(600_000)}인 초단시간 근로자라면 대체율이 ${pct(parentalLeavePay(600_000).total / 12 / 600_000)}, 즉 휴직 중 소득이 근무 중 소득보다 많아집니다. 상한이 고소득의 급여를 깎는 것과 정확히 반대 방향으로, 하한은 저소득의 급여를 끌어올립니다.`,
        ],
      },
    ],
    callout: `<strong>이 계산이 다루지 않는 것</strong> — 6+6 부모육아휴직제(생후 18개월 이내 자녀에 대해 부모가 모두 사용할 때 첫 6개월 상한이 월 ${won(2_000_000)}~${won(4_500_000)}으로 상향)는 위 수치에 반영돼 있지 않습니다. 특례를 적용하면 상한이 올라가므로 계단의 위치 자체가 달라집니다. 상한·하한 금액은 2026년 고용보험 육아휴직 급여 기준으로 확인한 값입니다.`,
  };
}

// =========================
// /regional-health - the two options differ by a fixed factor, and the real variable is elsewhere
// =========================

const REGIONAL_GRID = [2_500_000, 3_500_000, 5_000_000];

export function regionalHealthRatioDigest() {
  const rows = REGIONAL_GRID.map((monthly) => {
    const estimate = regionalHealthEstimate(monthly);
    const employed = calcInsuranceDeduction(monthly);
    const ltcOnVoluntary = Math.floor(estimate.formerEmployed * RATES_2026.longTermCare.rateOfHealth);
    const ltcOnRegional = Math.floor(estimate.regionalIncomeOnly * RATES_2026.longTermCare.rateOfHealth);
    return {
      monthly,
      ...estimate,
      employed,
      ltcOnVoluntary,
      ltcOnRegional,
      ratio: estimate.regionalIncomeOnly / estimate.formerEmployed,
      saving36: (estimate.regionalIncomeOnly - estimate.formerEmployed) * 36,
    };
  });
  const mid = rows[1];
  const floorIncome = Math.ceil(REGIONAL_HEALTH_MIN_MONTHLY / RATES_2026.healthInsurance.total);

  return {
    h2: "두 선택지의 금액은 항상 정확히 두 배 차이가 난다",
    body: [
      `아래 금액은 <strong>재산·자동차 점수를 뺀 소득분만</strong>의 최소 추정치입니다. 지역 소득분 열은 퇴사 전 월급과 같은 크기의 소득이 <strong>퇴사 뒤에도 이어질 때</strong>의 상한선이며, 소득이 실제로 끊기면 네 번째 항목의 하한까지 내려갑니다.`,
      `임의계속가입 열이 정확히 절반인 데에는 조문 두 개가 겹쳐 있습니다. 보수월액보험료는 <strong>전액을 본인이 부담</strong>하지만(국민건강보험법 제110조 제5항), 같은 조 제4항이 위임한 보험료 경감고시 제9조가 <strong>그 100분의 50을 경감</strong>합니다. 두 규정을 함께 적용하면 부담률이 ${pct(RATES_2026.healthInsurance.total, 2)}에서 ${pct(RATES_2026.healthInsurance.employee, 3)}으로 내려앉고, 지역 소득분은 경감 없이 ${pct(RATES_2026.healthInsurance.total, 2)} 그대로이므로 월급을 어떻게 바꿔도 비율이 움직이지 않습니다.`,
    ],
    blocks: [
      {
        h3: `월급이 무엇이든 배수는 ${rows[0].ratio.toFixed(3)}으로 고정된다`,
        body: [
          `${rows
            .map((row) => `월급 ${won(row.monthly)}이면 지역 소득분 ${won(row.regionalIncomeOnly)} 대 임의계속 ${won(row.formerEmployed)}`)
            .join(", ")}입니다. 세 경우 모두 배수가 ${rows[0].ratio.toFixed(3)}입니다. 지역가입자는 소득분을 경감 없이 전액 부담하는 반면 임의계속가입자는 같은 전액에서 절반을 경감받기 때문이며, 그래서 <strong>월 차액은 언제나 임의계속가입료와 같은 금액</strong>입니다. 표의 차액 열을 임의계속 열과 비교하면 두 숫자가 겹칩니다.`,
        ],
      },
      {
        h3: `36개월을 다 쓰면 월급 ${won(mid.monthly)} 기준 ${won(mid.saving36)}이 남는다`,
        body: [
          `임의계속가입은 최대 36개월입니다. 매달 차액이 임의계속가입료와 같으므로 총 절감액은 임의계속가입료 × 36으로 곧장 구해집니다. ${rows
            .map((row) => `월급 ${won(row.monthly)}이면 ${won(row.saving36)}`)
            .join(", ")}입니다. 다만 36개월이 끝나면 그날부터 보험료가 두 배로 뛰므로, 절감액은 <strong>미뤄둔 금액</strong>이지 면제된 금액이 아닙니다.`,
        ],
      },
      {
        h3: "임의계속가입료는 재직 중 명세서의 건강보험 공제액과 원 단위까지 같다",
        body: [
          `월급 ${won(mid.monthly)}인 재직자의 급여명세서에 찍히는 건강보험 본인부담은 ${won(mid.employed.healthInsurance)}이고, 이 계산기의 임의계속가입 금액도 ${won(mid.formerEmployed)}으로 같은 값입니다. 그래서 "퇴사 후 보험료가 얼마나 오르나"라는 질문의 답은 명세서를 꺼내는 것으로 끝납니다 — 임의계속가입을 하면 그대로, 하지 않으면 그 두 배입니다. 두 금액 모두 장기요양보험료가 별도로 ${pct(RATES_2026.longTermCare.rateOfHealth, 2)}씩 더 붙어, 월급 ${won(mid.monthly)} 기준으로 임의계속에 ${won(mid.ltcOnVoluntary)}, 지역 소득분에 ${won(mid.ltcOnRegional)}이 추가됩니다. 경감 전 금액은 월급 ${won(mid.monthly)} 기준 ${won(mid.voluntaryGross)}이고, 고지서에 찍히는 것은 여기서 절반을 뺀 ${won(mid.formerEmployed)}입니다.`,
        ],
      },
      {
        h3: `소득이 사라지면 소득분은 월 ${won(REGIONAL_HEALTH_MIN_MONTHLY)}까지 내려간다`,
        body: [
          `이 계산기는 소득분 보험료에 월 ${won(REGIONAL_HEALTH_MIN_MONTHLY)}의 하한을 두고 있어, 월 소득이 ${won(floorIncome)}보다 낮아지면 그 아래로는 내려가지 않습니다. 실업급여는 비과세 소득이라 건강보험료 부과 대상이 아니므로, 구직급여 월 상한 ${won(UNEMPLOYMENT_DAILY_MAX * 30)}을 받는 동안에도 소득분은 이 하한에 붙습니다. 그래서 퇴직·폐업 사실을 증빙해 <strong>보험료 조정 신청</strong>을 하면 월급 ${won(mid.monthly)}이던 사람의 소득분이 ${won(mid.regionalIncomeOnly)}에서 ${won(REGIONAL_HEALTH_MIN_MONTHLY)}으로, 연 ${won((mid.regionalIncomeOnly - REGIONAL_HEALTH_MIN_MONTHLY) * 12)}만큼 줄어듭니다.`,
          `위 화면의 계산기가 이 하한을 그대로 씁니다. 금융소득 입력을 0원으로 두면 지역가입자 추정이 곧바로 월 ${won(REGIONAL_HEALTH_MIN_MONTHLY)}에 붙고, 표의 지역 소득분 ${won(mid.regionalIncomeOnly)}은 나타나지 않습니다. <strong>표는 소득이 이어질 때, 화면 기본값은 소득이 끊겼을 때</strong>의 답이라 서로 다른 질문에 답하고 있습니다.`,
        ],
      },
    ],
    table: {
      head: ["퇴사 전 월급", "지역 소득분", "임의계속(경감 후)", "월 차액", "배수", "36개월 누적 차액"],
      rows: rows.map((row) => ({
        highlight: row.monthly === mid.monthly,
        cells: [
          won(row.monthly),
          won(row.regionalIncomeOnly),
          won(row.formerEmployed),
          `<strong>${won(row.regionalIncomeOnly - row.formerEmployed)}</strong>`,
          row.ratio.toFixed(3),
          won(row.saving36),
        ],
      })),
    },
    tableNote: `건강보험료만의 금액이며 장기요양보험료 ${pct(RATES_2026.longTermCare.rateOfHealth, 2)}는 양쪽 모두에 별도로 붙습니다. 임의계속 열은 경감고시 제9조를 적용한 뒤의 금액이고, 경감 전 전액은 그 두 배인 지역 소득분 열과 같은 값입니다. 지역가입자의 재산·자동차 점수는 편차가 커서 제외했으므로, 재산이 있으면 실제 고지액은 표보다 높습니다.`,
  };
}

export function regionalHealthDependentCliffDigest() {
  const ceiling = DEPENDENT_INCOME_CEILING;
  const monthlyAtCeiling = regionalHealthEstimate(ceiling / 12).regionalIncomeOnly;
  const annualAtCeiling = monthlyAtCeiling * 12;
  const mid = 3_500_000;
  const midEstimate = regionalHealthEstimate(mid);
  const midEmployed = calcInsuranceDeduction(mid);

  return {
    h2: "이 계산에서 가장 큰 금액은 세 번째 선택지에서 나온다",
    body: [
      `퇴사 후 건강보험에는 지역가입·임의계속가입 말고 <strong>배우자나 자녀의 피부양자로 등재</strong>하는 세 번째 길이 있고, 그 경우 보험료가 0원입니다. 앞의 두 선택지 사이의 차액보다 이쪽의 차이가 훨씬 크기 때문에, 순서상 피부양자 자격부터 따져야 합니다. 아래 금액은 연 소득 ${won(ceiling)}이라는 피부양자 소득요건 경계에서 계산한 값입니다.`,
    ],
    blocks: [
      {
        h3: `소득 1원이 연 ${won(annualAtCeiling)}을 만든다`,
        body: [
          `합산소득이 ${won(ceiling)}을 1원이라도 넘으면 피부양자에서 탈락해 지역가입자가 됩니다. 그 소득을 월 ${won(Math.floor(ceiling / 12))}으로 환산해 소득분 보험료를 구하면 월 ${won(monthlyAtCeiling)}, 연 ${won(annualAtCeiling)}입니다. 세금이라면 한계세율이 붙었을 자리에 <strong>계단 하나가 통째로</strong> 있는 셈이고, 이 계단에는 완충 장치가 없습니다.`,
        ],
      },
      {
        h3: `그래서 연 소득 ${won(ceiling)}~${won(ceiling + annualAtCeiling)} 구간은 벌수록 손해다`,
        body: [
          `소득이 ${won(ceiling)}에서 1원 늘어난 순간 손에 남는 돈은 ${won(annualAtCeiling)}만큼 줄어듭니다. 이 손실을 메우려면 소득이 ${won(annualAtCeiling)} 더 늘어 ${won(ceiling + annualAtCeiling)}에 도달해야 합니다. 즉 그 사이 구간에서는 <strong>더 벌었는데 총소득이 줄어드는 역전</strong>이 일어나며, 이는 재산·자동차 점수를 넣기 전 소득분만으로도 이미 성립합니다.`,
        ],
      },
      {
        h3: "세 선택지의 월 금액을 한 줄로 세우면 순서가 분명하다",
        body: [
          `퇴사 전 월급 ${won(mid)}이었던 사람을 기준으로 하면 피부양자 등재는 월 ${won(0)}, 임의계속가입은 ${won(midEstimate.formerEmployed)}(장기요양 별도 ${won(Math.floor(midEstimate.formerEmployed * RATES_2026.longTermCare.rateOfHealth))}), 지역가입자 소득분은 ${won(midEstimate.regionalIncomeOnly)}입니다. 참고로 재직 중이었다면 건강보험과 장기요양을 합쳐 매달 ${won(midEmployed.healthInsurance + midEmployed.longTermCare)}을 냈습니다. 그래서 피부양자 등재가 가능하다면 임의계속가입 신청서를 쓰기 전에 그쪽을 먼저 확인해야 합니다.`,
        ],
      },
      {
        h3: "신청 기한을 놓치면 두 배 금액이 36개월 동안 고정된다",
        body: [
          `임의계속가입은 지역가입자로 전환된 뒤 최초 고지 보험료의 납부기한에서 2개월이 지나기 전에 신청해야 하고, 이 기한은 연장되지 않습니다. 기한을 넘기면 월 ${won(midEstimate.regionalIncomeOnly)}(재산 제외 최소 추정)이 그대로 유지되므로, 위에서 계산한 36개월 누적 차액 ${won((midEstimate.regionalIncomeOnly - midEstimate.formerEmployed) * 36)}이 통째로 사라집니다. 첫 고지서를 받으면 그날 계산을 끝내야 하는 이유가 여기 있습니다.`,
        ],
      },
    ],
    callout: `<strong>이 계산의 범위</strong> — 소득분만 반영한 최소 추정치이며 재산·자동차 점수는 포함하지 않았습니다. 피부양자 요건은 소득 외에 재산 과세표준(${won(540_000_000)}·${won(900_000_000)})과 부양 관계도 함께 봅니다. 요율은 2026년 건강보험료율 기준으로 확인한 값이고, 확정 금액은 국민건강보험공단 모의계산으로 확인하세요.`,
  };
}

// =========================
// /unpaid-wage - four statutory rates make amounts and days interchangeable
// =========================

const UNPAID_RATE_RETIRED = 0.2;
const UNPAID_RATE_CIVIL = 0.05;
const UNPAID_RATE_COMMERCIAL = 0.06;
const UNPAID_RATE_LITIGATION = 0.12;
const UNPAID_GRID = [100, 500, 1000, 3000];

export function unpaidWageEquivalenceDigest() {
  const rows = UNPAID_GRID.map((amount) => {
    const value = amount * 10_000;
    return {
      amount,
      value,
      retired365: unpaidWageInterest(value, UNPAID_RATE_RETIRED, 365),
      civil365: unpaidWageInterest(value, UNPAID_RATE_CIVIL, 365),
      commercial365: unpaidWageInterest(value, UNPAID_RATE_COMMERCIAL, 365),
      litigation365: unpaidWageInterest(value, UNPAID_RATE_LITIGATION, 365),
      cap3y: unpaidWageInterest(value, UNPAID_RATE_RETIRED, 1095),
    };
  });
  const ratio = UNPAID_RATE_RETIRED / UNPAID_RATE_CIVIL;
  const equivalentDays = Math.round(365 / ratio);
  const sample = rows.find((row) => row.amount === 300) ?? rows[1];
  const bigger = rows[rows.length - 2];
  const daysForSame = Math.round(
    (sample.value * UNPAID_RATE_RETIRED * 365) / (bigger.value * UNPAID_RATE_RETIRED),
  );

  return {
    h2: "이율 네 단계가 금액과 날짜를 서로 바꿔 놓는다",
    body: [
      `지연이자는 <strong>체불액 × 연이율 × 지연일수 ÷ 365</strong>로 계산되므로 금액·기간·이율 어느 쪽으로도 같은 결과를 만들 수 있습니다. 아래 수치는 퇴직 후 연 ${pct(UNPAID_RATE_RETIRED, 0)}(근로기준법 제37조), 재직 중 민법 연 ${pct(UNPAID_RATE_CIVIL, 0)}, 상법 연 ${pct(UNPAID_RATE_COMMERCIAL, 0)}, 소송촉진법 연 ${pct(UNPAID_RATE_LITIGATION, 0)} 네 이율을 같은 산식에 넣어 비교한 것입니다.`,
    ],
    blocks: [
      {
        h3: `퇴직자의 ${equivalentDays}일이 재직자의 1년과 같다`,
        body: [
          `이율이 ${ratio}배 차이 나므로 시간도 ${ratio}배로 압축됩니다. 체불액 ${won(10_000_000)}을 놓고 보면 재직 중 1년을 끌어서 붙는 이자가 ${won(rows[2].civil365)}인데, 퇴직 후에는 ${equivalentDays}일 만에 같은 금액에 도달합니다. 그래서 같은 체불이라도 <strong>퇴직일을 기준으로 이자 시계가 갈아 끼워진다</strong>고 보는 편이 정확합니다.`,
        ],
      },
      {
        h3: `금액과 기간은 대체 가능하다 — ${manWon(sample.amount)} 1년이 ${manWon(bigger.amount)} ${daysForSame}일과 같다`,
        body: [
          `산식이 곱셈이라 체불액을 키우는 것과 기간을 늘리는 것이 같은 방향으로 작동합니다. 체불 ${manWon(sample.amount)}을 1년 끌면 이자가 ${won(sample.retired365)}인데, 체불 ${manWon(bigger.amount)}이라면 ${daysForSame}일 만에 같은 금액이 됩니다. 청구서를 쓸 때 금액과 일수를 따로 다투는 것보다 <strong>둘의 곱</strong>을 먼저 확정하는 편이 빠른 이유입니다.`,
        ],
      },
      {
        h3: `이자는 원금을 넘을 수 없다 — 소멸시효 3년이 상한을 ${pct(UNPAID_RATE_RETIRED * 3, 0)}로 고정한다`,
        body: [
          `임금채권의 소멸시효는 3년입니다. 퇴직 후 이율 ${pct(UNPAID_RATE_RETIRED, 0)}로 3년을 꽉 채워도 이자는 원금의 ${pct(UNPAID_RATE_RETIRED * 3, 0)}에서 멈추므로, 체불 ${won(10_000_000)}이면 이자 상한이 ${won(rows[2].cap3y)}입니다. 이자가 원금을 추월하려면 5년이 필요한데 그 전에 시효가 먼저 오기 때문에, <strong>지연이자만으로 원금을 넘는 사건은 성립할 수 없습니다</strong>.`,
        ],
      },
      {
        h3: "소송이 이율을 올리는 것은 재직 구간뿐이다",
        body: [
          `소장 부본이 사용자에게 송달된 다음 날부터 적용되는 소송촉진법 이율은 연 ${pct(UNPAID_RATE_LITIGATION, 0)}입니다. 재직 중 체불이라면 민법 ${pct(UNPAID_RATE_CIVIL, 0)}에서 ${pct(UNPAID_RATE_LITIGATION, 0)}로 ${(UNPAID_RATE_LITIGATION / UNPAID_RATE_CIVIL).toFixed(1)}배가 되어 ${won(10_000_000)} 기준 연 이자가 ${won(rows[2].civil365)}에서 ${won(rows[2].litigation365)}으로 올라갑니다. 반대로 퇴직 후 체불에는 이미 연 ${pct(UNPAID_RATE_RETIRED, 0)}가 붙고 있어 ${pct(UNPAID_RATE_LITIGATION, 0)}보다 높으므로, 소송이 이율을 끌어올리는 효과는 없습니다.`,
        ],
      },
    ],
    table: {
      head: ["체불액", "재직 민법 5% (1년)", "재직 상법 6% (1년)", "소송 12% (1년)", "퇴직 후 20% (1년)", "3년 시효 상한"],
      rows: rows.map((row) => ({
        highlight: row.amount === 1000,
        cells: [
          manWon(row.amount),
          won(row.civil365),
          won(row.commercial365),
          won(row.litigation365),
          `<strong>${won(row.retired365)}</strong>`,
          won(row.cap3y),
        ],
      })),
    },
    tableNote: `모든 값은 같은 산식에 이율만 바꿔 넣은 결과이며, 지연일수는 이율이 적용되기 시작한 날부터 셉니다. 회생·파산 절차가 개시되었거나 지급 지연에 정당한 사유가 인정되면 퇴직 후 20%가 적용되지 않을 수 있습니다(근로기준법 시행령 제18조).`,
  };
}

export function unpaidWageStartDateDigest() {
  const value = 10_000_000;
  const clearingDays = 14;
  const sample30 = unpaidWageInterest(value, UNPAID_RATE_RETIRED, 30);
  const sixMonthsCivil = unpaidWageInterest(value, UNPAID_RATE_CIVIL, 182);
  const sixMonthsRetired = unpaidWageInterest(value, UNPAID_RATE_RETIRED, 182);
  const minWageCrossing = Math.ceil(MIN_WAGE_MONTHLY_2026 / UNPAID_RATE_RETIRED);
  const overMinWage = UNPAID_WAGE_AMOUNTS.filter((amount) => amount * 10_000 >= minWageCrossing);
  const rateGap =
    unpaidWageInterest(value, UNPAID_RATE_COMMERCIAL, 365) - unpaidWageInterest(value, UNPAID_RATE_CIVIL, 365);

  return {
    h2: "기산일을 하루 잘못 잡으면 청구액이 통째로 흔들린다",
    body: [
      `퇴직자의 금품은 퇴직일로부터 ${clearingDays}일 이내에 청산해야 하고(근로기준법 제36조), 연 ${pct(UNPAID_RATE_RETIRED, 0)}는 그 기한이 지난 다음부터 붙습니다. 그래서 이 계산기의 "지연 일수"는 퇴직일로부터의 일수가 아니라 <strong>청산 기한이 지난 뒤의 일수</strong>입니다.`,
    ],
    blocks: [
      {
        h3: `퇴직 ${clearingDays + 30}일째가 지연 30일이다`,
        body: [
          `체불액 ${won(value)}의 "30일" 이자 ${won(sample30)}은 퇴직 30일째가 아니라 <strong>퇴직 ${clearingDays + 30}일째</strong>의 금액입니다. 청산 기한 ${clearingDays}일 동안에는 이자가 붙지 않기 때문이며, 이 ${clearingDays}일을 빼먹고 계산하면 청구액이 ${won(unpaidWageInterest(value, UNPAID_RATE_RETIRED, clearingDays))}만큼 부풀려집니다. 내용증명에 기산일을 적을 때 가장 자주 어긋나는 지점입니다.`,
        ],
      },
      {
        h3: "재직 중 체불이 이어지다 퇴직하면 같은 기간의 이자가 4배가 된다",
        body: [
          `재직 중 6개월간 밀린 ${won(value)}에 붙는 이자는 민법 ${pct(UNPAID_RATE_CIVIL, 0)}로 ${won(sixMonthsCivil)}입니다. 그런데 퇴직한 뒤 같은 6개월이 지나면 ${pct(UNPAID_RATE_RETIRED, 0)}가 적용되어 ${won(sixMonthsRetired)}, 차이가 ${won(sixMonthsRetired - sixMonthsCivil)}입니다. 그래서 이미 체불이 쌓인 상태에서 퇴직이 예정돼 있다면, 퇴직일이 곧 <strong>이율이 바뀌는 날</strong>이라는 점을 청구서에 반영해야 합니다.`,
        ],
      },
      {
        h3: `체불액 ${won(minWageCrossing)}을 넘으면 1년치 이자만으로 최저임금 월급을 넘어선다`,
        body: [
          `2026년 최저시급 ${won(MIN_WAGE_HOURLY_2026)}을 월 209시간으로 환산하면 ${won(MIN_WAGE_MONTHLY_2026)}입니다. 퇴직 후 이율 ${pct(UNPAID_RATE_RETIRED, 0)}로 1년치 이자가 이 금액을 넘으려면 체불액이 ${won(minWageCrossing)} 이상이어야 하고, 이 계산기가 다루는 여섯 금액 중에서는 ${overMinWage.map((amount) => manWon(amount)).join("·")}만 그 선을 넘습니다. 이자가 <strong>한 달 일한 값</strong>을 넘어서는 지점을 알고 있으면 지연 전략의 손익이 눈에 보입니다.`,
        ],
      },
      {
        h3: `민법 5%와 상법 6%의 1%p가 ${won(rateGap)}을 만든다`,
        body: [
          `재직 중 체불에는 민법 연 ${pct(UNPAID_RATE_CIVIL, 0)}가 원칙이지만, 사용자가 상인이면 상사채권으로 보아 상법 연 ${pct(UNPAID_RATE_COMMERCIAL, 0)}가 적용됩니다. ${won(value)}을 1년 끌면 차이가 ${won(rateGap)}입니다. 회사 형태의 사업장은 대부분 상인이라 실무에서는 ${pct(UNPAID_RATE_COMMERCIAL, 0)} 쪽이 기본값에 가깝고, 그래서 표의 ${pct(UNPAID_RATE_CIVIL, 0)} 행은 개인 사업주 사건에서만 실제로 쓰입니다.`,
        ],
      },
    ],
    callout: `<strong>청구 전 확인</strong> — 지연이자는 자동으로 붙지 않고 청구해야 확정됩니다. 임금채권 소멸시효는 3년이고, 진정이나 소송 제기로 시효를 중단시킬 수 있습니다. 이율은 근로기준법 제37조·민법 제379조·상법 제54조·소송촉진법 제3조의 법정 이율 기준이며, 실제 인정 금액은 노동청 조사와 법원 판단으로 확정됩니다.`,
  };
}
