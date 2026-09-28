<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { SwitchRoot, SwitchThumb, type SwitchRootEmits } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<{
  modelValue?: boolean;
  class?: HTMLAttributes["class"];
  disabled?: boolean;
}>();
const emits = defineEmits<SwitchRootEmits>();
</script>

<template>
  <SwitchRoot
    :model-value="props.modelValue"
    :disabled="props.disabled"
    :class="
      cn(
        'peer inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border border-transparent transition-colors outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
    @update:model-value="emits('update:modelValue', $event)"
  >
    <SwitchThumb
      :class="
        cn(
          'pointer-events-none block size-3.5 rounded-full bg-background shadow-sm transition-transform',
          'data-[state=checked]:translate-x-[15px] data-[state=unchecked]:translate-x-0.5',
        )
      "
    />
  </SwitchRoot>
</template>
