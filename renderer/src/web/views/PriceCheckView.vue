<script setup lang="ts">
import { computed } from "vue";
import { AlertTriangle, Loader2, Search, X } from "lucide-vue-next";
import Card from "@/components/ui/card.vue";
import CardHeader from "@/components/ui/card-header.vue";
import CardTitle from "@/components/ui/card-title.vue";
import CardDescription from "@/components/ui/card-description.vue";
import CardContent from "@/components/ui/card-content.vue";
import Badge from "@/components/ui/badge.vue";
import Button from "@/components/ui/button.vue";
import { config } from "@/web/settings";
import { usePriceCheck } from "@/web/background/PriceCheck";
import { ItemRarity } from "@/parser";
import { ModifierType } from "@/parser/modifiers";

/* The real price check. The hotkey is owned by the main process; this view
   just renders whatever it last produced. */
const pc = usePriceCheck();
pc.wire();

const item = pc.item;

/* POE2 only exposes these four rarities to the parser. */
const rarityLabel: Record<string, string> = {
  [ItemRarity.Normal]: "Normal",
  [ItemRarity.Magic]: "Magic",
  [ItemRarity.Rare]: "Rare",
  [ItemRarity.Unique]: "Unique",
};

const rarityClass: Record<string, string> = {
  [ItemRarity.Normal]: "text-foreground",
  [ItemRarity.Magic]: "text-sky-400",
  [ItemRarity.Rare]: "text-yellow-400",
  [ItemRarity.Unique]: "text-orange-400",
};

/** Implicits first, then explicits, then anything else — the order players read. */
const statOrder = [ModifierType.Implicit, ModifierType.Explicit];

const displayedStats = computed(() => {
  const i = item.value;
  if (!i) return [];

  const rows = i.statsByType.flatMap((group) =>
    group.sources.map((source) => ({
      text: source.stat.translation.string,
      type: group.type,
    })),
  );

  const rank = (t: ModifierType) => {
    const at = statOrder.indexOf(t);
    return at === -1 ? statOrder.length : at;
  };

  return [...rows].sort((a, b) => rank(a.type) - rank(b.type));
});

/** The item database entry already carries the display name (including a
    unique's name), so that is all we need to show. */
const heading = computed(() => item.value?.info?.name ?? "Unknown item");
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-lg font-semibold tracking-tight text-foreground">
          Price check
        </h1>
        <p class="mt-1 text-[13px] text-muted-foreground">
          Hover an item in-game and press
          <kbd
            class="rounded border border-border bg-background px-1.5 py-0.5 text-[11px]"
            >{{ config.priceCheckHotkey }}</kbd
          >
        </p>
      </div>
      <Button
        v-if="item || pc.error.value"
        variant="outline"
        size="sm"
        @click="pc.clear()"
      >
        <X /> Clear
      </Button>
    </div>

    <!-- parse failure -->
    <Card v-if="pc.error.value" class="border-destructive/50">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-destructive">
          <AlertTriangle class="size-4" /> Could not read that item
        </CardTitle>
        <CardDescription>{{ pc.error.value.message }}</CardDescription>
      </CardHeader>
      <CardContent>
        <pre
          class="max-h-40 overflow-auto rounded-md border border-border bg-background p-3 text-[11px] text-muted-foreground"
          >{{ pc.error.value.rawText || "(clipboard was empty)" }}</pre
        >
      </CardContent>
    </Card>

    <!-- nothing checked yet -->
    <Card v-else-if="!item">
      <CardHeader>
        <CardTitle>Latest result</CardTitle>
        <CardDescription>
          The listing table, item preview and whisper actions render here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center"
        >
          <Search class="size-4 text-muted-foreground" />
          <p class="text-[13px] text-muted-foreground">Nothing checked yet</p>
          <p class="max-w-xs text-[12px] text-muted-foreground">
            Press
            <kbd
              class="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]"
              >{{ config.priceCheckHotkey }}</kbd
            >
            with an item under your cursor.
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- the parsed item -->
    <template v-else>
      <Card>
        <CardHeader class="flex-row items-start justify-between gap-4">
          <div class="min-w-0">
            <CardTitle :class="rarityClass[item.rarity ?? '']">
              {{ heading }}
            </CardTitle>
            <CardDescription class="mt-2 flex flex-wrap items-center gap-2">
              <Badge v-if="item.rarity" variant="outline">{{
                rarityLabel[item.rarity] ?? item.rarity
              }}</Badge>
              <Badge v-if="item.itemLevel" variant="muted"
                >ilvl {{ item.itemLevel }}</Badge
              >
              <Badge v-if="item.quality" variant="muted"
                >{{ item.quality }}% quality</Badge
              >
              <Badge v-if="item.isCorrupted" variant="outline">Corrupted</Badge>
              <Badge v-if="item.isUnidentified" variant="outline"
                >Unidentified</Badge
              >
            </CardDescription>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <Loader2
              v-if="pc.isSearching.value"
              class="size-4 animate-spin text-muted-foreground"
            />
            <Button variant="outline" size="sm" @click="pc.search()">
              <Search /> Search trade
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div class="flex flex-col gap-1.5">
            <p
              v-for="(stat, i) in displayedStats"
              :key="i"
              class="text-[13px] leading-relaxed text-muted-foreground"
            >
              {{ stat.text }}
            </p>
            <p
              v-if="!displayedStats.length"
              class="text-[13px] text-muted-foreground"
            >
              No mods parsed.
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- raw text is the ground truth; keep it available for bug reports -->
      <Card>
        <CardHeader>
          <CardTitle>Raw item text</CardTitle>
          <CardDescription>
            Exactly what the game put on your clipboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre
            class="max-h-56 overflow-auto rounded-md border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground"
            >{{ item.rawText }}</pre
          >
        </CardContent>
      </Card>
    </template>
  </div>
</template>
