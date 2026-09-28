<template>
  <div v-if="!error" class="layout-column min-h-0" style="height: auto">
    <div class="mb-2 flex pl-2">
      <div class="flex items-baseline text-gray-500 mr-2">
        <span class="mr-1">{{ t(":matched") }}</span>
        <span v-if="!list" class="text-gray-600">...</span>
        <span v-else>{{ list.total }}{{ list.inexact ? "+" : "" }}</span>
      </div>
      <online-filter
        v-if="list"
        :by-time="true"
        :filters="filters"
        api="trade"
      />
      <div class="flex-1"></div>
      <trade-links v-if="list" :get-link="makeTradeLink" />
    </div>

    <!-- headline price -->
    <div v-if="bestListing" :class="$style.headline">
      <div :class="$style.hlLeft">
        <div :class="$style.hlLabel">Lowest price</div>
        <div :class="$style.hlPrice">
          <span :class="$style.hlAmount">
            <AnimatedNumber :value="bestListing.priceAmount" />
          </span>
          <span :class="$style.hlCurrency">{{
            bestListing.priceCurrency
          }}</span>
        </div>
        <div :class="$style.hlSub">
          {{ list ? list.total : "…" }}{{ list?.inexact ? "+" : "" }} listings
          <span :class="$style.hlDot">·</span>
          <span
            v-if="bestListing.accountStatus === 'online'"
            :class="$style.hlOnline"
            >● online</span
          >
          <span v-else-if="bestListing.accountStatus === 'afk'">afk</span>
          <span v-else>offline</span>
        </div>
      </div>
      <div :class="$style.hlActions">
        <button class="btn" @click="copyWhisper">
          <i class="fas fa-comment-dots" />
          {{ copied === "whisper" ? "Copied!" : "Whisper" }}
        </button>
        <button class="btn" @click="copyPrice">
          <i class="fas fa-copy" />
          {{ copied === "price" ? "Copied!" : "Copy" }}
        </button>
        <button class="btn" @click="openTradeLink">
          <i class="fas fa-arrow-up-right-from-square" /> Trade
        </button>
      </div>
    </div>

    <div class="layout-column overflow-y-auto overflow-x-hidden">
      <table class="table-stripped w-full">
        <thead>
          <tr class="text-left">
            <th class="trade-table-heading">
              <div class="px-2">{{ t(":price") }}</div>
            </th>
            <th v-if="item.stackSize" class="trade-table-heading">
              <div class="px-2">{{ t(":stock") }}</div>
            </th>
            <th v-if="filters.itemLevel" class="trade-table-heading">
              <div class="px-2">{{ t(":item_level") }}</div>
            </th>
            <th
              v-if="isGem || item.category === ItemCategory.UncutGem"
              class="trade-table-heading"
            >
              <div class="px-2">{{ t(":gem_level") }}</div>
            </th>
            <th v-if="isGem || grantsSkill" class="trade-table-heading">
              <div class="px-2">{{ t(":gem_sockets") }}</div>
            </th>
            <th
              v-if="(filters.quality && !filters.quality.disabled) || isGem"
              class="trade-table-heading"
            >
              <div class="px-2">{{ t(":quality") }}</div>
            </th>
            <th class="trade-table-heading" :class="{ 'w-full': !showSeller }">
              <div class="pr-2 pl-4">
                <span class="ml-1" style="padding-left: 0.375rem">{{
                  t(":listed")
                }}</span>
              </div>
            </th>
            <th v-if="showSeller" class="trade-table-heading w-full">
              <div class="px-2">{{ t(":seller") }}</div>
            </th>
          </tr>
        </thead>
        <tbody style="overflow: scroll">
          <template v-for="(result, idx) in groupedResults">
            <tr v-if="!result" :key="idx">
              <td colspan="100" class="text-transparent">***</td>
            </tr>
            <trade-item
              v-else
              :key="result.id"
              :result="result"
              :item="item"
              :show-seller="showSeller"
              :item-level="filters.itemLevel"
              :quality="filters.quality"
            />
          </template>
        </tbody>
      </table>
      <!-- LIKELY PRICE FIXED -->
      <div
        v-if="isLikelyPriceFixed"
        class="p-2 border-2 border-gray-600 rounded mt-2"
      >
        <div class="flex text-gray-400 leading-none">
          <div class="mt-1">
            {{ t(":likely_price_fixed") }}
          </div>
          <div class="flex-1" />
          <div class="pl-2">
            <button class="btn" @click="execFilterExaltDivine">
              {{ t(":filter_exalt_divine") }}
              <i class="fas fa-history text-xs" />
            </button>
          </div>
        </div>
      </div>

      <!-- Extraction Value -->
      <extraction-value :item="item" :first-result="groupedResults.at(0)" />

      <!-- ADDED AUGMENTS COST -->
      <!-- <div
        v-if="addedAugments && addedAugments.length"
        class="p-2 border-2 border-gray-600 rounded mt-2 flex items-center"
      >
        <div class="w-fit">{{ t(":added_augments") }}</div>
        <div class="flex px-2 items-center">
          <item-sum-price
            :items="
              addedAugments.map((augment) =>
                augment ? augment.baseItem : null,
              )
            "
          />
        </div>
      </div> -->
    </div>
  </div>
  <ui-error-box v-else>
    <template #name>{{ t(":error") }}</template>
    <p>Error: {{ error }}</p>
    <div v-if="error && errorFix" class="border p-1 rounded">
      {{ errorFix }}
    </div>
    <template #actions>
      <button class="btn" @click="execSearch">{{ t("Retry") }}</button>
      <button class="btn" @click="openTradeLink">{{ t("Browser") }}</button>
    </template>
  </ui-error-box>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  watch,
  PropType,
  inject,
  ref,
  onMounted,
  onUnmounted,
} from "vue";
import { useI18nNs } from "@/web/i18n";
import UiPopover from "@/web/ui/Popover.vue";
import UiErrorBox from "@/web/ui/UiErrorBox.vue";
import { createTradeRequest } from "./pathofexile-trade";
import { getTradeEndpoint } from "./common";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/interfaces";
import { ItemFilters, StatFilter } from "../filters/interfaces";
import { ItemCategory, ParsedItem } from "@/parser";
import { artificialSlowdown } from "./artificial-slowdown";
import ItemQuickPrice from "@/web/ui/ItemQuickPrice.vue";
import OnlineFilter from "./OnlineFilter.vue";
import TradeLinks from "./TradeLinks.vue";
import TradeItem from "./TradeItem.vue";
import { useTradeApi } from "./trade-api";
import { GEM, GRANTS_REAL_SKILL } from "@/parser/meta";
import ItemSumPrice from "@/web/ui/ItemSumPrice.vue";
import ExtractionValue from "./ExtractionValue.vue";
import AnimatedNumber from "@/web/ui/AnimatedNumber.vue";

