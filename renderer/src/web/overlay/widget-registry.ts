import type { Component } from "vue";
import type { WidgetSpec } from "./interfaces";
import WidgetStashSearch from "../stash-search/WidgetStashSearch.vue";
import WidgetMenu from "./WidgetMenu.vue";
import PriceCheckWindow from "@/web/price-check/PriceCheckWindow.vue";
import WidgetItemCheck from "@/web/item-check/WidgetItemCheck.vue";
import WidgetImageStrip from "./WidgetImageStrip.vue";
import WidgetSettings from "../settings/SettingsWindow.vue";
import WidgetNotepad from "../notepad/WidgetNotepad.vue";
import WidgetSession from "../session/WidgetSession.vue";

type WidgetComponent = Component & { widget: WidgetSpec };

export const registry = {
  widgets: [] as WidgetComponent[],

  getWidgetComponent(wmType: string) {
    return this.widgets.find((component) => component.widget.type === wmType);
  },
};

// Core
registry.widgets.push(WidgetMenu as unknown as WidgetComponent);
registry.widgets.push(WidgetSettings as unknown as WidgetComponent);
// Tools
registry.widgets.push(PriceCheckWindow as unknown as WidgetComponent);
registry.widgets.push(WidgetItemCheck as unknown as WidgetComponent);
registry.widgets.push(WidgetStashSearch as unknown as WidgetComponent);
registry.widgets.push(WidgetImageStrip as unknown as WidgetComponent);
registry.widgets.push(WidgetNotepad as unknown as WidgetComponent);
// Always-on HUDs
registry.widgets.push(WidgetSession as unknown as WidgetComponent);
