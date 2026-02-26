import { computed, ref } from "vue";
import { showAlert } from "./useAlert";
import { formatWon, formatManWon, copyUsingExecCommand } from "@/lib/utils";
import type { SalaryCalcResult } from "./useSalaryCalc";

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (params: Record<string, unknown>) => void;
      };
    };
  }
}

let kakaoSdkPromise: Promise<void> | null = null;

export function useShare(calc: SalaryCalcResult) {
  const showShareModal = ref(false);
  const kakaoBusy = ref(false);
  const shareSummary = computed(() => {
    const parts = [
      `연봉 ${formatManWon(calc.annualGross.value)}`,
      `부양가족 ${calc.dependents.value}명`,
      `자녀 ${calc.childrenUnder20.value}명`,
    ];

    if (calc.nonTaxableMonthly.value > 0) {
      parts.push(`비과세 월 ${formatWon(calc.nonTaxableMonthly.value)}`);
    }
    if (calc.retirementIncluded.value) {
      parts.push("퇴직금 포함");
    }

    parts.push(`월 실수령 ${formatWon(calc.monthlyNet.value)}`);
    return parts.join(" · ");
  });

  function openShare(): void {
    showShareModal.value = true;
  }

  function closeShare(): void {
    showShareModal.value = false;
  }

  function getShareUrl(): string {
    const base = window.location.origin;
    const path = window.location.pathname || "/";
    const params = new URLSearchParams();
    params.set("gross", String(calc.annualGross.value));
    if (calc.dependents.value !== 1) params.set("dep", String(calc.dependents.value));
    if (calc.childrenUnder20.value !== 0) params.set("child", String(calc.childrenUnder20.value));
    if (calc.nonTaxableMonthly.value !== 200_000) params.set("nontax", String(calc.nonTaxableMonthly.value));
    if (calc.retirementIncluded.value) params.set("retire", "1");
    const query = params.toString();
    return query ? `${base}${path}?${query}` : `${base}${path}`;
  }

  function getShareText(): string {
    const retireLabel = calc.retirementIncluded.value ? "· 퇴직금 포함" : "";
    return `연봉 ${formatManWon(calc.annualGross.value)} 실수령액: 월 ${formatWon(calc.monthlyNet.value)} ${retireLabel} (2026년 기준)`;
  }

  async function copyLink(): Promise<void> {
    const shareUrl = getShareUrl();
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (!copyUsingExecCommand(shareUrl)) {
        throw new Error("Clipboard API unavailable");
      }
      showAlert("링크가 복사되었습니다");
    } catch {
      showAlert("링크 복사에 실패했습니다", { type: "error" });
    }
  }

  async function ensureKakaoSdk(): Promise<void> {
    if (window.Kakao) return;
    if (kakaoSdkPromise) return kakaoSdkPromise;

    const key = (import.meta.env.VITE_KAKAO_JS_KEY || "").trim();
    if (!key) throw new Error("KAKAO_JS_KEY not configured");

    kakaoSdkPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]');
      if (existing) {
        if (window.Kakao) {
          resolve();
          return;
        }
        if (existing.dataset.loaded === "true") {
          reject(new Error("Kakao SDK not available after load"));
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Kakao SDK load failed")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
      script.async = true;
      script.dataset.kakaoSdk = "true";
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = () => reject(new Error("Kakao SDK load failed"));
      document.head.appendChild(script);
    }).then(() => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(key);
      }
    }).finally(() => {
      if (!window.Kakao) {
        kakaoSdkPromise = null;
      }
    });

    return kakaoSdkPromise;
  }

  async function shareKakao(): Promise<void> {
    if (kakaoBusy.value) return;
    kakaoBusy.value = true;

    try {
      await ensureKakaoSdk();

      if (!window.Kakao?.Share) {
        throw new Error("Kakao Share not available");
      }

      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: getShareText(),
          description: "2026년 최신 세율 기준 연봉 실수령액 계산기",
          imageUrl: `${window.location.origin}/favicon.png`,
          link: {
            mobileWebUrl: getShareUrl(),
            webUrl: getShareUrl(),
          },
        },
        buttons: [
          {
            title: "내 연봉 계산하기",
            link: {
              mobileWebUrl: getShareUrl(),
              webUrl: getShareUrl(),
            },
          },
        ],
      });
    } catch {
      showAlert("카카오톡 공유에 실패했습니다", { type: "error" });
    } finally {
      kakaoBusy.value = false;
    }
  }

  return {
    showShareModal,
    kakaoBusy,
    shareSummary,
    openShare,
    closeShare,
    shareKakao,
    copyLink,
  };
}
