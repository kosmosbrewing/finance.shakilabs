<script setup lang="ts">
import { cn } from "@/lib/utils";
const props = defineProps({ class: { type: String, default: "" } });
</script>
<template>
  <th :class="cn('h-10 px-3 text-left align-middle text-body font-semibold text-foreground', props.class)"><slot /></th>
</template>
