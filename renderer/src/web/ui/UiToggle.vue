<template>
  <label :class="$style.root">
    <Switch :model-value="modelValue" @update:model-value="updateInput" />
    <span v-if="$slots.default" :class="$style.label"><slot /></span>
  </label>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Switch } from "@/components/ui/switch";

export default defineComponent({
  name: "UiToggle",
  components: { Switch },
  emits: ["update:modelValue"],
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, ctx) {
    return {
      updateInput(value: boolean) {
        ctx.emit("update:modelValue", value);
      },
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.root {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  @apply text-gray-300;
  cursor: pointer;
  user-select: none;
}

.label {
  @apply text-gray-300;
}
</style>
