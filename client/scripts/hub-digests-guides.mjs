// Step-anchored digests for the four situation guides (/guide/*).
//
// WHY THESE ARE NOT WRITTEN LIKE THE CALCULATOR DIGESTS
// ---------------------------------------------------------------------------
// A guide is a running order: open calculator A, then B, then C. Padding that with
// general advice is exactly the "scaled content" shape a reviewer looks for. So each
// block below answers one question instead - "why does this step need THIS calculator,
// in won?" - by calling the same engine the linked calculator uses and quoting the
// number the reader will see there. Where a fact only appears when two calculators are
// chained (a severance figure divided by an unemployment daily allowance, a withholding
// total against a determined tax), that chain is computed here and nowhere else.
//
// Nothing is hardcoded: every figure is produced by calc-engine.mjs at build time, and
// src/utils/digestFigures.test.ts re-derives the load-bearing ones by hand.
import {
  calcAnnualLeavePay,
  calcBonusImpact,
  calcIncomeTaxBundle,
  calcIrpTaxCredit,
  calcMonthlyRentDeduction,
  calcRaiseImpact,
  calculateSalaryBreakdown,
  eitcAmountFor,
  EITC_BRACKET_TABLE,
  formatManWonValue,
  formatPercent,
  formatWon,
  getAnnualLeaveDays,
  MONTHLY_HOURS_WITH_HOLIDAY,
  RATES_2026,
  regionalHealthEstimate,
  severanceIncomeTax,
  severancePayEstimate,
  unemploymentDailyAllowance,
  UNEMPLOYMENT_DAILY_MAX,
  UNEMPLOYMENT_DAILY_MIN,
  unpaidWageInterest,
  wageConversion,
  weeklyHolidayPayForHours,
  yearEndStandardScenario,
} from "./calc-engine.mjs";

const won = (value) => formatWon(value);
const manWon = (value) => `${formatManWonValue(Math.round(value / 10_000))}원`;
const pct = (value, digits = 1) => formatPercent(value, digits);

// Independent literals. The screen defaults live in src/; repeating the values here on
// purpose means a change on either side shows up as a test failure instead of silently
// agreeing with itself.
const GUIDE_PAYROLL = { nonTaxableMonthly: 200_000, dependents: 1, children: 0, retirementIncluded: false };
const payroll = (grossAnnual, overrides = {}) =>
  calculateSalaryBreakdown({ grossAnnual, ...GUIDE_PAYROLL, ...overrides });
// Hourly work is calculated without a meal allowance - part-time payslips rarely carry one.
const hourlyPayroll = (annual) => payroll(annual, { nonTaxableMonthly: 0 });

export const MIN_WAGE_HOURLY = 10_320;

// =========================================================================
// /guide/job-change
// =========================================================================
// Retention of one 1,000만원 step, band by band. The pension ceiling makes this
// non-monotone, so the sentence that quotes it has to name the range it holds on.
function stepRetention(lowGross) {
  const low = payroll(lowGross);
  const high = payroll(lowGross + 10_000_000);
  return {
    lowGross,
    grossStep: high.monthlyGross - low.monthlyGross,
    netStep: high.monthlyNet - low.monthlyNet,
    retention: (high.monthlyNet - low.monthlyNet) / (high.monthlyGross - low.monthlyGross),
    pensionStep: high.nationalPension - low.nationalPension,
  };
}

export function jobChangeStepFindingsDigest() {
  const from = payroll(50_000_000);
  const to = payroll(60_000_000);
  const band = stepRetention(50_000_000);
  const nominalMonthly = band.grossStep;
  const realMonthly = band.netStep;
  const retention = band.retention;

  const higher = payroll(70_000_000);
  const highBand = stepRetention(70_000_000);
  const highRetention = highBand.retention;

  const capReach = (() => {
    for (let gross = 70_000_000; gross <= 120_000_000; gross += 10_000) {
      if (payroll(gross).taxableMonthly >= RATES_2026.nationalPension.maxMonthlyIncome) return gross;
    }
    return 0;
  })();
  const below = payroll(80_000_000);
  const above = payroll(90_000_000);
  const pensionStepBelow = below.nationalPension - higher.nationalPension;
  const pensionStepAbove = above.nationalPension - below.nationalPension;
  const proportional = Math.floor((above.taxableMonthly - below.taxableMonthly) * RATES_2026.nationalPension.employee);
  // Where the rebound starts, where it peaks, and where the progressive tax takes over again.
  const crossing = stepRetention(80_000_000);
  const fullyAbove = stepRetention(90_000_000);
  const taxWinsAgain = stepRetention(110_000_000);

  const raises = [30_000_000, 50_000_000, 80_000_000].map((gross) => {
    const impact = calcRaiseImpact({ currentAnnual: gross, raisePercent: 5 });
    return { gross, impact, retention: impact.annualNetDiff / impact.raiseAmount };
  });
  const lowRaise = raises[0];
  const midRaise = raises[1];
  const topRaise = raises[2];

  const bonus = calcBonusImpact({ annualSalary: 50_000_000, bonusAmount: 10_000_000 });
  const bonusHigh = calcBonusImpact({ annualSalary: 70_000_000, bonusAmount: 10_000_000 });

  return {
    h2: "다섯 단계가 각각 답하는 질문",
    body: [
      `이 가이드의 다섯 단계는 서로 다른 계산기를 엽니다. 왜 그 순서인지는 각 단계가 내놓는 <strong>숫자</strong>를 봐야 알 수 있습니다. 아래는 연봉 ${manWon(50_000_000)}에서 ${manWon(60_000_000)} 제안을 받은 경우를 기준으로, 단계마다 화면에 뜨는 값을 미리 계산해 둔 것입니다.`,
    ],
    blocks: [
      {
        h3: `1단계 — 명목 월 ${won(nominalMonthly)} 가운데 실제로 늘어나는 것은 ${won(realMonthly)}이다`,
        body: [
          `제안 연봉이 ${manWon(10_000_000)} 오르면 월 세전 급여가 ${won(nominalMonthly)} 늘지만, 통장에 더 들어오는 금액은 ${won(realMonthly)}입니다. 차액 ${won(nominalMonthly - realMonthly)}은 인상분에 새로 붙는 4대보험 ${won(to.totalInsurance - from.totalInsurance)}과 소득세·지방소득세 ${won(to.totalTax - from.totalTax)}입니다. 비교를 <strong>인상률이 아니라 이 금액으로 시작해야</strong> 뒤 단계의 판단이 흔들리지 않습니다.`,
          `남는 비율은 연봉대마다 다릅니다. 같은 ${manWon(10_000_000)} 인상이라도 ${manWon(70_000_000)} → ${manWon(80_000_000)}에서는 ${pct(highRetention)}만 남아, ${manWon(50_000_000)} 구간의 ${pct(retention)}보다 ${((retention - highRetention) * 100).toFixed(1)}%p 낮습니다.`,
        ],
      },
      {
        h3: `2단계 — 제안 연봉 ${manWon(60_000_000)}의 월 입금액은 ${won(to.monthlyNet)}이다`,
        body: [
          `1단계는 차액을, 2단계는 절대 금액을 봅니다. 월 세전 ${won(to.monthlyGross)}에서 4대보험 ${won(to.totalInsurance)}과 소득세·지방소득세 ${won(to.totalTax)}이 빠져 ${won(to.monthlyNet)}이 남고, 공제율은 ${pct(to.effectiveTaxRate, 2)}입니다. 이사·주거비처럼 이직에 따라 새로 생기는 월 고정비는 이 금액과 견줘야 합니다.`,
          `공제율은 연봉과 함께 오릅니다. 현재 연봉 ${manWon(50_000_000)}의 공제율은 ${pct(from.effectiveTaxRate, 2)}이므로, 제안을 받아들이면 세전은 ${pct((60_000_000 - 50_000_000) / 50_000_000)} 오르지만 공제율은 ${((to.effectiveTaxRate - from.effectiveTaxRate) * 100).toFixed(2)}%p 높아집니다.`,
        ],
      },
      {
        h3: `3단계 — 연봉 ${manWon(capReach)}을 완전히 넘긴 인상분에는 국민연금이 1원도 붙지 않는다`,
        body: [
          `4대보험 중 상한이 있는 것은 국민연금뿐입니다. 기준소득월액 상한 ${won(RATES_2026.nationalPension.maxMonthlyIncome)}은 비과세 식대 월 ${won(200_000)} 기준으로 연봉 ${won(capReach)}에서 닿습니다. 그 아래인 ${manWon(70_000_000)} → ${manWon(80_000_000)} 구간에서는 국민연금 공제가 ${won(pensionStepBelow)} 늘지만, 상한을 건너는 ${manWon(80_000_000)} → ${manWon(90_000_000)} 구간에서는 ${won(pensionStepAbove)}밖에 늘지 않고, 상한을 완전히 넘긴 ${manWon(90_000_000)} → ${manWon(100_000_000)} 구간에서는 ${won(fullyAbove.pensionStep)}입니다. 정률이었다면 세 구간 모두 ${won(proportional)} 안팎이 늘었어야 하는 자리입니다.`,
          `효과는 잔존율에서 그대로 보이지만 <strong>두 칸에서만</strong> 보입니다. ${manWon(70_000_000)} → ${manWon(80_000_000)}의 ${pct(highBand.retention)}에서 ${manWon(80_000_000)} → ${manWon(90_000_000)} ${pct(crossing.retention)}, ${manWon(90_000_000)} → ${manWon(100_000_000)} ${pct(fullyAbove.retention)}으로 되올라갔다가, ${manWon(110_000_000)} → ${manWon(120_000_000)}에서는 소득세 구간이 다시 올라가 ${pct(taxWinsAgain.retention)}로 내려갑니다. 상한 통과가 만드는 반등은 그 위의 누진을 이기지 못합니다. 또 보험료가 줄어드는 것은 그해의 현금 이야기이므로, 노후 연금액은 <a href="/finance/pension">국민연금 예상 수령액 계산기</a>에서 따로 확인해야 합니다.`,
        ],
      },
      {
        h3: `4단계 — 같은 5% 인상의 잔존율이 ${pct(lowRaise.retention)}에서 ${pct(topRaise.retention)}까지 갈린다`,
        body: [
          `인상률만 비교하면 두 제안이 같아 보일 수 있습니다. 5%라는 같은 숫자를 세 연봉대에 넣으면 월 실수령 증가액이 ${manWon(lowRaise.gross)}에서 ${won(lowRaise.impact.monthlyNetDiff)}, ${manWon(midRaise.gross)}에서 ${won(midRaise.impact.monthlyNetDiff)}, ${manWon(topRaise.gross)}에서 ${won(topRaise.impact.monthlyNetDiff)}이고, 인상액 중 남는 비율은 ${pct(lowRaise.retention)} → ${pct(midRaise.retention)} → ${pct(topRaise.retention)}로 내려갑니다.`,
          `빠져나가는 돈의 성격도 바뀝니다. ${manWon(lowRaise.gross)}에서는 인상분에서 빠지는 보험료 ${won(lowRaise.impact.insuranceDelta)}이 세금 ${won(lowRaise.impact.taxDelta)}보다 크지만, ${manWon(topRaise.gross)}에서는 세금 ${won(topRaise.impact.taxDelta)}이 보험료 ${won(topRaise.impact.insuranceDelta)}의 ${(topRaise.impact.taxDelta / topRaise.impact.insuranceDelta).toFixed(1)}배가 됩니다.`,
        ],
      },
      {
        h3: `5단계 — 사이닝 보너스 ${manWon(10_000_000)}의 세후는 ${won(bonus.netBonus)}이다`,
        body: [
          `성과급과 사이닝 보너스는 총 보상 비교의 마지막 조각입니다. 연봉 ${manWon(50_000_000)}인 사람이 ${manWon(10_000_000)}을 더 받으면 세금과 보험료로 ${won(bonus.bonusTax)}이 나가고 ${won(bonus.netBonus)}이 남아, 수령률은 ${pct(bonus.effectiveBonusRate)}입니다. 연봉 ${manWon(70_000_000)}이라면 같은 금액의 수령률이 ${pct(bonusHigh.effectiveBonusRate)}로 내려갑니다.`,
          `여기서 세 단계가 한 숫자로 모입니다. 1단계의 ${pct(retention)}, 4단계 ${manWon(midRaise.gross)} 구간의 ${pct(midRaise.retention)}, 5단계의 ${pct(bonus.effectiveBonusRate)}가 모두 같은 값입니다. 연봉 ${manWon(50_000_000)}에서 세전으로 더 받는 돈은 <strong>이름이 무엇이든 같은 비율로 깎여</strong> 들어온다는 뜻이라, 협상에서는 항목을 늘리는 것보다 세전 총액을 올리는 편이 단순합니다.`,
        ],
      },
    ],
    table: {
      head: ["현재 연봉", "1,000만원 인상 시 월 실수령 증가", "인상분 잔존율", "5% 인상 시 월 증가", "성과급 1,000만원의 세후", "국민연금 상한"],
      rows: [30_000_000, 50_000_000, 80_000_000].map((gross) => {
        const step = stepRetention(gross);
        const raise = calcRaiseImpact({ currentAnnual: gross, raisePercent: 5 });
        const bonusHere = calcBonusImpact({ annualSalary: gross, bonusAmount: 10_000_000 });
        return {
          highlight: gross === 50_000_000,
          cells: [
            manWon(gross),
            `<strong>${won(step.netStep)}</strong>`,
            pct(step.retention),
            won(raise.monthlyNetDiff),
            won(bonusHere.netBonus),
            payroll(gross).taxableMonthly >= RATES_2026.nationalPension.maxMonthlyIncome ? "도달" : "미도달",
          ],
        };
      }),
    },
    tableNote: `부양가족 1인·비과세 식대 월 ${won(200_000)}·자녀 없음 기준입니다. 잔존율 열과 성과급 세후 열의 비율이 같은 행에서 일치하는 것은 우연이 아니라, 세전으로 더 받는 돈이 항목과 무관하게 같은 한계 공제를 거치기 때문입니다.`,
    callout: `<strong>다섯 단계를 한 문장으로</strong> — 연봉 ${manWon(50_000_000)}에서 ${manWon(60_000_000)} 제안을 받았다면, 월 실수령은 ${won(realMonthly)} 늘고 공제율은 ${pct(to.effectiveTaxRate, 2)}가 되며 세전으로 더 받는 모든 돈의 ${pct(retention)}가 남습니다.`,
  };
}

