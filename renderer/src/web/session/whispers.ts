import { createGlobalState } from "@vueuse/core";
import { shallowRef } from "vue";

export type WhisperStatus = "new" | "invited" | "sold" | "gone";

export interface WhisperEntry {
  id: number;
  from: string;
  message: string;
  at: number;
  status: WhisperStatus;
  trade?: { item: string; price: string };
}

let nextId = 1;

export const useWhispers = createGlobalState(() => {
  const entries = shallowRef<WhisperEntry[]>([]);

  function add(entry: Omit<WhisperEntry, "id" | "at" | "status">) {
    const next: WhisperEntry = {
      id: nextId++,
      at: Date.now(),
      status: "new",
      ...entry,
    };
    entries.value = [next, ...entries.value].slice(0, 20);
  }

  function setStatus(id: number, status: WhisperStatus) {
    entries.value = entries.value.map((e) =>
      e.id === id ? { ...e, status } : e,
    );
  }

  function clear() {
    entries.value = [];
  }

  return { entries, add, setStatus, clear };
});
