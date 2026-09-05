// Cross-band digests for the single-tool hubs and the part-time guide (Tier 3).
//
// These eight routes have no amount variants, so there was no prose to promote. Each section
// below scans its calculator's engine across a realistic input range and writes down what only
// the scan can show — a threshold where the answer flips, a curve that bends the wrong way, two
// effects that cancel. Every number is produced by calc-engine.mjs at build time.

import {
  calcAnnualLeavePay,
  calcBonusImpact,
  calcEmployerInsuranceBurden,
  calcFreelanceRate,
  calcInsuranceDeduction,
  calcMonthlyRentDeduction,
  calcPensionEstimate,
  calculateSalaryBreakdown,
  computeComprehensiveTax,
  EITC_BRACKET_TABLE,
  eitcAmountFor,
  formatManWonValue,
  formatPercent,
  formatWon,
  getAnnualLeaveDays,
  INCOME_TAX_BRACKETS,
  PENSION_AGE_FACTORS,
  RATES_2026,
  regionalHealthEstimate,
  weeklyHolidayPayForHours,
} from "./calc-engine.mjs";
import { WEEKLY_HOLIDAY_PAY_AMOUNTS } from "./seo-routes.mjs";
import { MIN_WAGE_HOURLY_2026, PENSION_CAP_TAXABLE } from "./hub-digests.mjs";
import { CALLOUT_STYLE, H2_STYLE, P_STYLE, TABLE_STYLE, TD_STYLE, TH_STYLE } from "./hub-styles.mjs";

const won = (value) => formatWon(value);
const manWon = (value) => `${formatManWonValue(Math.round(value / 10_000))}원`;
const pct = (value, digits = 1) => formatPercent(value, digits);
const pointGap = (a, b) => `${((a - b) * 100).toFixed(1)}%p`;
const STANDARD = { nonTaxableMonthly: 200_000, dependents: 1, children: 0, retirementIncluded: false };
const salaryOf = (grossAnnual, overrides = {}) =>
  calculateSalaryBreakdown({ grossAnnual, ...STANDARD, ...overrides });
// 시급제 급여는 식대 비과세를 가정하지 않는다 — 알바 명세서에 비과세 식대가 있는 경우가 드물다
const hourlyPayrollOf = (monthly) => salaryOf(monthly * 12, { nonTaxableMonthly: 0 });
const bracketOf = (taxableBase) => INCOME_TAX_BRACKETS.find((b) => taxableBase <= b.limit);

// =========================
// /weekly-holiday-pay — 15시간 경계와 세후 시급
// =========================
const HOURS_GRID = [14, 15, 20, 25, 30, 35, 40];

export function weeklyHolidayThresholdDigest() {
  const hourly = MIN_WAGE_HOURLY_2026;
  const rows = HOURS_GRID.map((hours) => ({ hours, ...weeklyHolidayPayForHours(hourly, hours) }));
  const below = rows.find((row) => row.hours === 14);
  const at = rows.find((row) => row.hours === 15);
  const full = rows.find((row) => row.hours === 40);
  const jump = at.estimatedMonthlyPay - below.estimatedMonthlyPay;
  // 주 1시간을 더 일해 얻는 월급 증가 = 그 시간의 임금 + 새로 생기는 주휴 3시간분
  const perWeeklyHour = jump / 4.345;
  const twoSplit = 2 * weeklyHolidayPayForHours(hourly, 14).estimatedMonthlyPay;
  const oneJob = weeklyHolidayPayForHours(hourly, 28).estimatedMonthlyPay;
  const holidayShare = full.weeklyHolidayPay / (full.weeklyWage + full.weeklyHolidayPay);

  return {
    h2: "주 14시간과 15시간 사이에 놓인 월 " + won(jump),
    body: [
      `주휴수당은 주 소정근로 15시간에서 켜지는 스위치라, 그 경계 앞뒤의 한 시간은 다른 어떤 한 시간과도 값이 다릅니다. 2026년 최저시급 ${won(hourly)}으로 주 14시간을 일하면 월급이 ${won(below.estimatedMonthlyPay)}이지만 주 15시간이면 ${won(at.estimatedMonthlyPay)}입니다. 주당 한 시간을 더 일해 월 <strong>${won(jump)}</strong>이 늘어나는데, 그 한 시간의 임금은 월 ${won(Math.round(hourly * 4.345))}에 불과하고 나머지 ${won(jump - Math.round(hourly * 4.345))}은 새로 발생한 주휴수당 3시간분입니다. 이 경계의 한 시간은 시급의 <strong>${(perWeeklyHour / hourly).toFixed(1)}배</strong>로 값이 매겨지는 셈입니다.`,
      `쪼개기 계약이 노리는 것이 바로 이 스위치입니다. 주 14시간짜리 일자리 두 곳에서 합계 28시간을 일하면 월급은 ${won(twoSplit)}이지만, 한 곳에서 28시간을 일하면 ${won(oneJob)}으로 <strong>${won(oneJob - twoSplit)}</strong> 더 받습니다. 총 근로시간이 같아도 두 사업장 어느 쪽에서도 15시간을 채우지 못해 주휴수당이 양쪽 모두에서 사라지기 때문입니다. 표의 15시간 이상 구간에서는 시간이 늘어도 실질 시급이 ${won(at.effectiveHourlyWage)}으로 고정되는데, 주휴수당이 근로시간에 정비례해 늘어나는 구조라 1.2배가 흔들리지 않기 때문입니다.`,
      `그래서 주 40시간 월급 ${won(full.estimatedMonthlyPay)} 가운데 주휴수당 몫은 ${won(full.estimatedMonthlyPay - full.monthlyPayWithout)}, 전체의 ${pct(holidayShare)}입니다. 구인 공고의 월급이 주휴 포함인지는 이 비율로 곧장 판별됩니다. 주 40시간 공고에 월 ${won(full.monthlyPayWithout)}이 적혀 있다면 주휴를 뺀 기본급으로는 시급 ${won(hourly)}을 정확히 지키는 금액이지만, 그 금액이 주휴수당까지 포함한 것이라면 시급은 ${won(Math.floor(full.monthlyPayWithout / (48 * 4.345)))}으로 최저임금에 미달합니다.`,
    ],
    table: {
      head: ["주 소정근로", "주급 (기본)", "주휴수당 (주)", "월급 (주휴 포함)", "실질 시급"],
      rows: rows.map((row) => ({
        highlight: row.hours === 15,
        cells: [
          `주 ${row.hours}시간`,
          won(row.weeklyWage),
          row.isEligible ? `<strong>+${won(row.weeklyHolidayPay)}</strong>` : "없음",
          `<strong>${won(row.estimatedMonthlyPay)}</strong>`,
          won(row.effectiveHourlyWage),
        ],
      })),
    },
    tableNote: `2026년 최저시급 ${won(hourly)}·월 4.345주 기준이며 개근을 전제로 합니다. 주 15시간 미만은 근로기준법 제18조 제3항에 따라 주휴수당 자체가 발생하지 않으므로 실질 시급이 명목 시급과 같습니다.`,
  };
}

export function weeklyHolidayNetHourlyDigest() {
  const rows = WEEKLY_HOLIDAY_PAY_AMOUNTS.map((hourly) => {
    const pay = weeklyHolidayPayForHours(hourly, 40);
    const payroll = hourlyPayrollOf(pay.estimatedMonthlyPay);
    return {
      hourly,
      pay,
      payroll,
      netHourly: Math.floor(payroll.monthlyNet / 209),
      holidayMonthly: pay.estimatedMonthlyPay - pay.monthlyPayWithout,
    };
  });
  const minimum = rows[0];
  const top = rows[rows.length - 1];
  const insuranceOverHoliday = minimum.payroll.totalInsurance / minimum.holidayMonthly;
  // 40시간 넘게 일하면 주휴는 8시간에 고정되고 초과분에 연장 가산 50%가 붙어 실질 시급이 다시 오른다
  const overtimeEffective = (hours) => {
    const base = weeklyHolidayPayForHours(minimum.hourly, 40);
    const overtime = Math.floor(minimum.hourly * (hours - 40) * 1.5);
    return Math.round((base.weeklyWage + base.weeklyHolidayPay + overtime) / hours);
  };

  return {
    h2: "실질 시급과 세후 시급은 다른 숫자다",
    body: [
      `주휴수당을 포함한 실질 시급 ${won(minimum.pay.effectiveHourlyWage)}은 회사가 지급하는 금액이고, 통장에 들어오는 금액은 다릅니다. 시급 ${won(minimum.hourly)}으로 주 40시간을 일해 월 ${won(minimum.pay.estimatedMonthlyPay)}을 받으면 4대보험 ${won(minimum.payroll.totalInsurance)}과 소득세·지방소득세 ${won(minimum.payroll.totalTax)}이 빠져 실수령은 ${won(minimum.payroll.monthlyNet)}, 209시간으로 나눈 <strong>세후 시급은 ${won(minimum.netHourly)}</strong>입니다. 명목 시급보다 ${won(minimum.hourly - minimum.netHourly)} 낮습니다.`,
      `4대보험이 주휴수당의 상당 부분을 되가져간다는 점이 이 표에서 드러납니다. 최저시급에서 월 주휴수당은 ${won(minimum.holidayMonthly)}인데 4대보험 공제가 ${won(minimum.payroll.totalInsurance)}으로 그 ${pct(insuranceOverHoliday, 0)}에 해당합니다. 시급이 ${won(top.hourly)}으로 올라가면 4대보험은 ${won(top.payroll.totalInsurance)}으로 정률로 따라 오르지만 소득세는 ${won(top.payroll.totalTax)}으로 ${(top.payroll.totalTax / minimum.payroll.totalTax).toFixed(1)}배가 됩니다. 소득세만 누진이기 때문이며, 그래서 세후 시급이 명목 시급에서 벌어지는 폭은 ${won(minimum.hourly - minimum.netHourly)}에서 ${won(top.hourly - top.netHourly)}으로 커집니다.`,
      `주 40시간을 넘기면 실질 시급이 다시 움직입니다. 주휴수당은 8시간분에서 멈추지만 40시간 초과분에는 연장 가산 50%가 붙어, 5인 이상 사업장에서 주 45시간이면 실질 시급이 ${won(overtimeEffective(45))}, 상한인 주 52시간이면 ${won(overtimeEffective(52))}까지 올라갑니다. 15시간부터 40시간까지 ${won(minimum.pay.effectiveHourlyWage)}에 붙어 있던 값이 40시간을 넘는 순간에만 다시 오르는 이유는, 주휴가 아니라 가산수당이 움직이기 때문입니다.`,
    ],
    table: {
      head: ["시급", "월급 (주 40시간·주휴 포함)", "4대보험", "소득세·지방세", "세후 월급", "세후 시급"],
      rows: rows.map((row) => ({
        highlight: row.hourly === minimum.hourly,
        cells: [
          `<a href="/finance/weekly-holiday-pay/${row.hourly}">${won(row.hourly)}</a>`,
          won(row.pay.estimatedMonthlyPay),
          won(row.payroll.totalInsurance),
          won(row.payroll.totalTax),
          won(row.payroll.monthlyNet),
          `<strong>${won(row.netHourly)}</strong>`,
        ],
      })),
    },
    tableNote: `부양가족 1인, 비과세 식대 없음, 월 소정근로 209시간 기준입니다. 세후 시급은 실수령 월급을 209시간으로 나눈 값이라 주휴수당까지 포함한 시간당 실수령입니다.`,
    callout: `<strong>주휴수당이 4대보험 가입선을 넘긴다</strong> — 국민연금·건강보험 직장가입 기준은 월 60시간 이상입니다. 주 15시간은 월 ${(15 * 4.345).toFixed(1)}시간이라 주휴수당이 발생하는 근로자는 거의 전부 4대보험 가입 대상이기도 합니다. 주휴를 받기 시작하는 달부터 공제도 시작된다는 뜻입니다.`,
  };
}

