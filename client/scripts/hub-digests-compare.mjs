// Cross-band digests for /compare (offer-vs-offer comparison).
//
// WHY A SEPARATE AXIS FROM /raise AND /salary
// ---------------------------------------------------------------------------
// /raise scans one salary being raised by a percentage, and /salary scans a single
// salary level. Neither can answer the question /compare actually gets asked: two
// offers whose CONTRACT SHAPES differ - twelve payslips or thirteen, base pay or
// base-plus-bonus, one non-taxable line or two - and whose real gap only shows up
// after the deferred items (severance, annual leave) are converted into won.
//
// Every number below comes from calc-engine.mjs at build time. The invariants
// (13/12, the reversal-free scan, the annual-leave recovery ladder) are produced by
// scanning the engine over its whole input range, not by asserting them.
import {
  calculateSalaryBreakdown,
  formatManWonValue,
  formatPercent,
  formatWon,
  getAnnualLeaveDays,
  severanceIncomeTax,
  unemploymentDailyAllowance,
  UNEMPLOYMENT_DAILY_MAX,
} from "./calc-engine.mjs";

const won = (value) => formatWon(value);
const manWon = (value) => `${formatManWonValue(Math.round(value / 10_000))}원`;
const pct = (value, digits = 1) => formatPercent(value, digits);

// Independent literals, deliberately NOT shared with the screen defaults object.
// A gate that compares the screen default against itself can never go red.
const BASE_PAYROLL = { nonTaxableMonthly: 200_000, dependents: 1, children: 0, retirementIncluded: false };
const payroll = (grossAnnual, overrides = {}) =>
  calculateSalaryBreakdown({ grossAnnual, ...BASE_PAYROLL, ...overrides });

// Months per payslip count. A 13-way split pays the same annual figure over twelve
// payslips plus a severance provision, so its monthly gross is annual / 13.
const SPLIT_RATIO = 13 / 12;

const STRUCTURE_GRID = [40_000_000, 50_000_000, 60_000_000, 80_000_000];

// Smallest 13-split gross whose monthly net reaches the 12-split monthly net.
function breakEvenIncluded(separateGross) {
  let low = separateGross;
  let high = separateGross * 2;
  const target = payroll(separateGross).monthlyNet;
  for (let i = 0; i < 60; i += 1) {
    const mid = Math.floor((low + high) / 2);
    if (payroll(mid, { retirementIncluded: true }).monthlyNet >= target) high = mid;
    else low = mid + 1;
  }
  return high;
}

