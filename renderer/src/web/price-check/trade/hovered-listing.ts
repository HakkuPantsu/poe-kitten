import { shallowRef } from "vue";
import { createGlobalState } from "@vueuse/core";
import type { PricingResult } from "./pathofexile-trade";

/** Tracks the trade listing currently hovered, so a preview can be shown. */
export const useHoveredListing = createGlobalState(() => {
  const hovered = shallowRef<PricingResult | null>(null);

  function setHovered(result: PricingResult | null) {
    hovered.value = result;
  }

  return { hovered, setHovered };
});
