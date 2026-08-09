// Hub bodies for the single-tool calculators and the /all index.
//
// These ten routes previously rendered through prerender-guides.mjs, a fixed four-heading
// template (언제 사용하는가 / 계산 방식 / 확인할 점 / 함께 확인할 계산기) shared by twelve pages.
// Measured on the audit basis they ran 239~498 characters each — thin *and* mutually templated,
// which is the pair of signals an AdSense reviewer reads as "low value".
//
// Each definition below picks its own headings from the thing that calculator actually decides,
// and every figure comes from calc-engine.mjs using the same default inputs the Vue view starts
// with, so the hub quotes what a visitor sees when the page loads.

import {
  calcAnnualLeavePay,
  calcBonusImpact,
  calcEmployerInsuranceBurden,
  calcFreelanceRate,
  calcIrpTaxCredit,
  calcMonthlyRentDeduction,
  calcOvertimeImpact,
  calcPensionEstimate,
  calcRaiseImpact,
  formatPercent,
  formatWon,
  getAnnualLeaveDays,
  PENSION_AGE_FACTORS,
  RATES_2026,
} from "./calc-engine.mjs";

const won = (v) => formatWon(v);
const pct = (v, d = 1) => formatPercent(v, d);

// =========================
// 연봉 인상률 (/raise)
// =========================
function raiseHub() {
  const base = 52_000_000;
  const r = calcRaiseImpact({ currentAnnual: base, raisePercent: 8 });
  const keepRate = r.annualNetDiff / r.raiseAmount;
  const grid = [3, 5, 8, 10, 15].map((p) => ({ p, ...calcRaiseImpact({ currentAnnual: base, raisePercent: p }) }));

  return {
    h1: "2026 연봉 인상률 계산기",
    lead: [
      "협상 테이블에 오른 인상률이 <strong>월급에서 몇 원으로 바뀌는지</strong> 계산합니다. 인상 전후 연봉에 2026년 4대보험 요율과 근로소득 간이세액표를 똑같이 적용해, 명목 인상액이 아니라 실수령 증가액을 비교합니다.",
      `기본 시나리오는 현재 연봉 ${won(base)}에 인상률 8%입니다. 세전으로는 ${won(r.raiseAmount)}이 오르지만 실제로 통장에 더 들어오는 돈은 연 <strong>${won(r.annualNetDiff)}</strong>, 월 ${won(r.monthlyNetDiff)}입니다.`,
    ],
    sections: [
      {
        h2: "인상액의 몇 %가 손에 남는가",
        body: [
          `세전 인상액 ${won(r.raiseAmount)} 중 실제로 남는 금액은 ${won(r.annualNetDiff)}으로 <strong>${pct(keepRate)}</strong>입니다. 나머지는 늘어난 4대보험료와 소득세로 빠집니다.`,
          "이 잔존율은 연봉대마다 다릅니다. 인상분이 어느 누진 구간에 얹히느냐가 세금 증가폭을 정하고, 국민연금은 기준소득월액 상한에 도달하면 더 늘지 않기 때문입니다. 그래서 '몇 % 올려준다'는 말만으로는 체감을 알 수 없습니다.",
        ],
      },
      {
        h2: "인상분이 보험료와 세금으로 갈라지는 비율",
        table: {
          head: ["항목", "월 증가액"],
          rows: [
            { cells: ["4대보험료 증가", `-${won(r.insuranceDelta)}`] },
            { cells: ["소득세·지방소득세 증가", `-${won(r.taxDelta)}`] },
            { cells: ["<strong>월 실수령 증가</strong>", `<strong style="color:#047857;">${won(r.monthlyNetDiff)}</strong>`], highlight: true },
          ],
        },
        tableNote:
          "부양가족 1인·비과세 식대 월 20만원 기준입니다. 보험료는 국민연금 4.75%·건강보험 3.595%·장기요양(건보료의 13.14%)·고용보험 0.9%를 합산한 증가분입니다.",
      },
      {
        h2: "인상률별 월 실수령 증가액",
        table: {
          head: ["인상률", "세전 인상액", "월 실수령 증가", "실수령 잔존율"],
          rows: grid.map((g) => ({
            cells: [`${g.p}%`, won(g.raiseAmount), `<strong>${won(g.monthlyNetDiff)}</strong>`, pct(g.annualNetDiff / g.raiseAmount)],
          })),
        },
        tableNote: `현재 연봉 ${won(base)} 기준입니다. 인상률이 커질수록 잔존율이 조금씩 떨어지는 것은 인상분의 윗부분이 더 높은 세율 구간에 들어가기 때문입니다.`,
      },
      {
        h2: "같은 인건비면 비과세 항목이 더 남는다",
        body: [
          "회사가 쓰는 돈이 같다면, 과세 연봉을 올리는 것보다 비과세 항목을 늘리는 쪽이 실수령에 유리합니다. 비과세 급여는 4대보험 부과 기준에서도 소득세 과세표준에서도 함께 빠지기 때문입니다.",
          "식대는 월 20만원, 자가운전보조금은 월 20만원(본인 차량으로 업무 수행 시), 연구활동비는 월 20만원까지 비과세 한도가 있습니다. 이미 한도를 다 쓰고 있다면 남은 방법은 연봉 인상뿐입니다.",
          "반대로 인상률이 아무리 높아도 성과급 형태라면 지급 월에 세금이 몰려 체감이 다릅니다. 기본급 인상과 성과급은 별도로 계산해 비교하세요.",
        ],
      },
      {
        h2: "인상 다음 해 4월에 건강보험료가 한 번 더 오른다",
        body: [
          "건강보험료는 전년도 보수를 기준으로 부과하다가, 매년 4월 <strong>보수총액 신고</strong>로 실제 소득에 맞춰 정산합니다. 연봉이 오른 해에는 그동안 덜 낸 보험료가 4월 급여에서 한꺼번에 빠져나갑니다.",
          "인상 폭이 컸다면 정산액도 큽니다. 4월 급여가 유난히 적게 들어왔다면 대부분 이 정산 때문이며, 분할 납부를 신청하면 최대 10회로 나눌 수 있습니다.",
          "퇴직금도 함께 올라갑니다. 퇴직금은 퇴직 전 3개월 평균임금으로 계산하므로, 인상 직후 퇴사하면 인상된 급여가 그대로 반영됩니다. 반대로 퇴사를 앞두고 있다면 인상 시점이 퇴직금에 직접 영향을 줍니다.",
        ],
      },
      {
        h2: "연봉계약서에서 확인할 세 가지",
        list: [
          "<strong>연봉에 퇴직금이 포함돼 있는지</strong> — '연봉에 퇴직금 포함'이라고 적힌 계약은 원칙적으로 무효입니다. 퇴직금은 퇴직 시점에 발생하는 별개의 채권이므로, 매달 나눠 지급했다면 퇴직금을 지급한 것으로 인정되지 않을 수 있습니다.",
          "<strong>연봉이 12분할인지 13분할인지</strong> — 같은 연봉이라도 13분할이면 월 지급액이 줄고 나머지가 상여로 나옵니다. 월 실수령 기준으로 비교해야 실제 조건을 알 수 있습니다.",
          "<strong>비과세 항목이 명시돼 있는지</strong> — 식대·자가운전보조금이 계약서에 없으면 전액 과세됩니다. 같은 연봉이라도 비과세 구성에 따라 실수령이 달라집니다.",
        ],
        after: [
          "인상률만 보고 수락하면 이 세 가지에서 손해를 볼 수 있습니다. 특히 12분할에서 13분할로 바뀌면서 인상률을 제시하는 경우, 월 실수령은 오히려 줄어들 수 있으니 반드시 환산해 비교하세요.",
        ],
      },
    ],
    variants: {
      h2: "함께 확인할 계산기",
      items: [
        { href: "/compare", label: "이직 연봉 비교 계산기", note: "두 연봉의 실수령 차이" },
        { href: "/bonus", label: "성과급 실수령 계산기", note: "상여금은 별도 계산" },
        { href: "/salary", label: "연봉 실수령액 계산기", note: "인상 후 월급 확인" },
      ],
    },
    note: "※ 2026년 공식 요율 기반 추정치입니다. 기본 연봉만 반영하며 성과급·스톡옵션·회사별 비과세 구성은 제외했습니다.",
  };
}

