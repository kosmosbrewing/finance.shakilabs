import homeViewSource from "@/views/HomeView.vue?raw";
import routerSource from "@/router/index.ts?raw";
import { describe, expect, it } from "vitest";
import { FOOTER_SECTIONS } from "@/data/footerNav";
import {
  HOME_ALL_LINK,
  HOME_H1,
  HOME_HUB_GROUPS,
  HOME_ITEM_LIST,
  HOME_LINKS_AFTER_SECTION,
  HOME_LINKS_H2,
  HOME_LINKS_INTRO,
  HOME_PRERENDER_LINKS,
  HOME_SECTIONS,
} from "../../scripts/home-content.mjs";
import { buildRichContent } from "../../scripts/prerender-content.mjs";

function extractHeadings(html: string, tag: "h1" | "h2"): string[] {
  const matches = html.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g"));
  return [...matches].map((match) => match[1].trim());
}

// 홈이 /salary로 리다이렉트되던 시절에는 크롤러가 보는 정적 HTML과 사용자가 보는 화면이 달랐다.
// 아래 테스트가 그 불일치의 재발을 막는다.
describe("home content", () => {
  const homeHtml = buildRichContent("/", null) as string;

  it("프리렌더 홈 본문의 H1은 실제 뷰가 쓰는 제목과 같다", () => {
    expect(extractHeadings(homeHtml, "h1")).toEqual([HOME_H1]);
    expect(homeViewSource).toContain(':title="HOME_H1"');
  });

  it("프리렌더 홈 본문의 H2 순서가 실제 뷰의 섹션 순서와 같다", () => {
    const expected = [
      ...HOME_SECTIONS.slice(0, HOME_LINKS_AFTER_SECTION).map((section) => section.h2),
      HOME_LINKS_H2,
      ...HOME_SECTIONS.slice(HOME_LINKS_AFTER_SECTION).map((section) => section.h2),
    ];
    expect(extractHeadings(homeHtml, "h2")).toEqual(expected);
  });

  it("뷰가 렌더하는 섹션 id가 모두 존재한다", () => {
    const ids = HOME_SECTIONS.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("quick-calc");
    expect(ids).toContain("situations");
    expect(HOME_LINKS_AFTER_SECTION).toBeLessThanOrEqual(HOME_SECTIONS.length);
  });

  it("허브 링크는 모두 라우터에 등록된 경로다", () => {
    const targets = [
      ...HOME_HUB_GROUPS.flatMap((group) => group.items.map((item) => item.to)),
      HOME_ALL_LINK.to,
    ];
    expect(new Set(targets).size).toBe(targets.length);
    for (const target of targets) {
      expect(routerSource).toContain(`path: "${target}"`);
    }
  });

  it("정적 링크 목록과 ItemList 스키마가 같은 카탈로그에서 나온다", () => {
    const hubLabels = HOME_HUB_GROUPS.flatMap((group) =>
      group.items.map((item) => item.label)
    );
    expect(HOME_ITEM_LIST.map((entry) => entry.name)).toEqual([
      ...hubLabels,
      HOME_ALL_LINK.label,
    ]);
    for (const label of hubLabels) {
      expect(HOME_PRERENDER_LINKS.some((link) => link.label === label)).toBe(true);
    }
    for (const link of HOME_PRERENDER_LINKS) {
      expect(link.path.startsWith("/finance/")).toBe(true);
    }
  });

  it("도구 인덱스가 푸터의 계산기 전체를 같은 순서로 담는다", () => {
    // 홈은 "26개 계산기 전체 목록"이라고 말한다. 한 개라도 빠지면 그 말이 거짓이 되고,
    // 새 계산기가 푸터에만 생기고 본문에는 길이 없던 상태(15/26)로 되돌아간다.
    const indexRoutes = HOME_HUB_GROUPS.flatMap((group) =>
      group.items.map((item) => item.to)
    );
    const footerRoutes = FOOTER_SECTIONS.flatMap((section) =>
      section.links.map((link) => link.to)
    );
    expect(indexRoutes).toEqual(footerRoutes);
  });

  it("도구 인덱스는 퀵계산기 바로 다음에 온다", () => {
    // 프리렌더는 HOME_LINKS_AFTER_SECTION으로, 뷰는 템플릿 순서로 같은 순서를 만든다.
    // 둘이 갈라지면 크롤러가 받는 읽기 순서와 사람이 보는 순서가 달라진다.
    expect(HOME_LINKS_AFTER_SECTION).toBe(1);
    expect(homeViewSource.indexOf("<HomeQuickCalc")).toBeLessThan(
      homeViewSource.indexOf("<HomeToolIndex")
    );
    expect(homeViewSource.indexOf("<HomeToolIndex")).toBeLessThan(
      homeViewSource.indexOf("<HomeScenarioChains")
    );
    expect(homeViewSource).toContain(':intro="HOME_LINKS_INTRO"');
    expect(HOME_LINKS_INTRO.length).toBeGreaterThan(40);
  });

  it("홈 본문은 /salary 본문과 문장을 공유하지 않는다", () => {
    const salaryHtml = buildRichContent("/salary", null) as string;
    const homeParagraphs = new Set(
      HOME_SECTIONS.map((section) => section.body)
    );
    for (const paragraph of homeParagraphs) {
      expect(salaryHtml).not.toContain(paragraph);
    }
    expect(extractHeadings(salaryHtml, "h1")[0]).not.toBe(HOME_H1);
  });
});
