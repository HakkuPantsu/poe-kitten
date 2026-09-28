<script setup lang="ts">
import { computed } from "vue";
import {
  BarChart3,
  CircleHelp,
  LayoutDashboard,
  Search,
  Settings2,
  ArrowLeft,
} from "lucide-vue-next";
import NavItem from "@/components/ui/nav-item.vue";
import Button from "@/components/ui/button.vue";
import Badge from "@/components/ui/badge.vue";
import { registerNavClick } from "@/web/easter-egg";
import { t } from "@/web/i18n";
import { currentView, navigate, goBack, canGoBack, type ViewId } from "@/web/navigation";
import { config } from "@/web/settings";

/* One source of truth for the sidebar. Adding a view means one entry here. */
const nav = computed<
  { id: ViewId; label: string; icon: typeof LayoutDashboard; hint?: string }[]
>(() => [
  { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
  { id: "price-check", label: t("nav.priceCheck"), icon: Search },
  { id: "insights", label: t("nav.insights"), icon: BarChart3 },
  { id: "settings", label: t("nav.settings"), icon: Settings2 },
  { id: "help", label: t("nav.help"), icon: CircleHelp },
]);

const league = computed(() => config.value.leagueId ?? "No league set");

/* Five Help clicks releases the east-egg bouncing logo (see easter-egg.ts). */
function select(id: ViewId) {
  registerNavClick(id);
  navigate(id);
}
</script>

<template>
  <aside
    class="pk-surface-flare relative flex w-[220px] shrink-0 flex-col gap-1 border-r border-border bg-sidebar px-3 py-4"
  >
    <!-- brand -->
    <div class="mb-3 flex items-center gap-2 px-2">
      <div
        class="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground"
      >
        PK
      </div>
      <span class="text-[13px] font-semibold tracking-tight text-foreground">
        POE Kitten
      </span>
      <Badge variant="muted" class="ml-auto text-[10px]">beta</Badge>
    </div>

    <!-- back affordance, mirrors the command palette's history -->
    <Button
      v-if="canGoBack"
      variant="ghost"
      size="sm"
      class="mb-1 justify-start text-muted-foreground"
      @click="goBack()"
    >
      <ArrowLeft />
      Back
    </Button>

    <nav class="flex flex-col gap-0.5">
      <NavItem
        v-for="item in nav"
        :key="item.id"
        :icon="item.icon"
        :label="item.label"
        :active="currentView === item.id"
        @select="select(item.id)"
      />
    </nav>

    <div class="mt-auto border-t border-border px-2 pt-3">
      <p class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        League
      </p>
      <p class="truncate text-[12px] text-foreground">{{ league }}</p>
    </div>
  </aside>
</template>
