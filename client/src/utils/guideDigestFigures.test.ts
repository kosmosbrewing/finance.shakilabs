// 가이드 4종과 /compare 승격 산문의 재계산·관계 게이트.
//
// 왜 별도 파일인가: digestFigures.test.ts는 "숫자가 맞는가"를 본다. 이번 승격에서 실제로 틀린 것은
// 숫자가 아니라 사람이 쓴 서술이었다 — 부등호 방향, 조건 없이 쓴 단언, 본문과 어긋난 h3. 그래서
// 여기서는 세 가지를 함께 못 박는다.
//   1. 리터럴 앵커: 엔진 출력을 하드코딩 숫자와 대조한다. 요율 상수가 바뀌면 여기가 먼저 red다.
//   2. 관계 단언: "크다/작다/뒤집힌다/멈춘다"를 값이 아니라 부등식으로 검사한다.
//   3. 범위 스캔: "언제나"라고 쓴 문장은 그 범위를 실제로 훑어 반증이 없음을 확인하고,
//      특정 구간에서만 참인 문장은 그 구간 밖에서 실제로 거짓이 되는지까지 확인한다.
// h3도 산문이므로 digestProse가 h3를 포함한다는 사실에 기대어 같은 기준으로 검사한다.
import { describe, expect, it } from "vitest";
import * as engine from "../../scripts/calc-engine.mjs";
import {
  compareContractShapeDigest,
  compareTimeCostDigest,
} from "../../scripts/hub-digests-compare.mjs";
import {
  jobChangeStepFindingsDigest,
  jobChangeTimingDigest,
  partTimeThresholdDigest,
  resignationSettlementDigest,
  resignationStepAmountsDigest,
  yearEndCeilingDigest,
  yearEndStepValueDigest,
} from "../../scripts/hub-digests-guides.mjs";
import { digestProse } from "../../scripts/hub-digests-registry.mjs";
import type { Digest } from "../../scripts/hub-digest-types.d.mts";

const prose = (digest: Digest) => digestProse(digest).replace(/<[^>]+>/g, "");
const won = (value: number) => engine.formatWon(value);

// 화면 기본값과 "같은 값의 독립 리터럴"이다. 다이제스트가 쓰는 객체를 그대로 import 하면
// 기준 입력을 자기 자신과 비교하게 되어 어떤 변경에도 red가 나지 않는다.
const STANDARD = {
  nonTaxableMonthly: 200_000,
  dependents: 1,
  children: 0,
  retirementIncluded: false,
};
const net = (grossAnnual: number, overrides: Record<string, unknown> = {}) =>
  engine.calculateSalaryBreakdown({ grossAnnual, ...STANDARD, ...overrides });

describe("리터럴 앵커 — 표준 시나리오의 엔진 출력", () => {
  it("2026 요율로 계산한 월 실수령이 하드코딩 값과 원 단위까지 같다", () => {
    // 요율 상수(국민연금 4.75%·건보 3.595%·장기요양 13.14%·고용 0.9%) 중 하나라도 바뀌면
    // 여기가 가장 먼저 깨진다.
    expect(net(50_000_000).monthlyNet).toBe(3_565_643);
    expect(net(60_000_000).monthlyNet).toBe(4_200_733);
    expect(net(80_000_000).monthlyNet).toBe(5_415_584);
    // 항목별로 손계산한 값과 대조한다 — 요율 하나만 틀어져도 해당 줄이 먼저 깨진다
    const taxableMonthly = net(50_000_000).taxableMonthly;
    expect(taxableMonthly).toBe(3_966_666);
    expect(net(50_000_000).nationalPension).toBe(Math.floor(taxableMonthly * 0.0475));
    expect(net(50_000_000).nationalPension).toBe(188_416);
    expect(net(50_000_000).healthInsurance).toBe(Math.floor(taxableMonthly * 0.03595));
    expect(net(50_000_000).healthInsurance).toBe(142_601);
    expect(net(50_000_000).longTermCare).toBe(Math.floor(142_601 * 0.1314));
    expect(net(50_000_000).longTermCare).toBe(18_737);
    expect(net(50_000_000).employmentInsurance).toBe(Math.floor(taxableMonthly * 0.009));
    expect(net(50_000_000).employmentInsurance).toBe(35_699);
    expect(net(50_000_000).totalInsurance).toBe(385_453);
    expect(engine.RATES_2026.nationalPension.maxMonthlyIncome).toBe(6_590_000);
    expect(engine.UNEMPLOYMENT_DAILY_MAX).toBe(68_100);
    expect(engine.UNEMPLOYMENT_DAILY_MIN).toBe(66_048);
    expect(10_320 * 8 * 0.8).toBe(engine.UNEMPLOYMENT_DAILY_MIN);
  });
});