export function compareContractShapeDigest() {
  const rows = STRUCTURE_GRID.map((gross) => {
    const separate = payroll(gross);
    const breakEven = breakEvenIncluded(gross);
    const eightPercent = payroll(Math.round(gross * 1.08), { retirementIncluded: true });
    return {
      gross,
      separate,
      breakEven,
      ratio: breakEven / gross,
      eightPercentGap: eightPercent.monthlyNet - separate.monthlyNet,
    };
  });
  const ratios = rows.map((row) => row.ratio);
  const ratioSpread = Math.max(...ratios) - Math.min(...ratios);
  const sample = rows[1];

  // Severance follows the last three months' average wage, so a raise that is already
  // on the payslip when you leave is inside the severance base.
  const raiseWindow = (fromGross, toGross, years) => {
    const before = payroll(fromGross).monthlyGross * years;
    const after = payroll(toGross).monthlyGross * years;
    return {
      before,
      after,
      netBefore: before - severanceIncomeTax(before, years),
      netAfter: after - severanceIncomeTax(after, years),
    };
  };
  const window5 = raiseWindow(50_000_000, 60_000_000, 5);
  const window3 = raiseWindow(50_000_000, 60_000_000, 3);

  // One total package, split two ways: all base, or base plus a bonus that the
  // contract keeps out of the average-wage base.
  const allBase = payroll(60_000_000);
  const splitBase = payroll(54_000_000);
  const severanceYears = 5;
  const allBaseSeverance = allBase.monthlyGross * severanceYears;
  const splitBaseSeverance = splitBase.monthlyGross * severanceYears;
  const severanceGapNet =
    allBaseSeverance -
    severanceIncomeTax(allBaseSeverance, severanceYears) -
    (splitBaseSeverance - severanceIncomeTax(splitBaseSeverance, severanceYears));
  const leaveDayAllBase = Math.floor((allBase.monthlyGross / 209) * 8);
  const leaveDaySplitBase = Math.floor((splitBase.monthlyGross / 209) * 8);
  const dailyAllBase = unemploymentDailyAllowance(allBase.monthlyGross).dailyAmount;
  const dailySplitBase = unemploymentDailyAllowance(splitBase.monthlyGross).dailyAmount;

  return {
    h2: "제안서의 연봉 숫자를 같은 자 위에 올리는 법",
    body: [
      "두 제안을 나란히 놓기 어려운 이유는 세율이 아니라 <strong>계약의 모양</strong>입니다. 열두 번 나눠 받는지 열세 번 나눠 받는지, 기본급 한 줄인지 기본급과 성과급 두 줄인지, 비과세 항목이 하나인지 둘인지에 따라 같은 숫자가 다른 돈이 됩니다. 아래 네 가지는 그 모양 차이를 전부 원 단위로 바꿔 놓은 것입니다.",
      "출발점은 엔진을 훑어 확인한 사실 하나입니다. 비과세액과 부양가족이 같다면 <strong>월 실수령액은 월 세전 급여 하나만으로 결정됩니다</strong>. 연봉이 아니라 월 세전 급여가 입력이라는 뜻이고, 분할 방식과 성과급 비중이 곧바로 금액을 움직이는 이유도 여기에 있습니다.",
    ],
    blocks: [
      {
        h3: `13분할 제안의 손익분기는 연봉과 무관하게 ${SPLIT_RATIO.toFixed(5)}배다`,
        body: [
          `퇴직금이 연봉에 포함된 제안은 같은 금액을 열세 번으로 나눕니다. 그래서 월 세전 급여가 연봉의 13분의 1이 되고, 12분할 제안과 실수령이 같아지려면 연봉이 정확히 13분의 12만큼 커야 합니다. 연봉 ${manWon(STRUCTURE_GRID[0])}부터 ${manWon(STRUCTURE_GRID[STRUCTURE_GRID.length - 1])}까지 네 지점에서 손익분기 연봉을 이분탐색으로 각각 다시 찾아도 배수는 네 곳 모두 ${SPLIT_RATIO.toFixed(5)}이고, 최대와 최소의 차이가 ${ratioSpread.toFixed(6)}에 그칩니다. 연봉대가 배수를 흔들지 않습니다.`,
          `실무적으로는 <strong>${pct(SPLIT_RATIO - 1, 2)} 미만의 인상률에 퇴직금 포함 조건이 붙으면 삭감</strong>이라는 뜻입니다. 흔한 8% 인상 제안을 13분할로 받으면 연봉 ${manWon(sample.gross)} 기준 월 실수령이 ${won(Math.abs(sample.eightPercentGap))} <strong>줄어듭니다</strong>. 표의 마지막 열은 네 연봉대 모두에서 이 값이 음수라는 것을 보여 줍니다.`,
        ],
        table: {
          head: ["현재 연봉 (12분할)", "월 실수령", "손익분기 연봉 (13분할)", "손익분기 배수", "8% 인상 + 13분할의 월 실수령 변화"],
          rows: rows.map((row) => ({
            highlight: row === sample,
            cells: [
              manWon(row.gross),
              won(row.separate.monthlyNet),
              `<strong>${won(row.breakEven)}</strong>`,
              row.ratio.toFixed(5),
              `${row.eightPercentGap >= 0 ? "+" : "−"}${won(Math.abs(row.eightPercentGap))}`,
            ],
          })),
        },
        tableNote: `부양가족 1인·비과세 식대 월 ${won(200_000)} 기준입니다. 13분할 제안이라도 열세 번째 몫이 퇴직급여로 적립되는 계약이라면 실수령 밖에서 돌아오므로, 계약서에서 확인할 것은 인상률이 아니라 그 몫의 행선지입니다.`,
      },
      {
        h3: `인상이 반영된 급여를 석 달 채우고 나가면 퇴직금이 ${won(window5.netAfter - window5.netBefore)} 커진다`,
        body: [
          `퇴직금은 마지막 세 달의 평균임금으로 계산됩니다. 그래서 이직 제안을 받은 뒤 현 직장에서 인상을 먼저 받아 두면, 그 인상은 다음 직장의 연봉이 아니라 <strong>현 직장의 퇴직금</strong>에 먼저 반영됩니다. 연봉 ${manWon(50_000_000)}에서 ${manWon(60_000_000)}으로 인상된 급여를 받고 근속 ${5}년에 퇴사하면 퇴직금 세전이 ${won(window5.before)}에서 ${won(window5.after)}으로, 퇴직소득세를 뺀 세후로는 ${won(window5.netBefore)}에서 ${won(window5.netAfter)}으로 올라갑니다.`,
          `크기는 근속에 비례합니다. 같은 인상을 근속 ${3}년에 적용하면 세후 차이가 ${won(window3.netAfter - window3.netBefore)}으로 줄어듭니다. 두 제안 중 하나가 "현 직장의 카운터오퍼"라면 이 금액이 제안서에 적히지 않은 채로 따라온다는 점을 계산에 넣어야 합니다.`,
        ],
      },
      {
        h3: "총액이 같아도 기본급 비중이 낮으면 세 계산기 중 둘이 함께 내려간다",
        body: [
          `총 보상 ${manWon(60_000_000)}을 기본급 ${manWon(60_000_000)} 한 줄로 받는 제안과, 기본급 ${manWon(54_000_000)}에 성과급 ${manWon(6_000_000)}을 얹은 제안은 그해 실수령이 같습니다. 갈라지는 것은 <strong>기본급을 기준으로 계산되는 항목</strong>입니다. 성과급이 평균임금 산정에서 빠지는 계약이라면 근속 ${severanceYears}년 퇴직금이 세후 ${won(severanceGapNet)} 적고, 연차수당 1일 단가도 ${won(leaveDayAllBase)}에서 ${won(leaveDaySplitBase)}으로 ${won(leaveDayAllBase - leaveDaySplitBase)} 내려가 미사용 15일이면 ${won((leaveDayAllBase - leaveDaySplitBase) * 15)} 차이가 납니다.`,
          `그런데 세 번째 항목은 움직이지 않습니다. 실업급여 일액은 기본급 ${manWon(60_000_000)} 쪽이 ${won(dailyAllBase)}, ${manWon(54_000_000)} 쪽이 ${won(dailySplitBase)}으로 ${dailyAllBase === dailySplitBase ? "완전히 같습니다" : "다릅니다"}. 두 급여 모두 일액 상한 ${won(UNEMPLOYMENT_DAILY_MAX)}에 이미 닿아 있기 때문입니다. 월 세전 급여가 세 계산기의 공통 입력인데도 상한이 있는 항목만 반응하지 않는 것이라, "기본급 비중이 낮으면 무조건 손해"라는 말은 <strong>상한에 걸리지 않는 급여대에서만</strong> 참입니다.`,
        ],
      },
      {
        h3: "비과세 구성이 다르면 세전이 낮은 제안이 이길 수 있다",
        body: [
          (() => {
            const grid = [30_000_000, 40_000_000, 50_000_000, 60_000_000, 80_000_000, 100_000_000];
            const equiv = grid.map((gross) => {
              const base = payroll(gross);
              const doubled = payroll(gross, { nonTaxableMonthly: 400_000 });
              let low = gross;
              let high = gross * 2;
              for (let i = 0; i < 60; i += 1) {
                const mid = Math.floor((low + high) / 2);
                if (payroll(mid).monthlyNet >= doubled.monthlyNet) high = mid;
                else low = mid + 1;
              }
              return { gross, gain: doubled.monthlyNet - base.monthlyNet, equivalent: high - gross };
            });
            const at50 = equiv.find((row) => row.gross === 50_000_000);
            const peak = equiv.reduce((max, row) => (row.equivalent > max.equivalent ? row : max), equiv[0]);
            const top = equiv[equiv.length - 1];
            return `같은 세전 총액 안에서 월 ${won(200_000)}을 비과세 항목으로 돌리면 연봉 ${manWon(at50.gross)} 기준 월 실수령이 ${won(at50.gain)} 늘어납니다. 이 증가를 세전 인상으로 만들려면 ${won(at50.equivalent)}이 필요하므로, <strong>비과세 월 40만원에 세전 ${won(50_000_000 - at50.equivalent)}인 제안과, 비과세 월 20만원에 세전 ${manWon(50_000_000)}인 제안은 실수령이 같습니다</strong>. 등가액은 연봉대마다 다르고 단조롭지도 않아서, ${manWon(peak.gross)}에서 ${won(peak.equivalent)}으로 가장 크고 ${manWon(top.gross)}에서는 ${won(top.equivalent)}으로 다시 내려옵니다. 국민연금 기준소득월액 상한을 이미 넘긴 급여에서는 비과세로 돌려도 줄어들 연금 보험료가 없기 때문입니다.`;
          })(),
        ],
      },
    ],
    tableNote: `표와 본문의 모든 금액은 2026년 요율(국민연금 4.75%·건강보험 3.595%·장기요양 건보료의 13.14%·고용보험 0.9%)과 근로소득 간이세액 기준으로 빌드 시점에 다시 계산한 값입니다.`,
    callout: `<strong>제안서에서 먼저 확인할 네 줄</strong> — ① 12분할인가 13분할인가 ② 기본급과 성과급의 경계가 어디인가 ③ 비과세 항목이 몇 개이고 각각 얼마인가 ④ 퇴직급여가 연봉 안인가 밖인가. 이 네 줄이 같아야 두 연봉 숫자를 그대로 비교할 수 있습니다.`,
  };
}

