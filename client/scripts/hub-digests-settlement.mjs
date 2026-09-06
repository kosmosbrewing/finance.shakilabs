// Cross-band digests for /year-end-settlement and /wage-converter (Tier 2 promotion).
//
// Both routes had amount variants that restated one template with a number swapped, so nothing in
// them was worth promoting as prose. What is worth writing down is what the engine says when it is
// run across the whole axis rather than at one point: where a deduction stops being worth anything,
// where a conversion stops round-tripping, where the marginal value of one more won changes.
//
// Comments stay ASCII - scripts/ feeds font-subset-config.mjs, and a Korean character in a comment
// would grow the shipped font subset for nothing.
//
// Do not write the string "자주 묻는" here: prerender.mjs skips its FAQ append when the body already
// contains it, and the FAQPage invariant then fails the build.

import {
  calcIrpTaxCredit,
  calculateSalaryBreakdown,
  formatManWonValue,
  formatPercent,
  formatWon,
  MONTHLY_HOURS_WITH_HOLIDAY,
  wageConversion,
  WEEKS_PER_MONTH,
  yearEndStandardScenario,
  YEAR_END_ASSUMED_DEDUCTION_CAP,
  YEAR_END_ASSUMED_DEDUCTION_RATE,
} from "./calc-engine.mjs";
import { WAGE_CONVERTER_AMOUNTS, YEAR_END_AMOUNTS } from "./seo-routes.mjs";
import { MIN_WAGE_HOURLY_2026, MIN_WAGE_MONTHLY_2026 } from "./hub-digests.mjs";

const won = (value) => formatWon(value);
const manWon = (value) => `${formatManWonValue(value)}원`;
const pct = (value, digits = 1) => formatPercent(value, digits);
const salaryOf = (grossAnnual, nonTaxableMonthly = 200_000) =>
  calculateSalaryBreakdown({
    grossAnnual,
    nonTaxableMonthly,
    dependents: 1,
    children: 0,
    retirementIncluded: false,
  });
// 시급제 급여는 비과세 식대를 가정하지 않는다 - 알바 명세서에 비과세 항목이 있는 경우가 드물다
const hourlyPayrollOf = (annual) => salaryOf(annual, 0);

// =========================
// /year-end-settlement - what a deduction is actually worth, band by band
// =========================

// The salary at which the assessed tax stops being zero. Below it every deduction returns nothing,
// which is the one fact a refund estimate cannot express as a percentage.
function firstTaxableSalary() {
  for (let manWonValue = 1_000; manWonValue <= 5_000; manWonValue += 10) {
    if (salaryOf(manWonValue * 10_000).determinedTax > 0) return manWonValue;
  }
  return null;
}

const YEAR_END_SCAN = [2000, 3000, 4500, 6000, 7500, 10000];

