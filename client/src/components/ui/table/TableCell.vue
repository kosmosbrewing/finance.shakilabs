<script setup lang="ts">
import { cn } from "@/lib/utils";
const props = defineProps({ class: { type: String, default: "" } });
</script>
<template>
  <td :class="cn('px-3 py-2.5 align-middle text-body', props.class)"><slot /></td>
</template>