describe("/compare — 계약 모양", () => {
  const digest = compareContractShapeDigest();
  const text = prose(digest);

  it("13분할 손익분기는 연봉과 무관하게 13/12이고, 경계 바로 아래는 실제로 진다", () => {
    for (const gross of [40_000_000, 50_000_000, 60_000_000, 80_000_000]) {
      const target = net(gross).monthlyNet;
      let low = gross;
      let high = gross * 2;
      for (let i = 0; i < 60; i += 1) {
        const mid = Math.floor((low + high) / 2);
        if (net(mid, { retirementIncluded: true }).monthlyNet >= target) high = mid;
        else low = mid + 1;
      }
      // 배수는 네 지점에서 소수점 다섯 자리까지 같다
      expect(high / gross).toBeCloseTo(13 / 12, 5);
      // 경계에서는 이기고 경계 바로 아래에서는 진다 — 이분탐색이 진짜 경계를 찾았다는 뜻
      expect(net(high, { retirementIncluded: true }).monthlyNet).toBeGreaterThanOrEqual(target);
      expect(net(high - 1_000, { retirementIncluded: true }).monthlyNet).toBeLessThan(target);
    }
    // 손익분기 연봉은 표에만 있으므로 표에서 확인한다
    const breakEvenCells = (digest.blocks ?? [])[0]?.table?.rows.map((row) => row.cells[2]) ?? [];
    expect(breakEvenCells.join(" ")).toContain(won(54_166_658));
  });

  it("8% 인상 + 13분할은 네 연봉대 모두에서 삭감이다 (부등호 방향)", () => {
    for (const gross of [40_000_000, 50_000_000, 60_000_000, 80_000_000]) {
      const separate = net(gross).monthlyNet;
      const included = net(Math.round(gross * 1.08), { retirementIncluded: true }).monthlyNet;
      expect(included).toBeLessThan(separate);
    }
    // 8.33%가 손익분기이므로 8%는 그 아래다 — 산문이 인과로 쓴 부분
    expect(1.08).toBeLessThan(13 / 12);
    expect(net(54_000_000, { retirementIncluded: true }).monthlyNet - net(50_000_000).monthlyNet).toBe(-9_771);
    expect(text).toContain(won(9_771));
  });

  it("평균임금 3개월 창: 인상 후 퇴사가 더 크고, 그 폭은 근속에 비례한다", () => {
    const gap = (years: number) => {
      const before = net(50_000_000).monthlyGross * years;
      const after = net(60_000_000).monthlyGross * years;
      return (
        after - engine.severanceIncomeTax(after, years) - (before - engine.severanceIncomeTax(before, years))
      );
    };
    expect(gap(5)).toBe(3_974_170);
    expect(gap(3)).toBe(2_384_502);
    expect(gap(5)).toBeGreaterThan(gap(3));
    expect(text).toContain(won(3_974_170));
    expect(text).toContain(won(2_384_502));
  });

  it("기본급 비중: 퇴직금과 연차는 내려가지만 실업급여 일액은 움직이지 않는다", () => {
    const allBase = net(60_000_000);
    const splitBase = net(54_000_000);
    const sevOf = (monthlyGross: number, years: number) => {
      const gross = monthlyGross * years;
      return gross - engine.severanceIncomeTax(gross, years);
    };
    expect(sevOf(allBase.monthlyGross, 5) - sevOf(splitBase.monthlyGross, 5)).toBe(2_351_500);
    const dayOf = (monthlyGross: number) => Math.floor((monthlyGross / 209) * 8);
    expect(dayOf(allBase.monthlyGross) - dayOf(splitBase.monthlyGross)).toBe(19_139);
    // 세 번째 항목은 상한에 걸려 반응하지 않는다 — "무조건 손해"를 조건부로 바꾼 근거
    expect(engine.unemploymentDailyAllowance(allBase.monthlyGross).dailyAmount).toBe(
      engine.unemploymentDailyAllowance(splitBase.monthlyGross).dailyAmount,
    );
    expect(engine.unemploymentDailyAllowance(allBase.monthlyGross).dailyAmount).toBe(68_100);
    // 상한 아래에서는 실제로 갈린다 — 조건절이 공허하지 않다는 확인
    expect(engine.unemploymentDailyAllowance(3_350_000).dailyAmount).not.toBe(
      engine.unemploymentDailyAllowance(3_400_000).dailyAmount,
    );
    expect(text).toContain(won(2_351_500));
    expect(text).toContain(won(19_139));
  });

  it("비과세 등가액은 단조롭지 않고 8,000만원에서 꼭짓점을 찍는다", () => {
    const equivalent = (gross: number) => {
      const doubled = net(gross, { nonTaxableMonthly: 400_000 }).monthlyNet;
      let low = gross;
      let high = gross * 2;
      for (let i = 0; i < 60; i += 1) {
        const mid = Math.floor((low + high) / 2);
        if (net(mid).monthlyNet >= doubled) high = mid;
        else low = mid + 1;
      }
      return high - gross;
    };
    expect(equivalent(50_000_000)).toBe(749_128);
    expect(equivalent(80_000_000)).toBe(1_141_492);
    expect(equivalent(100_000_000)).toBe(967_748);
    // 산문이 "가장 크고 … 다시 내려온다"라고 쓴 관계
    expect(equivalent(80_000_000)).toBeGreaterThan(equivalent(60_000_000));
    expect(equivalent(100_000_000)).toBeLessThan(equivalent(80_000_000));
    expect(text).toContain(won(749_128));
  });
});

