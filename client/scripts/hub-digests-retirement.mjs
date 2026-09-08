// Cross-band digests for /irp and /dependent (Tier 3 promotion).
//
// Neither route has amount variants, so there was no prose to promote. Each section below scans
// its calculator's engine across a realistic input range and writes down what only the scan can
// show: where the binding constraint switches from the statutory limit to the taxpayer's own tax
// bill, where earning more leaves you with less, where a rule stated in one unit (사업소득금액,
// 재산세 과세표준) has to be converted before anyone can check it against their own paperwork.
//
// Comments stay ASCII - scripts/ feeds font-subset-config.mjs.
// Never write "자주 묻는" here: prerender.mjs skips its FAQ append when the body already has it,
// and both of these routes carry ROUTE_FAQS.

import {
  calcIrpTaxCredit,
  calcPensionEstimate,
  calculateSalaryBreakdown,
  formatManWonValue,
  formatPercent,
  formatWon,
  PENSION_AGE_FACTORS,
  RATES_2026,
  regionalHealthEstimate,
  severanceIncomeTax,
  SIMPLE_EXPENSE_RATE_BASE,
} from "./calc-engine.mjs";
import { DEPENDENT_INCOME_CEILING } from "./hub-digests.mjs";

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
// /irp - the limit that binds is usually not the statutory one
// =========================

const PENSION_SAVINGS_CAP = 6_000_000;
const COMBINED_CAP = 9_000_000;
const LOW_RATE = 0.165;
const HIGH_RATE = 0.132;
const CLAWBACK_RATE = 0.165;

// withLocal is the engine's taxCreditWithLocalTax under a shorter local name. It is NOT the
// statutory credit: taxCredit is the amount subtracted from income tax, withLocal is what the
// taxpayer actually stops paying once the local income tax falls with it. Prose here must say
// which one it means every time - "공제 대상 금액" for this figure was wrong, because the amount
// eligible for the credit is the 900만원 contribution, not the resulting saving.
const creditOf = (annualSalary, pensionSavings, irpContribution) => {
  const result = calcIrpTaxCredit({ annualSalary, pensionSavings, irpContribution });
  return { ...result, withLocal: result.taxCreditWithLocalTax };
};

// The salary at which the assessed tax finally covers the full credit. Below it the statutory
// 900만원 limit is not what caps the refund - the taxpayer's own tax bill is.
function salaryAbsorbing(creditAmount) {
  for (let manWonValue = 2_000; manWonValue <= 9_000; manWonValue += 10) {
    if (salaryOf(manWonValue * 10_000).determinedTax >= creditAmount) return manWonValue;
  }
  return null;
}

const IRP_SALARY_GRID = [2_000, 2_500, 3_000, 3_500, 4_000, 5_000, 7_000];

