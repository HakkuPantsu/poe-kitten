<template>
  <div v-if="noUniqueSelection" :class="$style.body">
    <!-- LEFT: item info + filters -->
    <div :class="$style.colInfo">
      <!-- item identity -->
      <div :class="$style.head">
        <div :class="$style.iconBox">
          <img :class="$style.iconImg" :src="iconUrl" alt="" />
        </div>
        <div :class="$style.meta">
          <div :class="[$style.itemName, rarityClass]">
            {{ item.info.name }}
          </div>
          <div :class="$style.itemBase">
            {{ item.info.refName
            }}<template v-if="item.itemLevel">
              · iLvl {{ item.itemLevel }}</template
            >
          </div>
          <div :class="$style.chips">
            <Badge
              variant="outline"
              :class="[rarityClass, 'border-white/15 bg-white/10']"
            >
              {{ rarityLabel }}
            </Badge>
            <Badge
              v-if="item.isCorrupted"
              variant="outline"
              class="border-transparent bg-pink-500/15 text-pink-300"
            >
              Corrupted
            </Badge>
            <Badge
              v-if="item.quality"
              variant="outline"
              class="border-white/15 bg-white/10 text-gray-300"
            >
              Quality +{{ item.quality }}%
            </Badge>
          </div>
        </div>
      </div>
      <filter-name :filters="itemFilters" :item="item" />
      <filters-block
        ref="filtersComponent"
        :filters="itemFilters"
        :stats="itemStats"
        :item="item"
        :presets="presets"
        @preset="selectPreset"
        @submit="doSearch = true"
      />
    </div>

    <!-- MIDDLE: seller listings -->
    <div :class="$style.colResults">
      <price-trend :item="item" :filters="itemFilters" />
      <trade-listing
        v-if="tradeAPI === 'trade' && doSearch"
        ref="tradeService"
        :filters="itemFilters"
        :stats="itemStats"
        :item="item"
      />
      <trade-bulk
        v-if="tradeAPI === 'bulk' && doSearch"
        ref="tradeService"
        :filters="itemFilters"
        :item="item"
      />
      <div v-if="!doSearch" class="flex justify-between items-center">
        <div class="flex w-40" @mouseenter="handleSearchMouseenter">
          <button
            class="btn border-transparent text-white font-bold"
            style="
              min-width: 5rem;
              background: linear-gradient(135deg, #a855f7, #ff5fb0);
              box-shadow: 0 8px 20px -8px rgba(255, 95, 176, 0.7);
            "
            @click="doSearch = true"
          >
            <i class="fas fa-magnifying-glass mr-1" />{{ t("Search") }}
          </button>
        </div>
        <div class="flex flex-row gap-1">
          <trade-links v-if="tradeAPI === 'trade'" :get-link="makeTradeLink" />
        </div>
      </div>
      <stack-value :filters="itemFilters" :item="item" />
      <tip v-if="showTip" :selected="showTip" />
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  watch,
  ref,
  nextTick,
  computed,
  ComponentPublicInstance,
} from "vue";
import { useI18n } from "vue-i18n";
import { ItemRarity, ItemCategory, ParsedItem } from "@/parser";
import TradeListing from "./trade/TradeListing.vue";
import TradeBulk from "./trade/TradeBulk.vue";
import TradeLinks from "./trade/TradeLinks.vue";
import { apiToSatisfySearch, getTradeEndpoint } from "./trade/common";
import PriceTrend from "./trends/PriceTrend.vue";
import FiltersBlock from "./filters/FiltersBlock.vue";
import { createPresets } from "./filters/create-presets";
import PricePrediction from "./price-prediction/PricePrediction.vue";
import StackValue from "./stack-value/StackValue.vue";
import FilterName from "./filters/FilterName.vue";
import Tip from "../help/Tip.vue";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_TO_TRADE_ID,
  createTradeRequest,
} from "./trade/pathofexile-trade";
import { AppConfig, TipsFrequency } from "@/web/Config";
import { FilterPreset } from "./filters/interfaces";
import { PriceCheckWidget } from "../overlay/interfaces";
import { useLeagues } from "@/web/background/Leagues";
import { randomTip, TIP_FREQUENCY_MAP } from "../help/tips";

let _showSupportLinksCounter = 0;
let _showTipCounter = 15;

