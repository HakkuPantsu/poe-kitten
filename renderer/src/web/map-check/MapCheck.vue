<template>
  <div
    class="bg-gray-800 text-gray-200 border-gray-900 border-4"
    style="min-width: 20rem; max-width: min(100vw - var(--game-panel), 30rem)"
  >
    <div class="bg-gray-900 py-1 px-8 flex items-baseline gap-2">
      <div class="flex-1 text-center">{{ mapName }}</div>
      <div class="ml-8 text-gray-400">{{ t("map_check.profile") }}</div>
      <div class="flex gap-0.5">
        <button
          v-for="profile in profiles"
          :key="profile.text"
          @click="profile.select"
          :class="{ 'border border-gray-600': profile.active }"
          class="w-6 bg-gray-800"
        >
          {{ profile.text }}
        </button>
      </div>
    </div>
    <div :class="[$style.danger, $style[danger.level.toLowerCase()]]">
      <i class="fas fa-shield-halved" />
      <b>{{ danger.level }} danger</b>
      <span v-if="danger.flags.length" :class="$style.flags">
        · {{ danger.flags.join(" · ") }}
      </span>
    </div>
    <FullscreenImage v-if="image" :src="image" style="height: auto" />
    <div v-if="!mapStats.length" class="px-8 py-2">
      {{ t("map_check.no_mods") }}
    </div>
    <div v-else class="py-2 flex flex-col">
      <MapStatButton
        v-for="stat in mapStats"
        :key="stat.matcher + stat.type"
        :stat="stat"
        :config="config"
      />
      <div
        v-for="stat of item.unknownModifiers"
        :key="stat.type + '/' + stat.text"
        class="py-1 px-8"
      >
        <span class="text-orange-400"
          >{{ t("Not recognized modifier") }} &mdash;</span
        >
        {{ stat.text }}
      </div>
    </div>
    <div v-if="hasOutdatedTranslation" class="py-2 px-8 bg-gray-700">
      {{ t("map_check.has_outdated") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ItemRarity, ParsedItem } from "@/parser";
import { prepareMapStats } from "./prepare-map-stats";
import { dangerScore } from "./danger-score";
import { type MapCheckConfig, isOutdated } from "./common.js";

import MapStatButton from "./MapStatButton.vue";
import FullscreenImage from "@/web/ui/FullscreenImage.vue";

const props = defineProps<{
  item: ParsedItem;
  config: MapCheckConfig;
}>();

const { t } = useI18n();

const hasOutdatedTranslation = computed<boolean>(() => {
  const { profile } = props.config;
  return props.config.selectedStats.some((entry) => isOutdated(profile, entry));
});

const mapName = computed(() => props.item.info.name);

const image = computed(() =>
  props.item.rarity === ItemRarity.Unique && props.item.isUnidentified
    ? undefined
    : props.item.info.map?.screenshot,
);

const mapStats = computed(() => prepareMapStats(props.item));

const danger = computed(() => dangerScore(mapStats.value));

const profiles = computed(() => {
  const ROMAN_NUMERALS = ["I", "II", "III"];
  return ROMAN_NUMERALS.map((text, i) => ({
    text,
    active: props.config.profile === i + 1,
    select: () => {
      props.config.profile = i + 1;
    },
  }));
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.danger {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.9rem;
  font-size: 0.78rem;
  border-bottom: 1px solid theme("colors.gray.700");

  b {
    font-weight: 800;
  }
}

.flags {
  font-size: 0.7rem;
  @apply text-gray-400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.low {
  color: #59d97a;
  background: rgba(89, 217, 122, 0.08);
}

.medium {
  color: #ffd166;
  background: rgba(255, 209, 102, 0.08);
}

.high {
  color: #ffa94d;
  background: rgba(255, 169, 77, 0.1);
}

.extreme {
  color: #ff8f9f;
  background: rgba(255, 95, 160, 0.14);
  animation: dangerPulse 1.6s ease-in-out infinite;
}

@keyframes dangerPulse {
  50% {
    background: rgba(255, 95, 160, 0.26);
  }
}
</style>
