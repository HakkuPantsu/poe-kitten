<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

/* ------------------------------------------------------------------
   Starfield / constellation.

   This is a WINDOW BACKDROP, not a panel decoration. It sits at the very
   bottom of the stack (`position: fixed`, `z-index: 0`) and paints the
   animated dots/links across the whole black canvas of the app. Opaque
   surfaces (sidebar, header, cards) render above it and hide it where they
   cover the window, so the constellation reads as living *under* the UI.

   In the in-game overlay it doubles as the only thing filling the gap
   between panels, so it must never intercept input.

   Design constraints:
   - Monochrome. Colour would fight the kit and the in-game overlay.
   - Cheap: one <canvas>, capped DPR, capped particle count, pauses when the
     window is hidden. The overlay is drawn over a game that's already using
     the GPU, so this must not be greedy.
   - Purely decorative: pointer-events none, aria-hidden.
   ------------------------------------------------------------------ */

const props = withDefaults(
  defineProps<{
    /** points per 10,000 css px² */
    density?: number;
    /** max link distance in px */
    linkDistance?: number;
    /** overall opacity of the layer */
    opacity?: number;
    /** drift speed multiplier */
    speed?: number;
    /** react to pointer proximity */
    interactive?: boolean;
    /** 0–1 multiplier on dot + link alpha. Low keeps it a backdrop. */
    brightness?: number;
    /**
     * Base hue (degrees). Each particle starts at a random hue around this,
     * and contacts blend the two particles' hues together, so the field
     * evolves its own palette instead of using one flat colour.
     * `null` = monochrome.
     */
    hue?: number | null;
    /** How far the starting hues spread around `hue`, in degrees. */
    hueSpread?: number;
    /**
     * Fraction of particles reseeded to a fresh random hue each frame.
     *
     * Mixing alone is like stirring paint: every particle converges to one
     * average and the palette dies within ~10s (measured). Reseeding adds new
     * colour faster than mixing consumes it, so the field keeps a living
     * palette. 0 disables (mixing then converges; `hue=null` for plain white).
     */
    hueReseed?: number;
    /**
     * Degrees. If set, the whole field drifts in one direction (wrapping at
     * the edges) instead of milling in place — this is what makes particles
     * visibly *travel across the page*. `null` = free drift + wall bounce.
     */
    driftAngle?: number | null;
  }>(),
  {
    density: 1.5,
    linkDistance: 132,
    opacity: 1,
    speed: 1,
    interactive: true,
    brightness: 0.55,
    hue: 268,
    hueSpread: 200,
    hueReseed: 0.015,
    driftAngle: null,
  },
);

const host = ref<HTMLElement | null>(null);
let raf = 0;
let ro: ResizeObserver | null = null;
let io: IntersectionObserver | null = null;
let visible = true;

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** frames remaining of the bright "just collided" flash */
  flash: number;
  /** each particle owns a colour; contacts blend it into neighbours */
  hue: number;
}

const pointer = { x: -9999, y: -9999, inside: false };

