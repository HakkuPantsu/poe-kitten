<template>
  <Alert :class="$style.box">
    <AlertTitle :class="$style.title">
      <slot name="name">Error comes here.</slot>
    </AlertTitle>
    <AlertDescription>
      <slot />
    </AlertDescription>
    <div v-if="$slots.actions" :class="$style.actions">
      <slot name="actions" />
    </div>
  </Alert>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default defineComponent({
  name: "UiErrorBox",
  components: { Alert, AlertTitle, AlertDescription },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  border-color: rgba(255, 95, 160, 0.45);
  background: rgba(255, 95, 160, 0.08);
}

.title {
  color: #ff8f9f;
}

.actions {
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;

  & button {
    min-width: 4rem;
  }
}
</style>