// =========================
// /pension — 소득재분배와 청구 나이의 손익분기
// =========================
const PENSION_INCOME_GRID = [1_000_000, 2_000_000, 3_200_000, 4_000_000, 5_000_000, PENSION_CAP_TAXABLE];
const PENSION_YEARS = 20;
const PENSION_FIXED_TERM = 360_000;

function pensionIncomeRow(income) {
  const estimate = calcPensionEstimate({ averageMonthlyIncome: income, insuredYears: PENSION_YEARS, claimAge: 65 });
  const paidEmployee = Math.floor(income * RATES_2026.nationalPension.employee) * PENSION_YEARS * 12;
  return {
    income,
    pension: estimate.estimatedMonthlyPension,
    replacement: estimate.estimatedMonthlyPension / income,
    // 소득과 무관한 균등 부분(A값 몫)이 연금에서 차지하는 비중
    fixedShare: (PENSION_FIXED_TERM * (PENSION_YEARS / 40)) / estimate.estimatedMonthlyPension,
    paidEmployee,
    recoveryMonths: Math.round(paidEmployee / estimate.estimatedMonthlyPension),
  };
}

export function pensionRedistributionDigest() {
  const rows = PENSION_INCOME_GRID.map(pensionIncomeRow);
  const low = rows[0];
  const double = rows.find((row) => row.income === 2_000_000);
  const quadruple = rows.find((row) => row.income === 4_000_000);
  const cap = rows[rows.length - 1];

  return {
    h2: "소득이 두 배여도 연금은 두 배가 되지 않는다",
    body: [
      `국민연금 산식에는 본인 소득과 상관없는 균등 부분이 들어 있어, 연금액은 소득에 비례하지 않습니다. 가입 ${PENSION_YEARS}년·65세 청구로 놓고 평균 기준소득월액만 바꿔 보면, ${won(double.income)}의 연금은 월 ${won(double.pension)}인데 소득이 두 배인 ${won(quadruple.income)}의 연금은 ${won(quadruple.pension)}으로 <strong>${pct(quadruple.pension / double.pension - 1, 0)}만 늘어납니다</strong>. 소득대체율로 보면 ${won(low.income)}에서 ${pct(low.replacement)}, 상한인 ${won(cap.income)}에서 ${pct(cap.replacement)}로, 소득이 낮을수록 낸 것에 비해 많이 받는 구조입니다.`,
      `균등 부분의 무게가 그 이유입니다. 연금 가운데 소득과 무관하게 붙는 몫이 ${won(low.income)}에서는 전체의 ${pct(low.fixedShare, 0)}이지만 ${won(cap.income)}에서는 ${pct(cap.fixedShare, 0)}로 줄어듭니다. 저소득 가입자의 연금은 절반 넘게 이 균등 부분에서 나오고, 상한 소득자의 연금은 대부분 본인 소득 비례분입니다.`,
      `낸 돈을 돌려받는 기간도 그래서 갈립니다. 본인 부담 ${pct(RATES_2026.nationalPension.employee, 2)}로 ${PENSION_YEARS}년 낸 보험료를 연금으로 회수하는 데 ${won(low.income)} 가입자는 <strong>${low.recoveryMonths}개월</strong>, ${won(cap.income)} 가입자는 <strong>${cap.recoveryMonths}개월</strong>이 걸립니다. 회사 부담분까지 합친 전체 보험료로 따지면 두 배가 걸리지만, 그래도 상한 소득자가 ${Math.round(cap.recoveryMonths * 2 / 12)}년 안에 원금을 회수하는 셈이라 어느 구간이든 기대여명 안에 돌아옵니다.`,
    ],
    table: {
      head: ["평균 기준소득월액", "월 예상 연금 (20년·65세)", "소득대체율", "균등 부분 비중", "본인 부담 보험료 총액", "회수 기간"],
      rows: rows.map((row) => ({
        highlight: row.income === PENSION_CAP_TAXABLE,
        cells: [
          won(row.income),
          `<strong>${won(row.pension)}</strong>`,
          pct(row.replacement),
          pct(row.fixedShare, 0),
          won(row.paidEmployee),
          `${row.recoveryMonths}개월`,
        ],
      })),
    },
    tableNote: `기준소득월액 상한 ${won(PENSION_CAP_TAXABLE)}(2026.7 시행)을 넘는 소득은 연금에도 보험료에도 반영되지 않으므로 표의 마지막 행이 직장가입자가 받을 수 있는 최대치입니다. 재평가율과 물가 연동은 반영하지 않은 간이 추정입니다.`,
  };
}

export function pensionClaimAgeDigest() {
  const income = 3_200_000;
  const base = calcPensionEstimate({ averageMonthlyIncome: income, insuredYears: PENSION_YEARS, claimAge: 65 });
  const ages = [60, 62, 64, 65, 66, 68, 70].map((age) => {
    const estimate = calcPensionEstimate({ averageMonthlyIncome: income, insuredYears: PENSION_YEARS, claimAge: age });
    const factor = PENSION_AGE_FACTORS[age];
    // 누적 수령액이 65세 청구와 같아지는 나이 — 조기: 65 + f×(65-age)/(1-f), 연기: age + (age-65)/(f-1)
    const breakEven =
      age < 65 ? 65 + (factor * (65 - age)) / (1 - factor) : age > 65 ? age + (age - 65) / (factor - 1) : null;
    return { age, factor, pension: estimate.estimatedMonthlyPension, breakEven };
  });
  const earliest = ages[0];
  const latest = ages[ages.length - 1];
  const oneMoreYear = calcPensionEstimate({ averageMonthlyIncome: income, insuredYears: PENSION_YEARS + 1, claimAge: 65 });
  const moreIncome = calcPensionEstimate({ averageMonthlyIncome: income + 100_000, insuredYears: PENSION_YEARS, claimAge: 65 });
  const yearGain = oneMoreYear.estimatedMonthlyPension - base.estimatedMonthlyPension;
  const incomeGain = moreIncome.estimatedMonthlyPension - base.estimatedMonthlyPension;
  const nine = calcPensionEstimate({ averageMonthlyIncome: income, insuredYears: 9, claimAge: 65 });
  const ten = calcPensionEstimate({ averageMonthlyIncome: income, insuredYears: 10, claimAge: 65 });
  const tenPaid = Math.floor(income * RATES_2026.nationalPension.employee) * 120;

  return {
    h2: "조기 수령과 연기 수령의 손익분기 나이",
    body: [
      `연금을 60세에 당겨 받으면 매달 ${pct(1 - earliest.factor, 0)}를 덜 받고, 70세로 늦추면 ${pct(latest.factor - 1, 0)}를 더 받습니다. 평균 기준소득월액 ${won(income)}·가입 ${PENSION_YEARS}년이면 월 ${won(earliest.pension)}과 ${won(latest.pension)}, 65세 기준 ${won(base.estimatedMonthlyPension)}과의 차이는 각각 ${won(base.estimatedMonthlyPension - earliest.pension)}과 ${won(latest.pension - base.estimatedMonthlyPension)}입니다. 그런데 어느 쪽이 유리한지는 금액이 아니라 <strong>몇 살까지 사느냐</strong>로 결정됩니다.`,
      `누적 수령액을 나란히 세우면 교차점이 나옵니다. 60세 조기 수령은 5년을 먼저 받는 대신 매달 적게 받아, <strong>${earliest.breakEven.toFixed(1)}세</strong>를 넘기면 65세 정상 수령보다 총액이 적어집니다. 70세 연기 수령은 5년을 비우는 대신 매달 많이 받아, <strong>${latest.breakEven.toFixed(1)}세</strong>를 넘겨야 정상 수령을 앞지릅니다. 62세와 68세의 교차점은 ${ages.find((row) => row.age === 62).breakEven.toFixed(1)}세와 ${ages.find((row) => row.age === 68).breakEven.toFixed(1)}세로, 조정 폭이 클수록 교차점도 뒤로 밀립니다.`,
      `청구 나이를 고르기 전에 가입기간부터 채우는 편이 확실합니다. 같은 시나리오에서 가입기간 1년은 월 ${won(yearGain)}의 값어치이고, 평균 소득을 ${won(100_000)} 올리는 것은 월 ${won(incomeGain)}의 값어치입니다. 즉 1년을 더 채우는 것은 ${PENSION_YEARS}년 내내 소득을 약 ${won(Math.round((yearGain / incomeGain) * 100_000 / 10_000) * 10_000)} 더 신고한 것과 같습니다. 가입 9년은 월 ${won(nine.estimatedMonthlyPension)}에 해당하는 연금이 아니라 반환일시금으로 끝나고, 10년을 채우면 월 ${won(ten.estimatedMonthlyPension)}이 평생 나옵니다. 10년치 본인 보험료 ${won(tenPaid)}은 ${Math.round(tenPaid / ten.estimatedMonthlyPension)}개월이면 돌아옵니다.`,
    ],
    table: {
      head: ["청구 나이", "조정 계수", "월 예상 연금", "65세 청구와 누적액이 같아지는 나이"],
      rows: ages.map((row) => ({
        highlight: row.age === 65,
        cells: [
          `${row.age}세`,
          `×${row.factor}`,
          `<strong>${won(row.pension)}</strong>`,
          row.breakEven === null ? "기준" : `${row.breakEven.toFixed(1)}세`,
        ],
      })),
    },
    tableNote: `평균 기준소득월액 ${won(income)}·가입 ${PENSION_YEARS}년 기준이며, 교차 나이는 연금액이 물가 연동으로 함께 오르는 것을 감안해 명목 금액으로 비교한 값입니다. 부양가족 연금액과 소득활동에 따른 감액은 넣지 않았습니다.`,
    callout: `<strong>조기 수령은 되돌릴 수 없다</strong> — 감액된 계수는 사망 때까지 유지됩니다. 60세 청구 후 ${earliest.breakEven.toFixed(0)}세를 넘겨 살면 그 뒤로는 매달 ${won(base.estimatedMonthlyPension - earliest.pension)}씩 손해가 쌓이므로, 소득이 끊겨 당장 생활비가 필요한 경우가 아니라면 기대여명이 이 나이를 넘는지를 먼저 봐야 합니다.`,
  };
}

