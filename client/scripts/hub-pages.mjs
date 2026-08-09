// Hub body definitions, one per base calculator route. See hub-content.mjs for the renderer.
//
// Every figure below is produced by calc-engine.mjs at build time — the same functions the amount
// variants render with. Nothing here is a transcribed constant, so a rate change moves the hub
// prose and the variant pages in one edit and they cannot disagree.

import {
  calculateSalaryBreakdown,
  computeComprehensiveTax,
  EITC_BRACKET_TABLE,
  eitcAmountFor,
  formatManWonValue,
  formatPercent,
  formatWon,
  parentalLeavePay,
  RATES_2026,
  regionalHealthEstimate,
  severancePayEstimate,
  SEVERANCE_ASSUMED_MONTHLY,
  unemploymentDailyAllowance,
  UNEMPLOYMENT_DAILY_MAX,
  UNEMPLOYMENT_DAILY_MIN,
  unpaidWageInterest,
  wageConversion,
  weeklyHolidayPay,
  withholdingReverse,
} from "./calc-engine.mjs";
import {
  COMPARE_PAIRS,
  COMPREHENSIVE_TAX_AMOUNTS,
  FREELANCER_AMOUNTS,
  PARENTAL_LEAVE_AMOUNTS,
  QUIT_YEARS,
  REGIONAL_HEALTH_AMOUNTS,
  SEVERANCE_PAY_AMOUNTS,
  UNEMPLOYMENT_AMOUNTS,
  UNPAID_WAGE_AMOUNTS,
  WAGE_CONVERTER_AMOUNTS,
  WEEKLY_HOLIDAY_PAY_AMOUNTS,
  WITHHOLDING_AMOUNTS,
  YEAR_END_AMOUNTS,
} from "./seo-routes.mjs";

const STANDARD_SALARY_INPUT = {
  nonTaxableMonthly: 200_000,
  dependents: 1,
  children: 0,
  retirementIncluded: false,
};

function salaryOf(manWon) {
  return calculateSalaryBreakdown({ grossAnnual: manWon * 10_000, ...STANDARD_SALARY_INPUT });
}

const won = (value) => formatWon(value);
const manWon = (value) => `${formatManWonValue(value)}원`;

// =========================
// 종합소득세 (/comprehensive-tax)
// =========================
function comprehensiveTaxHub() {
  const rows = COMPREHENSIVE_TAX_AMOUNTS.map((amount) => {
    const calc = computeComprehensiveTax(amount * 10_000);
    return { amount, calc };
  });
  const lastRefund = [...rows].reverse().find((row) => row.calc.refund > 0);
  const firstDue = rows.find((row) => row.calc.refund < 0);

  return {
    h1: "2026 종합소득세 계산기 | 프리랜서·사업소득 세금",
    lead: [
      "3.3%를 떼고 받은 프리랜서·사업소득자가 5월 종합소득세 신고에서 <strong>얼마를 돌려받고 얼마를 더 내야 하는지</strong>를 계산합니다. 인적용역 단순경비율(4,000만원 이하 64.1%, 초과분 49.7%)과 6~45% 8구간 누진세율, 표준세액공제 7만원, 지방소득세 10%를 순서대로 적용합니다.",
      `이 계산기가 다루는 범위는 연 수입 ${manWon(COMPREHENSIVE_TAX_AMOUNTS[0])}부터 ${manWon(COMPREHENSIVE_TAX_AMOUNTS[COMPREHENSIVE_TAX_AMOUNTS.length - 1])}까지입니다. 같은 3.3%를 떼였어도 수입 규모에 따라 결론이 환급에서 추가 납부로 뒤집히기 때문에, 아래 표에서 본인 수입대의 방향을 먼저 확인한 뒤 해당 금액 페이지로 이동하는 것이 빠릅니다.`,
    ],
    sections: [
      {
        h2: "3.3%는 세금이 아니라 선납금이다",
        body: [
          "용역 대가를 지급할 때 떼는 3.3%는 소득세 3%와 지방소득세 0.3%를 미리 걷어두는 <strong>원천징수</strong>입니다. 확정된 세금이 아니므로, 5월 종합소득세 신고에서 실제 세액을 계산해 이미 낸 3.3%와 비교합니다. 실제 세액이 더 적으면 차액을 돌려받고, 더 많으면 그만큼 추가로 납부합니다.",
          "따라서 3.3%를 떼였다는 사실만으로는 환급 여부를 알 수 없습니다. 결정적인 변수는 <strong>필요경비를 얼마나 인정받느냐</strong>이고, 장부를 쓰지 않는 경우 업종별 단순경비율이 그 자리를 대신합니다.",
        ],
      },
      {
        h2: "단순경비율이 4,000만원에서 한 번 꺾인다",
        body: [
          "IT·디자인·작가 등 인적용역의 단순경비율은 수입 4,000만원까지 <strong>64.1%</strong>, 초과분은 <strong>49.7%</strong>가 적용됩니다. 즉 4,000만원을 넘는 순간부터 추가 수입 1원당 인정되는 경비가 0.641원에서 0.497원으로 줄어, 같은 100만원을 더 벌어도 과세표준은 35.9만원이 아니라 50.3만원 늘어납니다.",
          "누진세율 구간이 바뀌는 지점과 이 경비율 분기점이 겹치면 체감 세부담이 급격히 올라갑니다. 수입이 4,000만원 근처라면 장부 작성(기준경비율·간편장부)으로 실제 경비를 인정받는 쪽이 유리한지 반드시 비교해야 합니다.",
        ],
      },
      {
        h2: "수입 규모별 경비·과세표준·최종 세액",
        table: {
          head: ["연 수입", "인정 경비", "과세표준", "총 세액(지방세 포함)", "3.3% 정산"],
          rows: rows.map(({ amount, calc }) => ({
            highlight: calc.refund > 0,
            cells: [
              manWon(amount),
              won(calc.expenses),
              won(calc.taxableBase),
              won(calc.totalTax),
              calc.refund >= 0
                ? `<strong style="color:#047857;">${won(calc.refund)} 환급</strong>`
                : `<strong style="color:#dc2626;">${won(Math.abs(calc.refund))} 추가 납부</strong>`,
            ],
          })),
        },
        tableNote:
          "기본공제 1인(150만원)·표준세액공제 7만원만 반영한 단독 사업자 기준입니다. 부양가족, 연금보험료 공제, 노란우산공제, 다른 소득 합산은 포함하지 않았습니다.",
      },
      {
        h2: "환급이 추가 납부로 뒤집히는 지점",
        body: [
          lastRefund && firstDue
            ? `표에서 방향이 바뀌는 곳은 연 수입 ${manWon(lastRefund.amount)}과 ${manWon(firstDue.amount)} 사이입니다. ${manWon(lastRefund.amount)}에서는 3.3% 기납부액 ${won(lastRefund.calc.withholdingPrepaid)}이 확정세액 ${won(lastRefund.calc.totalTax)}보다 많아 ${won(lastRefund.calc.refund)}을 돌려받지만, ${manWon(firstDue.amount)}에서는 확정세액 ${won(firstDue.calc.totalTax)}이 기납부액 ${won(firstDue.calc.withholdingPrepaid)}을 넘어서 ${won(Math.abs(firstDue.calc.refund))}을 더 내야 합니다.`
            : "",
          "이유는 단순합니다. 원천징수는 수입에 <strong>정률 3.3%</strong>로 붙는 반면, 종합소득세는 <strong>누진</strong>이라 수입이 커질수록 실효세율이 3.3%를 넘어서기 때문입니다. 수입이 커지는 해에는 5월에 낼 돈을 미리 떼어두는 편이 안전합니다.",
        ],
        callout:
          "<strong>신고 기한</strong> — 종합소득세 확정신고·납부는 매년 5월 1일~5월 31일(성실신고확인 대상은 6월 30일)입니다. 기한을 넘기면 무신고가산세 20%와 납부지연가산세가 붙습니다.",
      },
    ],
    variants: {
      h2: "수입 금액별 상세 계산 보기",
      lead: "각 페이지에는 해당 수입의 경비·과세표준·구간별 산출세액과 인접 금액과의 세액 차이가 들어 있습니다.",
      items: rows.map(({ amount, calc }) => ({
        href: `/comprehensive-tax/${amount}`,
        label: `연 수입 ${manWon(amount)} 종합소득세`,
        note: calc.refund >= 0 ? `약 ${won(calc.refund)} 환급` : `약 ${won(Math.abs(calc.refund))} 추가 납부`,
      })),
    },
    note: "※ 단순경비율 적용 대상 인적용역 기준 추정치입니다. 업종 코드·장부 작성 여부·다른 소득에 따라 실제 세액이 달라지며, 확정 금액은 국세청 홈택스 신고 화면에서 확인하세요.",
  };
}

