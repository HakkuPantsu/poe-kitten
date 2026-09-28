<template>
  <transition
    enter-active-class="animate__animated animate__fadeIn"
    leave-active-class="animate__animated animate__backOutDown"
  >
    <div :class="$style.widget" v-if="show">
      <div :class="$style.box">
        <img :class="$style.kitten" src="/images/kitten.svg" alt="" />
        <div class="py-2 pr-4">
          <div class="text-base font-semibold">POE Kitten</div>
          <p>{{ t("app_is_ready") }}</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { Host } from "@/web/background/IPC";
import { AppConfig } from "@/web/Config";

const { t } = useI18n();

const show = shallowRef(false);

// Play a little "nyaa" once when the overlay finishes loading.
const nyaaSrc = `${import.meta.env.BASE_URL}sounds/nyaa.mp3`;
let nyaaPlayed = false;
function playNyaa() {
  if (nyaaPlayed) return;
  const audio = new Audio(nyaaSrc);
  audio.volume = 0.6;
  audio.play().then(
    () => {
      nyaaPlayed = true;
    },
    () => {
      /* autoplay blocked — retried on first interaction below */
    },
  );
}

// Fallback in case the browser blocks autoplay until a user gesture.
window.addEventListener("pointerdown", playNyaa);
window.addEventListener("keydown", playNyaa);

Host.onEvent("MAIN->OVERLAY::overlay-attached", () => {
  playNyaa();
  if (!show.value && AppConfig().showAttachNotification) {
    show.value = true;
    setTimeout(() => {
      show.value = false;
    }, 2500);
  }
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.widget {
  position: absolute;
  display: flex;
  width: 100%;
  justify-content: center;
  bottom: 20%;
  pointer-events: none;
}

.box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-left: 0.6rem;
  @apply bg-gray-800;
  @apply text-gray-100;
  @apply rounded-xl;
  border: 1px solid theme("colors.gray.700");
  box-shadow:
    0 12px 30px -14px rgba(0, 0, 0, 0.9),
    0 0 22px -12px rgba(199, 125, 255, 0.6);
}

.kitten {
  width: 2.75rem;
  height: 2.75rem;
  flex: none;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
  animation: bob 3.2s ease-in-out infinite;
}

@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}
</style>