export function jobChangeTimingDigest() {
  const current = payroll(50_000_000);
  const offer = payroll(60_000_000);
  const monthlyGain = offer.monthlyNet - current.monthlyNet;

  const oneYearSeverance = current.monthlyGross;
  const oneYearTax = severanceIncomeTax(oneYearSeverance, 1);
  const oneYearNet = oneYearSeverance - oneYearTax;

  // Smallest monthly average wage that already reaches the daily-allowance ceiling.
  const ceilingWage = (() => {
    for (let monthly = 2_000_000; monthly <= 6_000_000; monthly += 1_000) {
      if (unemploymentDailyAllowance(monthly).dailyAmount >= UNEMPLOYMENT_DAILY_MAX) return monthly;
    }
    return 0;
  })();
  const ceilingGross = ceilingWage * 12;
  const ceilingMonthly = UNEMPLOYMENT_DAILY_MAX * 30;

  const baseOnlyOffer = payroll(60_000_000);
  const splitOffer = payroll(50_000_000);
  const bonusOnTop = calcBonusImpact({ annualSalary: 50_000_000, bonusAmount: 10_000_000 });

  const provisionGain = offer.monthlyGross - current.monthlyGross;
  const annualNetGain = offer.annualNet - current.annualNet;
  const totalGain = annualNetGain + provisionGain;

  return {
    h2: "옮기는 시점이 금액을 바꾸는 세 자리",
    body: [
      "제안을 받아들일지와 별개로, <strong>언제 나가느냐</strong>가 금액을 바꾸는 자리가 있습니다. 아래 세 가지는 계산기 두 개를 이어 붙여야 보이는 값이라 어느 한 단계에도 들어 있지 않습니다.",
    ],
    blocks: [
      {
        h3: `근속 11개월과 12개월 사이에 ${won(oneYearNet)}이 있다`,
        body: [
          `퇴직금은 근속 1년부터 발생합니다. 연봉 ${manWon(50_000_000)}으로 1년을 채우고 나가면 퇴직금이 세전 ${won(oneYearSeverance)}, 퇴직소득세 ${won(oneYearTax)}을 뺀 세후 ${won(oneYearNet)}이지만, 11개월에서 나가면 ${won(0)}입니다.`,
          `한 달을 더 기다리는 대가는 새 직장 인상분 한 달치입니다. ${manWon(50_000_000)} → ${manWon(60_000_000)} 이직의 월 실수령 증가가 ${won(monthlyGain)}이므로, 기다려서 얻는 순증은 ${won(oneYearNet)} − ${won(monthlyGain)} = <strong>${won(oneYearNet - monthlyGain)}</strong>, 인상분 ${((oneYearNet - monthlyGain) / monthlyGain).toFixed(1)}개월치입니다. 이 계산은 새 직장 입사일을 한 달 미룰 수 있을 때만 성립하고, 제안이 철회되는 위험은 금액으로 환산되지 않습니다.`,
        ],
      },
      {
        h3: `연봉이 ${manWon(ceilingGross)}을 넘으면 실직 시 안전망은 일액 ${won(UNEMPLOYMENT_DAILY_MAX)}에서 멈춘다`,
        body: [
          `이직에는 실패 가능성이 따라옵니다. 그런데 실업급여 일액에는 상한이 있어, 평균임금 월 ${won(ceilingWage)}(연봉 ${manWon(ceilingGross)})에서 이미 상한 ${won(UNEMPLOYMENT_DAILY_MAX)}에 닿습니다. 그 위로는 연봉이 ${manWon(60_000_000)}이든 ${manWon(120_000_000)}이든 30일 기준 ${won(ceilingMonthly)}으로 같습니다.`,
          `하한도 좁습니다. 하한 ${won(UNEMPLOYMENT_DAILY_MIN)}은 2026년 최저시급 ${won(MIN_WAGE_HOURLY)}에 8시간과 80%를 곱한 값이라, 상·하한 사이의 폭은 하루 ${won(UNEMPLOYMENT_DAILY_MAX - UNEMPLOYMENT_DAILY_MIN)}에 불과합니다. 연봉을 올려 실업급여를 늘리는 것은 사실상 불가능하므로, 이직 실패에 대비한 완충은 <strong>수급액이 아니라 수급일수와 저축</strong>에서 만들어야 합니다.`,
        ],
      },
      {
        h3: `다섯 단계를 합치면 연 ${won(totalGain)}, 명목 인상액의 ${pct(totalGain / 10_000_000)}다`,
        body: [
          `앞 단계들이 각각 내놓은 값을 한 해로 모으면 제안의 실제 크기가 나옵니다. 월 실수령이 ${won(monthlyGain)} 늘어 연 ${won(annualNetGain)}이고, 퇴직금 적립의 기준이 되는 월 세전 급여가 ${won(current.monthlyGross)}에서 ${won(offer.monthlyGross)}으로 올라 1년마다 쌓이는 퇴직급여도 ${won(provisionGain)} 커집니다. 둘을 더하면 연 ${won(totalGain)}으로, 명목 인상액 ${manWon(10_000_000)}의 ${pct(totalGain / 10_000_000)}입니다.`,
          `퇴직급여 몫은 근속 1년을 채워야 생기므로, 새 직장에서 1년을 못 채우면 이 계산에서 ${won(provisionGain)}을 빼야 합니다. 그러면 실제 증가는 연 ${won(annualNetGain)}, 명목의 ${pct(annualNetGain / 10_000_000)}로 내려갑니다.`,
        ],
      },
      {
        h3: `세금은 이름을 보지 않는다 — 기본급 ${manWon(60_000_000)}과 "기본급 ${manWon(50_000_000)} + 성과급 ${manWon(10_000_000)}"의 연 실수령은 원 단위까지 같다`,
        body: [
          `두 제안의 총액이 같다면 연 실수령도 같습니다. 기본급만 ${manWon(60_000_000)}인 쪽의 연 실수령은 ${won(baseOnlyOffer.annualNet)}이고, 기본급 ${manWon(50_000_000)}에 성과급 ${manWon(10_000_000)}을 받는 쪽은 연 실수령 ${won(splitOffer.annualNet)}에 세후 성과급 ${won(bonusOnTop.netBonus)}을 더해 ${won(splitOffer.annualNet + bonusOnTop.netBonus)}입니다. 소득세와 4대보험은 항목 이름이 아니라 <strong>한 해의 합계</strong>만 보기 때문입니다.`,
          `갈리는 것은 시점입니다. 앞쪽은 매달 ${won(baseOnlyOffer.monthlyNet - splitOffer.monthlyNet)}이 더 들어오고, 뒤쪽은 열두 달 내내 ${won(splitOffer.monthlyNet)}만 들어오다가 지급월에 ${won(bonusOnTop.netBonus)}이 한 번에 들어옵니다. 월 고정비가 빠듯하거나 성과급 지급 요건(지급 기준일 재직)이 불확실하다면 <strong>같은 총액이라도 앞쪽이 안전합니다</strong>. 퇴직금과 연차수당의 단가가 기본급을 따르는 문제는 <a href="/finance/compare">이직 연봉 비교 계산기</a>에서 따로 다룹니다.`,
        ],
      },
    ],
  };
}