// =========================
// /annual-leave — 근속 계단과 하루 값의 분자·분모
// =========================
const LEAVE_SCENARIO = { monthlySalary: 3_600_000, fixedAllowance: 200_000, monthsWorked: 24, unusedLeaveDays: 5 };
const LEAVE_MONTHS_GRID = [6, 11, 12, 24, 36, 60, 120, 240, 252];

export function annualLeaveStaircaseDigest() {
  const scenario = calcAnnualLeavePay(LEAVE_SCENARIO);
  const daily = scenario.dailyOrdinaryWage;
  const rows = LEAVE_MONTHS_GRID.map((months) => {
    const days = getAnnualLeaveDays(months);
    return { months, days, value: days * daily };
  });
  const eleven = rows.find((row) => row.months === 11);
  const twelve = rows.find((row) => row.months === 12);
  const capRow = rows.find((row) => row.days === 25);
  const firstYearTotal = eleven.days + twelve.days;
  // 연차가 실제로 늘어나는 근속 연차만 추린다 — 홀수 해에만 계단이 생긴다
  const stepYears = [];
  for (let year = 2; year <= 21; year += 1) {
    if (getAnnualLeaveDays(year * 12) > getAnnualLeaveDays((year - 1) * 12)) stepYears.push(year);
  }

  return {
    h2: "연차는 매년 늘지 않고 홀수 해에만 계단을 오른다",
    body: [
      `연차 발생일수를 근속 1개월부터 21년까지 한 줄로 세우면 곡선이 아니라 계단이 보입니다. 가장 큰 계단은 <strong>11개월과 12개월 사이</strong>입니다. 11개월 근속의 연차는 ${eleven.days}일이지만 12개월을 채우는 순간 ${twelve.days}일이 새로 생겨, 한 달 차이로 ${twelve.days - eleven.days}일·${won(twelve.value - eleven.value)}(1일 통상임금 ${won(daily)} 기준)이 갈립니다. 첫해에 매달 1일씩 쌓인 ${eleven.days}일은 사라지지 않으므로, 입사 후 1년 하루를 채운 사람은 합계 ${firstYearTotal}일을 쓸 수 있습니다.`,
      `1년을 넘기면 계단이 드물어집니다. 2년째는 15일 그대로이고 ${stepYears.slice(0, 4).join("·")}년째에만 1일씩 늘어, 근속 2년과 3년 사이에는 ${won(daily)} 하루치 차이가 생기지만 3년과 4년 사이에는 차이가 없습니다. 이 계단은 ${capRow.months / 12}년째에 ${capRow.days}일 상한에 닿아 멈추고, 그 뒤로는 근속이 아무리 길어도 연차가 늘지 않습니다.`,
      `상한 ${capRow.days}일을 다 못 쓰면 수당은 ${won(capRow.value)}으로, 월 통상임금 ${won(scenario.ordinaryMonthly)}의 ${pct(capRow.value / scenario.ordinaryMonthly, 0)}에 이릅니다. 한 달치 월급이 연차수당으로 바뀌는 셈이라, 장기 근속자의 미사용 연차는 소액 정산이 아니라 급여 한 달과 같은 무게로 봐야 합니다. 시나리오의 근속 24개월·미사용 5일은 ${won(scenario.totalAllowance)}으로 그 ${pct(scenario.totalAllowance / capRow.value, 0)}입니다.`,
    ],
    table: {
      head: ["근속", "연간 발생 연차", "전부 미사용 시 수당", "직전 행과의 차이"],
      rows: rows.map((row, index) => ({
        highlight: row.months === 12,
        cells: [
          row.months < 12 ? `${row.months}개월` : `${row.months / 12}년`,
          `<strong>${row.days}일</strong>`,
          won(row.value),
          index === 0 ? "—" : row.days === rows[index - 1].days ? "변동 없음" : `+${row.days - rows[index - 1].days}일 (${won(row.value - rows[index - 1].value)})`,
        ],
      })),
    },
    tableNote: `1일 통상임금 ${won(daily)}은 월급 ${won(LEAVE_SCENARIO.monthlySalary)}과 고정수당 ${won(LEAVE_SCENARIO.fixedAllowance)}을 209시간으로 나눠 8시간을 곱한 값입니다. 1년 미만 구간은 개근한 달마다 1일이 생기고, 1년 이상은 15일에서 시작해 최초 1년을 넘은 근속 2년마다 1일이 더해집니다.`,
  };
}

export function annualLeaveDenominatorDigest() {
  const scenario = calcAnnualLeavePay(LEAVE_SCENARIO);
  const noAllowance = calcAnnualLeavePay({ ...LEAVE_SCENARIO, fixedAllowance: 0 });
  const allowancePerDay = scenario.dailyOrdinaryWage - noAllowance.dailyOrdinaryWage;
  // 옛 주 44시간 기준 226시간으로 나누면 하루 값이 얼마나 깎이는가
  const legacyDaily = Math.floor((scenario.ordinaryMonthly / 226) * 8);
  const legacyLoss = scenario.dailyOrdinaryWage - legacyDaily;
  const hourlyOrdinary = Math.floor(scenario.ordinaryMonthly / 209);
  // 연차수당은 전년도 지급액의 3/12이 퇴직 전 3개월 임금 총액에 들어간다 — 퇴직금으로 이어지는 몫
  const severanceYears = 10;
  const severanceEffect = (windowDays) =>
    Math.floor((((scenario.totalAllowance * 3) / 12) / windowDays) * 30 * severanceYears);

  return {
    h2: "하루 값을 정하는 분자와 분모",
    body: [
      `연차 하루의 값 ${won(scenario.dailyOrdinaryWage)}은 <strong>분자(월 통상임금)</strong>를 <strong>분모(월 소정근로시간 209)</strong>로 나눈 시간급 ${won(hourlyOrdinary)}에 8시간을 곱한 것입니다. 회사가 어느 쪽을 어떻게 잡느냐에 따라 같은 5일이 다른 금액이 됩니다. 시나리오의 고정수당 ${won(LEAVE_SCENARIO.fixedAllowance)}을 통상임금에서 빼면 하루 값이 ${won(allowancePerDay)} 줄어, 5일이면 ${won(allowancePerDay * scenario.payableDays)}, 상한 25일이면 ${won(allowancePerDay * 25)}이 덜 지급됩니다.`,
      `분모 쪽 오류는 더 자주 보입니다. 주 44시간 시절의 226시간을 그대로 쓰는 회사에서는 시간급이 ${won(Math.floor(scenario.ordinaryMonthly / 226))}으로 내려가 하루 값이 ${won(legacyDaily)}, 정상 계산보다 <strong>${won(legacyLoss)}(${pct(legacyLoss / scenario.dailyOrdinaryWage)})</strong> 적습니다. 주 40시간 근로자의 법정 분모는 209이고, 주 35시간 계약이라면 분모는 더 작아져 하루 값은 오히려 올라가야 합니다.`,
      `연차수당은 그 자체로 끝나지 않고 퇴직금으로 이어집니다. 전년도에 받은 연차수당의 12분의 3이 퇴직 전 3개월 임금 총액에 들어가 평균임금을 올리기 때문입니다. 시나리오의 연차수당 ${won(scenario.totalAllowance)}이 산정기간에 들어가면 근속 ${severanceYears}년 기준 퇴직금이 ${won(severanceEffect(92))}에서 ${won(severanceEffect(89))} 더 나옵니다. 연차수당 한 번이 퇴직금에서는 그 ${pct(severanceEffect(92) / scenario.totalAllowance, 0)} 안팎으로 한 번 더 돌아오는 셈입니다.`,
    ],
    table: {
      head: ["계산 방식", "시간급", "1일 연차수당", "미사용 5일", "정상 계산과의 차이"],
      rows: [
        {
          highlight: true,
          cells: ["기본급 + 고정수당, ÷209 (법정)", won(hourlyOrdinary), `<strong>${won(scenario.dailyOrdinaryWage)}</strong>`, won(scenario.totalAllowance), "—"],
        },
        {
          cells: ["고정수당 제외, ÷209", won(Math.floor(noAllowance.ordinaryMonthly / 209)), won(noAllowance.dailyOrdinaryWage), won(noAllowance.totalAllowance), `−${won(scenario.totalAllowance - noAllowance.totalAllowance)}`],
        },
        {
          cells: ["기본급 + 고정수당, ÷226 (구 기준)", won(Math.floor(scenario.ordinaryMonthly / 226)), won(legacyDaily), won(legacyDaily * scenario.payableDays), `−${won(scenario.totalAllowance - legacyDaily * scenario.payableDays)}`],
        },
      ],
    },
    tableNote: `월급 ${won(LEAVE_SCENARIO.monthlySalary)}·고정수당 ${won(LEAVE_SCENARIO.fixedAllowance)}·미사용 ${LEAVE_SCENARIO.unusedLeaveDays}일 기준입니다. 퇴직금 효과는 평균임금 산정기간이 89~92일인 데 따른 범위이며 근속 ${severanceYears}년을 가정했습니다.`,
    callout: `<strong>정산서에서 확인할 두 숫자</strong> — 시간급이 ${won(hourlyOrdinary)}인지, 하루 값이 ${won(scenario.dailyOrdinaryWage)}인지입니다. 둘 중 하나가 다르면 분자나 분모 중 하나가 법정 기준과 다르다는 뜻이고, 차액은 퇴직 후 14일 이내 지급 의무와 연 20% 지연이자의 대상입니다.`,
  };
}