export function irpBindingLimitDigest() {
  const maxCredit = creditOf(50_000_000, PENSION_SAVINGS_CAP, 3_000_000).withLocal;
  const highCredit = creditOf(60_000_000, PENSION_SAVINGS_CAP, 3_000_000).withLocal;
  const absorbLow = salaryAbsorbing(maxCredit);
  const absorbHigh = salaryAbsorbing(highCredit);
  const rows = IRP_SALARY_GRID.map((amount) => {
    const gross = amount * 10_000;
    const scenario = creditOf(gross, PENSION_SAVINGS_CAP, 3_000_000);
    const determined = salaryOf(gross).determinedTax;
    return {
      amount,
      determined,
      incomeTaxCredit: scenario.taxCredit,
      credit: scenario.withLocal,
      actual: Math.min(determined, scenario.withLocal),
      wasted: Math.max(0, scenario.withLocal - determined),
    };
  });
  const worst = rows[0];

  return {
    h2: `한도 ${won(COMBINED_CAP)}을 다 채워도 연봉 ${manWon(absorbLow)} 아래에서는 전액을 돌려받지 못한다`,
    body: [
      `연금계좌 세액공제는 산출세액에서 직접 빼는 방식이라 <strong>결정세액을 넘을 수 없습니다</strong>. 그래서 실제로 돌려받는 금액을 정하는 것은 한도 ${won(COMBINED_CAP)}이 아니라 그 사람이 그해 낸 세금입니다. 아래는 연금저축 ${won(PENSION_SAVINGS_CAP)}·IRP ${won(3_000_000)}을 넣어 한도를 꽉 채운 상태에서 부양가족 1인·비과세 식대 월 ${won(200_000)} 기준으로 연봉만 바꿔 본 결과입니다.`,
    ],
    blocks: [
      {
        h3: `연봉 ${manWon(worst.amount)}이면 ${won(worst.wasted)}이 그냥 사라진다`,
        body: [
          `한도를 다 채우면 지방소득세를 포함한 절세 총액은 ${won(worst.credit)}(소득세 세액공제 ${won(worst.incomeTaxCredit)} + 지방소득세 감소분 ${won(worst.credit - worst.incomeTaxCredit)})이지만, 연봉 ${manWon(worst.amount)}의 결정세액은 ${won(worst.determined)}뿐입니다. 그래서 실제 환급은 ${won(worst.actual)}에서 멈추고 ${won(worst.wasted)}은 돌려받지 못합니다. 세액공제는 소득공제와 달리 <strong>남는 금액을 다음 해로 넘겨주지 않으므로</strong>, 이 돈은 그해에 그대로 없어집니다.`,
        ],
      },
      {
        h3: `그 손실이 0이 되는 지점은 연봉 ${manWon(absorbLow)}이다`,
        body: [
          `연봉을 10만원 단위로 훑으면 결정세액이 지방소득세 포함 절세액 ${won(maxCredit)}을 처음 넘어서는 지점이 ${manWon(absorbLow)}입니다. 공제율이 ${pct(HIGH_RATE, 1)}로 내려가는 총급여 ${won(55_000_000)} 초과 구간에서는 필요한 결정세액이 ${won(highCredit)}으로 줄어 ${manWon(absorbHigh)}부터 전액을 흡수합니다. 즉 연봉 ${manWon(absorbLow)} 미만인 사람에게 "한도까지 채우라"는 조언은 <strong>그 사람에게는 틀린 조언</strong>이고, 결정세액을 먼저 확인한 뒤 그만큼만 넣는 편이 낫습니다.`,
        ],
      },
      {
        h3: `같은 ${won(COMBINED_CAP)}이라도 배분에 따라 환급이 ${won(maxCredit - creditOf(50_000_000, COMBINED_CAP, 0).withLocal)} 갈린다`,
        body: [
          `연금저축은 연 ${won(PENSION_SAVINGS_CAP)}까지만 인정되므로, ${won(COMBINED_CAP)}을 연금저축 한 계좌에 넣으면 ${won(creditOf(50_000_000, COMBINED_CAP, 0).recognizedContribution)}만 인정되어 지방소득세 포함 절세액이 ${won(creditOf(50_000_000, COMBINED_CAP, 0).withLocal)}에 그치고 ${won(3_000_000)}이 공제 대상에서 빠집니다. 반대로 IRP 한 계좌에 ${won(COMBINED_CAP)}을 넣으면 전액 인정되어 지방소득세 포함 ${won(maxCredit)}입니다. 넣은 돈이 같아도 계좌를 어디에 열었느냐가 ${won(maxCredit - creditOf(50_000_000, COMBINED_CAP, 0).withLocal)}을 만듭니다.`,
        ],
      },
      {
        h3: "그런데 IRP 한 계좌로 몰면 위험자산 한도가 대신 걸린다",
        body: [
          `IRP는 적립금의 70%까지만 위험자산에 담을 수 있어 ${won(COMBINED_CAP)}을 IRP에만 넣으면 주식형 비중이 ${won(Math.floor(COMBINED_CAP * 0.7))}에서 멈춥니다. 연금저축 ${won(PENSION_SAVINGS_CAP)}을 먼저 채우고 나머지 ${won(3_000_000)}을 IRP에 넣으면 위험자산 가능액이 ${won(PENSION_SAVINGS_CAP + Math.floor(3_000_000 * 0.7))}으로 ${won(PENSION_SAVINGS_CAP + Math.floor(3_000_000 * 0.7) - Math.floor(COMBINED_CAP * 0.7))} 늘어납니다. 세액공제 금액은 두 배분이 같으므로, 공제만 보면 무차별하지만 <strong>운용 자유도에서는 연금저축 우선이 유리합니다</strong>.`,
        ],
      },
    ],
    table: {
      head: ["연봉", "연간 결정세액 (소득세)", "한도 납입 시 절세 총액 (지방소득세 포함)", "실제 환급", "사라지는 금액"],
      rows: rows.map((row) => ({
        highlight: row.wasted === 0 && rows.find((item) => item.wasted > 0 && item.amount < row.amount) !== undefined && row.amount <= 5_000,
        cells: [
          manWon(row.amount),
          won(row.determined),
          won(row.credit),
          `<strong>${won(row.actual)}</strong>`,
          row.wasted > 0 ? `<strong style="color:hsl(var(--destructive));">${won(row.wasted)}</strong>` : "없음",
        ],
      })),
    },
    tableNote: `연금저축 ${won(PENSION_SAVINGS_CAP)}·IRP ${won(3_000_000)}으로 합산 한도 ${won(COMBINED_CAP)}을 채운 경우이며, 다른 세액공제 항목(의료비·교육비·기부금)이 있으면 결정세액을 그쪽이 먼저 쓰므로 사라지는 금액이 더 커집니다. 마지막 두 열은 지방소득세를 포함한 절세액을 소득세 결정세액과 견준 값이라 실제보다 조금 크게 잡힙니다 — 지방소득세 결정세액까지 넣으면 그만큼 여유가 생깁니다. 공제율은 총급여 ${won(55_000_000)} 이하 ${pct(LOW_RATE, 1)}, 초과 ${pct(HIGH_RATE, 1)}(지방소득세 포함) 기준으로 2026년 조세특례제한법 규정을 확인한 값입니다.`,
  };
}

