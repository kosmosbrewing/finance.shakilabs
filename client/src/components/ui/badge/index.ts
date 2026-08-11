import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-caption font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        deduction: "border-transparent bg-deduction text-deduction-foreground",
        highlight: "border-transparent bg-highlight text-highlight-foreground",
        // text-white 하드코딩은 다크에서 밝은 회색 위 흰 텍스트(3.46:1)가 됐다.
        // 토큰 쌍(muted-foreground / background)은 라이트·다크 모두 6.5:1 이상이다.
        neutral: "border-border/50 bg-muted-foreground text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export { default as Badge } from "./Badge.vue";
