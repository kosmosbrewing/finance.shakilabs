import { describe, expect, it } from "vitest";
import {
  buildSalaryRouteQuery,
  parseSalaryRouteState,
} from "@/lib/salaryRouteState";

describe("parseSalaryRouteState", () => {
  it("빈 쿼리에서는 기본값을 반환한다", () => {
    expect(parseSalaryRouteState({})).toEqual({
      annualGross: 30_000_000,
      dependents: 1,
      childrenUnder20: 0,
      nonTaxableMonthly: 200_000,
      retirementIncluded: false,
    });
  });

  it("쿼리 값을 허용 범위 안에서 정수로 복원한다", () => {
    expect(
      parseSalaryRouteState({
        gross: "52000000",
        dep: "3",
        child: "2",
        nontax: "350000",
        retire: "1",
      })
    ).toEqual({
      annualGross: 52_000_000,
      dependents: 3,
      childrenUnder20: 2,
      nonTaxableMonthly: 350_000,
      retirementIncluded: true,
    });
  });

  it("자녀 수는 부양가족 수에 맞춰 보정한다", () => {
    expect(
      parseSalaryRouteState({
        dep: "2",
        child: "5",
      })
    ).toEqual({
      annualGross: 30_000_000,
      dependents: 2,
      childrenUnder20: 1,
      nonTaxableMonthly: 200_000,
      retirementIncluded: false,
    });
  });

  it("잘못된 값은 기본값이나 최소/최대값으로 보정한다", () => {
    expect(
      parseSalaryRouteState({
        gross: "-10",
        dep: "0",
        child: "-1",
        nontax: "99999999",
        retire: "no",
      })
    ).toEqual({
      annualGross: 1,
      dependents: 1,
      childrenUnder20: 0,
      nonTaxableMonthly: 5_000_000,
      retirementIncluded: false,
    });
  });
});

describe("buildSalaryRouteQuery", () => {
  it("기본값은 쿼리에서 생략한다", () => {
    expect(
      buildSalaryRouteQuery({
        annualGross: 30_000_000,
        dependents: 1,
        childrenUnder20: 0,
        nonTaxableMonthly: 200_000,
        retirementIncluded: false,
      })
    ).toEqual({});
  });

  it("변경된 값만 정렬된 쿼리로 직렬화한다", () => {
    expect(
      buildSalaryRouteQuery({
        annualGross: 52_000_000,
        dependents: 3,
        childrenUnder20: 2,
        nonTaxableMonthly: 350_000,
        retirementIncluded: true,
      })
    ).toEqual({
      child: "2",
      dep: "3",
      gross: "52000000",
      nontax: "350000",
      retire: "1",
    });
  });

  it("직렬화 시에도 허용 범위를 유지한다", () => {
    expect(
      buildSalaryRouteQuery({
        annualGross: 999_999_999,
        dependents: 0,
        childrenUnder20: 9,
        nonTaxableMonthly: -1,
        retirementIncluded: false,
      })
    ).toEqual({
      gross: "300000000",
      nontax: "0",
    });
  });
});