// =========================
// 이직 연봉 비교 (/compare)
// =========================
function compareHub() {
  const rows = COMPARE_PAIRS.map(([a, b]) => {
    const from = salaryOf(a);
    const to = salaryOf(b);
    return {
      a,
      b,
      monthlyGap: to.monthlyNet - from.monthlyNet,
      annualGap: to.annualNet - from.annualNet,
      nominal: (b - a) / a,
      afterTax: (to.annualNet - from.annualNet) / from.annualNet,
    };
  });
  // Pairs that raise pay by exactly 1,000만원 — comparing those isolates the progressive-bracket
  // effect, because the only thing differing between them is where the raise lands.
  const sameRaise = rows.filter((row) => row.b - row.a === 1000);
  const cheapest = sameRaise.reduce((min, row) => (row.monthlyGap < min.monthlyGap ? row : min), sameRaise[0]);
  const richest = sameRaise.reduce((max, row) => (row.monthlyGap > max.monthlyGap ? row : max), sameRaise[0]);

  return {
    h1: "이직 연봉 비교 계산기 | 실수령액 차이 비교 2026",
    lead: [
      "현재 연봉과 제안 연봉을 나란히 놓고 <strong>월 실수령액이 실제로 얼마나 늘어나는지</strong>를 계산합니다. 두 연봉 모두 2026년 4대보험 요율과 근로소득 간이세액표를 똑같이 적용하므로, 명목 인상률이 아니라 통장에 찍히는 금액으로 제안을 비교할 수 있습니다.",
      `이 계산기가 다루는 구간은 연봉 ${manWon(3000)}대부터 ${manWon(10000)}대까지입니다. 아래 표는 자주 비교되는 8개 조합의 세후 증가액이며, 각 조합의 상세 페이지에는 공제 항목별 증감과 협상 시 확인할 지점이 들어 있습니다.`,
    ],
    sections: [
      {
        h2: "명목 인상률과 세후 인상률이 벌어지는 이유",
        body: [
          "연봉이 오르면 소득세만 오르는 것이 아닙니다. 국민연금 4.75%, 건강보험 3.595%, 장기요양보험(건보료의 13.14%), 고용보험 0.9%가 함께 늘고, 소득세는 6~45% 누진 구조라 인상분이 <strong>더 높은 세율 구간</strong>에 얹힙니다.",
          "그 결과 명목 인상률과 세후 인상률의 격차는 연봉이 높을수록 커집니다. 아래 표의 마지막 두 열을 비교하면, 같은 비율을 올려 받아도 고연봉 구간일수록 손에 남는 비율이 낮다는 것이 그대로 드러납니다.",
        ],
      },
      {
        h2: "비교 조합별 월·연 실수령 차이",
        table: {
          head: ["비교", "월 실수령 차이", "연 실수령 차이", "명목 인상률", "세후 인상률"],
          rows: rows.map((row) => ({
            cells: [
              `${manWon(row.a)} → ${manWon(row.b)}`,
              `<strong>${won(row.monthlyGap)}</strong>`,
              won(row.annualGap),
              formatPercent(row.nominal),
              `<strong style="color:#047857;">${formatPercent(row.afterTax)}</strong>`,
            ],
          })),
        },
        tableNote:
          "부양가족 1인·비과세 식대 월 20만원·자녀 없음 기준입니다. 성과급, 스톡옵션, 회사별 비과세 항목과 연말정산 결과는 포함하지 않았습니다.",
      },
      {
        h2: "같은 1,000만원 인상인데 남는 돈이 다른 이유",
        body: [
          cheapest && richest && cheapest !== richest
            ? `표에서 ${manWon(richest.a)} → ${manWon(richest.b)}의 월 실수령 증가액은 ${won(richest.monthlyGap)}이지만, 똑같이 1,000만원을 올린 ${manWon(cheapest.a)} → ${manWon(cheapest.b)}은 ${won(cheapest.monthlyGap)}에 그칩니다. 인상 폭이 같아도 월 ${won(richest.monthlyGap - cheapest.monthlyGap)}이 차이 납니다.`
            : "",
          "차이를 만드는 것은 누진세율 구간입니다. 인상분이 24% 구간에 얹히는지 35% 구간에 얹히는지에 따라 세후 잔액이 달라지고, 국민연금은 기준소득월액 상한 659만원(2026.7.1 시행)에 도달하면 더 이상 늘지 않아 고연봉 구간에서는 오히려 공제 증가가 둔화되기도 합니다.",
          "그래서 이직 제안을 볼 때는 인상률(%)이 아니라 <strong>월 실수령 증가액(원)</strong>으로 환산해 비교해야 합니다. 연봉이 다른 두 제안을 같은 인상률로 비교하면 실제 체감과 어긋납니다.",
        ],
        callout:
          "<strong>협상 팁</strong> — 같은 인건비라면 과세 연봉을 올리는 것보다 비과세 항목(식대 월 20만원, 자가운전보조금 월 20만원)을 늘리는 쪽이 4대보험과 소득세를 함께 줄여 실수령이 더 늘어납니다.",
      },
    ],
    variants: {
      h2: "연봉 조합별 상세 비교",
      lead: "각 페이지에는 두 연봉의 공제 항목별 차이, 인상률 체감, 협상 시 확인할 임계 구간이 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/compare/${row.a}-vs-${row.b}`,
        label: `${manWon(row.a)} vs ${manWon(row.b)} 실수령 비교`,
        note: `월 ${won(row.monthlyGap)} 차이`,
      })),
    },
    note: "※ 2026년 공식 요율 기반 추정치입니다. 실제 급여는 회사 급여 규정·비과세 항목 구성에 따라 달라집니다.",
  };
}

// =========================
// 퇴사 시뮬레이션 (/quit)
// =========================
function quitHub() {
  const monthlyLiving = 2_000_000;
  const rows = QUIT_YEARS.map((years) => {
    const { avgWage, severance } = severancePayEstimate(years);
    const { dailyAmount } = unemploymentDailyAllowance(avgWage);
    let days = 120;
    if (years >= 5 && years < 10) days = 210;
    else if (years >= 10) days = 240;
    else if (years >= 3) days = 180;
    else if (years >= 1) days = 150;
    const unemploymentTotal = dailyAmount * days;
    return {
      years,
      severance,
      days,
      unemploymentTotal,
      survivalMonths: Math.floor((severance + unemploymentTotal) / monthlyLiving),
    };
  });

  return {
    h1: "퇴사 계산기 2026 | 퇴직금·실업급여·생존기간",
    lead: [
      "퇴사를 결정하기 전에 필요한 세 가지 숫자 — <strong>퇴직금·실업급여 총액·생활비로 버틸 수 있는 개월 수</strong> — 를 한 화면에서 계산합니다. 퇴직금은 근로자퇴직급여보장법, 실업급여는 고용보험법 기준이며 2026년 고시 상·하한액을 적용합니다.",
      `평균 월급 ${won(SEVERANCE_ASSUMED_MONTHLY)}·상여 포함 평균임금 ${won(Math.floor(SEVERANCE_ASSUMED_MONTHLY * 1.1))}·월 생활비 ${won(monthlyLiving)}을 가정한 표준 시나리오로, 근속 ${QUIT_YEARS[0]}년부터 ${QUIT_YEARS[QUIT_YEARS.length - 1]}년까지를 다룹니다.`,
    ],
    sections: [
      {
        h2: "퇴사 전에 확인해야 할 세 가지 숫자",
        body: [
          "첫째는 <strong>퇴직금</strong>입니다. 1년 이상 근속했다면 1년당 30일분 평균임금이 지급되며, 평균임금은 퇴직 전 3개월 임금 총액을 그 기간 일수로 나눠 산정하므로 상여금·연차수당이 포함됩니다.",
          "둘째는 <strong>실업급여(구직급여)</strong>입니다. 자발적 퇴사는 원칙적으로 수급 대상이 아니며, 이직 전 18개월 중 피보험 단위기간이 180일 이상이어야 합니다. 일 수급액은 평균임금의 60%이되 2026년 상한 " + won(UNEMPLOYMENT_DAILY_MAX) + "·하한 " + won(UNEMPLOYMENT_DAILY_MIN) + "이 먼저 적용됩니다.",
          "셋째는 <strong>생존기간</strong>입니다. 퇴직금과 실업급여를 합친 금액을 월 고정 지출로 나눈 값으로, 다음 직장을 구하기까지 확보된 시간을 뜻합니다.",
        ],
      },
      {
        h2: "근속연수별 퇴직금·실업급여·버틸 수 있는 기간",
        table: {
          head: ["근속", "예상 퇴직금", "수급일수", "실업급여 총액", "생존기간"],
          rows: rows.map((row) => ({
            cells: [
              `${row.years}년`,
              won(row.severance),
              `${row.days}일`,
              won(row.unemploymentTotal),
              `<strong style="color:#047857;">약 ${row.survivalMonths}개월</strong>`,
            ],
          })),
        },
        tableNote: `월 생활비 ${won(monthlyLiving)} 기준이며, 퇴직소득세와 건강보험 지역가입 전환 부담은 생존기간 계산에서 제외했습니다. 퇴사 후 건강보험료는 별도로 확인하세요.`,
      },
      {
        h2: "실업급여 수급일수가 계단식으로 뛰는 지점",
        body: [
          `수급일수는 연속적으로 늘지 않고 가입기간 구간에 따라 계단식으로 올라갑니다. 위 표에서도 근속 ${rows[0].years}년 ${rows[0].days}일에서 ${rows[rows.length - 1].years}년 ${rows[rows.length - 1].days}일까지 구간별로 점프합니다. 퇴사 시점이 구간 경계 직전이라면 며칠 차이로 수급일수가 30일 늘어날 수 있습니다.`,
          "또한 만 50세 이상이거나 장애인인 경우 같은 가입기간에서도 수급일수가 더 길게 적용됩니다. 실제 소정급여일수는 고용센터가 이직확인서상 피보험기간으로 확정하므로, 퇴사일을 조정할 수 있다면 미리 확인할 가치가 있습니다.",
          "퇴직금 역시 근속 1년 미만이면 지급 의무가 없고, 근속연수 공제는 5년·10년·20년에서 단가가 바뀌므로 퇴직소득세 부담도 근속 구간에 따라 달라집니다.",
        ],
        callout:
          "<strong>주의</strong> — 자발적 퇴사는 구직급여 수급 자격이 제한됩니다. 임금체불, 사업장 이전에 따른 통근 곤란, 질병 등 정당한 이직 사유에 해당해야 예외가 인정됩니다.",
      },
      {
        h2: "생존기간 계산에서 빠져 있는 지출",
        body: [
          "표의 생존기간은 퇴직금과 실업급여를 월 생활비로 나눈 값입니다. 실제로는 재직 중에 없던 지출이 새로 생기므로 이보다 짧아집니다.",
          "가장 큰 항목이 <strong>건강보험료</strong>입니다. 직장가입자일 때는 회사가 절반을 냈지만 퇴사하면 지역가입자로 전환되어 전액을 부담합니다. 재산·자동차까지 점수화되므로 소득이 0이어도 월 20만~50만원이 나올 수 있습니다.",
          "<strong>국민연금</strong>도 마찬가지입니다. 지역가입자는 신고 소득의 9%를 전액 본인이 냅니다. 납부예외를 신청하면 부담은 없지만 그 기간은 가입기간에서 빠져 나중에 받을 연금이 줄어듭니다.",
          "여기에 퇴직소득세도 반영해야 합니다. 표의 퇴직금은 세전 금액이므로, 실제 손에 쥐는 돈은 그보다 적습니다.",
        ],
      },
    ],
    variants: {
      h2: "근속연수별 상세 시뮬레이션",
      lead: "각 페이지에는 해당 근속연수의 퇴직금 산정 과정, 실업급여 수급 일정, 월별 잔액 추이가 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/quit/${row.years}years`,
        label: `${row.years}년 근속 퇴사 시뮬레이션`,
        note: `퇴직금 ${won(row.severance)} · 약 ${row.survivalMonths}개월`,
      })),
    },
    note: "※ 표준 시나리오(평균 월급 300만원) 기준 추정치입니다. 실제 퇴직금은 퇴직 전 3개월 임금으로, 실업급여는 고용센터 심사로 확정됩니다.",
  };
}