export function yearEndDeductionValueDigest() {
  const rows = YEAR_END_SCAN.map((amount) => ({ amount, ...yearEndStandardScenario(amount * 10_000) }));
  const lowest = rows[0];
  const highest = rows[rows.length - 1];
  const capped = rows.filter((row) => row.refund < row.uncappedRefund);
  const zeroLine = firstTaxableSalary();
  const belowZero = salaryOf((zeroLine - 10) * 10_000);
  const pensionCreditRate = 0.165;
  const boundaryScenario = yearEndStandardScenario(56_000_000);
  const underBoundaryScenario = yearEndStandardScenario(55_000_000);

  return {
    h2: `같은 100만원 공제가 ${won(Math.floor(1_000_000 * lowest.marginalRate))}이 되기도 ${won(Math.floor(1_000_000 * highest.marginalRate))}이 되기도 한다`,
    body: [
      `아래 수치는 부양가족 1인·비과세 식대 월 ${won(200_000)}의 표준 시나리오에서, 연봉의 ${pct(YEAR_END_ASSUMED_DEDUCTION_RATE, 0)}(최대 ${won(YEAR_END_ASSUMED_DEDUCTION_CAP)})를 추가 <strong>소득공제</strong>로 넣었을 때의 결과입니다. 소득공제는 과세표준을 줄이므로 돌려받는 금액은 그 사람의 한계세율에 지방소득세 10%를 더한 비율이고, 연봉이 바뀌면 같은 공제액의 값어치도 바뀝니다.`,
    ],
    blocks: [
      {
        h3: `공제 1원의 값어치는 ${pct(lowest.marginalRate, 1)}에서 ${pct(highest.marginalRate, 1)}까지 ${(highest.marginalRate / lowest.marginalRate).toFixed(1)}배 벌어진다`,
        body: [
          `연봉 ${manWon(lowest.amount)}의 과세표준은 ${won(lowest.breakdown.taxableBase)}이라 한계세율이 ${pct(lowest.marginalRate, 1)}, 연봉 ${manWon(highest.amount)}은 과세표준 ${won(highest.breakdown.taxableBase)}으로 ${pct(highest.marginalRate, 1)}입니다. 그래서 같은 영수증 100만원이 저연봉에게는 ${won(Math.floor(1_000_000 * lowest.marginalRate))}, 고연봉에게는 ${won(Math.floor(1_000_000 * highest.marginalRate))}을 돌려줍니다. 연말정산 기사에서 흔히 보는 "공제 100만원을 더 받으면 15만원"이라는 어림값은 <strong>과세표준 ${won(50_000_000)} 이하 구간에서만</strong> 맞는 숫자입니다.`,
        ],
      },
      {
        h3: `연봉 ${manWon(zeroLine)} 아래에서는 공제를 아무리 받아도 돌려받을 것이 없다`,
        body: [
          `연봉을 10만원 단위로 훑으면 결정세액이 0원을 벗어나는 최초 지점이 ${manWon(zeroLine)}입니다. 그 바로 아래인 ${manWon(zeroLine - 10)}의 결정세액은 ${won(belowZero.determinedTax)}이라, 신용카드를 얼마를 쓰든 의료비 영수증을 얼마나 모으든 환급액은 0원에서 움직이지 않습니다. 근로소득세액공제가 산출세액을 먼저 지워 버리기 때문이며, 이 구간의 근로자에게 필요한 것은 공제 항목이 아니라 <strong>근로장려금</strong>입니다.`,
        ],
      },
      {
        h3: `그래서 저연봉 구간에서는 환급액이 한계세율이 아니라 결정세액에서 잘린다`,
        body: [
          capped.length > 0
            ? `표에서 연봉 ${capped.map((row) => manWon(row.amount)).join("·")}은 한계세율대로라면 ${capped.map((row) => won(row.uncappedRefund)).join("·")}을 돌려받아야 하지만, 결정세액이 ${capped.map((row) => won(row.determinedTax)).join("·")}뿐이라 그 금액에서 잘립니다. 환급은 이미 낸 세금을 돌려주는 절차라 낸 것보다 많이 돌려줄 수 없기 때문입니다.`
            : `표의 모든 연봉대에서 결정세액이 공제 효과보다 커서, 환급액이 한계세율 그대로 계산됩니다.`,
          `그래서 "공제를 최대한 채운다"는 전략에는 상한이 있습니다. 결정세액을 다 지우고 나면 그 위의 공제는 한 푼도 돌아오지 않으므로, 본인 결정세액을 먼저 확인하고 그 안에서 항목을 고르는 순서가 맞습니다.`,
        ],
      },
      {
        h3: `총급여 ${won(55_000_000)}을 넘는 순간 소득공제가 연금계좌 세액공제보다 유리해진다`,
        body: [
          `연금저축·IRP 세액공제율은 총급여 ${won(55_000_000)} 이하 ${pct(pensionCreditRate, 1)}, 초과 ${pct(0.132, 1)}입니다(지방소득세 포함). 총급여 ${won(55_000_000)}까지는 소득공제의 값어치도 ${pct(underBoundaryScenario.marginalRate, 1)}라 두 수단이 <strong>정확히 같은 값</strong>이지만, ${won(56_000_000)}이 되면 소득공제는 ${pct(boundaryScenario.marginalRate, 1)} 그대로인데 세액공제만 ${pct(0.132, 1)}로 내려갑니다. 그래서 이 경계를 넘은 사람은 같은 돈을 신용카드·주택자금 쪽에 쓰는 편이 낫고, 아래쪽 사람은 어느 쪽을 골라도 결과가 같습니다.`,
        ],
      },
    ],
    table: {
      head: ["연봉", "과세표준", "한계세율(지방세 포함)", "결정세액", "공제 100만원의 값어치", "표준 시나리오 환급액"],
      rows: rows.map((row) => ({
        highlight: row.refund < row.uncappedRefund,
        cells: [
          manWon(row.amount),
          won(row.breakdown.taxableBase),
          pct(row.marginalRate, 1),
          won(row.determinedTax),
          won(Math.floor(1_000_000 * row.marginalRate)),
          `<strong>${won(row.refund)}</strong>`,
        ],
      })),
    },
    tableNote: `강조된 행은 결정세액이 작아 한계세율대로 계산한 금액을 다 돌려받지 못하는 연봉대입니다. 표준 시나리오는 연봉의 ${pct(YEAR_END_ASSUMED_DEDUCTION_RATE, 0)}(최대 ${won(YEAR_END_ASSUMED_DEDUCTION_CAP)})를 소득공제로 가정한 값이며, 세액공제 항목은 여기에 포함되지 않았습니다. 세율 구간은 2026년 소득세법 기준으로 확인했습니다.`,
  };
}

