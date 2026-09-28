<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "muted"
  | "destructive";

const styles: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground",
  muted: "border-transparent bg-muted text-muted-foreground",
  destructive: "border-transparent bg-destructive text-white",
};

const props = withDefaults(
  defineProps<{ class?: HTMLAttributes["class"]; variant?: BadgeVariant }>(),
  { variant: "default" },
);
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium',
        styles[props.variant],
        props.class,
      )
    "
  >
    <slot />
  </span>
</template>
