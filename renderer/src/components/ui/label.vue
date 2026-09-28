<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Label, type LabelProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<LabelProps & { class?: HTMLAttributes["class"] }>();
</script>

<template>
  <Label
    :class="
      cn('flex select-none items-center gap-2 text-[13px] font-medium leading-none', props.class)
    "
  >
    <slot />
  </Label>
</template>