describe("/compare — 시간 비용", () => {
  const digest = compareTimeCostDigest();
  const text = prose(digest);

  it("공백 회수 개월의 최대·최소와, 최대 다음 칸의 반등", () => {
    const payback = (from: number, to: number) =>
      net(from).monthlyNet / (net(to).monthlyNet - net(from).monthlyNet);
    expect(payback(70_000_000, 80_000_000)).toBeCloseTo(8.3, 1);
    expect(payback(30_000_000, 50_000_000)).toBeCloseTo(1.7, 1);
    // 산문이 "오히려 짧아진다"라고 쓴 방향
    expect(payback(80_000_000, 100_000_000)).toBeLessThan(payback(70_000_000, 80_000_000));
    expect(text).toContain("8.3개월");
  });

  it("연차 회복 연수는 홀수 근속 11개에서만 근속 연수와 같고 21년에서 멈춘다", () => {
    const recoverOf = (years: number) => {
      const before = engine.getAnnualLeaveDays(years * 12);
      for (let candidate = 1; candidate <= 60; candidate += 1) {
        if (engine.getAnnualLeaveDays(candidate * 12) >= before) return candidate;
      }
      return 0;
    };
    const matching: number[] = [];
    for (let years = 1; years <= 25; years += 1) {
      if (recoverOf(years) === years) matching.push(years);
    }
    expect(matching).toHaveLength(11);
    expect(matching.every((years) => years % 2 === 1)).toBe(true);
    // 짝수 근속은 한 해 짧다 — 산문이 괄호로 단 예외
    expect(recoverOf(4)).toBe(3);
    expect(recoverOf(4)).toBeLessThan(4);
    // 상한 뒤로는 회복 기간이 더 늘지 않는다
    expect(engine.getAnnualLeaveDays(21 * 12)).toBe(25);
    expect(recoverOf(21)).toBe(21);
    expect(recoverOf(25)).toBe(21);
    expect(text).toContain("21년");
  });

  it("같은 계약 모양 안에서는 701개 지점 전수 스캔에 역전이 없다", () => {
    let reversals = 0;
    let ties = 0;
    let points = 0;
    let previous: number | null = null;
    for (let gross = 30_000_000; gross <= 100_000_000; gross += 100_000) {
      const value = net(gross).monthlyNet;
      points += 1;
      if (previous !== null && value < previous) reversals += 1;
      if (previous !== null && value === previous) ties += 1;
      previous = value;
    }
    expect(points).toBe(701);
    expect(reversals).toBe(0);
    expect(ties).toBe(0);
    // 반례는 계약 모양이 다를 때만 — 없다고 쓰지 않았다는 확인
    expect(net(64_000_000, { retirementIncluded: true }).monthlyNet).toBeLessThan(
      net(60_000_000).monthlyNet,
    );
    expect(text).toContain("701개 지점");
  });

  it("명목이 높은 제안이 총 보상에서 지는 사례가 실제로 성립한다", () => {
    const offerA = net(60_000_000);
    const offerB = net(64_000_000, { retirementIncluded: true });
    expect(64_000_000).toBeGreaterThan(60_000_000);
    expect(offerB.monthlyNet).toBeLessThan(offerA.monthlyNet);
    expect(offerA.monthlyNet - offerB.monthlyNet).toBe(58_623);
    expect(offerA.annualNet + offerA.monthlyGross - offerB.annualNet).toBe(5_703_476);
    expect(offerA.annualNet - offerB.annualNet).toBe(703_476);
    expect(text).toContain(won(5_703_476));
    expect(text).toContain(won(703_476));
  });
});

