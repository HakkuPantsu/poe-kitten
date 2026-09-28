<script setup lang="ts">
import { computed } from "vue";
import AppSidebar from "./shell/AppSidebar.vue";
import OnboardingWizard from "./onboarding/OnboardingWizard.vue";
import DashboardView from "./views/DashboardView.vue";
import PriceCheckView from "./views/PriceCheckView.vue";
import InsightsView from "./views/InsightsView.vue";
import SettingsView from "./views/SettingsView.vue";
import HelpView from "./views/HelpView.vue";
import { currentView } from "@/web/navigation";
import { config } from "@/web/settings";
import { t } from "@/web/i18n";
import Constellation from "@/components/ui/constellation.vue";
import DvdBounce from "@/components/ui/dvd-bounce.vue";
import { egg, dismissEgg } from "@/web/easter-egg";

/* Single view switch — no dynamic widget registry, no lazy boundaries to
   maintain. Vite tree-shakes what's unused. */
const views = {
  dashboard: DashboardView,
  "price-check": PriceCheckView,
  insights: InsightsView,
  settings: SettingsView,
  help: HelpView,
} as const;

const active = computed(() => views[currentView.value]);
const title = computed(() => t(`nav.${currentView.value === "price-check" ? "priceCheck" : currentView.value}` as never));
const showOnboarding = computed(() => !config.value.onboarded);
</script>

<template>
  <!-- First run owns the whole window; there is nothing useful behind it. -->
  <OnboardingWizard v-if="showOnboarding" />

  <div
    v-else
    class="relative isolate flex h-screen w-screen overflow-hidden text-foreground"
  >
    <!-- Opaque black stage for the main app window. The starfield needs a
         solid canvas to sit on; without it the dots would float over whatever
         is behind the window. Content is lifted above it with z-10. -->
    <div class="absolute inset-0 z-0 bg-background">
      <Constellation :density="1.8" :drift-angle="35" />
    </div>

    <!-- Easter egg: five clicks on Help releases the bouncing logo. -->
    <DvdBounce v-if="egg" @dismiss="dismissEgg" />

    <AppSidebar />
    <div class="relative z-10 flex min-w-0 flex-1 flex-col">
      <!-- titlebar: drag handle for the frameless overlay window -->
      <header
        class="pk-surface-flare relative flex h-11 shrink-0 items-center gap-3 border-b border-border bg-card px-4"
        style="-webkit-app-region: drag"
      >
        <span class="text-[13px] font-medium text-foreground">{{ title }}</span>
        <div class="ml-auto flex items-center gap-2" style="-webkit-app-region: no-drag">
          <slot name="titlebar" />
        </div>
      </header>

      <main class="min-h-0 flex-1 overflow-y-auto p-5">
        <component :is="active" :key="currentView" class="animate-fade-up" />
      </main>
    </div>
  </div>
</template>