const slowdown = artificialSlowdown(900);

const SHOW_RESULTS = 20;

export default defineComponent({
  components: {
    ExtractionValue,
    ItemQuickPrice,
    ItemSumPrice,
    OnlineFilter,
    TradeLinks,
    TradeItem,
    UiErrorBox,
    UiPopover,
    AnimatedNumber,
  },
  props: {
    filters: {
      type: Object as PropType<ItemFilters>,
      required: true,
    },
    stats: {
      type: Array as PropType<StatFilter[]>,
      required: true,
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
  },
  setup(props) {
    const widget = computed(() => AppConfig<PriceCheckWidget>("price-check")!);
    watch(
      () => props.item,
      (item) => {
        slowdown.reset(item);
      },
      { immediate: true },
    );

    const { error, searchResult, groupedResults, search } = useTradeApi();

    const showBrowser = inject<(url: string) => void>("builtin-browser")!;

    const { t } = useI18nNs("trade_result");

    const copied = ref<"" | "whisper" | "price">("");
    const bestListing = computed(() => {
      const list = groupedResults.value;
      return list.find((r) => !r.gone) ?? list[0];
    });

    async function copyToClipboard(text: string, kind: "whisper" | "price") {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* clipboard unavailable */
      }
      copied.value = kind;
      window.setTimeout(() => (copied.value = ""), 1400);
    }

    function copyPrice() {
      const r = bestListing.value;
      if (r) copyToClipboard(`${r.priceAmount} ${r.priceCurrency}`, "price");
    }

    function copyWhisper() {
      const r = bestListing.value;
      if (!r) return;
      const league = props.filters.trade.league;
      copyToClipboard(
        `@${r.ign || r.accountName} Hi, I would like to buy your ${props.item.info.name} listed for ${r.priceAmount} ${r.priceCurrency} in ${league}.`,
        "whisper",
      );
    }

    function makeTradeLink() {
      return searchResult.value
        ? `https://${getTradeEndpoint()}/trade2/search/poe2/${props.filters.trade.league}/${searchResult.value.id}`
        : `https://${getTradeEndpoint()}/trade2/search/poe2/${props.filters.trade.league}?q=${JSON.stringify(createTradeRequest(props.filters, props.stats, props.item))}`;
    }

    // Shift Key Detection
    const isShiftPressed = ref(false);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        isShiftPressed.value = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        isShiftPressed.value = false;
      }
    };

    onMounted(() => {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    });

    onUnmounted(() => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    });

    return {
      t,
      copied,
      bestListing,
      copyPrice,
      copyWhisper,
      list: searchResult,
      groupedResults: computed(() => {
        if (!slowdown.isReady.value) {
          return Array<undefined>(SHOW_RESULTS);
        } else {
          return [
            ...groupedResults.value,
            ...(groupedResults.value.length < SHOW_RESULTS
              ? Array<undefined>(SHOW_RESULTS - groupedResults.value.length)
              : []),
          ];
        }
      }),
      execSearch: () => {
        search(props.filters, props.stats, props.item);
      },
      execFilterExaltDivine: () => {
        props.filters.trade.currency = "exalted_divine";
      },
      error,
      errorFix: computed(() => {
        console.log(error.value);
        if (error.value?.startsWith("Query is too complex.")) {
          return t(":fix_complex_query");
        }

        return undefined;
      }),
      showSeller: computed(() => widget.value.showSeller),
      makeTradeLink,
      openTradeLink() {
        showBrowser(makeTradeLink());
      },
      // Shift key state and methods
      isShiftPressed,
      ItemCategory,
      isGem: computed(
        () => props.item.category && GEM.has(props.item.category),
      ),
      grantsSkill: computed(
        () => props.item.category && GRANTS_REAL_SKILL.has(props.item.category),
      ),
      isLikelyPriceFixed: computed(() => {
        if (groupedResults.value.length <= 15) {
          return false;
        }
        const commonCurrencyPrices = groupedResults.value.filter((res) => {
          return (
            // is a common currency
            /chaos|exalted|divine/i.test(res.priceCurrency) ||
            // is a common very low value currency (but not enhanced versions)
            // NOTE: BECAUSE WE CANT HAVE NICE THINGS HERE
            ((res.priceCurrency === "aug" ||
              res.priceCurrency === "regal" ||
              res.priceCurrency === "transmute") &&
              res.priceAmount < 30)
          );
        });
        if (commonCurrencyPrices.length < 5) {
          return true;
        }

        return false;
      }),
      addedAugments: computed(() => {
        return props.item.augmentSockets?.augments.filter(
          (i) => i && !i.existing,
        );
      }),
    };
  },
});
</script>

