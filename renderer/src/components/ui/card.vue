<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

/* Cards opt into a subtle surface flare by default — an inner sheen plus a
   lit top hairline. Set `flare="off"` for a dead-flat panel. */
const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    flare?: "off" | "subtle" | "default" | "bold";
  }>(),
  { flare: "subtle" },
);

const strengthMap = {
  off: "off",
  subtle: "subtle",
  default: undefined,
  bold: "bold",
} as const;
</script>

<template>
  <div
    :data-strength="strengthMap[props.flare]"
    :class="
      cn(
        'pk-surface-flare bg-card text-card-foreground flex flex-col gap-6 rounded-lg border border-border py-6',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