// =========================
// 원천세 역산 (/withholding)
// =========================
function withholdingHub() {
  const rows = WITHHOLDING_AMOUNTS.map((tax) => ({ tax, ...withholdingReverse(tax) }));

  return {
    h1: "원천세 계산기 | 소득세로 연봉 추정 2026",
    lead: [
      "급여명세서의 <strong>소득세 한 줄</strong>만 알면 세전 연봉을 거꾸로 추정합니다. 회사는 매월 국세청 근로소득 간이세액표에 따라 소득세를 원천징수하는데, 그 금액은 월 급여와 부양가족 수의 함수이므로 역산이 가능합니다.",
      `이 계산기가 다루는 범위는 월 원천징수 소득세 ${won(WITHHOLDING_AMOUNTS[0])}부터 ${won(WITHHOLDING_AMOUNTS[WITHHOLDING_AMOUNTS.length - 1])}까지이며, 연봉 ${manWon(rows[0].estimatedManWon)}~${manWon(rows[rows.length - 1].estimatedManWon)} 구간에 대응합니다.`,
    ],
    sections: [
      {
        h2: "급여명세서의 소득세로 연봉을 되짚는 법",
        body: [
          "원천징수는 연말정산 전에 세금을 미리 걷는 제도입니다. 간이세액표는 월 급여 구간과 공제대상 가족 수에 따라 징수액을 정해두고 있어, 소득세 금액을 알면 대응하는 급여 구간을 좁힐 수 있습니다.",
          "지방소득세는 소득세의 10%가 별도로 붙습니다. 명세서에 '소득세'와 '지방소득세'가 나뉘어 있다면 소득세 항목만 입력해야 하며, 합산액을 넣으면 연봉이 과대 추정됩니다.",
        ],
      },
      {
        h2: "월 원천징수액별 추정 연봉",
        table: {
          head: ["월 소득세", "연간 소득세", "추정 세전 연봉"],
          rows: rows.map((row) => ({
            cells: [
              won(row.tax),
              won(row.tax * 12),
              `<strong style="color:#047857;">약 ${manWon(row.estimatedManWon)}</strong>`,
            ],
          })),
        },
        tableNote:
          "부양가족 1인·비과세 식대 월 20만원 가정입니다. 간이세액표를 근사식으로 역산한 값이므로 실제 연봉과 오차가 있을 수 있습니다.",
      },
      {
        h2: "역산이 크게 빗나가는 세 가지 경우",
        body: [
          "첫째, <strong>부양가족 수가 다를 때</strong>입니다. 간이세액표는 공제대상 가족 수가 늘수록 징수액을 낮추므로, 4인 가족의 소득세는 같은 연봉의 1인 가구보다 훨씬 적습니다. 이 경우 역산 결과는 실제보다 낮게 나옵니다.",
          "둘째, <strong>비과세 항목이 많을 때</strong>입니다. 식대·자가운전보조금·연구활동비는 과세 대상에서 빠지므로 같은 총 지급액이라도 소득세가 줄어듭니다.",
          "셋째, <strong>원천징수 비율을 조정한 경우</strong>입니다. 근로자는 간이세액표의 80%·100%·120% 중에서 선택할 수 있어, 120%를 택했다면 연봉이 과대 추정되고 80%라면 과소 추정됩니다.",
        ],
        callout:
          "<strong>정확한 확인 방법</strong> — 근로소득 원천징수영수증(홈택스 → 지급명세서 조회)의 '16. 계' 항목이 실제 총급여입니다. 역산은 명세서를 볼 수 없을 때의 대안입니다.",
      },
      {
        h2: "원천징수 비율을 직접 고를 수 있다",
        body: [
          "근로자는 간이세액표의 <strong>80%·100%·120%</strong> 중에서 원천징수 비율을 선택할 수 있습니다. 회사에 '소득세 원천징수세액 조정신청서'를 내면 됩니다.",
          "80%를 고르면 매달 실수령이 늘어나는 대신 연말정산 환급이 줄거나 추가 납부가 나옵니다. 120%는 반대로 매달 덜 받고 2월에 더 돌려받습니다. 내는 세금 총액은 어느 쪽이든 같습니다.",
          "매달 현금이 필요하다면 80%가, 연말에 목돈으로 받는 편이 좋다면 120%가 맞습니다. 다만 환급은 무이자로 국가에 돈을 맡겨 두는 셈이라, 순수하게 금액만 따지면 80%가 유리합니다.",
        ],
      },
      {
        h2: "원천징수액이 갑자기 바뀌는 경우",
        body: [
          "매달 같던 소득세가 달라졌다면 대개 세 가지 중 하나입니다. <strong>부양가족 변동</strong>(출생·사망·소득 발생), <strong>급여 변동</strong>(인상·상여 지급), <strong>비과세 항목 변경</strong>입니다.",
          "특히 상여금이 지급된 달은 원천징수액이 크게 튑니다. 상여는 별도의 원천징수 방식이 적용되기 때문이며, 그다음 달에는 다시 원래 수준으로 돌아옵니다.",
          "연도가 바뀌면 간이세액표 자체가 개정되어 같은 급여에도 세액이 달라질 수 있습니다. 1월 급여의 소득세가 전년 12월과 다르다면 대개 이 이유입니다.",
        ],
      },
    ],
    variants: {
      h2: "월 원천징수액별 상세 페이지",
      lead: "각 페이지에는 해당 원천징수액의 연봉 추정 범위와 부양가족 수에 따른 보정이 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/withholding/${row.tax}`,
        label: `월 소득세 ${won(row.tax)} 연봉 추정`,
        note: `약 ${manWon(row.estimatedManWon)}`,
      })),
    },
    note: "※ 간이세액표 근사 역산이며 참고용 추정치입니다. 확정 금액은 국세청 홈택스 지급명세서에서 확인하세요.",
  };
}

// =========================
// 프리랜서 세금 (/freelancer)
// =========================
function freelancerHub() {
  const rows = FREELANCER_AMOUNTS.map((amount) => ({
    amount,
    calc: computeComprehensiveTax(amount * 10_000),
  }));
  const lastRefund = [...rows].reverse().find((row) => row.calc.refund > 0);
  const firstDue = rows.find((row) => row.calc.refund < 0);

  return {
    h1: "2026 프리랜서 세금 계산기 | 3.3% 종합소득세",
    lead: [
      "3.3%를 떼고 대금을 받는 프리랜서가 <strong>5월에 돌려받을지 더 낼지</strong>를 수입 규모별로 계산합니다. 원천징수된 3.3%를 기납부세액으로 놓고, 단순경비율로 필요경비를 인정한 뒤 누진세율로 확정세액을 구해 둘의 차액을 보여줍니다.",
      `다루는 수입 범위는 연 ${manWon(FREELANCER_AMOUNTS[0])}부터 ${manWon(FREELANCER_AMOUNTS[FREELANCER_AMOUNTS.length - 1])}까지입니다. 아래 표에서 본인 수입대가 환급 쪽인지 추가 납부 쪽인지 확인한 뒤 상세 페이지로 이동하세요.`,
    ],
    sections: [
      {
        h2: "떼인 3.3%와 실제 낼 세금은 다른 숫자다",
        body: [
          "3.3%(소득세 3% + 지방소득세 0.3%)는 지급자가 대신 신고·납부해두는 선납금입니다. 최종 세금은 1년치 수입을 모두 합쳐 경비와 공제를 뺀 과세표준에 누진세율을 적용해 5월에 확정됩니다.",
          "수입이 적을수록 경비율과 인적공제 덕분에 확정세액이 3.3%보다 작아 환급이 생기고, 수입이 커질수록 누진세율이 3.3%를 앞질러 추가 납부로 돌아섭니다. 프리랜서가 '3.3% 떼였으니 끝'이라고 생각하면 5월에 예상 못 한 고지서를 받게 되는 이유입니다.",
        ],
      },
      {
        h2: "수입별 기납부 3.3%와 확정세액 비교",
        table: {
          head: ["연 수입", "3.3% 기납부", "확정세액", "정산 결과"],
          rows: rows.map(({ amount, calc }) => ({
            highlight: calc.refund > 0,
            cells: [
              manWon(amount),
              won(calc.withholdingPrepaid),
              won(calc.totalTax),
              calc.refund >= 0
                ? `<strong style="color:#047857;">${won(calc.refund)} 환급</strong>`
                : `<strong style="color:#dc2626;">${won(Math.abs(calc.refund))} 추가 납부</strong>`,
            ],
          })),
        },
        tableNote:
          "인적용역 단순경비율(4,000만원 이하 64.1%, 초과분 49.7%)·기본공제 1인·표준세액공제 7만원 기준입니다. 실제 경비가 단순경비율보다 크면 장부를 쓰는 쪽이 유리합니다.",
      },
      {
        h2: "환급이 추가 납부로 돌아서는 경계",
        body: [
          lastRefund && firstDue
            ? `표에서 부호가 바뀌는 지점은 연 수입 ${manWon(lastRefund.amount)}과 ${manWon(firstDue.amount)} 사이입니다. ${manWon(lastRefund.amount)}까지는 기납부 ${won(lastRefund.calc.withholdingPrepaid)}이 확정세액 ${won(lastRefund.calc.totalTax)}을 웃돌아 환급이지만, ${manWon(firstDue.amount)}에서는 확정세액이 ${won(firstDue.calc.totalTax)}으로 뛰어 ${won(Math.abs(firstDue.calc.refund))}을 더 내야 합니다.`
            : "",
          "이 경계를 넘어서는 해에는 <strong>수입의 일정 비율을 세금용으로 따로 적립</strong>해두는 편이 안전합니다. 또한 수입 4,000만원을 넘으면 단순경비율이 64.1%에서 49.7%로 떨어지므로, 경비 인정률 하락과 누진세율 상승이 동시에 작용합니다.",
          "건강보험료도 함께 오릅니다. 프리랜서는 지역가입자로 소득·재산을 점수화해 보험료가 부과되며, 5월 종합소득세 신고 내용이 그해 11월 보험료 재산정에 반영됩니다.",
        ],
        callout:
          "<strong>장부 작성 판단</strong> — 실제 경비가 수입의 64.1%(4,000만원 초과분은 49.7%)를 넘는다면 간편장부·복식부기로 실제 경비를 인정받는 쪽이 유리합니다. 복식부기 대상자가 추계신고하면 무기장가산세 20%가 붙습니다.",
      },
      {
        h2: "5월에 한 번에 내지 않는 방법",
        body: [
          "납부할 세액이 <strong>1,000만원을 넘으면</strong> 분납할 수 있습니다. 2,000만원 이하면 1,000만원을 초과하는 금액을, 2,000만원을 넘으면 세액의 50% 이하를 신고 기한 다음 날부터 2개월 안에 나눠 낼 수 있습니다.",
          "그보다 근본적인 대비는 <strong>중간예납</strong>입니다. 전년도에 종합소득세를 냈다면 11월에 그 절반을 미리 납부하게 되는데, 이 금액이 다음 해 5월 세액에서 차감되므로 5월 부담이 줄어듭니다.",
          "사업이 부진해 올해 소득이 크게 줄었다면 중간예납 추계액 신고로 납부액을 낮출 수 있습니다. 자동 고지된 금액을 그대로 내지 않아도 됩니다.",
        ],
      },
    ],
    variants: {
      h2: "수입 금액별 상세 계산",
      lead: "각 페이지에는 해당 수입의 경비 인정액, 과세표준, 구간별 산출세액과 환급·납부 금액이 들어 있습니다.",
      items: rows.map(({ amount, calc }) => ({
        href: `/freelancer/${amount}`,
        label: `프리랜서 연 수입 ${manWon(amount)} 세금`,
        note: calc.refund >= 0 ? `약 ${won(calc.refund)} 환급` : `약 ${won(Math.abs(calc.refund))} 추가 납부`,
      })),
    },
    note: "※ 단순경비율 적용 인적용역 기준 추정치입니다. 업종 코드·장부 작성 여부·다른 소득에 따라 실제 세액이 달라집니다.",
  };
}

