<template>
  <div class="p-5 flex flex-col h-full items-center text-center">
    <img class="w-20 h-20 mb-2" src="/images/kitten.svg" alt="POE Kitten" />
    <p class="text-lg font-bold">POE Kitten</p>
    <p class="text-gray-400">{{ t("app.version", [version]) }}</p>
    <p class="text-gray-500 text-sm mt-1">
      A modern all-in-one Path of Exile 2 overlay
    </p>

    <div :class="$style.credits">
      <div :class="$style.row">
        <span :class="$style.label">Based on</span>
        <a
          :class="$style.link"
          href="https://github.com/Kvan7/Exiled-Exchange-2"
          target="_blank"
          >Exiled Exchange 2</a
        >
      </div>
      <div :class="$style.divider" />
      <div :class="$style.row">
        <span :class="$style.label">Created by</span>
        <a
          :class="$style.link"
          href="https://github.com/HakkuPantsu"
          target="_blank"
          >HakkuPantsu</a
        >
      </div>
      <div :class="$style.divider" />
      <div :class="$style.row">
        <span :class="$style.label">For</span>
        <span :class="$style.name">SirMelvinTheNonce</span>
      </div>
    </div>

    <div class="border border-gray-700 rounded-xl p-3 mt-6 w-80">
      <p>{{ info.str1 }}</p>
      <p class="text-gray-400">{{ info.str2 }}</p>
      <button v-if="info.action" @click="info.action" class="btn w-full mt-2">
        {{ info.actionText }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Host } from "@/web/background/IPC";
import { DateTime } from "luxon";

function checkForUpdates() {
  Host.sendEvent({
    name: "CLIENT->MAIN::user-action",
    payload: { action: "check-for-update" },
  });
}

function quitAndInstall() {
  Host.sendEvent({
    name: "CLIENT->MAIN::user-action",
    payload: { action: "update-and-restart" },
  });
}

function fmtTime(millis: number) {
  return DateTime.fromMillis(millis).toRelative({ style: "long" }) ?? "n/a";
}

export default defineComponent({
  name: "settings.about",
  inheritAttrs: false,
  setup() {
    const { t } = useI18n();

    const info = computed(() => {
      const rawInfo = Host.updateInfo.value;
      switch (rawInfo.state) {
        case "initial":
          return {
            str1: t("updates.maybe_outdated"),
            str2: t("updates.never_checked"),
            action: checkForUpdates,
            actionText: t("updates.check_now"),
          };
        case "checking-for-update":
          return { str1: t("updates.checking"), str2: t("please_wait") };
        case "update-not-available":
          return {
            str1: t("updates.latest"),
            str2: t("updates.last_checked", [fmtTime(rawInfo.checkedAt)]),
            action: checkForUpdates,
            actionText: t("updates.check_now"),
          };
        case "error":
          return {
            str1: t("updates.maybe_outdated"),
            str2: t("updates.error"),
            action: checkForUpdates,
            actionText: t("updates.check_now"),
          };
        case "update-downloaded":
          return {
            str1: t("updates.available", [rawInfo.version]),
            str2: t("updates.installed_on_exit"),
            action: quitAndInstall,
            actionText: t("updates.install_now"),
          };
        case "update-available":
          return {
            str1: t("updates.available", [rawInfo.version]),
            str2: t("updates.download_manually"),
            action: checkForUpdates,
            actionText: t("updates.check_now"),
          };
      }
    });

    return {
      t,
      info,
      version: Host.version,
    };
  },
});
</script>

<style lang="postcss" module>
@reference "../../assets/tailwind.css";

.credits {
  margin-top: 1.4rem;
  width: 20rem;
  border-radius: 1rem;
  border: 2px solid theme("colors.gray.700");
  background: linear-gradient(
    120deg,
    rgba(168, 85, 247, 0.14),
    rgba(255, 95, 176, 0.08)
  );
  padding: 0.4rem 1rem;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0;
}

.divider {
  height: 1px;
  background: theme("colors.gray.700");
}

.label {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  @apply text-gray-500;
}

.link {
  font-weight: 700;
  color: #e0a8ff;

  &:hover {
    color: #ff8fd0;
    text-decoration: underline;
  }
}

.name {
  font-weight: 800;
  background: linear-gradient(90deg, #e0a8ff, #ff8fd0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
