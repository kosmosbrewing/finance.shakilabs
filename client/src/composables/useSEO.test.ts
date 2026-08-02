import { describe, expect, it } from "vitest";
import { buildJsonLdScripts, normalizeCanonicalUrl } from "@/composables/useSEO";

// 라이브 확인: 하이드레이션 뒤 `<script type="application/ld+json" children="{...}">`처럼
// 본문이 빈 블록이 생겼다. unhead v2는 script 본문을 textContent/innerHTML로만 렌더하고
// 그 밖의 키는 HTML 속성으로 내보내기 때문이다.
describe("buildJsonLdScripts", () => {
  it("스키마를 script 본문(textContent)으로 넘긴다", () => {
    const [script] = buildJsonLdScripts([{ "@type": "BreadcrumbList" }]);

    expect(script.type).toBe("application/ld+json");
    expect(script.textContent).toBe('{"@type":"BreadcrumbList"}');
    expect(JSON.parse(script.textContent)).toEqual({ "@type": "BreadcrumbList" });
  });

  it("unhead가 속성으로 해석하는 children 키를 쓰지 않는다", () => {
    const [script] = buildJsonLdScripts([{ "@type": "WebPage" }]);

    expect(Object.keys(script).sort()).toEqual(["key", "textContent", "type"]);
  });

  it("여러 스키마는 키가 충돌하지 않게 분리된다", () => {
    const scripts = buildJsonLdScripts([{ "@type": "WebSite" }, { "@type": "WebPage" }]);

    expect(scripts.map((script) => script.key)).toEqual(["json-ld-0", "json-ld-1"]);
  });
});

// 홈(/finance)은 라우터 base가 "/finance/"라 주소창에 끝 슬래시가 남는다.
// vercel.json은 trailingSlash:false라 "/finance/"는 308 대상이므로 canonical이 그 주소를
// 가리키면 안 된다(리다이렉트되는 canonical).
describe("normalizeCanonicalUrl", () => {
  it("홈의 끝 슬래시를 잘라 프리렌더 canonical과 같은 주소를 만든다", () => {
    expect(normalizeCanonicalUrl("https://shakilabs.com/finance/")).toBe(
      "https://shakilabs.com/finance"
    );
  });

  it("쿼리와 해시를 제거한다", () => {
    expect(
      normalizeCanonicalUrl("https://shakilabs.com/finance/salary?gross=60000000#result")
    ).toBe("https://shakilabs.com/finance/salary");
  });

  it("슬래시가 없는 주소는 그대로 둔다", () => {
    expect(normalizeCanonicalUrl("https://shakilabs.com/finance/salary")).toBe(
      "https://shakilabs.com/finance/salary"
    );
  });

  it("오리진 루트는 슬래시를 유지한다", () => {
    expect(normalizeCanonicalUrl("https://shakilabs.com/")).toBe("https://shakilabs.com/");
  });

  it("파싱할 수 없는 주소는 쿼리·해시만 잘라 반환한다", () => {
    expect(normalizeCanonicalUrl("not a url?x=1#y")).toBe("not a url");
  });
});