export function yearEndTimingDigest() {
  const reference = 50_000_000;
  const payroll = salaryOf(reference);
  const eightyPercent = Math.floor(payroll.monthlyIncomeTax * 0.8);
  const monthlyGap = payroll.monthlyIncomeTax - eightyPercent;
  const half = salaryOf(reference / 2);
  const splitWithheld = half.determinedTax * 2;
  const splitShortfall = payroll.determinedTax - splitWithheld;
  const cardThreshold = Math.floor(reference * 0.25);
  const cardToFillCap = Math.ceil(3_000_000 / 0.15);
  const cardTotal = cardThreshold + cardToFillCap;
  const lowSalary = 3_000;
  const lowScenario = yearEndStandardScenario(lowSalary * 10_000);
  const pensionCredit = calcIrpTaxCredit({
    annualSalary: lowSalary * 10_000,
    pensionSavings: 6_000_000,
    irpContribution: 3_000_000,
  });
  const pensionCreditWithLocal = Math.floor(
    pensionCredit.recognizedContribution * pensionCredit.taxCreditRate * 1.1,
  );

  return {
    h2: "연말정산이 바꾸는 것은 총액이 아니라 시점이다",
    body: [
      `아래 비교는 모두 연봉 ${won(reference)}·부양가족 1인·비과세 식대 월 ${won(200_000)} 기준입니다. 같은 사람에게 원천징수 방식만 바꾸거나 소득이 발생한 순서만 바꿔 보면, 1년치 세금 총액은 그대로인데 <strong>매달 통장에 남는 돈과 2월에 오가는 돈</strong>이 크게 달라집니다.`,
    ],
    blocks: [
      {
        h3: `원천징수 80%를 고르면 매달 ${won(monthlyGap)}이 늘고 2월에 ${won(monthlyGap * 12)}이 줄어든다`,
        body: [
          `연봉 ${won(reference)}의 월 원천징수 소득세는 ${won(payroll.monthlyIncomeTax)}입니다. 80%를 선택하면 ${won(eightyPercent)}만 떼므로 매달 ${won(monthlyGap)}이 더 남고, 1년이면 ${won(monthlyGap * 12)}입니다. 그런데 결정세액은 ${won(payroll.determinedTax)}으로 변하지 않기 때문에 그만큼이 2월 정산에서 그대로 빠져나갑니다. 환급액이 큰 것과 세금을 적게 낸 것은 <strong>다른 이야기</strong>이며, 원천징수 비율 선택은 손익이 정확히 상쇄되는 시점 조정입니다.`,
        ],
      },
      {
        h3: `연봉을 두 회사로 나눠 받으면 2월에 ${won(splitShortfall)}을 토해낸다`,
        body: [
          `연봉 ${won(reference)}을 한 회사에서 받으면 결정세액이 ${won(payroll.determinedTax)}입니다. 그런데 같은 금액을 두 회사에서 반씩(${won(reference / 2)}씩) 받으면 각 회사가 자기 급여만 보고 원천징수하므로 합계가 ${won(splitWithheld)}에 그칩니다. 합산해 다시 계산한 결정세액과의 차이 ${won(splitShortfall)}이 2월에 추가 납부로 돌아옵니다. 이직한 해에 "환급이 아니라 추납"이 나오는 가장 흔한 이유이며, 누진세율과 인적공제가 각 회사에서 한 번씩 중복 적용되기 때문입니다.`,
        ],
      },
      {
        h3: `신용카드 공제 한도 ${won(3_000_000)}을 채우려면 연봉 ${won(reference)}에서 ${won(cardTotal)}을 써야 한다`,
        body: [
          `신용카드 소득공제는 총급여의 25%를 넘긴 금액부터 시작하므로 연봉 ${won(reference)}이면 ${won(cardThreshold)}까지는 공제가 0원입니다. 그 위에서 신용카드 공제율 15%로 한도 ${won(3_000_000)}을 채우려면 ${won(cardToFillCap)}을 더 써야 하고, 합치면 ${won(cardTotal)}입니다. 이는 이 연봉의 연 실수령 ${won(payroll.annualNet)}의 ${pct(cardTotal / payroll.annualNet, 0)}에 해당해, 한도를 채우는 쪽이 목표가 될 수 없다는 결론이 나옵니다.`,
        ],
      },
      {
        h3: `결정세액이 작으면 세액공제부터 버려진다 — 연봉 ${manWon(lowSalary)}에서 ${won(pensionCreditWithLocal - lowScenario.determinedTax)}`,
        body: [
          `연봉 ${manWon(lowSalary)}인 근로자가 연금저축과 IRP에 한도인 ${won(9_000_000)}을 넣으면 세액공제 대상 금액은 ${won(pensionCreditWithLocal)}입니다. 그런데 이 연봉의 결정세액은 ${won(lowScenario.determinedTax)}뿐이라 ${won(pensionCreditWithLocal - lowScenario.determinedTax)}은 돌려받지 못하고 사라집니다. 세액공제는 소득공제와 달리 남는 금액을 이월해 주지 않으므로, 결정세액이 작은 해에는 <strong>납입 자체를 미루는 편</strong>이 유리할 수 있습니다.`,
        ],
      },
    ],
    callout: `<strong>일정과 되돌리기</strong> — 간소화 자료 조회는 1월 15일부터, 회사 제출은 대체로 2월 초까지이고 정산분은 2월 급여에 반영됩니다. 빠뜨린 공제는 5년 이내 경정청구로 되돌릴 수 있으므로, 2월에 놓쳤다고 해서 그해 분이 확정되는 것은 아닙니다. 위 금액은 모두 표준 시나리오 기준 추정치이며, 확정 금액은 홈택스 연말정산 미리보기에서 확인하세요.`,
  };
}

