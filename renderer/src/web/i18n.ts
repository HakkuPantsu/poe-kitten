import { ref } from "vue";

/* ------------------------------------------------------------------
   beta i18n — deliberately minimal.

   The old app shipped a full vue-i18n catalogue plus a data-pipeline
   translation loader. Beta needs none of that yet: every user-facing string
   lives here, typed, with English as the source. Adding a language later is
   a new record in `Catalogue`, not a rewrite.
   ------------------------------------------------------------------ */

export interface Catalogue {
  "nav.dashboard": string;
  "nav.priceCheck": string;
  "nav.insights": string;
  "nav.settings": string;
  "nav.help": string;

  "onboarding.title": string;
  "onboarding.subtitle": string;
  "onboarding.next": string;
  "onboarding.back": string;
  "onboarding.finish": string;
  "onboarding.skip": string;

  "price.title": string;
  "price.empty": string;
  "price.emptyHint": string;
  "price.searching": string;
  "price.listings": string;
  "price.median": string;
  "price.whisper": string;
  "price.copy": string;
  "price.offer": string;
  "price.visitedHideout": string;

  "common.loading": string;
  "common.retry": string;
  "common.save": string;
  "common.cancel": string;
  "common.close": string;
  "common.enabled": string;
  "common.disabled": string;
}

const en: Catalogue = {
  "nav.dashboard": "Dashboard",
  "nav.priceCheck": "Price check",
  "nav.insights": "Insights",
  "nav.settings": "Settings",
  "nav.help": "Help",

  "onboarding.title": "Welcome to POE Kitten",
  "onboarding.subtitle": "Four quick steps and you're trading.",
  "onboarding.next": "Continue",
  "onboarding.back": "Back",
  "onboarding.finish": "Start trading",
  "onboarding.skip": "Skip setup",

  "price.title": "Price check",
  "price.empty": "Nothing checked yet",
  "price.emptyHint": "Hover an item in-game and press your price check hotkey.",
  "price.searching": "Searching the trade site…",
  "price.listings": "listings",
  "price.median": "Median",
  "price.whisper": "Whisper",
  "price.copy": "Copy",
  "price.offer": "Offer",
  "price.visitedHideout": "Visit hideout",

  "common.loading": "Loading…",
  "common.retry": "Retry",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.enabled": "On",
  "common.disabled": "Off",
};

const catalogues: Record<string, Partial<Catalogue>> = { en };

const _lang = ref("en");

/** Current language tag. */
export const language = _lang;

export function setLanguage(tag: string) {
  _lang.value = catalogues[tag] ? tag : "en";
}

/** Translate a key, falling back to English then the raw key. */
export function t(key: keyof Catalogue): string {
  return catalogues[_lang.value]?.[key] ?? en[key] ?? key;
}
