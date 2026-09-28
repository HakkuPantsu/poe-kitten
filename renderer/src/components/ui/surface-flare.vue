<script setup lang="ts">
/* Surface flare: a subtle inner sheen for opaque panels (sidebar, cards,
   header). It is NOT a window backdrop — the Electron window stays transparent
   so the game remains visible behind the overlay.

   Apply it to anything opaque that should feel "lit". */
withDefaults(
  defineProps<{ strength?: "off" | "subtle" | "default" | "bold"; class?: string }>(),
  { strength: "default" },
);

const map = { off: "off", subtle: "subtle", default: undefined, bold: "bold" } as const;
</script>

<template>
  <span
    aria-hidden="true"
    class="pk-surface-flare pointer-events-none absolute inset-0"
    :data-strength="map[strength]"
  />
</template>
