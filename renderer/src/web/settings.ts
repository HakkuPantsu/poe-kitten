import { readonly, ref, shallowRef } from "vue";
import type { ShortcutAction } from "@ipc/types";
import { Host } from "./background/IPC";

/* ------------------------------------------------------------------
   POE Kitten beta — settings model.

   The old config was bound to a widget-tree (`widgets: Widget[]`) plus a
   pile of per-widget modules. That's gone: beta uses a flat, typed settings
   object with one section per surface. Simpler to reason about, trivial to
   migrate, and no widget registry to keep in sync.
   ------------------------------------------------------------------ */

export interface BetaConfig {
  configVersion: number;

  /* --- first run --- */
  onboarded: boolean;

  /* --- game + data --- */
  leagueId: string | null;
  language: Language;
  realm: "pc-ggg" | "pc-garena";
  preferredTradeSite: "default" | "www";

  /* --- overlay --- */
  overlayHotkey: string;
  overlayBackground: string;
  hideOnBlur: boolean;
  overlayAlwaysClose: boolean;

  /* --- price check --- */
  priceCheckHotkey: string;
  instantSearch: boolean;
  showSellerNames: boolean;
  collapseListings: boolean;
  offerPresets: number[];
  /** Currency used to compare listing prices (a CurrencyType id). */
  coreCurrency: string | null;
  /**
   * Remembered rune/augment choices per item category, so the parser can
   * re-apply them when the same item is price-checked again. Keyed by
   * category name plus the `martialWeapon` / `casterWeapon` / `armour` /
   * `all` groups the augment builder understands.
   */
  savedAugments: SavedAugments;

  /* --- client log / notifications --- */
  readClientLog: boolean;
  clientLogPath: string | null;
  notifications: boolean;
  textToSpeech: boolean;
  discordWebhook: string;
  autoReply: string;

  /* --- misc --- */
  restoreClipboard: boolean;
  accountName: string;
}

/** Item-category buckets the augment builder looks up. */
export type SavedAugmentGroup =
  | "martialWeapon"
  | "casterWeapon"
  | "armour"
  | "all";

export type SavedAugments = Partial<
  Record<SavedAugmentGroup | string, Array<string | null>>
>;

export type Language =
  | "en"
  | "ru"
  | "cmn-Hant"
  | "ko"
  | "ja"
  | "de"
  | "es"
  | "pt"
  | "fr";

export const CONFIG_VERSION = 1;

export const DEFAULT_CONFIG: BetaConfig = {
  configVersion: CONFIG_VERSION,
  onboarded: false,
  leagueId: null,
  language: "en",
  realm: "pc-ggg",
  preferredTradeSite: "default",
  overlayHotkey: "Shift + Space",
  overlayBackground: "rgba(10, 10, 10, 0.92)",
  hideOnBlur: false,
  overlayAlwaysClose: false,
  priceCheckHotkey: "Ctrl + F6",
  instantSearch: true,
  showSellerNames: true,
  collapseListings: false,
  offerPresets: [-10, -5, 0],
  coreCurrency: "chaos",
  savedAugments: {},
  readClientLog: false,
  clientLogPath: null,
  notifications: true,
  textToSpeech: false,
  discordWebhook: "",
  autoReply: "",
  restoreClipboard: true,
  accountName: "",
};

const _config = ref<BetaConfig>({ ...DEFAULT_CONFIG });
const _ready = shallowRef(false);

export const config = readonly(_config);
export const isReady = readonly(_ready);

/**
 * Compatibility accessor for the ported engine (parser, trade, leagues).
 * Those modules only need `language`, `leagueId` and `realm`, and they expect
 * a function returning the live config. Keeping it here means the engine files
 * don't each need touching.
 */
export function AppConfig(): BetaConfig {
  return _config.value;
}

/**
 * Hostname of the official trade site for the current realm/language.
 *
 * Ported from the original config module — the regional trade sites are
 * per-language, with the Taiwanese realm splitting by `realm`. Callers append
 * paths like `/api/trade2/data/leagues`.
 */
export function poeWebApi(): string {
  const { realm, preferredTradeSite, language } = _config.value;
  if (preferredTradeSite === "www") return "www.pathofexile.com";

  switch (language) {
    case "en":
      return "www.pathofexile.com";
    case "ru":
      return "ru.pathofexile.com";
    case "cmn-Hant":
      return realm === "pc-garena" ? "pathofexile.tw" : "www.pathofexile.com";
    case "ko":
      return "poe.kakaogames.com";
    case "ja":
      return "jp.pathofexile.com";
    case "de":
      return "de.pathofexile.com";
    case "es":
      return "es.pathofexile.com";
    case "pt":
      return "br.pathofexile.com";
    case "fr":
      return "fr.pathofexile.com";
    default:
      return "www.pathofexile.com";
  }
}

/** Replace the whole config (used by load + migration). */
function replace(next: Partial<BetaConfig>) {
  _config.value = { ...DEFAULT_CONFIG, ...next, configVersion: CONFIG_VERSION };
}

/** Patch one or more keys and persist. */
export function updateConfig(patch: Partial<BetaConfig>) {
  _config.value = { ..._config.value, ...patch };
  save();
}

function save() {
  // Guard: the UI can render (and the mockup can seed config) before the
  // websocket is up. Sending on a dead socket throws and would blank the app.
  if (!Host.isConnected) return;

  Host.sendEvent({
    name: "CLIENT->MAIN::save-config",
    payload: { contents: JSON.stringify(_config.value), isTemporary: false },
  });

  // The main process needs a specific, typed shape to place the overlay window
  // and register the global hotkeys. See HostConfig in ipc/types.ts.
  const c = _config.value;
  const shortcuts: ShortcutAction[] = [
    {
      shortcut: c.priceCheckHotkey,
      action: { type: "copy-item", focusOverlay: true, target: "price-check" },
    },
    {
      shortcut: c.overlayHotkey,
      action: { type: "toggle-overlay" },
    },
  ];

  Host.sendEvent({
    name: "CLIENT->MAIN::update-host-config",
    payload: {
      shortcuts,
      restoreClipboard: c.restoreClipboard,
      clientLog: c.clientLogPath,
      gameConfig: null,
      stashScroll: false,
      overlayKey: c.overlayHotkey,
      logKeys: false,
      windowTitle: "Path of Exile 2",
      language: c.language,
      readClientLog: c.readClientLog,
      libraryAlpha: false,
      libraryOutputPath: null,
      initialDelay: 300,
      hideOverlayOnBlur: c.hideOnBlur,
    },
  });
}

/** Load config from the host, applying defaults for anything missing. */
export async function initConfig() {
  const raw = await Host.getConfig();
  if (raw != null && typeof raw === "object") {
    replace(raw as Partial<BetaConfig>);
  }
  _ready.value = true;
}
