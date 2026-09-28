<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { SelectIcon, SelectTrigger, type SelectTriggerProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<
  SelectTriggerProps & { class?: HTMLAttributes["class"] }
>();
</script>

<template>
  <SelectTrigger
    v-bind="props"
    :class="
      cn(
        'flex h-9 w-full items-center justify-between gap-2 rounded-md border-2 border-input bg-background/40 px-3 py-2 text-sm font-semibold shadow-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <slot />
    <SelectIcon as-child>
      <i class="fas fa-chevron-down text-[0.6rem] text-muted-foreground" />
    </SelectIcon>
  </SelectTrigger>
</template>
