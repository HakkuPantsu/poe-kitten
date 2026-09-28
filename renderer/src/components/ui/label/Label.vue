<script setup lang="ts">
import type { LabelProps } from "reka-ui";
import { Label } from "reka-ui";

const props = defineProps<LabelProps>();
</script>

<template>
  <Label
    v-bind="props"
    class="text-xs font-semibold text-muted-foreground select-none"
  >
    <slot />
  </Label>
</template>
