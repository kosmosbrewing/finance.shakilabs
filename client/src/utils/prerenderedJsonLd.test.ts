import { describe, expect, it } from "vitest";
import {
  collectJsonLdTypes,
  filterDuplicateJsonLd,
  PRERENDERED_JSON_LD_SELECTOR,
  readPrerenderedJsonLdTypes,
} from "./prerenderedJsonLd";

function fakeDocument(bodies: (string | null)[]) {
  return {
    querySelectorAll(selector: string) {
      expect(selector).toBe(PRERENDERED_JSON_LD_SELECTOR);
      return bodies.map((textContent) => ({ textContent }));
    },
  };
}

describe("collectJsonLdTypes", () => {
  it("배열의 최상위 @type만 모은다", () => {
    const types = collectJsonLdTypes([
      { "@type": "WebSite" },
      { "@type": "WebApplication" },
      { "@type": "WebPage", mainEntity: { "@type": "ItemList" } },
    ]);

    expect([...types].sort()).toEqual(["WebApplication", "WebPage", "WebSite"]);
  });

  it("@type 배열도 펼친다", () => {
    expect([...collectJsonLdTypes({ "@type": ["WebPage", "FAQPage"] })].sort()).toEqual([
      "FAQPage",
      "WebPage",
    ]);
  });
});

describe("readPrerenderedJsonLdTypes", () => {
  it("프리렌더 블록의 스키마 타입을 가져온다", () => {
    const types = readPrerenderedJsonLdTypes(
      fakeDocument([
        JSON.stringify([
          { "@type": "WebSite" },
          { "@type": "WebApplication" },
          { "@type": "BreadcrumbList" },
        ]),
      ])
    );

    expect(types.has("WebApplication")).toBe(true);
    expect(types.has("BreadcrumbList")).toBe(true);
  });

  it("깨진 JSON은 무시하고 빈 집합을 돌려준다 (클라이언트 스키마가 살아남아야 한다)", () => {
    expect(readPrerenderedJsonLdTypes(fakeDocument(["{oops"])).size).toBe(0);
    expect(readPrerenderedJsonLdTypes(fakeDocument([null, "  "])).size).toBe(0);
  });
});

describe("filterDuplicateJsonLd", () => {
  it("프리렌더가 이미 낸 타입은 클라이언트에서 다시 내지 않는다", () => {
    const entries = [{ "@type": "BreadcrumbList" }, { "@type": "CollectionPage" }];

    expect(filterDuplicateJsonLd(entries, new Set(["BreadcrumbList"]))).toEqual([
      { "@type": "CollectionPage" },
    ]);
  });

  it("프리렌더 블록이 없으면 (SPA 이동·404 라우트) 전부 낸다", () => {
    const entries = [{ "@type": "WebPage" }];
    expect(filterDuplicateJsonLd(entries, new Set())).toEqual(entries);
  });
});
