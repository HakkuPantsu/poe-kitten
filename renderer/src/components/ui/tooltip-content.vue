<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import {
  TooltipContent,
  TooltipPortal,
  type TooltipContentEmits,
} from "reka-ui";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
  }>(),
  { side: "top", sideOffset: 6 },
);
const emits = defineEmits<TooltipContentEmits>();
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      :side="props.side"
      :side-offset="props.sideOffset"
      :class="
        cn(
          'z-50 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg animate-scale-in',
          props.class,
        )
      "
      @escape-key-down="emits('escapeKeyDown', $event)"
      @pointer-down-outside="emits('pointerDownOutside', $event)"
    >
      <slot />
    </TooltipContent>
  </TooltipPortal>
</template>