// =========================
// /guide/part-time — 시간대별 세후·장려금·3.3%
// =========================
const PART_TIME_HOURS = [14, 15, 20, 25, 30, 34, 35, 40];

function partTimeRow(hours) {
  const pay = weeklyHolidayPayForHours(MIN_WAGE_HOURLY_2026, hours);
  const annual = pay.estimatedMonthlyPay * 12;
  const payroll = hourlyPayrollOf(pay.estimatedMonthlyPay);
  const freelance = computeComprehensiveTax(annual);
  return {
    hours,
    pay,
    annual,
    payroll,
    eitc: eitcAmountFor(annual, EITC_BRACKET_TABLE.single),
    // 같은 돈을 3.3% 사업소득으로 받으면 — 원천징수 후 월 수령액과 5월 정산
    freelanceMonthly: Math.floor((annual - freelance.withholdingPrepaid) / 12),
    freelanceRefund: freelance.refund,
  };
}

export function partTimeNetDigest() {
  const rows = PART_TIME_HOURS.map(partTimeRow);
  const lastWithEitc = [...rows].reverse().find((row) => row.eitc > 0);
  const firstWithoutEitc = rows.find((row) => row.eitc === 0);
  const twenty = rows.find((row) => row.hours === 20);
  const full = rows.find((row) => row.hours === 40);
  const threshold = rows.find((row) => row.hours === 15);
  const eitcHours = EITC_BRACKET_TABLE.single.phaseOutEnd / (MIN_WAGE_HOURLY_2026 * 1.2 * 4.345 * 12);

  return {
    h2: "주 몇 시간부터 근로장려금이 사라지고, 4대보험은 얼마를 가져가는가",
    body: [
      `위 조견표의 세전 월급을 실제 통장 기준으로 다시 놓으면 두 가지 선이 나타납니다. 하나는 <strong>근로장려금이 0원이 되는 근무시간</strong>입니다. 단독 가구 장려금은 연 소득 ${manWon(EITC_BRACKET_TABLE.single.phaseOutEnd)}에서 끝나는데, 최저시급으로 주휴수당까지 받으면 주 ${eitcHours.toFixed(1)}시간이 그 선입니다. 주 ${lastWithEitc.hours}시간(연 ${manWon(lastWithEitc.annual)})까지는 ${won(lastWithEitc.eitc)}이 나오지만 주 ${firstWithoutEitc.hours}시간(연 ${manWon(firstWithoutEitc.annual)})부터는 한 푼도 없습니다. 주 ${twenty.hours}시간 근무자의 장려금 ${won(twenty.eitc)}은 한 달 실수령 ${won(twenty.payroll.monthlyNet)}보다 큰 금액이라, 이 구간의 알바에게는 열세 번째 월급에 해당합니다.`,
      `다른 하나는 4대보험 공제가 시작되는 선입니다. 주 ${threshold.hours}시간은 월 ${(threshold.hours * 4.345).toFixed(1)}시간으로 직장가입 기준 60시간을 넘기므로, 주휴수당이 생기는 바로 그 시간부터 국민연금·건강보험 공제도 함께 시작됩니다. 주 ${threshold.hours}시간의 세전 ${won(threshold.pay.estimatedMonthlyPay)}에서 ${won(threshold.payroll.totalInsurance)}이, 주 ${full.hours}시간의 ${won(full.pay.estimatedMonthlyPay)}에서 ${won(full.payroll.totalInsurance)}이 빠집니다. 소득세는 주 ${rows.find((row) => row.payroll.totalTax > 0).hours}시간부터 붙기 시작해 주 40시간에도 ${won(full.payroll.totalTax)}에 그치므로, 알바 명세서에서 실수령을 깎는 것은 세금이 아니라 거의 전부 보험료입니다.`,
      `사업주가 3.3%로 처리하자고 하면 이 표로 손익을 따질 수 있습니다. 같은 세전 ${won(twenty.pay.estimatedMonthlyPay)}을 사업소득으로 받으면 원천징수 후 월 ${won(twenty.freelanceMonthly)}으로 근로자 실수령 ${won(twenty.payroll.monthlyNet)}보다 ${won(twenty.freelanceMonthly - twenty.payroll.monthlyNet)} 많고, 5월에는 단순경비율 덕에 ${won(twenty.freelanceRefund)}을 돌려받습니다. 그 대신 고용보험이 없어 실업급여 대상이 아니고, 주휴수당·연차·퇴직금의 근거인 근로자 지위도 다투어야 합니다. 주 15시간 이상 1년을 채운 근로자에게는 퇴직금 한 달치(주 ${twenty.hours}시간이면 약 ${won(twenty.pay.estimatedMonthlyPay)})가 생기므로, 1년 이상 일할 계획이라면 3.3%의 월 ${won(twenty.freelanceMonthly - twenty.payroll.monthlyNet)}은 그 한 달치와 맞바꾸는 돈입니다.`,
    ],
    table: {
      head: ["주 근무시간", "세전 월급 (주휴 포함)", "4대보험", "세후 월급", "근로장려금 (단독·연)", "3.3% 처리 시 월 수령"],
      rows: rows.map((row) => ({
        highlight: row === lastWithEitc,
        cells: [
          `주 ${row.hours}시간`,
          won(row.pay.estimatedMonthlyPay),
          won(row.payroll.totalInsurance),
          `<strong>${won(row.payroll.monthlyNet)}</strong>`,
          row.eitc > 0 ? won(row.eitc) : "없음",
          won(row.freelanceMonthly),
        ],
      })),
    },
    tableNote: `2026년 최저시급 ${won(MIN_WAGE_HOURLY_2026)}·비과세 없음·부양가족 1인 기준이며, 장려금은 재산 요건(2억 4,000만원 미만)을 충족하는 단독 가구를 가정했습니다. 3.3% 열은 원천징수만 뺀 월 수령액으로, 5월 종합소득세 정산은 별도입니다.`,
    callout: `<strong>주 14시간과 15시간의 세후 차이</strong> — 세전은 ${won(threshold.pay.estimatedMonthlyPay - rows[0].pay.estimatedMonthlyPay)} 벌어지지만 4대보험이 ${won(threshold.payroll.totalInsurance - rows[0].payroll.totalInsurance)} 더 빠져 세후 차이는 ${won(threshold.payroll.monthlyNet - rows[0].payroll.monthlyNet)}입니다. 그래도 주휴수당 3시간분이 보험료 증가보다 훨씬 크므로, 15시간을 채우는 쪽이 매달 손에 남는 돈에서도 유리합니다.`,
  };
}

// 가이드 본문은 문자열 HTML이라 renderSection을 거치지 않는다 — 같은 스타일 토큰으로 직접 그린다
export function renderDigestHtml(digest) {
  const parts = [`<h2 style="${H2_STYLE}">${digest.h2}</h2>`];
  for (const body of digest.body) parts.push(`<p style="${P_STYLE}">${body}</p>`);
  if (digest.table) {
    const head = `<thead><tr>${digest.table.head.map((h) => `<th style="${TH_STYLE}">${h}</th>`).join("")}</tr></thead>`;
    const rows = digest.table.rows
      .map(
        (row) =>
          `<tr${row.highlight ? ' style="background:hsl(var(--accent));"' : ""}>${row.cells.map((cell) => `<td style="${TD_STYLE}">${cell}</td>`).join("")}</tr>`,
      )
      .join("");
    parts.push(`<table style="${TABLE_STYLE}">${head}<tbody>${rows}</tbody></table>`);
  }
  if (digest.tableNote) parts.push(`<p style="${P_STYLE}">${digest.tableNote}</p>`);
  if (digest.callout) parts.push(`<div style="${CALLOUT_STYLE}">${digest.callout}</div>`);
  return parts.join("\n      ");
}

// =========================
// /freelance-rate — 3.3%의 방향이 뒤집히는 목표선
// =========================
const RATE_TARGETS = [2_000_000, 3_000_000, 4_000_000, 5_000_000, 7_000_000, 10_000_000];
const RATE_SCHEDULE = { workDaysMonthly: 18, billableHoursDaily: 6 };
const WITHHOLDING_RATE = 0.033;

function rateRow(target) {
  const rate = calcFreelanceRate({ targetMonthlyNet: target, ...RATE_SCHEDULE });
  const naive = Math.floor(target / (1 - WITHHOLDING_RATE));
  const next = calcFreelanceRate({ targetMonthlyNet: target + 1_000_000, ...RATE_SCHEDULE });
  return {
    target,
    rate,
    naive,
    gap: rate.monthlyGross - naive,
    effective: rate.tax.totalTax / rate.annualGross,
    grossUp: rate.monthlyGross / target,
    marginal: next.monthlyGross - rate.monthlyGross,
  };
}

