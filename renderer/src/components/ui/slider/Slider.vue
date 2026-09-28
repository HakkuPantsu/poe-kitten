<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { SliderRootEmits, SliderRootProps } from "reka-ui";
import {
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  useForwardPropsEmits,
} from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<
  SliderRootProps & { class?: HTMLAttributes["class"] }
>();

const emits = defineEmits<SliderRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <SliderRoot
    v-slot="{ modelValue }"
    v-bind="forwarded"
    :class="
      cn(
        'relative flex w-full touch-none select-none items-center',
        props.class,
      )
    "
  >
    <SliderTrack
      class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary"
    >
      <SliderRange
        class="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500"
      />
    </SliderTrack>
    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      class="block size-4 rounded-full border-2 border-primary bg-background shadow transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderRoot>
</template>
