<template>
  <div id="app" class="text-sm font-poe-sc">
    <OverlayWindow />
  </div>
</template>

<script setup lang="ts">
import OverlayWindow from "./overlay/OverlayWindow.vue";
</script>

<style lang="postcss">
@reference "../assets/tailwind.css";

.table-stripped tbody tr:nth-child(odd) {
  background: #241735;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  /* align-items: center; */
  overflow: hidden;
  justify-content: space-between;

  :focus {
    outline: 0;
  }
}

.layout-column {
  display: flex;
  flex-direction: column;
  height: 100%;
}

::-webkit-scrollbar {
  width: 0.875rem;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 0.375rem rgba(0, 0, 0, 0.3);
}

::-webkit-scrollbar-thumb {
  -webkit-box-shadow: inset 0 0 0.375rem rgba(0, 0, 0, 0.5);
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

.btn {
  @apply inline-flex items-center justify-center gap-1.5 rounded-md border-2 border-input bg-background/40 px-3 py-1.5 text-sm font-semibold text-gray-200 shadow-sm;
  @apply leading-none;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    transform 0.08s ease;
}
.btn:hover {
  background: rgba(255, 255, 255, 0.08);
  @apply text-white;
}
.btn:active {
  transform: scale(0.97);
}

.btn-icon {
  @apply text-xs text-gray-600;
}

@keyframes ring {
  0% {
    -webkit-transform: rotate(-15deg);
    -ms-transform: rotate(-15deg);
    transform: rotate(-15deg);
  }

  2% {
    -webkit-transform: rotate(15deg);
    -ms-transform: rotate(15deg);
    transform: rotate(15deg);
  }

  4% {
    -webkit-transform: rotate(-18deg);
    -ms-transform: rotate(-18deg);
    transform: rotate(-18deg);
  }

  6% {
    -webkit-transform: rotate(18deg);
    -ms-transform: rotate(18deg);
    transform: rotate(18deg);
  }

  8% {
    -webkit-transform: rotate(-22deg);
    -ms-transform: rotate(-22deg);
    transform: rotate(-22deg);
  }

  10% {
    -webkit-transform: rotate(22deg);
    -ms-transform: rotate(22deg);
    transform: rotate(22deg);
  }

  12% {
    -webkit-transform: rotate(-18deg);
    -ms-transform: rotate(-18deg);
    transform: rotate(-18deg);
  }

  14% {
    -webkit-transform: rotate(18deg);
    -ms-transform: rotate(18deg);
    transform: rotate(18deg);
  }

  16% {
    -webkit-transform: rotate(-12deg);
    -ms-transform: rotate(-12deg);
    transform: rotate(-12deg);
  }

  18% {
    -webkit-transform: rotate(12deg);
    -ms-transform: rotate(12deg);
    transform: rotate(12deg);
  }

  20% {
    -webkit-transform: rotate(0deg);
    -ms-transform: rotate(0deg);
    transform: rotate(0deg);
  }
}

.faa-ring {
  animation: ring 2s ease;
  transform-origin-x: 50%;
  transform-origin-y: 0px;
  transform-origin-z: initial;
}
</style>
