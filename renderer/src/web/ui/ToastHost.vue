<template>
  <transition-group
    tag="div"
    name="toast"
    :class="$style.host"
    aria-live="polite"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="[$style.toast, toast.kind ? $style[toast.kind] : '']"
    >
      <div :class="$style.icon">
        <i
          class="fas"
          :class="toast.icon ?? 'fa-circle-info'"
          :style="{ color: iconColor(toast.kind) }"
        />
      </div>
      <div :class="$style.body">
        <div :class="$style.title">{{ toast.title }}</div>
        <div v-if="toast.body" :class="$style.text">{{ toast.body }}</div>
        <button
          v-if="toast.action"
          :class="$style.action"
          @click="
            toast.action!.run();
            dismiss(toast.id);
          "
        >
          {{ toast.action.label }}
        </button>
      </div>
      <button :class="$style.close" @click="dismiss(toast.id)">
        <i class="fas fa-xmark" />
      </button>
      <span
        :class="$style.bar"
        :style="{ animationDuration: `${toast.ttl}ms` }"
      />
    </div>
  </transition-group>
</template>

<script setup lang="ts">
import { useToasts, type Toast } from "./use-toasts";

const { toasts, dismiss } = useToasts();

function iconColor(kind?: Toast["kind"]) {
  if (kind === "success") return "#59d97a";
  if (kind === "danger") return "#ff8f9f";
  return "#c77dff";
}
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.host {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 4000;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 22rem;
  max-width: 90vw;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
  padding: 0.8rem 0.9rem;
  border-radius: 1rem;
  border: 2px solid theme("colors.gray.700");
  background: rgba(23, 17, 34, 0.96);
  box-shadow:
    0 16px 40px -18px rgba(0, 0, 0, 0.95),
    0 0 26px -14px rgba(199, 125, 255, 0.7);
  backdrop-filter: blur(10px);
}

.bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  transform-origin: left;
  animation-name: shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  background: linear-gradient(90deg, #a855f7, #ff5fb0);
}

@keyframes shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

.danger {
  border-color: rgba(255, 95, 160, 0.5);
}

.success {
  border-color: rgba(89, 217, 122, 0.45);
}

.icon {
  width: 2.1rem;
  height: 2.1rem;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 0.7rem;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.06);
}

.body {
  flex: 1;
  min-width: 0;
}

.title {
  font-weight: 700;
  font-size: 0.85rem;
  color: #fff;
}

.text {
  font-size: 0.75rem;
  color: theme("colors.gray.400");
  margin-top: 0.1rem;
  word-break: break-word;
}

.action {
  margin-top: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #a855f7, #ff5fb0);
}

.close {
  flex: none;
  color: theme("colors.gray.500");
  font-size: 0.7rem;

  &:hover {
    color: #fff;
  }
}

/* transitions */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(24px) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.96);
}
</style>