export function irpBoundaryReversalDigest() {
  const under = creditOf(55_000_000, PENSION_SAVINGS_CAP, 3_000_000).withLocal;
  const over = creditOf(55_010_000, PENSION_SAVINGS_CAP, 3_000_000).withLocal;
  const loss = under - over;
  const baseNet = salaryOf(55_000_000).annualNet;
  const netPerStep = salaryOf(55_010_000).annualNet - baseNet;
  let recoverAt = null;
  for (let gross = 55_010_000; gross <= 58_000_000; gross += 10_000) {
    if (salaryOf(gross).annualNet - baseNet >= loss) {
      recoverAt = gross;
      break;
    }
  }
  const worstLoss = loss - netPerStep;
  const clawbackLow = Math.floor(
    creditOf(50_000_000, PENSION_SAVINGS_CAP, 3_000_000).recognizedContribution * CLAWBACK_RATE,
  );
  const clawbackHigh = Math.floor(
    creditOf(60_000_000, PENSION_SAVINGS_CAP, 3_000_000).recognizedContribution * CLAWBACK_RATE,
  );
  const severanceTax = severanceIncomeTax(33_000_000, 10);

  return {
    h2: `총급여 ${won(55_000_000)}~${won(recoverAt)}은 한도를 채운 사람에게 손해 구간이다`,
    body: [
      `연금계좌 공제율은 총급여 ${won(55_000_000)}을 경계로 ${pct(LOW_RATE, 1)}에서 ${pct(HIGH_RATE, 1)}로 떨어집니다. 계단 하나짜리 규정이지만 한도 ${won(COMBINED_CAP)}을 다 넣은 사람에게는 그 계단이 연봉 인상분보다 커서, 총급여가 늘었는데 손에 남는 돈이 줄어드는 구간이 생깁니다.`,
    ],
    blocks: [
      {
        h3: `경계를 1만원 넘기면 환급이 ${won(loss)} 줄어드는데 세후 소득은 ${won(netPerStep)}만 는다`,
        body: [
          `총급여 ${won(55_000_000)}에서 한도를 채우면 지방소득세 포함 절세액이 ${won(under)}, ${won(55_010_000)}이면 ${won(over)}으로 ${won(loss)} 줄어듭니다. 반면 총급여 1만원이 늘어 실제로 늘어나는 세후 소득은 ${won(netPerStep)}뿐입니다. 그래서 이 지점에서 순손실이 <strong>${won(worstLoss)}</strong>이 됩니다.`,
        ],
      },
      {
        h3: `손실을 메우려면 총급여가 ${won(recoverAt - 55_000_000)} 더 올라야 한다`,
        body: [
          `세후 전환율이 총급여 1만원당 ${won(netPerStep)}이므로 ${won(loss)}을 회수하려면 총급여가 ${won(recoverAt - 55_000_000)} 더 필요합니다. 즉 총급여 ${won(55_000_000)}에서 ${won(recoverAt)}까지의 ${won(recoverAt - 55_000_000)} 구간 전체가 <strong>연봉이 올라도 총소득이 줄어드는 역전 구간</strong>입니다. 다만 이 역전은 한도 ${won(COMBINED_CAP)}을 실제로 다 넣은 사람에게만 생기고, 납입액이 적으면 그만큼 계단도 얕아집니다.`,
        ],
      },
      {
        h3: `그래서 중도해지의 손익도 이 경계에서 뒤집힌다`,
        body: [
          `연금계좌를 중도에 해지하면 공제받은 납입액에 기타소득세 ${pct(CLAWBACK_RATE, 1)}가 부과됩니다. 이 회수 세율도 지방소득세를 포함한 값이라 받은 쪽과 같은 기준으로 견줄 수 있습니다. 총급여 ${won(50_000_000)}인 사람은 지방소득세 포함 ${won(creditOf(50_000_000, PENSION_SAVINGS_CAP, 3_000_000).withLocal)}을 받고 ${won(clawbackLow)}을 토해내 정확히 본전이지만, 총급여 ${won(60_000_000)}인 사람은 지방소득세 포함 ${won(creditOf(60_000_000, PENSION_SAVINGS_CAP, 3_000_000).withLocal)}만 받고 ${won(clawbackHigh)}을 토해내 <strong>${won(clawbackHigh - creditOf(60_000_000, PENSION_SAVINGS_CAP, 3_000_000).withLocal)} 순손실</strong>입니다. 공제율은 총급여에 따라 갈리는데 회수 세율은 ${pct(CLAWBACK_RATE, 1)} 단일이기 때문이며, 고소득자일수록 해지 손해가 큽니다.`,
        ],
      },
      {
        h3: "퇴직금을 IRP로 받는 쪽은 계산이 완전히 다르다",
        body: [
          `퇴직급여를 IRP로 받으면 퇴직소득세를 그 시점에 떼지 않고 이연하고, 55세 이후 연금으로 나눠 받으면 이연된 세금의 30%(수령 11년째부터 40%)가 감면됩니다. 평균임금 기준 근속 10년 퇴직금 ${won(33_000_000)}의 퇴직소득세는 ${won(severanceTax)}이므로 감면액은 ${won(Math.floor(severanceTax * 0.3))}~${won(Math.floor(severanceTax * 0.4))}입니다. 세액공제 쪽 금액에 비하면 작아 보이지만, 이쪽은 <strong>한도도 결정세액 상한도 없이</strong> 퇴직금 전액에 붙습니다. 그래서 세액공제용 계좌와 퇴직금 계좌를 나눠 두면 인출 순서를 각각 다르게 가져갈 수 있습니다.`,
        ],
      },
    ],
    callout: `<strong>이 계산의 전제</strong> — 부양가족 1인·비과세 식대 월 ${won(200_000)}, 다른 세액공제 항목 없음, 연금저축 ${won(PENSION_SAVINGS_CAP)}·IRP ${won(3_000_000)} 납입 기준입니다. 퇴직소득세는 평균 월급 ${won(3_000_000)}·상여 포함 평균임금 시나리오에서 계산했으므로 실제 퇴직금과 다를 수 있습니다. 공제율·기타소득세율은 2026년 규정을 확인한 값입니다.`,
  };
}

