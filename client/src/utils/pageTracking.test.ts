import { describe, expect, it } from "vitest";
import {
  buildPublicPagePath,
  getPageGroup,
  shouldTrackPageView,
} from "@/utils/pageTracking";

describe("pageTracking", () => {
  it("공개 서비스 경로를 앱 내부 경로에 붙인다", () => {
    expect(buildPublicPagePath("/finance/", "/insurance/250000?mode=reverse")).toBe(
      "/finance/insurance/250000",
    );
    expect(buildPublicPagePath("finance", "/")).toBe("/finance");
  });

  it("숫자 상세 경로와 쿼리를 같은 계산기 그룹으로 분류한다", () => {
    expect(getPageGroup("/insurance/250000?dep=2")).toBe("insurance");
    expect(getPageGroup("/")).toBe("home");
  });

  it("첫 진입과 계산기 변경만 페이지뷰로 집계한다", () => {
    expect(shouldTrackPageView("/insurance", "/", false)).toBe(true);
    expect(shouldTrackPageView("/insurance/250000", "/insurance", true)).toBe(false);
    expect(shouldTrackPageView("/insurance?dep=2", "/insurance", true)).toBe(false);
    expect(shouldTrackPageView("/salary", "/insurance", true)).toBe(true);
  });
});