// =========================
// 성과급 (/bonus)
// =========================
function bonusHub() {
  const salary = 52_000_000;
  const bonus = 5_000_000;
  const b = calcBonusImpact({ annualSalary: salary, bonusAmount: bonus });
  const grid = [3_000_000, 5_000_000, 10_000_000, 20_000_000].map((amount) => ({
    amount,
    ...calcBonusImpact({ annualSalary: salary, bonusAmount: amount }),
  }));

  return {
    h1: "2026 성과급 실수령 계산기",
    lead: [
      "성과급·상여금을 받았을 때 <strong>세금과 보험료를 빼고 실제로 남는 금액</strong>을 계산합니다. 기본 연봉만 있을 때의 연간 공제액과 성과급을 더했을 때의 공제액 차이를 성과급에 대한 부담으로 보고 실수령액을 산출합니다.",
      `기본 시나리오는 연봉 ${won(salary)}에 성과급 ${won(bonus)}입니다. 실수령액은 <strong>${won(b.netBonus)}</strong>으로 실효 수령률은 ${pct(b.effectiveBonusRate)}, 세금·보험료로 ${won(b.bonusTax)}이 빠집니다.`,
    ],
    sections: [
      {
        h2: "성과급에는 왜 세금이 더 무겁게 느껴지나",
        body: [
          "성과급은 기본 연봉 위에 얹히므로 <strong>가장 높은 세율 구간</strong>부터 적용됩니다. 연봉이 24% 구간에 있다면 성과급 전액이 최소 24%로 계산되고, 성과급 때문에 구간이 올라가면 넘어간 부분은 더 높은 세율을 받습니다.",
          "4대보험도 함께 붙습니다. 성과급도 보수에 해당하므로 국민연금·건강보험·고용보험이 부과되며, 건강보험은 연말 보수총액 정산에서 다시 반영됩니다.",
          "여기에 원천징수 방식이 체감을 키웁니다. 지급 월에 세금이 한꺼번에 빠져나가 실수령이 예상보다 적어 보이는데, 이는 연말정산에서 최종 정산됩니다.",
        ],
      },
      {
        h2: "성과급 금액별 실수령액",
        table: {
          head: ["성과급(세전)", "세금·보험료", "실수령액", "수령률"],
          rows: grid.map((g) => ({
            highlight: g.amount === bonus,
            cells: [won(g.amount), `-${won(g.bonusTax)}`, `<strong style="color:#047857;">${won(g.netBonus)}</strong>`, pct(g.effectiveBonusRate)],
          })),
        },
        tableNote: `연봉 ${won(salary)}·부양가족 1인 기준입니다. 성과급이 커질수록 수령률이 떨어지는 것은 늘어난 금액이 더 높은 누진 구간에 들어가기 때문입니다.`,
      },
      {
        h2: "지급 월 원천징수와 연말정산의 차이",
        body: [
          "회사는 성과급 지급 월에 '상여금 지급 시 원천징수' 방식으로 세금을 뗍니다. 이 금액은 어림값이라 실제 확정세액과 다를 수 있고, 차액은 다음 해 2월 연말정산에서 정산됩니다.",
          "그래서 지급 월에 많이 떼였다고 손해가 확정된 것은 아닙니다. 반대로 적게 떼였다면 연말정산에서 추가 납부가 나올 수 있습니다.",
          "성과급이 큰 해에는 연금저축·IRP 납입액을 늘려 세액공제를 채우는 것이 실질적인 대응입니다. 소득이 높은 해일수록 공제의 절세 효과도 커집니다.",
        ],
        callout:
          "<strong>퇴직금에도 영향이 있다</strong> — 정기적으로 지급되는 상여금은 평균임금에 산입되어 퇴직금을 늘립니다. 반면 경영성과에 따라 부정기적으로 지급되는 성과급은 대체로 제외됩니다.",
      },
      {
        h2: "성과급 형태에 따라 과세 방식이 다르다",
        body: [
          "현금 성과급은 근로소득이라 위 표대로 계산됩니다. 하지만 회사가 주는 보상이 늘 현금은 아니고, 형태가 바뀌면 세금 구조도 바뀝니다.",
          "<strong>스톡옵션</strong>은 행사 시점에 행사이익(시가 - 행사가)이 근로소득으로 과세되고, 이후 주식을 팔 때 양도차익에 다시 양도소득세가 붙습니다. 벤처기업 스톡옵션은 연 2억원 한도로 비과세 특례가 적용될 수 있습니다.",
          "<strong>RSU</strong>는 주식이 실제로 귀속되는 시점의 시가가 근로소득이 됩니다. 주가가 오른 뒤 귀속되면 세금도 함께 커지는데, 현금이 아니라 주식으로 받으므로 세금 낼 현금은 따로 준비해야 합니다.",
          "<strong>우리사주</strong>는 출연금에 대해 연 400만원까지 소득공제가 되고 일정 기간 예탁하면 배당소득 비과세 혜택도 있습니다. 다만 주가 하락 위험은 그대로 부담합니다.",
        ],
      },
      {
        h2: "성과급이 건강보험료에 반영되는 시점",
        body: [
          "성과급을 받은 달에는 건강보험료가 즉시 오르지 않습니다. 건강보험료는 전년도 보수를 기준으로 부과되기 때문입니다.",
          "대신 다음 해 <strong>4월 보수총액 정산</strong>에서 한꺼번에 반영됩니다. 성과급이 컸던 해의 다음 4월에는 정산 보험료가 크게 나올 수 있으므로, 성과급을 다 쓰기 전에 이 부담을 계산에 넣어야 합니다.",
          "국민연금은 조금 다릅니다. 기준소득월액이 매년 7월에 갱신되며 상한(월 659만원)이 있어, 이미 상한에 도달한 고소득자는 성과급이 늘어도 연금보험료가 더 오르지 않습니다.",
        ],
      },
    ],
    variants: {
      h2: "함께 확인할 계산기",
      items: [
        { href: "/salary", label: "연봉 실수령액 계산기", note: "기본급 기준 월 실수령" },
        { href: "/year-end-settlement", label: "연말정산 계산기", note: "성과급 반영 후 환급액" },
        { href: "/irp", label: "IRP 세액공제 계산기", note: "성과급 받은 해의 절세" },
      ],
    },
    note: "※ 연간 합산 기준 추정치입니다. 지급 월 원천징수액과 연말정산 확정세액은 지급 방식·부양가족·다른 소득에 따라 달라집니다.",
  };
}