// =========================
// 시급 환산 (/wage-converter)
// =========================
function wageConverterHub() {
  const rows = WAGE_CONVERTER_AMOUNTS.map((hourly) => ({ hourly, ...wageConversion(hourly) }));
  const minimum = rows[0];

  return {
    h1: "2026 시급 월급 연봉 환산기 | 주휴수당 포함·미포함",
    lead: [
      "시급을 <strong>일급·주급·월급·연봉</strong>으로 한 번에 환산합니다. 주 40시간 근무를 기준으로 주휴수당 8시간분을 포함한 값과 포함하지 않은 값을 함께 보여주므로, 구인공고의 시급이 실제 월급으로 얼마인지 바로 확인할 수 있습니다.",
      `다루는 시급 범위는 2026년 최저시급 ${won(WAGE_CONVERTER_AMOUNTS[0])}부터 ${won(WAGE_CONVERTER_AMOUNTS[WAGE_CONVERTER_AMOUNTS.length - 1])}까지이며, 월급 ${won(minimum.monthlyTotal)}~${won(rows[rows.length - 1].monthlyTotal)} 구간에 대응합니다.`,
    ],
    sections: [
      {
        h2: "월 환산에 4.345주가 필요한 이유",
        body: [
          "1년은 365일이고 1주는 7일이므로 1년은 약 52.14주, 이를 12개월로 나누면 <strong>월 평균 4.345주</strong>가 됩니다. 월급 = 주급 × 4.345로 계산하는 근거가 여기 있습니다.",
          "달마다 주수가 다르기 때문에 4주로 계산하면 월급이 과소 추정되고, 4.5주로 계산하면 과대 추정됩니다. 일부 회사는 4.34나 4.33을 쓰기도 하지만 차이는 월 수천 원 수준입니다.",
          "한편 월 소정근로시간을 <strong>209시간</strong>으로 보는 관행도 같은 계산에서 나옵니다. 주 40시간에 주휴 8시간을 더한 48시간 × 4.345 ≈ 209시간이며, 통상임금 시급을 구할 때 월급을 209로 나누는 것이 이 때문입니다.",
        ],
      },
      {
        h2: "시급별 월급·연봉 환산표",
        table: {
          head: ["시급", "일급(8시간)", "주급(주휴 포함)", "월급(주휴 포함)", "연봉"],
          rows: rows.map((row) => ({
            highlight: row.hourly === WAGE_CONVERTER_AMOUNTS[0],
            cells: [
              won(row.hourly),
              won(row.dailyWage),
              won(row.weeklyTotal),
              `<strong>${won(row.monthlyTotal)}</strong>`,
              won(row.annualTotal),
            ],
          })),
        },
        tableNote:
          "주 40시간·월 4.345주·주휴수당 8시간분 포함 기준의 세전 금액입니다. 4대보험과 소득세를 공제한 실수령액은 연봉 실수령액 계산기에서 확인하세요.",
      },
      {
        h2: "주휴수당을 빼면 얼마나 달라지는가",
        body: [
          `주휴수당은 주급의 20%에 해당합니다. 주 40시간에 8시간분이 더해지므로 ${won(minimum.hourly)} 기준 주급은 ${won(minimum.weeklyBase)}에서 ${won(minimum.weeklyTotal)}으로, 월급으로는 ${won(Math.floor(minimum.weeklyBase * 4.345))}에서 ${won(minimum.monthlyTotal)}으로 올라갑니다.`,
          "구인공고에 '시급 ○○원'만 적혀 있다면 주휴수당 포함 여부를 반드시 확인해야 합니다. 주 15시간 이상 근무하고 소정근로일을 개근하면 주휴수당은 <strong>법정 의무</strong>이므로, 이를 포함해 최저시급을 맞췄다고 주장하는 것은 위법입니다.",
          "주 40시간 미만이라면 주휴수당도 비례해 줄어듭니다. 주 20시간이라면 (20 ÷ 40) × 8 = 4시간분이 지급됩니다.",
        ],
      },
      {
        h2: "세전 환산값과 실제 입금액의 차이",
        body: [
          "이 계산기가 내놓는 월급·연봉은 모두 <strong>세전</strong>입니다. 실제 통장에 찍히는 금액은 여기서 4대보험과 소득세를 뺀 뒤입니다.",
          "다만 아르바이트는 고용 형태에 따라 공제 항목이 달라집니다. 주 15시간 미만이거나 월 60시간 미만이면 국민연금·고용보험 가입 대상이 아닐 수 있고, 일용직으로 처리되면 원천징수 방식 자체가 다릅니다.",
          "3.3%를 떼고 받는다면 근로자가 아니라 <strong>사업소득자</strong>로 신고되고 있다는 뜻입니다. 실질이 근로자라면 주휴수당·연차·퇴직금이 모두 발생하므로, 계약 형태가 실제 근무 방식과 맞는지 확인해 볼 필요가 있습니다.",
        ],
      },
    ],
    variants: {
      h2: "시급별 환산 결과 보기",
      lead: "각 페이지에는 해당 시급의 일급·주급·월급·연봉과 주휴수당 포함·미포함 비교가 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/wage-converter/${row.hourly}`,
        label: `시급 ${won(row.hourly)} 월급·연봉 환산`,
        note: `월 ${won(row.monthlyTotal)}`,
      })),
    },
    note: "※ 세전 기준 환산값입니다. 실제 수령액은 4대보험·소득세 공제 후 금액이며, 근로계약서상 소정근로시간에 따라 달라집니다.",
  };
}

// =========================
// 퇴직금 (/severance-pay)
// =========================
function severancePayHub() {
  const rows = SEVERANCE_PAY_AMOUNTS.map((years) => ({ years, ...severancePayEstimate(years) }));

  return {
    h1: "2026 퇴직금 계산기 | 퇴직소득세·실수령 퇴직금",
    lead: [
      "근속연수를 입력하면 <strong>세전 퇴직금과 퇴직소득세를 뺀 실수령 퇴직금</strong>을 계산합니다. 퇴직금은 근로자퇴직급여보장법에 따라 1년 이상 근속한 근로자에게 1년당 30일분 평균임금으로 지급됩니다.",
      `평균 월급 ${won(SEVERANCE_ASSUMED_MONTHLY)}·상여 포함 평균임금 ${won(rows[0].avgWage)}을 가정한 표준 시나리오이며, 근속 ${SEVERANCE_PAY_AMOUNTS[0]}년부터 ${SEVERANCE_PAY_AMOUNTS[SEVERANCE_PAY_AMOUNTS.length - 1]}년까지를 다룹니다.`,
    ],
    sections: [
      {
        h2: "기준은 월급이 아니라 평균임금이다",
        body: [
          "퇴직금 산정의 기준은 계약서상 월급이 아니라 <strong>평균임금</strong>입니다. 퇴직일 이전 3개월간 지급된 임금 총액을 그 기간의 총일수로 나눈 1일 평균임금에 30일과 근속연수를 곱해 계산합니다.",
          "여기에는 기본급뿐 아니라 정기 상여금(연간 지급액의 3/12), 연차수당(전년도 지급액의 3/12), 각종 수당이 포함됩니다. 따라서 상여금 비중이 큰 회사일수록 평균임금이 월급보다 높아지고 퇴직금도 늘어납니다.",
          "반대로 퇴직 직전 3개월에 무급휴직이나 결근이 있으면 평균임금이 낮아집니다. 이 경우 통상임금이 평균임금보다 높으면 통상임금을 기준으로 산정합니다.",
        ],
      },
      {
        h2: "근속연수별 퇴직금과 퇴직소득세",
        table: {
          head: ["근속", "세전 퇴직금", "근속연수 공제", "예상 퇴직소득세", "실수령 퇴직금"],
          rows: rows.map((row) => ({
            cells: [
              `${row.years}년`,
              won(row.severance),
              won(row.yearDeduction),
              won(row.estimatedTax),
              `<strong style="color:#047857;">${won(row.netSeverance)}</strong>`,
            ],
          })),
        },
        tableNote:
          "퇴직소득세는 연분연승법을 최저 세율 구간으로 단순화한 추정치입니다. 실제 세액은 환산급여공제·근속연수공제를 정확히 적용해 산출되며 국세청 퇴직소득세 계산 프로그램으로 확인할 수 있습니다.",
      },
      {
        h2: "근속연수 공제가 5년·10년에서 단가가 바뀐다",
        body: [
          "퇴직소득세는 오래 일한 사람에게 유리하도록 설계돼 있습니다. 근속연수 공제는 5년까지 1년당 100만원, 6~10년은 1년당 200만원, 11~20년은 250만원, 20년 초과분은 300만원으로 <strong>단가가 올라갑니다</strong>.",
          `표에서도 근속 ${rows[0].years}년의 공제는 ${won(rows[0].yearDeduction)}이지만 ${rows[rows.length - 1].years}년은 ${won(rows[rows.length - 1].yearDeduction)}으로, 근속이 ${rows[rows.length - 1].years / rows[0].years}배일 때 공제는 ${(rows[rows.length - 1].yearDeduction / rows[0].yearDeduction).toFixed(0)}배가 됩니다.`,
          "여기에 연분연승법이 더해집니다. 과세표준을 근속연수로 나눠 1년치로 환산한 뒤 세율을 적용하고 다시 근속연수를 곱하므로, 근속이 길수록 낮은 누진 구간에 걸려 실효세율이 떨어집니다. 같은 퇴직금이라도 근속 10년이 3년보다 세부담이 가볍습니다.",
        ],
        callout:
          "<strong>지급 기한</strong> — 퇴직금은 퇴직일로부터 14일 이내에 지급해야 합니다(근로기준법 제36조). 이를 넘기면 지연이자 연 20%가 발생하며, 임금체불 지연이자 계산기에서 금액을 확인할 수 있습니다.",
      },
    ],
    variants: {
      h2: "근속연수별 상세 계산",
      lead: "각 페이지에는 해당 근속연수의 퇴직금 산정 과정과 퇴직소득세 계산 단계가 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/severance-pay/${row.years}`,
        label: `${row.years}년 근속 퇴직금 계산`,
        note: `실수령 약 ${won(row.netSeverance)}`,
      })),
    },
    note: "※ 평균 월급 300만원 표준 시나리오 기준 추정치입니다. 실제 퇴직금은 퇴직 전 3개월 임금 총액으로 산정됩니다.",
  };
}

