<template>
  <div
    v-if="tags.length"
    class="flex items-center text-xs leading-none gap-x-1"
  >
    <span v-for="tag of tags" :class="$style[tag.type]">{{
      t("filters.tier", [tag.tier])
    }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ItemCategory, ParsedItem } from "@/parser";
import { FilterTag, StatFilter } from "./interfaces";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/widgets";

export default defineComponent({
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true,
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
  },
  setup(props) {
    const alwaysShowTier = computed(
      () => AppConfig<PriceCheckWidget>("price-check")!.alwaysShowTier,
    );
    const tags = computed(() => {
      const { filter, item } = props;
      if (
        item.category === ItemCategory.Map ||
        item.category === ItemCategory.Tablet
      ) {
        return [];
      }
      const out: Array<{ type: string; tier: number }> = [];
      for (const source of filter.sources) {
        const tier = source.modifier.info.tier;
        if (!tier) continue;

        if (
          (filter.tag === FilterTag.Explicit ||
            filter.tag === FilterTag.Desecrated ||
            filter.tag === FilterTag.Fractured ||
            filter.tag === FilterTag.Crafted ||
            filter.tag === FilterTag.Pseudo ||
            filter.tag === FilterTag.Property) &&
          item.category !== ItemCategory.Jewel &&
          item.category !== ItemCategory.ClusterJewel &&
          item.category !== ItemCategory.MemoryLine
        ) {
          if (tier === 1) out.push({ type: "tier-1", tier });
          else if (tier === 2) out.push({ type: "tier-2", tier });
          else if (alwaysShowTier.value)
            out.push({ type: "tier-3-plus", tier });
        } else if (tier >= 2) {
          // fractured, explicit-* filters
          out.push({ type: "not-tier-1", tier });
        }
      }
      out.sort((a, b) => a.tier - b.tier);
      return out;
    });

    const { t } = useI18n();
    return { t, tags };
  },
});
</script>

<style lang="postcss" module>
@reference "../../../assets/tailwind.css";

.tier-1,
.tier-2,
.not-tier-1,
.tier-3-plus {
  @apply rounded-full px-1.5;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  line-height: 1.4;
}

.tier-1 {
  @apply text-black;
  background: #ffd166;
}
.tier-2 {
  @apply text-black;
  background: #ff8fc7;
}
.tier-3-plus {
  @apply text-gray-900;
  background: theme("colors.gray.400");
}
.not-tier-1 {
  @apply text-gray-900;
  background: theme("colors.gray.500");
}
</style>