// =========================
// /dependent - what the boundary actually costs, in the units people can check
// =========================

const PROPERTY_MID = 540_000_000;
const PROPERTY_HIGH = 900_000_000;
const MID_INCOME_CEILING = 10_000_000;
const BUSINESS_CEILING = 5_000_000;
const HOUSING_FAIR_MARKET_RATIO = 0.6;
const LAND_FAIR_MARKET_RATIO = 0.7;

export function dependentCliffCostDigest() {
  const ceiling = DEPENDENT_INCOME_CEILING;
  const atCeiling = regionalHealthEstimate(ceiling / 12);
  const annualCost = atCeiling.regionalIncomeOnly * 12;
  const withLongTermCare =
    Math.floor(atCeiling.regionalIncomeOnly * (1 + RATES_2026.longTermCare.rateOfHealth)) * 12;
  const midCeiling = regionalHealthEstimate(MID_INCOME_CEILING / 12);
  const midAnnual = midCeiling.regionalIncomeOnly * 12;
  const monthlyLimit = Math.ceil(ceiling / 12);
  const options = [2_500_000, 3_500_000, 5_000_000].map((monthly) => ({
    monthly,
    ...regionalHealthEstimate(monthly),
  }));

  return {
    h2: `소득 1원이 연 ${won(annualCost)}을 만드는 경계`,
    body: [
      `피부양자는 보험료를 내지 않으므로, 자격을 잃는 순간의 비용은 "얼마를 더 내는가"가 아니라 <strong>0원에서 얼마로 뛰는가</strong>입니다. 아래 금액은 재산·자동차 점수를 뺀 소득분만의 최소 추정치이고, 탈락한 소득이 그대로 지역가입자 부과 소득이 된다는 전제로 계산했습니다.`,
    ],
    blocks: [
      {
        h3: `연 소득 ${won(ceiling)}을 1원 넘기면 월 ${won(atCeiling.regionalIncomeOnly)}이 새로 생긴다`,
        body: [
          `합산소득 ${won(ceiling)}을 월로 환산해 지역가입자 소득분 보험료를 구하면 월 ${won(atCeiling.regionalIncomeOnly)}, 연 ${won(annualCost)}입니다. 장기요양보험료 ${pct(RATES_2026.longTermCare.rateOfHealth, 2)}까지 얹으면 연 ${won(withLongTermCare)}입니다. 세금이라면 한계세율이 붙을 자리에 계단 하나가 통째로 서 있는 셈이고, 이 계단에는 완충 구간이 없습니다.`,
        ],
      },
      {
        h3: `그래서 연 소득 ${won(ceiling)}~${won(ceiling + annualCost)}은 벌수록 손해인 구간이다`,
        body: [
          `소득이 1원 늘어난 대가로 ${won(annualCost)}이 빠져나가므로, 이 손실을 메우려면 소득이 ${won(annualCost)} 더 늘어 ${won(ceiling + annualCost)}에 도달해야 합니다. 월급으로 보면 ${won(monthlyLimit)}을 넘긴 순간부터 ${won(Math.ceil((ceiling + annualCost) / 12))}까지가 그 구간입니다. 재산·자동차 점수를 넣으면 계단이 더 깊어지므로 구간도 그만큼 넓어집니다.`,
        ],
      },
      {
        h3: `재산 ${won(PROPERTY_MID)}을 넘으면 소득선이 절반으로 내려온다`,
        body: [
          `재산세 과세표준이 ${won(PROPERTY_MID)}을 넘으면 적용되는 소득 상한이 ${won(ceiling)}에서 ${won(MID_INCOME_CEILING)}으로 내려갑니다. 즉 재산이 소득 요건을 <strong>절반으로 깎는 방식</strong>으로 작동합니다. 이 구간에서 탈락하면 소득이 ${won(MID_INCOME_CEILING)} 수준이므로 지역 소득분은 월 ${won(midCeiling.regionalIncomeOnly)}, 연 ${won(midAnnual)}이지만, 여기에 재산 점수가 별도로 붙어 실제 고지액은 훨씬 큽니다.`,
        ],
      },
      {
        h3: "탈락 후 선택지는 두 개뿐이고 금액 차이는 정확히 두 배다",
        body: [
          `피부양자에서 밀려나면 지역가입자로 전환되거나, 직전 직장가입 이력이 있다면 임의계속가입을 신청할 수 있습니다. ${options
            .map((option) => `퇴사 전 월급 ${won(option.monthly)} 기준으로 임의계속 ${won(option.formerEmployed)} 대 지역 소득분 ${won(option.regionalIncomeOnly)}`)
            .join(", ")}입니다. 요율이 각각 ${pct(RATES_2026.healthInsurance.employee, 3)}와 ${pct(RATES_2026.healthInsurance.total, 2)}라 배수가 항상 2.000이며, 두 선택지 모두 피부양자의 0원보다는 비쌉니다. 그래서 탈락이 예상되면 <strong>탈락을 막는 쪽</strong>이 언제나 먼저입니다.`,
        ],
      },
    ],
    table: {
      head: ["상황", "적용 소득 상한", "탈락 시 월 소득분 보험료", "연 환산"],
      rows: [
        {
          highlight: true,
          cells: [
            `재산 과세표준 ${won(PROPERTY_MID)} 이하`,
            won(ceiling),
            `<strong>${won(atCeiling.regionalIncomeOnly)}</strong>`,
            won(annualCost),
          ],
        },
        {
          cells: [
            `${won(PROPERTY_MID)} 초과 ~ ${won(PROPERTY_HIGH)} 이하`,
            won(MID_INCOME_CEILING),
            `<strong>${won(midCeiling.regionalIncomeOnly)}</strong>`,
            won(midAnnual),
          ],
        },
        {
          cells: [
            `${won(PROPERTY_HIGH)} 초과`,
            "소득과 무관하게 탈락",
            "소득에 따라",
            "재산 점수 별도 부과",
          ],
        },
      ],
    },
    tableNote: `소득분만 반영한 최소 추정치이며 재산·자동차 점수는 제외했습니다. 요율은 2026년 건강보험료율(${pct(RATES_2026.healthInsurance.total, 2)}) 기준으로 확인한 값이고, 확정 금액은 국민건강보험공단 모의계산으로 확인하세요.`,
  };
}

