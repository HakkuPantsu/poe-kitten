<script setup lang="ts">
import type { Component } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  icon: Component;
  label: string;
  active?: boolean;
  hint?: string;
  class?: string;
}>();
const emit = defineEmits<{ select: [] }>();
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
        props.active
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        props.class,
      )
    "
    @click="emit('select')"
  >
    <component :is="props.icon" class="size-4 shrink-0" />
    <span class="truncate">{{ props.label }}</span>
    <kbd
      v-if="props.hint"
      class="ml-auto rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
      >{{ props.hint }}</kbd
    >
  </button>
</template>
