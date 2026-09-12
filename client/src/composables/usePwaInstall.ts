// "홈 화면에 추가" 안내 한 줄의 상태. 배너도 팝업도 아니고, 설치가 실제로 가능할 때만
// 결과 아래에 나타나는 텍스트 한 줄이다.
import { onMounted, readonly, ref } from "vue";
import {
  initInstallTracking,
  isInstalled,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa";
import { trackEvent } from "@/lib/analytics";

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const installed = ref(false);
let initialized = false;

export function usePwaInstall() {
  onMounted(() => {
    installed.value = isInstalled();
    if (initialized) return;
    initialized = true;
    initInstallTracking((event) => {
      deferredPrompt.value = event;
    });
    window.addEventListener("appinstalled", () => {
      installed.value = true;
      deferredPrompt.value = null;
    });
  });

  async function promptInstall(): Promise<void> {
    const event = deferredPrompt.value;
    if (!event) return;
    // 프롬프트는 한 번만 쓸 수 있다 — 먼저 비워야 두 번 눌러 예외가 나지 않는다.
    deferredPrompt.value = null;
    await event.prompt();
    const { outcome } = await event.userChoice;
    trackEvent("pwa_install_prompt_result", { app_id: "finance", outcome });
  }

  return {
    canInstall: readonly(deferredPrompt),
    installed: readonly(installed),
    promptInstall,
  };
}
