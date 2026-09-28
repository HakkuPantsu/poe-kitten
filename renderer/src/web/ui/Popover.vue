<template>
  <Popover v-model:open="open">
    <PopoverTrigger
      as-child
      @mouseenter="onEnter"
      @mouseleave="onLeave"
      @click="onTriggerClick"
    >
      <component :is="tagName" v-bind="$attrs">
        <slot name="target" />
      </component>
    </PopoverTrigger>
    <PopoverContent
      :class="$style.content"
      :side="side"
      :align="align"
      :collision-boundary="collisionBoundary"
    >
      <slot name="content" />
    </PopoverContent>
  </Popover>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from "vue";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

/**
 * Thin wrapper that keeps the old `<UiPopover #target #content>` API while
 * rendering the shadcn-vue (Reka UI) popover underneath.
 */
export default defineComponent({
  name: "UiPopover",
  components: { Popover, PopoverTrigger, PopoverContent },
  inheritAttrs: false,
  props: {
    trigger: {
      type: String,
      default: undefined,
    },
    boundary: {
      type: String,
      default: undefined,
    },
    placement: {
      type: String,
      default: undefined,
    },
    arrow: {
      type: Boolean,
      default: true,
    },
    delay: {
      type: [Array, Number] as PropType<
        number | [number | null, number | null]
      >,
      default: 0,
    },
    tagName: {
      type: String,
      default: "span",
    },
  },
  setup(props) {
    const open = ref(false);
    const isHover = computed(() => props.trigger !== "click");

    function onEnter() {
      if (isHover.value) open.value = true;
    }
    function onLeave() {
      if (isHover.value) open.value = false;
    }
    function onTriggerClick(e: MouseEvent) {
      if (isHover.value) e.preventDefault();
    }

    const side = computed(() => {
      const p = props.placement ?? "";
      if (p.startsWith("right")) return "right" as const;
      if (p.startsWith("left")) return "left" as const;
      if (p.startsWith("top")) return "top" as const;
      return "bottom" as const;
    });
    const align = computed(() => {
      const p = props.placement ?? "";
      if (p.endsWith("start")) return "start" as const;
      if (p.endsWith("end")) return "end" as const;
      return "center" as const;
    });

    return {
      open,
      onEnter,
      onLeave,
      onTriggerClick,
      side,
      align,
      collisionBoundary: computed<Element | undefined>(() => {
        if (!props.boundary) return undefined;
        return (
          (document.querySelector(props.boundary) as Element | null) ??
          undefined
        );
      }),
    };
  },
});
</script>

<style lang="postcss" module>
.content {
  max-width: 92vw;
}
</style>
