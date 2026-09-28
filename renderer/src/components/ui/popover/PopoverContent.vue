<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { PopoverContentEmits, PopoverContentProps } from "reka-ui";
import { PopoverContent, PopoverPortal, useForwardPropsEmits } from "reka-ui";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: HTMLAttributes["class"] }>(),
  {
    align: "center",
    sideOffset: 6,
  },
);

const emits = defineEmits<PopoverContentEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="forwarded"
      :class="
        cn(
          'z-50 w-72 rounded-xl border-2 border-border bg-popover p-2 text-popover-foreground shadow-xl outline-none',
          props.class,
        )
      "
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
