<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "reka-ui";
import { cn } from "@/lib/utils";

defineProps<{ class?: HTMLAttributes["class"]; delay?: number }>();
</script>

<template>
  <TooltipProvider :delay-duration="delay ?? 300">
    <TooltipRoot>
      <slot />
    </TooltipRoot>
  </TooltipProvider>
</template>
