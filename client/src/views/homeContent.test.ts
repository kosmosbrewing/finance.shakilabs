import homeViewSource from "@/views/HomeView.vue?raw";
import routerSource from "@/router/index.ts?raw";
import { describe, expect, it } from "vitest";
import { FOOTER_SECTIONS } from "@/data/footerNav";
import {
  HOME_ALL_LINK,
  HOME_FAQ_H2,
  HOME_FAQS,
  HOME_GUIDE,
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
      HOME_FAQ_H2,
      HOME_GUIDE.h2,
    ];
    expect(extractHeadings(homeHtml, "h2")).toEqual(expected);
  });

  it("홈은 도구 인덱스 화면이다 — 본문 h2가 네 개를 넘지 않는다", () => {
    // 개편 전 홈은 안내 문단마다 h2를 달아 10개였다(프리렌더 9 + 관련 서비스). 그 상태가
    // "인덱스가 아니라 긴 글"의 실제 원인이었으므로, 제목 개수 자체를 게이트로 둔다.
    // 프리렌더 h2 = 퀵계산기 · 도구 인덱스 · FAQ · 종합 가이드.
    expect(extractHeadings(homeHtml, "h2")).toHaveLength(4);
    expect(HOME_SECTIONS).toHaveLength(1);
  });

  it("뷰가 렌더하는 섹션 id가 모두 존재한다", () => {
    const ids = HOME_SECTIONS.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("quick-calc");
    expect(HOME_LINKS_AFTER_SECTION).toBeLessThanOrEqual(HOME_SECTIONS.length);
  });

  it("FAQ 문답은 화면·정적 본문·스키마가 같은 배열에서 나온다", () => {
    expect(HOME_FAQS.length).toBeGreaterThanOrEqual(4);
    for (const faq of HOME_FAQS) {
      expect(homeHtml).toContain(faq.q);
      expect(homeHtml).toContain(faq.a);
    }
    // 질문을 제목 태그로 내보내면 화면(<summary>)에 없는 제목이 정적 HTML에만 생긴다.
    const headings = [
      ...extractHeadings(homeHtml, "h2"),
      ...[...homeHtml.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => m[1].trim()),
    ];
    for (const faq of HOME_FAQS) {
      expect(headings).not.toContain(faq.q);
    }
  });

  it("종합 가이드 절은 h3로 나간다 — h2를 늘리면 안 된다", () => {
    const h3 = [...homeHtml.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => m[1].trim());
    for (const section of HOME_GUIDE.sections) {
      expect(h3).toContain(section.h3);
      expect(homeHtml).toContain(section.body);
    }
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
      homeViewSource.indexOf("<HomeFaqPanel")
    );
    expect(homeViewSource.indexOf("<HomeFaqPanel")).toBeLessThan(
      homeViewSource.indexOf("<HomeSituationGuide")
    );
    expect(homeViewSource).toContain(':intro="HOME_LINKS_INTRO"');
    expect(HOME_LINKS_INTRO.length).toBeGreaterThan(40);
  });

  it("홈 본문은 /salary 본문과 문장을 공유하지 않는다", () => {
    const salaryHtml = buildRichContent("/salary", null) as string;
    const homeParagraphs = new Set([
      ...HOME_SECTIONS.map((section) => section.body),
      ...HOME_GUIDE.sections.map((section) => section.body),
      ...HOME_FAQS.map((faq) => faq.a),
    ]);
    for (const paragraph of homeParagraphs) {
      expect(salaryHtml).not.toContain(paragraph);
    }
    expect(extractHeadings(salaryHtml, "h1")[0]).not.toBe(HOME_H1);
  });

  it("홈에서 걷어낸 안내는 /all에 살아 있다", () => {
    // 이관이 조용히 삭제로 퇴화하는 것을 막는 게이트다. 제목만 옮기고 본문을 흘리면
    // 사이트 전체 자수가 줄고, 그건 이 개편이 절대 하면 안 되는 일이다.
    const allHtml = buildRichContent("/all", null) as string;
    const moved = [
      "계산 근거와 한계",
      "회원가입도, 설치도 없이",
      "자주 찾는 금액은 미리 계산해 두었습니다",
      "여러 계산기를 순서대로 써야 할 때",
      "숫자가 틀리면 알려주세요",
    ];
    for (const heading of moved) {
      expect(allHtml).toContain(heading);
      expect(homeHtml).not.toContain(heading);
    }
  });
});