describe("/guide/job-change", () => {
  const steps = jobChangeStepFindingsDigest();
  const timing = jobChangeTimingDigest();
  const stepText = prose(steps);
  const timingText = prose(timing);

  const bandRetention = (lowGross: number) => {
    const low = net(lowGross);
    const high = net(lowGross + 10_000_000);
    return (high.monthlyNet - low.monthlyNet) / (high.monthlyGross - low.monthlyGross);
  };

  it("국민연금 상한이 만드는 잔존율 반등은 두 칸에서만 나타난다", () => {
    // 상한 도달 연봉 — 산문이 인용한 값
    let capReach = 0;
    for (let gross = 70_000_000; gross <= 120_000_000; gross += 10_000) {
      if (net(gross).taxableMonthly >= engine.RATES_2026.nationalPension.maxMonthlyIncome) {
        capReach = gross;
        break;
      }
    }
    expect(capReach).toBe(81_480_000);
    // 상한을 완전히 넘긴 구간에서는 연금 공제가 1원도 늘지 않는다
    expect(net(100_000_000).nationalPension - net(90_000_000).nationalPension).toBe(0);
    expect(net(80_000_000).nationalPension - net(70_000_000).nationalPension).toBe(39_583);
    expect(net(90_000_000).nationalPension - net(80_000_000).nationalPension).toBe(5_859);
    // 반등의 방향과 그 반등이 다시 꺾이는 지점 — "언제나 올라간다"가 아님을 확인
    expect(bandRetention(80_000_000)).toBeGreaterThan(bandRetention(70_000_000));
    expect(bandRetention(90_000_000)).toBeGreaterThan(bandRetention(80_000_000));
    expect(bandRetention(110_000_000)).toBeLessThan(bandRetention(70_000_000));
    expect(stepText).toContain("81,480,000원");
  });

  // 산문이 새로 주장하는 것: 상한 위에서는 보험료뿐 아니라 예상 연금액도 멈춘다.
  // 근거는 기준소득월액이 보험료와 급여를 함께 산정하는 하나의 값이라는 데 있다.
  //   국민연금법 제3조제1항제5호 - "연금보험료와 급여를 산정하기 위하여" 정하는 금액
  //   같은 법 시행령 제5조제5항 - 상한액보다 많으면 그 상한액을 기준소득월액으로 한다
  //   같은 법 제51조제1항제2호 - 기본연금액의 소득비례분은 그 기준소득월액을 평균한 값
  it("상한 위에서는 예상 연금액도 멈춘다 - 다만 상한 아래에서는 계속 움직인다", () => {
    const pensionAt = (gross: number) =>
      engine.calcPensionEstimate({
        averageMonthlyIncome: net(gross).taxableMonthly,
        insuredYears: 30,
        claimAge: 65,
      }).estimatedMonthlyPension;
    // 손으로 적은 앵커. 세 연봉 모두 기준소득월액 상한을 넘긴다.
    expect(pensionAt(90_000_000)).toBe(1_357_350);
    expect(pensionAt(100_000_000)).toBe(1_357_350);
    expect(pensionAt(120_000_000)).toBe(1_357_350);
    expect(stepText).toContain("1,357,350원");
    // "언제나 멈춘다"가 아님을 확인한다. 상한 아래에서는 연봉이 오를 때마다 연금도 오른다.
    let previous = 0;
    for (let gross = 20_000_000; gross <= 80_000_000; gross += 5_000_000) {
      const value = pensionAt(gross);
      expect(value, `pension @ ${gross}`).toBeGreaterThan(previous);
      previous = value;
    }
    // 상한 도달 직전과 직후: 반드시 도달 전이 더 작아야 상한이 실제로 걸린 것이다
    expect(pensionAt(80_000_000)).toBeLessThan(pensionAt(90_000_000));
  });

  it("세 단계의 비율이 같은 수라는 주장은 소수점 넷째 자리까지 성립한다", () => {
    const band = bandRetention(50_000_000);
    const raise = engine.calcRaiseImpact({ currentAnnual: 50_000_000, raisePercent: 5 });
    const bonus = engine.calcBonusImpact({ annualSalary: 50_000_000, bonusAmount: 10_000_000 });
    expect(band).toBeCloseTo(raise.annualNetDiff / raise.raiseAmount, 4);
    expect(band).toBeCloseTo(bonus.effectiveBonusRate, 4);
    expect(engine.formatPercent(band)).toBe("76.2%");
    // 다른 연봉대에서는 다르다 — 위 일치가 우연한 상수가 아님
    expect(engine.formatPercent(bandRetention(70_000_000))).toBe("69.6%");
  });

  it("근속 1년을 채워 얻는 순증은 인상분 한 달치를 뺀 값이다", () => {
    const current = net(50_000_000);
    const gain = net(60_000_000).monthlyNet - current.monthlyNet;
    const severance = current.monthlyGross;
    const netSeverance = severance - engine.severanceIncomeTax(severance, 1);
    expect(netSeverance).toBe(4_100_666);
    expect(gain).toBe(635_090);
    // 산문은 "순증 = 퇴직금 − 인상분 한 달치"라고 썼다. 방향과 값을 함께 못 박는다.
    expect(netSeverance - gain).toBe(3_465_576);
    expect(netSeverance).toBeGreaterThan(gain);
    expect(timingText).toContain(won(3_465_576));
  });

  it("실업급여 일액 상한은 평균임금 3,405,000원에서 닿고 그 아래에서는 닿지 않는다", () => {
    expect(engine.unemploymentDailyAllowance(3_405_000).dailyAmount).toBe(engine.UNEMPLOYMENT_DAILY_MAX);
    expect(engine.unemploymentDailyAllowance(3_404_000).dailyAmount).toBeLessThan(
      engine.UNEMPLOYMENT_DAILY_MAX,
    );
    expect(3_405_000 * 12).toBe(40_860_000);
    expect(engine.UNEMPLOYMENT_DAILY_MAX - engine.UNEMPLOYMENT_DAILY_MIN).toBe(2_052);
    expect(timingText).toContain(won(3_405_000));
  });

  it("총 증가액은 실수령 증가와 퇴직급여 적립의 합이고 명목보다 작다", () => {
    const current = net(50_000_000);
    const offer = net(60_000_000);
    const annualNetGain = offer.annualNet - current.annualNet;
    const provisionGain = offer.monthlyGross - current.monthlyGross;
    expect(annualNetGain).toBe(7_621_080);
    expect(provisionGain).toBe(833_334);
    expect(annualNetGain + provisionGain).toBe(8_454_414);
    expect(annualNetGain + provisionGain).toBeLessThan(10_000_000);
    expect(timingText).toContain(won(8_454_414));
  });

  it("총액이 같으면 연 실수령이 원 단위까지 같다 — 갈리는 것은 시점뿐", () => {
    const baseOnly = net(60_000_000);
    const split = net(50_000_000);
    const bonus = engine.calcBonusImpact({ annualSalary: 50_000_000, bonusAmount: 10_000_000 });
    expect(split.annualNet + bonus.netBonus).toBe(baseOnly.annualNet);
    expect(Math.round(bonus.netBonus / 12)).toBe(baseOnly.monthlyNet - split.monthlyNet);
    expect(timingText).toContain(won(baseOnly.annualNet));
  });
});

