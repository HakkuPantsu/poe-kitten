<template>
  <div @mousedown="handleMouseDown">
    <div
      ref="widgetEl"
      :class="[$style.widget, { 'opacity-75': isMoving }]"
      :style="widgetPosition"
      @mousedown="onSurfaceMouseDown"
    >
      <slot :isEditing="isEditing" :isMoving="isMoving" />
      <div v-if="showChrome" :class="$style.chrome" data-no-drag>
        <Tooltip>
          <TooltipTrigger as-child>
            <button :class="$style.grip" @mousedown.stop="startDrag">
              <i class="fas fa-grip-vertical"></i>
            </button>
          </TooltipTrigger>
          <TooltipContent>Drag to move</TooltipContent>
        </Tooltip>
        <Tooltip v-if="!readonly">
          <TooltipTrigger as-child>
            <button
              :class="[$style.chromeBtn, { [$style.chromeActive]: isEditing }]"
              @click="toggleEdit"
            >
              <i class="fas fa-sliders"></i>
            </button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip v-if="hideable">
          <TooltipTrigger as-child>
            <button :class="$style.chromeBtn" @click="hide">
              <i class="fas fa-xmark"></i>
            </button>
          </TooltipTrigger>
          <TooltipContent>Hide</TooltipContent>
        </Tooltip>
        <Tooltip v-if="removable">
          <TooltipTrigger as-child>
            <button
              :class="[
                $style.chromeBtn,
                $style.remove,
                { [$style.removing]: isRemoving },
              ]"
              @mousedown="startRemoveTimer"
              @mouseup="cancelRemoveTimer"
              @mouseleave="cancelRemoveTimer"
            >
              <i class="fas fa-trash"></i>
            </button>
          </TooltipTrigger>
          <TooltipContent>Hold to remove</TooltipContent>
        </Tooltip>
      </div>
      <div v-if="isMoving">
        <div
          v-if="isHandleShown('tl')"
          :class="$style.mover"
          @mousedown="startMove('tl', $event)"
          style="left: -0.5rem; top: -0.5rem"
        ></div>
        <div
          v-if="isHandleShown('tc')"
          :class="$style.mover"
          @mousedown="startMove('tc', $event)"
          style="left: calc(50% - 0.5rem); top: -0.5rem"
        ></div>
        <div
          v-if="isHandleShown('tr')"
          :class="$style.mover"
          @mousedown="startMove('tr', $event)"
          style="left: calc(100% - 0.5rem); top: -0.5rem"
        ></div>
        <div
          v-if="isHandleShown('cr')"
          :class="$style.mover"
          @mousedown="startMove('cr', $event)"
          style="left: calc(100% - 0.5rem); top: calc(50% - 0.5rem)"
        ></div>
        <div
          v-if="isHandleShown('br')"
          :class="$style.mover"
          @mousedown="startMove('br', $event)"
          style="left: calc(100% - 0.5rem); top: calc(100% - 0.5rem)"
        ></div>
        <div
          v-if="isHandleShown('bc')"
          :class="$style.mover"
          @mousedown="startMove('bc', $event)"
          style="left: calc(50% - 0.5rem); top: calc(100% - 0.5rem)"
        ></div>
        <div
          v-if="isHandleShown('bl')"
          :class="$style.mover"
          @mousedown="startMove('bl', $event)"
          style="left: -0.5rem; top: calc(100% - 0.5rem)"
        ></div>
        <div
          v-if="isHandleShown('cl')"
          :class="$style.mover"
          @mousedown="startMove('cl', $event)"
          style="left: -0.5rem; top: calc(50% - 0.5rem)"
        ></div>
        <div
          v-if="isHandleShown('cc')"
          :class="$style.mover"
          @mousedown="startMove('cc', $event)"
          style="left: calc(50% - 0.5rem); top: calc(50% - 0.5rem)"
        ></div>
      </div>
    </div>
    <div
      v-if="isMoving"
      :class="[$style.mover, $style.active]"
      :style="moverPosition"
      @mousedown="startMove(config.anchor.pos, $event)"
    ></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject, ref } from "vue";
import { Widget, Anchor, WidgetManager } from "./interfaces";
import { useI18n } from "vue-i18n";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

function useRemovable(remove: () => void) {
  const isRemoving = ref(false);
  let tmid: ReturnType<typeof setTimeout> | null = null;

  function startRemoveTimer() {
    isRemoving.value = true;
    tmid = setTimeout(remove, 1000);
  }
  function cancelRemoveTimer() {
    isRemoving.value = false;
    if (tmid !== null) {
      clearTimeout(tmid);
      tmid = null;
    }
  }

  return { startRemoveTimer, cancelRemoveTimer, isRemoving };
}

