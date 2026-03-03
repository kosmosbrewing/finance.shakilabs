<script setup lang="ts">
import { useSEO } from "@/composables/useSEO";

useSEO({
  title: "개인정보 처리방침 | 연봉 실수령액 계산기",
  description: "연봉 실수령액 계산기 서비스의 개인정보 처리 원칙을 안내합니다.",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://finance.shakilabs.com/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "개인정보처리방침",
        item: "https://finance.shakilabs.com/privacy",
      },
    ],
  },
});
</script>

<template>
  <div class="container py-6 space-y-4">
    <!-- 헤더 -->
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar">
        <h1 class="retro-title">개인정보 처리방침</h1>
        <span class="retro-kbd">시행일: 2026.03.03</span>
      </div>
      <div class="retro-panel-content">
        <p class="text-body text-muted-foreground leading-relaxed">
          finance.shakilabs.com(이하 "서비스")은 이용자의 개인정보를 소중히 여기며,
          관련 법령을 준수합니다. 본 방침은 서비스 이용 과정에서 수집·이용되는 정보를 안내합니다.
        </p>
      </div>
    </section>

    <div class="retro-panel overflow-hidden">
      <div class="retro-panel-content space-y-7">

        <!-- 1. 수집하는 정보 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">1. 수집하는 정보</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            본 서비스는 별도의 회원가입 없이 이용할 수 있으며, 직접적인 개인정보를 수집하지 않습니다.
            다만 서비스 운영 과정에서 아래 정보가 자동 또는 기능 이용 시 수집될 수 있습니다.
          </p>
          <div class="retro-board-list text-caption">
            <div class="retro-board-item">
              <span class="text-muted-foreground">자동 수집</span>
              <span>접속 IP, 브라우저 종류, 접속 시간, 방문 페이지</span>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">익명 댓글</span>
              <span>작성 내용, 자동 생성 닉네임, 접속 IP</span>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">좋아요 중복 방지</span>
              <span>접속 IP(SHA-256 해시 처리, 24시간 내 파기)</span>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">브라우저 저장(localStorage)</span>
              <span>계산기 피드백 상태, 좋아요 기록(기기 내 저장, 서버 미전송)</span>
            </div>
          </div>
          <p class="text-tiny text-muted-foreground">
            입력한 급여·세금 정보는 서버에 전송되거나 저장되지 않으며, 브라우저 내에서만 연산됩니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <!-- 2. 이용 목적 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">2. 수집 정보의 이용 목적</h2>
          <div class="retro-board-list text-caption">
            <div class="retro-board-item">
              <span class="text-muted-foreground">IP 주소</span>
              <span>서비스 통계, 악성 이용 방지, 좋아요 중복 방지</span>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">방문 기록</span>
              <span>서비스 개선을 위한 익명 통계 분석</span>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">댓글 내용</span>
              <span>익명 게시판 운영</span>
            </div>
          </div>
        </section>

        <hr class="border-border/40" />

        <!-- 3. 제3자 서비스 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">3. 이용하는 제3자 서비스</h2>
          <div class="retro-board-list text-caption">
            <div class="retro-board-item">
              <span class="font-semibold text-foreground">Google Analytics 4</span>
              <span class="text-muted-foreground">익명화 방문 통계 수집</span>
            </div>
            <div class="retro-board-item">
              <span class="font-semibold text-foreground">Google AdSense</span>
              <span class="text-muted-foreground">맞춤 광고 제공(쿠키 사용)</span>
            </div>
            <div class="retro-board-item">
              <span class="font-semibold text-foreground">Supabase (PostgreSQL)</span>
              <span class="text-muted-foreground">댓글·좋아요 데이터 저장(EU 서버)</span>
            </div>
          </div>
          <p class="text-tiny text-muted-foreground">
            Google Analytics 수집 거부:
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-2"
            >Google Analytics Opt-out Add-on</a>
          </p>
        </section>

        <hr class="border-border/40" />

        <!-- 4. 쿠키 및 로컬스토리지 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">4. 쿠키 및 브라우저 저장소</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            본 서비스는 통계 분석 및 광고 제공을 위해 쿠키를 사용할 수 있습니다.
            브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 일부 기능이 제한될 수 있습니다.
          </p>
          <p class="text-body text-muted-foreground leading-relaxed">
            피드백 상태와 좋아요 기록은 브라우저 localStorage에만 저장되며 서버로 전송되지 않습니다.
            브라우저 데이터 삭제 시 초기화됩니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <!-- 5. 보관 및 파기 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">5. 개인정보의 보관 및 파기</h2>
          <div class="retro-board-list text-caption">
            <div class="retro-board-item">
              <span class="text-muted-foreground">댓글·닉네임</span>
              <span>운영 유지 기간 보관, 요청 시 즉시 파기</span>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">좋아요 IP(해시)</span>
              <span>삽입 후 24시간 이내 자동 파기</span>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">방문 로그(GA)</span>
              <span>Google 정책에 따라 보관(기본 26개월)</span>
            </div>
          </div>
        </section>

        <hr class="border-border/40" />

        <!-- 6. 이용자 권리 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">6. 이용자 권리</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            댓글 삭제 등 본인 관련 정보의 열람·정정·삭제를 요청할 수 있습니다.
            아래 이메일로 문의하시면 합리적인 기간 내 처리합니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <!-- 7. 문의 -->
        <section class="space-y-2">
          <h2 class="text-heading font-semibold">7. 문의</h2>
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
