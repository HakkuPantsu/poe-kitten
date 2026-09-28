<template>
  <button
    :class="[
      $style.btn,
      { [$style.active]: active != null ? active : !filter.disabled },
    ]"
    @click="toggle"
  >
    <img v-if="img" :src="img" class="w-5 h-5" />
    <span class="pl-1">{{ t(text) }}</span>
    <i
      v-if="collapse"
      class="pl-2 text-xs text-gray-400"
      :class="filter.disabled ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"
    />
  </button>
</template>

<script setup lang="ts">
import { type PropType } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  filter: {
    type: Object as PropType<{ disabled: boolean }>, // will be mutated directly, instead of emit
    required: true,
  },
  text: { type: String, required: true },
  img: { type: String, default: undefined },
  readonly: { type: Boolean, default: undefined },
  active: { type: Boolean, default: undefined },
  collapse: { type: Boolean, default: undefined },
});

const { t } = useI18n();

function toggle() {
  const { filter, readonly } = props;
  if (!readonly) {
    filter.disabled = !filter.disabled;
  }
}
</script>

<style lang="postcss" module>
@reference "../../../assets/tailwind.css";

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  @apply text-gray-200;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid theme("colors.gray.700");
  border-radius: 999px;
  padding: 0.15rem 0.7rem;
  line-height: 1.6rem;
  font-weight: 600;
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease,
    box-shadow 0.12s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &.active {
    border-color: rgba(199, 125, 255, 0.6);
    background: linear-gradient(
      120deg,
      rgba(168, 85, 247, 0.16),
      rgba(255, 95, 176, 0.08)
    );
    box-shadow: 0 0 14px -6px rgba(199, 125, 255, 0.8);
  }
}
</style>