export function freelanceRateFlipDigest() {
  const rows = RATE_TARGETS.map(rateRow);
  const lastOver = [...rows].reverse().find((row) => row.gap < 0);
  const firstUnder = rows.find((row) => row.gap > 0);
  const top = rows[rows.length - 1];
  const bottom = rows[0];
  // 실효세율이 3.3%를 넘는 연 청구액 — 그 위에서만 "3.3%로는 모자란다"가 참이다
  let flipGross = 0;
  for (let gross = 10_000_000; gross < 200_000_000; gross += 100_000) {
    if (computeComprehensiveTax(gross).totalTax / gross > WITHHOLDING_RATE) {
      flipGross = gross;
      break;
    }
  }

  return {
    h2: "3.3%가 모자라지는 목표 실수령은 따로 있다",
    body: [
      `"3.3%만 떼고 계산하면 부족하다"는 말은 절반만 맞습니다. 목표 실수령을 0.967로 나눈 값과 실제 필요 청구액을 여섯 구간에서 나란히 놓으면, 월 ${won(lastOver.target)}까지는 0.967 계산이 오히려 <strong>${won(-lastOver.gap)} 많이</strong> 잡고, 월 ${won(firstUnder.target)}부터 <strong>${won(firstUnder.gap)} 모자라</strong>기 시작합니다. 방향이 뒤집히는 자리는 연 청구액 약 ${manWon(flipGross)}, 단순경비율로 계산한 실효세율이 원천징수율 ${pct(WITHHOLDING_RATE, 1)}를 넘어서는 지점입니다. 그 아래에서는 5월에 환급이 나오므로 3.3%가 세금보다 많이 떼인 것이고, 그 위에서만 추가 납부가 생깁니다.`,
      `격차의 크기도 구간마다 다릅니다. 월 ${won(bottom.target)}에서는 실효세율이 ${pct(bottom.effective, 2)}에 그쳐 3.3%가 세금을 두 배로 덮지만, 월 ${won(top.target)}에서는 ${pct(top.effective, 2)}로 올라 0.967 계산과 ${won(top.gap)} 벌어집니다. 이 차이가 연으로 ${won(top.gap * 12)}이므로, 고단가 프리랜서가 3.3%만 빼고 견적을 내면 5월에 그만큼을 현금으로 마련해야 합니다.`,
      `그래서 견적에 쓸 숫자는 3.3%가 아니라 <strong>목표 실수령 100만원당 필요한 청구액</strong>입니다. 월 ${won(rows[1].target)}에서 ${won(rows[1].target + 1_000_000)}으로 올릴 때는 청구를 ${won(rows[1].marginal)} 올려야 하고, ${won(rows[2].target)} 위로는 ${won(rows[2].marginal)}으로 일정합니다. 4,000만원을 넘는 수입의 경비율(49.7%)과 15% 세율이 함께 굳어져 한계 부담이 ${pct(1 - 1 / (rows[2].marginal / 1_000_000), 1)}로 고정되기 때문입니다. 실수령 목표를 100만원 올릴 때마다 청구 단가에 ${won(rows[2].marginal - 1_000_000)}을 얹으면 세금은 정확히 맞습니다.`,
    ],
    table: {
      head: ["목표 월 실수령", "실제 필요 월 청구", "0.967로 나눈 값", "차이", "실효세율", "실수령 +100만원당 청구 증가"],
      rows: rows.map((row) => ({
        highlight: row === firstUnder,
        cells: [
          won(row.target),
          `<strong>${won(row.rate.monthlyGross)}</strong>`,
          won(row.naive),
          row.gap < 0 ? `0.967이 ${won(-row.gap)} 과다` : `0.967이 ${won(row.gap)} 부족`,
          pct(row.effective, 2),
          won(row.marginal),
        ],
      })),
    },
    tableNote: `인적용역 단순경비율(4,000만원 이하 64.1%·초과분 49.7%)과 기본공제 1인만 반영한 값입니다. 실효세율은 확정세액을 연 청구액으로 나눈 것이며, 표의 실효세율이 3.3%보다 낮은 행에서는 5월에 환급이 발생합니다.`,
  };
}

export function freelanceRateVersusEmployeeDigest() {
  const target = 4_000_000;
  const freelancer = calcFreelanceRate({ targetMonthlyNet: target, ...RATE_SCHEDULE });
  // 같은 월 실수령을 받는 직장인의 세전 연봉 — 4대보험·소득세를 뺀 실수령이 목표와 같아지는 최소 연봉
  let lo = target * 12;
  let hi = target * 36;
  for (let i = 0; i < 60; i += 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (salaryOf(mid).monthlyNet >= target) hi = mid;
    else lo = mid + 1;
  }
  const employeeGross = hi;
  // 프리랜서가 스스로 내야 하는 지역 건보(소득분)와 국민연금 9.5%까지 실수령에서 빼면 필요 청구액은 다시 오른다
  const selfInsurance = (monthlyGross) =>
    regionalHealthEstimate(monthlyGross).regionalIncomeOnly +
    Math.floor(Math.min(monthlyGross, PENSION_CAP_TAXABLE) * RATES_2026.nationalPension.total);
  let low = freelancer.annualGross;
  let high = freelancer.annualGross * 2;
  for (let i = 0; i < 60; i += 1) {
    const mid = Math.floor((low + high) / 2);
    const monthlyGross = Math.floor(mid / 12);
    const net = (mid - computeComprehensiveTax(mid).totalTax) / 12 - selfInsurance(monthlyGross);
    if (net >= target) high = mid;
    else low = mid + 1;
  }
  const insuredGross = high;
  const insuredMonthly = Math.floor(insuredGross / 12);
  const employee = salaryOf(employeeGross);
  const schedules = [
    [18, 6],
    [22, 6],
    [18, 8],
    [22, 8],
  ].map(([days, hours]) => ({
    days,
    hours,
    ...calcFreelanceRate({ targetMonthlyNet: target, workDaysMonthly: days, billableHoursDaily: hours }),
  }));
  const loose = schedules[0];
  const tight = schedules[schedules.length - 1];

  return {
    h2: "같은 실수령 400만원, 직장인 연봉과 프리랜서 청구액",
    body: [
      `월 ${won(target)}을 손에 남기는 데 필요한 세전 금액은 고용 형태에 따라 다릅니다. 직장인은 4대보험 ${won(employee.totalInsurance)}과 소득세 ${won(employee.totalTax)}을 매달 떼이므로 연봉 <strong>${manWon(employeeGross)}</strong>이 필요하고, 프리랜서는 단순경비율 덕에 연 청구 <strong>${manWon(freelancer.annualGross)}</strong>이면 됩니다. 여기까지만 보면 프리랜서가 연 ${manWon(employeeGross - freelancer.annualGross)} 적게 벌어도 같은 돈을 남기는 것처럼 보입니다.`,
      `그러나 프리랜서의 청구액에는 회사가 대신 내 주던 것이 빠져 있습니다. 지역가입자 건강보험료(소득분만 ${won(regionalHealthEstimate(freelancer.monthlyGross).regionalIncomeOnly)})와 국민연금 ${pct(RATES_2026.nationalPension.total, 1)} 전액(${won(Math.floor(freelancer.monthlyGross * RATES_2026.nationalPension.total))})을 본인이 내면 실수령은 ${won(target - selfInsurance(freelancer.monthlyGross))}으로 내려갑니다. 이 둘을 낸 뒤에도 ${won(target)}을 남기려면 연 청구액은 <strong>${manWon(insuredGross)}</strong>, 월 ${won(insuredMonthly)}이 필요합니다. 직장인 연봉 ${manWon(employeeGross)}보다 ${manWon(insuredGross - employeeGross)} 많은 금액이고, 재산·자동차 점수가 붙는 지역 건보료를 넣으면 더 벌어집니다.`,
      `단가 자체는 청구 가능 시간에 훨씬 민감합니다. 같은 월 ${won(target)} 목표라도 월 ${loose.days}일·일 ${loose.hours}시간을 청구하면 시급 ${won(loose.hourlyRate)}, 월 ${tight.days}일·일 ${tight.hours}시간을 청구하면 ${won(tight.hourlyRate)}으로 <strong>${pct(1 - tight.hourlyRate / loose.hourlyRate, 0)}</strong> 낮아집니다. 세금은 청구 총액에만 붙으므로 시급 차이는 전부 가동률에서 나오며, 영업·미팅으로 청구하지 못하는 시간이 늘수록 표의 시급을 그만큼 올려 잡아야 합니다.`,
    ],
    table: {
      head: ["구분", "필요 세전 금액 (연)", "월 환산", "직장인 연봉과의 차이"],
      rows: [
        { cells: ["직장인 (4대보험·소득세 공제 후 실수령)", `<strong>${manWon(employeeGross)}</strong>`, won(Math.floor(employeeGross / 12)), "기준"] },
        { cells: ["프리랜서 (종합소득세만 반영)", manWon(freelancer.annualGross), won(freelancer.monthlyGross), `−${manWon(employeeGross - freelancer.annualGross)}`] },
        {
          highlight: true,
          cells: ["프리랜서 (지역 건보·국민연금 본인 부담 반영)", `<strong>${manWon(insuredGross)}</strong>`, won(insuredMonthly), `+${manWon(insuredGross - employeeGross)}`],
        },
      ],
    },
    tableNote: `직장인은 부양가족 1인·비과세 식대 월 20만원, 프리랜서는 인적용역 단순경비율·기본공제 1인 기준입니다. 지역 건보료는 소득분만 반영한 최소치(월 소득의 7.19%)이고 국민연금은 기준소득월액 상한 ${won(PENSION_CAP_TAXABLE)}까지 ${pct(RATES_2026.nationalPension.total, 1)}를 적용했습니다.`,
    callout: `<strong>월 ${loose.days}일 × ${loose.hours}시간의 뜻</strong> — 표의 시급 ${won(loose.hourlyRate)}은 한 달 ${loose.days * loose.hours}시간을 전부 청구할 수 있을 때의 값입니다. 실제 청구 시간이 그 70%라면 시급은 ${won(Math.floor(loose.hourlyRate / 0.7))}이어야 같은 실수령이 나옵니다.`,
  };
}

// =========================
// /bonus — 수령률의 U자와 바뀌지 않는 것들
// =========================
const BONUS_SALARY_GRID = [30, 40, 52, 60, 70, 75, 80, 90, 100, 120].map((v) => v * 1_000_000);
const BONUS_FIXED = 5_000_000;

function bonusBandRow(salary) {
  const impact = calcBonusImpact({ annualSalary: salary, bonusAmount: BONUS_FIXED });
  const insuranceBite = (impact.withBonus.totalInsurance - impact.base.totalInsurance) * 12;
  const taxBite = (impact.withBonus.totalTax - impact.base.totalTax) * 12;
  return {
    salary,
    impact,
    insuranceBite,
    taxBite,
    retention: impact.effectiveBonusRate,
    bracket: bracketOf(impact.base.taxableBase),
    overCap: impact.base.taxableMonthly >= PENSION_CAP_TAXABLE,
  };
}