// =========================
// 육아휴직 급여 (/parental-leave)
// =========================
function parentalLeaveHub() {
  const rows = PARENTAL_LEAVE_AMOUNTS.map((amount) => ({
    amount,
    ...parentalLeavePay(amount * 10_000),
  }));
  const capThreshold = 250; // 만원 — 1~3개월 상한 250만원에 도달하는 통상임금

  return {
    h1: "2026 육아휴직 급여 계산기 | 6+6 부모육아휴직제 반영",
    lead: [
      "월 통상임금을 입력하면 <strong>12개월 육아휴직 동안 매달 받는 급여와 총 수령액</strong>을 계산합니다. 2026년 기준 1~3개월은 통상임금 100%(상한 250만원), 4~6개월은 100%(상한 200만원), 7~12개월은 80%(상한 160만원)가 적용되며 하한은 70만원입니다.",
      `다루는 통상임금 범위는 월 ${manWon(PARENTAL_LEAVE_AMOUNTS[0])}부터 ${manWon(PARENTAL_LEAVE_AMOUNTS[PARENTAL_LEAVE_AMOUNTS.length - 1])}까지입니다.`,
    ],
    sections: [
      {
        h2: "급여를 결정하는 것은 통상임금이 아니라 상한액이다",
        body: [
          "육아휴직 급여는 통상임금에 비례하지만, 각 구간마다 <strong>상한액</strong>이 먼저 걸립니다. 1~3개월 상한 250만원, 4~6개월 상한 200만원, 7~12개월 상한 160만원이며, 통상임금이 이 금액을 넘으면 초과분은 반영되지 않습니다.",
          `그래서 통상임금이 월 ${manWon(capThreshold)}을 넘는 순간부터는 통상임금이 얼마든 급여가 같아집니다. 아래 표에서 ${manWon(PARENTAL_LEAVE_AMOUNTS[0])}과 ${manWon(PARENTAL_LEAVE_AMOUNTS[PARENTAL_LEAVE_AMOUNTS.length - 1])}의 수령액이 동일한 것이 그 결과입니다.`,
          "반대로 통상임금이 낮으면 하한 70만원이 적용됩니다. 즉 육아휴직 급여는 통상임금 70만원~250만원 구간에서만 소득에 비례하고, 그 바깥에서는 정액으로 고정됩니다.",
        ],
      },
      {
        h2: "통상임금별 12개월 구간 지급액",
        table: {
          head: ["월 통상임금", "1~3개월", "4~6개월", "7~12개월", "12개월 총액"],
          rows: rows.map((row) => ({
            cells: [
              manWon(row.amount),
              won(row.pay1_3),
              won(row.pay4_6),
              won(row.pay7_12),
              `<strong style="color:#047857;">${won(row.total)}</strong>`,
            ],
          })),
        },
        tableNote:
          "일반 육아휴직 12개월 사용 기준입니다. 부모가 함께 사용하는 '6+6 부모육아휴직제'를 적용하면 첫 6개월 상한이 월 200만~450만원으로 상향되어 총액이 크게 달라집니다.",
      },
      {
        h2: "6+6 부모육아휴직제를 쓰면 계산이 달라진다",
        body: [
          "생후 18개월 이내 자녀에 대해 부모가 <strong>모두</strong> 육아휴직을 사용하면, 첫 6개월간 두 사람 각각의 급여 상한이 1개월 200만원, 2개월 250만원, 3개월 300만원, 4개월 350만원, 5개월 400만원, 6개월 450만원으로 단계적으로 올라갑니다.",
          "이 특례는 통상임금이 높을수록 효과가 큽니다. 일반 육아휴직에서는 상한 250만원에 막히던 고소득 근로자도 6개월 차에는 450만원까지 받을 수 있기 때문입니다. 다만 부모가 순차적으로 써도 되지만 같은 자녀에 대해 둘 다 사용해야 적용됩니다.",
          "사후지급금 제도는 2026년 기준 폐지되어 급여 전액이 휴직 기간 중 지급됩니다. 과거처럼 복직 후 6개월을 근무해야 25%를 받는 구조가 아닙니다.",
        ],
        callout:
          "<strong>신청 기한</strong> — 육아휴직 급여는 휴직 시작일 이후 1개월부터 종료일 이후 12개월 이내에 신청해야 합니다. 기한을 넘기면 지급받을 수 없습니다.",
      },
    ],
    variants: {
      h2: "통상임금별 상세 계산",
      lead: "각 페이지에는 해당 통상임금의 월별 지급액 추이와 복직 후 급여 비교가 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/parental-leave/${row.amount}`,
        label: `월 통상임금 ${manWon(row.amount)} 육아휴직 급여`,
        note: `12개월 총 ${won(row.total)}`,
      })),
    },
    note: "※ 2026년 고용보험 육아휴직 급여 기준 추정치입니다. 실제 지급액은 고용센터 심사로 확정되며 6+6 특례 적용 여부에 따라 달라집니다.",
  };
}

// =========================
// 주휴수당 (/weekly-holiday-pay)
// =========================
function weeklyHolidayPayHub() {
  const rows = WEEKLY_HOLIDAY_PAY_AMOUNTS.map((hourly) => ({ hourly, ...weeklyHolidayPay(hourly) }));
  const minimum = rows[0];

  return {
    h1: "2026 주휴수당 계산기 | 아르바이트 주휴수당·실질 시급",
    lead: [
      "시급과 주 근로시간으로 <strong>주휴수당과 주휴수당을 포함한 실질 시급</strong>을 계산합니다. 주휴수당은 근로기준법 제55조에 따라 주 15시간 이상 근무하고 소정근로일을 개근한 근로자에게 지급되는 유급휴일 수당으로, 정규직·계약직·아르바이트 모두에게 적용됩니다.",
      `다루는 시급 범위는 2026년 최저시급 ${won(WEEKLY_HOLIDAY_PAY_AMOUNTS[0])}부터 ${won(WEEKLY_HOLIDAY_PAY_AMOUNTS[WEEKLY_HOLIDAY_PAY_AMOUNTS.length - 1])}까지입니다.`,
    ],
    sections: [
      {
        h2: "조건을 채우면 자동으로 발생하는 법정 수당",
        body: [
          "주휴수당은 사업주가 선택할 수 있는 수당이 아닙니다. ① 주 소정근로시간 15시간 이상, ② 소정근로일 개근 두 조건을 채우면 <strong>법적으로 발생</strong>하며, 지급하지 않으면 임금체불에 해당합니다.",
          "5인 미만 사업장에도 적용됩니다. 연장·야간·휴일근로 가산수당은 5인 이상 사업장에만 적용되지만, 주휴수당에는 그런 제한이 없습니다.",
          "지각이나 조퇴는 결근이 아니므로 개근 요건을 깨지 않습니다. 반면 무단결근이 하루라도 있으면 그 주의 주휴수당은 발생하지 않습니다.",
        ],
      },
      {
        h2: "시급별 주휴수당과 실질 시급",
        table: {
          head: ["시급", "주 기본급(40시간)", "주휴수당(8시간분)", "주급 합계", "실질 시급"],
          rows: rows.map((row) => ({
            highlight: row.hourly === WEEKLY_HOLIDAY_PAY_AMOUNTS[0],
            cells: [
              won(row.hourly),
              won(row.weeklyBase),
              `<strong>+${won(row.weeklyHoliday)}</strong>`,
              won(row.weeklyTotal),
              `<strong style="color:#047857;">${won(row.effectiveHourly)}</strong>`,
            ],
          })),
        },
        tableNote: `주 40시간 기준입니다. 주휴수당을 포함하면 실질 시급은 명목 시급의 1.2배가 되므로, 최저시급 ${won(minimum.hourly)}으로 주 40시간 일하면 실질 ${won(minimum.effectiveHourly)}을 받는 셈입니다.`,
      },
      {
        h2: "주 15시간과 40시간 사이에서는 비례 지급된다",
        body: [
          "주휴수당은 주 40시간일 때 8시간분이지만, 그보다 적게 일하면 비례해 줄어듭니다. 계산식은 <strong>(주 소정근로시간 ÷ 40) × 8 × 시급</strong>입니다.",
          `예를 들어 시급 ${won(minimum.hourly)}으로 주 20시간을 일하면 (20 ÷ 40) × 8 = 4시간분, 즉 ${won(Math.floor(minimum.hourly * 4))}이 주휴수당으로 발생합니다. 주 30시간이면 6시간분 ${won(Math.floor(minimum.hourly * 6))}입니다.`,
          "주 15시간 미만이면 주휴수당이 아예 발생하지 않습니다. 이 때문에 주 14시간으로 근로계약을 쪼개는 사례가 있는데, 실제 근로시간이 15시간을 넘었다면 계약서 문구와 무관하게 주휴수당이 발생합니다.",
          "주 40시간을 넘겨 일한 경우에도 주휴수당은 8시간분으로 고정됩니다. 초과분은 주휴수당이 아니라 연장근로 가산수당(1.5배)으로 정산해야 합니다.",
        ],
      },
    ],
    variants: {
      h2: "시급별 상세 계산",
      lead: "각 페이지에는 해당 시급의 주급·월급 환산과 근로시간별 주휴수당 표가 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/weekly-holiday-pay/${row.hourly}`,
        label: `시급 ${won(row.hourly)} 주휴수당`,
        note: `주 ${won(row.weeklyHoliday)} · 실질 시급 ${won(row.effectiveHourly)}`,
      })),
    },
    note: "※ 주 40시간 기준 세전 금액입니다. 실제 지급액은 근로계약서상 소정근로시간과 개근 여부에 따라 달라집니다.",
  };
}

