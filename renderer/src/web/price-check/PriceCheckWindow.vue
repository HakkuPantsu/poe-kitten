<template>
  <div
    style="top: 0; left: 0; height: 100%; width: 100%; position: absolute"
    class="flex justify-center items-start pointer-events-none"
  >
    <div
      id="price-window"
      class="layout-column text-gray-200 pointer-events-auto widget-default-style"
      :style="{
        width: 'min(78rem, 94vw)',
        height: 'min(94vh, 62rem)',
        maxHeight: 'calc(100% - 1rem)',
        margin: '0.5rem',
        overflow: 'hidden',
        transform: `translate(${pos.x}px, ${pos.y}px)`,
      }"
    >
      <AppTitleBar
        :class="$style.dragBar"
        @mousedown="onHeaderMouseDown"
        @close="closePriceCheck"
        @click="openLeagueSelection"
        :title="title"
      >
        <ui-popover
          v-if="stableOrbCost && xchgRateCurrency?.id"
          trigger="click"
          boundary="#price-window"
        >
          <template #target>
            <button>
              <i class="fas fa-exchange-alt" /> {{ stableOrbCost }}
            </button>
          </template>
          <template #content>
            <item-quick-price
              class="text-base"
              :price="{
                min: stableOrbCost,
                max: stableOrbCost,
                currency: xchgRateCurrency.id,
              }"
              item-img="/images/divine.png"
            />
            <div v-for="i in 9" :key="i">
              <div class="pl-1">
                {{ i / 10 }} div ⇒ {{ Math.round((stableOrbCost * i) / 10) }}
                {{ xchgRateCurrency.abbrev }}
              </div>
            </div>
          </template>
        </ui-popover>
        <i v-else-if="xchgRateLoading()" class="fas fa-dna fa-spin px-2" />
        <div v-else class="w-8" />
      </AppTitleBar>

      <div
        v-if="isBrowserShown"
        class="bg-gray-900 px-4 py-1.5 text-xs text-gray-500"
      >
        <i18n-t keypath="app.toggle_browser_hint" tag="span">
          <span class="bg-gray-400 text-gray-900 rounded px-1">{{
            overlayKey
          }}</span>
        </i18n-t>
      </div>

      <div class="grow flex min-h-0 bg-gray-900">
        <webview
          v-if="isBrowserShown"
          ref="iframeEl"
          class="pointer-events-auto grow"
          width="100%"
          height="100%"
        />
        <template v-else>
          <div class="grow layout-column min-h-0 min-w-0">
            <background-info />
            <check-position-circle
              v-if="showCheckPos"
              :position="checkPosition"
              style="z-index: -1"
            />
            <template v-if="item?.isErr()">
              <ui-error-box class="m-4">
                <template #name>{{ t(item.error.name) }}</template>
                <template #actions
                  ><reload-trade-data
                    :item-text="item.error.rawText"
                    :pos="checkPosition"
                /></template>
                <p>
                  {{
                    item.error.format
                      ? t(item.error.message, item.error.format)
                      : t(item.error.message)
                  }}
                </p>
              </ui-error-box>
              <pre class="bg-gray-900 rounded m-4 overflow-x-hidden p-2">{{
                item.error.rawText
              }}</pre>
            </template>
            <template v-else-if="item?.isOk()">
              <unidentified-resolver
                :item="item.value"
                @identify="handleIdentification($event)"
              />
              <checked-item
                v-if="isLeagueSelected"
                :item="item.value"
                :advanced-check="advancedCheck"
              />
            </template>
          </div>

          <aside :class="$style.pane">
            <related-items
              v-if="item?.isOk()"
              class="pointer-events-auto"
              :item="item.value"
              :click-position="clickPosition"
            />
            <Card class="gap-0 overflow-hidden bg-black/25">
              <Label :class="$style.paneLabel">Seller's item</Label>
              <seller-item-preview v-if="hovered" :result="hovered" />
              <div v-else :class="$style.paneEmpty">
                <i class="fas fa-hand-pointer" />
                <span>Hover a listing to preview the seller's item.</span>
              </div>
            </Card>

            <Card v-if="hovered" class="gap-2 bg-black/25 p-2.5">
              <Label :class="$style.paneLabel">Quick actions</Label>

              <Button
                class="w-full border-transparent bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                @click="runAction(hovered, 1)"
              >
                <i class="fas fa-comment-dots" />{{
                  copied === "whisper" ? "Copied!" : "Whisper seller"
                }}
              </Button>

              <div :class="$style.actionRow">
                <Button
                  v-for="opt in offerOptions"
                  :key="opt.label"
                  variant="outline"
                  size="sm"
                  class="flex-1"
                  :disabled="!canOffer(hovered)"
                  :title="
                    canOffer(hovered)
                      ? ''
                      : `Can't offer less than 1 ${hovered.priceCurrency}${
                          canCross(hovered)
                            ? ' — use the cross-currency offer'
                            : ''
                        }`
                  "
                  @click="runAction(hovered, opt.factor)"
                >
                  {{ opt.label }}
                </Button>
              </div>

              <Button
                v-if="canCross(hovered)"
                variant="secondary"
                size="sm"
                class="w-full"
                @click="runAction(hovered, 0.9, true)"
              >
                <i class="fas fa-right-left" /> Offer in
                {{ crossLabel(hovered) }} (−10%)
              </Button>

              <div :class="$style.mannerRow">
                <button
                  v-for="m in manners"
                  :key="m.id"
                  :class="[
                    $style.mannerBtn,
                    { [$style.mannerOn]: manner === m.id },
                  ]"
                  @click="manner = m.id"
                >
                  {{ m.label }}
                </button>
              </div>

              <div :class="$style.angleLabel">Angle</div>
              <div :class="$style.reasonRow">
                <button
                  v-for="r in reasons"
                  :key="r.id"
                  :class="[
                    $style.reasonBtn,
                    { [$style.reasonOn]: reason === r.id },
                  ]"
                  @click="reason = r.id"
                >
                  {{ r.label }}
                </button>
              </div>

              <div :class="$style.previewBox">
                <Label :class="$style.previewHint">Message preview</Label>
                <div :class="$style.previewText">
                  {{ preview || "Pick an action to compose a message…" }}
                </div>
              </div>

              <div :class="$style.actionRow">
                <Button
                  variant="outline"
                  size="sm"
                  class="flex-1"
                  @click="copyPrice(hovered)"
                >
                  <i class="fas fa-copy" />{{
                    copied === "price" ? "Copied!" : "Copy price"
                  }}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="flex-1"
                  @click="visitHideout"
                >
                  <i class="fas fa-house" /> Visit hideout
                </Button>
              </div>
            </Card>

            <rate-limiter-state class="pointer-events-auto" />
          </aside>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  inject,
  PropType,
  shallowRef,
  watch,
  computed,
  nextTick,
  provide,
  ref,
} from "vue";
import { Result, ok, err } from "neverthrow";
import { useI18n } from "vue-i18n";
import UiErrorBox from "@/web/ui/UiErrorBox.vue";
import UiPopover from "@/web/ui/Popover.vue";
import CheckedItem from "./CheckedItem.vue";
import BackgroundInfo from "./BackgroundInfo.vue";
import { MainProcess, Host } from "@/web/background/IPC";
import { usePoeninja } from "../background/Prices";
import { useLeagues } from "@/web/background/Leagues";
import { AppConfig } from "@/web/Config";
import { ItemCategory, ItemRarity, parseClipboard, ParsedItem } from "@/parser";
import RelatedItems from "./related-items/RelatedItems.vue";
import SellerItemPreview from "./trade/SellerItemPreview.vue";
import { useHoveredListing } from "./trade/hovered-listing";
import { useRecentChecks } from "./recent-checks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { PricingResult } from "./trade/pathofexile-trade";
import RateLimiterState from "./trade/RateLimiterState.vue";
import UnidentifiedResolver from "./unidentified-resolver/UnidentifiedResolver.vue";
import CheckPositionCircle from "./CheckPositionCircle.vue";
import AppTitleBar from "@/web/ui/AppTitlebar.vue";
import ItemQuickPrice from "@/web/ui/ItemQuickPrice.vue";
import {
  PriceCheckWidget,
  WidgetManager,
  WidgetSpec,
} from "../overlay/interfaces";
import { loadUltraLateItems } from "@/assets/data";
import ReloadTradeData from "./fallback/ReloadTradeData.vue";

