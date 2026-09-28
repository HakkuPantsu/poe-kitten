import { computed, readonly, shallowRef } from "vue";
import { createGlobalState } from "@vueuse/core";
import { MainProcess } from "@/web/background/IPC";
import { parseClipboard, type ParsedItem } from "@/parser";
import { useTradeData } from "./TradeData";
import { useLeagues } from "./Leagues";

/* ------------------------------------------------------------------
   Price check engine.

   The main process owns the hotkey: it watches the clipboard, then pushes
   `MAIN->CLIENT::item-text` at us. Everything after that is ours — parse the
   text into a ParsedItem, then hand it to the trade search.

   This replaces the old widget-tree flow where each widget subscribed for
   itself. There is one price check in beta, so there is one subscription,
   created the first time anything calls `usePriceCheck()`.
   ------------------------------------------------------------------ */

export interface PriceCheckError {
  name: string;
  message: string;
  rawText: string;
}

export const usePriceCheck = createGlobalState(() => {
  const leagues = useLeagues();
  const tradeData = useTradeData();

  /** The item currently on screen, or null when nothing has been checked. */
  const item = shallowRef<ParsedItem | null>(null);
  /** Set when the last hotkey press could not be parsed. */
  const error = shallowRef<PriceCheckError | null>(null);
  /** True while the trade search is in flight. */
  const isSearching = shallowRef(false);
  /** Raw clipboard text of the last check — needed for error reporting. */
  const rawText = shallowRef("");

  let wired = false;

  /** Subscribe to the main process. Safe to call repeatedly. */
  function wire() {
    if (wired) return;
    wired = true;

    MainProcess.onEvent("MAIN->CLIENT::item-text", (e) => {
      // the main process can target several surfaces; we only want ours
      if (e.target !== "price-check") return;
      handleClipboard(e.clipboard, e.item as ParsedItem | undefined);
    });
  }

  /**
   * Parse clipboard text (or accept an already-parsed item the main process
   * handed us) and make it the current check.
   */
  function handleClipboard(clipboard: string, preParsed?: ParsedItem) {
    rawText.value = clipboard;
    error.value = null;

    const result = preParsed ? null : parseClipboard(clipboard);

    if (preParsed) {
      item.value = preParsed;
    } else if (result && result.isOk()) {
      item.value = result.value;
    } else {
      item.value = null;
      error.value = {
        name: result ? result.error : "PARSE_FAILED",
        message: "Could not read that item — try copying it again.",
        rawText: clipboard,
      };
      return;
    }

    void search();
  }

  /**
   * Kick off a trade search for the current item.
   *
   * The reference data (stats/items) has to be loaded before a query can be
   * built, which is why this is async and idempotent — `load()` returns early
   * if it fetched recently.
   */
  async function search() {
    if (!item.value) return;
    isSearching.value = true;
    try {
      tradeData.expressInterest();
      await leagues.load();
      await tradeData.load();
    } finally {
      isSearching.value = false;
    }
  }

  /** Clear the current result — used by the "clear" affordance. */
  function clear() {
    item.value = null;
    error.value = null;
    rawText.value = "";
  }

  return {
    item: readonly(item),
    error: readonly(error),
    rawText: readonly(rawText),
    isSearching: readonly(isSearching),
    hasResult: computed(() => item.value !== null),
    wire,
    search,
    clear,
    /* re-exported so views don't need a second import */
    league: computed(() => leagues.selected.value),
    tradeData,
  };
});
