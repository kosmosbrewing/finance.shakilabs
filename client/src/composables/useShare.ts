import { computed, ref } from "vue";
import { showAlert } from "./useAlert";
import { formatWon, formatManWon } from "@/lib/utils";
import type { SalaryCalcResult } from "./useSalaryCalc";
import { buildAbsoluteUrl, copyToClipboard } from "@/lib/routeState";

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

type UseShareOptions = {
  getCalc?: () => SalaryCalcResult;
  getShareUrl?: (calc: SalaryCalcResult) => string;
  getShareText?: (calc: SalaryCalcResult) => string;
  getShareSummary?: (calc: SalaryCalcResult) => string;
  getDescription?: (calc: SalaryCalcResult) => string;
  getImageUrl?: (calc: SalaryCalcResult) => string;
  getButtonTitle?: (calc: SalaryCalcResult) => string;
};

export function useShare(calc: SalaryCalcResult, options: UseShareOptions = {}) {
  const showShareModal = ref(false);
  const kakaoBusy = ref(false);
  const resolveCalc = (): SalaryCalcResult => options.getCalc?.() ?? calc;
  const shareSummary = computed(() => {
    const currentCalc = resolveCalc();
    if (options.getShareSummary) {
      return options.getShareSummary(currentCalc);
    }

    const parts = [
      `연봉 ${formatManWon(currentCalc.annualGross.value)}`,
      `부양가족 ${currentCalc.dependents.value}명`,
      `자녀 ${currentCalc.childrenUnder20.value}명`,
    ];

    if (currentCalc.nonTaxableMonthly.value > 0) {
      parts.push(`비과세 월 ${formatWon(currentCalc.nonTaxableMonthly.value)}`);
    }
    if (currentCalc.retirementIncluded.value) {
      parts.push("퇴직금 포함");
    }

    parts.push(`월 실수령 ${formatWon(currentCalc.monthlyNet.value)}`);
    return parts.join(" · ");
  });

  function openShare(): void {
    showShareModal.value = true;
  }

  function closeShare(): void {
    showShareModal.value = false;
  }

  function getShareUrl(): string {
    const currentCalc = resolveCalc();
    if (options.getShareUrl) {
      return options.getShareUrl(currentCalc);
    }

    const path = window.location.pathname || "/";
    return buildAbsoluteUrl(path, {
      gross: currentCalc.annualGross.value,
      dep: currentCalc.dependents.value !== 1 ? currentCalc.dependents.value : null,
      child: currentCalc.childrenUnder20.value !== 0 ? currentCalc.childrenUnder20.value : null,
      nontax:
        currentCalc.nonTaxableMonthly.value !== 200_000
          ? currentCalc.nonTaxableMonthly.value
          : null,
      retire: currentCalc.retirementIncluded.value ? 1 : null,
    });
  }

  function getShareText(): string {
    const currentCalc = resolveCalc();
    if (options.getShareText) {
      return options.getShareText(currentCalc);
    }

    const retireLabel = currentCalc.retirementIncluded.value ? "· 퇴직금 포함" : "";
    return `연봉 ${formatManWon(currentCalc.annualGross.value)} 실수령액: 월 ${formatWon(currentCalc.monthlyNet.value)} ${retireLabel} (2026년 기준)`;
  }

  function getShareDescription(): string {
    const currentCalc = resolveCalc();
    return options.getDescription?.(currentCalc) ?? "2026년 최신 세율 기준 연봉 실수령액 계산기";
  }

  function getShareImageUrl(): string {
    const currentCalc = resolveCalc();
    return options.getImageUrl?.(currentCalc) ?? `${window.location.origin}/favicon.png`;
  }

  function getShareButtonTitle(): string {
    const currentCalc = resolveCalc();
    return options.getButtonTitle?.(currentCalc) ?? "내 연봉 계산하기";
  }

  async function copyLink(): Promise<void> {
    const shareUrl = getShareUrl();
    const copied = await copyToClipboard(shareUrl);
    try {
      if (!copied) {
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
          description: getShareDescription(),
          imageUrl: getShareImageUrl(),
          link: {
            mobileWebUrl: getShareUrl(),
            webUrl: getShareUrl(),
          },
        },
        buttons: [
          {
            title: getShareButtonTitle(),
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
