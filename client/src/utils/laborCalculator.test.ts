import { describe, expect, it } from "vitest";
import {
  averageWageWindowDays,
  calculateWeeklyHolidayPay,
  calculateWageConversion,
  calculateSeverancePay,
} from "@/utils/laborCalculator";
import { useRetirementCalc } from "@/composables/useRetirementCalc";

describe("calculateWeeklyHolidayPay", () => {
  it("2026 최저시급 10,320원, 주 5일 8시간 근무", () => {
    const result = calculateWeeklyHolidayPay({
      hourlyWage: 10_320,
      workDaysPerWeek: 5,
      hoursPerDay: 8,
    });
    expect(result.weeklyHours).toBe(40);
    expect(result.isEligible).toBe(true);
    // 주휴수당 = 10,320 × (40/40) × 8 = 82,560
    expect(result.weeklyHolidayPay).toBe(82_560);
    expect(result.weeklyWage).toBe(412_800);
    // 실질 시급 = (412,800 + 82,560) / 40 = 12,384
    expect(result.effectiveHourlyWage).toBe(12_384);
    // 월급 = (412,800 + 82,560) × 4.345 ≈ 2,152,339
    expect(result.estimatedMonthlyPay).toBe(2_152_339);
  });

  it("주 15시간 미만이면 주휴수당 미발생", () => {
    const result = calculateWeeklyHolidayPay({
      hourlyWage: 10_320,
      workDaysPerWeek: 2,
      hoursPerDay: 5,
    });
    expect(result.weeklyHours).toBe(10);
    expect(result.isEligible).toBe(false);
    expect(result.weeklyHolidayPay).toBe(0);
    expect(result.monthlyDifference).toBe(0);
  });

  it("주 3일 5시간 근무 시 주휴수당 발생 (15시간)", () => {
    const result = calculateWeeklyHolidayPay({
      hourlyWage: 10_320,
      workDaysPerWeek: 3,
      hoursPerDay: 5,
    });
    expect(result.weeklyHours).toBe(15);
    expect(result.isEligible).toBe(true);
    // 주휴수당 = 10,320 × (15/40) × 8 = 30,960
    expect(result.weeklyHolidayPay).toBe(30_960);
  });

  it("시급 15,000원 주 6일 4시간", () => {
    const result = calculateWeeklyHolidayPay({
      hourlyWage: 15_000,
      workDaysPerWeek: 6,
      hoursPerDay: 4,
    });
    expect(result.weeklyHours).toBe(24);
    expect(result.isEligible).toBe(true);
    // 주휴수당 = 15,000 × (24/40) × 8 = 72,000
    expect(result.weeklyHolidayPay).toBe(72_000);
  });
});

describe("calculateWageConversion", () => {
  it("시급 10,320원 → 월급 (주휴 포함, 주 40시간)", () => {
    const result = calculateWageConversion({
      base: "hourly",
      amount: 10_320,
      weeklyWorkHours: 40,
      includeWeeklyHoliday: true,
    });
    // 유효 주시간 = 40 + 8 = 48
    expect(result.effectiveWeeklyHours).toBe(48);
    expect(result.hourly).toBe(10_320);
    expect(result.daily).toBe(82_560);
    // 월 = 10,320 × 48 × 4.345 ≈ 2,152,434
    expect(result.monthly).toBeGreaterThan(2_100_000);
    expect(result.annual).toBe(result.monthly * 12);
  });

  it("월급 300만원 → 시급 (주휴 미포함, 주 40시간)", () => {
    const result = calculateWageConversion({
      base: "monthly",
      amount: 3_000_000,
      weeklyWorkHours: 40,
      includeWeeklyHoliday: false,
    });
    // 월시간 = 40 × 4.345 = 173.8
    expect(result.monthlyHours).toBeCloseTo(173.8, 0);
    // 시급 = 3,000,000 / 173.8 ≈ 17,261
    expect(result.hourly).toBeGreaterThan(17_000);
    expect(result.hourly).toBeLessThan(18_000);
  });

  it("연봉 3600만원 → 시급 (주휴 포함)", () => {
    const result = calculateWageConversion({
      base: "annual",
      amount: 36_000_000,
      weeklyWorkHours: 40,
      includeWeeklyHoliday: true,
    });
    // 월급 = 3,000,000, 월시간 = 48 × 4.345 = 208.6
    // 시급 = 3,000,000 / 208.6 ≈ 14,382
    expect(result.hourly).toBeGreaterThan(14_000);
    expect(result.hourly).toBeLessThan(15_000);
    expect(result.annual).toBeCloseTo(36_000_000, -4);
  });
});

describe("averageWageWindowDays", () => {
  it("실제 달력 일수를 센다 (마지막 근무일 2026-08-31 -> 6~8월 = 92일)", () => {
    expect(averageWageWindowDays(new Date("2026-08-31T00:00:00"))).toBe(92);
  });

  it("2월이 끼면 90일 (마지막 근무일 2026-02-28 -> 12~2월 = 90일)", () => {
    expect(averageWageWindowDays(new Date("2026-02-28T00:00:00"))).toBe(90);
  });

  it("월말 넘침을 보정한다 (마지막 근무일 2026-05-30 -> 2/28~5/30 = 92일)", () => {
    expect(averageWageWindowDays(new Date("2026-05-30T00:00:00"))).toBe(92);
  });
});