// =========================================================================
// /guide/resignation
// =========================================================================
const QUIT_YEARS = [1, 3, 5, 10];
const QUIT_LIVING_COST = 2_000_000;

function unemploymentDaysFor(years) {
  if (years >= 10) return 240;
  if (years >= 5) return 210;
  if (years >= 3) return 180;
  if (years >= 1) return 150;
  return 120;
}

function quitResources(years) {
  const estimate = severancePayEstimate(years);
  const { dailyAmount } = unemploymentDailyAllowance(estimate.avgWage);
  const days = unemploymentDaysFor(years);
  const unemploymentTotal = dailyAmount * days;
  const voluntary = regionalHealthEstimate(estimate.avgWage).formerEmployed;
  const total = estimate.netSeverance + unemploymentTotal;
  return {
    years,
    estimate,
    dailyAmount,
    days,
    unemploymentTotal,
    voluntary,
    total,
    monthsLivingOnly: total / QUIT_LIVING_COST,
    monthsWithPremium: total / (QUIT_LIVING_COST + voluntary),
  };
}

export function resignationStepAmountsDigest() {
  const rows = QUIT_YEARS.map(quitResources);
  const five = rows.find((row) => row.years === 5);

  const bonusIncluded = five.estimate.avgWage * 5;
  const bonusExcluded = 3_000_000 * 5;
  const bonusNetGap =
    bonusIncluded -
    severanceIncomeTax(bonusIncluded, 5) -
    (bonusExcluded - severanceIncomeTax(bonusExcluded, 5));

  const monthlyAllowance = five.dailyAmount * 30;
  const severanceMonths = five.estimate.netSeverance / monthlyAllowance;

  const reference = payroll(50_000_000);
  const voluntaryPremium = regionalHealthEstimate(reference.monthlyGross).formerEmployed;
  const regionalFloor = regionalHealthEstimate(0).regionalIncomeOnly;
  const crossoverIncome = (() => {
    for (let monthly = 0; monthly <= 10_000_000; monthly += 1_000) {
      if (regionalHealthEstimate(monthly).regionalIncomeOnly >= voluntaryPremium) return monthly;
    }
    return 0;
  })();

  const delayDays = 100;
  const delayInterest = unpaidWageInterest(five.estimate.severance, 0.2, delayDays);
  const employedInterest = unpaidWageInterest(five.estimate.severance, 0.05, delayDays);

  const netToGross = (monthlyNet) => {
    let low = 10_000_000;
    let high = 60_000_000;
    for (let i = 0; i < 60; i += 1) {
      const mid = Math.floor((low + high) / 2);
      if (payroll(mid).monthlyNet >= monthlyNet) high = mid;
      else low = mid + 1;
    }
    return high;
  };
  const floorEquivalent = netToGross(UNEMPLOYMENT_DAILY_MIN * 30);
  const ceilingEquivalent = netToGross(UNEMPLOYMENT_DAILY_MAX * 30);

  return {
    h2: "여섯 단계에서 나오는 여섯 개의 금액",
    body: [
      `퇴사는 들어오는 돈과 나가는 돈이 동시에 생기는 사건이라, 순서를 지켜 계산하지 않으면 어느 쪽도 정확해지지 않습니다. 아래는 근속 5년·월 급여 ${won(3_000_000)}(상여 포함 평균임금 ${won(five.estimate.avgWage)})을 기준으로 각 단계가 내놓는 금액입니다.`,
    ],
    blocks: [
      {
        h3: `1단계 — 총재원 ${won(five.total)}은 ${five.monthsLivingOnly.toFixed(1)}개월이 아니라 ${five.monthsWithPremium.toFixed(1)}개월이다`,
        body: [
          `퇴직금 세후 ${won(five.estimate.netSeverance)}과 실업급여 ${won(five.unemploymentTotal)}을 더하면 근속 5년의 총재원은 ${won(five.total)}입니다. 월 생활비 ${won(QUIT_LIVING_COST)}으로 나누면 ${five.monthsLivingOnly.toFixed(1)}개월이지만, 재직 중에는 없던 건강보험료가 매달 새로 나갑니다. 임의계속가입 보험료 ${won(five.voluntary)}을 지출에 넣으면 ${five.monthsWithPremium.toFixed(1)}개월로 내려갑니다. 그 기간에 보험료로만 ${won(Math.round(five.voluntary * five.monthsWithPremium))}, 총재원의 ${pct((five.voluntary * five.monthsWithPremium) / five.total)}가 나갑니다.`,
          `줄어드는 폭은 근속이 길수록 커집니다. 근속 ${rows[3].years}년이면 총재원이 ${won(rows[3].total)}으로 늘어나는 대신 보험료를 내는 기간도 길어져 ${rows[3].monthsLivingOnly.toFixed(1)}개월이 ${rows[3].monthsWithPremium.toFixed(1)}개월이 됩니다.`,
        ],
        table: {
          head: ["근속", "퇴직금 (세후)", "실업급여 총액", "총재원", "생활비만", "보험료 포함"],
          rows: rows.map((row) => ({
            highlight: row.years === 5,
            cells: [
              `${row.years}년`,
              won(row.estimate.netSeverance),
              won(row.unemploymentTotal),
              `<strong>${won(row.total)}</strong>`,
              `${row.monthsLivingOnly.toFixed(1)}개월`,
              `${row.monthsWithPremium.toFixed(1)}개월`,
            ],
          })),
        },
        tableNote: `월 생활비 ${won(QUIT_LIVING_COST)}과 임의계속가입 보험료 ${won(five.voluntary)}을 지출로 잡았습니다. 재산·자동차에 매겨지는 지역가입 점수는 편차가 커서 제외했으므로, 실제 보험료는 이보다 클 수 있습니다.`,
      },
      {
        h3: `2단계 — 상여가 평균임금에 들어가느냐로 ${won(bonusNetGap)}이 갈린다`,
        body: [
          `퇴직금은 연봉이 아니라 <strong>퇴직 전 3개월 평균임금</strong>으로 계산합니다. 월 급여 ${won(3_000_000)}에 정기 상여가 산입돼 평균임금이 ${won(five.estimate.avgWage)}이 되면 근속 5년 퇴직금이 세전 ${won(bonusIncluded)}이지만, 상여가 빠지면 ${won(bonusExcluded)}입니다. 퇴직소득세를 뺀 세후 차이는 ${won(bonusNetGap)}입니다.`,
          `그래서 이 단계에서 확인할 것은 계산 결과가 아니라 <strong>입력값</strong>입니다. 직전 3개월 급여명세서에 연차수당·정기상여가 어떻게 잡혔는지에 따라 같은 근속에서도 결과가 이만큼 움직입니다.`,
        ],
      },
      {
        h3: `3단계 — 퇴직금은 실업급여 ${severanceMonths.toFixed(1)}개월분이고, 수급일수는 ${(five.days / 30).toFixed(0)}개월분이다`,
        body: [
          `두 재원은 성격이 다릅니다. 퇴직금은 한 번에 들어오는 목돈이고 실업급여는 매달 나오는 흐름입니다. 같은 단위로 바꾸면 비교가 됩니다. 근속 5년의 퇴직금 세후 ${won(five.estimate.netSeverance)}은 월 ${won(monthlyAllowance)}인 실업급여의 ${severanceMonths.toFixed(1)}개월분이고, 실제 수급일수 ${five.days}일은 ${(five.days / 30).toFixed(0)}개월분입니다.`,
          `즉 근속 5년에서는 <strong>퇴직금이 실업급여보다 더 오래 버티게 해 줍니다</strong>. 다만 이 관계는 근속에 따라 뒤집혀서, 근속 ${rows[0].years}년에서는 퇴직금이 ${(rows[0].estimate.netSeverance / (rows[0].dailyAmount * 30)).toFixed(1)}개월분에 그쳐 수급일수 ${rows[0].days}일보다 짧습니다.`,
        ],
      },
      {
        h3: `4단계 — 소득이 끊기면 지역가입이 더 싸고, 경계는 월 소득 ${won(crossoverIncome)}이다`,
        body: [
          `"퇴사하면 임의계속가입이 유리하다"는 말은 조건부로만 참입니다. 연봉 ${manWon(50_000_000)}이던 사람의 임의계속 보험료는 ${won(voluntaryPremium)}으로 고정되지만, 지역가입자 보험료의 소득분은 실제 소득을 따라 움직여 소득이 0이면 하한 ${won(regionalFloor)}까지 내려갑니다.`,
          `두 금액이 같아지는 자리는 월 소득 ${won(crossoverIncome)}입니다. 그 아래에서는 지역가입이 싸고, 그 위에서는 임의계속이 쌉니다. 그래서 이 단계의 판단은 "퇴사 후 소득이 이어지는가"이며, 첫 지역보험료 고지서를 받아 본 뒤 결정해도 되도록 신청 기한이 <strong>첫 납부기한에서 2개월</strong> 주어집니다. 다만 지역가입 보험료에는 재산·자동차 점수가 더해지므로, 위 비교는 소득분만 놓고 본 하한선입니다.`,
        ],
      },
      {
        h3: `5단계 — 퇴직금 ${won(five.estimate.severance)}이 ${delayDays}일 밀리면 ${won(delayInterest)}이 붙는다`,
        body: [
          `앞 단계에서 계산한 금액은 그대로 청구액이 됩니다. 근속 5년 퇴직금 ${won(five.estimate.severance)}이 지급되지 않은 채 ${delayDays}일이 지나면 근로기준법상 연 20%로 ${won(delayInterest)}의 지연이자가 붙습니다. 재직 중 체불에 적용되는 민법 5%였다면 ${won(employedInterest)}이므로, 퇴직을 기점으로 이자가 ${(delayInterest / employedInterest).toFixed(0)}배가 됩니다.`,
          `기산일에 주의해야 합니다. 20%는 퇴직일이 아니라 <strong>금품 청산 기한 14일이 지난 다음 날</strong>부터 붙으므로, 지연 ${delayDays}일은 퇴직 ${delayDays + 14}일째를 뜻합니다.`,
        ],
      },
      {
        h3: `6단계 — 실업급여 월 ${won(UNEMPLOYMENT_DAILY_MIN * 30)}은 연봉 ${manWon(floorEquivalent)}짜리 직장의 실수령과 같다`,
        body: [
          `마지막 단계에서 다음 직장의 제안을 비교할 때 기준선이 필요합니다. 실업급여 하한 ${won(UNEMPLOYMENT_DAILY_MIN)}은 30일 기준 ${won(UNEMPLOYMENT_DAILY_MIN * 30)}으로, 연봉 ${won(floorEquivalent)}인 직장의 월 실수령과 같습니다. 상한 ${won(UNEMPLOYMENT_DAILY_MAX)}이라면 월 ${won(UNEMPLOYMENT_DAILY_MAX * 30)}, 연봉 ${won(ceilingEquivalent)}에 해당합니다.`,
          `수급 기간에는 이 금액이 세금과 보험료 없이 그대로 들어옵니다. 직전 평균임금이 상한에 닿는 사람이라면, 급하게 잡은 제안이 연봉 ${manWon(ceilingEquivalent)}에 못 미칠 때 수급 기간을 다 쓰며 더 나은 제안을 찾는 쪽이 <strong>단기 현금 기준으로는 손해가 아닙니다</strong>. 하한만 받는 사람의 기준선은 ${manWon(floorEquivalent)}으로 내려가고, 경력 공백과 수급 자격 요건은 금액과 별개로 판단해야 합니다.`,
        ],
      },
    ],
  };
}

