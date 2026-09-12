// 설치형 웹앱(PWA)의 런타임 배선 — 워커 등록과 설치 측정.
//
// 스코프가 이 파일의 핵심이다. 이 앱은 shakilabs.com/finance/ 아래에 살고, 같은 오리진에
// 다른 앱들(/house/·/car/ ...)이 함께 있다. 워커 스코프가 넓어지면 내 워커가 남의 앱 요청까지
// 가로채 캐시에서 답한다. 그래서 등록 경로도 스코프도 전부 BASE 기준이고,
// scripts/verify-sw-scope.mjs가 실제 브라우저에서 그 경계를 확인한다.
import { trackEvent } from "@/lib/analytics";

// vite의 base와 같은 값. 하드코딩 대신 번들 시점 값을 그대로 쓴다.
const BASE = import.meta.env.BASE_URL || "/";
const SW_URL = `${BASE}sw.js`;

// beforeinstallprompt는 크롬 계열에만 있고 타입 정의에 없다.
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function displayMode(): string {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "unknown";
  for (const mode of ["standalone", "minimal-ui", "fullscreen"]) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) return mode;
  }
  return "browser";
}

/** 이미 설치된 앱에서 열렸는가 (iOS 사파리는 navigator.standalone). */
export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return displayMode() !== "browser" || iosStandalone === true;
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  // 워커는 배포된 정적 산출물에만 존재한다. dev 서버에서 등록하면 404를 잡는다.
  if (import.meta.env.DEV) return;

  const register = () => {
    navigator.serviceWorker.register(SW_URL, { scope: BASE }).catch((error) => {
      // 워커 실패가 계산기를 막아서는 안 된다. 조용히 포기하고 일반 웹앱으로 계속 돈다.
      console.warn("[pwa] service worker registration failed", error);
    });
  };

  // load를 무조건 기다리면 안 된다. 이 함수는 bootstrap()이 router.isReady()를 await한 뒤에
  // 불리므로, 그 시점에 load가 이미 끝나 있으면 리스너가 영영 발화하지 않는다.
  // (실제로 그랬다 — verify-sw-scope가 "controller null"로 잡았다.)
  if (document.readyState === "complete") {
    register();
    return;
  }
  window.addEventListener("load", register, { once: true });
}

let installPromptTracked = false;

/**
 * 설치 측정. "28일 설치 50건" 판정의 근거다.
 *  - pwa_install_prompt: 브라우저가 설치 가능하다고 판단한 시점(세션 1회)
 *  - pwa_install: 실제로 설치된 시점
 * 파라미터는 PR1 규약을 따른다 — 값·PII 없이 식별자만.
 */
export function initInstallTracking(
  onPromptAvailable?: (event: BeforeInstallPromptEvent) => void,
): void {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (event) => {
    // 기본 미니 인포바를 막고 우리가 고른 시점에 띄운다. 팝업·배너는 만들지 않는다.
    event.preventDefault();
    onPromptAvailable?.(event as BeforeInstallPromptEvent);
    if (installPromptTracked) return;
    installPromptTracked = true;
    trackEvent("pwa_install_prompt", {
      app_id: "finance",
      display_mode: displayMode(),
    });
  });

  window.addEventListener("appinstalled", () => {
    trackEvent("pwa_install", {
      app_id: "finance",
      display_mode: displayMode(),
    });
  });
}
