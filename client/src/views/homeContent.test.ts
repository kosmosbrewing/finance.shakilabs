import homeViewSource from "@/views/HomeView.vue?raw";
import routerSource from "@/router/index.ts?raw";
import { describe, expect, it } from "vitest";
import {
  HOME_ALL_LINK,
  HOME_H1,
  HOME_HUB_GROUPS,
  HOME_ITEM_LIST,
  HOME_LINKS_AFTER_SECTION,
  HOME_LINKS_H2,
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