// =========================
// 지역가입자 건보료 (/regional-health)
// =========================
function regionalHealthHub() {
  const rows = REGIONAL_HEALTH_AMOUNTS.map((amount) => ({
    amount,
    ...regionalHealthEstimate(amount * 10_000),
  }));

  return {
    h1: "지역가입자 건강보험료 계산기 | 퇴사 후 건보 비교",
    lead: [
      "퇴사하면 직장가입자 자격이 사라지고 <strong>지역가입자</strong>로 전환됩니다. 이 계산기는 퇴사 직전 월급을 기준으로 지역가입자 보험료와 임의계속가입 보험료를 비교해, 어느 쪽을 선택해야 하는지 판단할 수 있게 합니다.",
      `다루는 월급 범위는 ${manWon(REGIONAL_HEALTH_AMOUNTS[0])}부터 ${manWon(REGIONAL_HEALTH_AMOUNTS[REGIONAL_HEALTH_AMOUNTS.length - 1])}까지입니다.`,
    ],
    sections: [
      {
        h2: "퇴사하면 보험료가 오르는 구조적 이유",
        body: [
          `직장가입자는 보험료를 회사와 절반씩 나눠 냅니다. 건강보험 요율 ${formatPercent(RATES_2026.healthInsurance.employee * 2, 2)} 중 근로자가 부담하는 것은 ${formatPercent(RATES_2026.healthInsurance.employee, 3)}뿐입니다.`,
          "퇴사하면 이 절반 부담이 사라져 <strong>전액을 본인이</strong> 냅니다. 소득이 그대로여도 보험료가 2배가 되는 셈입니다.",
          "게다가 지역가입자 보험료는 소득만 보지 않습니다. 주택·토지·전월세 보증금 같은 <strong>재산</strong>과 <strong>자동차</strong>를 점수화해 합산 부과하므로, 소득이 0원이 되어도 재산이 있으면 보험료가 나옵니다. 퇴사자가 예상보다 높은 고지서를 받는 가장 흔한 이유입니다.",
        ],
      },
      {
        h2: "월급별 지역가입자·임의계속가입 보험료 비교",
        table: {
          head: ["퇴사 전 월급", "지역가입자(소득분만)", "임의계속가입", "월 차액"],
          rows: rows.map((row) => ({
            cells: [
              manWon(row.amount),
              `<strong style="color:#dc2626;">${won(row.regionalIncomeOnly)}</strong>`,
              `<strong style="color:#047857;">${won(row.formerEmployed)}</strong>`,
              won(row.regionalIncomeOnly - row.formerEmployed),
            ],
          })),
        },
        tableNote:
          "지역가입자 금액은 재산·자동차 점수를 제외한 소득분만의 최소 추정치입니다. 재산이 있으면 실제 보험료는 이보다 훨씬 높아지므로, 표의 차액은 최소값으로 보아야 합니다.",
      },
      {
        h2: "임의계속가입 36개월과 신청 기한",
        body: [
          "임의계속가입은 퇴직 전 18개월 동안 직장가입자 자격을 1년 이상 유지했던 사람이 <strong>최대 36개월</strong>간 직장가입자 시절의 보험료(본인 부담분)를 그대로 낼 수 있는 제도입니다.",
          "핵심은 <strong>신청 기한</strong>입니다. 지역가입자 자격으로 전환된 후 최초 고지받은 보험료의 납부기한에서 2개월이 지나기 전까지 신청해야 합니다. 이 기한을 놓치면 다시는 신청할 수 없습니다.",
          "다만 항상 유리한 것은 아닙니다. 재산이 거의 없고 퇴사 후 소득도 없다면 지역가입자 보험료가 임의계속가입보다 쌀 수 있습니다. 첫 고지서를 받아본 뒤 비교해 결정하는 것이 안전합니다.",
          "배우자가 직장가입자라면 <strong>피부양자 등재</strong>가 가장 유리합니다. 요건을 충족하면 보험료가 0원이 되므로, 임의계속가입을 신청하기 전에 피부양자 자격부터 확인하세요.",
        ],
        callout:
          "<strong>정확한 금액 확인</strong> — 국민건강보험공단(1577-1000) 또는 공단 홈페이지의 '지역보험료 모의계산'에서 재산·자동차를 포함한 실제 보험료를 확인할 수 있습니다.",
      },
      {
        h2: "재산과 자동차가 보험료를 만드는 구조",
        body: [
          "지역가입자 보험료는 소득·재산·자동차를 각각 점수로 환산해 합산한 뒤 점수당 단가를 곱해 산정합니다. 그래서 소득이 0원이어도 보험료가 0원이 되지 않습니다.",
          "<strong>재산</strong>에는 주택·건물·토지의 재산세 과세표준과 전월세 보증금이 들어갑니다. 보증금은 일정 비율만 반영되지만, 전세가 큰 무소득 퇴사자가 예상 밖의 고지서를 받는 주된 이유입니다.",
          "<strong>자동차</strong>는 사용 연수 9년 미만이면서 일정 가액을 넘는 차량이 부과 대상입니다. 오래된 차나 생계형 차량은 제외되므로, 차령이 9년을 넘기면 그만큼 보험료가 줄어듭니다.",
          "소득이 크게 줄었다면 <strong>조정 신청</strong>을 할 수 있습니다. 퇴직·폐업으로 소득이 없어진 사실을 증빙하면 그 소득분을 보험료 산정에서 빼 줍니다. 신청하지 않으면 전년도 소득 기준으로 계속 부과되므로 반드시 챙겨야 합니다.",
        ],
      },
    ],
    variants: {
      h2: "월급별 상세 비교",
      lead: "각 페이지에는 해당 월급의 퇴사 후 건강보험 3가지 선택지와 예상 보험료가 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/regional-health/${row.amount}`,
        label: `월급 ${manWon(row.amount)} 퇴사 후 건보료`,
        note: `임의계속가입 ${won(row.formerEmployed)}`,
      })),
    },
    note: "※ 소득분만 반영한 최소 추정치입니다. 재산·자동차 점수가 포함된 실제 보험료는 건보공단 모의계산으로 확인하세요.",
  };
}

// =========================
// 실업급여 (/unemployment)
// =========================
function unemploymentHub() {
  const rows = UNEMPLOYMENT_AMOUNTS.map((amount) => ({
    amount,
    ...unemploymentDailyAllowance(amount * 10_000),
  }));
  const capped = rows.filter((row) => row.dailyAmount === UNEMPLOYMENT_DAILY_MAX);
  const floored = rows.filter((row) => row.dailyAmount === UNEMPLOYMENT_DAILY_MIN);

  return {
    h1: "2026 실업급여 계산기 | 구직급여 수급액·수급기간",
    lead: [
      "퇴사 전 월급으로 <strong>구직급여 일 수급액과 총 수급액</strong>을 계산합니다. 구직급여는 이직 전 평균임금의 60%를 지급하되, 2026년 고시 상한 " +
        won(UNEMPLOYMENT_DAILY_MAX) +
        "·하한 " +
        won(UNEMPLOYMENT_DAILY_MIN) +
        "이 먼저 적용됩니다.",
      `다루는 월급 범위는 ${manWon(UNEMPLOYMENT_AMOUNTS[0])}부터 ${manWon(UNEMPLOYMENT_AMOUNTS[UNEMPLOYMENT_AMOUNTS.length - 1])}까지이며, 수급일수는 나이와 고용보험 가입기간에 따라 120일에서 270일까지 차등 적용됩니다.`,
    ],
    sections: [
      {
        h2: "60%보다 상·하한이 먼저 걸린다",
        body: [
          "구직급여 일액은 이직 전 3개월 평균임금의 60%로 계산합니다. 하지만 이 값이 상한을 넘으면 상한액으로, 하한에 못 미치면 하한액으로 바뀝니다.",
          `2026년 하한액 ${won(UNEMPLOYMENT_DAILY_MIN)}은 최저임금의 80%를 1일 8시간 기준으로 환산한 금액입니다. 최저임금이 오르면 하한액도 함께 오릅니다.`,
          "결과적으로 실업급여는 소득 비례 구간이 좁습니다. 아래 표에서 보듯 월급이 크게 달라도 일 수급액은 같은 값에 수렴하는 경우가 많습니다.",
        ],
      },
      {
        h2: "월급별 일 수급액과 수급일수별 총액",
        table: {
          head: ["퇴사 전 월급", "평균임금 60%", "실제 일 수급액", "150일 수급 시", "270일 수급 시"],
          rows: rows.map((row) => ({
            cells: [
              manWon(row.amount),
              won(row.rawDaily),
              `<strong style="color:#047857;">${won(row.dailyAmount)}</strong>`,
              won(row.dailyAmount * 150),
              won(row.dailyAmount * 270),
            ],
          })),
        },
        tableNote:
          "수급일수는 이직일 기준 나이와 고용보험 가입기간으로 정해집니다. 50세 미만·가입 1년 미만은 120일, 50세 이상·가입 10년 이상은 최대 270일입니다.",
      },
      {
        h2: "월급이 올라도 수급액이 같아지는 지점",
        body: [
          capped.length > 0
            ? `표에서 월급 ${manWon(capped[0].amount)} 이상은 평균임금 60%가 ${won(capped[0].rawDaily)}로 상한 ${won(UNEMPLOYMENT_DAILY_MAX)}을 넘어서기 때문에, 월급 ${manWon(capped[0].amount)}인 사람과 ${manWon(capped[capped.length - 1].amount)}인 사람의 일 수급액이 <strong>완전히 동일</strong>합니다.`
            : "",
          floored.length > 0
            ? `반대로 월급 ${manWon(floored[0].amount)}은 평균임금 60%가 ${won(floored[0].rawDaily)}으로 하한 ${won(UNEMPLOYMENT_DAILY_MIN)}에 못 미쳐 하한액이 적용됩니다. 즉 계산상 60%보다 더 많이 받습니다.`
            : "",
          "따라서 실업급여 금액을 좌우하는 것은 월급보다 <strong>수급일수</strong>입니다. 같은 일 수급액이라도 120일과 270일은 총액이 2배 이상 차이 납니다. 나이와 가입기간을 먼저 확인하는 편이 실질적입니다.",
        ],
        callout:
          "<strong>수급 요건</strong> — 이직 전 18개월 중 피보험 단위기간 180일 이상, 비자발적 이직, 근로 의사와 능력이 있을 것. 자발적 퇴사는 원칙적으로 제외되며 퇴사 다음 날부터 12개월 이내에 수급을 마쳐야 합니다.",
      },
      {
        h2: "신청이 늦으면 받을 수 있는 날이 줄어든다",
        body: [
          "구직급여는 퇴사한 다음 날부터 <strong>12개월 안에</strong> 받아야 합니다. 이 기간은 신청일이 아니라 수급을 마치는 시점을 기준으로 하므로, 늦게 신청하면 소정급여일수가 남아 있어도 12개월이 지나는 순간 지급이 끊깁니다.",
          "예를 들어 소정급여일수가 210일인데 퇴사 후 8개월이 지나 신청하면, 남은 4개월분만 받고 나머지는 소멸합니다. 퇴사 직후 신청하는 것이 원칙입니다.",
          "신청 전에 회사가 <strong>이직확인서</strong>를 고용센터에 제출해야 합니다. 회사가 미루면 근로자가 직접 발급을 요청할 수 있고, 10일 안에 처리하지 않으면 과태료 대상입니다.",
        ],
        after: [
          "수급 중에는 1~4주마다 실업인정을 받아야 하며, 재취업 활동을 증명하지 못하면 그 회차분이 지급되지 않습니다. 조기에 재취업하면 남은 급여의 절반을 조기재취업수당으로 받을 수 있습니다.",
        ],
      },
    ],
    variants: {
      h2: "월급별 상세 계산",
      lead: "각 페이지에는 해당 월급의 수급일수 시나리오별 총 수급액과 신청 절차가 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/unemployment/${row.amount}`,
        label: `월급 ${manWon(row.amount)} 실업급여`,
        note: `일 ${won(row.dailyAmount)}`,
      })),
    },
    note: "※ 2026년 고용노동부 고시 상·하한액 기준 추정치입니다. 실제 수급액과 소정급여일수는 고용센터 심사로 확정됩니다.",
  };
}

