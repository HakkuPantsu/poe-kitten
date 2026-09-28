<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { CheckboxRootEmits, CheckboxRootProps } from "reka-ui";
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<
  CheckboxRootProps & { class?: HTMLAttributes["class"] }
>();

const emits = defineEmits<CheckboxRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="
      cn(
        'peer size-4 shrink-0 rounded-[5px] border-2 border-input shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-transparent data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500',
        props.class,
      )
    "
  >
    <CheckboxIndicator
      class="grid h-full w-full place-content-center text-current"
    >
      <i class="fas fa-check text-[0.6rem] leading-none text-white" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
