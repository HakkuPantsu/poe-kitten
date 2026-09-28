<template>{{ display }}</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{ value: number; duration?: number }>(),
  { duration: 650 },
);
const display = ref("0");
let raf = 0;

function decimalsFor(v: number) {
  return Number.isInteger(v) ? 0 : 2;
}

function run(target: number) {
  cancelAnimationFrame(raf);
  const from = Number.parseFloat(display.value) || 0;
  const fromDec = decimalsFor(from);
  const toDec = decimalsFor(target);
  const dec = Math.max(fromDec, toDec);
  const t0 = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / props.duration);
    const eased = 1 - Math.pow(1 - p, 3);
    display.value = (from + (target - from) * eased).toFixed(dec);
    if (p < 1) raf = requestAnimationFrame(step);
    else display.value = target.toFixed(decimalsFor(target));
  };
  raf = requestAnimationFrame(step);
}

onMounted(() => run(props.value));
watch(
  () => props.value,
  (v) => run(v),
);
</script>
