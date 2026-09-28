<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Primitive } from "reka-ui";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

/* Plain maps instead of cva: the Vue SFC compiler can't resolve `VariantProps`
   inside a defineProps generic, and these variants are small enough that the
   indirection wasn't buying anything. */
const variants: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-foreground underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 has-[>svg]:px-3",
  xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5",
  sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5 text-[13px]",
  lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
  icon: "size-9",
  "icon-xs": "size-6 rounded-md",
  "icon-sm": "size-8 rounded-md",
  "icon-lg": "size-10",
};

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    as?: string;
    asChild?: boolean;
    class?: HTMLAttributes["class"];
    type?: "button" | "submit" | "reset";
  }>(),
  { variant: "default", size: "default", as: "button", asChild: false, type: "button" },
);
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    :type="props.as === 'button' ? props.type : undefined"
    :class="
      cn(
        'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-50',
        '[&_svg]:pointer-events-none [&_svg:not([class*=size-])]:size-4',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        variants[props.variant],
        sizes[props.size],
        props.class,
      )
    "
  >
    <slot />
  </Primitive>
</template>
