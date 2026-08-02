import { describe, expect, it } from "vitest";
import { readClampedInteger, readClampedNumber, syncInputDisplay } from "./numericInput";
import { clampHomeAnnualGross } from "@/composables/useHomeQuickCalc";

// 라이브 재현: 연봉에 1000000 → 10,000,000으로 정정된 뒤, 이어서 5000000을 넣으면
// 보정 결과가 또 10,000,000이라 값이 바뀌지 않는다. Vue는 리렌더하지 않으므로
// 입력창에는 "5000000"이 남고 결과만 1천만원 기준으로 나온다.
describe("readClampedNumber", () => {
  it("하한 밖 값을 연속 입력해도 입력칸이 보정된 값을 보여준다", () => {
    const element = { value: "1000000" };

    expect(readClampedNumber(element, clampHomeAnnualGross)).toBe(10_000_000);
    expect(element.value).toBe("10,000,000");

    element.value = "5000000";
    expect(readClampedNumber(element, clampHomeAnnualGross)).toBe(10_000_000);
    expect(element.value).toBe("10,000,000");
  });

  it("상한 밖 값도 같은 방식으로 동기화된다", () => {
    const element = { value: "400000000" };

    expect(readClampedNumber(element, clampHomeAnnualGross)).toBe(300_000_000);
    expect(element.value).toBe("300,000,000");

    element.value = "500000000";
    expect(readClampedNumber(element, clampHomeAnnualGross)).toBe(300_000_000);
    expect(element.value).toBe("300,000,000");
  });

  it("범위 안 값은 콤마 포맷으로만 정리한다", () => {
    const element = { value: "50000000" };

    expect(readClampedNumber(element, clampHomeAnnualGross)).toBe(50_000_000);
    expect(element.value).toBe("50,000,000");
  });

  it("빈 칸은 지우고 다시 칠 수 있도록 건드리지 않는다", () => {
    const element = { value: "" };

    expect(readClampedNumber(element, clampHomeAnnualGross)).toBeNull();
    expect(element.value).toBe("");
  });

  it("콤마·단위 문자가 있어도 숫자만 가져온다", () => {
    const element = { value: "12,345,678원" };

    expect(readClampedNumber(element, clampHomeAnnualGross)).toBe(12_345_678);
    expect(element.value).toBe("12,345,678");
  });
});

describe("readClampedInteger", () => {
  const clampDependents = (value: number): number =>
    Math.max(1, Math.min(20, Math.floor(value)));

  it("범위 밖 값을 반복 입력해도 표시가 보정된 값을 따라간다", () => {
    const element = { value: "30" };

    expect(readClampedInteger(element, clampDependents)).toBe(20);
    expect(element.value).toBe("20");

    element.value = "99";
    expect(readClampedInteger(element, clampDependents)).toBe(20);
    expect(element.value).toBe("20");
  });

  it("빈 칸은 null을 돌려주고 표시를 유지한다", () => {
    const element = { value: "" };

    expect(readClampedInteger(element, clampDependents)).toBeNull();
    expect(element.value).toBe("");
  });
});

describe("syncInputDisplay", () => {
  it("값이 같으면 DOM을 건드리지 않는다", () => {
    const element = { value: "10,000,000" };
    syncInputDisplay(element, "10,000,000");
    expect(element.value).toBe("10,000,000");
  });

  it("대상이 없으면 조용히 지나간다", () => {
    expect(() => syncInputDisplay(null, "1")).not.toThrow();
  });
});
