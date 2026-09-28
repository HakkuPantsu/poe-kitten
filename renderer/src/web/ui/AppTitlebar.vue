<template>
  <div :class="$style.titlebar">
    <img :class="$style.logo" src="/images/kitten.svg" alt="" />
    <slot />
    <button @click="emit('click')" :class="[$style.title, 'truncate']">
      {{ title }}
    </button>
    <button
      @click.stop="emit('close')"
      tabindex="-1"
      :class="[$style.button, $style.close]"
      title="Close"
    >
      <i class="fas fa-window-close"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
}>();

const emit = defineEmits<{
  (e: "click" | "close"): void;
}>();
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.titlebar {
  @apply bg-gray-900 text-gray-300;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 1.7rem;
  line-height: 1.7rem;
  padding: 0 0.25rem;
  border-bottom: 2px dashed theme("colors.gray.700");
  background-image: linear-gradient(
    180deg,
    rgba(199, 125, 255, 0.1),
    transparent
  );

  button {
    @apply px-2 rounded-md font-semibold;
    letter-spacing: 0.02em;

    &:hover {
      @apply text-gray-100;
      background: linear-gradient(
        to top,
        theme("colors.gray.900"),
        theme("colors.gray.700")
      );
    }

    &.close:hover {
      @apply text-white;
      background: theme("colors.pink.500");
    }
  }

  .title {
    font-weight: 700;
    background: linear-gradient(
      90deg,
      theme("colors.purple.300"),
      theme("colors.pink.300")
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}

.logo {
  width: 1.15rem;
  height: 1.15rem;
  margin: 0 0.4rem 0 0.35rem;
  flex: none;
}
</style>
