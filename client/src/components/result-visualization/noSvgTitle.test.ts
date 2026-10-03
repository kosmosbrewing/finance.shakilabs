import { describe, expect, it } from "vitest";

// SVG <title>은 네이버 서치어드바이저가 문서 <title> 중복으로 센다("title 요소 2개 이상" 61페이지, 2026-10-01).
// 공용 패키지는 0.3.42에서 지웠고, 앱 자체 차트(도넛)가 마지막으로 남아 있었다 — 렌더 후에만 생겨 빌드 HTML 검사로는 못 잡는다.
const vueSources = import.meta.glob("/src/**/*.vue", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

describe("앱 컴포넌트는 SVG <title>을 쓰지 않는다", () => {
  it("템플릿 어디에도 <title 요소가 없다(주석 제외)", () => {
    const offenders = Object.entries(vueSources)
      .filter(([, source]) => {
        const template = source.slice(source.indexOf("<template>")).replace(/<!--[\s\S]*?-->/g, "");
        return /<title[\s>]/.test(template);
      })
      .map(([file]) => file);
    expect(Object.keys(vueSources).length).toBeGreaterThan(50);
    expect(offenders).toEqual([]);
  });
});