describe("/guide/resignation", () => {
  const steps = resignationStepAmountsDigest();
  const settlement = resignationSettlementDigest();
  const stepText = prose(steps);
  const settlementText = prose(settlement);

  const daysFor = (years: number) =>
    years >= 10 ? 240 : years >= 5 ? 210 : years >= 3 ? 180 : years >= 1 ? 150 : 120;
  const resources = (years: number) => {
    const estimate = engine.severancePayEstimate(years);
    const daily = engine.unemploymentDailyAllowance(estimate.avgWage).dailyAmount;
    const total = estimate.netSeverance + daily * daysFor(years);
    const premium = engine.regionalHealthEstimate(estimate.avgWage).formerEmployed;
    return { estimate, daily, total, premium };
  };

  it("총재원과 생존 개월의 리터럴, 그리고 보험료가 깎는 폭이 근속에 따라 커진다", () => {
    const five = resources(5);
    expect(five.estimate.netSeverance).toBe(16_284_400);
    expect(five.total).toBe(30_154_480);
    expect(five.premium).toBe(118_635);
    const drop = (years: number) => {
      const row = resources(years);
      return row.total / 2_000_000 - row.total / (2_000_000 + row.premium);
    };
    expect(drop(5)).toBeGreaterThan(0);
    // 산문이 "줄어드는 폭은 근속이 길수록 커진다"라고 쓴 인과
    expect(drop(10)).toBeGreaterThan(drop(5));
    expect(drop(5)).toBeGreaterThan(drop(1));
    expect(stepText).toContain(won(30_154_480));
  });

  it("상여 산입 여부가 만드는 세후 차이는 양수이고 하드코딩 값과 같다", () => {
    const netOf = (monthly: number, years: number) => {
      const gross = monthly * years;
      return gross - engine.severanceIncomeTax(gross, years);
    };
    const included = netOf(3_300_000, 5);
    const excluded = netOf(3_000_000, 5);
    expect(included).toBeGreaterThan(excluded);
    expect(included - excluded).toBe(1_460_400);
    expect(stepText).toContain(won(1_460_400));
  });

  it("퇴직금이 실업급여보다 오래 버티는 것은 근속 5년이고, 근속 1년에서는 뒤집힌다", () => {
    const monthsOf = (years: number) => {
      const row = resources(years);
      return row.estimate.netSeverance / (row.daily * 30);
    };
    expect(monthsOf(5)).toBeGreaterThan(daysFor(5) / 30);
    // 조건절이 공허하지 않다는 확인 — 짧은 근속에서는 실제로 반대다
    expect(monthsOf(1)).toBeLessThan(daysFor(1) / 30);
    expect(monthsOf(5)).toBeCloseTo(8.2, 1);
    expect(monthsOf(1)).toBeCloseTo(1.6, 1);
  });

  it("임의계속과 지역가입의 교차 소득은 경계 앞뒤에서 실제로 부등호가 바뀐다", () => {
    const voluntary = engine.regionalHealthEstimate(net(50_000_000).monthlyGross).formerEmployed;
    expect(voluntary).toBe(149_791);
    expect(engine.regionalHealthEstimate(0).regionalIncomeOnly).toBe(engine.REGIONAL_HEALTH_MIN_MONTHLY);
    expect(engine.regionalHealthEstimate(2_084_000).regionalIncomeOnly).toBeGreaterThanOrEqual(voluntary);
    expect(engine.regionalHealthEstimate(2_083_000).regionalIncomeOnly).toBeLessThan(voluntary);
    expect(stepText).toContain(won(2_084_000));
  });

  it("퇴직 후 20%는 재직 중 5%의 정확히 네 배다", () => {
    const late = engine.unpaidWageInterest(16_500_000, 0.2, 100);
    const employed = engine.unpaidWageInterest(16_500_000, 0.05, 100);
    expect(late).toBe(904_109);
    expect(employed).toBe(226_027);
    expect(late / employed).toBeCloseTo(4, 2);
    expect(stepText).toContain(won(904_109));
  });

  it("실업급여 월액과 같은 실수령을 주는 연봉은 경계 앞뒤에서 확인된다", () => {
    const equivalent = (monthlyTarget: number) => {
      let low = 10_000_000;
      let high = 60_000_000;
      for (let i = 0; i < 60; i += 1) {
        const mid = Math.floor((low + high) / 2);
        if (net(mid).monthlyNet >= monthlyTarget) high = mid;
        else low = mid + 1;
      }
      return high;
    };
    const floorGross = equivalent(engine.UNEMPLOYMENT_DAILY_MIN * 30);
    expect(floorGross).toBe(26_289_324);
    expect(net(floorGross).monthlyNet).toBeGreaterThanOrEqual(engine.UNEMPLOYMENT_DAILY_MIN * 30);
    expect(net(floorGross - 10_000).monthlyNet).toBeLessThan(engine.UNEMPLOYMENT_DAILY_MIN * 30);
    expect(equivalent(engine.UNEMPLOYMENT_DAILY_MAX * 30)).toBe(27_128_328);
    expect(stepText).toContain(won(26_289_324));
  });

  it("연차수당은 근속에 따라 완만하게만 늘고, 그 수당이 환급을 깎는 폭은 3% 미만이다", () => {
    const leave = (years: number) =>
      engine.calcAnnualLeavePay({
        monthlySalary: 3_000_000,
        fixedAllowance: 0,
        monthsWorked: years * 12,
        unusedLeaveDays: 30,
      });
    expect(leave(5).accruedLeaveDays).toBe(17);
    expect(leave(5).dailyOrdinaryWage).toBe(114_832);
    expect(leave(5).totalAllowance).toBe(1_952_144);
    // 근속이 열 배여도 금액은 두 배가 안 된다 — 산문이 "완만하다"라고 쓴 부분
    expect(leave(10).totalAllowance / leave(1).totalAllowance).toBeLessThan(1.3);
    expect(leave(10).totalAllowance).toBeGreaterThan(leave(1).totalAllowance);

    const full = net(50_000_000);
    const settle = (extra: number) => {
      const bundle = engine.calcIncomeTaxBundle({
        annualTaxableIncome: (full.monthlyGross - 200_000) * 6 + extra,
        dependents: 1,
        children: 0,
        monthlyInsuranceTotal: (full.totalInsurance * 6) / 12,
      });
      return bundle.determinedTax + bundle.annualLocalTax;
    };
    const withheld = (full.monthlyIncomeTax + full.monthlyLocalTax) * 6;
    expect(withheld).toBe(1_293_420);
    expect(settle(0)).toBe(188_668);
    expect(withheld - settle(0)).toBe(1_104_752);
    // 환급이 나온다는 방향 자체를 못 박는다
    expect(withheld).toBeGreaterThan(settle(0));
    const drop = settle(1_952_144) - settle(0);
    expect(drop).toBe(49_282);
    expect(drop / 1_952_144).toBeLessThan(0.03);
    expect(settlementText).toContain(won(1_104_752));
    expect(settlementText).toContain(won(49_282));
  });

  it("실업급여 기간에는 목돈이 천천히 줄고, 끝나면 감소 속도가 열 배 넘게 뛴다", () => {
    const five = resources(5);
    const monthlyOut = 2_000_000 + five.premium;
    const monthlyIn = five.daily * 30;
    const drawDown = monthlyOut - monthlyIn;
    // 수급 중에도 적자라는 방향(양수), 그리고 그 폭이 지출보다 훨씬 작다는 관계
    expect(drawDown).toBeGreaterThan(0);
    expect(drawDown).toBe(137_195);
    expect(monthlyOut / drawDown).toBeGreaterThan(10);
    expect(settlementText).toContain(won(137_195));
  });
});

