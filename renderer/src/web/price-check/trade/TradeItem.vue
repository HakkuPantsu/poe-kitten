<template>
  <tr ref="target" @mouseenter="onEnter" @mouseleave="onLeave">
    <td class="px-2 whitespace-nowrap">
      <span
        >{{ result.priceAmount }} {{ result.priceCurrency
        }}{{
          result.normalizedPriceCurrency &&
          result.priceCurrency !== result.normalizedPriceCurrency.id &&
          result.priceCurrency !== "divine" &&
          result.normalizedPrice
            ? ` (${result.normalizedPrice} ${result.normalizedPriceCurrency.abbrev})`
            : ""
        }}</span
      >
      <span
        v-if="result.listedTimes > 2"
        class="rounded px-1 text-gray-800 bg-gray-400 -mr-2"
        ><span class="font-sans">×</span> {{ result.listedTimes }}</span
      ><i v-else-if="!result.hasNote" class="fas fa-question" />
    </td>
    <td v-if="item.stackSize" class="px-2 text-right">
      {{ result.stackSize }}
    </td>

    <td v-if="itemLevel" class="px-2 whitespace-nowrap text-right">
      {{ result.itemLevel }}
    </td>
    <td
      v-if="isGem || item.category === ItemCategory.UncutGem"
      class="pl-2 whitespace-nowrap"
    >
      {{ result.level }}
    </td>
    <td v-if="isGem || grantsSkill" class="pl-2 whitespace-nowrap">
      {{ result.gemSockets }}
    </td>
    <td
      v-if="(quality && !quality.disabled) || isGem"
      class="px-2 whitespace-nowrap text-blue-400 text-right"
    >
      {{ result.quality }}
    </td>
    <td class="pr-2 pl-4 whitespace-nowrap">
      <div class="inline-flex items-center">
        <div
          class="account-status"
          :class="
            result.isInstantBuyout ? 'instantBuyout' : result.accountStatus
          "
        ></div>
        <div class="ml-1 font-sans text-xs">
          {{ result.relativeDate }}
        </div>
      </div>
      <span
        v-if="!showSeller && result.isMine"
        class="rounded px-1 text-gray-800 bg-gray-400 ml-1"
        >{{ t("You") }}</span
      >
      <span
        v-if="!showSeller && result.inDemand"
        class="rounded px-1 bg-yellow-500 text-black ml-1"
        >{{ t("in demand") }}</span
      >
      <span
        v-if="!showSeller && result.gone"
        class="rounded border px-1 border-red-500 text-red-500 ml-1"
        >{{ t("Gone") }}</span
      >
    </td>
    <td v-if="showSeller" class="px-2 whitespace-nowrap">
      <span
        v-if="result.isMine"
        class="rounded px-1 text-gray-800 bg-gray-400"
        >{{ t("You") }}</span
      >
      <span v-else class="font-sans text-xs">{{
        showSeller === "ign" ? result.ign : result.accountName
      }}</span>
      <span
        v-if="result.inDemand"
        class="rounded px-1 bg-yellow-500 text-black ml-1"
        >{{ t("in demand") }}</span
      >
      <span
        v-if="!showSeller && result.gone"
        class="rounded border-2 px-1 border-red-500 text-red-500 ml-1"
        >{{ t("Gone") }}</span
      >
    </td>
  </tr>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";
import { PricingResult } from "./pathofexile-trade";
import { ParsedItem } from "@/parser/ParsedItem";
import { FilterNumeric } from "../filters/interfaces";
import { useI18nNs } from "@/web/i18n";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import { ItemCategory } from "@/parser";
import { useHoveredListing } from "./hovered-listing";
import { GEM, GRANTS_REAL_SKILL } from "@/parser/meta";

export default defineComponent({
  name: "TradeItem",
  props: {
    result: {
      type: Object as PropType<
        PricingResult & {
          listedTimes: number;
        }
      >,
      required: true,
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
    showSeller: {
      type: [Boolean, String] as PropType<PriceCheckWidget["showSeller"]>,
      default: undefined,
    },
    itemLevel: {
      type: Object as PropType<FilterNumeric>,
      default: undefined,
    },
    quality: {
      type: Object as PropType<FilterNumeric>,
      default: undefined,
    },
  },
  setup(props) {
    const target = ref<HTMLElement>(null!);
    const { t } = useI18nNs("trade_result");
    const isHovered = ref(false);
    const { setHovered } = useHoveredListing();

    function onEnter() {
      isHovered.value = true;
      setHovered(props.result);
    }

    function onLeave() {
      isHovered.value = false;
      // deliberately keep the last hovered listing pinned in the preview pane
    }

    return {
      t,
      target,
      isHovered,
      onEnter,
      onLeave,
      ItemCategory,
      isGem: computed(
        () => props.item.category && GEM.has(props.item.category),
      ),
      grantsSkill: computed(
        () => props.item.category && GRANTS_REAL_SKILL.has(props.item.category),
      ),
    };
  },
});
</script>

<style lang="postcss">
@reference "../../../assets/tailwind.css";

.account-status {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 100%;

  &.online {
    @apply bg-pink-400;
  }

  &.offline {
    @apply bg-red-600;
  }

  &.afk {
    @apply bg-orange-500;
  }

  &.rank-2 {
    @apply bg-blue-600;
  }

  &.rank-3 {
    @apply bg-yellow-600;
  }
}
</style>
