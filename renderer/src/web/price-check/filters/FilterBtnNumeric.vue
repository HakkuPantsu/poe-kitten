<template>
  <div :class="[$style.btn, { [$style.active]: !filter.disabled }]">
    <button @click="filter.disabled = !filter.disabled" class="pl-2">
      {{ name }}
    </button>
    <input
      :class="$style.input"
      step="any"
      type="number"
      v-model.number="inputMin"
      @focus="inputFocus"
      @mousedown.right.prevent="clearInput($event, 'min')"
      @blur="inputMinBlur"
      @mousewheel.stop
      :style="{ width: `${1.2 + Math.max(String(inputMin).length, 2)}ch` }"
    />
    <template v-if="'max' in filter">
      <span>–</span>
      <input
        :class="$style.input"
        step="any"
        type="number"
        v-model.number="inputMax"
        @focus="inputFocus"
        @mousedown.right.prevent="clearInput($event, 'max')"
        @mousewheel.stop
        :style="{ width: `${1.2 + Math.max(String(inputMax).length, 2)}ch` }"
        placeholder="…"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch } from "vue";
import { FilterNumeric } from "./interfaces";

export default defineComponent({
  emits: [], // mutates filter
  props: {
    filter: {
      type: Object as PropType<FilterNumeric>,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const _inputMin = ref<number | "">("");
    watch(
      () => props.filter,
      (filter) => {
        _inputMin.value = filter.value;
      },
      { immediate: true },
    );

    const _inputMax = ref<number | "">("");
    watch(
      () => props.filter,
      (filter) => {
        _inputMax.value = filter.max ?? "";
      },
      { immediate: true },
    );

    const inputMin = computed<number | "">({
      get() {
        return _inputMin.value;
      },
      set(value) {
        _inputMin.value = value;
        if (typeof value === "number") {
          props.filter.value = value;
        } else {
          props.filter.value = 0;
        }
      },
    });

    const inputMax = computed<number | "">({
      get() {
        return _inputMax.value;
      },
      set(value) {
        _inputMax.value = value;
        if (typeof value === "number") {
          props.filter.max = value;
        } else {
          props.filter.max = undefined;
        }
      },
    });

    return {
      inputMin,
      inputMax,
      inputFocus(e: FocusEvent) {
        const target = e.target as HTMLInputElement;
        target.select();
        props.filter.disabled = false;
      },
      inputMinBlur() {
        if (typeof _inputMin.value !== "number") {
          _inputMin.value = 0;
          props.filter.disabled = true;
        }
      },
      clearInput(e: MouseEvent, which: "min" | "max") {
        const target = e.target as HTMLInputElement;

        if (which === "min") {
          inputMin.value = "";
        } else {
          inputMax.value = "";
        }

        target.focus();
      },
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../../assets/tailwind.css";

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  @apply bg-gray-800;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid theme("colors.gray.700");
  border-radius: 999px;
  padding: 0.1rem 0.2rem 0.1rem 0.7rem;
  line-height: 1.6rem;
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease,
    box-shadow 0.12s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    border-color: rgba(199, 125, 255, 0.6);
    background: linear-gradient(
      120deg,
      rgba(168, 85, 247, 0.16),
      rgba(255, 95, 176, 0.08)
    );
    box-shadow: 0 0 14px -6px rgba(199, 125, 255, 0.8);
  }
}

.input {
  @apply text-center;
  @apply text-gray-100;
  @apply select-all;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 999px;
  padding: 0 0.35rem;
  font-weight: 700;
  outline: none;

  &:hover,
  &:focus {
    background: rgba(0, 0, 0, 0.5);
    box-shadow: inset 0 0 0 2px rgba(199, 125, 255, 0.5);
  }

  &::placeholder {
    @apply text-gray-500;
  }

  &:focus {
    cursor: none;
  }
}
</style>