// =========================
// 연차수당 (/annual-leave)
// =========================
function annualLeaveHub() {
  const a = calcAnnualLeavePay({
    monthlySalary: 3_600_000,
    fixedAllowance: 200_000,
    monthsWorked: 24,
    unusedLeaveDays: 5,
  });
  const serviceGrid = [12, 24, 36, 60, 120, 240].map((months) => ({
    months,
    days: getAnnualLeaveDays(months),
  }));

  return {
    h1: "2026 연차 수당 계산기",
    lead: [
      "미사용 연차를 <strong>돈으로 환산하면 얼마인지</strong> 계산합니다. 연차수당은 통상임금을 기준으로 하며, 월 통상임금을 소정근로시간 209시간으로 나눈 시간급에 1일 8시간을 곱해 1일치 수당을 구합니다.",
      `기본 시나리오는 월급 ${won(3_600_000)}에 고정수당 ${won(200_000)}, 근속 24개월, 미사용 5일입니다. 1일 통상임금은 <strong>${won(a.dailyOrdinaryWage)}</strong>이고 발생 연차는 ${a.accruedLeaveDays}일, 미사용 ${a.payableDays}일에 대한 수당은 <strong>${won(a.totalAllowance)}</strong>입니다.`,
    ],
    sections: [
      {
        h2: "기준은 월급이 아니라 통상임금이다",
        body: [
          `연차수당의 기준은 <strong>통상임금</strong>입니다. 기본급에 정기적·일률적으로 지급되는 고정수당(직책수당·기술수당 등)을 더한 금액이며, 시나리오에서는 ${won(a.ordinaryMonthly)}입니다.`,
          "성과급처럼 실적에 따라 변동하는 금액은 통상임금에 들어가지 않습니다. 반대로 매달 같은 금액이 나오는 식대·교통비는 통상임금에 포함된다고 본 판례가 많아, 회사가 이를 빼고 계산했다면 다툼의 여지가 있습니다.",
          `계산식은 <strong>(월 통상임금 ÷ 209) × 8 × 미사용일수</strong>입니다. 209는 주 40시간 근무자의 월 소정근로시간(주 40시간 + 주휴 8시간 × 4.345주)입니다.`,
        ],
      },
      {
        h2: "근속기간별 연차 발생일수",
        table: {
          head: ["근속", "연간 발생 연차", "미사용 시 수당(1일 " + won(a.dailyOrdinaryWage) + " 기준)"],
          rows: serviceGrid.map((g) => ({
            highlight: g.months === 24,
            cells: [
              g.months < 12 ? `${g.months}개월` : `${g.months / 12}년`,
              `${g.days}일`,
              won(g.days * a.dailyOrdinaryWage),
            ],
          })),
        },
        tableNote:
          "1년 미만 근속자는 1개월 개근 시 1일씩 최대 11일이 발생합니다. 1년 이상은 15일에서 시작해 3년째부터 2년마다 1일씩 늘어 최대 25일입니다.",
      },
      {
        h2: "사용촉진제도를 쓰면 수당이 사라진다",
        body: [
          "연차는 발생일로부터 1년간 쓰지 않으면 소멸합니다. 다만 원칙적으로는 소멸해도 <strong>미사용 수당</strong>을 지급해야 합니다.",
          "예외가 연차 사용촉진제도입니다. 회사가 법에서 정한 절차(사용기간 만료 6개월 전 미사용 일수 통보 → 근로자의 사용 시기 지정 → 미지정 시 회사가 시기 지정)를 모두 지키면 수당 지급 의무가 면제됩니다.",
          "절차를 하나라도 빠뜨리면 촉진 효과가 없어 수당을 지급해야 합니다. 구두 통보만으로는 인정되지 않으며 서면 통보가 필요합니다.",
        ],
        callout:
          "<strong>퇴사할 때는 무조건 정산된다</strong> — 사용촉진을 했더라도 퇴사 시점에 남은 연차는 수당으로 지급해야 합니다. 퇴직일로부터 14일 이내에 지급하지 않으면 지연이자가 붙습니다.",
      },
      {
        h2: "회계연도 기준과 입사일 기준이 다르다",
        body: [
          "법이 정한 원칙은 <strong>입사일 기준</strong>입니다. 각자의 입사일마다 1년을 세어 연차가 발생합니다. 그런데 직원이 많은 회사는 관리가 번거로워 <strong>회계연도 기준</strong>(보통 1월 1일)으로 일괄 부여하는 경우가 많습니다.",
          "회계연도 기준 자체는 위법이 아닙니다. 다만 근로자에게 불리해서는 안 되므로, <strong>퇴사 시점에 입사일 기준으로 다시 계산해 더 많은 쪽으로 정산</strong>해야 합니다.",
          "예를 들어 7월에 입사한 사람이 다음 해 12월에 퇴사하면, 회계연도 기준으로는 연차가 적게 잡히지만 입사일 기준으로는 더 많이 발생합니다. 이 차이만큼 수당을 더 받아야 합니다.",
          "퇴사 정산서를 받으면 어느 기준으로 계산됐는지 확인하세요. 회사가 회계연도 기준으로만 정산하고 재계산을 하지 않았다면 차액을 청구할 수 있습니다.",
        ],
        callout:
          "<strong>5인 미만 사업장은 연차가 없다</strong> — 연차유급휴가는 상시 근로자 5인 이상 사업장에만 적용됩니다. 5인 미만이라면 연차도, 미사용 수당도 법적 의무가 아닙니다. 다만 주휴수당은 규모와 무관하게 적용됩니다.",
      },
    ],
    variants: {
      h2: "함께 확인할 계산기",
      items: [
        { href: "/overtime", label: "연장·야간·휴일수당 계산기", note: "같은 통상임금 기준" },
        { href: "/severance-pay", label: "퇴직금 계산기", note: "연차수당은 평균임금에 산입" },
        { href: "/unpaid-wage", label: "임금체불 지연이자 계산기", note: "미지급 시 연 20%" },
      ],
    },
    note: "※ 통상임금 범위와 연차 발생·소멸 여부는 회사 규정과 근로계약에 따라 달라질 수 있습니다.",
  };
}

// =========================
// 연장·야간·휴일수당 (/overtime)
// =========================
function overtimeHub() {
  const monthly = 3_200_000;
  const o = calcOvertimeImpact({
    monthlySalary: monthly,
    monthlyBaseHours: 209,
    overtimeHours: 12,
    nightHours: 6,
    holidayHours: 8,
  });

  return {
    h1: "2026 연장·야간·휴일수당 계산기",
    lead: [
      "초과근무 시간을 유형별로 넣으면 <strong>가산수당의 세전 금액과 세후 실수령</strong>을 계산합니다. 근로기준법은 연장근로와 휴일근로에 통상임금의 50%를, 야간근로(밤 10시~새벽 6시)에 추가로 50%를 가산하도록 정하고 있습니다.",
      `기본 시나리오는 월급 ${won(monthly)}·월 소정근로 209시간에 연장 12시간·야간 6시간·휴일 8시간입니다. 통상시급은 <strong>${won(o.hourlyRate)}</strong>, 가산수당 합계는 세전 ${won(o.totalExtraGross)}, 세후 <strong>${won(o.totalExtraNet)}</strong>입니다.`,
    ],
    sections: [
      {
        h2: "가산율이 유형마다 다르게 붙는다",
        body: [
          "연장근로는 주 40시간을 넘긴 시간으로 <strong>1.5배</strong>(통상임금 100% + 가산 50%)가 지급됩니다. 휴일근로도 8시간까지는 1.5배이며 8시간을 넘으면 2배가 됩니다.",
          "야간근로는 성격이 다릅니다. 밤 10시부터 새벽 6시 사이에 일했다는 사실에 대한 가산이므로 <strong>0.5배</strong>만 추가됩니다. 이미 지급되는 기본급이나 연장수당 위에 얹히는 구조입니다.",
          "따라서 밤 11시에 연장근무를 했다면 연장 1.5배와 야간 0.5배가 겹쳐 2배가 됩니다. 세 유형은 배타적이지 않고 중첩됩니다.",
        ],
      },
      {
        h2: "유형별 가산수당 금액",
        table: {
          head: ["유형", "시간", "가산율", "금액"],
          rows: [
            { cells: ["연장근로", "12시간", "1.5배", won(o.overtimePay)] },
            { cells: ["야간근로", "6시간", "0.5배 추가", won(o.nightPay)] },
            { cells: ["휴일근로", "8시간", "1.5배", won(o.holidayPay)] },
            { cells: ["<strong>세전 합계</strong>", "26시간", "—", `<strong>${won(o.totalExtraGross)}</strong>`], highlight: true },
            { cells: ["<strong>세후 실수령 증가</strong>", "—", "—", `<strong style="color:#047857;">${won(o.totalExtraNet)}</strong>`] },
          ],
        },
        tableNote: `통상시급 ${won(o.hourlyRate)}(월급 ÷ 209) 기준입니다. 세후 금액은 가산수당이 더해진 연봉으로 4대보험과 소득세를 다시 계산해 구한 차액입니다.`,
      },
      {
        h2: "5인 미만 사업장에는 가산수당이 없다",
        body: [
          "상시 근로자 5인 미만 사업장은 근로기준법의 <strong>가산수당 조항이 적용되지 않습니다</strong>. 연장·야간·휴일근로를 해도 가산 없이 시간당 통상임금만 지급하면 법 위반이 아닙니다.",
          "다만 주휴수당과 최저임금, 연차(5인 이상만 해당)는 별개입니다. 주휴수당은 5인 미만에도 적용되므로 혼동하지 마세요.",
          "상시 근로자 수는 단순 인원이 아니라 산정 기간의 연인원을 가동일수로 나눠 판단합니다. 아르바이트·기간제도 포함되므로 5명 언저리라면 정확한 산정이 필요합니다.",
        ],
        callout:
          "<strong>포괄임금제라면</strong> — 계약서에 고정 연장수당이 포함돼 있어도, 실제 근로시간에 따른 법정 수당이 약정액을 넘으면 차액을 청구할 수 있습니다. 포괄임금 약정이 근로자에게 불리하면 무효입니다.",
      },
      {
        h2: "통상시급의 분모가 209가 아닐 수 있다",
        body: [
          "209시간은 <strong>주 40시간 근무자</strong>의 월 소정근로시간입니다. 주 40시간에 주휴 8시간을 더한 48시간에 월 평균 4.345주를 곱한 값입니다.",
          "주 35시간 계약이라면 분모가 209가 아니라 더 작아지고, 그만큼 통상시급은 올라갑니다. 단시간 근로자가 209로 나눠 계산하면 시급이 과소 산정되어 수당을 적게 받게 됩니다.",
          "고정수당이 통상임금에 포함되는지도 분자를 바꿉니다. 정기적·일률적·고정적으로 지급되는 수당은 통상임금에 산입되어야 하므로, 회사가 기본급만으로 통상시급을 계산했다면 다시 따져볼 여지가 있습니다.",
        ],
      },
      {
        h2: "근로시간 기록이 곧 증거다",
        body: [
          "가산수당을 청구하려면 <strong>초과근무를 했다는 사실</strong>을 입증해야 합니다. 회사의 근태 시스템 기록이 가장 확실하지만, 없거나 실제와 다르게 기록됐다면 다른 자료를 모아야 합니다.",
          "출입 기록, 업무용 메신저·이메일 발신 시각, 사내 시스템 로그인 이력, 교통카드 이용 내역, 심지어 본인이 매일 적어 둔 메모도 보조 증거가 됩니다. 여러 자료가 일관되게 같은 시각을 가리키면 인정될 가능성이 높아집니다.",
          "임금채권 소멸시효는 3년입니다. 3년이 지난 초과근무 수당은 청구할 수 없으므로, 다툴 생각이 있다면 시효를 먼저 확인하세요.",
        ],
      },
      {
        h2: "주 52시간 상한과 유연근무제",
        body: [
          "연장근로는 <strong>주 12시간</strong>까지만 허용됩니다. 법정 근로시간 40시간을 더해 주 52시간이 상한이며, 이를 넘기면 근로자가 동의했더라도 사업주가 처벌 대상이 됩니다.",
          "다만 수당 지급 의무는 별개입니다. 상한을 넘겨 일했다면 그 시간에 대해서도 가산수당을 받아야 합니다. 위법한 초과근로였다는 이유로 임금을 주지 않아도 되는 것은 아닙니다.",
          "탄력근로제나 선택근로제를 도입한 사업장은 정산 기간 단위로 평균을 내므로 특정 주에 52시간을 넘어도 위법이 아닐 수 있습니다. 대신 도입에는 근로자대표와의 서면 합의가 필요하고, 합의 없이 운영하는 유연근무제는 효력이 없습니다.",
        ],
      },
    ],
    variants: {
      h2: "함께 확인할 계산기",
      items: [
        { href: "/annual-leave", label: "연차 수당 계산기", note: "같은 통상임금 기준" },
        { href: "/wage-converter", label: "시급 월급 환산기", note: "통상시급 역산" },
        { href: "/salary", label: "연봉 실수령액 계산기", note: "수당 포함 월 실수령" },
      ],
    },
    note: "※ 포괄임금 약정·사업장 규모·대체휴무와 통상임금 산입 범위에 따라 실제 지급액이 달라질 수 있습니다.",
  };
}

