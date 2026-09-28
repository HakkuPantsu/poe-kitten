<template>
  <div :class="$style.bar">
    <button
      :class="[$style.nameBtn, { [$style.nameBtnOn]: showAsActive }]"
      @click="toggleAccuracy"
    >
      {{ label }}
    </button>
    <button
      v-if="filters.corrupted"
      :class="[$style.corruptBtn, { [$style.corruptOn]: corrupted }]"
      @click="corrupted = !corrupted"
    >
      {{ corrupted ? t("item.corrupted") : t("item.not_corrupted") }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { ParsedItem } from "@/parser";
import type { ItemFilters } from "./interfaces";
import { CATEGORY_TO_TRADE_ID } from "../trade/pathofexile-trade";

export default defineComponent({
  name: "FilterName",
  props: {
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true,
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const label = computed(() => {
      const { filters } = props;
      const activeSearch =
        filters.searchRelaxed && !filters.searchRelaxed.disabled
          ? filters.searchRelaxed
          : filters.searchExact;

      if (activeSearch.name) {
        return activeSearch.name;
      }
      if (activeSearch.baseType) {
        return activeSearch.baseType;
      }
      if (activeSearch.category) {
        const tradeId = CATEGORY_TO_TRADE_ID.get(activeSearch.category)!;
        return t("item_category.prop", [
          t(`item_category.${tradeId.replace(".", "_")}`),
        ]);
      }

      return "??? Report if you see this text";
    });

    const showAsActive = computed(() => {
      const { filters } = props;
      return filters.searchRelaxed?.disabled;
    });

    function toggleAccuracy() {
      const { filters } = props;
      if (filters.searchRelaxed) {
        filters.searchRelaxed.disabled = !filters.searchRelaxed.disabled;
      }
    }

    const corrupted = computed<boolean>({
      get() {
        return props.filters.corrupted!.value;
      },
      set(value) {
        props.filters.corrupted!.value = value;
      },
    });

    return {
      t,
      label,
      showAsActive,
      toggleAccuracy,
      corrupted,
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../../assets/tailwind.css";

.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid theme("colors.gray.700");
  border-radius: 0.85rem;
  padding: 0.15rem;
}

.nameBtn {
  flex: 1;
  min-width: 0;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.35rem 0.7rem;
  border-radius: 0.65rem;
  font-weight: 700;
  @apply text-gray-200;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
}

.nameBtnOn {
  color: #fff;
  background: linear-gradient(135deg, #a855f7, #ff5fb0);
}

.corruptBtn {
  flex: none;
  padding: 0.35rem 0.7rem;
  border-radius: 0.65rem;
  font-weight: 700;
  font-size: 0.75rem;
  @apply text-gray-500;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
}

.corruptOn {
  color: #ff8f9f;
  background: rgba(255, 95, 160, 0.12);
}
</style>