onMounted(() => {
  const el = host.value;
  if (!el) return;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  el.appendChild(canvas);

  let w = 0;
  let h = 0;
  let dpr = 1;
  let points: P[] = [];
  /* Nominal speed; also the anchor for the speed clamp in step().
     Recomputed in build() so a changed `speed` prop takes effect. */
  let baseSpeed = 0.42 * props.speed;

  /* Respect reduced motion by calming the motion, not freezing it. A frozen
     starfield renders one frame and then only changes when a prop changes —
     which reads as a broken animation. Instead we slow the drift and drop the
     interaction flashes, keeping the ambient movement. */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionScale = reduce ? 0.35 : 1;

  /* Hue lives on a circle, so blending must take the short way round:
     mixing 350deg and 10deg should give 0deg, not 180deg. Mixing in RGB
     would also wash everything toward grey, which is exactly the "muddy"
     look we're avoiding. */
  const blendHue = (h1: number, h2: number, t: number) => {
    let d = ((h2 - h1 + 540) % 360) - 180;
    return (((h1 + d * t) % 360) + 360) % 360;
  };

  /* Centre of the random hue range each particle starts from. */
  const baseHue = (((props.hue ?? 0) % 360) + 360) % 360;

  /* A fresh colour from the starting range. Used for initial state and for
     the reseed that keeps the palette from converging. */
  const randomHue = () =>
    (baseHue + (Math.random() - 0.5) * props.hueSpread + 360) % 360;

  const build = () => {
    const rect = el.getBoundingClientRect();
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    // cap DPR at 2 so 4K/retina doesn't quadruple the fill cost
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round(((w * h) / 10_000) * props.density);
    /* Base velocity. At a fixed 60fps, 1.4 px/frame ≈ 84 px/s, which crosses
       a typical window in a handful of seconds — fast enough to read as
       travel, slow enough to stay ambient. */
    baseSpeed = 1.4 * props.speed * motionScale;
    const base = baseSpeed;

    /* Directional drift: one shared heading for the whole field, plus a small
       per-particle wobble so the motion doesn't look mechanical. */
    const driftRad = ((props.driftAngle ?? 0) * Math.PI) / 180;
    const dvx = Math.cos(driftRad) * base;
    const dvy = Math.sin(driftRad) * base;

    /* Every particle starts at a random hue so the network opens with its own
       palette; contacts then blend those into new colours. */
    const startHue = () => (props.hue === null ? 0 : randomHue());

    points = Array.from({ length: Math.max(0, Math.min(count, 170)) }, () => {
      const angle = Math.random() * Math.PI * 2;
      if (props.driftAngle === null) {
        /* free drift: random heading, slight speed spread */
        const mag = base * (0.7 + Math.random() * 0.6);
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag,
          r: Math.random() * 1.1 + 0.5,
          flash: 0,
          hue: startHue(),
        };
      }
      /* directed drift: shared heading + wobble */
      const wobble = base * 0.28;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: dvx + (Math.random() - 0.5) * wobble,
        vy: dvy + (Math.random() - 0.5) * wobble,
        r: Math.random() * 1.1 + 0.5,
        flash: 0,
        hue: startHue(),
      };
    });
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);

    /* links first, so dots sit on top */
    const maxD = props.linkDistance;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > maxD * maxD) continue;

        /* Links near a contact burn brighter — the connect-on-impact cue. */
        const heat = Math.max(a.flash, b.flash) / 14;
        const alpha = (1 - Math.sqrt(d2) / maxD) * (0.16 + heat * 0.5) * props.brightness;

        if (props.hue === null) {
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        } else {
          /* A link carries the *mix* of the two dots it joins — that's the
             whole effect: connect red to blue and the line between them is
             the blend. Closer links mix more strongly, so the colour
             transition follows the connection rather than being flat. */
          const closeness = 1 - Math.sqrt(d2) / maxD;
          const mixed = blendHue(a.hue, b.hue, 0.5);
          const hue = heat > 0 ? blendHue(mixed, 20, heat * 0.6) : mixed;
          const sat = 55 + heat * 35;
          const light = 60 + closeness * 12 + heat * 18;

          ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
        }

        ctx.lineWidth = heat > 0 ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      /* pointer links highlight the constellation under the cursor */
      if (props.interactive && pointer.inside) {
        const dx = a.x - pointer.x;
        const dy = a.y - pointer.y;
        const d = Math.hypot(dx, dy);
        const reach = maxD * 1.35;
        if (d < reach) {
          const alpha = (1 - d / reach) * 0.34 * props.brightness;
          if (props.hue === null) {
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          } else {
            /* pointer links glow in the particle's own evolved colour */
            ctx.strokeStyle = `hsla(${a.hue}, 55%, 72%, ${alpha})`;
          }
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
    }

    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      // particles near a contact flash brighter for a few frames
      const heat = p.flash / 14;
      const glow = heat > 0 ? 0.5 + heat * 0.45 : 0.5;
      const a = glow * props.brightness;

      if (props.hue === null) {
        ctx.fillStyle = `rgba(255,255,255,${a})`;
      } else {
        /* each dot shows its own evolved colour, pale so it still reads as a
           star rather than a bead */
        const sat = 45 + heat * 45;
        const light = 74 + heat * 18;
        ctx.fillStyle = `hsla(${p.hue}, ${sat}%, ${light}%, ${a})`;
      }
      ctx.fill();
    }
  };

  /* Particle-to-particle interaction. One mechanism, not two: a proximity
     force that pushes neighbours apart within `repelDist`, plus a real
     reflection when they actually touch. The reflection is rare by design —
     repulsion usually separates them first — but it guarantees they can never
     pass through each other.

     `repelDist` must stay >= typical spacing (~76px at 1280x760 / density 1.8)
     or the field degenerates into isolated dots that never interact. */
  const repelDist = 92;
  const interact = (a: P, b: P) => {    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist === 0 || dist > repelDist) return;

    const nx = dx / dist;
    const ny = dy / dist;

    /* proximity push — stronger the closer they are */
    const force = (1 - dist / repelDist) * 0.012;
    a.vx -= nx * force;
    a.vy -= ny * force;
    b.vx += nx * force;
    b.vy += ny * force;

    /* Proximity is where the colour mixing happens. The transfer is
       deliberately one-way (a takes from b): symmetric mixing is like
       stirring paint, converging everything to one average within seconds.
       The reseed pass in step() does the rest. */
    if (props.hue !== null) {
      const closeness = 1 - dist / repelDist;
      const mix = closeness * closeness * 0.3;
      a.hue = blendHue(a.hue, b.hue, mix);
    }

    const minDist = a.r + b.r;
    if (dist < minDist) {
      /* true contact: separate, then reflect along the normal */
      const overlap = (minDist - dist) / 2;
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;

      const dvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (dvn < 0) {
        a.vx += dvn * nx;
        a.vy += dvn * ny;
        b.vx -= dvn * nx;
        b.vy -= dvn * ny;
      }
      a.flash = 14;
      b.flash = 14;
      return;
    }

    /* near-miss: a dimmer spark so the network feels alive between contacts.
       Skipped under reduced motion — the flashing is the busy part. */
    if (!reduce && dist < repelDist * 0.45) {
      a.flash = Math.max(a.flash, 6);
      b.flash = Math.max(b.flash, 6);
    }
  };

  const step = () => {
    if (!visible) {
      raf = 0;
      return;
    }

    const directed = props.driftAngle !== null;

    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;

      if (directed) {
        /* Travel is uninterrupted: cross the edge and reappear on the far
           side, so the field perpetually streams across the page. */
        if (p.x < -p.r) p.x = w + p.r;
        else if (p.x > w + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = h + p.r;
        else if (p.y > h + p.r) p.y = -p.r;
      } else {
        /* ricochet off the walls */
        if (p.x < p.r) {
          p.x = p.r;
          p.vx = Math.abs(p.vx);
        } else if (p.x > w - p.r) {
          p.x = w - p.r;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y < p.r) {
          p.y = p.r;
          p.vy = Math.abs(p.vy);
        } else if (p.y > h - p.r) {
          p.y = h - p.r;
          p.vy = -Math.abs(p.vy);
        }
      }
    }

    /* particle-vs-particle interaction */
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        interact(points[i], points[j]);
      }
    }

    if (directed) {
      /* Repulsion would otherwise randomise the headings and cancel the
         travel. Reassert the shared drift so particles still cross the page
         while nudging around each other. */
      const driftRad = ((props.driftAngle ?? 0) * Math.PI) / 180;
      const dvx = Math.cos(driftRad) * baseSpeed;
      const dvy = Math.sin(driftRad) * baseSpeed;
      for (const p of points) {
        p.vx = p.vx * 0.82 + dvx * 0.18;
        p.vy = p.vy * 0.82 + dvy * 0.18;
      }
    } else {
      /* final hard clamp — reflection can still leave a particle a hair
         outside after the interaction pass, and a resize can strand one */
      for (const p of points) {
        if (p.x < p.r) p.x = p.r;
        else if (p.x > w - p.r) p.x = w - p.r;
        if (p.y < p.r) p.y = p.r;
        else if (p.y > h - p.r) p.y = h - p.r;
      }
    }

    /* Keep speeds bounded. In directed mode don't pull slow particles *up*,
       or the wobble gets flattened and the field looks rigid. */
    const maxSp = baseSpeed * 2.2;
    const minSp = directed ? 0 : baseSpeed * 0.35;
    for (const p of points) {
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > maxSp) {
        p.vx = (p.vx / sp) * maxSp;
        p.vy = (p.vy / sp) * maxSp;
      } else if (minSp > 0 && sp < minSp && sp > 0) {
        p.vx = (p.vx / sp) * minSp;
        p.vy = (p.vy / sp) * minSp;
      }
    }

    for (const p of points) {
      if (p.flash > 0) p.flash--;
    }

    /* Keep the palette alive. Without this, mixing converges every particle
       to one colour in ~10s and the effect visibly dies. Reseeding a small
       fraction each frame adds colour faster than mixing consumes it. */
    if (props.hue !== null && props.hueReseed > 0) {
      const n = Math.max(1, Math.round(points.length * props.hueReseed));
      for (let k = 0; k < n; k++) {
        const p = points[(Math.random() * points.length) | 0];
        if (p) p.hue = randomHue();
      }
    }

    draw();
    raf = requestAnimationFrame(step);
  };

  const start = () => {
    /* NOTE: this must not bail out for reduced-motion. Doing so left the
       canvas frozen on a single frame that only updated when a prop changed,
       which looked like a broken animation. Reduced motion is handled by
       scaling the speed down (see motionScale) instead. */
    if (raf) return;
    raf = requestAnimationFrame(step);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const onMove = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.inside =
      pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
  };
  const onLeave = () => {
    pointer.inside = false;
  };

  build();
  draw();
  start();

  ro = new ResizeObserver(() => {
    build();
    draw();
  });
  ro.observe(el);

  /* Pause when scrolled out of view. Only trust a callback that actually
     changes state — an early callback before layout settles could otherwise
     stop the loop the instant it starts. */
  io = new IntersectionObserver(
    (entries) => {
      const next = entries.some((x) => x.isIntersecting);
      if (next === visible) return;
      visible = next;
      if (visible) start();
      else stop();
    },
    { threshold: 0 },
  );
  io.observe(el);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  if (props.interactive) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
  }

  /* Live prop changes (used by the mockup's motion control). Rebuilding the
     field is cheap and avoids leaving velocities at the old scale. */
  const stopWatch = watch(
    () => [props.density, props.speed, props.brightness, props.driftAngle],
    () => {
      build();
      draw();
      start();
    },
  );

  onBeforeUnmount(() => {
    stopWatch();
    stop();
    ro?.disconnect();
    io?.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerleave", onLeave);
    canvas.remove();
  });
});
</script>

<template>
  <div
    ref="host"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    :style="{ opacity }"
  />
</template>
