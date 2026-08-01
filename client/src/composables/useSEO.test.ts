import { describe, expect, it } from "vitest";
import { normalizeCanonicalUrl } from "@/composables/useSEO";

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