// =========================
// /wage-converter - the conversion has to survive a round trip
// =========================

const WAGE_SCAN = [MIN_WAGE_HOURLY_2026, 12_000, 15_000, 20_000];

export function wageRoundTripDigest() {
  const rows = WAGE_SCAN.map((hourly) => {
    const conversion = wageConversion(hourly);
    return {
      hourly,
      ...conversion,
      backAt209: Math.floor(conversion.monthlyTotal / 209),
      backAtEngine: Math.round(conversion.monthlyTotal / MONTHLY_HOURS_WITH_HOLIDAY),
      officialMonthly: hourly * 209,
      withoutHoliday: Math.round(hourly * 40 * WEEKS_PER_MONTH),
    };
  });
  const minimum = rows[0];
  const top = rows[rows.length - 1];
  const dailyMonths = Math.round(5 * WEEKS_PER_MONTH * 10) / 10;
  const minimumBaseAsInclusive = Math.round(minimum.withoutHoliday / MONTHLY_HOURS_WITH_HOLIDAY);

  return {
    h2: `월 ${MONTHLY_HOURS_WITH_HOLIDAY}시간과 209시간이 같은 표 안에 섞여 있다`,
    body: [
      `이 계산기는 주 40시간에 주휴 8시간을 더한 48시간에 월 평균 ${WEEKS_PER_MONTH}주(365 ÷ 7 ÷ 12)를 곱해 월 ${MONTHLY_HOURS_WITH_HOLIDAY}시간으로 환산합니다. 그런데 통상시급을 구할 때 관행적으로 쓰는 값은 <strong>209시간</strong>입니다. 두 숫자가 다르기 때문에, 환산한 월급을 다시 시급으로 되돌리면 어느 값으로 나누느냐에 따라 결과가 갈립니다.`,
    ],
    blocks: [
      {
        h3: `209로 되돌리면 시급이 ${won(minimum.hourly - minimum.backAt209)}~${won(top.hourly - top.backAt209)} 줄어든다`,
        body: [
          `시급 ${won(minimum.hourly)}의 월 환산은 ${won(minimum.monthlyTotal)}인데, 이 월급을 통상시급 관행대로 209로 나누면 ${won(minimum.backAt209)}으로 원래보다 ${won(minimum.hourly - minimum.backAt209)} 낮습니다. 시급 ${won(top.hourly)}에서는 ${won(top.hourly - top.backAt209)}까지 벌어집니다. 반대로 이 계산기가 쓴 ${MONTHLY_HOURS_WITH_HOLIDAY}시간으로 나누면 ${won(minimum.backAtEngine)}·${won(top.backAtEngine)}으로 원래 시급이 그대로 복원됩니다. 그래서 연장·야간 가산수당을 209 기준 통상시급으로 계산하는 회사에서는 <strong>환산 월급을 그대로 쓰면 가산수당이 조금씩 적게 나옵니다</strong>.`,
        ],
      },
      {
        h3: `그래서 최저임금 월 환산 고시액과 ${won(minimum.officialMonthly - minimum.monthlyTotal)} 어긋난다`,
        body: [
          `고용노동부가 고시하는 2026년 최저임금 월 환산액은 시급 ${won(MIN_WAGE_HOURLY_2026)} × 209시간 = ${won(MIN_WAGE_MONTHLY_2026)}입니다. 이 계산기의 월 환산은 ${won(minimum.monthlyTotal)}이라 ${won(minimum.officialMonthly - minimum.monthlyTotal)} 낮습니다. 두 값 모두 같은 주 48시간을 전제하지만 209시간은 ${MONTHLY_HOURS_WITH_HOLIDAY}시간을 올림한 값이기 때문이며, 최저임금 위반 여부를 다투는 자리에서는 <strong>고시 기준인 209 쪽</strong>이 판단 기준이 됩니다.`,
        ],
      },
      {
        h3: `주휴 포함 여부에 따라 같은 공고의 시급이 ${won(minimumBaseAsInclusive)}과 ${won(minimum.hourly)}으로 갈린다`,
        body: [
          `주 40시간 공고에 월급 ${won(minimum.withoutHoliday)}이 적혀 있다고 해 봅시다. 이 금액이 <strong>기본급이고 주휴수당은 따로 준다</strong>면 시급은 ${won(minimum.hourly)}으로 최저임금을 지킵니다. 반대로 그 금액에 주휴수당까지 들어 있다면 ${MONTHLY_HOURS_WITH_HOLIDAY}시간으로 나눠 시급 ${won(minimumBaseAsInclusive)}이 되어 최저시급 ${won(MIN_WAGE_HOURLY_2026)}에 ${won(MIN_WAGE_HOURLY_2026 - minimumBaseAsInclusive)} 미달합니다. 같은 숫자가 준수와 위반 사이를 오가므로, 공고에서 확인할 것은 금액이 아니라 "주휴수당 포함" 다섯 글자입니다.`,
        ],
      },
      {
        h3: `일급 열과 월급 열은 서로 다른 기준이라 곱해서 맞춰지지 않는다`,
        body: [
          `표의 일급은 8시간분(시급 × 8)이라 주휴수당이 들어 있지 않고, 월급은 주휴 8시간분이 포함된 값입니다. 시급 ${won(minimum.hourly)}이면 일급 ${won(minimum.dailyWage)}에 월 근무일수 ${dailyMonths}일을 곱해도 ${won(Math.round(minimum.dailyWage * dailyMonths))}으로, 월급 ${won(minimum.monthlyTotal)}에 ${won(minimum.monthlyTotal - Math.round(minimum.dailyWage * dailyMonths))} 모자랍니다. 그 차액이 정확히 주휴수당 몫이므로, 두 열을 같은 기준으로 읽으면 매달 그만큼을 잃어버립니다.`,
        ],
      },
    ],
    table: {
      head: ["시급", "월급 (주휴 포함)", "209로 역산한 시급", `${MONTHLY_HOURS_WITH_HOLIDAY}로 역산한 시급`, "최저임금 고시 방식(×209)", "차이"],
      rows: rows.map((row) => ({
        highlight: row.hourly === MIN_WAGE_HOURLY_2026,
        cells: [
          won(row.hourly),
          won(row.monthlyTotal),
          won(row.backAt209),
          `<strong>${won(row.backAtEngine)}</strong>`,
          won(row.officialMonthly),
          won(row.officialMonthly - row.monthlyTotal),
        ],
      })),
    },
    tableNote: `주 40시간·주휴 8시간·월 ${WEEKS_PER_MONTH}주 기준의 세전 금액입니다. 화면의 인터랙티브 계산기도 같은 ${MONTHLY_HOURS_WITH_HOLIDAY}시간을 쓰므로 이 표의 월급과 원 단위까지 일치합니다.`,
  };
}

