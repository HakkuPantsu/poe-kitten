<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { TabsContent, type TabsContentProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<
  TabsContentProps & { class?: HTMLAttributes["class"] }
>();
</script>

<template>
  <TabsContent
    v-bind="props"
    :class="
      cn(
        'mt-2 focus-visible:outline-none data-[state=active]:animate-in',
        props.class,
      )
    "
  >
    <slot />
  </TabsContent>
</template>
