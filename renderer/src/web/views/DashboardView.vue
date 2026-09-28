<script setup lang="ts">
import { computed } from "vue";
import {
  Activity,
  ArrowUpRight,
  Coins,
  Search,
  TrendingUp,
} from "lucide-vue-next";
import Card from "@/components/ui/card.vue";
import CardHeader from "@/components/ui/card-header.vue";
import CardTitle from "@/components/ui/card-title.vue";
import CardDescription from "@/components/ui/card-description.vue";
import CardContent from "@/components/ui/card-content.vue";
import Badge from "@/components/ui/badge.vue";
import Button from "@/components/ui/button.vue";
import { navigate } from "@/web/navigation";
import { config } from "@/web/settings";
import { usePriceCheck } from "@/web/background/PriceCheck";

/* Dashboard is a read-only glance: session state, quick jumps.
   No widget grid — that was the old app's core mistake. */
const league = computed(() => config.value.leagueId ?? "—");

const pc = usePriceCheck();
pc.wire();

/* A price check is the only thing that happens on its own, so the dashboard
   simply reflects the most recent one. */
const lastCheck = computed(() => pc.item.value?.info?.name ?? "—");
const hasCheck = computed(() => pc.item.value !== null);
</script>

<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-lg font-semibold tracking-tight text-foreground">
        Dashboard
      </h1>
      <p class="mt-1 text-[13px] text-muted-foreground">
        Everything at a glance. Press your hotkeys in-game and this fills in.
      </p>
    </div>

    <!-- stat row -->
    <div class="grid grid-cols-3 gap-3">
      <Card class="gap-0 py-4">
        <CardHeader>
          <CardDescription class="flex items-center gap-1.5">
            <Coins class="size-3.5" /> League
          </CardDescription>
          <CardTitle class="mt-1 truncate text-base">{{ league }}</CardTitle>
        </CardHeader>
      </Card>

      <Card class="gap-0 py-4">
        <CardHeader>
          <CardDescription class="flex items-center gap-1.5">
            <Search class="size-3.5" /> Last check
          </CardDescription>
          <CardTitle class="mt-1 truncate text-base">{{ lastCheck }}</CardTitle>
        </CardHeader>
      </Card>

      <Card class="gap-0 py-4">
        <CardHeader>
          <CardDescription class="flex items-center gap-1.5">
            <Activity class="size-3.5" /> Session
          </CardDescription>
          <CardTitle class="mt-1 text-base tabular-nums">—</CardTitle>
        </CardHeader>
      </Card>
    </div>

    <!-- hero panel -->
    <Card class="min-h-[168px] justify-center">
      <CardHeader class="flex-row items-start justify-between">
        <div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Your trade activity will appear here as you play.
          </CardDescription>
        </div>
        <Badge variant="outline">⌘K</Badge>
      </CardHeader>
      <CardContent class="mt-3 flex gap-2">
        <Button variant="outline" size="sm" @click="navigate('price-check')">
          <Search /> Open price check
        </Button>
        <Button variant="outline" size="sm" @click="navigate('insights')">
          <TrendingUp /> View insights
        </Button>
      </CardContent>
    </Card>

    <!-- empty state -->
    <Card>
      <CardHeader>
        <CardTitle>{{ hasCheck ? "Ready to search" : "Recent activity" }}</CardTitle>
        <CardDescription>
          {{
            hasCheck
              ? "Open the price check to see listings for the last item."
              : "Price checks and whispers show up here."
          }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center"
        >
          <ArrowUpRight class="size-4 text-muted-foreground" />
          <p class="text-[13px] text-muted-foreground">
            {{ hasCheck ? "Item parsed successfully" : "Nothing yet" }}
          </p>
          <p class="max-w-xs text-[12px] text-muted-foreground">
            Hover an item in Path of Exile 2 and press
            <kbd
              class="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]"
              >{{ config.priceCheckHotkey }}</kbd
            >
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