describe("calculateSeverancePay", () => {
  // lastWorkedDay를 고정해야 결정적: 2026-08-31 퇴사 -> 산정기간 92일
  const AUG_WINDOW = { lastWorkedDay: "2026-08-31" };

  it("1년 근속 월급 300만원 (92일 창)", () => {
    const result = calculateSeverancePay({
      yearsOfService: 1,
      averageMonthlySalary: 3_000_000,
      ...AUG_WINDOW,
    });
    expect(result.isEligible).toBe(true);
    expect(result.windowDays).toBe(92);
    // 1일 평균임금 = floor(9,000,000 / 92) = 97,826 (법정 산식: 실제 총일수로 나눔)
    expect(result.dailyAvgWage).toBe(97_826);
    // 퇴직금 = floor(97,826 × 30 × (365/365)) = 2,934,780
    expect(result.severancePay).toBe(2_934_780);
    expect(result.netSeverancePay).toBeLessThanOrEqual(result.severancePay);
  });

  it("5년 근속 월급 400만원", () => {
    const result = calculateSeverancePay({
      yearsOfService: 5,
      averageMonthlySalary: 4_000_000,
      ...AUG_WINDOW,
    });
    expect(result.isEligible).toBe(true);
    const expectedDailyWage = Math.floor((4_000_000 * 3) / 92);
    expect(result.dailyAvgWage).toBe(expectedDailyWage);
    expect(result.severancePay).toBe(Math.floor(expectedDailyWage * 30 * 5));
  });

  it("1년 미만은 수급요건 미충족", () => {
    const result = calculateSeverancePay({
      yearsOfService: 0,
      averageMonthlySalary: 3_000_000,
      ...AUG_WINDOW,
    });
    expect(result.isEligible).toBe(false);
    expect(result.severancePay).toBe(0);
  });

  it("10년 근속 비교 데이터가 6개", () => {
    const result = calculateSeverancePay({
      yearsOfService: 10,
      averageMonthlySalary: 3_500_000,
      ...AUG_WINDOW,
    });
    expect(result.comparisonData).toHaveLength(6);
    // 1년차 < 10년차
    expect(result.comparisonData[0].amount).toBeLessThan(result.comparisonData[3].amount);
  });

  it("퇴직소득세와 지방소득세가 분리 산출되고 합계·실수령이 정합한다 (고액)", () => {
    const result = calculateSeverancePay({
      yearsOfService: 20,
      averageMonthlySalary: 8_000_000,
      ...AUG_WINDOW,
    });
    expect(result.severanceIncomeTax).toBeGreaterThan(0);
    // 지방소득세 = 퇴직소득세의 10%
    expect(result.severanceLocalTax).toBe(Math.round(result.severanceIncomeTax * 0.1));
    expect(result.severanceTax).toBe(result.severanceIncomeTax + result.severanceLocalTax);
    expect(result.netSeverancePay).toBeLessThan(result.severancePay);
    expect(result.netSeverancePay).toBe(result.severancePay - result.severanceTax);
  });

  it("lastWorkedDay 미지정 시 오늘 기준 창(89~92일)을 쓴다", () => {
    const result = calculateSeverancePay({
      yearsOfService: 3,
      averageMonthlySalary: 3_000_000,
    });
    expect(result.windowDays).toBeGreaterThanOrEqual(89);
    expect(result.windowDays).toBeLessThanOrEqual(92);
  });
});

// 산식 이원화 회귀 게이트: /severance-pay(laborCalculator)와 /quit(useRetirementCalc)이
// 동일 시나리오에서 원 단위까지 같은 값을 내야 한다. 과거 한쪽은 ÷90+지방세 포함,
// 다른쪽은 ÷92+지방세 미포함으로 퇴직금 2.17%·세금 14.8% 차이가 라이브에 나갔다.
describe("severance engine parity: laborCalculator === useRetirementCalc", () => {
  it("동일 시나리오(월 350만·10년·2026-08-31 퇴사)에서 원 단위 일치", () => {
    // 근속 정확히 3,650일(10년): 시작일 = 종료일 - 3,649일 (양끝 포함)
    const end = new Date("2026-08-31T00:00:00");
    const start = new Date(end.getTime() - 3_649 * 24 * 60 * 60 * 1000);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const quit = useRetirementCalc(() => ({
      startDate: iso(start),
      endDate: "2026-08-31",
      monthlySalary: 3_500_000,
      annualBonus: 0,
    })).value;
    expect(quit.serviceDays).toBe(3_650);
    expect(quit.serviceYears).toBe(10);

    const severance = calculateSeverancePay({
      yearsOfService: 10,
      averageMonthlySalary: 3_500_000,
      lastWorkedDay: "2026-08-31",
    });

    expect(severance.windowDays).toBe(quit.windowDays);
    expect(severance.dailyAvgWage).toBe(quit.averageDailyWage);
    expect(severance.severancePay).toBe(quit.severanceGross);
    expect(severance.severanceIncomeTax).toBe(quit.retirementIncomeTax);
    expect(severance.severanceLocalTax).toBe(quit.retirementLocalTax);
    expect(severance.severanceTax).toBe(quit.retirementTax);
    expect(severance.netSeverancePay).toBe(quit.severanceNet);
  });
});
