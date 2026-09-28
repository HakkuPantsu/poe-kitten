import { createGlobalState } from "@vueuse/core";
import { shallowRef } from "vue";
import type { ParsedItem } from "@/parser";

export interface RecentCheck {
  id: number;
  item: ParsedItem;
  at: number;
}

let nextId = 1;

export const useRecentChecks = createGlobalState(() => {
  const entries = shallowRef<RecentCheck[]>([]);

  function add(item: ParsedItem) {
    const key = `${item.info.namespace}::${item.info.refName}`;
    const rest = entries.value.filter(
      (e) => `${e.item.info.namespace}::${e.item.info.refName}` !== key,
    );
    entries.value = [{ id: nextId++, item, at: Date.now() }, ...rest].slice(
      0,
      12,
    );
  }

  function clear() {
    entries.value = [];
  }

  return { entries, add, clear };
});
