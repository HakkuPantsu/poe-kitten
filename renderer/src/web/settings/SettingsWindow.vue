<template>
  <div :class="$style.window" class="grow layout-column">
    <div :class="$style.head">
      <img :class="$style.headLogo" src="/images/kitten.svg" alt="" />
      <div :class="$style.headTitle">{{ t("settings.title") }}</div>
      <button :class="$style.headClose" @click="close">
        <i class="fas fa-xmark" />
      </button>
    </div>
    <SettingsPanel @close="close" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, nextTick, inject } from "vue";
import { useI18n } from "vue-i18n";
import SettingsPanel from "./SettingsPanel.vue";
import type {
  Widget,
  WidgetManager,
  WidgetSpec,
} from "@/web/overlay/interfaces";

export default defineComponent({
  widget: {
    type: "settings",
    instances: "single",
    initInstance: () => {
      return {
        wmId: 0,
        wmType: "settings",
        wmTitle: "{icon=fa-cog}",
        wmWants: "hide",
        wmZorder: "exclusive",
        wmFlags: ["invisible-on-blur", "ignore-ui-visibility"],
      };
    },
  } satisfies WidgetSpec,
  components: { SettingsPanel },
  props: {
    config: {
      type: Object as PropType<Widget>,
      required: true,
    },
  },
  setup(props) {
    const wm = inject<WidgetManager>("wm")!;
    const { t } = useI18n();

    nextTick(() => {
      props.config.wmWants = "hide";
    });

    return {
      t,
      close() {
        wm.hide(props.config.wmId);
      },
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.window {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  max-width: 54rem;
  max-height: 46rem;
  overflow: hidden;
  @apply bg-gray-900;
  @apply rounded-xl;
  border: 1px solid theme("colors.gray.700");
  box-shadow:
    0 18px 50px -20px #000,
    0 0 30px -14px rgba(199, 125, 255, 0.55);

  &:global {
    animation-name: slideInDown;
    animation-duration: 0.5s;
  }
}

.head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem;
  background: linear-gradient(
    120deg,
    rgba(168, 85, 247, 0.2),
    rgba(255, 95, 176, 0.12)
  );
  border-bottom: 2px dashed theme("colors.gray.700");
}

.headLogo {
  width: 1.9rem;
  height: 1.9rem;
  flex: none;
}

.headTitle {
  flex: 1;
  font-weight: 800;
  font-size: 1rem;
  background: linear-gradient(90deg, #e0a8ff, #ff8fd0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.headClose {
  width: 1.9rem;
  height: 1.9rem;
  display: grid;
  place-items: center;
  border-radius: 0.6rem;
  @apply text-gray-300;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
