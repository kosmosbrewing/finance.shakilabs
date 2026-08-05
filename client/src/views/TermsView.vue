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
        <span class="retro-kbd">시행 2026.03.21 · 개정 2026.08.05</span>
      </div>
      <div class="retro-panel-content">
        <p class="text-body text-muted-foreground leading-relaxed">
          본 약관은 shakilabs.com/finance(이하 "서비스")가 제공하는 급여·세금·수당 계산 기능의 이용 조건과
          운영자·이용자의 권리와 의무를 정합니다. 서비스를 이용하는 경우 본 약관에 동의한 것으로 봅니다.
          약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있으며, 이용 중단에 따른 불이익은 없습니다.
        </p>
      </div>
    </section>

    <div class="retro-panel overflow-hidden">
      <div class="retro-panel-content space-y-7">
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">1. 서비스의 성격</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            서비스는 연봉 실수령액, 건강보험료, 종합소득세, 퇴직금, 실업급여 등 급여·세금 관련 계산 기능과
            해설 콘텐츠를 무료로 제공합니다. 별도의 회원가입 없이 누구나 이용할 수 있으며, 모든 계산은
            2026년 공식 세율·요율 고시를 기반으로 하되 결과는 참고용 추정치입니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">2. 정보 제공 목적의 한계</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            서비스가 제공하는 계산 결과와 해설은 일반적인 정보 제공만을 목적으로 하며,
            <strong class="text-foreground">세무 상담·법률 자문·노무 상담이 아닙니다.</strong>
            개인의 구체적인 사정(비과세 항목, 감면 요건, 특수 고용 형태 등)에 따라 실제 금액은 달라질 수
            있으므로, 신고·납부·계약 등 법적 효과가 있는 의사결정 전에는 반드시 세무사·노무사 등
            자격 있는 전문가 또는 관할 기관(국세청, 국민건강보험공단, 고용노동부)의 확인을 받아야 합니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">3. 면책 조항</h2>
          <ul class="space-y-2 text-caption text-muted-foreground">
            <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>계산 결과는 참고용 추정치이며 실제 지급액·납부액과 다를 수 있습니다. 운영자는 계산 결과에 근거한 의사결정으로 발생한 손해에 대해 책임을 지지 않습니다.</li>
            <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>세율, 보험요율, 공제 조건은 관계 기관의 고시 변경에 따라 달라질 수 있으며, 개정 반영에는 시차가 있을 수 있습니다.</li>
            <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>천재지변, 통신 장애, 호스팅 사업자의 사정 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li class="flex gap-2"><span class="text-status-warning shrink-0">▸</span>이용자가 작성한 익명 댓글의 내용에 대한 책임은 작성자 본인에게 있습니다.</li>
          </ul>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">4. 광고 게재</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            서비스는 Google AdSense를 통한 광고를 게재하며, 광고 수익으로 무료 서비스를 운영합니다.
            광고는 콘텐츠와 구분되도록 표시되며, 광고 게재 위치와 노출 여부는 운영자가 조정할 수 있습니다.
            광고를 통해 연결되는 외부 사이트의 정보, 상품, 거래에 대한 책임은 해당 광고주와 외부
            사이트 운영자에게 있으며, 본 서비스는 광고주와 이용자 간 거래에 관여하지 않습니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">5. 지식재산권</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            서비스의 계산 로직, 해설 콘텐츠, 화면 디자인 등 제작물에 대한 권리는 운영자에게 있습니다.
            개인적 이용, 링크 공유, 출처를 밝힌 인용은 자유롭게 할 수 있으나, 콘텐츠를 무단으로 복제해
            상업적으로 재배포하거나 자동화 수단으로 대량 수집하는 행위는 금지됩니다.
            법령·고시 등 공공 정보 자체에는 별도의 권리를 주장하지 않습니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">6. 이용자의 의무</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            이용자는 서비스를 본래 목적에 맞게 이용해야 하며, 서버에 비정상적인 부하를 일으키는 행위,
            취약점을 악용하는 행위, 타인의 권리를 침해하거나 법령에 위반되는 내용을 게시하는 행위를
            해서는 안 됩니다. 위반 시 해당 이용이 제한될 수 있습니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">7. 서비스 변경 및 중단</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            운영자는 계산 기준, 화면 구성, 제공 기능을 사전 공지 없이 변경하거나 중단할 수 있습니다.
            무료 서비스 특성상 변경·중단으로 인한 별도의 보상은 제공되지 않습니다.
            약관이 변경되는 경우 본 페이지에 개정일과 함께 게시합니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">8. 준거법 및 분쟁 해결</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련해 분쟁이 발생한 경우
            운영자와 이용자는 우선 성실히 협의해 해결합니다. 협의로 해결되지 않는 분쟁은
            민사소송법에 따른 관할 법원에 제기할 수 있습니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <section class="space-y-3">
          <h2 class="text-heading font-semibold">9. 문의</h2>
          <div class="retro-board-list text-caption">
            <div class="retro-board-item">
              <span class="text-muted-foreground">운영</span>
              <strong>ShakiLabs</strong>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">문의</span>
              <a href="mailto:skdba1313@gmail.com" class="underline underline-offset-2">skdba1313@gmail.com</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
