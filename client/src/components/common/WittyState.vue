<script setup lang="ts">
import { computed } from "vue";
import { AlertTriangle, Loader2, MessageCircleOff } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    type: "loading" | "empty" | "error";
    title?: string;
    description?: string;
  }>(),
  {
    title: "",
    description: "",
  }
);

const defaultTitle = computed(() => {
  if (props.type === "loading") return "데이터 정리 중";
  if (props.type === "empty") return "아직 첫 댓글이 없어요";
  return "잠깐 삐끗했어요";
});

const defaultDescription = computed(() => {
  if (props.type === "loading") return "계산기를 예열하는 중입니다.";
  if (props.type === "empty") return "첫 한마디를 남기면 분위기가 살아납니다.";
  return "잠시 후 다시 시도해주세요.";
});

const iconComponent = computed(() => {
  if (props.type === "loading") return Loader2;
  if (props.type === "empty") return MessageCircleOff;
  return AlertTriangle;
});

const iconClass = computed(() => {
  if (props.type === "loading") return "h-5 w-5 animate-spin text-muted-foreground";
  if (props.type === "empty") return "h-5 w-5 text-muted-foreground";
  return "h-5 w-5 text-status-danger";
});
</script>

<template>
  <div class="border border-border/60 bg-muted/20 px-3 py-4 text-center">
    <component :is="iconComponent" :class="iconClass" class="mx-auto" />
    <p class="mt-1 text-caption font-semibold text-foreground">{{ title || defaultTitle }}</p>
    <p class="mt-1 text-caption text-muted-foreground">{{ description || defaultDescription }}</p>
  </div>
</template>
