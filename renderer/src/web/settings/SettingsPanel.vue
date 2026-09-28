<template>
  <div class="flex flex-col grow min-h-0">
    <div class="flex grow min-h-0">
      <div :class="$style.side">
        <template v-for="item of menuItems">
          <button
            v-if="item.type === 'menu-item'"
            @click="item.select"
            :class="[$style.item, { [$style.active]: item.isSelected }]"
          >
            {{ item.name }}
          </button>
          <Separator v-else class="my-1" />
        </template>
        <button :class="$style.quit" @click="quit">
          {{ t("app.quit") }}
        </button>
      </div>
      <div class="grow layout-column bg-gray-900 min-w-0">
        <div class="grow overflow-y-auto">
          <div v-if="renderError" :class="$style.pageError">
            <i class="fas fa-triangle-exclamation" />
            <div>This settings page failed to render.</div>
            <pre>{{ renderError }}</pre>
            <button class="btn mt-2" @click="renderError = null">Retry</button>
          </div>
          <component
            v-else-if="configClone"
            :is="selectedComponent"
            :config="configClone"
            :configWidget="configWidget"
          />
        </div>
        <div :class="$style.foot">
          <button class="btn" @click="$emit('close')">
            {{ t("Cancel") }}
          </button>
          <button class="btn" :class="$style.saveBtn" @click="save">
            {{ t("Save") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  shallowRef,
  computed,
  Component,
  reactive,
  onMounted,
  onErrorCaptured,
} from "vue";
import { useI18n } from "vue-i18n";
import {
  AppConfig,
  updateConfig,
  saveConfig,
  pushHostConfig,
  Config,
} from "@/web/Config";
import { registry } from "@/web/overlay/widget-registry";
import { Separator } from "@/components/ui/separator";
import type { Widget } from "@/web/overlay/interfaces";
import { Host } from "@/web/background/IPC";
import SettingsHotkeys from "./hotkeys.vue";
import SettingsChat from "./chat.vue";
import SettingsGeneral from "./general.vue";
import SettingsAbout from "./about.vue";
import SettingsPricecheck from "../price-check/settings-price-check.vue";
import SettingsItemcheck from "../item-check/settings-item-check.vue";
import SettingsHelp from "./help.vue";
import SettingsDebug from "./debug.vue";
import SettingsMaps from "../map-check/settings-maps.vue";
import SettingsStashSearch from "../stash-search/stash-search-editor.vue";

function quit() {
  Host.sendEvent({
    name: "CLIENT->MAIN::user-action",
    payload: { action: "quit" },
  });
}

export default defineComponent({
  name: "SettingsPanel",
  components: { Separator },
  emits: ["close"],
  setup(_props, ctx) {
    const { t } = useI18n();

    const selectedComponent = shallowRef<Component>(SettingsHotkeys);
    const configClone = shallowRef<Config | null>(null);
    const renderError = shallowRef<string | null>(null);

    onErrorCaptured((err) => {
      renderError.value = err instanceof Error ? err.message : String(err);
      // stop propagation; the failing page is replaced by an error card below
      return false;
    });

    onMounted(() => {
      configClone.value = reactive(JSON.parse(JSON.stringify(AppConfig())));
    });

    // Some settings pages read from the owning widget, so hand them the right one.
    function widgetTypeFor(component: Component): string | undefined {
      if (component === SettingsStashSearch) return "stash-search";
      if (component === SettingsItemcheck || component === SettingsMaps)
        return "item-check";
      if (component === SettingsPricecheck) return "price-check";
      return undefined;
    }

    function defaultWidget(type: string): Widget | undefined {
      const comp = registry.getWidgetComponent(type) as
        | (Component & {
            widget: {
              initInstance?: () => Widget;
              defaultInstances?: () => Widget[];
            };
          })
        | undefined;
      const spec = comp?.widget;
      if (!spec) return undefined;
      return spec.initInstance?.() ?? spec.defaultInstances?.()[0];
    }

    const configWidget = computed<Widget | undefined>(() => {
      const type = widgetTypeFor(selectedComponent.value);
      if (!type) return undefined;
      const found = configClone.value?.widgets.find((w) => w.wmType === type);
      return found ?? defaultWidget(type);
    });

    function select(component: Component) {
      renderError.value = null;
      selectedComponent.value = component;
    }

    const menuItems = computed(() =>
      flatJoin(
        menuByType().map((group) =>
          group.map((component) => ({
            name: t(component.name!),
            select() {
              select(component);
            },
            isSelected: selectedComponent.value === component,
            type: "menu-item" as const,
          })),
        ),
        () => ({ type: "separator" as const }),
      ),
    );

    return {
      t,
      quit,
      menuItems,
      selectedComponent,
      configClone,
      configWidget,
      renderError,
      save() {
        if (configClone.value) {
          updateConfig(configClone.value);
          saveConfig();
          pushHostConfig();
        }
        ctx.emit("close");
      },
    };
  },
});

function menuByType() {
  return [
    [SettingsHotkeys, SettingsChat],
    [SettingsGeneral],
    [SettingsPricecheck, SettingsMaps, SettingsItemcheck],
    [SettingsStashSearch],
    [SettingsHelp, SettingsDebug, SettingsAbout],
  ];
}

function flatJoin<T, J>(arr: T[][], joinEl: () => J) {
  const out: Array<T | J> = [];
  for (const nested of arr) {
    out.push(...nested);
    out.push(joinEl());
  }
  return out.slice(0, -1);
}
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.side {
  width: 11rem;
  flex: none;
  @apply bg-gray-900;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.6rem 0.6rem;
  border-right: 2px dashed theme("colors.gray.700");
  overflow-y: auto;
}

.item {
  text-align: left;
  padding: 0.5rem 0.7rem;
  border-radius: 0.65rem;
  line-height: 1.1;
  font-weight: 600;
  font-size: 0.8rem;
  @apply text-gray-400;

  &:hover {
    @apply text-gray-100;
    background: rgba(255, 255, 255, 0.06);
  }

  &.active {
    color: #fff;
    background: linear-gradient(135deg, #a855f7, #ff5fb0);
    box-shadow: 0 6px 16px -8px rgba(255, 95, 176, 0.8);
  }
}

.sep {
  height: 1px;
  margin: 0.35rem 0.6rem;
  background: theme("colors.gray.700");
}

.quit {
  margin-top: auto;
  text-align: left;
  padding: 0.5rem 0.7rem;
  border-radius: 0.65rem;
  font-weight: 600;
  font-size: 0.8rem;
  color: #ff8f9f;
  border: 2px solid theme("colors.gray.700");

  &:hover {
    color: #fff;
    background: rgba(255, 95, 160, 0.18);
  }
}

.foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  border-top: 2px dashed theme("colors.gray.700");
}

.saveBtn {
  background: linear-gradient(135deg, #a855f7, #ff5fb0);
  color: #fff;
  border-color: transparent;
}

.pageError {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  text-align: center;
  @apply text-gray-400;

  i {
    font-size: 1.5rem;
    color: #ff8f9f;
  }

  pre {
    max-width: 100%;
    overflow-x: auto;
    font-size: 0.7rem;
    @apply text-gray-500;
  }
}
</style>
