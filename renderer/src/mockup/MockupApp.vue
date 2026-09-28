<script setup lang="ts">
import { ref } from "vue";
import { Monitor, PanelLeft, Sparkles } from "lucide-vue-next";
import Button from "@/components/ui/button.vue";
import Stack from "@/components/ui/stack.vue";
import OnboardingWizard from "@/web/onboarding/OnboardingWizard.vue";
import DashboardView from "@/web/views/DashboardView.vue";
import PriceCheckView from "@/web/views/PriceCheckView.vue";
import InsightsView from "@/web/views/InsightsView.vue";
import SettingsView from "@/web/views/SettingsView.vue";
import HelpView from "@/web/views/HelpView.vue";
import AppSidebar from "@/web/shell/AppSidebar.vue";
import Constellation from "@/components/ui/constellation.vue";
import DvdBounce from "@/components/ui/dvd-bounce.vue";
import { egg, dismissEgg } from "@/web/easter-egg";
import { config, updateConfig } from "@/web/settings";
import { currentView, navigate, type ViewId } from "@/web/navigation";

/* Seed a league so the shell shows realistic content in the mockup. */
updateConfig({ leagueId: "Dawn of the Hunt" });

/* Surface flare intensity — mockup-only control so you can pick a level.
   This styles opaque panels; the window itself stays transparent. */
const flare = ref<"off" | "subtle" | "default" | "bold">("subtle");
const stars = ref(true);
const speed = ref(1);
const brightness = ref(0.55);
const drift = ref<number | null>(35);
const hue = ref<number | null>(268);

/* A static showcase: lets you click through every screen without Electron.
   The sidebar/nav behaviour is real; only the host IPC is stubbed. */
const views = {
  dashboard: DashboardView,
  "price-check": PriceCheckView,
  insights: InsightsView,
  settings: SettingsView,
  help: HelpView,
} as const;

const active = ref<typeof DashboardView>(DashboardView);

function show(id: ViewId) {
  navigate(id);
  active.value = views[id];
}

/* Overlay chrome vs full app: the overlay is a fixed 460px panel, the full
   window is the sidebar layout. Toggle lets you judge both. */
const mode = ref<"overlay" | "app">("app");

function restartOnboarding() {
  updateConfig({ onboarded: false });
}
function finishOnboarding() {
  updateConfig({ onboarded: true });
}
</script>

