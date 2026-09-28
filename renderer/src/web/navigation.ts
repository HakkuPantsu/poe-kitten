import { computed, shallowRef } from "vue";

/* The beta IA: one flat list of top-level views, each rendered into the shell.
   No widget tree, no per-widget launcher — navigation is the only way in. */
export type ViewId = "dashboard" | "price-check" | "insights" | "settings" | "help";

export const VIEWS: { id: ViewId; default: boolean }[] = [
  { id: "dashboard", default: true },
  { id: "price-check", default: false },
  { id: "insights", default: false },
  { id: "settings", default: false },
  { id: "help", default: false },
];

const _view = shallowRef<ViewId>("dashboard");
const _history = shallowRef<ViewId[]>([]);

/** The view currently mounted in the shell. */
export const currentView = computed(() => _view.value);

/** Whether there is somewhere to go back to. */
export const canGoBack = computed(() => _history.value.length > 0);

export function navigate(id: ViewId) {
  if (id === _view.value) return;
  _history.value = [..._history.value, _view.value];
  _view.value = id;
}

export function goBack() {
  const prev = _history.value.at(-1);
  if (prev == null) return;
  _history.value = _history.value.slice(0, -1);
  _view.value = prev;
}

/** Used by onboarding to jump straight in without polluting history. */
export function resetTo(id: ViewId) {
  _history.value = [];
  _view.value = id;
}
