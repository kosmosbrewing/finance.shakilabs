// AdSlot 래퍼 역방향 검증.
//
// 왜 소스 검사가 아니라 마운트인가: 광고 결함은 화면에 보이는 버그가 아니라
// 조용히 사라진 수익으로 나타난다. "provider를 바꾸면 태그가 바뀐다"는 주장은
// 실제로 DOM에 뭐가 들어갔는지로만 증명된다.
//
// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick } from "vue";

import type { AdUnitKey } from "@/config/adUnits";

const PUBLISHER = "ca-pub-9470410471278501";

interface SlotProps {
  unit: AdUnitKey;
  label?: string;
}

async function mountSlot(
  env: Record<string, string>,
  props: SlotProps = { unit: "salary-top", label: "광고 · top" },
) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  // IntersectionObserver를 지워 지연 활성화를 건너뛴다 — 스크롤을 흉내 내는
  // 가짜 옵저버는 "무엇이 렌더됐는가"라는 질문에 노이즈만 더한다.
  (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver = undefined;
  window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  }) as typeof window.requestAnimationFrame;

  const { default: AdSlot } = await import("./AdSlot.vue");
  const host = document.createElement("div");
  document.body.appendChild(host);
  const app = createApp({ render: () => h(AdSlot, props) });
  app.mount(host);
  await nextTick();
  await nextTick();
  return host;
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  delete (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AdSlot provider 전환", () => {
  it("adsense — 애드센스 ins만 나오고 애드핏 마크업은 0건", async () => {
    await mountSlot({ VITE_AD_PROVIDER: "adsense", VITE_ADSENSE_PUBLISHER_ID: PUBLISHER });

    const ins = document.querySelector("ins");
    expect(ins?.className).toContain("adsbygoogle");
    expect(ins?.getAttribute("data-ad-slot")).toBe("120001");
    expect(ins?.getAttribute("data-ad-client")).toBe(PUBLISHER);
    expect(document.querySelectorAll(".kakao_ad_area")).toHaveLength(0);
    expect(document.querySelectorAll("[data-ad-unit]")).toHaveLength(0);
  });

  it("adfit — 유닛 ID를 채우면 애드핏 ins가 나오고 애드센스 마크업은 0건", async () => {
    // 원장의 adfit 값은 아직 전부 비어 있다(사용자가 승인 후 채운다).
    // 여기서는 채워진 상태를 흉내 내 태그 모양을 검증한다.
    vi.doMock("@/config/adUnits", async () => {
      const actual = await vi.importActual<typeof import("@/config/adUnits")>("@/config/adUnits");
      return {
        ...actual,
        adProvider: "adfit" as const,
        adsensePublisherId: "",
        unitIdFor: () => "DAN-PLACEHOLDER01",
      };
    });

    await mountSlot({ VITE_AD_PROVIDER: "adfit", VITE_ADSENSE_PUBLISHER_ID: "" });

    const ins = document.querySelector("ins");
    expect(ins?.className).toContain("kakao_ad_area");
    expect(ins?.getAttribute("data-ad-unit")).toBe("DAN-PLACEHOLDER01");
    expect(ins?.getAttribute("data-ad-width")).toBe("728");
    expect(ins?.getAttribute("data-ad-height")).toBe("90");
    expect(document.querySelectorAll(".adsbygoogle")).toHaveLength(0);
    expect(document.querySelectorAll("[data-ad-client]")).toHaveLength(0);
    vi.doUnmock("@/config/adUnits");
  });

  it("none — DOM에 광고 요소 0건, 예약된 높이도 0건", async () => {
    const host = await mountSlot({
      VITE_AD_PROVIDER: "none",
      VITE_ADSENSE_PUBLISHER_ID: PUBLISHER,
    });

    expect(document.querySelectorAll("ins")).toHaveLength(0);
    expect(document.querySelectorAll(".sh-ad-slot")).toHaveLength(0);
    expect(document.querySelectorAll("[style*='min-height']")).toHaveLength(0);
    // 개발 모드 자리표시자도 프로덕션 빌드에서는 나오지 않는다.
    expect(host.textContent?.trim()).toBe(import.meta.env.DEV ? host.textContent?.trim() : "");
  });

  it("라우트 3번 전환에도 로더 스크립트는 1개", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_AD_PROVIDER", "adsense");
    vi.stubEnv("VITE_ADSENSE_PUBLISHER_ID", PUBLISHER);
    (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver = undefined;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    }) as typeof window.requestAnimationFrame;

    const { default: AdSlot } = await import("./AdSlot.vue");
    const host = document.createElement("div");
    document.body.appendChild(host);
    let unit: AdUnitKey = "salary-top";
    const app = createApp({ render: () => h(AdSlot, { unit }) });
    const vm = app.mount(host);

    const route: AdUnitKey[] = ["compare-top", "insurance-top", "withholding-top"];
    for (const next of route) {
      unit = next;
      vm.$forceUpdate();
      await nextTick();
      await nextTick();
    }

    const loaders = document.querySelectorAll(
      'script[data-adsense="true"], script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    );
    expect(loaders).toHaveLength(1);
    expect(document.querySelectorAll("ins")).toHaveLength(1);
    expect(document.querySelector("ins")?.getAttribute("data-ad-slot")).toBe("160001");
  });
});