<template>
  <div
    class="relative isolate min-h-screen bg-[#0a0a0a] p-6 font-sans text-foreground"
    :style="{
      '--flaredemo':
        flare === 'off' ? '0' : flare === 'subtle' ? '0.45' : flare === 'bold' ? '1.9' : '1',
    }"
    :data-flare="flare"
  >
    <!-- mockup toolbar (not part of the product) -->
    <div
      class="relative z-10 mx-auto mb-6 flex max-w-[1100px] flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3"
    >
      <Sparkles class="size-4 text-muted-foreground" />
      <span class="text-[13px] font-medium">beta UI mockup</span>

      <div class="ml-2 flex gap-1">
        <Button
          v-for="v in ['dashboard', 'price-check', 'insights', 'settings', 'help']"
          :key="v"
          size="sm"
          :variant="currentView === v ? 'default' : 'ghost'"
          @click="show(v as ViewId)"
        >
          {{ v }}
        </Button>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <span class="text-[12px] text-muted-foreground">Stars</span>
        <Button
          size="sm"
          :variant="stars ? 'default' : 'outline'"
          @click="stars = !stars"
        >
          {{ stars ? "on" : "off" }}
        </Button>
        <span class="text-[12px] text-muted-foreground">Motion</span>
        <Button
          v-for="s in [0.5, 1, 2.2]"
          :key="s"
          size="sm"
          :variant="speed === s ? 'default' : 'outline'"
          @click="speed = s"
        >
          {{ s === 0.5 ? "slow" : s === 1 ? "normal" : "fast" }}
        </Button>
        <span class="text-[12px] text-muted-foreground">Bright</span>
        <Button
          v-for="b in [0.3, 0.55, 1]"
          :key="b"
          size="sm"
          :variant="brightness === b ? 'default' : 'outline'"
          @click="brightness = b"
        >
          {{ b === 0.3 ? "dim" : b === 0.55 ? "med" : "bright" }}
        </Button>
        <span class="text-[12px] text-muted-foreground">Hue</span>
        <Button
          v-for="hh in [null, 268, 200, 330]"
          :key="String(hh)"
          size="sm"
          :variant="hue === hh ? 'default' : 'outline'"
          @click="hue = hh"
        >
          {{ hh === null ? "none" : hh === 268 ? "violet" : hh === 200 ? "cyan" : "rose" }}
        </Button>
        <span class="text-[12px] text-muted-foreground">Drift</span>
        <Button
          v-for="d in [null, 0, 35, 90]"
          :key="String(d)"
          size="sm"
          :variant="drift === d ? 'default' : 'outline'"
          @click="drift = d"
        >
          {{ d === null ? "free" : d === 0 ? "→" : d === 35 ? "↘" : "↓" }}
        </Button>
        <span class="text-[12px] text-muted-foreground">Flare</span>
        <Button
          v-for="s in ['off', 'subtle', 'default', 'bold']"
          :key="s"
          size="sm"
          :variant="flare === s ? 'default' : 'outline'"
          @click="flare = s as typeof flare"
        >
          {{ s }}
        </Button>
        <Button
          size="sm"
          :variant="mode === 'app' ? 'default' : 'outline'"
          @click="mode = 'app'"
        >
          <PanelLeft /> Full app
        </Button>
        <Button
          size="sm"
          :variant="mode === 'overlay' ? 'default' : 'outline'"
          @click="mode = 'overlay'"
        >
          <Monitor /> Overlay
        </Button>
        <Button size="sm" variant="outline" @click="restartOnboarding">
          Onboarding
        </Button>
      </div>
    </div>

    <!-- ONBOARDING -->
    <div
      v-if="!config.onboarded"
      class="relative z-10 mx-auto h-[720px] max-w-[1100px] overflow-hidden rounded-xl border border-border"
    >
      <OnboardingWizard @click.capture="finishOnboarding" />
      <div class="border-border bg-card border-t p-3 text-center">
        <Button size="sm" variant="outline" @click="finishOnboarding">
          (mockup) finish onboarding
        </Button>
      </div>
    </div>

    <!-- OVERLAY MODE: what sits over the game -->
    <div v-else-if="mode === 'overlay'" class="relative z-10 mx-auto max-w-[1100px]">
      <div
        class="relative isolate mx-auto w-[460px] overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
      >
        <Constellation
          v-if="stars"
          :density="1.4"
          :speed="speed"
          :brightness="brightness"
          :drift-angle="drift"
          :hue="hue"
        />
        <div
          class="pk-surface-flare relative flex h-10 items-center gap-2 border-b border-border bg-card px-3"
        >
          <div class="grid size-5 place-items-center rounded bg-primary text-[10px] font-bold text-primary-foreground">PK</div>
          <span class="text-[12.5px] font-medium">POE Kitten</span>
          <span class="text-muted-foreground ml-auto text-[11px]">Ctrl + F6</span>
        </div>
        <div class="max-h-[560px] overflow-y-auto p-4">
          <component :is="active" />
        </div>
      </div>

      <!-- Easter egg works here too -->
      <DvdBounce v-if="egg" @dismiss="dismissEgg" />
      <p class="mt-4 text-center text-[12px] text-muted-foreground">
        Overlay mode — floats over the game, game keeps focus.
      </p>
    </div>

    <!-- FULL APP MODE -->
    <div
      v-else
      class="relative isolate z-10 mx-auto flex h-[720px] max-w-[1100px] overflow-hidden rounded-xl border border-border bg-background"
    >
      <Constellation
        :density="1.8"
        :speed="speed"
        :brightness="brightness"
        :drift-angle="drift"
        :hue="hue"
      />
      <AppSidebar />
      <div class="relative z-10 flex min-w-0 flex-1 flex-col">
        <header
          class="pk-surface-flare relative flex h-11 shrink-0 items-center border-b border-border bg-card px-4"
        >
          <span class="text-[13px] font-medium">{{ currentView }}</span>
        </header>
        <main class="relative z-10 min-h-0 flex-1 overflow-y-auto p-5">
          <component :is="active" :key="currentView" class="animate-fade-up" />
        </main>
      </div>

      <!-- Easter egg: five clicks on Help releases the bouncing logo. -->
      <DvdBounce v-if="egg" @dismiss="dismissEgg" />
    </div>
  </div>
</template>