describe("/guide/year-end", () => {
  const steps = yearEndStepValueDigest();
  const ceiling = yearEndCeilingDigest();
  const stepText = prose(steps);
  const ceilingText = prose(ceiling);

  const creditsOf = (gross: number, dependents = 1) => {
    const base = net(gross, { dependents });
    const totalSalary = base.annualTaxableIncome;
    return {
      base,
      totalSalary,
      rent: engine.calcMonthlyRentDeduction({
        annualSalary: totalSalary,
        monthlyRent: 600_000,
        paidMonths: 12,
      }).taxCredit,
      irp: engine.calcIrpTaxCredit({
        annualSalary: totalSalary,
        pensionSavings: 6_000_000,
        irpContribution: 3_000_000,
      }).taxCredit,
    };
  };

  it("결정세액이 0원인 연봉 상단과 그 바로 위 지점이 경계를 이룬다", () => {
    expect(net(17_700_000).determinedTax).toBe(0);
    expect(net(17_800_000).determinedTax).toBe(776);
    expect(net(17_800_000).determinedTax).toBeGreaterThan(net(17_700_000).determinedTax);
    expect(stepText).toContain(won(17_700_000));
  });

  it("소득공제 900만원과 세액공제 900만원은 한 구간에서만 같고, 위에서는 두 배로 벌어진다", () => {
    const low = creditsOf(50_000_000);
    const high = creditsOf(80_000_000);
    const marginalLow = engine.yearEndStandardScenario(50_000_000).marginalRate;
    const marginalHigh = engine.yearEndStandardScenario(80_000_000).marginalRate;
    expect(marginalLow).toBeCloseTo(0.165, 10);
    expect(marginalHigh).toBeCloseTo(0.264, 10);
    // 지방소득세를 양쪽에 같은 방식으로 넣는다 — 한쪽만 넣으면 비교 자체가 거짓이 된다
    expect(Math.floor(9_000_000 * marginalLow)).toBe(Math.floor(low.irp * 1.1));
    expect(Math.floor(9_000_000 * marginalLow)).toBe(1_485_000);
    expect(Math.floor(9_000_000 * marginalHigh)).toBe(2_376_000);
    expect(Math.floor(high.irp * 1.1)).toBe(1_188_000);
    expect(Math.floor(9_000_000 * marginalHigh) / Math.floor(high.irp * 1.1)).toBeCloseTo(2, 2);
    expect(stepText).toContain(won(2_376_000));
  });

  it("두 공제를 다 쓰는 경계 연봉은 앞뒤에서 부등호가 바뀌고, 부양가족이 늘면 올라간다", () => {
    const crossing = (dependents: number) => {
      for (let gross = 20_000_000; gross <= 120_000_000; gross += 100_000) {
        const row = creditsOf(gross, dependents);
        if (row.base.determinedTax >= row.rent + row.irp) return gross;
      }
      return 0;
    };
    expect(crossing(1)).toBe(51_800_000);
    expect(creditsOf(51_800_000).base.determinedTax).toBe(2_581_944);
    expect(creditsOf(51_800_000).rent + creditsOf(51_800_000).irp).toBe(2_574_000);
    expect(creditsOf(51_700_000).base.determinedTax).toBeLessThan(
      creditsOf(51_700_000).rent + creditsOf(51_700_000).irp,
    );
    expect(crossing(2)).toBe(53_500_000);
    expect(crossing(3)).toBe(55_300_000);
    expect(crossing(2)).toBeGreaterThan(crossing(1));
    expect(crossing(3)).toBeGreaterThan(crossing(2));
    // 저연봉 구간에서 사라지는 몫의 방향과 비율
    const low = creditsOf(30_000_000);
    expect(low.rent + low.irp).toBeGreaterThan(low.base.determinedTax);
    expect(low.rent + low.irp - low.base.determinedTax).toBe(2_324_109);
    expect(ceilingText).toContain(won(51_800_000));
    expect(ceilingText).toContain(won(53_500_000));
  });

  it("장려금이 끊기는 연봉과 결정세액이 생기는 연봉 사이에 빈 구간이 없다", () => {
    const single = engine.EITC_BRACKET_TABLE.single;
    const zeroAt = (() => {
      for (let gross = 10_000_000; gross <= 40_000_000; gross += 100_000) {
        if (engine.eitcAmountFor(net(gross).annualTaxableIncome, single) === 0) return gross;
      }
      return 0;
    })();
    expect(zeroAt).toBe(24_400_000);
    // 겹치는 구간이 실제로 존재한다는 관계 (결정세액 시작점 < 장려금 소멸점)
    expect(17_800_000).toBeLessThan(zeroAt);
    expect(engine.eitcAmountFor(net(12_000_000).annualTaxableIncome, single)).toBe(1_573_846);
    expect(net(12_000_000).determinedTax).toBe(0);
    expect(stepText).toContain(won(24_400_000));
  });

  it("부양가족 1인의 값어치가 연봉대에 따라 열두 배 넘게 벌어진다", () => {
    const value = (gross: number) => {
      const one = net(gross);
      const two = net(gross, { dependents: 2 });
      return one.determinedTax + one.annualLocalTax - (two.determinedTax + two.annualLocalTax);
    };
    expect(value(30_000_000)).toBe(45_799);
    expect(value(120_000_000)).toBe(577_500);
    expect(value(120_000_000) / value(30_000_000)).toBeGreaterThan(12);
    expect(ceilingText).toContain(won(577_500));
  });
});