<style lang="postcss">
@reference "../../../assets/tailwind.css";

.trade-table-heading {
  @apply sticky top-0;
  @apply p-0 m-0;
  @apply whitespace-nowrap;
  background: theme("colors.gray.900");
  z-index: 1;

  & > div {
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    @apply text-gray-500;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid theme("colors.gray.700");
  }
}

table tbody tr:hover {
  background: rgba(199, 125, 255, 0.08);
}

table tbody td {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

table tbody tr {
  animation: rowIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes rowIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* best (cheapest) listing gets a rail like the mockup */
table.table-stripped tbody tr:first-child {
  background: linear-gradient(
    90deg,
    rgba(199, 125, 255, 0.16),
    rgba(199, 125, 255, 0.02)
  );
  box-shadow: inset 3px 0 0 0 theme("colors.purple.400");
}

.account-status {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 100%;

  &.instantBuyout {
    /* */
  }

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

<style lang="postcss" module>
@reference "../../../assets/tailwind.css";

.headline {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0 0.5rem 0.75rem;
  padding: 1rem 1.1rem;
  border-radius: 1rem;
  border: 2px solid theme("colors.gray.700");
  background: linear-gradient(
    120deg,
    rgba(168, 85, 247, 0.18),
    rgba(255, 95, 176, 0.1)
  );
}

.headline::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    120deg,
    rgba(168, 85, 247, 0.28),
    rgba(255, 95, 176, 0.2),
    rgba(110, 231, 200, 0.14),
    rgba(168, 85, 247, 0.28)
  );
  background-size: 300% 300%;
  animation: holoShift 9s ease infinite;
  opacity: 0.7;
}

.headline > * {
  position: relative;
  z-index: 1;
}

@keyframes holoShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.hlLeft {
  flex: 1;
  min-width: 0;
}

.hlLabel {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  @apply text-gray-500;
}

.hlPrice {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  margin: 0.15rem 0;
}

.hlAmount {
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1;
  color: #fff;
  text-shadow: 0 0 16px rgba(199, 125, 255, 0.6);
}

.hlCurrency {
  font-size: 0.85rem;
  font-weight: 700;
  @apply text-gray-300;
}

.hlSub {
  font-size: 0.72rem;
  @apply text-gray-500;
}

.hlDot {
  padding: 0 0.3rem;
}

.hlOnline {
  color: #59d97a;
  font-weight: 700;
}

.hlActions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
</style>