export function resignationSettlementDigest() {
  const five = quitResources(5);
  const leaveRows = QUIT_YEARS.map((years) => ({
    years,
    ...calcAnnualLeavePay({
      monthlySalary: 3_000_000,
      fixedAllowance: 0,
      monthsWorked: years * 12,
      unusedLeaveDays: 30,
    }),
  }));
  const leaveFive = leaveRows.find((row) => row.years === 5);
  const leaveShare = leaveFive.totalAllowance / five.unemploymentTotal;

  // Mid-year leaver: the employer withholds one twelfth of a full year's tax every month,
  // but the final assessment only counts the months actually worked. The settlement is
  // therefore computed on the wages received - NOT by re-running the annual breakdown on a
  // smaller "salary", which would wrongly subtract twelve months of the meal allowance and
  // twelve months of insurance from a six-month income.
  const midYear = (grossAnnual, monthsWorked) => {
    const full = payroll(grossAnnual);
    const withheld = (full.monthlyIncomeTax + full.monthlyLocalTax) * monthsWorked;
    const bundle = calcIncomeTaxBundle({
      annualTaxableIncome: (full.monthlyGross - GUIDE_PAYROLL.nonTaxableMonthly) * monthsWorked,
      dependents: GUIDE_PAYROLL.dependents,
      children: GUIDE_PAYROLL.children,
      monthlyInsuranceTotal: (full.totalInsurance * monthsWorked) / 12,
    });
    const determined = bundle.determinedTax + bundle.annualLocalTax;
    return { withheld, determined, refund: withheld - determined };
  };
  const halfYear = midYear(50_000_000, 6);
  const quarter = midYear(50_000_000, 3);
  // Unused annual leave is ordinary wage income, so it lands in the same year-end settlement.
  const withLeaveDetermined = (() => {
    const full = payroll(50_000_000);
    const bundle = calcIncomeTaxBundle({
      annualTaxableIncome:
        (full.monthlyGross - GUIDE_PAYROLL.nonTaxableMonthly) * 6 + leaveFive.totalAllowance,
      dependents: GUIDE_PAYROLL.dependents,
      children: GUIDE_PAYROLL.children,
      monthlyInsuranceTotal: (full.totalInsurance * 6) / 12,
    });
    return bundle.determinedTax + bundle.annualLocalTax;
  })();
  const refundDropFromLeave = withLeaveDetermined - halfYear.determined;

  const lumpSum = five.estimate.netSeverance + leaveFive.totalAllowance;
  const monthlyOut = QUIT_LIVING_COST + five.voluntary;
  const monthlyAllowance = five.dailyAmount * 30;
  const drawDownDuringBenefit = monthlyOut - monthlyAllowance;
  const benefitMonths = Math.floor(five.days / 30);
  const balanceAfterBenefit = lumpSum - drawDownDuringBenefit * benefitMonths;
  const monthsAfterBenefit = balanceAfterBenefit / monthlyOut;

  return {
    h2: "퇴사한 해에만 생기는 정산 세 가지",
    body: [
      "퇴직금과 실업급여 말고도 퇴사한 해에만 발생하는 항목이 있습니다. 셋 다 신청하거나 신고해야 받는 돈이라, 모르면 그대로 지나갑니다.",
    ],
    blocks: [
      {
        h3: `미사용 연차수당 ${won(leaveFive.totalAllowance)}은 실업급여 총액의 ${pct(leaveShare)}다`,
        body: [
          `퇴사 시점의 미사용 연차는 전부 수당으로 정산됩니다. 월 급여 ${won(3_000_000)} 기준 1일 통상임금은 ${won(leaveFive.dailyOrdinaryWage)}이고, 근속 5년의 발생일수 ${leaveFive.accruedLeaveDays}일을 모두 남겼다면 ${won(leaveFive.totalAllowance)}입니다. 실업급여 총액 ${won(five.unemploymentTotal)}의 ${pct(leaveShare)}에 해당하는 금액이라, 퇴사 재원의 세 번째 항목으로 세는 편이 맞습니다.`,
          `근속이 길수록 커지지만 완만합니다. 근속 ${leaveRows[0].years}년 ${leaveRows[0].accruedLeaveDays}일 ${won(leaveRows[0].totalAllowance)}에서 근속 ${leaveRows[3].years}년 ${leaveRows[3].accruedLeaveDays}일 ${won(leaveRows[3].totalAllowance)}까지, 근속이 열 배가 되어도 금액은 ${(leaveRows[3].totalAllowance / leaveRows[0].totalAllowance).toFixed(2)}배에 그칩니다. 발생일수가 2년마다 하루씩만 늘기 때문입니다.`,
        ],
        table: {
          head: ["근속", "연차 발생일수", "1일 통상임금", "미사용 전액 정산 시"],
          rows: leaveRows.map((row) => ({
            highlight: row.years === 5,
            cells: [
              `${row.years}년`,
              `${row.accruedLeaveDays}일`,
              won(row.dailyOrdinaryWage),
              `<strong>${won(row.totalAllowance)}</strong>`,
            ],
          })),
        },
      },
      {
        h3: `연중에 그만두면 원천징수한 ${won(halfYear.withheld)} 가운데 ${won(halfYear.refund)}이 돌려받을 돈이다`,
        body: [
          `회사는 그 사람이 1년 내내 다닐 것을 전제로 매달 세금을 뗍니다. 연봉 ${manWon(50_000_000)}인 사람이 6개월 만에 그만두면 이미 낸 소득세·지방소득세는 ${won(halfYear.withheld)}인데, 실제로 받은 급여로 다시 계산한 결정세액은 ${won(halfYear.determined)}입니다. 차액 ${won(halfYear.refund)}이 환급 대상입니다.`,
          `3개월 만에 그만두면 결정세액이 ${won(quarter.determined)}이 되어 원천징수 ${won(quarter.withheld)} <strong>전액</strong>이 돌아옵니다. 문제는 받는 방법입니다. 연말에 회사에 다니고 있지 않으면 그 회사가 연말정산을 해 주지 않으므로, 다음 해 5월 종합소득세 신고로 직접 청구해야 합니다. 신고하지 않으면 이 돈은 그대로 남습니다.`,
        ],
      },
      {
        h3: `현금이 실제로 꺾이는 것은 실업급여가 끝나는 ${benefitMonths + 1}개월째다`,
        body: [
          `퇴사 직후에는 목돈이 들어와 여유가 있어 보입니다. 근속 5년 기준으로 퇴직금 세후 ${won(five.estimate.netSeverance)}과 연차수당 ${won(leaveFive.totalAllowance)}을 합쳐 ${won(lumpSum)}이 먼저 들어오고, 수급 기간에는 실업급여 ${won(monthlyAllowance)}이 매달 들어옵니다. 지출이 생활비 ${won(QUIT_LIVING_COST)}과 보험료 ${won(five.voluntary)}을 합쳐 ${won(monthlyOut)}이므로, 이 기간에는 목돈이 <strong>월 ${won(drawDownDuringBenefit)}씩만</strong> 줄어듭니다.`,
          `${benefitMonths}개월이 지나 실업급여가 끝나면 감소 속도가 ${(monthlyOut / drawDownDuringBenefit).toFixed(0)}배로 뜁니다. 남은 ${won(balanceAfterBenefit)}이 월 ${won(monthlyOut)}씩 빠져 ${monthsAfterBenefit.toFixed(1)}개월 뒤 바닥납니다. 재취업 목표 시점을 총재원이 아니라 <strong>이 변곡점</strong>에 맞춰 잡아야 하는 이유입니다.`,
        ],
      },
      {
        h3: `연차수당 ${won(leaveFive.totalAllowance)}은 근로소득이라 환급을 ${won(refundDropFromLeave)} 깎는다`,
        body: [
          `앞의 두 항목은 서로 물려 있습니다. 연차수당은 퇴직소득이 아니라 <strong>근로소득</strong>이라 그해 총급여에 더해지므로, 정산에서 환급받을 금액이 그만큼 줄어듭니다. 연봉 ${manWon(50_000_000)}으로 6개월 일하고 나간 사람의 결정세액은 연차수당이 없으면 ${won(halfYear.determined)}인데, ${won(leaveFive.totalAllowance)}이 더해지면 ${won(withLeaveDetermined)}이 되어 환급이 ${won(halfYear.refund)}에서 ${won(halfYear.refund - refundDropFromLeave)}으로 내려갑니다.`,
          `그래도 손해는 아닙니다. 늘어난 세금 ${won(refundDropFromLeave)}은 연차수당 ${won(leaveFive.totalAllowance)}의 ${pct(refundDropFromLeave / leaveFive.totalAllowance)}에 불과해, ${pct(1 - refundDropFromLeave / leaveFive.totalAllowance)}는 그대로 남습니다. 퇴직소득세가 따로 붙는 퇴직금과 달리 연차수당은 <strong>그해 근로소득의 한계세율만큼만</strong> 부담하기 때문이고, 총급여가 낮은 연중 퇴사자일수록 이 비율이 작아집니다.`,
        ],
      },
    ],
  };
}

