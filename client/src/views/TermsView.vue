<script setup lang="ts">
import { useSEO } from "@/composables/useSEO";

useSEO({
  title: "이용약관 | 2026 연봉·건보료 계산기",
  description: "연봉 실수령액 계산기 서비스의 이용약관입니다.",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://shakilabs.com/finance/salary" },
      {
        "@type": "ListItem",
        position: 2,
        name: "이용약관",
        item: "https://shakilabs.com/finance/terms",
      },
    ],
  },
});
</script>

<template>
  <div class="container py-6 space-y-4">
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h1 class="retro-title">이용약관</h1>
        <span class="retro-kbd">시행일: 2026.03.21</span>
      </div>
      <div class="retro-panel-content">
        <p class="text-body text-muted-foreground leading-relaxed">
          shakilabs.com/finance(이하 "서비스")는 급여·세금·수당 계산 정보를 무료로 제공합니다.
          본 서비스를 이용하는 경우 아래 약관에 동의한 것으로 봅니다.
        </p>
      </div>
    </section>

    <div class="retro-panel overflow-hidden">
      <div class="retro-panel-content space-y-7">
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">1. 서비스 성격</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            서비스는 연봉 실수령액, 건보료, 종합소득세, 퇴직금, 실업급여 등 계산 기능을 제공합니다.
            별도의 회원가입 없이 누구나 이용할 수 있으며, 결과는 참고용 추정치입니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">2. 면책 조항</h2>
          <ul class="space-y-2 text-caption text-muted-foreground">
            <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>계산 결과는 법률·세무 자문이 아니며 실제 지급액·납부액과 다를 수 있습니다.</li>
            <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>세율, 보험요율, 공제 조건은 관계 기관의 고시 변경에 따라 달라질 수 있습니다.</li>
            <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>최종 신고·납부·의사결정 전에는 국세청, 국민건강보험공단, 고용노동부 등 공식 기준을 확인해야 합니다.</li>
          </ul>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">3. 광고 및 외부 링크</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            서비스는 Google AdSense 등 광고 또는 제휴 링크를 포함할 수 있습니다.
            외부 사이트의 정보와 거래에 대한 책임은 각 제공자에게 있습니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">4. 서비스 변경 및 중단</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            서비스 운영자는 계산 기준, 화면 구성, 제공 기능을 사전 공지 없이 변경하거나 중단할 수 있습니다.
            무료 서비스 특성상 별도의 보상은 제공되지 않습니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">5. 문의</h2>
          <div class="retro-board-list text-caption">
            <div class="retro-board-item">
              <span class="text-muted-foreground">운영사</span>
              <strong>Shakilabs</strong>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">이메일</span>
              <a href="mailto:skdba1313@gmail.com" class="underline underline-offset-2">skdba1313@gmail.com</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
