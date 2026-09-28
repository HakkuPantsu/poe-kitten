import { createGlobalState } from "@vueuse/core";
import { computed, shallowRef } from "vue";
import type { ClientLogEvent } from "@ipc/types";
import { useClientLog } from "../client-log/client-log";

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function isTownOrHideout(zone: string) {
  return zone.includes("town") || zone.includes("hideout");
}

export const useSession = createGlobalState(() => {
  const startedAt = shallowRef(Date.now());
  const deaths = shallowRef(0);
  const lastDeathAt = shallowRef<number | null>(null);
  const zonesRun = shallowRef(0);
  const zoneName = shallowRef("");
  const zoneEnteredAt = shallowRef<number | null>(null);
  const level = shallowRef(1);
  const lastLevelAt = shallowRef<number | null>(null);
  const levelLog = shallowRef<Array<{ at: number; level: number }>>([]);
  const deathLog = shallowRef<Array<{ at: number; zone: string }>>([]);
  const now = shallowRef(Date.now());
  const { playerLevel, areaLevel } = useClientLog();

  // ticking clock so the timers stay live
  window.setInterval(() => {
    now.value = Date.now();
  }, 1000);

  function handleEvent(e: ClientLogEvent) {
    switch (e.type) {
      case "game-start":
        startedAt.value = e.ts || Date.now();
        break;
      case "load-zone": {
        zoneName.value = titleCase(e.zone);
        zoneEnteredAt.value = Date.now();
        if (!isTownOrHideout(e.zone)) zonesRun.value++;
        break;
      }
      case "player-death":
        deaths.value++;
        lastDeathAt.value = Date.now();
        deathLog.value = [
          { at: Date.now(), zone: zoneName.value },
          ...deathLog.value,
        ].slice(0, 20);
        break;
      case "level-up":
        level.value = e.level;
        lastLevelAt.value = Date.now();
        levelLog.value = [
          ...levelLog.value,
          { at: Date.now(), level: e.level },
        ];
        break;
    }
  }

  function reset() {
    startedAt.value = Date.now();
    deaths.value = 0;
    lastDeathAt.value = null;
    zonesRun.value = 0;
    zoneEnteredAt.value = null;
    lastLevelAt.value = null;
    levelLog.value = [];
    deathLog.value = [];
  }

  return {
    startedAt,
    deaths,
    zonesRun,
    zoneName,
    level,
    lastLevelAt,
    levelLog,
    deathLog,
    playtime: computed(() => now.value - startedAt.value),
    zoneTime: computed(() =>
      zoneEnteredAt.value ? now.value - zoneEnteredAt.value : 0,
    ),
    sinceDeath: computed(() =>
      lastDeathAt.value ? now.value - lastDeathAt.value : null,
    ),
    sinceLevel: computed(() =>
      lastLevelAt.value ? now.value - lastLevelAt.value : null,
    ),
    // estimated levels per hour this session (null until enough time/data)
    levelsPerHour: computed(() => {
      const hours = (now.value - startedAt.value) / 3_600_000;
      if (hours < 0.03 || levelLog.value.length === 0) return null;
      return levelLog.value.length / hours;
    }),
    // average time between level ups
    avgLevelTime: computed(() => {
      const n = levelLog.value.length;
      if (n === 0) return null;
      if (n === 1) return now.value - levelLog.value[0].at;
      return (levelLog.value[n - 1].at - levelLog.value[0].at) / (n - 1);
    }),
    // deaths grouped by area, most deadly first
    deathsByArea: computed<Array<[string, number]>>(() => {
      const map = new Map<string, number>();
      for (const d of deathLog.value) {
        const key = d.zone || "unknown area";
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]);
    }),
    // PoE XP penalty: how much XP you actually gain in the current area
    expPenalty: computed<number | null>(() => {
      const p = playerLevel.value;
      const m = areaLevel.value;
      if (!p || !m) return null;
      const safeZone = m > p ? Math.floor(p / 16) + 3 : 0;
      const eff = Math.max(Math.abs(m - p) - safeZone, 0);
      const mult = Math.max(
        0.01,
        Math.pow((p + 5) / (p + 5 + Math.pow(eff, 2.5)), 1.3),
      );
      return Math.round(100 * mult);
    }),
    handleEvent,
    reset,
  };
});