export default defineComponent({
  components: { Tooltip, TooltipTrigger, TooltipContent },
  props: {
    config: {
      type: Object as PropType<Widget & { anchor: Anchor }>,
      required: true,
    },
    moveHandles: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    removable: {
      type: Boolean,
      default: true,
    },
    hideable: {
      type: Boolean,
      default: true,
    },
    inlineEdit: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const wm = inject<WidgetManager>("wm")!;
    const widgetEl = ref<HTMLElement | null>(null);

    const moverPosition = computed(() => {
      const { anchor, wmZorder } = props.config;
      return {
        "top": `max(0%, min(calc(${anchor.y}% - (1rem/2)), calc(100% - 1rem)))`,
        "left": `max(0%, min(calc(${anchor.x}% - (1rem/2)), calc(100% - 1rem)))`,
        "z-index": typeof wmZorder === "number" ? wmZorder : undefined,
      };
    });

    const widgetPosition = computed(() => {
      const { anchor, wmZorder } = props.config;

      // <top, center, bottom><left, center, right>
      let translate: string | undefined;
      let max = { w: 100, h: 100 };
      if (anchor.pos === "tl") {
        translate = undefined;
        max = { w: 100 - anchor.x, h: 100 - anchor.y };
      } else if (anchor.pos === "tc") {
        translate = "translate(-50%, 0%)";
        max = { w: 2 * Math.min(100 - anchor.x, anchor.x), h: 100 - anchor.y };
      } else if (anchor.pos === "tr") {
        translate = "translate(-100%, 0%)";
        max = { w: anchor.x, h: 100 - anchor.y };
      } else if (anchor.pos === "cr") {
        translate = "translate(-100%, -50%)";
        max = { w: anchor.x, h: 2 * Math.min(100 - anchor.y, anchor.y) };
      } else if (anchor.pos === "br") {
        translate = "translate(-100%, -100%)";
        max = { w: anchor.x, h: anchor.y };
      } else if (anchor.pos === "bc") {
        translate = "translate(-50%, -100%)";
        max = { w: 2 * Math.min(100 - anchor.x, anchor.x), h: anchor.y };
      } else if (anchor.pos === "bl") {
        translate = "translate(0%, -100%)";
        max = { w: 100 - anchor.x, h: anchor.y };
      } else if (anchor.pos === "cl") {
        translate = "translate(0%, -50%)";
        max = { w: 100 - anchor.x, h: 2 * Math.min(100 - anchor.y, anchor.y) };
      } else if (anchor.pos === "cc") {
        translate = "translate(-50%, -50%)";
        max = {
          w: 2 * Math.min(100 - anchor.x, anchor.x),
          h: 2 * Math.min(100 - anchor.y, anchor.y),
        };
      }

      return {
        "top": `${anchor.y}%`,
        "left": `${anchor.x}%`,
        "max-width": `${max.w}%`,
        "max-height": `${max.h}%`,
        "transform": translate,
        "z-index": typeof wmZorder === "number" ? wmZorder : undefined,
      };
    });

    const actionsPosition = computed(() => {
      const { anchor } = props.config;

      if (anchor.x <= 50 && anchor.y <= 50) {
        return {
          top: "0",
          left: "100%",
        };
      }
      if (anchor.x >= 50 && anchor.y <= 50) {
        return {
          top: "0",
          right: "100%",
        };
      }
      if (anchor.x >= 50 && anchor.y >= 50) {
        return {
          bottom: "0",
          right: "100%",
        };
      }
      if (anchor.x <= 50 && anchor.y >= 50) {
        return {
          bottom: "0",
          left: "100%",
        };
      }
    });

    const shownHandles = computed(() => {
      if (Array.isArray(props.moveHandles)) {
        return props.moveHandles;
      }
      if (!props.moveHandles) {
        return ["tl", "tc", "tr", "cr", "br", "bc", "bl", "cl", "cc"];
      }
      if (props.moveHandles === "center") {
        return ["cc"];
      }
      if (props.moveHandles === "corners") {
        return ["tl", "tr", "br", "bl"];
      }
      if (props.moveHandles === "top-bottom") {
        return ["tl", "tc", "tr", "br", "bc", "bl"];
      }
      return [];
    });

    function startMove(pos: string, e: MouseEvent) {
      props.config.anchor.pos = pos;
      updatePosition(e);
      document.addEventListener("mousemove", updatePosition);
      document.addEventListener("mouseup", endMove);

      function endMove() {
        document.removeEventListener("mousemove", updatePosition);
        document.removeEventListener("mouseup", endMove);
      }
    }

    function updatePosition(e: MouseEvent) {
      props.config.anchor.x =
        Math.min(Math.max(e.clientX / window.innerWidth, 0), 1) * 100;
      props.config.anchor.y =
        Math.min(Math.max(e.clientY / window.innerHeight, 0), 1) * 100;
    }

    const isEditing = ref(false);
    const isMoving = ref(false);

    const showChrome = computed(
      () =>
        wm.active.value &&
        (props.hideable || props.removable || !props.readonly),
    );

    // Drag anywhere on the widget (except interactive controls) to move it.
    function startDrag(e: MouseEvent) {
      if (e.button !== 0 || props.readonly) return;
      const node = widgetEl.value;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const offX = e.clientX - rect.left;
      const offY = e.clientY - rect.top;
      props.config.anchor.pos = "tl";

      function move(ev: MouseEvent) {
        props.config.anchor.x =
          Math.min(Math.max((ev.clientX - offX) / window.innerWidth, 0), 1) *
          100;
        props.config.anchor.y =
          Math.min(Math.max((ev.clientY - offY) / window.innerHeight, 0), 1) *
          100;
      }
      move(e);

      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    }

    function onSurfaceMouseDown(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest(
          "button, a, input, textarea, select, [contenteditable='true'], [data-no-drag]",
        )
      ) {
        return;
      }
      startDrag(e);
    }

    const { t } = useI18n();

    return {
      t,
      widgetEl,
      showChrome,
      startDrag,
      onSurfaceMouseDown,
      moverPosition,
      widgetPosition,
      actionsPosition,
      handleMouseDown() {
        // @TODO: why null check?
        if (props.config.wmId != null) {
          wm.bringToTop(props.config.wmId);
        }
      },
      startMove,
      isMoving,
      isEditing,
      isHandleShown(pos: string) {
        return (
          props.config.anchor.pos !== pos && shownHandles.value.includes(pos)
        );
      },
      hide() {
        wm.hide(props.config.wmId);
      },
      toggleEdit() {
        isMoving.value = false;
        if (props.inlineEdit) {
          isEditing.value = !isEditing.value;
        } else {
          const settings = wm.widgets.value.find(
            (w) => w.wmType === "settings",
          )!;
          wm.setFlag(
            settings.wmId,
            `settings::widget=${props.config.wmId}`,
            true,
          );
          wm.show(settings.wmId);
        }
      },
      toggleMove() {
        isMoving.value = !isMoving.value;
        isEditing.value = false;
      },
      ...useRemovable(() => {
        wm.remove(props.config.wmId);
      }),
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.widget {
  position: absolute;
  display: flex;

  &:hover .chrome {
    opacity: 1;
    pointer-events: auto;
  }
}

.chrome {
  position: absolute;
  top: -0.7rem;
  right: -0.4rem;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.15rem 0.25rem;
  border-radius: 999px;
  background: rgba(23, 17, 34, 0.96);
  border: 2px solid theme("colors.gray.700");
  box-shadow:
    0 8px 22px -10px #000,
    0 0 18px -10px rgba(199, 125, 255, 0.7);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.grip,
.chromeBtn {
  width: 1.5rem;
  height: 1.5rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: theme("colors.gray.300");
  font-size: 0.72rem;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;

  &:hover {
    color: #fff;
    background: theme("colors.gray.700");
  }
}

.grip {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.chromeActive {
  color: #fff;
  background: linear-gradient(135deg, #a855f7, #ff5fb0);
}

.remove:hover,
.removing {
  color: #fff;
  background: theme("colors.pink.500");
}

.mover {
  position: absolute;
  /* top: max(0%, min(calc(y% - (1rem/2)), calc(100% - 1rem))); */
  /* left: max(0%, min(calc(x% - (1rem/2)), calc(100% - 1rem))); */
  width: 1rem;
  height: 1rem;
  border: 0.25rem solid rgba(0, 0, 0, 0.6);
  background: rgba(0, 0, 0, 0.2);
  cursor: move;
  user-select: none;

  &.active {
    position: fixed;
    border-color: #fff;
    box-shadow:
      0 1px 3px 0 rgb(0, 0, 0),
      0 1px 2px 0 rgb(0, 0, 0);
  }
}
</style>

<style lang="postcss">
@reference "../../assets/tailwind.css";

.widget-default-style {
  @apply rounded-xl bg-gray-900;
  border: 1px solid #3d2c5c;
  box-shadow:
    0 12px 30px -14px rgba(0, 0, 0, 0.9),
    0 0 26px -16px rgba(199, 125, 255, 0.55);
}
</style>
