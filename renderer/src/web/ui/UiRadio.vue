<template>
  <button type="button" @click="updateInput" :class="$style.root">
    <template v-if="!useBgSelection">
      <span :class="[$style.circle, { [$style.on]: isChecked }]">
        <span v-if="isChecked" :class="$style.dot" />
      </span>
      <span :class="$style.label"><slot /></span>
    </template>
    <template v-else>
      <span :class="[$style.bg, { [$style.bgOn]: isChecked }]">
        <slot />
      </span>
    </template>
  </button>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "UiRadio",
  emits: ["update:modelValue"],
  props: {
    value: {
      type: null,
      required: true,
    },
    modelValue: {
      type: null,
      required: true,
    },
    useBgSelection: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, ctx) {
    return {
      isChecked: computed(() => props.modelValue === props.value),
      updateInput() {
        ctx.emit("update:modelValue", props.value);
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

.circle {
  width: 1rem;
  height: 1rem;
  flex: none;
  margin-top: 0.1rem;
  border-radius: 50%;
  border: 2px solid theme("colors.gray.600");
  display: grid;
  place-items: center;
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease;
}

.circle.on {
  border-color: #c084fc;
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #a855f7, #ff5fb0);
}

.label {
  @apply text-gray-300;
}

.bg {
  border-radius: 0.4rem;
  padding: 0.125rem 0.35rem;
}

.bgOn {
  @apply bg-gray-700;
  color: #fff;
}
</style>
