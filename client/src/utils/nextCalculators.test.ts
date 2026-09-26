// "다음에 할 계산" 분기 규칙 게이트.
//
// 카드 3개는 프리렌더 HTML(크롤러)과 화면(독자) 양쪽에 같은 문장으로 나간다. 규칙이 순수
// 함수가 아니면 두 쪽이 다른 카드를 그리고, 그때는 하이드레이션 생존율이 떨어진 뒤에야 안다.
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { ShNextActions } from "@shakilabs/ui";
import {
  HIGH_FEE_THRESHOLD,
  HIGH_GROSS_THRESHOLD,
  INSURANCE_DEFAULT_STATE,
  NEXT_CALCULATOR_CARDS,
  NEXT_CALCULATORS_HEADING,
  pickNextCalculators,
} from "../../scripts/next-calculators.mjs";
import { CALCULATOR_ROUTES } from "@/utils/calculatorIds";

describe("pickNextCalculators", () => {
  it("직장가입자 기본 결과는 퇴사·피부양자·실수령액 순서다", () => {
    expect(pickNextCalculators({ mode: "insurance", healthInsuranceFee: 140_000, dependents: 1 }))
      .toEqual(["regional-health", "dependent", "salary"]);
  });

  it("부양가족이 있으면 피부양자 질문이 첫 카드로 올라온다", () => {
    expect(pickNextCalculators({ mode: "insurance", healthInsuranceFee: 140_000, dependents: 2 }))
      .toEqual(["dependent", "regional-health", "salary"]);
  });

  it("고액 구간에서는 임의계속 비교가 첫 카드이고 부양가족 수보다 우선한다", () => {
    const high = { mode: "insurance" as const, healthInsuranceFee: HIGH_FEE_THRESHOLD };
    expect(pickNextCalculators(high))
      .toEqual(["regional-health-voluntary", "salary", "comprehensive-tax"]);
    expect(pickNextCalculators({ ...high, dependents: 4 })[0]).toBe("regional-health-voluntary");
    // 경계 바로 아래는 기본 분기로 돌아온다.
    expect(pickNextCalculators({ ...high, healthInsuranceFee: HIGH_FEE_THRESHOLD - 1 })[0])
      .toBe("regional-health");
  });

  it("실수령액 화면은 연봉 구간으로 갈린다", () => {
    expect(pickNextCalculators({ mode: "salary", annualGross: HIGH_GROSS_THRESHOLD - 1 }))
      .toEqual(["insurance", "year-end-settlement", "regional-health"]);
    expect(pickNextCalculators({ mode: "salary", annualGross: HIGH_GROSS_THRESHOLD }))
      .toEqual(["comprehensive-tax", "year-end-settlement", "regional-health"]);
  });

  it("프리렌더가 쓰는 기본 상태는 /insurance 첫 진입 상태와 같다", () => {
    expect(INSURANCE_DEFAULT_STATE.healthInsuranceFee).toBe(140_000);
    expect(pickNextCalculators(INSURANCE_DEFAULT_STATE))
      .toEqual(["regional-health", "dependent", "salary"]);
  });
});

describe("NEXT_CALCULATOR_CARDS", () => {
  it("모든 카드가 실재하는 계산기 라우트를 가리킨다", () => {
    const routes = new Set<string>(CALCULATOR_ROUTES);
    for (const card of Object.values(NEXT_CALCULATOR_CARDS)) {
      expect(routes.has(card.route)).toBe(true);
    }
  });
});

// 화면 블록은 패키지 ShNextActions가 그리고 제목도 패키지 기본값이다. 하이드레이션 때 프리렌더
// 본문은 화면에 같은 제목이 있는 구간만 걷히므로(utils/prerenderFallback.ts), 두 제목이 갈리면
// 프리렌더 카드 목록이 페이지 아래에 한 번 더 붙는다. 패키지를 올릴 때 여기서 먼저 멈춘다.
describe("NEXT_CALCULATORS_HEADING", () => {
  it("프리렌더 구간 제목은 화면 블록(ShNextActions 기본 제목)과 같다", async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(ShNextActions, { items: [] }) }),
    );
    expect(/<h2\b[^>]*>([^<]*)<\/h2>/.exec(html)?.[1]).toBe(NEXT_CALCULATORS_HEADING);
  });
});