describe("/guide/part-time", () => {
  const digest = partTimeThresholdDigest();
  const text = prose(digest);
  const HOURLY = 10_320;

  it("최저시급 월 환산과 공고 월급의 역산 시급이 하드코딩 값과 같다", () => {
    expect(engine.MONTHLY_HOURS_WITH_HOLIDAY).toBe(208.6);
    expect(engine.wageConversion(HOURLY).monthlyTotal).toBe(2_152_752);
    expect(Math.floor(2_000_000 / 208.6)).toBe(9_587);
    expect(9_587).toBeLessThan(HOURLY);
    expect(text).toContain(won(2_152_752));
  });

  it("주 14시간은 4대보험 기준선은 넘고 주휴 기준선은 넘지 못한다", () => {
    expect(60 / 4.345).toBeCloseTo(13.81, 2);
    expect(14 * 4.345).toBeGreaterThanOrEqual(60);
    expect(13 * 4.345).toBeLessThan(60);
    expect(engine.weeklyHolidayPayForHours(HOURLY, 14).isEligible).toBe(false);
    expect(engine.weeklyHolidayPayForHours(HOURLY, 15).isEligible).toBe(true);
    const netAt = (hours: number) => {
      const pay = engine.weeklyHolidayPayForHours(HOURLY, hours).estimatedMonthlyPay;
      const insurance = engine.calculateSalaryBreakdown({
        grossAnnual: pay * 12,
        nonTaxableMonthly: 0,
        dependents: 1,
        children: 0,
        retirementIncluded: false,
      }).totalInsurance;
      return pay - insurance;
    };
    // 보험료가 늘어도 세후로 유리하다는 방향
    expect(netAt(15)).toBeGreaterThan(netAt(14));
    expect(netAt(15) - netAt(14)).toBe(161_931);
    expect(text).toContain(won(161_931));
  });

  it("5인 미만과 5인 이상의 연장수당 차이가 가산율에서 그대로 나온다", () => {
    const withPremium = Math.floor(HOURLY * 10 * 1.5);
    const flat = HOURLY * 10;
    expect(withPremium - flat).toBe(51_600);
    expect(withPremium / flat).toBeCloseTo(1.5, 10);
    expect(text).toContain(won(51_600));
  });

  it("1년 하루의 연차 26일은 11일과 15일의 합이고 월급을 넘지 않는다", () => {
    expect(engine.getAnnualLeaveDays(11)).toBe(11);
    expect(engine.getAnnualLeaveDays(12)).toBe(15);
    expect(engine.getAnnualLeaveDays(11) + engine.getAnnualLeaveDays(12)).toBe(26);
    const monthly = engine.wageConversion(HOURLY).monthlyTotal;
    const daily = Math.floor((monthly / 209) * 8);
    expect(daily).toBe(82_401);
    expect(26 * daily).toBe(2_142_426);
    // h3가 "월급의 99.5%"라고 단언했다 — 100%를 넘지 않는다는 방향을 못 박는다
    expect(26 * daily).toBeLessThan(monthly);
    expect(engine.formatPercent((26 * daily) / monthly)).toBe("99.5%");
  });

  it("연장수당이 섞인 월급은 나눗셈 하나로 최저임금 판정이 뒤집힌다", () => {
    const naive = Math.floor(2_400_000 / (208.6 + 20));
    const premiumAware = Math.floor(2_400_000 / (208.6 + 20 * 1.5));
    // 산문이 "합법과 위반을 오간다"라고 썼다. 두 방향을 모두 확인한다.
    expect(naive).toBeGreaterThanOrEqual(HOURLY);
    expect(premiumAware).toBeLessThan(HOURLY);
    expect(naive).toBe(10_498);
    expect(premiumAware).toBe(10_058);
    expect(HOURLY - premiumAware).toBe(262);
    expect(text).toContain(won(262));
  });

  it("비과세 식대 한 줄이 만드는 실수령 차이", () => {
    const annual = engine.wageConversion(HOURLY).monthlyTotal * 12;
    const without = net(annual, { nonTaxableMonthly: 0 });
    const withMeal = net(annual);
    expect(withMeal.monthlyNet - without.monthlyNet).toBe(23_906);
    expect((withMeal.monthlyNet - without.monthlyNet) * 12).toBe(286_872);
    expect(without.totalInsurance - withMeal.totalInsurance).toBe(19_435);
    expect(without.totalTax - withMeal.totalTax).toBe(4_471);
    expect(text).toContain(won(286_872));
  });
});

