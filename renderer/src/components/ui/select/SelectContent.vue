<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { SelectContentEmits, SelectContentProps } from "reka-ui";
import {
  SelectContent,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits,
} from "reka-ui";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<SelectContentProps & { class?: HTMLAttributes["class"] }>(),
  {
    position: "popper",
    sideOffset: 4,
  },
);

const emits = defineEmits<SelectContentEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <SelectPortal>
    <SelectContent
      v-bind="forwarded"
      :class="
        cn(
          'relative z-50 max-h-72 min-w-32 overflow-hidden rounded-xl border-2 border-border bg-popover text-popover-foreground shadow-xl',
          props.class,
        )
      "
    >
      <SelectViewport class="p-1">
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>