// =========================
// 국민연금 예상 수령액 (/pension)
// =========================
function pensionHub() {
  const income = 3_200_000;
  const years = 20;
  const p = calcPensionEstimate({ averageMonthlyIncome: income, insuredYears: years, claimAge: 65 });
  const ageGrid = [60, 62, 65, 68, 70].map((age) => ({
    age,
    ...calcPensionEstimate({ averageMonthlyIncome: income, insuredYears: years, claimAge: age }),
  }));
  const yearGrid = [10, 20, 30, 40].map((y) => ({
    y,
    ...calcPensionEstimate({ averageMonthlyIncome: income, insuredYears: y, claimAge: 65 }),
  }));

  return {
    h1: "2026 국민연금 예상 수령액 계산기",
    lead: [
      "평균 기준소득월액과 가입기간, 청구 나이를 넣으면 <strong>매달 받을 연금액</strong>을 추정합니다. 국민연금은 가입기간이 길수록, 청구를 늦출수록 많아지는 구조라 이 세 변수의 조합이 결과를 좌우합니다.",
      `기본 시나리오는 평균 기준소득월액 ${won(income)}·가입 ${years}년·65세 청구입니다. 예상 연금은 월 <strong>${won(p.estimatedMonthlyPension)}</strong>, 연 ${won(p.estimatedAnnualPension)}이며 재직 중 본인 부담 보험료는 월 ${won(Math.floor(income * RATES_2026.nationalPension.employee))}입니다.`,
    ],
    sections: [
      {
        h2: "연금액을 정하는 세 가지 변수",
        body: [
          "첫째는 <strong>가입기간</strong>입니다. 40년 가입을 기준으로 비례해 계산되므로 20년 가입은 40년의 절반 수준입니다. 최소 10년(120개월)을 채워야 노령연금을 받을 수 있습니다.",
          "둘째는 <strong>평균 기준소득월액</strong>입니다. 다만 전체 가입자 평균소득(A값)이 절반의 비중으로 함께 들어가 소득재분배가 일어납니다. 그래서 고소득자의 수령액이 소득에 정비례해 늘지는 않습니다.",
          "셋째는 <strong>청구 나이</strong>입니다. 정해진 지급개시연령보다 일찍 받으면 1년마다 6%씩 깎이고, 늦추면 1년마다 7.2%씩 늘어납니다.",
        ],
      },
      {
        h2: "청구 나이에 따른 감액과 가산",
        table: {
          head: ["청구 나이", "조정 계수", "월 예상 연금", "65세 대비"],
          rows: ageGrid.map((g) => ({
            highlight: g.age === 65,
            cells: [
              `${g.age}세`,
              `×${g.ageFactor}`,
              `<strong>${won(g.estimatedMonthlyPension)}</strong>`,
              g.age === 65
                ? "기준"
                : `${g.estimatedMonthlyPension > p.estimatedMonthlyPension ? "+" : ""}${won(g.estimatedMonthlyPension - p.estimatedMonthlyPension)}`,
            ],
          })),
        },
        tableNote: `평균 기준소득월액 ${won(income)}·가입 ${years}년 기준입니다. 조기 수령은 한 번 정해지면 평생 감액된 금액을 받으므로 기대여명과 함께 판단해야 합니다.`,
      },
      {
        h2: "가입기간 10년을 채우지 못하면",
        table: {
          head: ["가입기간", "월 예상 연금", "수급 가능 여부"],
          rows: yearGrid.map((g) => ({
            cells: [`${g.y}년`, won(g.estimatedMonthlyPension), g.eligible ? "노령연금 수급" : "반환일시금"],
          })),
        },
        tableNote:
          "가입기간이 10년 미만이면 연금이 아니라 그동안 낸 보험료에 이자를 더한 반환일시금으로 받게 됩니다. 매달 나오는 연금과 비교하면 장기적으로 훨씬 불리합니다.",
        after: [
          "10년에 못 미친다면 <strong>임의계속가입</strong>으로 60세 이후에도 보험료를 내 기간을 채우거나, 과거 납부하지 않은 기간에 대해 <strong>추후납부(추납)</strong>를 신청해 가입기간을 늘릴 수 있습니다.",
          "실직·사업중단으로 보험료를 내지 못한 기간은 납부예외로 처리되는데, 이 기간은 가입기간에 산입되지 않습니다. 추납으로 메우면 그만큼 연금액이 올라갑니다.",
        ],
      },
      {
        h2: "보험료를 내지 않고도 기간을 인정받는 크레딧",
        body: [
          "국가가 가입기간을 얹어 주는 <strong>크레딧 제도</strong>가 세 가지 있습니다. 보험료를 내지 않아도 기간으로 인정되므로 연금액이 늘어납니다.",
          "<strong>출산크레딧</strong>은 둘째 자녀부터 적용됩니다. 둘째는 12개월, 셋째부터는 자녀당 18개월이 추가되며 최대 50개월까지 인정됩니다.",
          "<strong>군복무크레딧</strong>은 병역 의무를 이행한 사람에게 6개월을 더해 줍니다. <strong>실업크레딧</strong>은 구직급여를 받는 동안 보험료의 75%를 국가가 지원해 최대 12개월까지 가입기간으로 인정합니다.",
          "실업크레딧은 본인이 신청해야 합니다. 구직급여를 받는 중이라면 고용센터나 국민연금공단에 함께 신청하는 편이 좋습니다.",
        ],
        callout:
          "<strong>직장가입자와 지역가입자의 차이</strong> — 보험료율 9%는 같지만 직장가입자는 회사가 절반을 부담해 본인은 4.75%만 냅니다. 퇴사 후 지역가입자가 되면 9% 전액을 본인이 부담합니다.",
      },
    ],
    variants: {
      h2: "함께 확인할 계산기",
      items: [
        { href: "/insurance", label: "건보료 역산 계산기", note: "재직 중 보험료 확인" },
        { href: "/irp", label: "IRP 세액공제 계산기", note: "국민연금 외 노후 대비" },
        { href: "/dependent", label: "건보 피부양자 판정기", note: "연금 수령 시 자격 확인" },
      ],
    },
    note: "※ 간이 추정치입니다. 확정 연금액은 실제 가입 이력과 재평가율이 필요하므로 국민연금공단 '내 연금 알아보기'에서 확인하세요.",
  };
}