const PAIRS = [
  [30_000_000, 40_000_000],
  [30_000_000, 50_000_000],
  [40_000_000, 50_000_000],
  [40_000_000, 60_000_000],
  [50_000_000, 60_000_000],
  [60_000_000, 70_000_000],
  [70_000_000, 80_000_000],
  [80_000_000, 100_000_000],
];

// Years of service -> statutory annual-leave days, and the years it takes to climb
// back to that number after a move resets the ladder.
function leaveLadder(years) {
  const before = getAnnualLeaveDays(years * 12);
  let recover = 0;
  for (let candidate = 1; candidate <= 60; candidate += 1) {
    if (getAnnualLeaveDays(candidate * 12) >= before) {
      recover = candidate;
      break;
    }
  }
  let lostDays = 0;
  for (let year = 1; year <= recover; year += 1) {
    const staying = getAnnualLeaveDays((years + year) * 12);
    const moved = year === 1 ? getAnnualLeaveDays(11) : getAnnualLeaveDays(year * 12);
    lostDays += staying - moved;
  }
  return { years, before, recover, lostDays, matches: recover === years };
}

export function compareTimeCostDigest() {
  const gapRows = PAIRS.map(([from, to]) => {
    const before = payroll(from);
    const after = payroll(to);
    const monthlyGain = after.monthlyNet - before.monthlyNet;
    return {
      from,
      to,
      monthlyGain,
      payback: before.monthlyNet / monthlyGain,
    };
  });
  const slowest = gapRows.reduce((max, row) => (row.payback > max.payback ? row : max), gapRows[0]);
  const fastest = gapRows.reduce((min, row) => (row.payback < min.payback ? row : min), gapRows[0]);
  const afterSlowest = gapRows[gapRows.indexOf(slowest) + 1] ?? null;

  const ladder = [3, 5, 9, 15].map(leaveLadder);
  const allLadders = Array.from({ length: 25 }, (unused, index) => leaveLadder(index + 1));
  const matching = allLadders.filter((row) => row.matches);
  const capped = allLadders.find((row) => row.before === 25);

  // Full sweep: does a higher gross ever pay a lower monthly net inside one contract shape?
  const SWEEP_LOW = 30_000_000;
  const SWEEP_HIGH = 100_000_000;
  const SWEEP_STEP = 100_000;
  let reversals = 0;
  let ties = 0;
  let sweepPoints = 0;
  let previous = null;
  for (let gross = SWEEP_LOW; gross <= SWEEP_HIGH; gross += SWEEP_STEP) {
    const net = payroll(gross).monthlyNet;
    sweepPoints += 1;
    if (previous !== null && net < previous) reversals += 1;
    if (previous !== null && net === previous) ties += 1;
    previous = net;
  }

  const offerA = payroll(60_000_000);
  const offerB = payroll(64_000_000, { retirementIncluded: true });
  const offerAProvision = offerA.monthlyGross;
  const totalGap = offerA.annualNet + offerAProvision - offerB.annualNet;
  const nominalGap = (64_000_000 - 60_000_000) / 60_000_000;

  return {
    h2: "연봉표에 없는 시간 비용 — 공백과 연차",
    body: [
      "제안 두 개의 차액은 월 단위로 나오지만, 이직에 드는 비용은 <strong>시간 단위</strong>로 발생합니다. 공백 한 달은 그달의 실수령 전부이고, 연차는 근속 계단을 처음부터 다시 오르게 만듭니다. 아래 네 항목은 그 시간 비용을 세후 인상분과 같은 단위로 바꿔 놓은 것입니다.",
    ],
    blocks: [
      {
        h3: `공백 한 달을 세후 인상분으로 되찾는 데 ${fastest.payback.toFixed(1)}개월에서 ${slowest.payback.toFixed(1)}개월이 걸린다`,
        body: [
          `공백 한 달의 비용은 그달에 받지 못한 실수령액이고, 회수 속도는 새 직장에서 늘어나는 월 실수령액입니다. 둘을 나누면 회수 개월이 나옵니다. 여덟 조합 중 가장 빠른 것은 ${manWon(fastest.from)} → ${manWon(fastest.to)} 조합의 ${fastest.payback.toFixed(1)}개월이고, 가장 느린 것은 ${manWon(slowest.from)} → ${manWon(slowest.to)} 조합의 ${slowest.payback.toFixed(1)}개월입니다.`,
          afterSlowest
            ? `회수 개월은 연봉이 높아질수록 길어지기만 하는 것이 아닙니다. ${manWon(slowest.from)} → ${manWon(slowest.to)} 다음 칸인 ${manWon(afterSlowest.from)} → ${manWon(afterSlowest.to)} 조합은 ${afterSlowest.payback.toFixed(1)}개월로 오히려 짧아집니다. 인상 폭 자체가 ${manWon(afterSlowest.to - afterSlowest.from)}으로 두 배이기 때문입니다. 회수 개월을 결정하는 것은 연봉 수준이 아니라 <strong>인상 폭과 현재 실수령의 비율</strong>이라는 뜻이라, 같은 인상률끼리 비교하면 이 순서가 다시 바뀝니다.`
            : "",
          `석 달 공백을 감수하는 경우라면 위 값에 3을 곱하면 됩니다. ${manWon(slowest.from)} → ${manWon(slowest.to)} 조합에서는 ${(slowest.payback * 3).toFixed(1)}개월, 즉 2년 넘게 지나야 공백 이전의 누적 수입을 따라잡습니다.`,
        ],
        table: {
          head: ["비교 조합", "월 실수령 증가", "공백 1개월 회수", "공백 3개월 회수"],
          rows: gapRows.map((row) => ({
            highlight: row === slowest,
            cells: [
              `${manWon(row.from)} → ${manWon(row.to)}`,
              `<strong>${won(row.monthlyGain)}</strong>`,
              `${row.payback.toFixed(1)}개월`,
              `${(row.payback * 3).toFixed(1)}개월`,
            ],
          })),
        },
        tableNote: `공백 비용은 공백 기간의 실수령액만 센 것이며, 그 기간에 새로 생기는 지역가입 건강보험료는 포함하지 않았습니다. 그 금액은 <a href="/finance/guide/resignation">퇴사 전 계산 순서 가이드</a>에서 다룹니다.`,
      },
      {
        h3: `연차 계단은 0으로 돌아가고, 회복 연수가 근속 연수와 같아지는 것은 ${matching.length}개 지점뿐이다`,
        body: [
          `연차 발생일수는 근속 1년에 15일에서 시작해 이후 2년마다 하루씩 늘어납니다. 이직하면 이 계단이 처음으로 돌아가므로, 옮기기 전 일수를 되찾는 데 몇 해가 걸리는지가 실질 비용입니다. 근속 1년부터 25년까지 전 구간을 훑으면 <strong>회복 연수가 근속 연수와 정확히 같아지는 것은 홀수 근속 ${matching.length}개 지점</strong>이고, 짝수 근속에서는 한 해 짧습니다(근속 ${allLadders[3].years}년의 ${allLadders[3].before}일은 ${allLadders[3].recover}년이면 회복됩니다).`,
          capped
            ? `상한도 있습니다. 연차는 ${capped.years}년째에 ${capped.before}일로 멈추므로, 그보다 오래 다닌 사람은 근속이 아무리 길어도 회복 기간이 ${capped.recover}년에서 더 늘지 않습니다. 표의 마지막 열은 회복 기간 동안 누적으로 덜 받게 되는 연차 일수이고, 근속 ${ladder[2].years}년에서 옮기면 ${ladder[2].lostDays}일, 근속 ${ladder[3].years}년에서 옮기면 ${ladder[3].lostDays}일입니다.`
            : "",
        ],
        table: {
          head: ["이직 직전 근속", "그때 연차", "같은 일수 회복까지", "회복 기간 누적 손실 일수"],
          rows: ladder.map((row) => ({
            highlight: row.years === 9,
            cells: [
              `${row.years}년`,
              `${row.before}일`,
              `<strong>${row.recover}년</strong>`,
              `${row.lostDays}일`,
            ],
          })),
        },
        tableNote: `이직 첫해는 개근한 달마다 1일씩 최대 11일이 생기는 것으로 계산했습니다. 손실 일수는 옮기지 않았을 때의 발생일수에서 옮긴 뒤의 발생일수를 뺀 값을 회복 연도까지 더한 것입니다.`,
      },
      {
        h3: `계약 모양이 같으면 세전이 높은데 실수령이 낮은 조합은 ${sweepPoints}개 지점에서 0건이다`,
        body: [
          `"연봉이 올라 세금 구간이 바뀌면 손에 쥐는 돈이 오히려 줄 수 있다"는 말이 자주 돕니다. 연봉 ${manWon(SWEEP_LOW)}부터 ${manWon(SWEEP_HIGH)}까지 ${won(SWEEP_STEP)} 간격 ${sweepPoints}개 지점을 전부 계산해 앞 지점과 비교하면, 월 실수령이 내려가는 자리는 <strong>${reversals}건</strong>, 같은 자리는 ${ties}건입니다. 같은 비과세액·부양가족·분할 방식 안에서는 역전이 존재하지 않습니다.`,
          `역전이 생기는 경우는 따로 있고, 전부 계약 모양이 다를 때입니다. 앞 절의 13분할 손익분기(${SPLIT_RATIO.toFixed(5)}배)와 비과세 등가액이 그 경계이며, 아래 마지막 항목이 그 반례입니다. 세율 구간이 만드는 것은 역전이 아니라 <strong>증가 속도의 둔화</strong>이고, 둘은 다른 이야기입니다.`,
        ],
      },
      {
        h3: `명목이 ${pct(nominalGap, 1)} 높은 제안이 총 보상에서 ${won(totalGap)} 지는 경우`,
        body: [
          `제안 A는 연봉 ${manWon(60_000_000)}에 퇴직금 별도, 제안 B는 연봉 ${manWon(64_000_000)}에 퇴직금 포함입니다. 숫자만 보면 B가 ${pct(nominalGap, 1)} 높지만 월 실수령은 A ${won(offerA.monthlyNet)}, B ${won(offerB.monthlyNet)}으로 <strong>B가 ${won(offerA.monthlyNet - offerB.monthlyNet)} 적습니다</strong>. B가 A를 넘으려면 손익분기 ${won(breakEvenIncluded(60_000_000))}이 필요합니다.`,
          `여기에 A쪽에서 1년마다 쌓이는 퇴직급여 ${won(offerAProvision)}을 더하면 격차가 연 ${won(totalGap)}으로 벌어집니다. 다만 이 적립은 근속 1년을 채워야 발생하므로, <strong>1년 안에 다시 옮길 계획이라면 이 항목은 0으로 두고 다시 계산해야 합니다</strong>. 그 경우 격차는 연 실수령 차이인 ${won(offerA.annualNet - offerB.annualNet)}으로 줄어듭니다.`,
        ],
      },
    ],
    callout: `<strong>회수 개월을 계산하는 순서</strong> — ① 현재 월 실수령을 확인하고 ② 두 제안의 월 실수령 차이를 구한 뒤 ③ 예상 공백 개월 × ①을 ②로 나눕니다. 여기에 연차 회복 기간과 근속 1년 미만 여부를 더하면 제안서에 없는 비용이 전부 들어옵니다.`,
  };
}
