<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { SelectItemEmits, SelectItemProps } from "reka-ui";
import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  useForwardPropsEmits,
} from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<
  SelectItemProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<SelectItemEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <SelectItem
    v-bind="forwarded"
    :class="
      cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-7 pr-2 text-sm font-semibold outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <span class="absolute left-2 flex size-3.5 items-center justify-center">
      <SelectItemIndicator>
        <i class="fas fa-check text-[0.6rem]" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
