<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ShSiteFooter } from "@shakilabs/ui";
import { FOOTER_ALL_LINK, FOOTER_SECTIONS } from "@/data/footerNav";

const year = new Date().getFullYear();

const policyLinks = [
  { to: "/about", label: "사이트 안내" },
  { to: "/terms", label: "이용약관" },
  { to: "/privacy", label: "개인정보 처리방침" },
  // 크로스앱 절대경로 — href가 있으면 ShSiteFooter가 RouterLink 대신 <a>로 렌더한다.
  // RouterLink로 나가면 base(/finance)가 붙어 /finance/blog로 깨진다.
  { to: "", href: "/blog", label: "블로그" },
  { to: "", href: "mailto:skdba1313@gmail.com", label: "문의" },
];
</script>

<template>
  <ShSiteFooter
    app="finance"
    :sections="FOOTER_SECTIONS"
    :all-link="FOOTER_ALL_LINK"
    :policy-links="policyLinks"
    note="본 계산 결과는 참고용 추정치이며, 실제 납부액·환급액은 다를 수 있습니다."
    site-label="shakilabs.com/finance"
    :copyright="`Copyright © ${year} shakilabs.com`"
    :link-component="RouterLink"
  />
</template>