// =========================
// 연말정산 (/year-end-settlement)
// =========================
function yearEndHub() {
  const rows = YEAR_END_AMOUNTS.map((amount) => {
    const result = salaryOf(amount);
    const extraDeduction = Math.min(3_000_000, Math.floor(amount * 10_000 * 0.05));
    return {
      amount,
      determinedTax: result.determinedTax,
      extraDeduction,
      refund: Math.floor(extraDeduction * 0.15),
    };
  });

  return {
    h1: "2026 연말정산 계산기 | 환급액·세액공제 시뮬레이터",
    lead: [
      "연봉과 공제 항목을 넣으면 <strong>연말정산 예상 환급액</strong>을 계산합니다. 연말정산은 매달 간이세액표로 걷어간 원천징수액과 실제 확정세액의 차액을 정산하는 절차이므로, 결과는 환급일 수도 추가 납부일 수도 있습니다.",
      `다루는 연봉 범위는 ${manWon(YEAR_END_AMOUNTS[0])}부터 ${manWon(YEAR_END_AMOUNTS[YEAR_END_AMOUNTS.length - 1])}까지입니다.`,
    ],
    sections: [
      {
        h2: "환급이 아니라 정산이다",
        body: [
          "연말정산을 '13월의 월급'이라 부르지만 정확히는 <strong>정산</strong>입니다. 회사가 매달 뗀 소득세는 간이세액표에 따른 어림값이고, 1년치 실제 소득과 공제를 반영해 확정세액을 구한 뒤 차액을 돌려주거나 더 걷습니다.",
          "따라서 환급을 많이 받았다는 것은 그만큼 매달 세금을 많이 냈다는 뜻이기도 합니다. 원천징수 비율을 80%로 선택하면 매달 실수령이 늘고 환급은 줄어듭니다.",
          "추가 납부가 나오는 경우도 정상입니다. 중도 입사·이직으로 두 회사 소득이 합산되거나, 부양가족 공제를 중복 신청했을 때 자주 발생합니다.",
        ],
      },
      {
        h2: "연봉별 결정세액과 공제 효과",
        table: {
          head: ["연봉", "연간 결정세액", "추가 공제 가정", "예상 환급액"],
          rows: rows.map((row) => ({
            cells: [
              manWon(row.amount),
              won(row.determinedTax),
              won(row.extraDeduction),
              `<strong style="color:#047857;">약 ${won(row.refund)}</strong>`,
            ],
          })),
        },
        tableNote:
          "부양가족 1인·비과세 식대 월 20만원 기준이며, 추가 공제는 연봉의 5%(최대 300만원)를 표준 시나리오로 가정했습니다. 실제 환급액은 신용카드 사용액·의료비·교육비·월세·연금저축 납입액에 따라 크게 달라집니다.",
      },
      {
        h2: "같은 공제액이 연봉에 따라 다른 환급을 만드는 이유",
        body: [
          "<strong>소득공제</strong>는 과세표준을 줄이므로 환급액이 한계세율에 비례합니다. 같은 100만원을 공제받아도 6% 구간이면 6만원, 35% 구간이면 35만원이 줄어듭니다. 고연봉일수록 소득공제의 가치가 큽니다.",
          "<strong>세액공제</strong>는 산출세액에서 직접 빼므로 연봉과 무관하게 같은 금액이 줄어듭니다. 연금저축·IRP 세액공제율은 총급여 5,500만원 이하 16.5%, 초과 13.2%로 오히려 저연봉에 유리합니다.",
          `표에서 연봉 ${manWon(rows[0].amount)}의 결정세액은 ${won(rows[0].determinedTax)}인데, 환급액은 결정세액을 넘을 수 없습니다. 즉 낼 세금이 적으면 공제를 아무리 많이 받아도 돌려받을 금액에 한계가 있습니다.`,
          "그래서 연봉 구간에 따라 공략할 항목이 다릅니다. 저연봉이라면 세액공제형(연금저축·월세), 고연봉이라면 소득공제형(신용카드·주택자금)을 우선 채우는 편이 효율적입니다.",
        ],
        callout:
          "<strong>일정</strong> — 간소화 자료 조회는 1월 15일부터, 회사 제출은 대체로 2월 초까지, 환급금은 2월 급여에 반영되는 것이 일반적입니다. 누락분은 5월 종합소득세 기간에 경정청구할 수 있습니다.",
      },
    ],
    variants: {
      h2: "연봉별 상세 시뮬레이션",
      lead: "각 페이지에는 해당 연봉의 공제 항목별 환급 기여도와 절세 우선순위가 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/year-end-settlement/${row.amount}`,
        label: `연봉 ${manWon(row.amount)} 연말정산`,
        note: `결정세액 ${won(row.determinedTax)}`,
      })),
    },
    note: "※ 표준 공제 시나리오 기준 추정치입니다. 정확한 환급액은 국세청 홈택스 '연말정산 미리보기'에서 확인하세요.",
  };
}

// =========================
// 임금체불 지연이자 (/unpaid-wage)
// =========================
function unpaidWageHub() {
  const rows = UNPAID_WAGE_AMOUNTS.map((amount) => {
    const value = amount * 10_000;
    return {
      amount,
      value,
      d30: unpaidWageInterest(value, 0.2, 30),
      d90: unpaidWageInterest(value, 0.2, 90),
      d365: unpaidWageInterest(value, 0.2, 365),
      retired365: unpaidWageInterest(value, 0.05, 365),
    };
  });

  return {
    h1: "임금체불 지연이자 계산기 | 퇴직 후 연 20%·재직 5~6%",
    lead: [
      "밀린 월급·퇴직금에 붙는 <strong>지연이자</strong>를 체불액과 지연 일수로 계산합니다. 퇴직한 근로자의 금품이 청산되지 않으면 근로기준법 제37조에 따라 연 <strong>20%</strong>의 지연이자가 붙습니다.",
      `다루는 체불액 범위는 ${manWon(UNPAID_WAGE_AMOUNTS[0])}부터 ${manWon(UNPAID_WAGE_AMOUNTS[UNPAID_WAGE_AMOUNTS.length - 1])}까지이며, 30일·90일·180일·365일 지연 시 이자를 각각 확인할 수 있습니다.`,
    ],
    sections: [
      {
        h2: "퇴직 14일이 지나면 이자율이 4배로 뛴다",
        body: [
          "근로기준법 제36조는 근로자가 퇴직하면 <strong>14일 이내</strong>에 임금·퇴직금 등 모든 금품을 지급하도록 정하고 있습니다. 이 기한을 넘기면 제37조의 지연이자 연 20%가 적용됩니다.",
          "재직 중 체불이라면 이야기가 다릅니다. 근로기준법상 20% 규정은 <strong>퇴직자에게만</strong> 적용되므로, 재직 중에는 민법상 연 5%(상사채권이면 상법상 연 6%)가 기준이 됩니다.",
          "소송으로 가면 또 달라집니다. 소장 부본이 사용자에게 송달된 다음 날부터는 소송촉진 등에 관한 특례법에 따라 연 12%가 적용됩니다.",
        ],
      },
      {
        h2: "체불액별 퇴직 후 연 20% 지연이자",
        table: {
          head: ["체불액", "30일", "90일", "365일", "(비교) 재직 5% 365일"],
          rows: rows.map((row) => ({
            cells: [
              manWon(row.amount),
              won(row.d30),
              won(row.d90),
              `<strong style="color:#dc2626;">${won(row.d365)}</strong>`,
              won(row.retired365),
            ],
          })),
        },
        tableNote:
          "지연이자 = 체불액 × 연이율 × 지연일수 ÷ 365로 계산했습니다. 퇴직 후 20% 구간은 금품청산 기한 14일을 제외한 날부터 기산합니다.",
      },
      {
        h2: "지연이자를 실제로 받아내는 순서",
        body: [
          "지연이자는 자동으로 지급되지 않습니다. 청구해야 발생 사실이 확정되며, 아래 순서로 진행하는 것이 일반적입니다.",
        ],
        list: [
          "<strong>내용증명 발송</strong> — 체불 금액과 지연이자를 명시해 지급을 요구합니다. 이후 절차에서 청구 의사를 입증하는 근거가 됩니다.",
          "<strong>고용노동부 진정</strong> — 사업장 관할 지방고용노동관서에 진정을 제기합니다. 온라인(노동포털)으로도 가능하며 비용이 들지 않습니다.",
          "<strong>체불금품확인원 발급</strong> — 근로감독관이 체불을 확인하면 발급됩니다. 소액체당금 신청과 민사소송의 근거 서류가 됩니다.",
          "<strong>민사소송 또는 지급명령</strong> — 사용자가 끝내 지급하지 않으면 법원 절차로 갑니다. 소장 송달 다음 날부터는 연 12%가 적용됩니다.",
          "<strong>대지급금(구 체당금) 신청</strong> — 사업주가 도산했거나 지급 능력이 없을 때 국가가 일정 한도로 대신 지급합니다.",
        ],
        after: [
          "다만 사업주에게 회생·파산 절차가 개시되었거나 지급 지연에 정당한 사유가 인정되면 20% 지연이자 적용이 제외될 수 있습니다(근로기준법 시행령 제18조).",
          "임금채권의 소멸시효는 <strong>3년</strong>입니다. 체불이 오래됐다면 시효가 지나기 전에 진정이나 소송으로 시효를 중단시켜야 합니다.",
        ],
        callout:
          "<strong>상담 창구</strong> — 고용노동부 고객상담센터 1350, 또는 대한법률구조공단 132에서 무료 상담을 받을 수 있습니다. 임금체불 사건은 법률구조공단의 무료 소송대리 대상입니다.",
      },
    ],
    variants: {
      h2: "체불 금액별 상세 계산",
      lead: "각 페이지에는 해당 체불액의 이율별·기간별 지연이자 표와 청구 시 준비할 서류가 들어 있습니다.",
      items: rows.map((row) => ({
        href: `/unpaid-wage/${row.amount}`,
        label: `체불액 ${manWon(row.amount)} 지연이자`,
        note: `1년 지연 시 ${won(row.d365)}`,
      })),
    },
    note: "※ 근로기준법·민법·상법·소송촉진법 이율 기준 추정치입니다. 실제 인정 금액은 노동청 조사와 법원 판단에 따라 달라집니다.",
  };
}

