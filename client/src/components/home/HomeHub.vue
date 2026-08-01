<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ArrowRight } from "lucide-vue-next";
import { SCENARIO_CHAINS as scenarioChains } from "../../../scripts/scenario-chains.mjs";
import {
  HOME_ALL_LINK,
  HOME_HUB_GROUPS,
} from "../../../scripts/home-content.mjs";

const props = defineProps<{
  guideHeading: string;
  guideBody: string;
  linksHeading: string;
}>();
</script>

<template>
  <section class="retro-panel" aria-labelledby="home-guides-title">
    <div class="retro-titlebar">
      <h2 id="home-guides-title" class="retro-title">{{ props.guideHeading }}</h2>
    </div>
    <div class="retro-panel-content space-y-3">
      <p class="break-keep text-caption text-muted-foreground">{{ props.guideBody }}</p>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RouterLink
          v-for="chain in scenarioChains"
          :key="chain.slug"
          :to="chain.route"
          class="group block rounded-lg border border-border/40 bg-background p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <p class="text-caption font-semibold text-foreground transition-colors group-hover:text-primary">
            {{ chain.name }}
          </p>
          <p class="text-tiny text-muted-foreground mt-0.5">
            {{ chain.steps.length }}단계 · {{ chain.steps[0].label }}부터
          </p>
        </RouterLink>
      </div>
    </div>
  </section>

  <section class="retro-panel" aria-labelledby="home-hub-title">
    <div class="retro-titlebar">
      <h2 id="home-hub-title" class="retro-title">{{ props.linksHeading }}</h2>
    </div>
    <div class="retro-panel-content space-y-4">
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="group in HOME_HUB_GROUPS" :key="group.id">
          <h3 class="mb-2 text-body font-bold text-foreground">
            <span class="mr-1" aria-hidden="true">{{ group.icon }}</span>{{ group.title }}
          </h3>
          <ul class="space-y-1.5">
            <li v-for="item in group.items" :key="item.to">
              <RouterLink
                :to="item.to"
                class="group block rounded-lg border border-border/40 bg-background p-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <p class="text-caption font-semibold text-foreground transition-colors group-hover:text-primary">
                  {{ item.label }}
                </p>
                <p class="text-tiny text-muted-foreground mt-0.5">{{ item.desc }}</p>
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <RouterLink
        :to="HOME_ALL_LINK.to"
        class="inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline"
      >
        {{ HOME_ALL_LINK.label }}
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </RouterLink>
    </div>
  </section>
</template>