export function wageNetHourlyDigest() {
  const rows = WAGE_SCAN.map((hourly) => {
    const conversion = wageConversion(hourly);
    const payroll = hourlyPayrollOf(conversion.annualTotal);
    return {
      hourly,
      conversion,
      payroll,
      netHourly: Math.floor(payroll.monthlyNet / MONTHLY_HOURS_WITH_HOLIDAY),
    };
  });
  const minimum = rows[0];
  const top = rows[rows.length - 1];
  const insuranceRatio = top.payroll.totalInsurance / minimum.payroll.totalInsurance;
  const taxRatio = top.payroll.totalTax / minimum.payroll.totalTax;
  const step = rows[1];
  const grossStep = step.conversion.monthlyTotal - minimum.conversion.monthlyTotal;
  const netStep = step.payroll.monthlyNet - minimum.payroll.monthlyNet;
  const topStep = top.conversion.monthlyTotal - rows[2].conversion.monthlyTotal;
  const topNetStep = top.payroll.monthlyNet - rows[2].payroll.monthlyNet;
  const mealCase = salaryOf(minimum.conversion.annualTotal, 200_000);
  const mealEquivalentHourly = Math.round(
    (mealCase.monthlyNet - minimum.payroll.monthlyNet) / MONTHLY_HOURS_WITH_HOLIDAY,
  );

  return {
    h2: "세전 환산표가 답하지 못하는 것 — 시급 1,000원의 세후 값어치",
    body: [
      `위 표의 월급과 연봉은 전부 <strong>세전</strong>입니다. 그 연봉을 그대로 급여 계산에 넣어(부양가족 1인·비과세 식대 없음) 4대보험과 소득세를 뺀 뒤 다시 시간당으로 되돌리면, 시급 협상에서 실제로 손에 남는 금액이 얼마인지가 드러납니다.`,
    ],
    blocks: [
      {
        h3: `세후 시급은 명목 시급보다 ${won(minimum.hourly - minimum.netHourly)}~${won(top.hourly - top.netHourly)} 낮다`,
        body: [
          `시급 ${won(minimum.hourly)}으로 주 40시간을 일하면 연봉이 ${won(minimum.conversion.annualTotal)}, 월 실수령이 ${won(minimum.payroll.monthlyNet)}이라 세후 시급은 ${won(minimum.netHourly)}입니다. 시급 ${won(top.hourly)}이면 세후 ${won(top.netHourly)}입니다. 명목과 세후의 격차가 ${won(minimum.hourly - minimum.netHourly)}에서 ${won(top.hourly - top.netHourly)}으로 벌어지는데, 이 격차는 시급이 아니라 <strong>공제 구조</strong>가 만듭니다.`,
        ],
      },
      {
        h3: `4대보험은 시급과 같은 배율로 늘지만 소득세는 ${taxRatio.toFixed(1)}배가 된다`,
        body: [
          `시급 ${won(minimum.hourly)}에서 ${won(top.hourly)}으로 올라가는 동안 4대보험 공제는 ${won(minimum.payroll.totalInsurance)}에서 ${won(top.payroll.totalInsurance)}으로 ${insuranceRatio.toFixed(2)}배 늘어납니다. 시급이 ${(top.hourly / minimum.hourly).toFixed(2)}배가 된 것과 거의 같은 배율인데, 보험료가 정률이기 때문입니다. 반면 소득세·지방소득세는 ${won(minimum.payroll.totalTax)}에서 ${won(top.payroll.totalTax)}으로 ${taxRatio.toFixed(1)}배가 됩니다. 누진세율에 근로소득세액공제가 겹쳐 저시급 구간의 세금이 거의 0에 가깝기 때문이며, 그래서 세후 시급 곡선이 명목 시급 곡선보다 완만합니다.`,
        ],
      },
      {
        h3: `같은 인상폭이라도 세후 전환율이 ${pct(netStep / grossStep, 0)}에서 ${pct(topNetStep / topStep, 0)}로 떨어진다`,
        body: [
          `시급을 ${won(minimum.hourly)}에서 ${won(step.hourly)}으로 올리면 세전 월급이 ${won(grossStep)} 늘고 실수령은 ${won(netStep)} 늘어, 인상분의 ${pct(netStep / grossStep, 0)}가 손에 남습니다. 그런데 ${won(rows[2].hourly)}에서 ${won(top.hourly)}으로 올릴 때는 세전 ${won(topStep)}에 실수령 ${won(topNetStep)}으로 ${pct(topNetStep / topStep, 0)}만 남습니다. 그래서 시급 협상 금액을 세전으로 정하면 고시급 구간일수록 체감이 작아지고, 같은 체감을 얻으려면 인상폭을 더 크게 잡아야 합니다.`,
        ],
      },
      {
        h3: `비과세 식대 월 ${won(200_000)}은 시급 ${won(mealEquivalentHourly)} 인상과 같은 효과를 낸다`,
        body: [
          `위 계산은 비과세 식대를 0원으로 두었습니다. 아르바이트 급여명세서에 비과세 항목이 있는 경우가 드물기 때문인데, 같은 세전 월급에 월 ${won(200_000)}을 비과세로 잡으면 과세 대상이 그만큼 줄어 4대보험과 소득세가 함께 내려갑니다. 시급 ${won(minimum.hourly)} 기준으로 월 실수령이 ${won(minimum.payroll.monthlyNet)}에서 ${won(mealCase.monthlyNet)}으로 ${won(mealCase.monthlyNet - minimum.payroll.monthlyNet)} 오르는데, 이는 시급을 ${won(mealEquivalentHourly)} 올린 것과 같은 크기입니다. 그래서 계약 조건을 협상할 때 시급만 다투는 것보다 <strong>식대 항목을 비과세로 잡아 달라</strong>고 요구하는 편이 빠를 수 있습니다.`,
        ],
      },
    ],
    callout: `<strong>이 계산의 전제</strong> — 부양가족 1인·비과세 식대 없음·월 ${MONTHLY_HOURS_WITH_HOLIDAY}시간 기준입니다. 주 15시간 미만이거나 월 60시간 미만이면 국민연금·고용보험 가입 대상이 아닐 수 있어 공제 구성이 달라지고, 3.3%를 떼고 받는다면 근로자가 아니라 사업소득자로 신고되고 있는 것이라 4대보험 자체가 잡히지 않습니다. 요율은 2026년 기준으로 확인한 값입니다.`,
  };
}
