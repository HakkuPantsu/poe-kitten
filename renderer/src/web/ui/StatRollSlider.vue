<template>
  <div
    ref="rootEl"
    :class="[$style.root, $style[state.mode]]"
    @mousedown="handleMousedown"
  >
    <span :class="[$style.bound, { [$style.inclusive]: state.minInclusive }]">{{
      bounds.min
    }}</span>
    <div
      v-if="state.mode !== 'none'"
      :class="[$style.fill]"
      :style="{
        '--left': `${state.percentLeft}%`,
        '--right': `${state.percentRight}%`,
      }"
    />
    <div
      :class="$style.tick"
      :style="{
        left: `max(0.125rem, min(${percentRoll}% - 0.0625rem, 100% - 0.25rem))`,
      }"
    />
    <div
      v-if="popupValue"
      :class="$style.popup"
      :style="{
        '--left': `${state.percentLeft}%`,
        '--right': `${state.percentRight}%`,
      }"
    >
      {{ popupValue }}
    </div>
    <span :class="[$style.bound, { [$style.inclusive]: state.maxInclusive }]">{{
      bounds.max
    }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, shallowRef } from "vue";
import { percentRoll } from "../price-check/filters/util";

export default defineComponent({
  props: {
    modelValue: {
      type: Array as PropType<Array<number | "" | undefined>>,
      required: true,
    },
    roll: { type: Number, required: true },
    dp: { type: Boolean, required: true },
    bounds: {
      type: Object as PropType<{ min: number; max: number }>,
      required: true,
    },
  },
  setup(props, ctx) {
    const rootEl = shallowRef<HTMLDivElement>(null!);

    const dirty = shallowRef<(typeof props)["modelValue"] | null>(null);

    const state = computed(() => {
      const min = dirty.value ? dirty.value[0] : props.modelValue[0];
      const max = dirty.value ? dirty.value[1] : props.modelValue[1];
      const { bounds } = props;
      if (typeof min === "number" && typeof max !== "number") {
        return {
          mode: "min",
          percentLeft: ((min - bounds.min) / (bounds.max - bounds.min)) * 100,
          maxInclusive: true,
        };
      } else if (typeof min !== "number" && typeof max === "number") {
        return {
          mode: "max",
          percentRight: ((bounds.max - max) / (bounds.max - bounds.min)) * 100,
          minInclusive: true,
        };
      } else if (typeof min === "number" && typeof max === "number") {
        if (min > max) return { mode: "none" };
        return {
          mode: "range",
          percentLeft: ((min - bounds.min) / (bounds.max - bounds.min)) * 100,
          percentRight: ((bounds.max - max) / (bounds.max - bounds.min)) * 100,
          minInclusive: min <= bounds.min,
          maxInclusive: max >= bounds.max,
        };
      } else {
        return { mode: "none" };
      }
    });

    function handleMousemove(e: MouseEvent) {
      e.preventDefault();
      const { bounds, dp } = props;
      const rect = rootEl.value.getBoundingClientRect();
      const k = Math.max(0, Math.min((e.clientX - rect.x) / rect.width, 1));
      const value = (bounds.max - bounds.min) * k + bounds.min;
      if (state.value.mode === "min") {
        dirty.value = [percentRoll(value, -0, Math.floor, dp), undefined];
      } else if (state.value.mode === "max") {
        dirty.value = [undefined, percentRoll(value, +0, Math.ceil, dp)];
      }
    }
    function removeMousemove() {
      document.removeEventListener("mousemove", handleMousemove);
      document.removeEventListener("mouseup", removeMousemove);
      window.removeEventListener("blur", removeMousemove);
      ctx.emit("update:modelValue", dirty.value);
      dirty.value = null;
    }

    return {
      rootEl,
      percentRoll: computed(() => {
        const { bounds } = props;
        return ((props.roll - bounds.min) / (bounds.max - bounds.min)) * 100;
      }),
      popupValue: computed(() =>
        state.value.mode === "min" ? dirty.value?.[0] : dirty.value?.[1],
      ),
      handleMousedown(e: MouseEvent) {
        if (state.value.mode !== "min" && state.value.mode !== "max") return;
        handleMousemove(e);
        document.addEventListener("mousemove", handleMousemove);
        document.addEventListener("mouseup", removeMousemove);
        window.addEventListener("blur", removeMousemove);
      },
      state,
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.root {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 1.5rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  border: 2px solid theme("colors.gray.700");
  user-select: none;
  cursor: ew-resize;
}

.tick {
  position: absolute;
  width: 2px;
  height: 68%;
  border-radius: 2px;
  background: #fff;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.85);
  transform: translateX(-50%);
  pointer-events: none;
}

.fill {
  position: absolute;
  top: 0;
  bottom: 0;
  @apply rounded-full;
  padding: inherit;
  background-clip: content-box;
  min-width: 0.75rem;
  pointer-events: none;
  background-image: linear-gradient(
    90deg,
    rgba(168, 85, 247, 0.9),
    rgba(255, 95, 176, 0.9)
  );

  .min & {
    width: calc(100% - var(--left));
    right: 0;
  }

  .max & {
    width: calc(100% - var(--right));
    left: 0;
  }

  .range & {
    left: var(--left);
    right: var(--right);
  }
}

.bound {
  z-index: 1;
  font-size: 0.68rem;
  font-weight: 700;
  @apply text-gray-500;
  pointer-events: none;
  user-select: none;

  &.inclusive {
    @apply text-white;
  }

  &:first-child {
    padding-left: 0.35rem;
  }
  &:last-child {
    padding-right: 0.35rem;
  }
}

.popup {
  position: absolute;
  bottom: 100%;
  margin-bottom: 0.3rem;
  min-width: 2rem;
  padding: 0.05rem 0.4rem;
  border-radius: 0.5rem;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #a855f7, #ff5fb0);
  box-shadow: 0 6px 16px -6px rgba(199, 125, 255, 0.85);
  left: calc(var(--left) - 1rem);
  right: calc(var(--right) - 1rem);
}
</style>
