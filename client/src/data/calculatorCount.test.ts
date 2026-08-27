import { describe, expect, it } from "vitest";
import { CALCULATOR_COUNT } from "@/data/calculatorCount";
import { FOOTER_SECTIONS } from "@/data/footerNav";
import { CALCULATOR_ROUTES } from "../../scripts/seo-routes.mjs";

// "N개 계산기"는 화면(이 상수)과 정적 산출물(scripts/seo-routes.mjs)에서 각각 계산된다.
// 두 계통이 갈라지면 프리렌더 HTML의 <title>과 하이드레이션 후 document.title이 서로 다른
// 숫자를 말하게 되고, 프리렌더 제목 중복 게이트는 그걸 잡지 못한다(제목이 서로 다르니까).
describe("calculator count", () => {
  it("matches the sitemap-derived calculator route list", () => {
    expect(CALCULATOR_COUNT).toBe(CALCULATOR_ROUTES.length);
  });

  it("links every calculator route from the footer", () => {
    const footerRoutes = FOOTER_SECTIONS.flatMap((section) =>
      section.links.map((link) => link.to),
    );

    expect([...footerRoutes].sort()).toEqual([...CALCULATOR_ROUTES].sort());
  });
});