// =========================================================================
// /guide/year-end
// =========================================================================
const YEAR_END_REFERENCE_GROSS = 50_000_000;
const RENT_MONTHLY = 600_000;
const PENSION_ACCOUNT_LIMIT = 9_000_000;

function creditsFor(grossAnnual) {
  const base = payroll(grossAnnual);
  const totalSalary = base.annualTaxableIncome;
  const rent = calcMonthlyRentDeduction({
    annualSalary: totalSalary,
    monthlyRent: RENT_MONTHLY,
    paidMonths: 12,
  });
  const irp = calcIrpTaxCredit({
    annualSalary: totalSalary,
    pensionSavings: 6_000_000,
    irpContribution: 3_000_000,
  });
  const withDependent = payroll(grossAnnual, { dependents: 2 });
  return {
    grossAnnual,
    base,
    totalSalary,
    rent,
    irp,
    dependentValue:
      base.determinedTax + base.annualLocalTax - (withDependent.determinedTax + withDependent.annualLocalTax),
    incomeTaxCredits: rent.taxCredit + irp.taxCredit,
    determinedTax: base.determinedTax,
  };
}

export function yearEndStepValueDigest() {
  const zeroTop = (() => {
    for (let gross = 10_000_000; gross <= 40_000_000; gross += 100_000) {
      if (payroll(gross).determinedTax > 0) return gross - 100_000;
    }
    return 0;
  })();
  const firstTaxed = payroll(zeroTop + 100_000);

  const reference = creditsFor(YEAR_END_REFERENCE_GROSS);
  const single = EITC_BRACKET_TABLE.single;
  const eitcRows = [12_000_000, 16_000_000, 20_000_000, 22_000_000].map((gross) => {
    const base = payroll(gross);
    return {
      gross,
      determinedTax: base.determinedTax + base.annualLocalTax,
      eitc: eitcAmountFor(base.annualTaxableIncome, single),
    };
  });
  const eitcLow = eitcRows[0];
  const eitcGone = eitcRows[eitcRows.length - 1];
  // Gross salary at which the credit hits zero - the taper end expressed as a contract salary.
  const eitcZeroGross = (() => {
    for (let gross = 10_000_000; gross <= 40_000_000; gross += 100_000) {
      if (eitcAmountFor(payroll(gross).annualTaxableIncome, single) === 0) return gross;
    }
    return 0;
  })();

  const highBand = creditsFor(80_000_000);
  const lowMarginal = yearEndStandardScenario(YEAR_END_REFERENCE_GROSS).marginalRate;
  const highMarginal = yearEndStandardScenario(80_000_000).marginalRate;
  const deductionValueLow = Math.floor(PENSION_ACCOUNT_LIMIT * lowMarginal);
  const deductionValueHigh = Math.floor(PENSION_ACCOUNT_LIMIT * highMarginal);
  // Local-tax-inclusive savings come from the engine, not from a local multiplication: the same
  // figure is printed on /irp and /monthly-rent-deduction, and two derivations drift apart.
  const creditValueLow = reference.irp.taxCreditWithLocalTax;
  const creditValueHigh = highBand.irp.taxCreditWithLocalTax;

  const rentValue = reference.rent.taxCreditWithLocalTax;
  const stepAmounts = [
    ["2단계 · 부양가족 1인 추가", won(reference.dependentValue)],
    ["3단계 · 월세 세액공제", won(rentValue)],
    ["4단계 · 연금계좌 세액공제", won(creditValueLow)],
    ["5단계 · 근로장려금", "0원 (소득 요건 초과)"],
  ];

  return {
    h2: "다섯 공제가 실제로 돌려주는 금액",
    body: [
      `연말정산 가이드는 보통 "무엇을 챙기라"로 끝납니다. 챙길 순서를 정하려면 각 항목이 <strong>얼마를 돌려주는지</strong>를 같은 단위로 놓아야 합니다. 아래는 연봉 ${manWon(YEAR_END_REFERENCE_GROSS)}(총급여 ${won(reference.totalSalary)})을 기준으로 다섯 단계의 값어치를 계산한 것입니다. 공제의 값어치는 지방소득세 10%를 포함해 적었고, 결정세액은 소득세만 적었습니다.`,
    ],
    blocks: [
      {
        h3: `1단계 — 연봉 ${won(zeroTop)} 아래에서는 무엇을 넣어도 환급이 0원이다`,
        body: [
          `환급은 이미 낸 세금을 돌려받는 절차이므로, 낸 세금이 없으면 돌려받을 것도 없습니다. 부양가족 1인·비과세 식대 월 ${won(200_000)} 기준으로 연봉을 ${won(100_000)} 간격으로 훑으면 결정세액이 0원인 마지막 지점은 ${won(zeroTop)}이고, 바로 다음 지점인 ${won(zeroTop + 100_000)}에서야 ${won(firstTaxed.determinedTax)}이 생깁니다.`,
          `그래서 이 단계가 첫 번째입니다. 결정세액이 작으면 아래 네 단계에서 아무리 공제를 쌓아도 환급이 그 금액에서 멈추므로, <strong>다른 단계에 쓸 시간의 상한</strong>을 여기서 먼저 확인하는 셈입니다.`,
        ],
      },
      {
        h3: `2단계 — 이 판정기의 문턱은 인적공제 문턱의 20배다`,
        body: [
          `2단계에서 여는 것은 건강보험 피부양자 판정기이고, 그 문턱은 연 합산소득 ${won(20_000_000)}입니다. 그런데 연말정산 인적공제의 소득 요건은 연 소득금액 ${won(1_000_000)}으로 20배 낮습니다. <strong>두 문턱은 다른 제도의 것</strong>이라, 부모님이 피부양자로 남아 있다는 사실이 인적공제 대상이라는 뜻은 아닙니다.`,
          `인적공제 1인의 값어치는 그 사람의 한계세율을 따릅니다. 연봉 ${manWon(YEAR_END_REFERENCE_GROSS)}에서는 연 ${won(reference.dependentValue)}, 연봉 ${manWon(80_000_000)}에서는 ${won(highBand.dependentValue)}입니다. 부양가족을 누구 앞으로 올릴지 정할 때 이 차이가 그대로 금액이 됩니다.`,
        ],
      },
      {
        h3: `3단계 — 월 ${won(RENT_MONTHLY)}짜리 월세의 세액공제는 ${won(rentValue)}이다`,
        body: [
          `월 ${won(RENT_MONTHLY)}을 12개월 냈다면 연 ${won(reference.rent.yearlyRent)}이고, 공제 대상 한도 ${won(10_000_000)} 안에 들어옵니다. 총급여 ${won(reference.totalSalary)}의 공제율 ${pct(reference.rent.deductionRate, 0)}를 적용하면 소득세에서 ${won(reference.rent.taxCredit)}, 지방소득세까지 합쳐 ${won(rentValue)}이 줄어듭니다.`,
          `단계 번호는 금액 순서가 아닙니다. 이 기준에서 2단계는 ${won(reference.dependentValue)}, 3단계는 ${won(rentValue)}, 4단계는 ${won(creditValueLow)}이므로 <strong>뒤로 갈수록 커집니다</strong>. 시간이 부족하다면 순서를 뒤에서부터 밟는 편이 남는 금액이 큽니다.`,
        ],
        table: {
          head: ["단계", "돌려받는 금액 (지방소득세 포함)"],
          rows: stepAmounts.map(([label, amount]) => ({
            highlight: label.startsWith("4단계"),
            cells: [label, `<strong>${amount}</strong>`],
          })),
        },
        tableNote: `연봉 ${manWon(YEAR_END_REFERENCE_GROSS)}·총급여 ${won(reference.totalSalary)}·부양가족 1인 기준입니다. 5단계가 0원인 것은 이 총급여가 단독 가구 지급 상한 ${won(single.phaseOutEnd)}을 넘기 때문입니다.`,
      },
      {
        h3: `4단계 — 같은 ${manWon(PENSION_ACCOUNT_LIMIT)}이 소득공제일 때와 세액공제일 때 최대 ${(deductionValueHigh / creditValueHigh).toFixed(1)}배 차이가 난다`,
        body: [
          `연금계좌 납입은 세액공제이고, 신용카드나 주택청약은 소득공제입니다. 같은 ${manWon(PENSION_ACCOUNT_LIMIT)}이라도 값어치가 다릅니다. 총급여 ${won(reference.totalSalary)}에서는 한계세율이 ${pct(lowMarginal, 1)}라 소득공제 ${manWon(PENSION_ACCOUNT_LIMIT)}이 ${won(deductionValueLow)}, 세액공제는 공제율 ${pct(reference.irp.taxCreditRate, 0)}에 지방소득세를 더해 ${won(creditValueLow)}으로 <strong>${deductionValueLow === creditValueLow ? "원 단위까지 같습니다" : `${won(Math.abs(deductionValueLow - creditValueLow))} 차이입니다`}</strong>. 세액공제율 15%에 지방소득세를 더한 16.5%가 이 구간의 한계세율과 같은 숫자이기 때문입니다.`,
          `총급여가 ${won(5_500_000 * 10)}을 넘으면 관계가 깨집니다. 연봉 ${manWon(80_000_000)}(총급여 ${won(highBand.totalSalary)})에서는 한계세율이 ${pct(highMarginal, 1)}로 올라가 소득공제가 ${won(deductionValueHigh)}이 되는데, 세액공제율은 ${pct(highBand.irp.taxCreditRate, 0)}로 내려가 지방소득세를 더해도 ${won(creditValueHigh)}에 머뭅니다. 고소득 구간에서 "연금계좌부터 채우라"는 조언이 항상 맞지는 않는 이유입니다.`,
        ],
      },
      {
        h3: `5단계 — 결정세액이 0원인 사람에게 남는 유일한 항목`,
        body: [
          `앞의 네 단계는 전부 낸 세금을 돌려받는 구조라, 1단계에서 결정세액이 0원으로 나온 사람에게는 아무 소용이 없습니다. 근로장려금만 다릅니다. 연봉 ${manWon(eitcLow.gross)}이면 결정세액이 ${won(eitcLow.determinedTax)}인데도 단독 가구 기준 ${won(eitcLow.eitc)}을 받습니다.`,
          `대신 소득이 늘면 빠르게 줄어듭니다. 연봉 ${manWon(eitcRows[1].gross)}에서 ${won(eitcRows[1].eitc)}, ${manWon(eitcRows[2].gross)}에서 ${won(eitcRows[2].eitc)}으로 내려가고 ${manWon(eitcGone.gross)}에서 ${won(eitcGone.eitc)}, 지급이 완전히 끊기는 자리는 총급여가 ${won(single.phaseOutEnd)}이 되는 연봉 ${won(eitcZeroGross)}입니다. 결정세액이 처음 생기는 연봉 ${won(zeroTop + 100_000)}부터 장려금이 끊기는 ${won(eitcZeroGross)}까지는 두 제도가 겹치므로, <strong>어느 쪽도 받지 못하는 연봉 구간은 생기지 않습니다</strong>.`,
        ],
      },
    ],
  };
}

