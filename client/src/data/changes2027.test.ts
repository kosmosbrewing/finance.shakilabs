import routerSource from "@/router/index.ts?raw";
import { describe, expect, it } from "vitest";
import { EITC_2026 } from "@/data/eitc";
import {
  CHANGE_AREAS,
  CHANGE_SOURCES,
  CHANGE_STATUSES,
  CHANGES_2027,
  CHANGES_2027_FAQS,
  CHANGES_2027_META,
  CHANGES_2027_VERIFIED_AT,
  changeCalcHref,
  changesStatusSummary,
} from "../../scripts/changes-2027.mjs";
import { buildChanges2027Html } from "../../scripts/prerender-changes.mjs";
import { MIN_WAGE_HOURLY as MIN_WAGE_HOURLY_2026 } from "../../scripts/hub-digests-guides.mjs";
import { SEO_ROUTES, SITEMAP_ROUTES, CALCULATOR_ROUTES } from "../../scripts/seo-routes.mjs";

// 다른 앱 계산기 경로 — 2026-09-25 각 저장소 origin/main 라우터에서 실존 확인.
// 앱 라우트가 바뀌면 여기서 먼저 깨진다(깨진 링크를 라이브에 내보내지 않는다).
const OTHER_APP_ROUTES: Record<string, readonly string[]> = {
  baby: ["/first-meeting", "/child-allowance"],
  house: ["/holding-tax", "/capital-gains-tax"],
  invest: ["/isa"],
  car: ["/ev-vs-gas"],
};

const won = (value: number) => value.toLocaleString("ko-KR");
const manwon = (value: number) => `${won(value / 10_000)}만`;
const textOf = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, "");