export function bonusRetentionCurveDigest() {
  const rows = BONUS_SALARY_GRID.map(bonusBandRow);
  // 상한 아래 구간의 바닥 — 상한 위로는 세율 구간이 다시 오르며(35%) 수령률이 더 내려가므로
  // "반등"은 연금 상한을 건너는 그 한 자리에서만 성립한다
  const belowCap = rows.filter((row) => !row.overCap);
  const worst = belowCap.reduce((min, row) => (row.retention < min.retention ? row : min), belowCap[0]);
  const rebound = rows[rows.indexOf(worst) + 1];
  const top = rows[rows.length - 1];
  const best = rows[0];
  const firstTaxHeavy = rows.find((row) => row.taxBite > row.insuranceBite);
  const firstOverCap = rows.find((row) => row.overCap);

  return {
    h2: "같은 500만원 상여의 수령률은 연봉대를 따라 U자를 그린다",
    body: [
      `상여 ${won(BONUS_FIXED)}을 연봉 ${manWon(best.salary)}부터 ${manWon(rows[rows.length - 1].salary)}까지 열 개 연봉대에 얹어 보면 수령률은 한 방향으로 내려가지 않습니다. ${manWon(best.salary)}에서 ${pct(best.retention)}로 출발해 <strong>${manWon(worst.salary)}에서 ${pct(worst.retention)}로 바닥</strong>을 치고, 바로 다음 연봉대인 ${manWon(rebound.salary)}에서 ${pct(rebound.retention)}로 <strong>${pointGap(rebound.retention, worst.retention)} 반등</strong>합니다. 연봉이 더 높은데 상여를 더 남기는 구간이 실제로 있습니다.`,
      `반등의 원인은 국민연금 상한입니다. 보수월액이 ${won(PENSION_CAP_TAXABLE)}을 넘으면 연금 보험료가 더 붙지 않으므로, 상여에 붙는 4대보험이 ${won(rows[0].insuranceBite)}에서 ${manWon(rebound.salary)}의 ${won(rebound.insuranceBite)}으로 줄기 시작해 보수월액 전체가 상한 위에 있는 ${manWon(firstOverCap.salary)}부터는 ${won(firstOverCap.insuranceBite)}으로 절반 가까이 내려갑니다. ${manWon(worst.salary)}은 과세표준이 ${pct(worst.bracket.rate, 0)} 구간에 올라섰는데 보수월액은 아직 상한 아래라, 세금은 높은 구간의 것을 내면서 연금은 전액 내는 가장 불리한 조합에 놓인 연봉대입니다.`,
      `상여에서 빠지는 돈의 성격도 연봉대에 따라 바뀝니다. ${manWon(best.salary)}에서는 4대보험 ${won(best.insuranceBite)}이 세금 ${won(best.taxBite)}보다 크지만, ${manWon(firstTaxHeavy.salary)}부터 세금(${won(firstTaxHeavy.taxBite)})이 보험료(${won(firstTaxHeavy.insuranceBite)})를 앞지릅니다. 저연봉 구간에서 상여를 깎는 것은 세율이 아니라 보험료이고, 이 구간은 연말정산 공제를 늘려도 상여 실수령이 거의 달라지지 않습니다.`,
    ],
    table: {
      head: ["연봉", "상여 500만원 실수령", "수령률", "4대보험 증가", "소득세·지방세 증가", "한계세율"],
      rows: rows.map((row) => ({
        highlight: row === worst,
        cells: [
          manWon(row.salary),
          won(row.impact.netBonus),
          `<strong>${pct(row.retention)}</strong>`,
          won(row.insuranceBite),
          won(row.taxBite),
          `${pct(row.bracket.rate, 0)}${row.overCap ? " · 연금 상한" : ""}`,
        ],
      })),
    },
    tableNote: `부양가족 1인·비과세 식대 월 20만원 기준이며, 상여가 없을 때와 있을 때의 연간 공제 차이를 상여 부담으로 본 값입니다. 반등은 오래가지 않습니다 — ${manWon(top.salary)}에서는 과세표준이 ${pct(top.bracket.rate, 0)} 구간에 들어가 수령률이 ${pct(top.retention)}로 다시 내려가고, 이때는 연금 상한이 덮어 줄 보험료가 이미 없어 세율만 남습니다.`,
  };
}

export function bonusInvariantsDigest() {
  const salary = 52_000_000;
  const base = salaryOf(salary);
  // 상여를 얼마 넘게 받아야 다음 세율 구간에 걸리는가 — 10만원 단위로 훑는다
  let bracketBonus = 0;
  for (let bonus = 100_000; bonus <= 100_000_000; bonus += 100_000) {
    if (bracketOf(salaryOf(salary + bonus).taxableBase).rate > bracketOf(base.taxableBase).rate) {
      bracketBonus = bonus;
      break;
    }
  }
  const nextBracket = bracketOf(salaryOf(salary + bracketBonus).taxableBase);
  const marginalAt = (bonus) =>
    calcBonusImpact({ annualSalary: salary, bonusAmount: bonus }).netBonus -
    calcBonusImpact({ annualSalary: salary, bonusAmount: bonus - 1_000_000 }).netBonus;
  const marginalLow = marginalAt(5_000_000);
  const marginalHigh = marginalAt(bracketBonus + 5_000_000);
  // 한 해 몰아 받기 vs 두 해 나눠 받기
  const lump = 25_000_000;
  const once = calcBonusImpact({ annualSalary: salary, bonusAmount: lump }).netBonus;
  const split = 2 * calcBonusImpact({ annualSalary: salary, bonusAmount: lump / 2 }).netBonus;
  const smallOnce = calcBonusImpact({ annualSalary: salary, bonusAmount: 10_000_000 }).netBonus;
  const smallSplit = 2 * calcBonusImpact({ annualSalary: salary, bonusAmount: 5_000_000 }).netBonus;
  const dependents = [1, 2, 4].map((count) => {
    const before = salaryOf(salary, { dependents: count, children: count >= 4 ? 2 : 0 });
    const after = salaryOf(salary + BONUS_FIXED, { dependents: count, children: count >= 4 ? 2 : 0 });
    return { count, net: after.annualNet - before.annualNet, monthlyTax: before.totalTax };
  });

  return {
    h2: "나눠 받아도, 부양가족이 많아도 바뀌지 않는 것",
    body: [
      `연봉 ${manWon(salary)}의 과세표준 ${won(base.taxableBase)}은 ${pct(bracketOf(base.taxableBase).rate, 0)} 구간 상단에서 ${won(INCOME_TAX_BRACKETS[1].limit - base.taxableBase)} 아래에 있습니다. 상여가 <strong>${manWon(bracketBonus)}</strong>을 넘는 순간 그 초과분은 ${pct(nextBracket.rate, 0)} 구간으로 올라가고, 상여 100만원당 실수령은 ${won(marginalLow)}에서 ${won(marginalHigh)}으로 ${won(marginalLow - marginalHigh)} 줄어듭니다. 그 선 아래에서는 상여가 300만원이든 2,000만원이든 100만원당 남는 돈이 ${won(marginalLow)}으로 같습니다.`,
      `"두 해로 나눠 받으면 세금이 줄어든다"는 통념은 이 선을 넘을 때만 참입니다. 상여 ${manWon(lump)}을 한 해에 받으면 실수령 ${won(once)}, 절반씩 두 해에 걸쳐 받으면 합계 ${won(split)}으로 <strong>${won(split - once)}</strong> 차이가 나지만, ${manWon(10_000_000)}을 한 번에 받는 것과 ${manWon(5_000_000)}씩 두 번 받는 것은 ${won(smallOnce)}과 ${won(smallSplit)}으로 ${won(Math.abs(smallSplit - smallOnce))} 차이에 그칩니다. 구간을 넘지 않는 상여를 나눠 받는 것은 세금이 아니라 현금 흐름만 바꿉니다.`,
      `부양가족 수도 상여 실수령을 바꾸지 못합니다. 인적공제는 상여가 있든 없든 같은 금액이 빠지므로, 연봉 ${manWon(salary)}에 상여 ${won(BONUS_FIXED)}을 얹었을 때 늘어나는 연 실수령은 부양가족 ${dependents.map((row) => `${row.count}인 ${won(row.net)}`).join("·")}으로 사실상 같습니다. 부양가족이 많으면 매달 소득세가 ${won(dependents[0].monthlyTax)}에서 ${won(dependents[dependents.length - 1].monthlyTax)}으로 줄지만, 그 절감은 기본급에서 이미 일어난 것이고 상여에 붙는 한계세율은 그대로입니다.`,
    ],
    table: {
      head: ["상여 지급 방식 (연봉 " + manWon(salary) + ")", "세전 합계", "실수령 합계", "차이"],
      rows: [
        { cells: [`${manWon(10_000_000)} 한 번`, manWon(10_000_000), won(smallOnce), "—"] },
        { cells: [`${manWon(5_000_000)} × 2년`, manWon(10_000_000), won(smallSplit), `${smallSplit >= smallOnce ? "+" : "−"}${won(Math.abs(smallSplit - smallOnce))}`] },
        { cells: [`${manWon(lump)} 한 번`, manWon(lump), won(once), "—"] },
        { highlight: true, cells: [`${manWon(lump / 2)} × 2년`, manWon(lump), `<strong>${won(split)}</strong>`, `+${won(split - once)}`] },
      ],
    },
    tableNote: `두 해에 나눠 받는 경우 각 해의 연봉이 ${manWon(salary)}으로 같다고 가정한 값입니다. 다음 해 연봉이 오르면 나눠 받은 두 번째 상여의 한계세율도 함께 오르므로 차이는 표보다 줄어듭니다.`,
    callout: `<strong>지급 월 명세서와 이 표가 다른 이유</strong> — 회사는 상여 지급 월에 간이세액표의 상여 산식으로 세금을 먼저 떼고, 연말정산에서 위 금액으로 맞춥니다. 표는 연말정산이 끝난 뒤의 값이므로, 지급 월에 더 떼였다면 2월에 그 차액이 돌아옵니다.`,
  };
}

// =========================
// /monthly-rent-deduction — 다 못 쓰는 연봉과 두 개의 절벽
// =========================
const RENT_SCENARIO = { monthlyRent: 700_000, paidMonths: 12 };
const RENT_SALARY_GRID = [25, 30, 35, 40, 48, 55, 60, 80].map((v) => v * 1_000_000);

function rentRow(salary) {
  const credit = calcMonthlyRentDeduction({ annualSalary: salary, ...RENT_SCENARIO });
  const payroll = salaryOf(salary);
  // 결정세액(지방세 제외)보다 큰 세액공제는 쓸 수 없다
  const usable = Math.min(credit.taxCredit, payroll.determinedTax);
  return { salary, credit, payroll, usable, usableShare: credit.taxCredit > 0 ? usable / credit.taxCredit : 0 };
}

