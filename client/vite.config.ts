import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";

import { adLoaderPlugin } from "./scripts/vite-ad-loader";

export default defineConfig(({ mode }) => ({
  test: {
    include: ["src/**/*.test.ts"],
    environmentOptions: {
      // 광고 테스트는 로더 <script>를 실제로 주입한다. happy-dom은 기본적으로
      // 그 src를 네트워크로 가져오려 해서 CI 로그가 NetworkError로 뒤덮인다.
      // 검증 대상은 "무엇이 DOM에 들어갔는가"지 스크립트 실행이 아니다.
      happyDOM: {
        settings: {
          disableJavaScriptFileLoading: true,
          disableJavaScriptEvaluation: true,
        },
      },
    },
  },
  base: "/finance/",
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()],
    },
  },
  plugins: [
    vue(),
    adLoaderPlugin(),
    // 설치형 웹앱. 계산은 전부 클라이언트에서 끝나므로 앱 셸만 있으면 오프라인에서도 돈다.
    //
    // 이 앱은 shakilabs.com/finance/ 아래에 산다. scope·start_url·워커 등록 경로가 전부
    // /finance/ 기준이어야 하고, 다른 앱(/house/ 등)의 요청을 가로채면 안 된다.
    // 게이트: scripts/verify-pwa.mjs + scripts/verify-sw-scope.mjs
    VitePWA({
      // 등록은 src/main.ts에서 직접 한다. 스코프를 소스에 명시해야 "가로채지 않는다"를
      // 코드로 읽고 테스트할 수 있다.
      injectRegister: null,
      registerType: "autoUpdate",
      // dist/manifest.webmanifest -> /finance/manifest.webmanifest
      manifestFilename: "manifest.webmanifest",
      manifest: {
        // 건보료가 대표 계산기다 — 네이버 유입의 대부분이 건보료 질의로 들어온다.
        name: "급여·세금·건보료 계산기",
        short_name: "급여계산기",
        description:
          "2026년 세율 기준 건강보험료·연봉 실수령액·종합소득세를 계산합니다. 계산은 기기 안에서 끝납니다.",
        lang: "ko",
        dir: "ltr",
        start_url: "/finance/",
        scope: "/finance/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#f8fafc",
        // index.html의 --primary(light) hsl(160 62% 24%)와 같은 값.
        // 두 값이 갈리면 verify-pwa.mjs가 red.
        theme_color: "#17634a",
        icons: [
          { src: "/finance/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/finance/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/finance/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // HTML은 프리캐시하지 않는다 (.html 패턴 없음). 이유가 중요하다:
        // vite build가 만든 dist/index.html은 SPA 셸이고, 그 다음 단계인 prerender.mjs가
        // 같은 파일을 프리렌더된 홈으로 덮어쓴다. 셸을 프리캐시하면 워커가 revision이 박제된
        // 옛 셸을 홈 URL에 물려, 크롤러가 받는 본문과 사람이 보는 본문이 갈린다.
        // 하이드레이션 생존율 게이트가 보는 것과 사용자가 보는 것이 달라지는 바로 그 사고다.
        globPatterns: [
          "assets/**/*.{js,css}",
          // v2는 어디서도 참조되지 않는 잔재라 제외한다 — 프리캐시는 설치 시점에
          // 전부 내려받으므로 죽은 자산 하나가 모든 설치자의 데이터를 쓴다.
          "fonts/Pretendard-*.woff2",
          "fonts/GmarketSansBold-subset-v3.woff2",
          "icons/*.png",
          "favicon.png",
          "logo.png",
        ],
        // 같은 이유로 navigation fallback을 두지 않는다. 모든 이동은 아래 network-first가 받는다.
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // 백엔드(댓글·좋아요)는 절대 캐시하지 않는다. 남의 글을 캐시에서 꺼내 보여주거나
            // 내가 쓴 글이 사라진 것처럼 보이는 쪽이 오프라인 지원보다 훨씬 나쁘다.
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
          },
          {
            // 프리렌더 HTML은 콘텐츠가 자주 바뀌므로 network-first.
            // 캐시는 오프라인·네트워크 지연 시의 마지막 수단일 뿐이다.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "finance-pages",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_ID__: JSON.stringify("salary-calculator"),
  },
  server: {
    port: 6202,
    proxy: {
      "/api/finance": {
        target: "http://localhost:6002",
        changeOrigin: true,
      },
    },
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
  esbuild: {
    drop: mode === "production" ? ["debugger"] : [],
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name].[hash][extname]",
        chunkFileNames: "assets/[name].[hash].js",
        entryFileNames: "assets/[name].[hash].js",
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
}));