export function yearEndCeilingDigest() {
  const grid = [25_000_000, 30_000_000, 35_000_000, 40_000_000, 45_000_000, 50_000_000];
  const rows = grid.map(creditsFor);
  const crossing = (() => {
    for (let gross = 20_000_000; gross <= 90_000_000; gross += 100_000) {
      const row = creditsFor(gross);
      if (row.determinedTax >= row.incomeTaxCredits) return row;
    }
    return null;
  })();
  const low = rows[1];
  // The break-even climbs as personal exemptions shrink the tax the credits can eat into.
  const crossingByDependents = [1, 2, 3].map((dependents) => {
    for (let gross = 20_000_000; gross <= 120_000_000; gross += 100_000) {
      const base = payroll(gross, { dependents });
      const totalSalary = base.annualTaxableIncome;
      const credits =
        calcMonthlyRentDeduction({ annualSalary: totalSalary, monthlyRent: RENT_MONTHLY, paidMonths: 12 })
          .taxCredit +
        calcIrpTaxCredit({ annualSalary: totalSalary, pensionSavings: 6_000_000, irpContribution: 3_000_000 })
          .taxCredit;
      if (base.determinedTax >= credits) return { dependents, grossAnnual: gross };
    }
    return { dependents, grossAnnual: 0 };
  });
  const spouseLow = creditsFor(30_000_000);
  const spouseHigh = creditsFor(120_000_000);

  return {
    h2: "공제를 더 넣어도 환급이 늘지 않는 지점",
    body: [
      `앞 절의 다섯 단계를 전부 밟으면 세액공제가 쌓입니다. 그런데 세액공제는 결정세액을 넘을 수 없어서, 어느 지점부터는 <strong>더 넣어도 돌아오는 돈이 늘지 않습니다</strong>. 월세 ${won(RENT_MONTHLY)}과 연금계좌 한도 ${manWon(PENSION_ACCOUNT_LIMIT)}을 동시에 채웠다고 가정하고 그 경계를 찾았습니다.`,
    ],
    blocks: [
      {
        h3: `두 공제를 다 쓰려면 연봉 ${won(crossing.grossAnnual)}이 필요하다`,
        body: [
          `월세와 연금계좌를 한도까지 채우면 세액공제 합계가 ${won(low.incomeTaxCredits)}입니다. 연봉을 ${won(100_000)} 간격으로 훑어 결정세액이 이 금액을 처음 넘어서는 지점을 찾으면 ${won(crossing.grossAnnual)}이고, 그때 결정세액은 ${won(crossing.determinedTax)}입니다.`,
          `지방소득세를 넣어도 경계는 같습니다. 세액공제가 소득세를 줄이면 그 10%인 지방소득세도 함께 줄어들어 <strong>양쪽이 똑같이 1.1배</strong>가 되기 때문입니다. 그래서 비교는 소득세 기준으로 해도 되고, 실제로 돌아오는 금액만 1.1을 곱하면 됩니다.`,
        ],
        table: {
          head: ["연봉", "결정세액 (소득세)", "월세 + 연금계좌 세액공제", "그해에 사라지는 몫"],
          rows: rows.map((row) => ({
            highlight: row.grossAnnual === 50_000_000,
            cells: [
              manWon(row.grossAnnual),
              won(row.determinedTax),
              won(row.incomeTaxCredits),
              `<strong>${won(Math.max(0, row.incomeTaxCredits - row.determinedTax))}</strong>`,
            ],
          })),
        },
        tableNote: `월세 ${won(RENT_MONTHLY)}·12개월 납부, 연금저축 ${won(6_000_000)}·IRP ${won(3_000_000)} 납입을 가정했습니다. 세액공제는 다음 해로 이월되지 않으므로 마지막 열의 금액은 그해에 그대로 사라집니다.`,
      },
      {
        h3: `연봉 ${manWon(low.grossAnnual)}에서는 채운 금액의 ${pct((low.incomeTaxCredits - low.determinedTax) / low.incomeTaxCredits)}가 사라진다`,
        body: [
          `연봉 ${manWon(low.grossAnnual)}의 결정세액은 ${won(low.determinedTax)}인데 두 공제 합계는 ${won(low.incomeTaxCredits)}입니다. 차액 ${won(low.incomeTaxCredits - low.determinedTax)}은 돌려받지 못합니다. 연금계좌에 넣은 돈 자체가 사라지는 것은 아니지만, <strong>세액공제를 노린 납입이라면 그해의 목적을 달성하지 못합니다</strong>.`,
          `그래서 순서가 뒤집힙니다. 결정세액이 작은 구간에서는 한도를 채우는 것보다 1단계에서 확인한 결정세액만큼만 채우고, 남는 여력은 <a href="/finance/eitc">근로장려금</a> 요건 점검처럼 세금과 무관한 항목으로 돌리는 편이 낫습니다.`,
        ],
      },
      {
        h3: `같은 부양가족 1인이 배우자에 따라 ${(spouseHigh.dependentValue / spouseLow.dependentValue).toFixed(1)}배 차이가 난다`,
        body: [
          `맞벌이라면 공제를 누가 가져가느냐가 남습니다. 부양가족 1인을 추가했을 때 줄어드는 세금은 연봉 ${manWon(spouseLow.grossAnnual)}인 사람에게 연 ${won(spouseLow.dependentValue)}, 연봉 ${manWon(spouseHigh.grossAnnual)}인 사람에게 ${won(spouseHigh.dependentValue)}입니다. 같은 한 명이 ${(spouseHigh.dependentValue / spouseLow.dependentValue).toFixed(1)}배로 달라집니다.`,
          `이유는 두 가지가 겹칩니다. 인적공제는 과세표준을 줄이므로 값어치가 한계세율에 비례하고, 저연봉 구간에서는 산출세액이 줄면 근로소득세액공제도 함께 줄어 절감분의 일부가 상쇄됩니다. 그래서 <strong>결정세액이 큰 쪽으로 몰아 주는 것</strong>이 부부 합산 기준으로 유리합니다.`,
        ],
      },
      {
        h3: `부양가족을 한 명 더 올리면 두 공제를 다 쓰는 데 필요한 연봉이 ${won(crossingByDependents[1].grossAnnual - crossingByDependents[0].grossAnnual)} 올라간다`,
        body: [
          `인적공제도 결정세액을 줄이므로, 앞의 경계선과 서로 물려 있습니다. 부양가족 1인이면 월세와 연금계좌를 다 쓰는 최소 연봉이 ${won(crossingByDependents[0].grossAnnual)}이지만, 2인이면 ${won(crossingByDependents[1].grossAnnual)}, 3인이면 ${won(crossingByDependents[2].grossAnnual)}으로 올라갑니다. 부양가족이 한 명 늘 때마다 필요한 연봉이 ${won(crossingByDependents[1].grossAnnual - crossingByDependents[0].grossAnnual)}에서 ${won(crossingByDependents[2].grossAnnual - crossingByDependents[1].grossAnnual)}씩 밀려나는 셈입니다.`,
          `공제가 서로를 잡아먹는 관계라는 뜻이지, 부양가족을 올리지 말라는 뜻은 아닙니다. 인적공제는 세금을 먼저 줄여 주고 세액공제는 남은 세금만큼만 돌려주므로, <strong>순서상 인적공제가 이깁니다</strong>. 다만 연금계좌 납입액을 정할 때는 인적공제까지 반영한 결정세액을 기준으로 삼아야 넣은 만큼 돌아옵니다.`,
        ],
      },
    ],
  };
}

