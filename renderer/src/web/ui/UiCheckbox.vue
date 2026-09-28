<template>
  <button type="button" @click="updateInput" :class="$style.root">
    <Checkbox
      :model-value="modelValue === values[0]"
      class="pointer-events-none mt-0.5 shrink-0"
      tabindex="-1"
    />
    <span :class="$style.label"><slot /></span>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Checkbox } from "@/components/ui/checkbox";

export default defineComponent({
  name: "UiCheckbox",
  components: { Checkbox },
  emits: ["update:modelValue"],
  props: {
    modelValue: {},
    values: {
      type: Array,
      default: [true, false],
    },
  },
  setup(props, ctx) {
    return {
      updateInput() {
        const [on, off] = props.values;
        ctx.emit("update:modelValue", props.modelValue === on ? off : on);
      },
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.root {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  text-align: left;
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
