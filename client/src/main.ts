import { createApp } from "vue";
import { createHead } from "@unhead/vue/client";
import App from "./App.vue";
import router from "./router";
import "./assets/css/main.css";
import "@shakilabs/ui/styles.css";
import "./assets/css/responsive-accessibility.css";
import { initAnalytics } from "./lib/analytics";
import { captureSentryException, initSentry } from "./lib/sentry";
import { reportRuntimeError } from "./lib/runtimeError";
import { removePrerenderFallback } from "./utils/prerenderFallback";

function registerRuntimeHandlers(): void {
  router.onError((error) => {
    reportRuntimeError(error, "router");
    captureSentryException(error, "router");
  });

  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    reportRuntimeError(event.error ?? event.message, "window:error");
    captureSentryException(event.error ?? event.message, "window:error");
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportRuntimeError(event.reason, "window:unhandledrejection");
    captureSentryException(event.reason, "window:unhandledrejection");
  });
}

async function bootstrap(): Promise<void> {
  const app = createApp(App);
  const head = createHead();

  app.config.errorHandler = (error, _instance, info) => {
    reportRuntimeError(error, info);
    captureSentryException(error, info);
  };

  app.use(router);
  app.use(head);
  initSentry(app);
  registerRuntimeHandlers();
  await router.isReady();
  app.mount("#app");
  removePrerenderFallback();

  // GA 초기화를 LCP 이후로 미룸
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => initAnalytics(), { timeout: 4000 });
  } else {
    setTimeout(() => initAnalytics(), 0);
  }
}

void bootstrap().catch((error) => {
  captureSentryException(error, "bootstrap");
  console.error("[bootstrap] failed", error);
});