// =========================
// 월세 세액공제 (/monthly-rent-deduction)
// =========================
function monthlyRentHub() {
  const salary = 48_000_000;
  const rent = 700_000;
  const m = calcMonthlyRentDeduction({ annualSalary: salary, monthlyRent: rent, paidMonths: 12 });
  const grid = [40_000_000, 55_000_000, 70_000_000, 80_000_000, 90_000_000].map((s) => ({
    s,
    ...calcMonthlyRentDeduction({ annualSalary: s, monthlyRent: rent, paidMonths: 12 }),
  }));

  return {
    h1: "2026 월세 세액공제 계산기",
    lead: [
      "1년간 낸 월세 중 <strong>연말정산에서 세금으로 돌려받는 금액</strong>을 계산합니다. 월세액 세액공제는 무주택 세대주가 국민주택규모 이하 주택에 살면서 월세를 냈을 때 적용됩니다.",
      `기본 시나리오는 총급여 ${won(salary)}·월세 ${won(rent)}·12개월 납부입니다. 연간 월세 ${won(m.yearlyRent)} 전액이 공제 대상이 되고 공제율 ${pct(m.deductionRate)}를 적용해 <strong>${won(m.taxCredit)}</strong>을 돌려받습니다.`,
    ],
    sections: [
      {
        h2: "소득공제가 아니라 세액공제다",
        body: [
          "월세액 공제는 <strong>세액공제</strong>입니다. 과세표준을 줄이는 소득공제와 달리 계산이 끝난 세금에서 직접 빼주므로, 연봉이 높든 낮든 같은 금액이 줄어듭니다.",
          "그래서 저연봉 근로자에게 상대적으로 유리합니다. 다만 낼 세금(결정세액)보다 공제액이 크면 초과분은 돌려받지 못합니다. 소득이 아주 적어 결정세액이 0이라면 월세를 아무리 많이 내도 환급은 없습니다.",
          "월세를 현금영수증으로 처리해 신용카드 소득공제를 받는 방법도 있지만, 두 가지를 동시에 받을 수는 없습니다. 대체로 세액공제 쪽이 유리합니다.",
        ],
      },
      {
        h2: "총급여 구간별 공제율과 한도",
        table: {
          head: ["총급여", "공제율", "연 월세 " + won(rent * 12) + " 기준 환급액"],
          rows: grid.map((g) => ({
            highlight: g.s === salary,
            cells: [
              `${won(g.s)} 이하`,
              g.eligible ? pct(g.deductionRate) : "대상 아님",
              g.eligible ? `<strong style="color:#047857;">${won(g.taxCredit)}</strong>` : "0원",
            ],
          })),
        },
        tableNote:
          "공제 대상 월세액 한도는 연 1,000만원입니다. 월세가 84만원을 넘으면 초과분은 공제되지 않습니다. 총급여 8,000만원을 넘으면 공제 대상에서 제외됩니다.",
      },
      {
        h2: "네 가지 요건을 모두 채워야 한다",
        list: [
          "<strong>무주택 세대주</strong> — 과세기간 종료일 기준 본인과 세대원 모두 주택이 없어야 합니다. 세대원이 공제받는 경우 세대주가 주택자금 관련 공제를 받지 않아야 합니다.",
          "<strong>주택 규모·가격</strong> — 국민주택규모(전용 85㎡) 이하이거나 기준시가 4억원 이하여야 합니다. 오피스텔과 고시원도 대상에 포함됩니다.",
          "<strong>주소지 일치</strong> — 임대차계약서의 주소와 주민등록등본상 주소가 같아야 합니다. 전입신고를 하지 않았다면 공제받을 수 없습니다.",
          "<strong>본인 명의 계약·이체</strong> — 임대차계약자가 본인(또는 기본공제 대상 배우자)이어야 하고, 월세를 실제로 이체한 기록이 있어야 합니다.",
        ],
        after: [
          "집주인의 동의는 필요하지 않습니다. 계약서와 이체 내역만 있으면 신청할 수 있고, 집주인에게 통보되는 절차도 없습니다.",
          "요건을 채우고도 신청하지 않았다면 <strong>5년 이내 경정청구</strong>로 돌려받을 수 있습니다. 홈택스에서 지난 연말정산분을 수정 신고하면 됩니다.",
        ],
      },
      {
        h2: "전세라면 적용되는 제도가 다르다",
        body: [
          "월세가 아니라 전세라면 월세액 세액공제 대상이 아닙니다. 대신 <strong>주택임차차입금 원리금 상환액 공제</strong>가 적용됩니다.",
          "전세자금을 대출받아 원리금을 갚고 있다면 상환액의 40%를 소득공제받을 수 있습니다. 주택마련저축 납입액과 합쳐 연 400만원이 한도이며, 무주택 세대주이고 국민주택규모 이하 주택이어야 합니다.",
          "이쪽은 세액공제가 아니라 <strong>소득공제</strong>라 연봉이 높을수록 절세 효과가 큽니다. 월세 공제와 성격이 반대이므로 혼동하지 마세요.",
          "반전세라면 월세분은 월세액 세액공제, 보증금 대출 원리금은 주택임차차입금 공제로 각각 신청할 수 있습니다.",
        ],
        callout:
          "<strong>준비 서류</strong> — 임대차계약서 사본, 주민등록등본, 월세 이체 증빙(계좌이체 내역·무통장입금증) 세 가지면 됩니다. 현금으로 냈다면 증빙이 어려우니 계좌이체로 바꾸는 편이 안전합니다.",
      },
    ],
    variants: {
      h2: "함께 확인할 계산기",
      items: [
        { href: "/year-end-settlement", label: "연말정산 계산기", note: "전체 환급액 시뮬레이션" },
        { href: "/irp", label: "IRP 세액공제 계산기", note: "같은 세액공제 항목" },
        { href: "/salary", label: "연봉 실수령액 계산기", note: "총급여 확인" },
      ],
    },
    note: "※ 무주택·주소 일치·주택 규모 요건을 충족한다는 전제의 추정치이며, 결정세액이 적으면 환급액도 줄어듭니다.",
  };
}

