<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { TooltipContentEmits, TooltipContentProps } from "reka-ui";
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  useForwardPropsEmits,
} from "reka-ui";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<TooltipContentProps & { class?: HTMLAttributes["class"] }>(),
  {
    sideOffset: 6,
  },
);

const emits = defineEmits<TooltipContentEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      v-bind="forwarded"
      :class="
        cn(
          'z-50 overflow-hidden rounded-lg border-2 border-border bg-popover px-2.5 py-1.5 text-xs font-semibold text-popover-foreground shadow-lg',
          props.class,
        )
      "
    >
      <slot />
      <TooltipArrow class="fill-popover" :width="10" :height="5" />
    </TooltipContent>
  </TooltipPortal>
</template>