describe("템플릿 방지 — 새 다이제스트의 제목", () => {
  const builders = [
    compareContractShapeDigest,
    compareTimeCostDigest,
    jobChangeStepFindingsDigest,
    jobChangeTimingDigest,
    resignationStepAmountsDigest,
    resignationSettlementDigest,
    yearEndStepValueDigest,
    yearEndCeilingDigest,
    partTimeThresholdDigest,
  ];

  it("h2와 h3가 전부 서로 다르다 — 같은 제목이 두 번 나오면 그 자체가 템플릿 신호다", () => {
    const headings = builders.flatMap((build) => {
      const digest = build();
      return [digest.h2, ...(digest.blocks ?? []).map((block) => block.h3)];
    });
    expect(headings.length).toBeGreaterThanOrEqual(38);
    expect(new Set(headings).size).toBe(headings.length);
    expect(headings.every((heading) => heading.trim().length > 0)).toBe(true);
  });

  it("모든 h3가 숫자나 방향을 담고 있다 — 결론 없는 제목은 목차이지 발견이 아니다", () => {
    const claimWords = /\d|같|다르|크|커|작|없|않|멈|올라|내려|뒤집|갈리|바뀌|넘|미달|남|사라|필요|되돌/;
    for (const build of builders) {
      for (const block of build().blocks ?? []) {
        expect(block.h3).toMatch(claimWords);
      }
    }
  });
});
