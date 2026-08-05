<script setup lang="ts">
import { useSEO } from "@/composables/useSEO";

useSEO({
  title: "개인정보 처리방침 | 연봉 실수령액 계산기",
  description: "연봉 실수령액 계산기 서비스의 개인정보 처리 원칙을 안내합니다.",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://shakilabs.com/finance/salary" },
      {
        "@type": "ListItem",
        position: 2,
        name: "개인정보처리방침",
        item: "https://shakilabs.com/finance/privacy",
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
        <span class="retro-kbd">시행 2026.03.03 · 개정 2026.08.05</span>
      </div>
      <div class="retro-panel-content">
        <p class="text-body text-muted-foreground leading-relaxed">
          shakilabs.com/finance(이하 "서비스")는 이용자의 개인정보를 소중히 여기며, 개인정보 보호법 등
          관련 법령을 준수합니다. 본 방침은 서비스 이용 과정에서 수집·이용되는 정보의 항목과 목적,
          보관 기간, 광고 게재에 따른 쿠키 사용, 이용자의 권리와 행사 방법을 안내합니다.
        </p>
      </div>
    </section>

    <div class="retro-panel overflow-hidden">
      <div class="retro-panel-content space-y-7">

        <!-- 1. 수집하는 정보 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">1. 수집하는 정보</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            본 서비스는 별도의 회원가입 없이 이용할 수 있으며, 이름·연락처 같은 직접적인 개인정보를
            입력받지 않습니다. 다만 서비스 운영 과정에서 아래 정보가 자동으로, 또는 기능 이용 시 수집될 수 있습니다.
          </p>
          <div class="retro-board-list text-caption">
            <div class="retro-board-item">
              <span class="text-muted-foreground">자동 수집</span>
              <span>접속 IP, 브라우저 종류, 접속 시간, 방문 페이지</span>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">광고·통계 쿠키</span>
              <span>Google Analytics·Google AdSense가 발급하는 쿠키 식별자</span>
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
            이용자가 계산기에 입력하는 연봉·건강보험료·부양가족 수 등 급여·세금 정보는 본 서비스 고유의
            처리 방식에 따라 <strong>서버로 전송되거나 저장되지 않으며, 이용자의 브라우저 안에서만 연산된 뒤
            페이지를 떠나면 사라집니다.</strong> 따라서 운영자는 개별 이용자의 소득 정보를 알 수 없습니다.
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
              <span class="text-muted-foreground">광고 쿠키</span>
              <span>Google AdSense 광고 게재 및 광고 성과 측정</span>
            </div>
            <div class="retro-board-item">
              <span class="text-muted-foreground">댓글 내용</span>
              <span>익명 게시판 운영</span>
            </div>
          </div>
          <p class="text-tiny text-muted-foreground">
            수집한 정보는 위 목적 외의 용도로 이용하지 않으며, 법령에 근거한 요청이 있는 경우를 제외하고
            제3자에게 제공하지 않습니다.
          </p>
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

        <!-- 4. AdSense 광고와 쿠키 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">4. Google AdSense 광고와 쿠키</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            본 서비스는 Google AdSense를 통해 광고를 게재하고, 광고 수익으로 무료 서비스를 운영합니다.
            광고 게재와 관련해 다음 사항을 안내합니다.
          </p>
          <ul class="space-y-2 text-caption text-muted-foreground">
            <li class="flex gap-2">
              <span class="text-primary shrink-0">▸</span>
              <span>Google을 포함한 제3자 광고 사업자는 쿠키를 사용해 이용자의 본 서비스 및 다른
              웹사이트 방문 기록을 기반으로 광고를 게재합니다.</span>
            </li>
            <li class="flex gap-2">
              <span class="text-primary shrink-0">▸</span>
              <span>Google은 광고 쿠키를 통해 이용자의 이전 방문 기록에 따라 관심사 기반
              맞춤 광고를 표시할 수 있습니다.</span>
            </li>
            <li class="flex gap-2">
              <span class="text-primary shrink-0">▸</span>
              <span>이용자는
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                class="underline underline-offset-2"
              >Google 광고 설정</a>에서 맞춤 광고를 언제든지 해제할 수 있습니다.</span>
            </li>
            <li class="flex gap-2">
              <span class="text-primary shrink-0">▸</span>
              <span>Google 외 제3자 광고 사업자의 맞춤 광고 쿠키는
              <a
                href="https://www.aboutads.info/choices"
                target="_blank"
                rel="noopener noreferrer"
                class="underline underline-offset-2"
              >www.aboutads.info/choices</a>에서 일괄 거부할 수 있습니다.</span>
            </li>
          </ul>
          <p class="text-tiny text-muted-foreground">
            맞춤 광고를 해제해도 광고 자체는 계속 표시될 수 있으며, 이 경우 이용자의 관심사와 무관한
            일반 광고가 노출됩니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <!-- 5. 쿠키 및 로컬스토리지 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">5. 쿠키 및 브라우저 저장소</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            본 서비스는 통계 분석 및 광고 제공을 위해 쿠키를 사용할 수 있습니다.
            브라우저 설정에서 쿠키 저장을 거부하거나 저장된 쿠키를 삭제할 수 있으나, 일부 기능이 제한될 수 있습니다.
          </p>
          <p class="text-body text-muted-foreground leading-relaxed">
            피드백 상태와 좋아요 기록은 브라우저 localStorage에만 저장되며 서버로 전송되지 않습니다.
            브라우저 데이터 삭제 시 초기화됩니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <!-- 6. 보관 및 파기 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">6. 개인정보의 보관 및 파기</h2>
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
            <div class="retro-board-item">
              <span class="text-muted-foreground">광고 쿠키</span>
              <span>Google 광고 쿠키 정책에 따른 유효 기간 후 만료</span>
            </div>
          </div>
          <p class="text-tiny text-muted-foreground">
            보관 기간이 지난 정보는 복구할 수 없는 방법으로 지체 없이 파기합니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <!-- 7. 이용자 권리 -->
        <section class="space-y-3">
          <h2 class="text-heading font-semibold">7. 이용자의 권리와 행사 방법</h2>
          <p class="text-body text-muted-foreground leading-relaxed">
            이용자는 본인이 작성한 댓글 등 자신과 관련된 정보에 대해 열람·정정·삭제·처리정지를
            요청할 수 있습니다. 아래 문의 이메일로 요청하시면 본인 확인 후 영업일 기준 10일 이내에
            처리 결과를 회신합니다. 본 서비스는 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.
          </p>
          <p class="text-body text-muted-foreground leading-relaxed">
            본 방침이 변경되는 경우 이 페이지에 개정일과 함께 게시하며, 수집 항목이 늘어나는 등
            중요한 변경은 시행 7일 전부터 공지합니다.
          </p>
        </section>

        <hr class="border-border/40" />

        <!-- 8. 문의 -->
        <section class="space-y-2">
          <h2 class="text-heading font-semibold">8. 문의</h2>
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
