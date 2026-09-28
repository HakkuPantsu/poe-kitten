<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { RadioGroupItemProps } from "reka-ui";
import { RadioGroupIndicator, RadioGroupItem } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<
  RadioGroupItemProps & { class?: HTMLAttributes["class"] }
>();
</script>

<template>
  <RadioGroupItem
    v-bind="props"
    :class="
      cn(
        'aspect-square size-4 rounded-full border-2 border-input shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-purple-400',
        props.class,
      )
    "
  >
    <RadioGroupIndicator
      class="flex size-full items-center justify-center after:block after:size-2 after:rounded-full after:bg-gradient-to-br after:from-purple-500 after:to-pink-500"
    />
  </RadioGroupItem>
</template>