// =========================
// IRP 세액공제 (/irp)
// =========================
function irpHub() {
  const salary = 52_000_000;
  const i = calcIrpTaxCredit({ annualSalary: salary, pensionSavings: 4_000_000, irpContribution: 3_000_000 });
  const maxLow = calcIrpTaxCredit({ annualSalary: 50_000_000, pensionSavings: 6_000_000, irpContribution: 3_000_000 });
  const maxHigh = calcIrpTaxCredit({ annualSalary: 60_000_000, pensionSavings: 6_000_000, irpContribution: 3_000_000 });

  return {
    h1: "2026 IRP 세액공제 계산기",
    lead: [
      "연금저축과 IRP에 넣은 돈으로 <strong>연말정산에서 얼마를 돌려받는지</strong> 계산합니다. 연금계좌 세액공제는 노후 대비를 유도하기 위한 제도로, 근로자가 연말에 가장 확실하게 늘릴 수 있는 환급 항목입니다.",
      `기본 시나리오는 총급여 ${won(salary)}·연금저축 ${won(4_000_000)}·IRP ${won(3_000_000)}입니다. 인정 납입액 ${won(i.recognizedContribution)}에 공제율 ${pct(i.taxCreditRate)}를 적용해 <strong>${won(i.taxCredit)}</strong>을 돌려받습니다.`,
    ],
    sections: [
      {
        h2: "한도가 두 겹으로 걸린다",
        body: [
          "연금계좌 세액공제에는 한도가 두 개 있습니다. <strong>연금저축은 연 600만원</strong>까지, <strong>연금저축과 IRP를 합쳐 연 900만원</strong>까지입니다.",
          "즉 연금저축에만 900만원을 넣어도 600만원까지만 인정되고, 나머지 300만원은 IRP에 넣어야 채울 수 있습니다. 반대로 IRP에만 900만원을 넣으면 전액 인정됩니다.",
          `시나리오에서는 연금저축 ${won(i.recognizedPensionSavings)}과 IRP ${won(i.recognizedIrp)}이 인정되어 합계 ${won(i.recognizedContribution)}입니다. 900만원 한도까지 ${won(9_000_000 - i.recognizedContribution)}이 남아 있어, 연말에 IRP로 더 넣으면 공제를 더 받을 수 있습니다.`,
        ],
      },
      {
        h2: "총급여 5,500만원에서 공제율이 갈린다",
        table: {
          head: ["총급여", "공제율(지방소득세 포함)", "900만원 최대 납입 시 환급액"],
          rows: [
            {
              highlight: true,
              cells: [`${won(55_000_000)} 이하`, `${pct(maxLow.taxCreditRate)} (16.5%)`, `<strong style="color:#047857;">${won(maxLow.taxCredit)}</strong>`],
            },
            {
              cells: [`${won(55_000_000)} 초과`, `${pct(maxHigh.taxCreditRate)} (13.2%)`, `<strong>${won(maxHigh.taxCredit)}</strong>`],
            },
          ],
        },
        tableNote:
          "표의 공제율은 소득세분 기준이며 괄호는 지방소득세 10%를 더한 실제 체감 환급률입니다. 총급여 5,500만원을 경계로 같은 900만원을 넣어도 환급액이 달라집니다.",
      },
      {
        h2: "한도를 넘겨 넣으면 어떻게 되나",
        body: [
          "한도 초과분은 세액공제를 받지 못하지만 계좌에서 빠져나가지는 않습니다. 다음 해로 <strong>이월</strong>해 공제받을 수 있으므로, 초과 납입 자체가 손해는 아닙니다.",
          "다만 연금계좌는 만 55세 이후 연금으로 받는 것을 전제로 세제 혜택을 줍니다. 중도에 해지하면 그동안 공제받은 금액에 대해 <strong>기타소득세 16.5%</strong>를 물어내야 합니다.",
          "공제를 받지 않은 원금은 해지해도 과세되지 않습니다. 그래서 급전이 필요할 때는 공제받지 않은 부분만 인출하는 방식이 유리하며, IRP는 일부 인출이 제한되므로 연금저축보다 유연성이 낮습니다.",
        ],
        callout:
          "<strong>연말에 가장 확실한 절세</strong> — 12월 31일까지 납입한 금액이 그해 공제 대상입니다. 다른 공제 항목과 달리 지출 없이 내 계좌로 옮기기만 하면 되므로, 결정세액이 남아 있다면 한도까지 채우는 편이 유리합니다.",
      },
      {
        h2: "퇴직금을 IRP로 받으면 세금이 미뤄진다",
        body: [
          "퇴직급여는 원칙적으로 <strong>IRP 계좌로 받아야</strong> 합니다. 55세 이상이거나 금액이 소액인 경우를 빼면 현금으로 직접 받을 수 없습니다.",
          "IRP로 받으면 퇴직소득세를 그 시점에 떼지 않고 <strong>이연</strong>합니다. 세금으로 나갈 돈까지 계좌 안에서 운용되므로 복리 효과가 커집니다.",
          "이후 만 55세 이후에 <strong>연금 형태로</strong> 나눠 받으면 이연된 퇴직소득세의 30%가 감면되고, 수령 11년째부터는 40%가 감면됩니다. 반대로 중간에 일시금으로 찾으면 이연된 세금을 그대로 내야 합니다.",
          "주의할 점은 계좌가 섞인다는 것입니다. 퇴직금이 들어온 IRP에 개인 납입금을 함께 넣으면 인출 시 순서와 과세 방식이 복잡해지므로, 세액공제용 계좌와 퇴직금 계좌를 나누는 편이 관리하기 쉽습니다.",
        ],
      },
      {
        h2: "연금저축과 IRP는 무엇이 다른가",
        table: {
          head: ["구분", "연금저축", "IRP"],
          rows: [
            { cells: ["가입 자격", "누구나", "소득이 있는 사람"] },
            { cells: ["세액공제 한도", `연 ${won(6_000_000)}`, `연금저축과 합산 ${won(9_000_000)}`] },
            { cells: ["위험자산 투자", "제한 없음", "적립금의 70%까지"] },
            { cells: ["중도 인출", "비교적 자유로움", "법정 사유만 가능"] },
            { cells: ["퇴직금 수령", "불가", "가능"] },
          ],
        },
        tableNote:
          "IRP는 예금·채권 같은 안전자산을 30% 이상 담아야 하는 규제가 있어 주식형 비중을 100%로 채울 수 없습니다. 공격적으로 운용하려면 연금저축 600만원을 먼저 채우고 나머지를 IRP에 넣는 순서가 유리합니다.",
        after: [
          "중도 인출도 IRP가 더 엄격합니다. 무주택자의 주택 구입, 6개월 이상 요양, 개인회생·파산 같은 법정 사유가 아니면 계좌를 해지해야만 돈을 꺼낼 수 있습니다.",
        ],
      },
    ],
    variants: {
      h2: "함께 확인할 계산기",
      items: [
        { href: "/year-end-settlement", label: "연말정산 계산기", note: "전체 환급액 확인" },
        { href: "/monthly-rent-deduction", label: "월세 세액공제 계산기", note: "같은 세액공제 항목" },
        { href: "/pension", label: "국민연금 예상 수령액", note: "공적연금과 합산 설계" },
      ],
    },
    note: "※ 실제 환급액은 결정세액 범위 내에서 지급되며, 중도해지·연금 외 수령 시 세제 혜택이 회수될 수 있습니다.",
  };
}

// =========================
// 사업주 4대보험 (/4-insurance-employer)
// =========================
function employerInsuranceHub() {
  const monthly = 3_200_000;
  const e = calcEmployerInsuranceBurden({
    monthlySalary: monthly,
    employmentRatePercent: 0.9,
    accidentRatePercent: 1.5,
  });
  const grid = [2_500_000, 3_200_000, 4_000_000, 5_000_000, 7_000_000].map((s) => ({
    s,
    ...calcEmployerInsuranceBurden({ monthlySalary: s, employmentRatePercent: 0.9, accidentRatePercent: 1.5 }),
  }));

  return {
    h1: "2026 사업주 4대보험 계산기",
    lead: [
      "직원 한 명을 채용할 때 <strong>월급 외에 회사가 더 부담하는 금액</strong>을 계산합니다. 4대보험은 근로자와 사업주가 나눠 내는데, 산재보험은 전액 사업주 부담이라 총 인건비는 월급보다 눈에 띄게 커집니다.",
      `기본 시나리오는 월급 ${won(monthly)}·고용보험 0.9%·산재보험 1.5%입니다. 사업주 부담은 월 <strong>${won(e.totalMonthlyBurden)}</strong>, 연 ${won(e.totalAnnualBurden)}으로 월급의 <strong>${pct(e.employerRate)}</strong>에 해당합니다.`,
    ],
    sections: [
      {
        h2: "직원 1명의 실제 인건비는 월급의 111%다",
        body: [
          `월급 ${won(monthly)}인 직원의 실제 월 인건비는 ${won(monthly + e.totalMonthlyBurden)}입니다. 채용 예산을 월급 기준으로만 잡으면 연간 ${won(e.totalAnnualBurden)}이 예산에서 빠지게 됩니다.`,
          "여기에 퇴직급여 적립분이 더해집니다. 1년 이상 근속하면 1년당 30일분 평균임금을 지급해야 하므로 월급의 약 8.3%를 추가로 잡아야 실제 부담에 가깝습니다.",
          "연차수당, 4대보험 정산분, 채용·교육 비용까지 넣으면 실질 부담은 월급의 120%를 넘는 경우가 많습니다.",
        ],
      },
      {
        h2: "사업주 부담 항목별 금액",
        table: {
          head: ["항목", "요율(사업주)", "월 부담액"],
          rows: [
            { cells: ["국민연금", pct(RATES_2026.nationalPension.employer, 2), won(e.nationalPension)] },
            { cells: ["건강보험", pct(RATES_2026.healthInsurance.employer, 3), won(e.healthInsurance)] },
            { cells: ["장기요양보험", "건보료의 13.14%", won(e.longTermCare)] },
            { cells: ["고용보험", "0.9%", won(e.employmentInsurance)] },
            { cells: ["산재보험", "1.5% (업종별 상이)", won(e.industrialAccident)] },
            { cells: ["<strong>합계</strong>", `<strong>${pct(e.employerRate)}</strong>`, `<strong style="color:#dc2626;">${won(e.totalMonthlyBurden)}</strong>`], highlight: true },
          ],
        },
        tableNote:
          "산재보험은 전액 사업주 부담입니다. 고용보험은 실업급여분(근로자와 折半)에 더해 고용안정·직업능력개발사업분이 사업장 규모에 따라 0.25~0.85% 추가됩니다.",
      },
      {
        h2: "월급별 총 인건비",
        table: {
          head: ["직원 월급", "사업주 부담", "실제 월 인건비", "연간 총액"],
          rows: grid.map((g) => ({
            highlight: g.s === monthly,
            cells: [won(g.s), won(g.totalMonthlyBurden), `<strong>${won(g.s + g.totalMonthlyBurden)}</strong>`, won((g.s + g.totalMonthlyBurden) * 12)],
          })),
        },
        tableNote: `국민연금은 기준소득월액 상한 ${won(RATES_2026.nationalPension.maxMonthlyIncome)}에서 멈추므로, 고액 급여일수록 사업주 부담 비율이 조금씩 낮아집니다.`,
      },
      {
        h2: "두루누리 지원으로 줄일 수 있는 구간",
        body: [
          "근로자 10명 미만 사업장에서 월 보수가 일정 기준 미만인 근로자를 고용하면 <strong>두루누리 사회보험료 지원</strong>으로 국민연금과 고용보험료의 최대 80%를 지원받을 수 있습니다.",
          "신규 가입자를 대상으로 하며 지원 기간에 제한이 있습니다. 기존에 가입돼 있던 근로자는 대체로 대상이 아니므로, 채용 시점에 확인해야 실익이 있습니다.",
          "이 외에도 청년 채용 관련 고용장려금, 일자리 안정자금 성격의 지원 사업이 연도별로 운영됩니다. 고용노동부 고용보험 홈페이지에서 현재 시행 중인 제도를 확인하세요.",
        ],
      },
      {
        h2: "취득 신고를 늦추면 과태료가 붙는다",
        body: [
          "직원을 채용하면 4대보험 <strong>자격취득 신고</strong>를 해야 합니다. 국민연금·건강보험은 입사일이 속한 달의 다음 달 15일까지, 고용·산재보험은 다음 달 15일까지가 기한입니다.",
          "기한을 넘기면 과태료가 부과되고, 소급 적용된 보험료를 한꺼번에 내야 합니다. 특히 산재보험은 미가입 상태에서 사고가 나면 급여액의 상당 부분을 사업주가 물어내야 하므로 위험이 큽니다.",
          "4대보험 신고는 근로복지공단·건강보험공단 EDI나 '4대사회보험 정보연계센터'에서 한 번에 처리할 수 있습니다. 퇴사 시 상실 신고도 같은 기한이 적용됩니다.",
        ],
      },
    ],
    variants: {
      h2: "함께 확인할 계산기",
      items: [
        { href: "/insurance", label: "건보료 역산 계산기", note: "근로자 부담분 확인" },
        { href: "/salary", label: "연봉 실수령액 계산기", note: "직원이 받는 실수령액" },
        { href: "/severance-pay", label: "퇴직금 계산기", note: "퇴직급여 적립 부담" },
      ],
    },
    note: "※ 산재보험료율은 업종별로 크게 다르며(0.7%~18% 이상), 고용보험 고용안정·직업능력개발 부담분과 보수총액 정산은 포함하지 않았습니다.",
  };
}