export default defineComponent({
  name: "CheckedItem",
  emits: ["item-editor-selection"],
  components: {
    PricePrediction,
    TradeListing,
    TradeBulk,
    TradeLinks,
    PriceTrend,
    FiltersBlock,
    FilterName,
    StackValue,
    Tip,
    Badge,
  },
  props: {
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
    advancedCheck: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, ctx) {
    const widget = computed(() => AppConfig<PriceCheckWidget>("price-check")!);
    const leagues = useLeagues();

    const presets = ref<{ active: string; presets: FilterPreset[] }>(null!);
    const itemFilters = computed(
      () =>
        presets.value.presets.find(
          (preset) => preset.id === presets.value.active,
        )!.filters,
    );
    const itemStats = computed(
      () =>
        presets.value.presets.find(
          (preset) => preset.id === presets.value.active,
        )!.stats,
    );
    const doSearch = ref(false);
    const tradeAPI = ref<"trade" | "bulk">("bulk");

    // TradeListing.vue OR TradeBulk.vue
    const tradeService = ref<{ execSearch(): void } | null>(null);
    // FiltersBlock.vue
    const filtersComponent = ref<ComponentPublicInstance>(null!);

    watch(
      () => props.item,
      (item, prevItem) => {
        performance.mark("checked-item-item-changed");
        const prevCurrency =
          presets.value != null ? itemFilters.value.trade.currency : undefined;
        const prevListingType =
          presets.value != null
            ? itemFilters.value.trade.listingType
            : undefined;

        presets.value = createPresets(item, {
          league: leagues.selectedId.value!,
          collapseListings: widget.value.collapseListings,
          activateStockFilter: widget.value.activateStockFilter,
          searchStatRange: widget.value.searchStatRange,
          useEn:
            (AppConfig().language === "cmn-Hant" &&
              AppConfig().realm === "pc-ggg") ||
            AppConfig().preferredTradeSite === "www",
          currency:
            widget.value.rememberCurrency ||
            (prevItem &&
              item.info.namespace === prevItem.info.namespace &&
              item.info.refName === prevItem.info.refName)
              ? prevCurrency
              : undefined,
          listingType: widget.value.rememberListingType
            ? prevListingType
            : undefined,
          defaultAllSelected: widget.value.defaultAllSelected,
        });

        if (
          (!props.advancedCheck && !widget.value.smartInitialSearch) ||
          (props.advancedCheck && !widget.value.lockedInitialSearch)
        ) {
          doSearch.value = false;
        } else {
          doSearch.value = Boolean(
            item.rarity === ItemRarity.Unique ||
              item.category === ItemCategory.HeistBlueprint ||
              item.category === ItemCategory.SanctumRelic ||
              item.category === ItemCategory.Charm ||
              !CATEGORY_TO_TRADE_ID.has(item.category!) ||
              item.isUnidentified ||
              item.isVeiled,
          );
        }

        tradeAPI.value = apiToSatisfySearch(
          props.item,
          itemStats.value,
          itemFilters.value,
        );

        if (tradeAPI.value === "bulk") {
          itemFilters.value.trade.listingType = "online";
        }
        performance.mark("checked-item-switch-item-end");
      },
      { immediate: true, deep: true },
    );

    watch(
      () => [props.item, doSearch.value],
      () => {
        if (doSearch.value === false) return;

        tradeAPI.value = apiToSatisfySearch(
          props.item,
          itemStats.value,
          itemFilters.value,
        );

        // NOTE: child `trade-xxx` component renders/receives props on nextTick
        nextTick(() => {
          if (tradeService.value) {
            tradeService.value.execSearch();
          }
        });
      },
      { deep: false, immediate: true },
    );

    watch(
      () => [props.item, doSearch.value, itemStats.value, itemFilters.value],
      (curr, prev) => {
        const cItem = curr[0];
        const pItem = prev[0];
        const cIntaracted = curr[1];
        const pIntaracted = prev[1];

        if (cItem === pItem && cIntaracted === true && pIntaracted === true) {
          // force user to press Search button on change
          doSearch.value = false;
        }
      },
      { deep: true },
    );

    watch(
      () => [props.item, JSON.stringify(itemFilters.value.trade)],
      (curr, prev) => {
        const cItem = curr[0];
        const pItem = prev[0];
        const cTrade = curr[1];
        const pTrade = prev[1];

        if (cItem === pItem && cTrade !== pTrade) {
          nextTick(() => {
            doSearch.value = true;
          });
        }
      },
      { deep: false },
    );

    const noUniqueSelection = computed(() => {
      return !(
        props.item.rarity === ItemRarity.Unique &&
        props.item.isUnidentified &&
        props.item.info.unique == null
      );
    });

    const iconUrl = computed(() => {
      const icon = props.item.info.icon;
      return !icon || icon === "%NOT_FOUND%" ? "/images/404.png" : icon;
    });

    const rarityLabel = computed(() => {
      switch (props.item.rarity) {
        case ItemRarity.Unique:
          return "Unique";
        case ItemRarity.Rare:
          return "Rare";
        case ItemRarity.Magic:
          return "Magic";
        default:
          return "Normal";
      }
    });

    const rarityClass = computed(() => {
      switch (props.item.rarity) {
        case ItemRarity.Unique:
          return "text-unique";
        case ItemRarity.Rare:
          return "text-rare";
        case ItemRarity.Magic:
          return "text-magic";
        default:
          return "text-normal";
      }
    });

    function handleSearchMouseenter(e: MouseEvent) {
      if (
        (filtersComponent.value.$el as HTMLElement).contains(
          e.relatedTarget as HTMLElement,
        )
      ) {
        doSearch.value = true;

        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    }

    const showSupportLinks = ref(false);
    const showTip = ref(0);
    watch(
      () => [props.item, doSearch.value],
      ([cItem, cInteracted], [pItem]) => {
        if (
          _showSupportLinksCounter >= 13 &&
          (!cInteracted || tradeAPI.value === "bulk")
        ) {
          showSupportLinks.value = true;
          _showSupportLinksCounter = 0;
        } else {
          showSupportLinks.value = false;
          if (
            AppConfig().tipsFrequency !== TipsFrequency.Never &&
            (AppConfig().tipsFrequency === TipsFrequency.Always ||
              _showTipCounter >=
                TIP_FREQUENCY_MAP[AppConfig().tipsFrequency]) &&
            !cInteracted
          ) {
            _showTipCounter = 0;
            showTip.value = randomTip();
          } else {
            showTip.value = 0;
            if (cItem !== pItem) {
              _showTipCounter += 1;
            }
          }

          if (cItem !== pItem) {
            _showSupportLinksCounter += 1;
          }
        }
      },
    );

    watch(
      () => itemFilters.value.itemEditorSelection,
      (val) => {
        ctx.emit("item-editor-selection", val);
      },
      { deep: true },
    );

    const { t } = useI18n();

    return {
      t,
      iconUrl,
      rarityLabel,
      rarityClass,
      itemFilters,
      itemStats,
      doSearch,
      tradeAPI,
      tradeService,
      filtersComponent,
      showTip,
      noUniqueSelection,
      handleSearchMouseenter,
      showSupportLinks,
      presets: computed(() =>
        presets.value.presets.map((preset) => ({
          id: preset.id,
          active: preset.id === presets.value.active,
        })),
      ),
      selectPreset(id: string) {
        presets.value.active = id;
      },
      makeTradeLink() {
        return `https://${getTradeEndpoint()}/trade2/search/poe2/${itemFilters.value.trade.league}?q=${JSON.stringify(createTradeRequest(itemFilters.value, itemStats.value, props.item))}`;
      },
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(17rem, 22rem) minmax(0, 1fr);
  gap: 1rem;
  padding: 1rem;
}

.colInfo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.colResults {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.head {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
  margin-bottom: 0.7rem;
  padding: 0.75rem 0.8rem;
  border-radius: 1rem;
  border: 2px solid theme("colors.gray.700");
  background: linear-gradient(
    120deg,
    rgba(168, 85, 247, 0.16),
    rgba(255, 95, 176, 0.08)
  );
}

.iconBox {
  width: 4rem;
  height: 4rem;
  flex: none;
  border-radius: 1rem;
  display: grid;
  place-items: center;
  padding: 0.3rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid theme("colors.gray.700");
  overflow: hidden;
}

.iconImg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
}

.meta {
  flex: 1;
  min-width: 0;
}

.itemName {
  font-weight: 800;
  font-size: 1.2rem;
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.itemBase {
  font-size: 0.75rem;
  @apply text-gray-400;
  margin-top: 0.1rem;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.45rem;
}

.chip {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  @apply text-gray-300;
  background: rgba(255, 255, 255, 0.08);
}

.chipRarity {
  background: rgba(255, 255, 255, 0.1);
}

.chipBad {
  color: #ff8f9f;
  background: rgba(255, 95, 160, 0.14);
}
</style>
