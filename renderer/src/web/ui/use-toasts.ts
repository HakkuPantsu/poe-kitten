import { createGlobalState } from "@vueuse/core";
import { shallowRef } from "vue";

export interface Toast {
  id: number;
  title: string;
  body?: string;
  icon?: string;
  kind?: "info" | "success" | "danger";
  action?: { label: string; run: () => void };
  ttl: number;
}

let nextId = 1;

export const useToasts = createGlobalState(() => {
  const toasts = shallowRef<Toast[]>([]);

  function push(toast: Omit<Toast, "id" | "ttl">, ttlMs = 7000) {
    const id = nextId++;
    toasts.value = [...toasts.value, { id, ttl: ttlMs, ...toast }];
    window.setTimeout(() => dismiss(id), ttlMs);
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, push, dismiss };
});