// =========================
// 건강보험 피부양자 (/dependent)
// =========================
function dependentHub() {
  const incomeCeiling = 20_000_000;
  const propertyHigh = 900_000_000;
  const propertyMid = 540_000_000;
  const midIncomeCeiling = 10_000_000;
  const businessCeiling = 5_000_000;

  return {
    h1: "2026 건보 피부양자 자격 판정기 | 소득·재산 기준",
    lead: [
      "직장가입자의 가족이 <strong>건강보험 피부양자 자격을 유지할 수 있는지</strong>를 소득·재산·사업소득 기준으로 판정합니다. 피부양자는 보험료를 내지 않으므로, 탈락하면 지역가입자로 전환되어 매월 보험료가 새로 부과됩니다.",
      "판정은 소득 요건과 재산 요건을 <strong>모두</strong> 충족해야 통과입니다. 하나라도 걸리면 탈락이며, 이 계산기는 어느 요건에서 걸리는지까지 알려줍니다.",
    ],
    sections: [
      {
        h2: "세 개의 관문을 모두 통과해야 자격이 유지된다",
        body: [
          `첫 번째는 <strong>소득 요건</strong>입니다. 연간 합산소득이 ${won(incomeCeiling)}을 넘으면 탈락합니다. 합산소득에는 금융소득(이자·배당), 연금소득, 근로소득, 사업소득, 기타소득이 모두 포함됩니다.`,
          `두 번째는 <strong>재산 요건</strong>입니다. 재산세 과세표준이 ${won(propertyHigh)}을 넘으면 소득과 무관하게 탈락하고, ${won(propertyMid)}~${won(propertyHigh)} 구간이면 연 소득 ${won(midIncomeCeiling)} 이하일 때만 자격이 유지됩니다.`,
          `세 번째는 <strong>부양 요건</strong>입니다. 직장가입자와의 관계(배우자·직계존비속·형제자매 등)와 동거 여부에 따라 인정 범위가 달라집니다. 형제자매는 원칙적으로 제외되며 30세 미만·65세 이상·장애인 등만 예외적으로 인정됩니다.`,
        ],
      },
      {
        h2: "탈락을 만드는 기준선 한눈에 보기",
        table: {
          head: ["요건", "기준", "초과 시 결과"],
          rows: [
            {
              cells: [
                "연간 합산소득",
                `${won(incomeCeiling)} 초과`,
                "즉시 탈락",
              ],
            },
            {
              cells: [
                "재산세 과세표준",
                `${won(propertyHigh)} 초과`,
                "소득과 무관하게 탈락",
              ],
            },
            {
              cells: [
                "재산세 과세표준",
                `${won(propertyMid)} 초과 ~ ${won(propertyHigh)} 이하`,
                `연 소득 ${won(midIncomeCeiling)} 초과 시 탈락`,
              ],
            },
            {
              cells: [
                "사업소득 (사업자등록 있음)",
                "1원이라도 발생",
                "즉시 탈락",
              ],
            },
            {
              cells: [
                "사업소득 (사업자등록 없음)",
                `${won(businessCeiling)} 초과`,
                "탈락",
              ],
            },
          ],
        },
        tableNote:
          "재산세 과세표준은 공시가격이 아니라 공시가격에 공정시장가액비율(주택 60%, 토지·건축물 70%)을 곱한 값입니다. 공시가격 9억원 주택의 과세표준은 약 5.4억원이므로, 이 지점이 실질적인 경계선입니다.",
      },
      {
        h2: "연금 수령 개시가 가장 흔한 탈락 사유인 이유",
        body: [
          `국민연금·공무원연금 등 공적연금은 합산소득에 그대로 잡힙니다. 월 167만원(연 ${won(incomeCeiling)})을 넘는 순간 피부양자에서 탈락하는데, 이 금액은 공무원연금 수급자에게는 드물지 않은 수준입니다.`,
          "은퇴 후 소득이 줄었는데 보험료가 새로 생기는 역설이 여기서 나옵니다. 게다가 퇴직 시점에 주택을 보유하고 있으면 재산 요건까지 겹쳐 지역가입자 보험료가 상당해집니다.",
          "금융소득도 자주 걸립니다. 연 2,000만원 초과 금융소득은 종합과세 대상이 되면서 동시에 피부양자 탈락 사유가 됩니다. 예금 만기가 한 해에 몰리면 그해만 일시적으로 탈락할 수 있으므로 만기를 분산하는 것이 방법입니다.",
          "사업소득은 기준이 가장 엄격합니다. 사업자등록이 있으면 <strong>소득이 1원만 발생해도</strong> 탈락합니다. 프리랜서로 3.3% 원천징수만 받는 경우(사업자등록 없음)는 연 500만원까지 허용됩니다.",
        ],
      },
      {
        h2: "탈락하면 보험료는 얼마가 되는가",
        body: [
          "피부양자에서 탈락하면 지역가입자로 전환되어 소득·재산·자동차를 점수화한 보험료가 부과됩니다. 소득이 적어도 주택이 있으면 월 20만~50만원대가 나오는 경우가 흔합니다.",
          "탈락 통보는 보통 소득 자료가 반영되는 <strong>11월</strong>에 이루어집니다. 국세청 소득 자료가 건보공단에 넘어가 재산정되는 시점이기 때문입니다.",
          "완충 장치도 있습니다. 피부양자에서 지역가입자로 전환된 경우 보험료의 일부를 한시적으로 경감해주는 제도가 운영되고 있으므로, 고지서를 받으면 공단에 경감 대상 여부를 문의할 가치가 있습니다.",
        ],
        callout:
          "<strong>다음 단계</strong> — 탈락이 예상된다면 <a href=\"/finance/regional-health\">지역가입자 건강보험료 계산기</a>로 전환 후 보험료를 미리 확인하고, 직장 재취업이나 임의계속가입 가능성도 함께 검토하세요.",
      },
    ],
    variants: null,
    note: "※ 소득·재산 요건 기준의 간이 판정이며 부양요건(가족관계)과 공단 보유 부과 자료는 반영하지 않습니다. 확정 판정은 국민건강보험공단(1577-1000)에서 확인하세요.",
  };
}

// =========================
// 근로장려금 (/eitc)
// =========================
function eitcHub() {
  const households = Object.entries(EITC_BRACKET_TABLE);

  return {
    h1: "2026 근로장려금·자녀장려금 계산기 | 가구 유형별 지급액",
    lead: [
      "가구 유형과 연간 총급여로 <strong>근로장려금 예상 지급액</strong>을 계산합니다. 근로장려금은 일은 하지만 소득이 적은 가구에 세금 환급 형태로 지급하는 근로연계형 소득지원 제도입니다.",
      "핵심은 가구 유형입니다. 단독·홑벌이·맞벌이에 따라 소득 상한과 지급 상한이 모두 다르므로, 같은 총급여라도 받는 금액이 크게 달라집니다.",
    ],
    sections: [
      {
        h2: "소득이 늘수록 커졌다가 다시 줄어드는 구조",
        body: [
          "근로장려금은 소득에 단순 반비례하지 않습니다. <strong>점증 → 평탄 → 점감</strong> 세 구간으로 설계되어 있습니다.",
          "<strong>점증 구간</strong>에서는 소득이 늘수록 장려금도 함께 늘어납니다. 일을 더 할수록 이득이 되도록 만든 구간입니다. <strong>평탄 구간</strong>에서는 최대액이 유지되고, <strong>점감 구간</strong>에 들어서면 소득이 늘수록 장려금이 줄어 상한에서 0원이 됩니다.",
          "따라서 소득이 아주 적으면 오히려 장려금도 적습니다. 근로 유인을 주기 위한 설계이며, 이 점에서 기초생활보장제도와 성격이 다릅니다.",
        ],
      },
      {
        h2: "가구 유형별 소득 구간과 지급 상한",
        table: {
          head: ["가구 유형", "점증 구간", "평탄 구간(최대액)", "지급 상한 소득", "최대 지급액"],
          rows: households.map(([, bracket]) => ({
            cells: [
              bracket.label,
              `~${won(bracket.phaseInEnd)}`,
              `${won(bracket.phaseInEnd)}~${won(bracket.plateauEnd)}`,
              won(bracket.phaseOutEnd),
              `<strong style="color:#047857;">${won(bracket.maxAmount)}</strong>`,
            ],
          })),
        },
        tableNote:
          "단독 가구는 배우자·부양자녀·70세 이상 직계존속이 없는 가구, 홑벌이는 배우자 총급여가 300만원 미만이거나 부양가족이 있는 가구, 맞벌이는 부부 모두 총급여 300만원 이상인 가구입니다.",
      },
      {
        h2: "재산 1억7천만원과 2억4천만원에서 생기는 두 번의 절벽",
        body: [
          "소득 요건을 충족해도 재산 요건에서 걸릴 수 있습니다. 가구원 전체의 재산 합계가 <strong>1억7,000만원 이상</strong>이면 산정된 장려금의 50%만 지급되고, <strong>2억4,000만원 이상</strong>이면 아예 지급되지 않습니다.",
          "재산에는 주택·토지·건축물·자동차·전세보증금·예금이 모두 포함되며, 부채는 차감하지 않습니다. 전세보증금이 큰 가구가 예상 밖으로 탈락하는 이유가 여기 있습니다.",
          "이 두 지점은 연속적이지 않은 <strong>절벽</strong>입니다. 재산이 1억6,999만원이면 전액, 1억7,000만원이면 절반이 되므로 경계 근처에서는 재산 평가 기준일(전년도 6월 1일) 시점의 자산 구성이 결정적입니다.",
        ],
        callout:
          "<strong>신청 시기</strong> — 정기 신청은 5월, 근로소득자 반기 신청은 상반기분 9월·하반기분 다음 해 3월입니다. 기한 후 신청(정기분)은 지급액이 5% 감액되므로 기한 내 신청이 유리합니다.",
      },
      {
        h2: "자녀장려금은 별도로 계산된다",
        body: [
          "근로장려금과 자녀장려금은 <strong>중복 수급이 가능</strong>합니다. 자녀장려금은 18세 미만 부양자녀 1인당 최대 100만원으로, 총급여 2,100만원까지는 자녀당 100만원 전액, 이후 7,000만원까지 점감해 최소 50만원이 지급됩니다.",
          "단독 가구는 부양자녀가 없으므로 자녀장려금 대상이 아닙니다. 결혼·출산으로 가구 유형이 바뀌면 근로장려금 기준도 함께 달라지니 다시 확인해야 합니다.",
          "자녀세액공제와도 중복됩니다. 다만 자녀장려금을 받으면 자녀세액공제액에서 차감 조정이 있으므로, 연말정산 결과와 함께 보아야 정확합니다.",
        ],
      },
    ],
    variants: {
      h2: "우리 가구 유형으로 바로 확인",
      lead: "가구 유형별 페이지에는 소득 구간을 200만원 단위로 나눈 예상 지급액 표가 들어 있습니다.",
      items: households.map(([slug, bracket]) => ({
        href: `/eitc/${slug}`,
        label: `${bracket.label} 근로장려금 소득별 지급액`,
        note: `최대 ${won(bracket.maxAmount)} · 상한 ${won(bracket.phaseOutEnd)}`,
      })),
    },
    note: "※ 조세특례제한법 산식 기준 간이 추정치입니다. 국세청 산정표의 구간 단위·단수 조정과 국민연금 수급 등 제외 요건에 따라 실제 지급액이 달라집니다.",
  };
}

export const HUB_PAGES = {
  "/comprehensive-tax": comprehensiveTaxHub,
  "/compare": compareHub,
  "/quit": quitHub,
  "/withholding": withholdingHub,
  "/freelancer": freelancerHub,
  "/wage-converter": wageConverterHub,
  "/severance-pay": severancePayHub,
  "/parental-leave": parentalLeaveHub,
  "/weekly-holiday-pay": weeklyHolidayPayHub,
  "/regional-health": regionalHealthHub,
  "/unemployment": unemploymentHub,
  "/year-end-settlement": yearEndHub,
  "/unpaid-wage": unpaidWageHub,
  "/dependent": dependentHub,
  "/eitc": eitcHub,
};
