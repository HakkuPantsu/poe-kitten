import { ref } from "vue";

/* ------------------------------------------------------------------
   Easter egg: five clicks on the Help nav item releases a DVD-style
   bouncing logo.

   Kept in its own module because two components need it — the sidebar
   counts the clicks, the shell renders the egg — and they're siblings.
   A tiny shared ref is simpler than threading props through the shell.

   This is decoration, not product: keep it isolated so it can be deleted
   in one move.
   ------------------------------------------------------------------ */

/** How many more Help clicks are needed. */
export const HELP_CLICKS_REQUIRED = 5;

const helpClicks = ref(0);
const eggActive = ref(false);

/** Whether the bouncing logo should be on screen. */
export const egg = eggActive;

/** Register a click on a nav item. Returns true if it released the egg. */
export function registerNavClick(id: string): boolean {
  if (id !== "help") {
    /* clicking elsewhere means the user moved on — drop a stale count */
    helpClicks.value = 0;
    return false;
  }

  helpClicks.value += 1;
  if (helpClicks.value < HELP_CLICKS_REQUIRED) return false;

  helpClicks.value = 0;
  eggActive.value = true;
  return true;
}

export function dismissEgg() {
  eggActive.value = false;
}
