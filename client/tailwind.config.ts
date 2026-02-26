import animate from "tailwindcss-animate";
import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  prefix: "",
  content: ["./index.html", "./src/**/*.{ts,vue}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        xl: "960px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "Pretendard",
          "Inter",
          "Noto Sans KR",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          ...fontFamily.sans,
        ],
        title: [
          "Inter",
          "Pretendard",
          "Noto Sans KR",
          ...fontFamily.sans,
        ],
        emphasis: [
          "Inter",
          "Pretendard",
          "Noto Sans KR",
          ...fontFamily.sans,
        ],
      },

      fontSize: {
        h1: ["1.5rem", { lineHeight: "1.3", fontWeight: "700" }],
        h2: ["1.25rem", { lineHeight: "1.35", fontWeight: "600" }],
        heading: ["1.1875rem", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        caption: ["0.875rem", { lineHeight: "1.55", fontWeight: "400" }],
        tiny: ["0.75rem", { lineHeight: "1.35", fontWeight: "400" }],
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
        // 급여 계산기 전용 색상
        deduction: {
          DEFAULT: "hsl(var(--deduction))",
          foreground: "hsl(var(--deduction-foreground))",
        },
        highlight: {
          DEFAULT: "hsl(var(--highlight))",
          foreground: "hsl(var(--highlight-foreground))",
        },
        status: {
          success: "hsl(var(--status-success))",
          warning: "hsl(var(--status-warning))",
          caution: "hsl(var(--status-caution))",
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
