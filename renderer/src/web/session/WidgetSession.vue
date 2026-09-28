<template>
  <Widget :config="config" :removable="false" move-handles="top-bottom">
    <div class="widget-default-style" :class="$style.hud">
      <div :class="$style.cell">
        <span :class="$style.label">Session</span>
        <span :class="$style.value">{{ fmt(playtime) }}</span>
      </div>
      <div :class="$style.divider" />
      <div :class="$style.cell" style="min-width: 8rem">
        <span :class="$style.label">Area</span>
        <span :key="zoneName" :class="[$style.value, $style.pop]">
          {{ zoneName || "—" }}
          <em :class="$style.sub">{{ fmt(zoneTime) }}</em>
        </span>
      </div>
      <div :class="$style.divider" />
      <div :class="$style.cell">
        <span :class="$style.label">Zones</span>
        <span :class="$style.value">{{ zonesRun }}</span>
      </div>
      <div :class="$style.divider" />
      <div :class="$style.cell">
        <span :class="$style.label">Deaths</span>
        <span
          :key="deaths"
          :class="[
            $style.value,
            deaths > 0 ? $style.danger : '',
            deaths > 0 ? $style.flash : '',
          ]"
        >
          {{ deaths }}
          <em v-if="sinceDeath !== null" :class="$style.sub"
            >· {{ fmt(sinceDeath) }} ago</em
          >
        </span>
      </div>
      <div :class="$style.divider" />
      <div :class="$style.cell">
        <span :class="$style.label">XP</span>
        <span
          :class="[
            $style.value,
            expPenalty === null || expPenalty >= 100
              ? $style.good
              : $style.warn,
          ]"
        >
          {{ expPenalty !== null ? expPenalty + "%" : "—" }}
        </span>
      </div>
      <div :class="$style.divider" />
      <div :class="$style.cell">
        <span :class="$style.label">Level</span>
        <span :key="level" :class="[$style.value, $style.pop]">
          {{ level }}
          <em v-if="levelsPerHour !== null" :class="$style.sub"
            >· {{ levelsPerHour.toFixed(1) }}/h</em
          >
        </span>
      </div>
      <button :class="$style.reset" title="Reset session" @click="reset">
        <i class="fas fa-rotate-left" />
      </button>
    </div>
  </Widget>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Widget from "../overlay/Widget.vue";
import {
  Widget as WidgetType,
  WidgetSpec,
  Anchor,
} from "../overlay/interfaces";
import { useSession } from "./session";

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default defineComponent({
  widget: {
    type: "session",
    instances: "single",
    initInstance: (): WidgetType & {
      anchor: { pos: string; x: number; y: number };
    } => {
      return {
        wmId: 0,
        wmType: "session",
        wmTitle: "{icon=fa-gauge-high}",
        wmWants: "show",
        wmZorder: null,
        wmFlags: [],
        anchor: { pos: "tl", x: 1, y: 1 },
      };
    },
  } satisfies WidgetSpec,
  components: { Widget },
  props: {
    config: {
      type: Object as PropType<WidgetType & { anchor: Anchor }>,
      required: true,
    },
  },
  setup() {
    const session = useSession();
    return { ...session, fmt };
  },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.hud {
  display: flex;
  align-items: stretch;
  gap: 0.1rem;
  padding: 0.35rem 0.5rem;
  border-radius: 1rem;
}

.cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 0.5rem;
  min-width: 3.5rem;
}

.label {
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  @apply text-gray-500;
}

.value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.sub {
  font-style: normal;
  font-size: 0.68rem;
  font-weight: 600;
  @apply text-gray-400;
}

.danger {
  color: #ff8f9f;
}

.good {
  color: #59d97a;
}

.warn {
  color: #ffd166;
}

.pop {
  animation: hudPop 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.flash {
  animation: hudFlash 0.7s ease;
}

@keyframes hudPop {
  0% {
    transform: translateY(5px);
    opacity: 0.2;
  }
  100% {
    transform: none;
    opacity: 1;
  }
}

@keyframes hudFlash {
  0% {
    color: #fff;
    text-shadow: 0 0 14px rgba(255, 95, 160, 0.9);
  }
  100% {
    text-shadow: none;
  }
}

.divider {
  width: 1px;
  align-self: center;
  height: 60%;
  background: theme("colors.gray.700");
}

.reset {
  align-self: center;
  margin-left: 0.35rem;
  width: 1.6rem;
  height: 1.6rem;
  display: grid;
  place-items: center;
  border-radius: 0.5rem;
  font-size: 0.65rem;
  @apply text-gray-500;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