// 세액공제를 처음 전부 쓸 수 있는 연봉 — 결정세액이 공제액과 같아지는 최소 연봉
function fullyUsableSalary(taxCredit) {
  let lo = 10_000_000;
  let hi = 100_000_000;
  for (let i = 0; i < 60; i += 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (salaryOf(mid).determinedTax >= taxCredit) hi = mid;
    else lo = mid + 1;
  }
  return hi;
}

// 절벽에서 잃는 공제를 세후로 되찾는 데 필요한 최소 연봉 인상폭
function raiseToOffset(salary, loss) {
  const before = salaryOf(salary).annualNet;
  for (let gross = salary + 10_000; gross <= salary + 10_000_000; gross += 10_000) {
    if (salaryOf(gross).annualNet - before >= loss) return gross - salary;
  }
  return null;
}

export function rentCreditCliffsDigest() {
  const rows = RENT_SALARY_GRID.map(rentRow);
  const full = rows.find((row) => row.salary === 55_000_000);
  const usableFrom = fullyUsableSalary(full.credit.taxCredit);
  const partial = rows.filter((row) => row.usableShare < 1 && row.credit.eligible);
  const lowest = partial[0];
  const cliffLow = { salary: 55_000_000, loss: calcMonthlyRentDeduction({ annualSalary: 55_000_000, ...RENT_SCENARIO }).taxCredit - calcMonthlyRentDeduction({ annualSalary: 55_010_000, ...RENT_SCENARIO }).taxCredit };
  const cliffHigh = { salary: 80_000_000, loss: calcMonthlyRentDeduction({ annualSalary: 80_000_000, ...RENT_SCENARIO }).taxCredit };
  cliffLow.raise = raiseToOffset(cliffLow.salary, cliffLow.loss);
  cliffHigh.raise = raiseToOffset(cliffHigh.salary, cliffHigh.loss);

  return {
    h2: "월세 공제를 다 못 쓰는 연봉과 두 개의 절벽",
    body: [
      `월세 ${won(RENT_SCENARIO.monthlyRent)}의 세액공제 ${won(full.credit.taxCredit)}은 공제율만 보면 총급여 5,500만원 이하 누구에게나 같은 금액이지만, 실제로 돌아오는 돈은 <strong>낼 세금이 그만큼 있어야</strong> 생깁니다. 총급여 ${manWon(lowest.salary)}의 결정세액은 ${won(lowest.payroll.determinedTax)}이라 공제 ${won(lowest.credit.taxCredit)} 가운데 ${pct(lowest.usableShare, 0)}만 쓸 수 있고, 나머지 ${won(lowest.credit.taxCredit - lowest.usable)}은 사라집니다. 공제를 전부 쓸 수 있는 연봉은 부양가족 1인 기준 <strong>${manWon(usableFrom)}</strong>부터이며, 그 아래에서는 월세를 더 낸다고 환급이 더 늘지 않습니다.`,
      `위쪽에는 절벽이 둘 있습니다. 총급여 ${manWon(cliffLow.salary)}에서 1만원만 넘어도 공제율이 17%에서 15%로 내려가 ${won(cliffLow.loss)}을 잃고, ${manWon(cliffHigh.salary)}을 1만원 넘으면 공제 자체가 사라져 ${won(cliffHigh.loss)}을 잃습니다. 세후로 이 손실을 메우려면 첫 절벽에서는 연봉이 최소 <strong>${won(cliffLow.raise)}</strong>, 두 번째 절벽에서는 <strong>${won(cliffHigh.raise)}</strong> 더 올라야 합니다. ${manWon(cliffHigh.salary)}에서 ${manWon(cliffHigh.salary + cliffHigh.raise - 10_000)}까지의 인상은 월세 공제를 잃는 만큼 실수령이 오히려 줄어드는 구간입니다.`,
      `절벽의 기준은 세전 총급여이고, 여기에는 상여와 성과급이 포함됩니다. 연봉 ${manWon(cliffLow.salary - 2_000_000)}에 성과급 300만원을 받으면 총급여가 첫 절벽을 넘어 공제율이 내려가므로, 절벽 근처라면 성과급 지급 시기가 연말정산 환급을 ${won(cliffLow.loss)} 움직입니다. 비과세 식대 월 20만원은 총급여에서 빠지므로 같은 계약 연봉이라도 비과세 항목이 있으면 절벽에서 그만큼 멀어집니다.`,
    ],
    table: {
      head: ["총급여", "공제율", "월세 세액공제", "결정세액 (공제 전)", "실제 환급되는 몫"],
      rows: rows.map((row) => ({
        highlight: row.salary === 55_000_000,
        cells: [
          manWon(row.salary),
          row.credit.eligible ? pct(row.credit.deductionRate, 0) : "대상 아님",
          row.credit.eligible ? won(row.credit.taxCredit) : "0원",
          won(row.payroll.determinedTax),
          `<strong>${won(row.usable)}</strong>${row.usableShare < 1 && row.credit.eligible ? ` (${pct(row.usableShare, 0)})` : ""}`,
        ],
      })),
    },
    tableNote: `월세 ${won(RENT_SCENARIO.monthlyRent)}·12개월, 부양가족 1인·비과세 식대 월 20만원 기준이며 결정세액은 근로소득세액공제와 표준세액공제만 반영한 값입니다. 다른 세액공제(연금계좌·보험료·의료비)를 함께 받으면 월세 공제에 쓸 수 있는 결정세액이 그만큼 줄어듭니다.`,
  };
}

export function rentCreditCapDigest() {
  const salary = 48_000_000;
  const rate = calcMonthlyRentDeduction({ annualSalary: salary, ...RENT_SCENARIO }).deductionRate;
  const capMonthly = Math.floor(10_000_000 / 12);
  const rents = [500_000, 700_000, capMonthly, 900_000, 1_000_000, 1_200_000].map((rent) => {
    const credit = calcMonthlyRentDeduction({ annualSalary: salary, monthlyRent: rent, paidMonths: 12 });
    return { rent, credit, effective: credit.taxCredit / credit.yearlyRent, monthsBack: credit.taxCredit / rent };
  });
  const under = rents[1];
  const over = rents.find((row) => row.rent === 1_000_000);
  const perMonth = calcMonthlyRentDeduction({ annualSalary: salary, monthlyRent: RENT_SCENARIO.monthlyRent, paidMonths: 1 }).taxCredit;

  return {
    h2: "월 " + won(capMonthly) + " 위의 월세는 공제되지 않는다",
    body: [
      `공제 대상 월세에는 연 ${won(10_000_000)} 한도가 있어 월로 나누면 <strong>${won(capMonthly)}</strong>이 경계입니다. 그 아래에서는 월세가 얼마든 공제율 ${pct(rate, 0)}가 그대로 적용돼 돌려받는 돈이 월세의 <strong>${under.monthsBack.toFixed(2)}개월치</strong>로 일정하지만, 경계를 넘으면 초과분은 공제되지 않습니다. 월세 ${won(over.rent)}이면 실효 공제율이 ${pct(over.effective, 1)}로 내려가고 돌려받는 돈은 ${over.monthsBack.toFixed(2)}개월치, ${won(rents[rents.length - 1].rent)}이면 ${pct(rents[rents.length - 1].effective, 1)}·${rents[rents.length - 1].monthsBack.toFixed(2)}개월치로 줄어듭니다.`,
      `그래서 월세가 ${won(capMonthly)}을 넘는 집에서는 "월세를 올려 공제를 더 받는" 계산이 성립하지 않습니다. ${won(under.rent)}에서 ${won(over.rent)}으로 월세가 ${won(over.rent - under.rent)} 오르면 공제는 ${won(over.credit.taxCredit - under.credit.taxCredit)} 늘어나는 데 그치고, 그 위로는 1원도 늘지 않습니다. 반전세로 보증금을 올리고 월세를 ${won(capMonthly)} 아래로 낮추는 구조라면 월세 전액이 공제 범위에 들어옵니다.`,
      `개월 수도 같은 비율로 움직입니다. 월세 ${won(RENT_SCENARIO.monthlyRent)}이면 한 달치 공제가 ${won(perMonth)}이므로, 이체 내역을 한 달 빠뜨리거나 전입신고가 한 달 늦어지면 그만큼이 사라집니다. 연중에 이사해 두 집의 월세를 냈다면 두 계약 모두 요건을 갖춘 달만 합산하고, 합산 월세가 ${won(10_000_000)}을 넘는 부분은 역시 잘립니다.`,
    ],
    table: {
      head: ["월세", "연 월세", "공제 대상 월세", "세액공제", "실효 공제율", "돌려받는 월세 개월치"],
      rows: rents.map((row) => ({
        highlight: row.rent === capMonthly,
        cells: [
          won(row.rent),
          won(row.credit.yearlyRent),
          won(row.credit.recognizedRent),
          `<strong>${won(row.credit.taxCredit)}</strong>`,
          pct(row.effective, 1),
          `${row.monthsBack.toFixed(2)}개월`,
        ],
      })),
    },
    tableNote: `총급여 ${manWon(salary)}(공제율 ${pct(rate, 0)})·12개월 납부 기준입니다. 총급여 5,500만원 초과 8,000만원 이하라면 공제율 15%로 같은 표의 금액이 ${pct(0.15 / rate, 0)} 수준이 됩니다.`,
    callout: `<strong>관리비는 월세가 아니다</strong> — 임대차계약서에 월세와 관리비가 나뉘어 있으면 월세 부분만 공제 대상입니다. 월세 ${won(over.rent)} 가운데 관리비 ${won(150_000)}이 포함된 계약이라면 공제 대상 월세는 ${won(over.rent - 150_000)}으로 한도 안에 들어와, 관리비를 분리한 쪽이 오히려 실효 공제율을 ${pct(rate, 0)}로 되돌립니다.`,
  };
}

// =========================
// /4-insurance-employer — 상한 위에서 무너지는 부담률과 예산의 역산
// =========================
const EMPLOYER_RATES = { employmentRatePercent: 0.9, accidentRatePercent: 1.5 };
const EMPLOYER_SALARY_GRID = [1_000_000, 2_000_000, 3_200_000, 5_000_000, PENSION_CAP_TAXABLE, 8_000_000, 10_000_000, 15_000_000];