// =========================
// 프리랜서 세후 단가 역산 (/freelance-rate)
// =========================
function freelanceRateHub() {
  const target = 4_000_000;
  const f = calcFreelanceRate({ targetMonthlyNet: target, workDaysMonthly: 18, billableHoursDaily: 6 });
  const grid = [3_000_000, 4_000_000, 5_000_000, 7_000_000].map((t) => ({
    t,
    ...calcFreelanceRate({ targetMonthlyNet: t, workDaysMonthly: 18, billableHoursDaily: 6 }),
  }));
  const naive = Math.floor(target / (1 - 0.033));

  return {
    h1: "2026 프리랜서 세후 단가 역산 계산기",
    lead: [
      "손에 남길 금액을 정하고 <strong>거꾸로 청구 단가를 구합니다</strong>. 프리랜서 견적은 보통 '얼마 받고 싶다'에서 출발하는데, 3.3% 원천징수와 5월 종합소득세를 빼고 나면 실제로 남는 돈은 청구액과 상당히 다릅니다.",
      `기본 시나리오는 목표 월 실수령 ${won(target)}·월 18일·일 6시간 청구입니다. 필요한 연 청구액은 <strong>${won(f.annualGross)}</strong>, 월 ${won(f.monthlyGross)}, 일 단가 ${won(f.dailyRate)}, 시급 <strong>${won(f.hourlyRate)}</strong>입니다.`,
    ],
    sections: [
      {
        h2: "3.3%만 빼고 계산하면 부족해진다",
        body: [
          `가장 흔한 실수는 목표 실수령을 0.967로 나누는 것입니다. 시나리오에서 그렇게 계산하면 월 ${won(naive)}이 나오지만, 실제 필요액은 ${won(f.monthlyGross)}으로 월 <strong>${won(f.monthlyGross - naive)}</strong>이 모자랍니다.`,
          "3.3%는 확정 세금이 아니라 선납금이기 때문입니다. 종합소득세는 누진세율이라 수입이 커질수록 실효세율이 3.3%를 넘어서고, 그 차액은 5월에 추가로 납부해야 합니다.",
          `시나리오의 연 청구액 ${won(f.annualGross)}에 대한 확정세액은 ${won(f.tax.totalTax)}이고, 3.3% 기납부액은 ${won(f.tax.withholdingPrepaid)}입니다. 차액 ${won(Math.abs(f.tax.refund))}을 5월에 더 내야 합니다.`,
        ],
      },
      {
        h2: "목표 실수령별 필요 청구 단가",
        table: {
          head: ["목표 월 실수령", "필요 월 청구액", "일 단가(월 18일)", "시급(일 6시간)"],
          rows: grid.map((g) => ({
            highlight: g.t === target,
            cells: [won(g.t), `<strong>${won(g.monthlyGross)}</strong>`, won(g.dailyRate), `<strong style="color:#047857;">${won(g.hourlyRate)}</strong>`],
          })),
        },
        tableNote:
          "인적용역 단순경비율과 기본공제 1인을 적용한 추정입니다. 목표 실수령이 커질수록 필요 청구액의 증가폭이 더 가팔라지는 것은 누진세율 때문입니다.",
      },
      {
        h2: "견적에 반드시 포함시켜야 할 비용",
        list: [
          "<strong>비청구 시간</strong> — 영업·미팅·견적서 작성·정산은 청구되지 않습니다. 실제 청구 가능 시간이 근무시간의 60~70%라면 시급을 그만큼 올려 잡아야 합니다.",
          "<strong>공백 기간</strong> — 프로젝트 사이의 비가동 기간에는 수입이 0입니다. 연 10개월 가동을 가정하면 청구 단가에 20%를 더해야 12개월치가 됩니다.",
          "<strong>건강보험·국민연금</strong> — 지역가입자는 회사 부담분이 없어 전액 본인이 냅니다. 국민연금은 신고 소득의 9%로 직장가입자의 두 배입니다.",
          "<strong>유급휴가·상병</strong> — 아프거나 쉬는 날에도 수입이 없습니다. 직장인의 연차·병가에 해당하는 몫을 단가에 반영해야 합니다.",
          "<strong>장비·소프트웨어</strong> — 노트북, 라이선스, 사무공간은 본인 부담입니다. 필요경비로 인정되면 세금은 줄지만 현금은 먼저 나갑니다.",
        ],
        after: [
          "이 항목들을 모두 반영하면, 같은 실수령을 목표로 할 때 프리랜서 단가는 직장인 연봉을 단순히 12로 나눈 금액보다 훨씬 높아야 합니다. 표의 시급은 세금만 반영한 <strong>최소선</strong>으로 보는 편이 안전합니다.",
        ],
      },
      {
        h2: "단가만큼 중요한 계약 조항",
        body: [
          "단가를 잘 받아도 대금을 늦게 받거나 무한정 수정 요청을 받으면 실질 시급은 떨어집니다. 계약서에 아래 항목이 있는지 확인하세요.",
        ],
        list: [
          "<strong>지급 기한</strong> — 납품 후 며칠 이내에 지급하는지. 기한이 없으면 대금이 몇 달씩 밀려도 다투기 어렵습니다.",
          "<strong>수정 횟수와 범위</strong> — 무상 수정 몇 회까지인지, 그 이상은 어떻게 정산하는지. 이 조항이 없으면 실질 단가가 절반이 되기도 합니다.",
          "<strong>과업 범위</strong> — 무엇이 포함되고 무엇이 추가 비용인지. 범위가 모호하면 요구가 계속 늘어납니다.",
          "<strong>저작권 귀속</strong> — 작업물의 권리가 누구에게 가는지, 포트폴리오 사용이 가능한지.",
          "<strong>중도 해지</strong> — 프로젝트가 중단됐을 때 진행분에 대한 대금을 어떻게 정산하는지.",
        ],
        after: [
          "대금을 받지 못했다면 프리랜서도 구제 수단이 있습니다. 근로자로 인정되는 경우라면 고용노동부 진정이 가능하고, 사업자 간 거래라면 지급명령이나 소액사건 심판으로 비교적 빠르게 진행할 수 있습니다.",
        ],
      },
    ],
    variants: {
      h2: "함께 확인할 계산기",
      items: [
        { href: "/freelancer", label: "프리랜서 세금 계산기", note: "수입 기준 세액 확인" },
        { href: "/comprehensive-tax", label: "종합소득세 계산기", note: "5월 신고 금액" },
        { href: "/regional-health", label: "지역가입자 건보료 계산기", note: "프리랜서 건강보험" },
      ],
    },
    note: "※ 단순경비율 적용 인적용역 기준 추정치입니다. 실제 필요경비·다른 소득·부양가족·부가가치세와 사업 형태에 따라 확정 세액이 달라집니다.",
  };
}

