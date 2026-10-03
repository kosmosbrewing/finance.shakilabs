import { describe, expect, it } from "vitest";
import {
  APP_NAME,
  APP_NAME_ROUTES,
  BRAND_SUFFIX,
  PAGE_TITLES,
  PAGE_TITLE_MAX_CHARS,
  brandTitle,
  compareVariantTitle,
} from "../../scripts/page-titles.mjs";
import { COMPARE_PAIRS, SITEMAP_ROUTES } from "../../scripts/seo-routes.mjs";

// 제목 레시피(함대 공통, 2026-10-03): 계산기·가이드 `<페이지 제목> | ShakiLabs`,
// 홈 `<앱 이름> | ShakiLabs`, 허브·정책 `<페이지 제목> · <앱 이름> | ShakiLabs`.
// 산출물 전수 검사는 validate-static-output이 하고, 여기서는 단일 소스 자체가 레시피를 지키는지 본다.
describe("brandTitle", () => {
  it("브랜드 접미사를 정확히 한 번 붙인다", () => {
    expect(brandTitle("연봉 인상률 계산기")).toBe("연봉 인상률 계산기 | ShakiLabs");
  });

  it("이미 붙은 접미사는 중복으로 붙이지 않는다(뷰·라우터·프리렌더가 겹쳐 불러도 1회)", () => {
    const once = brandTitle("연봉 인상률 계산기");
    expect(brandTitle(once)).toBe(once);
    expect(brandTitle("연봉 인상률 계산기 | ShakiLabs | ShakiLabs")).toBe(once);
  });

  it("빈 제목은 앱 이름 제목이 된다", () => {
    expect(brandTitle("")).toBe(`${APP_NAME}${BRAND_SUFFIX}`);
  });
});

describe("PAGE_TITLES", () => {
  it("사이트맵의 모든 라우트가 제목을 가진다", () => {
    // 근로장려금 가구 유형 3페이지는 사이트맵에 있지만 제목은 eitcVariantTitle이 만든다
    const householdVariant = /^\/eitc\/(single|single-income|double-income)$/;
    for (const route of SITEMAP_ROUTES) {
      if (householdVariant.test(route)) continue;
      expect(PAGE_TITLES[route], route).toBeTruthy();
    }
  });

  it("가운데 세그먼트가 없고 페이지 제목은 40자 이하다", () => {
    const appSuffix = ` · ${APP_NAME}`;
    for (const [route, title] of Object.entries(PAGE_TITLES)) {
      expect(title, route).not.toContain("|");
      const head = APP_NAME_ROUTES.includes(route) ? title.slice(0, -appSuffix.length) : title;
      expect(head.length, `${route}: ${head}`).toBeLessThanOrEqual(PAGE_TITLE_MAX_CHARS);
    }
  });

  it("앱 이름은 홈·허브·정책 페이지에만 붙는다", () => {
    expect(PAGE_TITLES["/"]).toBe(APP_NAME);
    for (const [route, title] of Object.entries(PAGE_TITLES)) {
      if (route === "/") continue;
      if (APP_NAME_ROUTES.includes(route)) {
        expect(title.endsWith(` · ${APP_NAME}`), route).toBe(true);
      } else {
        expect(title, route).not.toContain(APP_NAME);
      }
    }
  });

  it("가장 긴 이직 비교 프리셋도 40자 안에 든다", () => {
    for (const [a, b] of COMPARE_PAIRS) {
      expect(compareVariantTitle(a, b).length).toBeLessThanOrEqual(PAGE_TITLE_MAX_CHARS);
    }
  });
});
