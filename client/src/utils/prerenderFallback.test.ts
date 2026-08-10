// 이 저장소의 테스트는 DOM 환경 없이 도는 규약이라(jsdom 미설치) 주입한 가짜 root로 검증한다.
// 이 모듈의 회귀 위험은 "셀렉터가 너무 넓어 본문까지 지우는 것"이었으므로 셀렉터 문자열과
// 제거 대상을 직접 못박는다. 실제 브라우저 동작은 빌드의 렌더 패리티 게이트가 따로 검증한다.
import { describe, expect, it, vi } from "vitest";
import {
  PRERENDER_HOST_SELECTOR,
  adoptPrerenderArticle,
  capturePrerenderArticle,
  installPrerenderArticleCleanup,
  removePrerenderChrome,
} from "./prerenderFallback";

function fakeArticle() {
  const h1 = { remove: vi.fn() };
  return {
    node: {
      remove: vi.fn(),
      setAttribute: vi.fn(),
      querySelector: vi.fn(() => h1),
    },
    h1,
  };
}

describe("removePrerenderChrome", () => {
  it("헤더·푸터만 겨냥하고 본문 셀렉터는 건드리지 않는다", () => {
    const header = { remove: vi.fn() };
    const footer = { remove: vi.fn() };
    const root = {
      querySelectorAll: vi.fn(() => [header, footer]),
    } as unknown as ParentNode;

    expect(removePrerenderChrome(root)).toBe(2);
    // 회귀 방지: 예전 셀렉터는 "body > [data-seo-prerender]"라 article까지 지웠다
    expect(root.querySelectorAll).toHaveBeenCalledWith(
      "body > header[data-seo-prerender], body > footer[data-seo-prerender]",
    );
    expect(header.remove).toHaveBeenCalledOnce();
    expect(footer.remove).toHaveBeenCalledOnce();
  });
});

describe("capturePrerenderArticle", () => {
  it("본문을 body에서 떼어내고 중복 h1을 지운 뒤 표식을 남긴다", () => {
    const { node, h1 } = fakeArticle();
    const root = { querySelector: vi.fn(() => node) } as unknown as ParentNode;

    expect(capturePrerenderArticle(root)).toBe(node);
    expect(root.querySelector).toHaveBeenCalledWith(
      "body > article[data-seo-prerender], body > section[data-seo-prerender]",
    );
    expect(node.remove).toHaveBeenCalledOnce();
    expect(h1.remove).toHaveBeenCalledOnce();
    expect(node.setAttribute).toHaveBeenCalledWith("data-prerender-adopted", "");
  });

  it("본문이 없으면 null을 돌려준다", () => {
    const root = { querySelector: vi.fn(() => null) } as unknown as ParentNode;
    expect(capturePrerenderArticle(root)).toBeNull();
  });
});

// 최소 DOM 흉내: 형제 체인 + contains + textContent. 떼어낸(detached) 본문을 다루므로
// isConnected 같은 "문서에 붙어 있는가" 기준을 쓰면 전부 걸러져 dedupe가 통째로 무력화된다
// — 실제로 그렇게 새어 나갔던 버그라 여기서 고정한다.
function buildArticle(spec: Array<[string, string]>) {
  const els = spec.map(([tag, text]) => ({
    tagName: tag.toUpperCase(),
    textContent: text,
    removed: false,
    nextElementSibling: null as unknown,
    remove() {
      this.removed = true;
    },
  }));
  els.forEach((el, i) => (el.nextElementSibling = els[i + 1] ?? null));
  const article = {
    querySelectorAll: (sel: string) =>
      sel.includes("h2") ? els.filter((e) => /^H[234]$/.test(e.tagName)) : els,
    contains: (node: { removed: boolean }) => !node.removed,
    get textContent() {
      return els.filter((e) => !e.removed).map((e) => e.textContent).join(" ");
    },
  };
  return { els, article };
}

function hostFor(renderedHeadings: Array<[string, string]>) {
  const main = {
    querySelectorAll: () =>
      renderedHeadings.map(([tag, text]) => ({ tagName: tag.toUpperCase(), textContent: text })),
  };
  const host = { appendChild: vi.fn(), closest: vi.fn(() => main) };
  return { host, root: { querySelector: vi.fn(() => host) } as unknown as ParentNode };
}

describe("adoptPrerenderArticle", () => {
  it("Vue가 이미 렌더한 구간만 걷어내고 고유 구간은 남긴다", () => {
    const { els, article } = buildArticle([
      ["h2", "기준은 월급이 아니라 평균임금이다"],
      ["p", "평균임금은 퇴직 전 3개월 임금 총액을 총일수로 나눈 값입니다. ".repeat(8)],
      ["h2", "5. 자주 묻는 질문 (FAQ)"],
      ["h3", "퇴직금 수급 조건은 무엇인가요?"],
      ["p", "1년 이상 근속해야 합니다."],
    ]);
    // Vue는 "자주 묻는 질문"만 렌더한다 — 번호와 (FAQ) 접미사는 정규화로 흡수돼야 한다
    const { host, root } = hostFor([["h2", "자주 묻는 질문"]]);

    expect(adoptPrerenderArticle(article as never, root)).toBe(true);
    expect(host.appendChild).toHaveBeenCalledWith(article);
    expect(els[0].removed).toBe(false);
    expect(els[1].removed).toBe(false);
    // FAQ 제목부터 그 아래 h3·p까지 한 구간으로 사라진다
    expect(els.slice(2).every((e) => e.removed)).toBe(true);
  });

  it("전 구간이 Vue와 중복이면 아예 붙이지 않는다", () => {
    const { article } = buildArticle([
      ["h2", "1. 수집하는 정보"],
      ["p", "접속 IP와 User-Agent를 수집합니다."],
      ["h2", "2. 이용 목적"],
      ["p", "서비스 통계에 이용합니다."],
    ]);
    const { host, root } = hostFor([
      ["h2", "수집하는 정보"],
      ["h2", "이용 목적"],
    ]);

    expect(adoptPrerenderArticle(article as never, root)).toBe(false);
    expect(host.appendChild).not.toHaveBeenCalled();
  });

  it("본문이나 호스트가 없으면 조용히 넘어간다", () => {
    const root = { querySelector: vi.fn(() => null) } as unknown as ParentNode;
    expect(adoptPrerenderArticle(null, root)).toBe(false);
    expect(adoptPrerenderArticle({} as never, root)).toBe(false);
    expect(PRERENDER_HOST_SELECTOR).toBe("[data-prerender-host]");
  });
});

describe("installPrerenderArticleCleanup", () => {
  it("진입 라우트에서는 유지하고 벗어나면 버린다", () => {
    const adopted = { remove: vi.fn() };
    const root = { querySelector: vi.fn(() => adopted) } as unknown as ParentNode;
    let hook: ((to: { path: string }) => void) | undefined;
    const router = { afterEach: vi.fn((fn) => (hook = fn)) };

    installPrerenderArticleCleanup(router as never, "/pension", root);

    hook?.({ path: "/pension" });
    expect(adopted.remove).not.toHaveBeenCalled();

    hook?.({ path: "/salary" });
    expect(adopted.remove).toHaveBeenCalledOnce();
    expect(root.querySelector).toHaveBeenCalledWith("[data-prerender-adopted]");
  });
});