export function dependentUnitConversionDigest() {
  const ceiling = DEPENDENT_INCOME_CEILING;
  const businessRevenue = Math.round(BUSINESS_CEILING / (1 - SIMPLE_EXPENSE_RATE_BASE));
  const withheld = Math.floor(businessRevenue * 0.033);
  const housingPrice = Math.round(PROPERTY_MID / HOUSING_FAIR_MARKET_RATIO);
  const housingPriceHigh = Math.round(PROPERTY_HIGH / HOUSING_FAIR_MARKET_RATIO);
  const landPrice = Math.round(PROPERTY_MID / LAND_FAIR_MARKET_RATIO);
  const capIncome = RATES_2026.nationalPension.maxMonthlyIncome;
  const pensionRows = [10, 20, 30, 40].map((years) => {
    const capped = calcPensionEstimate({
      averageMonthlyIncome: capIncome,
      insuredYears: years,
      claimAge: 65,
    });
    let needed = null;
    for (let income = 400_000; income <= capIncome; income += 10_000) {
      if (
        calcPensionEstimate({ averageMonthlyIncome: income, insuredYears: years, claimAge: 65 })
          .estimatedAnnualPension > ceiling
      ) {
        needed = income;
        break;
      }
    }
    return { years, capped, needed };
  });
  const deferral = [65, 66, 67, 68, 70].map((age) => ({
    age,
    ...calcPensionEstimate({ averageMonthlyIncome: 5_000_000, insuredYears: 40, claimAge: age }),
  }));
  const flip = deferral.find((row) => row.estimatedAnnualPension > ceiling);
  const deposit = [0.025, 0.03, 0.035].map((rate) => ({
    rate,
    principal: Math.round(ceiling / rate),
  }));

  return {
    h2: "기준이 적혀 있는 단위와 사람이 확인할 수 있는 단위가 다르다",
    body: [
      `피부양자 요건은 사업소득 <strong>금액</strong>, 재산세 <strong>과세표준</strong>, 합산 <strong>소득</strong>처럼 고지서에는 없는 단위로 적혀 있습니다. 그래서 각 기준을 프리랜서가 보는 수입, 등기부에 적힌 공시가격, 통장에 찍히는 연금액으로 되돌려 놓아야 자기 상황과 맞춰 볼 수 있습니다.`,
    ],
    blocks: [
      {
        h3: `사업소득 ${won(BUSINESS_CEILING)}은 프리랜서 수입 ${won(businessRevenue)}에 해당한다`,
        body: [
          `사업자등록이 없는 프리랜서는 사업소득금액 ${won(BUSINESS_CEILING)}까지 자격이 유지되는데, 이 금액은 수입에서 필요경비를 뺀 뒤의 값입니다. 인적용역 단순경비율 ${pct(SIMPLE_EXPENSE_RATE_BASE, 1)}을 적용하면 수입 기준으로는 <strong>${won(businessRevenue)}</strong>이 되고, 3.3%를 뗀 원천징수액으로는 ${won(withheld)}입니다. 반대로 사업자등록이 있으면 소득이 1원만 생겨도 탈락하므로, 같은 일을 해도 등록 여부에 따라 허용 구간이 ${won(businessRevenue)}과 0원으로 갈립니다.`,
        ],
      },
      {
        h3: `재산 과세표준 ${won(PROPERTY_MID)}은 공시가격 ${won(housingPrice)}짜리 주택이다`,
        body: [
          `재산세 과세표준은 공시가격에 공정시장가액비율을 곱한 값이고, 주택은 ${pct(HOUSING_FAIR_MARKET_RATIO, 0)}입니다. 그래서 과세표준 ${won(PROPERTY_MID)}은 공시가격 ${won(housingPrice)}, ${won(PROPERTY_HIGH)}은 ${won(housingPriceHigh)}에 해당합니다. 토지·건축물은 비율이 ${pct(LAND_FAIR_MARKET_RATIO, 0)}이라 같은 과세표준이 공시가격 ${won(landPrice)}에서 나오므로, 자산 구성에 따라 실질 경계선이 다릅니다.`,
        ],
      },
      {
        h3: "국민연금만으로 이 선을 넘으려면 가입 40년에 상한 소득이 필요하다",
        body: [
          `국민연금 예상 수령액을 가입기간별로 훑으면, 65세 청구 기준으로 ${pensionRows
            .filter((row) => row.needed === null)
            .map((row) => `가입 ${row.years}년은 상한 소득(${won(capIncome)})으로도 연 ${won(row.capped.estimatedAnnualPension)}`)
            .join(", ")}에 그쳐 ${won(ceiling)}에 도달하지 못합니다. ${pensionRows
            .filter((row) => row.needed !== null)
            .map((row) => `가입 ${row.years}년부터 평균 기준소득월액 ${won(row.needed)} 이상이면 넘어섭니다`)
            .join(", ")}. 그래서 "연금 수령이 탈락 사유"라는 말은 <strong>국민연금 단독으로는 예외적인 경우</strong>이고, 실제로는 공적연금이 둘 이상이거나 금융소득이 함께 잡힐 때 발생합니다.`,
        ],
      },
      {
        h3: `그런데 연기연금을 신청하면 ${flip ? flip.age : 67}세부터 자격이 깨진다`,
        body: [
          `평균 기준소득월액 ${won(5_000_000)}·가입 40년인 사람의 65세 연금은 연 ${won(deferral[0].estimatedAnnualPension)}으로 아직 ${won(ceiling)} 아래입니다. 그런데 수령을 미루면 연 ${pct(PENSION_AGE_FACTORS[66] - 1, 1)}씩 가산이 붙어 ${flip ? flip.age : 67}세 청구에서 연 ${won(flip ? flip.estimatedAnnualPension : 0)}이 되어 경계를 넘습니다. 연금액을 늘리려는 선택이 건강보험 자격을 깨는 셈이라, 연기 신청 전에 늘어나는 연금액과 새로 생기는 보험료 연 ${won(regionalHealthEstimate(ceiling / 12).regionalIncomeOnly * 12)}을 나란히 놓고 비교해야 합니다.`,
        ],
      },
    ],
    table: {
      head: ["요건에 적힌 단위", "기준값", "사람이 확인할 수 있는 단위로 환산"],
      rows: [
        {
          highlight: true,
          cells: [
            "사업소득금액 (사업자등록 없음)",
            won(BUSINESS_CEILING),
            `수입 ${won(businessRevenue)} · 3.3% 원천징수 ${won(withheld)}`,
          ],
        },
        {
          cells: ["재산세 과세표준 (주택)", won(PROPERTY_MID), `공시가격 ${won(housingPrice)}`],
        },
        {
          cells: ["재산세 과세표준 (주택)", won(PROPERTY_HIGH), `공시가격 ${won(housingPriceHigh)}`],
        },
        {
          cells: [
            "연간 합산소득",
            won(ceiling),
            `월 ${won(Math.ceil(ceiling / 12))} · 예금 ${deposit
              .map((row) => `금리 ${pct(row.rate, 1)}면 원금 ${won(row.principal)}`)
              .join(" / ")}`,
          ],
        },
      ],
    },
    tableNote: `단순경비율 ${pct(SIMPLE_EXPENSE_RATE_BASE, 1)}은 인적용역 수입 ${won(40_000_000)} 이하 구간 기준이고, 공정시장가액비율은 주택 ${pct(HOUSING_FAIR_MARKET_RATIO, 0)}·토지·건축물 ${pct(LAND_FAIR_MARKET_RATIO, 0)}입니다. 예금 원금은 표시된 금리를 가정해 역산한 값이므로 실제 금리에 따라 달라집니다.`,
    callout: `<strong>자료 반영 시차</strong> — 국세청 소득 자료가 공단에 넘어가 재산정되는 시점이 11월이라, 소득이 늘어난 해의 탈락은 이듬해에야 통보되고 소득이 줄어도 보험료는 늦게 내려갑니다. 이 계산기는 소득·재산·사업소득 3계열 요건만 판정하며 부양요건(가족관계)과 공단 보유 부과 자료는 반영하지 않습니다. 요건 상수는 국민건강보험법 시행규칙 별표 1의2 기준으로 확인했습니다.`,
  };
}
