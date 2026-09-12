import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
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
  plugins: [vue(), adLoaderPlugin()],
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
