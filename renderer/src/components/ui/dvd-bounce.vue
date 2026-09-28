<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

/* ------------------------------------------------------------------
   Easter egg: the classic DVD-logo bounce.

   Triggered by clicking Help five times. A small chip ricochets around the
   window, changing hue on every wall hit, until dismissed.

   Deliberately self-contained and cheap:
   - one absolutely-positioned element, moved with transform (GPU-friendly)
   - pauses when the window is hidden
   - respects reduced-motion by moving at a much lower speed
   - click anywhere / Escape to dismiss
   ------------------------------------------------------------------ */

const emit = defineEmits<{ dismiss: [] }>();

const host = ref<HTMLElement | null>(null);

onMounted(() => {
  const el = host.value;
  if (!el) return;

  const parent = el.parentElement;
  if (!parent) return;

  /* The egg positions against its offsetParent, which may be a positioned
     ancestor rather than the immediate parent. Measure that, so the bounce
     stays inside whatever frame it was mounted into. */
  const bounds = () => {
    const pe = el.offsetParent as HTMLElement | null;
    return {
      w: pe ? pe.clientWidth : parent.clientWidth,
      h: pe ? pe.clientHeight : parent.clientHeight,
    };
  };

  let w = el.offsetWidth;
  let h = el.offsetHeight;

  let px = 40;
  let py = 40;

  /* reduced motion: bounce, but gently.
     Speeds are in "px per 60Hz-frame" and scaled by dt, so ~7.5 ≈ 450 px/s. */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const speed = reduce ? 2.2 : 7.5;
  const angle = Math.PI / 5;
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;

  let hue = 280;
  let raf = 0;
  let last = performance.now();

  const measure = () => {
    w = el.offsetWidth;
    h = el.offsetHeight;
  };
  measure();

  /* Move in real time (px per second) so it looks identical at 60/144Hz. */
  const step = (now: number) => {
    const dt = Math.min(64, now - last) / 1000;
    last = now;

    const { w: boundsW, h: boundsH } = bounds();

    px += vx * dt * 60;
    py += vy * dt * 60;

    let hit = false;

    if (px <= 0) {
      px = 0;
      vx = Math.abs(vx);
      hit = true;
    } else if (px + w >= boundsW) {
      px = boundsW - w;
      vx = -Math.abs(vx);
      hit = true;
    }

    if (py <= 0) {
      py = 0;
      vy = Math.abs(vy);
      hit = true;
    } else if (py + h >= boundsH) {
      py = boundsH - h;
      vy = -Math.abs(vy);
      hit = true;
    }

    /* classic behaviour: colour changes on every wall hit */
    if (hit) hue = (hue + 47) % 360;

    el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    el.style.setProperty("--egg-hue", String(hue));

    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);

  const onResize = () => {
    measure();
    /* keep it inside if the window shrank */
    const { w: boundsW, h: boundsH } = bounds();
    px = Math.max(0, Math.min(px, boundsW - w));
    py = Math.max(0, Math.min(py, boundsH - h));
  };
  window.addEventListener("resize", onResize);

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") emit("dismiss");
  };
  window.addEventListener("keydown", onKey);

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("keydown", onKey);
  });
});
</script>

<template>
  <div
    ref="host"
    class="pk-dvd-egg pointer-events-none absolute left-0 top-0 z-40 select-none rounded-md border px-3 py-1.5 text-[13px] font-semibold tracking-tight"
    :style="{ '--egg-hue': 280 }"
    aria-hidden="true"
  >
    POE Kitten
  </div>
</template>