function employerRow(salary) {
  const burden = calcEmployerInsuranceBurden({ monthlySalary: salary, ...EMPLOYER_RATES });
  const employee = calcInsuranceDeduction(salary);
  return {
    salary,
    burden,
    employee,
    ratio: burden.totalMonthlyBurden / employee.totalInsurance,
    combined: (burden.totalMonthlyBurden + employee.totalInsurance) / salary,
  };
}

export function employerCapCurveDigest() {
  const rows = EMPLOYER_SALARY_GRID.map(employerRow);
  const flat = rows.find((row) => row.salary === 3_200_000);
  const cap = rows.find((row) => row.salary === PENSION_CAP_TAXABLE);
  const top = rows[rows.length - 1];
  const oneHigh = calcEmployerInsuranceBurden({ monthlySalary: 8_000_000, ...EMPLOYER_RATES }).totalMonthlyBurden;
  const twoHalf = 2 * calcEmployerInsuranceBurden({ monthlySalary: 4_000_000, ...EMPLOYER_RATES }).totalMonthlyBurden;
  const raiseCost = (salary) =>
    100_000 +
    calcEmployerInsuranceBurden({ monthlySalary: salary + 100_000, ...EMPLOYER_RATES }).totalMonthlyBurden -
    calcEmployerInsuranceBurden({ monthlySalary: salary, ...EMPLOYER_RATES }).totalMonthlyBurden;

  return {
    h2: "사업주 부담률 " + pct(flat.burden.employerRate, 2) + "는 연금 상한 위에서 내려간다",
    body: [
      `사업주 부담률은 월급 ${won(rows[0].salary)}부터 ${won(cap.salary)}까지 <strong>${pct(flat.burden.employerRate, 2)}</strong>로 한 치도 움직이지 않다가, 국민연금 기준소득월액 상한 ${won(PENSION_CAP_TAXABLE)}을 넘는 순간부터 내려가기 시작합니다. 월급 ${won(rows.find((row) => row.salary === 8_000_000).salary)}에서 ${pct(rows.find((row) => row.salary === 8_000_000).burden.employerRate, 2)}, ${won(top.salary)}에서는 ${pct(top.burden.employerRate, 2)}입니다. 연금 사업주분 ${pct(RATES_2026.nationalPension.employer, 2)}가 ${won(cap.burden.nationalPension)}에 고정되고 건강보험·고용·산재만 정률로 따라 오르기 때문입니다.`,
      `이 상한은 채용 구조에 따라 비용을 갈라 놓습니다. 월급 ${won(8_000_000)} 한 명의 사업주 부담은 ${won(oneHigh)}인데, 월급 ${won(4_000_000)} 두 명은 ${won(twoHalf)}으로 <strong>${won(twoHalf - oneHigh)}</strong> 더 듭니다. 인건비 총액이 같아도 상한 위의 급여는 연금 부담이 잘리고 상한 아래의 급여는 전액 부과되기 때문이며, 연으로는 ${won((twoHalf - oneHigh) * 12)} 차이입니다. 반대로 월급 ${won(100_000)} 인상의 사업주 실제 비용은 상한 아래(${won(flat.salary)})에서 ${won(raiseCost(flat.salary))}, 상한 위(${won(7_000_000)})에서 ${won(raiseCost(7_000_000))}입니다.`,
      `근로자 공제와 나란히 놓으면 비율이 하나 더 나옵니다. 사업주 부담은 근로자 공제의 <strong>${flat.ratio.toFixed(2)}배</strong>이고, 둘을 합친 4대보험 총액은 월급의 ${pct(flat.combined, 1)}입니다. 상한 아래에서는 이 두 값도 고정이라, 근로자 명세서의 4대보험 공제액에 ${flat.ratio.toFixed(2)}를 곱하면 회사가 같은 사람에게 얼마를 더 내는지 바로 나옵니다. 산재보험이 전액 사업주 부담이라 배율이 1을 넘습니다.`,
    ],
    table: {
      head: ["직원 월급", "사업주 부담 (월)", "사업주 부담률", "근로자 공제 (월)", "사업주 ÷ 근로자", "4대보험 합계 비율"],
      rows: rows.map((row) => ({
        highlight: row.salary === PENSION_CAP_TAXABLE,
        cells: [
          won(row.salary),
          won(row.burden.totalMonthlyBurden),
          `<strong>${pct(row.burden.employerRate, 2)}</strong>`,
          won(row.employee.totalInsurance),
          `${row.ratio.toFixed(2)}배`,
          pct(row.combined, 1),
        ],
      })),
    },
    tableNote: `고용보험 사업주 0.9%·산재보험 1.5% 기준입니다. 국민연금은 기준소득월액 하한 ${won(RATES_2026.nationalPension.minMonthlyIncome)}에서 상한 ${won(PENSION_CAP_TAXABLE)}까지만 부과되므로 그 사이에서는 모든 비율이 월급과 무관하게 같습니다.`,
  };
}

export function employerBudgetDigest() {
  const salary = 3_200_000;
  const accidentGrid = [0.7, 1.5, 4.75, 10, 18].map((accidentRatePercent) => ({
    accidentRatePercent,
    ...calcEmployerInsuranceBurden({ monthlySalary: salary, employmentRatePercent: 0.9, accidentRatePercent }),
  }));
  const pensionParity = accidentGrid.find((row) => row.accidentRatePercent === RATES_2026.nationalPension.employer * 100);
  const lowest = accidentGrid[0];
  const highest = accidentGrid[accidentGrid.length - 1];
  // 총 인건비 예산 → 제시 가능한 월급 (퇴직급여 적립 1/12 포함·미포함)
  const budget = 4_000_000;
  const solve = (withSeverance) => {
    let lo = 0;
    let hi = budget;
    for (let i = 0; i < 60; i += 1) {
      const mid = Math.floor((lo + hi) / 2);
      const burden = calcEmployerInsuranceBurden({ monthlySalary: mid, ...EMPLOYER_RATES }).totalMonthlyBurden;
      const total = mid + burden + (withSeverance ? Math.floor(mid / 12) : 0);
      if (total <= budget) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  const offerable = solve(false);
  const offerableWithSeverance = solve(true);
  const standard = calcEmployerInsuranceBurden({ monthlySalary: salary, ...EMPLOYER_RATES });
  const fullCost = salary + standard.totalMonthlyBurden + Math.floor(salary / 12);
  const dururi = calcEmployerInsuranceBurden({ monthlySalary: 2_500_000, ...EMPLOYER_RATES });
  const dururiSupport = Math.floor((dururi.nationalPension + dururi.employmentInsurance) * 0.8);

  return {
    h2: "산재요율 하나가 연금 사업주분과 같아지는 지점, 그리고 예산의 역산",
    body: [
      `사업주 부담에서 유일하게 업종을 따라 움직이는 항목이 산재보험입니다. 월급 ${won(salary)}에 요율을 ${lowest.accidentRatePercent}%(금융·사무)부터 ${highest.accidentRatePercent}%(광업·벌목 등 최고 구간)까지 바꿔 보면 산재보험료만 ${won(lowest.industrialAccident)}에서 ${won(highest.industrialAccident)}으로 벌어지고, 총 부담률은 ${pct(lowest.employerRate, 2)}에서 <strong>${pct(highest.employerRate, 2)}</strong>까지 올라갑니다. 요율 <strong>${pensionParity.accidentRatePercent}%</strong>가 되면 산재보험료 ${won(pensionParity.industrialAccident)}이 국민연금 사업주분 ${won(pensionParity.nationalPension)}과 정확히 같아지므로, 그 위의 업종은 연금보다 산재를 더 내는 셈입니다.`,
      `채용 예산을 거꾸로 풀면 제시할 수 있는 월급이 나옵니다. 1인 인건비 예산이 월 ${won(budget)}이라면 4대보험 사업주분을 뺀 제시 가능 월급은 <strong>${won(offerable)}</strong>이고, 1년 이상 근속 시 발생하는 퇴직급여를 매달 12분의 1씩 적립까지 하면 <strong>${won(offerableWithSeverance)}</strong>으로 내려옵니다. 월급 ${won(salary)} 한 명의 실제 월 비용은 보험료와 퇴직급여 적립을 합쳐 ${won(fullCost)}, 월급의 ${pct(fullCost / salary, 1)}입니다.`,
      `10인 미만 사업장이 월 보수 일정 기준 미만의 신규 근로자를 고용해 두루누리 지원을 받으면, 월급 ${won(2_500_000)} 기준 국민연금 사업주분 ${won(dururi.nationalPension)}과 고용보험 ${won(dururi.employmentInsurance)}의 80%인 <strong>${won(dururiSupport)}</strong>이 매달 줄어듭니다. 사업주 부담 ${won(dururi.totalMonthlyBurden)}의 ${pct(dururiSupport / dururi.totalMonthlyBurden, 0)}에 해당하고, 근로자 부담분도 같은 비율로 지원되므로 소규모 사업장의 신규 채용에서는 지원 여부가 총 인건비를 가장 크게 움직이는 변수입니다.`,
    ],
    table: {
      head: ["산재보험 요율", "산재보험료 (월)", "사업주 부담 합계 (월)", "사업주 부담률"],
      rows: accidentGrid.map((row) => ({
        highlight: row === pensionParity,
        cells: [
          `${row.accidentRatePercent}%`,
          won(row.industrialAccident),
          won(row.totalMonthlyBurden),
          `<strong>${pct(row.employerRate, 2)}</strong>`,
        ],
      })),
    },
    tableNote: `월급 ${won(salary)}·고용보험 0.9% 기준입니다. 산재보험 요율은 근로복지공단이 매년 업종별로 고시하며, 같은 업종이라도 개별실적요율제로 사업장별 사고 이력에 따라 최대 ±50% 조정됩니다.`,
    callout: `<strong>예산 역산의 쓸모</strong> — 채용 공고에 적을 월급은 예산에서 ${pct(standard.employerRate, 2)}의 보험료와 ${pct(1 / 12, 1)}의 퇴직급여 적립을 미리 뺀 값이어야 합니다. 월 ${won(budget)} 예산으로 월급 ${won(budget)}을 약속하면 실제 비용은 ${won(budget + calcEmployerInsuranceBurden({ monthlySalary: budget, ...EMPLOYER_RATES }).totalMonthlyBurden + Math.floor(budget / 12))}이 됩니다.`,
  };
}
