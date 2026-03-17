<script setup lang="ts">
import type { Component } from "vue";
import { ArrowRight, Building2, CreditCard, TrendingUp } from "lucide-vue-next";

type RelatedServiceItem = {
  title: string;
  description: string;
  href: string;
  icon: Component;
};

const items: RelatedServiceItem[] = [
  {
    title: "주유 할인카드 비교",
    description: "월 고정지출이 큰 주유비를 카드 혜택 기준으로 바로 비교합니다.",
    href: "https://card.shakilabs.com/fuel-card",
    icon: CreditCard,
  },
  {
    title: "개인 vs 법인 비교",
    description: "사업자로 전환할 때 세후소득과 세금 차이를 함께 봅니다.",
    href: "https://biz.shakilabs.com/individual-vs-corp",
    icon: Building2,
  },
  {
    title: "배당소득세 계산",
    description: "월급 외 투자수익까지 고려해 세후 현금흐름을 점검합니다.",
    href: "https://invest.shakilabs.com/dividend-tax",
    icon: TrendingUp,
  },
];
</script>

<template>
  <section class="retro-panel overflow-hidden">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 class="retro-title">관련 서비스</h2>
    </div>
    <div class="retro-panel-content space-y-4">
      <p class="text-caption leading-relaxed text-muted-foreground">
        연봉과 보험료를 계산했다면 지출 절감, 사업자 세금, 투자 세금도 함께 확인해 보세요.
      </p>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <a
          v-for="item in items"
          :key="item.href"
          :href="item.href"
          class="group flex flex-col rounded-[1.6rem] border border-border/70 bg-card p-4 text-left transition-[background-color,border-color,transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:border-primary/25 hover:bg-muted/15"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-body font-bold text-foreground">{{ item.title }}</p>
              <p class="mt-1.5 text-caption text-muted-foreground">{{ item.description }}</p>
            </div>
            <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <component :is="item.icon" class="h-5 w-5" />
            </span>
          </div>
          <p class="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-primary">
            바로 가기
            <ArrowRight class="h-3.5 w-3.5" />
          </p>
        </a>
      </div>
    </div>
  </section>
</template>