describe("2027 달라지는 것 — 레지스트리", () => {
  it("항목마다 필수 칸이 차 있고 id가 겹치지 않는다", () => {
    const ids = CHANGES_2027.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    const areas = new Set(CHANGE_AREAS.map((area) => area.id));
    for (const item of CHANGES_2027) {
      expect(areas.has(item.area), item.id).toBe(true);
      expect(Object.keys(CHANGE_STATUSES)).toContain(item.status);
      expect(Object.keys(CHANGE_SOURCES)).toContain(item.source);
      for (const field of [item.title, item.line, item.before, item.after, item.target, item.effective]) {
        expect(field.trim().length, item.id).toBeGreaterThan(0);
      }
    }
  });

  it("한 줄 요약은 한 문장 30~60자 — 글자 최소 요구와 수화 생존 게이트(30자 문장)를 함께 만족", () => {
    for (const item of CHANGES_2027) {
      const length = [...item.line].length;
      expect(length, `${item.id}: ${length}자`).toBeGreaterThanOrEqual(30);
      expect(length, `${item.id}: ${length}자`).toBeLessThanOrEqual(60);
      expect(item.line.endsWith("."), item.id).toBe(true);
      expect(item.line.slice(0, -1).includes(". "), `${item.id}: 한 문장`).toBe(false);
    }
  });

  it("확인일은 미래가 아니다 — 한국 시간 기준(CI는 UTC라 하루 어긋나지 않게)", () => {
    // 2026-09-25에 26일로 적어 라이브에 "아직 오지 않은 날 확인"이 나갈 뻔했다
    const todayKst = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
    expect(CHANGES_2027_VERIFIED_AT <= todayKst, `${CHANGES_2027_VERIFIED_AT} > ${todayKst}`).toBe(true);
  });

  it("보조 출처도 등록된 1차 출처다", () => {
    for (const item of CHANGES_2027) {
      for (const id of item.alsoSources ?? []) expect(Object.keys(CHANGE_SOURCES), item.id).toContain(id);
      expect(item.alsoSources ?? []).not.toContain(item.source);
    }
  });

  it("출처는 1차 출처 URL과 게시일을 갖고, 확인일은 출처보다 늦다", () => {
    for (const source of Object.values(CHANGE_SOURCES)) {
      expect(source.url).toMatch(/^https:\/\/(www\.)?(mofe|moel|korea|mohw)\.(go|kr)/);
      expect(source.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(source.date <= CHANGES_2027_VERIFIED_AT).toBe(true);
    }
  });

  it("계산 링크는 실존하는 라우트로만 간다", () => {
    for (const item of CHANGES_2027) {
      if (!item.calc) continue;
      if (item.calc.app === "finance") {
        expect(SEO_ROUTES, item.id).toContain(item.calc.path);
      } else {
        expect(OTHER_APP_ROUTES[item.calc.app] ?? [], item.id).toContain(item.calc.path);
        expect(changeCalcHref(item)).toBe(`https://shakilabs.com/${item.calc.app}${item.calc.path}`);
      }
    }
  });

  it("현행 수치는 finance 계산기 상수와 같다 — 두 곳이 갈라지면 여기서 깨진다", () => {
    const eitc = CHANGES_2027.find((item) => item.id === "eitc")!;
    expect(eitc.before).toContain(`${manwon(EITC_2026.single.phaseOutEnd)} 원 미만·최대 ${manwon(EITC_2026.single.maxAmount)} 원`);
    expect(eitc.before).toContain(`홑벌이 ${manwon(EITC_2026.singleIncome.phaseOutEnd)}·${manwon(EITC_2026.singleIncome.maxAmount)}`);
    expect(eitc.before).toContain(`맞벌이 ${manwon(EITC_2026.doubleIncome.phaseOutEnd)}·${manwon(EITC_2026.doubleIncome.maxAmount)}`);

    const minWage = CHANGES_2027.find((item) => item.id === "min-wage")!;
    expect(minWage.before).toBe(`시간당 ${won(MIN_WAGE_HOURLY_2026)}원 · 월 ${won(MIN_WAGE_HOURLY_2026 * 209)}원`);
    // 2027년 고시: 10,700원 · 월 209시간
    expect(minWage.after).toBe(`시간당 ${won(10_700)}원 · 월 ${won(10_700 * 209)}원`);
    expect(minWage.line).toContain(`${won(10_700 - MIN_WAGE_HOURLY_2026)}원`);
  });

  it("확정 표시는 법·고시가 끝난 항목에만 — 정부안을 확정처럼 쓰지 않는다", () => {
    const passed = CHANGES_2027.filter((item) => item.status === "passed").map((item) => item.id);
    expect(passed.sort()).toEqual(["child-allowance-age", "first-pension", "min-wage"]);
    expect(changesStatusSummary()).toBe(
      `마지막 확인 ${CHANGES_2027_VERIFIED_AT.replaceAll("-", ".")} · 확정 3개 · 국회 심의 중 ${CHANGES_2027.length - 3}개`,
    );
  });

  it("라우터 경로 리터럴이 레지스트리 경로와 같다(정적 검증기는 리터럴만 읽는다)", () => {
    expect(routerSource).toContain(`path: "${CHANGES_2027_META.path}"`);
  });

  it("안내 페이지는 사이트맵에 들어가되 계산기 수에는 들지 않는다", () => {
    expect(SITEMAP_ROUTES).toContain(CHANGES_2027_META.path);
    expect(CALCULATOR_ROUTES).not.toContain(CHANGES_2027_META.path);
  });
});

describe("2027 달라지는 것 — 프리렌더 본문", () => {
  const html = buildChanges2027Html(CHANGES_2027_META.path)!;

  it("다른 라우트에는 본문을 만들지 않는다", () => {
    expect(buildChanges2027Html("/all")).toBeNull();
  });

  it("화면이 그리는 모든 문장을 담고, 사이트맵 최소 본문(1,500자)을 넘는다", () => {
    const text = textOf(html);
    for (const item of CHANGES_2027) {
      for (const field of [item.title, item.line, item.before, item.after, item.target, item.effective, ...(item.details ?? [])]) {
        expect(text, `${item.id}: ${field.slice(0, 20)}`).toContain(field.replace(/\s+/g, ""));
      }
    }
    for (const faq of CHANGES_2027_FAQS) expect(text).toContain(faq.a.replace(/\s+/g, ""));
    expect(text.length).toBeGreaterThan(1500);
  });

  it("뷰가 그리는 구간은 전부 미러 표식 — 수화 뒤 두 번 보이지 않는다", () => {
    const sections = html.match(/<section\b[^>]*>/g) ?? [];
    expect(sections.length).toBe(CHANGE_AREAS.length + 1);
    for (const tag of sections) expect(tag).toContain("data-prerender-mirror");
  });

  it("같은 앱 링크는 /finance 접두어, 다른 앱은 절대 URL", () => {
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    for (const href of hrefs) {
      expect(href.startsWith("/finance/") || href.startsWith("https://"), href).toBe(true);
    }
  });
});