// =========================================================================
// /guide/part-time
// =========================================================================
export function partTimeThresholdDigest() {
  const conversion = wageConversion(MIN_WAGE_HOURLY);
  const postedMonthly = 2_000_000;
  const impliedHourly = Math.floor(postedMonthly / MONTHLY_HOURS_WITH_HOLIDAY);
  const monthlyShortfall = conversion.monthlyTotal - postedMonthly;

  const insuranceHourThreshold = 60;
  const weeklyForInsurance = insuranceHourThreshold / 4.345;
  const at14 = weeklyHolidayPayForHours(MIN_WAGE_HOURLY, 14);
  const at15 = weeklyHolidayPayForHours(MIN_WAGE_HOURLY, 15);
  const insurance14 = calcInsuranceAt(at14.estimatedMonthlyPay);
  const insurance15 = calcInsuranceAt(at15.estimatedMonthlyPay);
  const netStep =
    at15.estimatedMonthlyPay - insurance15 - (at14.estimatedMonthlyPay - insurance14);

  const overtimeHours = 10;
  const overtimeWithPremium = Math.floor(MIN_WAGE_HOURLY * overtimeHours * 1.5);
  const overtimeFlat = MIN_WAGE_HOURLY * overtimeHours;

  const dailyOrdinary = Math.floor((conversion.monthlyTotal / 209) * 8);
  const firstYearDays = getAnnualLeaveDays(11);
  const secondYearDays = getAnnualLeaveDays(12);
  const anniversaryDays = firstYearDays + secondYearDays;
  const anniversaryPay = anniversaryDays * dailyOrdinary;

  // Minimum-wage test on a monthly wage that already contains overtime: the premium hours
  // count as 1.5 hours of pay each, so dividing by the raw hour count overstates the rate.
  const SAMPLE_MONTHLY = 2_400_000;
  const OVERTIME_HOURS = 20;
  const naiveHourly = Math.floor(SAMPLE_MONTHLY / (MONTHLY_HOURS_WITH_HOLIDAY + OVERTIME_HOURS));
  const premiumAwareHourly = Math.floor(
    SAMPLE_MONTHLY / (MONTHLY_HOURS_WITH_HOLIDAY + OVERTIME_HOURS * 1.5),
  );

  const shortfallYear = monthlyShortfall * 12;
  const shortfallInterest = unpaidWageInterest(shortfallYear, 0.2, 100);

  const annual = conversion.monthlyTotal * 12;
  const withoutMeal = hourlyPayroll(annual);
  const withMeal = payroll(annual);
  const mealGap = withMeal.monthlyNet - withoutMeal.monthlyNet;

  return {
    h2: "다섯 단계에 걸린 여섯 개의 문턱",
    body: [
      `알바 급여는 시급 하나로 정해지지 않습니다. 주 몇 시간을 일하기로 계약했는지, 사업장 인원이 몇 명인지, 몇 달을 채웠는지에 따라 같은 시급이 다른 월급이 됩니다. 아래는 2026년 최저시급 ${won(MIN_WAGE_HOURLY)} 기준으로 각 단계에 걸려 있는 문턱과 그 문턱이 만드는 금액입니다.`,
    ],
    blocks: [
      {
        h3: `1단계 — 공고의 월 ${won(postedMonthly)}은 시급 ${won(impliedHourly)}이라는 뜻이다`,
        body: [
          `주 40시간 근무의 월 환산 시간은 주휴 8시간을 포함해 ${MONTHLY_HOURS_WITH_HOLIDAY}시간입니다. 최저시급 ${won(MIN_WAGE_HOURLY)}을 곱하면 월 ${won(conversion.monthlyTotal)}이 나옵니다. 공고에 적힌 월 ${won(postedMonthly)}을 같은 시간으로 나누면 시급 ${won(impliedHourly)}으로, 최저시급에 ${won(MIN_WAGE_HOURLY - impliedHourly)} 못 미칩니다.`,
          `차액은 월 ${won(monthlyShortfall)}, 1년이면 ${won(shortfallYear)}입니다. 이 단계에서 할 일은 계산이 아니라 <strong>비교</strong>이고, 비교 기준이 되는 숫자가 ${won(conversion.monthlyTotal)}입니다.`,
        ],
      },
      {
        h3: `2단계 — 주 ${weeklyForInsurance.toFixed(2)}시간과 15시간 사이는 보험료는 내고 주휴는 못 받는 구간이다`,
        body: [
          `주휴수당은 주 소정근로 15시간에서 켜집니다. 그런데 국민연금·건강보험이 단시간 근로자를 가입 대상으로 삼는 기준선은 <strong>월 ${insuranceHourThreshold}시간</strong>이고, 월 평균 4.345주로 환산하면 주 ${weeklyForInsurance.toFixed(2)}시간입니다. 두 문턱이 어긋나 있어서 그 사이에 좁은 구간이 생깁니다.`,
          `주 14시간이면 월 환산 ${(14 * 4.345).toFixed(1)}시간으로 가입 기준은 넘지만 주휴수당은 발생하지 않습니다. 월급이 ${won(at14.estimatedMonthlyPay)}인데 4대보험료로 ${won(insurance14)}이 빠지는 자리입니다. 주 15시간으로 한 시간만 늘리면 월급이 ${won(at15.estimatedMonthlyPay)}이 되고, 보험료 ${won(insurance15)}을 뺀 뒤에도 손에 남는 돈이 ${won(netStep)} 늘어납니다.`,
        ],
      },
      {
        h3: `3단계 — 같은 연장 ${overtimeHours}시간이 사업장 인원에 따라 ${won(overtimeWithPremium - overtimeFlat)} 갈린다`,
        body: [
          `연장·야간·휴일근로의 50% 가산은 상시 5명 이상 사업장에만 적용됩니다. 최저시급으로 월 ${overtimeHours}시간을 더 일했다면 5인 이상에서는 ${won(overtimeWithPremium)}, 5인 미만에서는 가산 없이 ${won(overtimeFlat)}입니다. 차이는 월 ${won(overtimeWithPremium - overtimeFlat)}, 1년이면 ${won((overtimeWithPremium - overtimeFlat) * 12)}입니다.`,
          `그래서 이 단계에서 먼저 확인할 것은 시간이 아니라 <strong>사업장 인원</strong>입니다. 근로계약서에 적히지 않는 정보이므로 4대보험 가입자 수나 근무표로 가늠해야 합니다.`,
        ],
      },
      {
        h3: `4단계 — 1년 하루를 채우면 연차가 ${anniversaryDays}일이 되고 그 수당은 월급의 ${pct(anniversaryPay / conversion.monthlyTotal)}다`,
        body: [
          `1년 미만 구간에는 개근한 달마다 연차 1일이 생겨 최대 ${firstYearDays}일까지 쌓이고, 1년을 채우는 순간 ${secondYearDays}일이 새로 발생합니다. 둘은 별개라 <strong>합계 ${anniversaryDays}일</strong>이 됩니다.`,
          `금액으로 보면 크기가 분명해집니다. 주 40시간 최저시급 알바의 1일 통상임금은 ${won(dailyOrdinary)}이므로 ${anniversaryDays}일은 ${won(anniversaryPay)}이고, 그 달 월급 ${won(conversion.monthlyTotal)}의 ${pct(anniversaryPay / conversion.monthlyTotal)}에 해당합니다. 계약 종료일이 입사 1주년 직전이라면 며칠 차이로 이 금액이 갈립니다.`,
        ],
      },
      {
        h3: `5단계 — 미달 차액 ${won(shortfallYear)}에 지연이자 ${won(shortfallInterest)}이 얹힌다`,
        body: [
          `1단계에서 계산한 월 ${won(monthlyShortfall)}이 12개월 쌓이면 ${won(shortfallYear)}입니다. 이 금액이 퇴직 후에도 지급되지 않으면 근로기준법상 연 20%의 지연이자가 붙어, 100일이면 ${won(shortfallInterest)}이 붙습니다.`,
          `앞의 네 단계에서 나온 금액을 모두 더한 값과 실제 입금액의 차액이 그대로 청구액이 됩니다. 주휴수당·가산수당·연차수당은 각각 다른 문턱에서 발생하므로, <strong>어느 문턱을 넘었는지</strong>를 먼저 확정해야 청구 금액이 흔들리지 않습니다.`,
        ],
      },
      {
        h3: `연장수당이 섞인 월급을 시간으로 그냥 나누면 시급이 ${won(naiveHourly - premiumAwareHourly)} 부풀려진다`,
        body: [
          `월급에 연장근로수당이 포함돼 있으면 최저임금 판정이 한 단계 복잡해집니다. 연장근로에는 50% 가산이 붙으므로, 같은 임금이 <strong>더 적은 시간</strong>에 해당하기 때문입니다. 월 ${won(SAMPLE_MONTHLY)}에 월 ${OVERTIME_HOURS}시간의 연장근로가 포함된 계약을 보겠습니다.`,
          `소정근로 ${MONTHLY_HOURS_WITH_HOLIDAY}시간에 연장 ${OVERTIME_HOURS}시간을 그냥 더해 ${(MONTHLY_HOURS_WITH_HOLIDAY + OVERTIME_HOURS).toFixed(1)}시간으로 나누면 시급이 ${won(naiveHourly)}으로 최저시급 ${won(MIN_WAGE_HOURLY)}을 ${naiveHourly >= MIN_WAGE_HOURLY ? "넘습니다" : "밑돕니다"}. 그런데 연장 ${OVERTIME_HOURS}시간은 임금으로 ${(OVERTIME_HOURS * 1.5).toFixed(0)}시간분이므로 ${(MONTHLY_HOURS_WITH_HOLIDAY + OVERTIME_HOURS * 1.5).toFixed(1)}시간으로 나누는 것이 맞고, 그러면 ${won(premiumAwareHourly)}으로 <strong>${premiumAwareHourly < MIN_WAGE_HOURLY ? `최저시급에 ${won(MIN_WAGE_HOURLY - premiumAwareHourly)} 미달입니다` : `최저시급을 ${won(premiumAwareHourly - MIN_WAGE_HOURLY)} 넘습니다`}</strong>. 같은 계약이 계산 방식 하나로 합법과 위반을 오가는 구간이라, 연장근로가 포함된 월급제 알바는 이 나눗셈부터 다시 해야 합니다.`,
        ],
      },
      {
        h3: `여섯 번째 문턱 — 비과세 식대가 없으면 같은 연봉이라도 연 ${won(mealGap * 12)}을 덜 받는다`,
        body: [
          `주 40시간 최저시급을 1년으로 환산하면 ${won(annual)}입니다. 같은 금액을 받는 직장인이 비과세 식대 월 ${won(200_000)}을 인정받으면 월 실수령이 ${won(withMeal.monthlyNet)}이지만, 비과세 항목이 없는 알바 명세서로는 ${won(withoutMeal.monthlyNet)}입니다. 차이는 월 ${won(mealGap)}, 연 ${won(mealGap * 12)}입니다.`,
          `내역은 4대보험 ${won(withoutMeal.totalInsurance - withMeal.totalInsurance)}과 소득세·지방소득세 ${won(withoutMeal.totalTax - withMeal.totalTax)}입니다. 시급 협상이 어려운 자리라면 <strong>식대를 비과세 항목으로 명세서에 올려 달라고 요청하는 것</strong>이 같은 인건비 안에서 실수령을 올리는 방법입니다.`,
        ],
      },
    ],
    table: {
      head: ["문턱", "기준", "넘으면 달라지는 금액"],
      rows: [
        { cells: ["최저시급", `시급 ${won(MIN_WAGE_HOURLY)}`, `주 40시간 기준 월 ${won(conversion.monthlyTotal)}`] },
        { cells: ["4대보험 가입", `월 ${insuranceHourThreshold}시간(주 ${weeklyForInsurance.toFixed(2)}시간)`, `주 14시간에서 월 ${won(insurance14)}`] },
        { highlight: true, cells: ["주휴수당", "주 소정근로 15시간", `주 14 → 15시간에서 세후 월 ${won(netStep)}`] },
        { cells: ["가산수당 50%", "상시 5명 이상", `월 연장 ${overtimeHours}시간에서 ${won(overtimeWithPremium - overtimeFlat)}`] },
        { cells: ["연차", "1년 하루", `${anniversaryDays}일 · ${won(anniversaryPay)}`] },
        { cells: ["지연이자 20%", "퇴직 후 14일", `미달분 ${won(shortfallYear)} 기준 100일에 ${won(shortfallInterest)}`] },
      ],
    },
    tableNote: `2026년 최저시급 ${won(MIN_WAGE_HOURLY)}·월 평균 4.345주·주휴 포함 월 ${MONTHLY_HOURS_WITH_HOLIDAY}시간 기준입니다. 여섯 문턱은 서로 다른 법 조항에서 나오므로 하나를 넘었다고 나머지가 함께 켜지지는 않습니다.`,
  };
}

// Local helper: the payroll engine's insurance block for a given monthly gross with no
// non-taxable line. Declared after use above on purpose - function declarations hoist.
function calcInsuranceAt(monthlyGross) {
  const { totalInsurance } = hourlyPayroll(monthlyGross * 12);
  return totalInsurance;
}