// =========================
// 전체 계산기 (/all)
// =========================
const ALL_GROUPS = [
  {
    h2: "급여·연봉을 확인할 때",
    intro: "지금 받는 돈이 맞는지, 제안받은 조건이 실제로 얼마인지 확인하는 계산기입니다.",
    items: [
      ["/salary", "연봉 실수령액 계산기", "세전 연봉을 넣으면 4대보험·소득세를 뺀 월 실수령액이 나옵니다."],
      ["/insurance", "건보료 역산 계산기", "급여명세서의 건강보험료로 세전 연봉을 거꾸로 추정합니다."],
      ["/withholding", "원천세 계산기", "명세서의 소득세 한 줄만으로 연봉 구간을 좁힙니다."],
      ["/compare", "이직 연봉 비교", "두 연봉을 나란히 놓고 월 실수령 차이를 봅니다."],
      ["/raise", "연봉 인상률 계산기", "인상률이 월급에서 몇 원인지 환산합니다."],
      ["/bonus", "성과급 실수령 계산기", "성과급에서 세금·보험료를 뺀 금액을 구합니다."],
      ["/wage-converter", "시급 월급 환산기", "시급을 일급·주급·월급·연봉으로 바꿉니다."],
    ],
  },
  {
    h2: "세금·환급을 계산할 때",
    intro: "5월 종합소득세와 2월 연말정산에서 낼 돈과 돌려받을 돈을 미리 확인합니다.",
    items: [
      ["/year-end-settlement", "연말정산 계산기", "연봉과 공제 항목으로 예상 환급액을 시뮬레이션합니다."],
      ["/comprehensive-tax", "종합소득세 계산기", "사업·프리랜서 소득의 5월 신고 세액을 계산합니다."],
      ["/freelancer", "프리랜서 세금 계산기", "3.3% 원천징수 후 환급인지 추가 납부인지 판단합니다."],
      ["/freelance-rate", "세후 단가 역산 계산기", "목표 실수령에서 거꾸로 청구 단가를 구합니다."],
      ["/monthly-rent-deduction", "월세 세액공제 계산기", "1년치 월세로 돌려받을 세금을 계산합니다."],
      ["/irp", "IRP 세액공제 계산기", "연금저축·IRP 납입액의 절세 효과를 봅니다."],
    ],
  },
  {
    h2: "퇴사·이직을 준비할 때",
    intro: "그만두기 전에 확보되는 돈과 이후 부담이 얼마인지 계산합니다.",
    items: [
      ["/quit", "퇴사 계산기", "퇴직금·실업급여·버틸 수 있는 개월 수를 한 번에 봅니다."],
      ["/severance-pay", "퇴직금 계산기", "근속연수로 퇴직금과 퇴직소득세를 계산합니다."],
      ["/unemployment", "실업급여 계산기", "구직급여 일 수급액과 총 수급액을 확인합니다."],
      ["/regional-health", "지역가입자 건보료 계산기", "퇴사 후 건강보험료와 임의계속가입을 비교합니다."],
      ["/dependent", "건보 피부양자 판정기", "소득·재산 기준으로 피부양자 자격을 판정합니다."],
    ],
  },
  {
    h2: "수당·근로조건을 따질 때",
    intro: "법정 수당이 제대로 지급됐는지 확인하고, 못 받은 돈을 계산합니다.",
    items: [
      ["/weekly-holiday-pay", "주휴수당 계산기", "주 15시간 이상 근무 시 발생하는 주휴수당을 계산합니다."],
      ["/overtime", "연장·야간·휴일수당 계산기", "초과근무 시간에 가산율을 적용해 수당을 구합니다."],
      ["/annual-leave", "연차 수당 계산기", "미사용 연차를 통상임금 기준으로 환산합니다."],
      ["/unpaid-wage", "임금체불 지연이자 계산기", "밀린 임금에 붙는 연 20% 지연이자를 계산합니다."],
      ["/4-insurance-employer", "사업주 4대보험 계산기", "직원 1인당 회사가 부담하는 금액을 계산합니다."],
    ],
  },
  {
    h2: "지원금·연금을 확인할 때",
    intro: "받을 수 있는 급여와 장려금, 노후 연금액을 확인합니다.",
    items: [
      ["/eitc", "근로장려금·자녀장려금 계산기", "가구 유형과 총급여로 예상 지급액을 계산합니다."],
      ["/parental-leave", "육아휴직 급여 계산기", "12개월 육아휴직 동안 받을 급여를 계산합니다."],
      ["/pension", "국민연금 예상 수령액", "가입기간과 청구 나이로 월 연금액을 추정합니다."],
    ],
  },
];

function allHub() {
  const total = ALL_GROUPS.reduce((sum, g) => sum + g.items.length, 0);

  return {
    h1: "2026 세금·연봉·수당 계산기 모음",
    lead: [
      `연봉 실수령액부터 퇴직금·실업급여·근로장려금까지 <strong>${total}개 계산기</strong>를 상황별로 모았습니다. 모두 2026년 개정 세율·요율(국민연금 4.75%·건강보험 3.595%·최저시급 ${won(10_320)})을 반영하며, 별도 가입이나 앱 설치 없이 바로 쓸 수 있습니다.`,
      "아래는 <strong>어떤 상황에서 어느 계산기를 여는지</strong>를 기준으로 묶은 목록입니다. 각 항목에 무엇을 넣으면 무엇이 나오는지 적어 두었으니, 지금 궁금한 것에 가장 가까운 줄을 고르면 됩니다.",
    ],
    sections: [
      ...ALL_GROUPS.map((group) => ({
        h2: group.h2,
        body: group.intro,
        list: group.items.map(
          ([href, label, what]) => `<a href="/finance${href}">${label}</a> — ${what}`,
        ),
      })),
      {
        h2: "모든 계산기가 공유하는 2026년 기준",
        body: [
          `계산기마다 다루는 주제는 달라도 기준이 되는 요율은 하나입니다. 국민연금 근로자 부담 <strong>4.75%</strong>(기준소득월액 ${won(410_000)}~${won(RATES_2026.nationalPension.maxMonthlyIncome)}, 2026.7.1 시행), 건강보험 <strong>3.595%</strong>, 장기요양보험은 건강보험료의 13.14%, 고용보험 0.9%를 적용합니다.`,
          `소득세는 6~45% 8구간 누진세율에 지방소득세 10%를 더해 계산하고, 최저시급 <strong>${won(10_320)}</strong>은 주휴수당·시급 환산 계산기에 그대로 반영됩니다.`,
          "요율이 바뀌면 계산기와 안내 문구를 함께 갱신합니다. 각 계산기 하단에는 적용한 기준과 공식 출처를 표시해 두었으니, 최종 신고나 급여 정산 전에는 원문 고시와 교차 확인하세요.",
        ],
      },
    ],
    variants: {
      h2: "상황별 가이드로 시작하기",
      lead: "여러 계산기를 순서대로 써야 하는 상황이라면 가이드가 빠릅니다.",
      items: [
        { href: "/guide/job-change", label: "이직 준비 가이드", note: "연봉 비교 → 실수령 → 보험료 변화" },
        { href: "/guide/resignation", label: "퇴사 준비 가이드", note: "퇴직금 → 실업급여 → 건강보험" },
        { href: "/guide/year-end", label: "연말정산 가이드", note: "환급액 → 공제 항목 점검" },
        { href: "/guide/part-time", label: "아르바이트 가이드", note: "주휴수당 → 시급 환산 → 장려금" },
      ],
    },
    note: "※ 모든 계산기는 2026년 공식 세율·요율 기반 추정치를 제공하며 법적 효력이 없는 참고용입니다. 최종 신고·급여 정산 전에는 관계 기관과 회사 기준을 확인하세요.",
  };
}

export const TOOL_HUB_PAGES = {
  "/raise": raiseHub,
  "/bonus": bonusHub,
  "/annual-leave": annualLeaveHub,
  "/overtime": overtimeHub,
  "/pension": pensionHub,
  "/monthly-rent-deduction": monthlyRentHub,
  "/irp": irpHub,
  "/4-insurance-employer": employerInsuranceHub,
  "/freelance-rate": freelanceRateHub,
  "/all": allHub,
};
