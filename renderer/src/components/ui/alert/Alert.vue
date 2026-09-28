<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div
    role="alert"
    :class="
      cn(
        'relative w-full rounded-xl border-2 border-border bg-card/60 p-3 text-sm text-card-foreground',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
