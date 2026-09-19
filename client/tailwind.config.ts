import animate from "tailwindcss-animate";
import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  prefix: "",
  content: ["./index.html", "./src/**/*.{ts,vue}"],
  theme: {
    // Tailwind `container`는 더 이상 뷰에서 쓰지 않는다. 본문 폭은 @shakilabs/ui 0.3.31의
    // 역할 컨테이너가 정한다(v3 §2.7): 계산기 `--tool` 72rem · 홈/허브 `--page` 64rem ·
    // 약관/가이드 산문 `--prose` 42rem. 한 폭(1184px)으로 뭉개 두면 26개 목록 페이지와
    // 이용약관이 같은 줄길이를 갖는다. 정의만 남겨 두는 이유는 서드파티 마크업 대비다.
    container: {
      center: true,
      padding: "1rem",
      screens: {
        xl: "1184px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "Pretendard",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          ...fontFamily.sans,
        ],
        title: [
          "GmarketSans",
          "Pretendard",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          ...fontFamily.sans,
        ],
        brand: [
          "GmarketSans",
          "Pretendard",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          ...fontFamily.sans,
        ],
      },

      fontSize: {
        display: ["1.625rem", { lineHeight: "1.2", fontWeight: "700" }],
        h1: ["1.25rem", { lineHeight: "1.3", fontWeight: "700" }],
        heading: ["1rem", { lineHeight: "1.35", fontWeight: "600" }],
        body: ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["0.8125rem", { lineHeight: "1.45", fontWeight: "400" }],
        tiny: ["0.6875rem", { lineHeight: "1.35", fontWeight: "400" }],
      },

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // v3 §2.1 의미색 4종만 남긴다. 로컬 별칭(deduction·highlight)과 5번째 단계(caution)는
        // 브랜드/의미 구분을 흐려 폐기했다 — 사용처는 status-* 또는 중성으로 옮겼다.
        status: {
          success: "hsl(var(--status-success))",
          warning: "hsl(var(--status-warning))",
          danger: "hsl(var(--status-danger))",
          info: "hsl(var(--status-info))",
        },
        chart: {
          net: "hsl(var(--chart-net))",
          pension: "hsl(var(--chart-pension))",
          health: "hsl(var(--chart-health))",
          care: "hsl(var(--chart-care))",
          employment: "hsl(var(--chart-employment))",
          tax: "hsl(var(--chart-tax))",
          localTax: "hsl(var(--chart-local-tax))",
        },
      },

      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "collapsible-down": {
          from: { height: 0 },
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-in-out",
        "collapsible-up": "collapsible-up 0.2s ease-in-out",
      },
    },
  },
  plugins: [animate],
};

export default config;