type ParseError = {
  name: string;
  message: string;
  rawText: ParsedItem["rawText"];
  format?: string[];
};

type WhisperManner = "polite" | "friendly" | "urgent" | "hardball";

export default defineComponent({
  widget: {
    type: "price-check",
    instances: "single",
    initInstance: (): PriceCheckWidget => {
      return {
        wmId: 0,
        wmType: "price-check",
        wmTitle: "",
        wmWants: "hide",
        wmZorder: "exclusive",
        wmFlags: ["hide-on-blur", "menu::skip"],
        showRateLimitState: false,
        apiLatencySeconds: 2,
        collapseListings: "api",
        smartInitialSearch: true,
        lockedInitialSearch: true,
        activateStockFilter: false,
        builtinBrowser: false,
        hotkey: "F6",
        hotkeyHold: "Ctrl",
        hotkeyLocked: "Ctrl + Shift + F6",
        showSeller: false,
        searchStatRange: 10,
        showCursor: true,
        requestPricePrediction: false,
        rememberCurrency: false,
        // New Settings POE Kitten
        defaultAllSelected: false,
        itemHoverTooltip: "keybind",
        alwaysShowTier: false,
        coreCurrency: "exalted",
        currencyVolume: "both",
        rememberListingType: false,
        initialDelay: 48,
        savedAugments: {},
      };
    },
  } satisfies WidgetSpec,
  components: {
    AppTitleBar,
    CheckedItem,
    UnidentifiedResolver,
    BackgroundInfo,
    RelatedItems,
    RateLimiterState,
    SellerItemPreview,
    Button,
    Card,
    Label,
    CheckPositionCircle,
    ItemQuickPrice,
    UiErrorBox,
    UiPopover,
    ReloadTradeData,
  },
  props: {
    config: {
      type: Object as PropType<PriceCheckWidget>,
      required: true,
    },
  },
  setup(props) {
    const leagueId = computed(() => AppConfig().leagueId);

    watch(
      () => leagueId.value,
      () => {
        // still need this for when leagueId changes
        loadUltraLateItems();
      },
      { immediate: true },
    );

    const wm = inject<WidgetManager>("wm")!;
    const { hovered, setHovered } = useHoveredListing();
    const recent = useRecentChecks();

    const pos = ref({ x: 0, y: 0 });
    const didDrag = ref(false);
    let dragState: {
      sx: number;
      sy: number;
      ox: number;
      oy: number;
    } | null = null;

    function onHeaderMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      dragState = {
        sx: e.clientX,
        sy: e.clientY,
        ox: pos.value.x,
        oy: pos.value.y,
      };
      didDrag.value = false;
      window.addEventListener("mousemove", onHeaderMouseMove);
      window.addEventListener("mouseup", onHeaderMouseUp);
    }

    function onHeaderMouseMove(e: MouseEvent) {
      if (!dragState) return;
      const dx = e.clientX - dragState.sx;
      const dy = e.clientY - dragState.sy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.value = true;
      pos.value = { x: dragState.ox + dx, y: dragState.oy + dy };
    }

    function onHeaderMouseUp() {
      dragState = null;
      window.removeEventListener("mousemove", onHeaderMouseMove);
      window.removeEventListener("mouseup", onHeaderMouseUp);
    }

    const copied = ref<"" | "whisper" | "price">("");

    async function copyToClipboard(text: string, kind: "whisper" | "price") {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* clipboard unavailable */
      }
      copied.value = kind;
      window.setTimeout(() => (copied.value = ""), 1400);
    }

    const manner = ref<WhisperManner>("polite");
    const reason = ref("");
    const preview = ref("");

    const manners: Array<{ id: WhisperManner; label: string }> = [
      { id: "polite", label: "Polite" },
      { id: "friendly", label: "Friendly" },
      { id: "urgent", label: "Urgent" },
      { id: "hardball", label: "Hardball" },
    ];

    const reasons: Array<{ id: string; label: string }> = [
      { id: "", label: "None" },
      { id: "short", label: "Low on currency" },
      { id: "new", label: "New player" },
      { id: "friend", label: "Gearing a friend" },
      { id: "budget", label: "Budget build" },
      { id: "returning", label: "Returning player" },
      { id: "gift", label: "Buying as a gift" },
      { id: "bulk", label: "Buying in bulk" },
    ];

    const REASON_LINES: Record<string, string> = {
      short:
        "I'm a bit short on currency right now — is there any wiggle room?",
      new: "I just started this league and I'm still learning the ropes — would you help me out?",
      friend:
        "I'm trying to gear up a friend who just joined — any chance you'd do me a favour?",
      budget:
        "I'm running a budget build, so every bit helps — would you consider it?",
      returning:
        "Just getting back into the game and rebuilding my gear — mind helping me out?",
      gift: "It's a gift for a friend's new character — would you be able to help?",
      bulk: "I'd love to buy a few of these — could you do a bulk price?",
    };

    const offerOptions = [
      { label: "Offer −10%", factor: 0.9 },
      { label: "Offer −25%", factor: 0.75 },
      { label: "Lowball −50%", factor: 0.5 },
    ];

    function crossOffer(
      result: PricingResult,
      factor: number,
    ): { amount: number; currency: string } | null {
      // 1) use the trade API's normalized price when the listing is in an
      //    unusual currency (e.g. "1 vaal" normalized to "7 exalted")
      const normalized = Number(result.normalizedPrice);
      const normCur = result.normalizedPriceCurrency;
      if (
        normCur &&
        Number.isFinite(normalized) &&
        normalized > 0 &&
        coreIdOf(result.priceCurrency) !== normCur.id
      ) {
        const amount = Math.max(1, Math.floor(normalized * factor));
        if (amount < normalized) return { amount, currency: normCur.abbrev };
      }
      // 2) divine -> lower core currency using the live exchange rate
      if (
        result.priceCurrency === "divine" &&
        xchgRate.value &&
        xchgRateCurrency.value
      ) {
        const amount = Math.max(
          1,
          Math.round(result.priceAmount * factor * xchgRate.value),
        );
        if (amount / xchgRate.value < result.priceAmount) {
          return { amount, currency: xchgRateCurrency.value.abbrev };
        }
      }
      return null;
    }

    function coreIdOf(currency: string): string {
      if (currency === "divine" || currency === "div") return "div";
      if (currency === "chaos") return "chaos";
      if (currency === "exalted") return "exalted";
      return currency;
    }

    function canCross(result: PricingResult): boolean {
      return crossOffer(result, 0.9) != null;
    }

    function crossLabel(result: PricingResult): string {
      return crossOffer(result, 0.9)?.currency ?? "";
    }

    function offerFor(
      result: PricingResult,
      factor: number,
      cross = false,
    ): { amount: number; currency: string; discounted: boolean } {
      if (factor === 1) {
        return {
          amount: result.priceAmount,
          currency: result.priceCurrency,
          discounted: false,
        };
      }
      if (cross) {
        const alt = crossOffer(result, factor);
        if (alt)
          return {
            amount: alt.amount,
            currency: alt.currency,
            discounted: true,
          };
      }
      // same currency: round down, never below 1
      const amount = Math.max(1, Math.floor(result.priceAmount * factor));
      return {
        amount,
        currency: result.priceCurrency,
        discounted: amount < result.priceAmount,
      };
    }

    function buildMessage(
      result: PricingResult,
      offer: { amount: number; currency: string; discounted: boolean },
    ): string {
      const seller = result.ign || result.accountName;
      const name = item.value?.isOk()
        ? item.value.value.info.name
        : "your item";
      const league = leagues.selectedId.value ?? "";
      const listed = `${result.priceAmount} ${result.priceCurrency}`;
      const price = `${offer.amount} ${offer.currency}`;

      let msg: string;
      if (!offer.discounted) {
        msg = `@${seller} Hi, I would like to buy your ${name} listed for ${listed} in ${league}.`;
      } else {
        switch (manner.value) {
          case "friendly":
            msg = `@${seller} Hey! Any chance you'd take ${price} for your ${name}? (listed ${listed} in ${league})`;
            break;
          case "urgent":
            msg = `@${seller} Hi! I really need this for my build — could you do ${price} for the ${name}? I'm in a rush, please!`;
            break;
          case "hardball":
            msg = `@${seller} ${price} for the ${name}. That's my best offer.`;
            break;
          default:
            msg = `@${seller} Hi, I'd like to buy your ${name} (listed ${listed} in ${league}). Would you take ${price}?`;
        }
      }
      if (offer.discounted && reason.value) {
        const line = REASON_LINES[reason.value];
        if (line) msg += ` ${line}`;
      }
      return msg;
    }

    function runAction(result: PricingResult, factor: number, cross = false) {
      const msg = buildMessage(result, offerFor(result, factor, cross));
      preview.value = msg;
      copyToClipboard(msg, "whisper");
    }

    function copyPrice(result: PricingResult) {
      copyToClipboard(`${result.priceAmount} ${result.priceCurrency}`, "price");
    }

    function canOffer(result: PricingResult): boolean {
      return result.priceAmount > 1;
    }

    function visitHideout() {
      Host.sendEvent({
        name: "CLIENT->MAIN::user-action",
        payload: { action: "chat-command", text: "/hideout" },
      });
    }

    const {
      xchgRate,
      xchgRateCurrency,
      initialLoading: xchgRateLoading,
      queuePricesFetch,
    } = usePoeninja();

    nextTick(() => {
      props.config.wmWants = "hide";
      props.config.wmFlags = ["hide-on-blur", "menu::skip"];
    });

    const item = ref<null | Result<ParsedItem, ParseError>>(null);
    const advancedCheck = shallowRef(false);
    const checkPosition = shallowRef({ x: 1, y: 1 });

    MainProcess.onEvent("MAIN->CLIENT::item-text", (e) => {
      if (e.target !== "price-check") return;
      performance.mark("price-check-event");

      if (Host.isElectron && !e.focusOverlay) {
        // everything in CSS pixels
        const width = 33 * AppConfig().fontSize;
        const screenX =
          e.position.x - window.screenX > window.innerWidth / 2
            ? window.screenX +
              window.innerWidth -
              wm.poePanelWidth.value -
              width
            : window.screenX + wm.poePanelWidth.value;
        MainProcess.sendEvent({
          name: "OVERLAY->MAIN::track-area",
          payload: {
            holdKey: props.config.hotkeyHold,
            closeThreshold: 2.5 * AppConfig().fontSize,
            from: e.position,
            area: {
              x: screenX,
              y: window.screenY,
              width,
              height: window.innerHeight,
            },
            dpr: window.devicePixelRatio,
          },
        });
      }
      closeBrowser();
      setHovered(null);
      wm.show(props.config.wmId);
      checkPosition.value = e.position;
      advancedCheck.value = e.focusOverlay;
      performance.mark("price-check-start-handling-item");
      item.value = handleItemPaste({
        clipboard: e.clipboard,
        item: e.item as ParsedItem,
      });

      if (item.value.isOk()) {
        recent.add(item.value.value);
        queuePricesFetch();
      }
      performance.mark("price-check-event-end");
    });

    function handleItemPaste(e: { clipboard: string; item: ParsedItem }) {
      const newItem = (e.item ? ok(e.item) : parseClipboard(e.clipboard))
        .andThen((item) =>
          (item.category === ItemCategory.HeistContract &&
            item.rarity !== ItemRarity.Unique) ||
          (item.category === ItemCategory.Sentinel &&
            item.rarity !== ItemRarity.Unique)
            ? err("item.unknown")
            : ok(item),
        )
        .mapErr((err) => {
          if (err.startsWith("item.wrong_language")) {
            const [errName, gameLang, eeLang] = err.split("|");
            return {
              name: `${errName}`,
              message: `${errName}_help`,
              rawText: e.clipboard,
              format: [gameLang, eeLang],
            };
          }

          return {
            name: `${err}`,
            message: `${err}_help`,
            rawText: e.clipboard,
          };
        });
      performance.mark("price-check-parse-end");
      return newItem;
    }

    function handleIdentification(identified: ParsedItem) {
      item.value = ok(identified);
    }

    MainProcess.onEvent("MAIN->OVERLAY::hide-exclusive-widget", () => {
      wm.hide(props.config.wmId);
    });

    watch(
      () => props.config.wmWants,
      (state) => {
        if (state === "hide") {
          closeBrowser();
        }
      },
    );

    const leagues = useLeagues();
    const title = computed(() => leagues.selectedId.value || "POE Kitten");
    const stableOrbCost = computed(() =>
      xchgRate.value ? Math.round(xchgRate.value) : null,
    );
    const isBrowserShown = computed(() =>
      props.config.wmFlags.includes("has-browser"),
    );
    const overlayKey = computed(() => AppConfig().overlayKey);
    const showCheckPos = computed(
      () => wm.active.value && props.config.showCursor,
    );
    const isLeagueSelected = computed(() => Boolean(leagues.selectedId.value));
    const clickPosition = computed(() => {
      if (isBrowserShown.value) {
        return "inventory";
      } else {
        return checkPosition.value.x > window.screenX + window.innerWidth / 2
          ? "inventory"
          : "stash";
        // or {chat, vendor, center of screen}
      }
    });

    watch(isBrowserShown, (isShown) => {
      if (isShown) {
        wm.setFlag(props.config.wmId, "hide-on-blur", false);
        wm.setFlag(props.config.wmId, "invisible-on-blur", true);
      } else {
        wm.setFlag(props.config.wmId, "invisible-on-blur", false);
        wm.setFlag(props.config.wmId, "hide-on-blur", true);
      }
    });

    function closePriceCheck() {
      if (AppConfig().overlayAlwaysClose) {
        Host.sendEvent({
          name: "OVERLAY->MAIN::focus-game",
          payload: undefined,
        });
      } else if (isBrowserShown.value || !Host.isElectron) {
        wm.hide(props.config.wmId);
      } else {
        Host.sendEvent({
          name: "OVERLAY->MAIN::focus-game",
          payload: undefined,
        });
      }
    }

    function openLeagueSelection() {
      if (didDrag.value) return;
      const settings = wm.widgets.value.find((w) => w.wmType === "settings")!;
      wm.setFlag(settings.wmId, `settings::widget=${props.config.wmId}`, true);
      wm.show(settings.wmId);
    }

    const iframeEl = shallowRef<HTMLIFrameElement | null>(null);

    function showBrowser(url: string) {
      wm.setFlag(props.config.wmId, "has-browser", true);
      nextTick(() => {
        iframeEl.value!.src = url;
      });
    }

    function closeBrowser() {
      wm.setFlag(props.config.wmId, "has-browser", false);
    }

    provide<(url: string) => void>("builtin-browser", showBrowser);

    const { t } = useI18n();

    return {
      t,
      hovered,
      pos,
      onHeaderMouseDown,
      copied,
      manner,
      reasons,
      reason,
      preview,
      manners,
      offerOptions,
      runAction,
      canCross,
      crossLabel,
      copyPrice,
      canOffer,
      visitHideout,
      clickPosition,
      isBrowserShown,
      iframeEl,
      closePriceCheck,
      title,
      stableOrbCost,
      xchgRateCurrency,
      xchgRateLoading,
      showCheckPos,
      checkPosition,
      item,
      advancedCheck,
      handleIdentification,
      overlayKey,
      isLeagueSelected,
      openLeagueSelection,
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.pane {
  flex: none;
  width: 22rem;
  max-width: 42%;
  align-self: stretch;
  overflow-y: auto;
  padding: 0.9rem;
  border-left: 2px dashed theme("colors.gray.700");
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.previewCard {
  border-radius: 1rem;
  border: 2px solid theme("colors.gray.700");
  background: rgba(0, 0, 0, 0.28);
  overflow: hidden;
}

.paneLabel {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  @apply text-gray-500;
  padding: 0.6rem 0.7rem 0.35rem;
}

.paneEmpty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.7rem 1rem;
  text-align: center;
  @apply text-gray-500;
  font-size: 0.75rem;

  i {
    font-size: 1.25rem;
    color: #c77dff;
  }
}

.dragBar {
  cursor: grab;
  user-select: none;
}

.dragBar:active {
  cursor: grabbing;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-radius: 1rem;
  border: 2px solid theme("colors.gray.700");
  background: rgba(0, 0, 0, 0.28);
  padding: 0 0.7rem 0.7rem;
}

.actionRow {
  display: flex;
  gap: 0.4rem;
}

.actionBtn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  @apply text-gray-200;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid theme("colors.gray.700");
  border-radius: 0.6rem;
  padding: 0.45rem 0.5rem;
  white-space: nowrap;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease;

  &:hover {
    @apply text-white;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(199, 125, 255, 0.5);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    border-color: theme("colors.gray.700");
    background: rgba(255, 255, 255, 0.05);
    color: theme("colors.gray.300");
  }
}

.actionPrimary {
  color: #fff;
  background: linear-gradient(135deg, #a855f7, #ff5fb0);
  border-color: transparent;
  box-shadow: 0 8px 20px -8px rgba(255, 95, 176, 0.7);
}

.actionCross {
  color: #fff;
  background: linear-gradient(135deg, #ff5fb0, #a855f7);
  border-color: transparent;
}

.mannerRow {
  display: flex;
  gap: 0.3rem;
}

.mannerBtn {
  flex: 1;
  font-size: 0.66rem;
  font-weight: 700;
  @apply text-gray-400;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid theme("colors.gray.700");
  border-radius: 0.5rem;
  padding: 0.3rem 0.2rem;

  &:hover {
    @apply text-gray-100;
  }
}

.mannerOn {
  color: #fff;
  border-color: rgba(199, 125, 255, 0.6);
  background: rgba(199, 125, 255, 0.18);
}

.angleLabel {
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  @apply text-gray-500;
}

.reasonRow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.reasonBtn {
  font-size: 0.64rem;
  font-weight: 700;
  @apply text-gray-400;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid theme("colors.gray.700");
  border-radius: 999px;
  padding: 0.25rem 0.55rem;

  &:hover {
    @apply text-gray-100;
  }
}

.reasonOn {
  color: #fff;
  border-color: rgba(255, 95, 176, 0.6);
  background: rgba(255, 95, 176, 0.18);
}

.previewBox {
  border-radius: 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem 0.6rem;
}

.previewHint {
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  @apply text-gray-500;
  margin-bottom: 0.25rem;
}

.previewText {
  font-size: 0.72rem;
  @apply text-gray-200;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
