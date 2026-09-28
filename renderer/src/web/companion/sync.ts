import { watch } from "vue";
import { Host } from "@/web/background/IPC";
import { useSession } from "@/web/session/session";
import { useWhispers } from "@/web/session/whispers";
import { useRecentChecks } from "@/web/price-check/recent-checks";

/**
 * Pushes a live snapshot of the session to the main process, which serves it
 * to the local companion dashboard (http://127.0.0.1:PORT/companion).
 */
export function startCompanionSync() {
  const session = useSession();
  const whispers = useWhispers();
  const checks = useRecentChecks();

  function snapshot() {
    return {
      session: {
        playtimeMs: session.playtime.value,
        zone: session.zoneName.value,
        zoneTimeMs: session.zoneTime.value,
        deaths: session.deaths.value,
        zonesRun: session.zonesRun.value,
        level: session.level.value,
        levelsPerHour: session.levelsPerHour.value,
        expPenalty: session.expPenalty.value,
      },
      deathZones: session.deathsByArea.value,
      whispers: whispers.entries.value.map((w) => ({
        from: w.from,
        message: w.message,
        trade: w.trade ?? null,
        at: w.at,
      })),
      checks: checks.entries.value.map((c) => ({
        name: c.item.info.name,
        base: c.item.info.refName,
        rarity: c.item.rarity,
        icon: c.item.info.icon || "/images/404.png",
        at: c.at,
      })),
    };
  }

  window.setInterval(() => {
    Host.sendEvent({
      name: "CLIENT->MAIN::companion-state",
      payload: snapshot(),
    });
  }, 2000);

  // persist new whispers + price checks into the local history file
  let lastWhisperId = 0;
  watch(
    whispers.entries,
    (list) => {
      for (const w of [...list].reverse()) {
        if (w.id > lastWhisperId) {
          lastWhisperId = w.id;
          Host.sendEvent({
            name: "CLIENT->MAIN::companion-history",
            payload: {
              type: "whisper",
              at: w.at,
              from: w.from,
              message: w.message,
              item: w.trade?.item ?? null,
              price: w.trade?.price ?? null,
            },
          });
        }
      }
    },
    { deep: false },
  );

  let lastCheckId = 0;
  watch(
    checks.entries,
    (list) => {
      for (const c of [...list].reverse()) {
        if (c.id > lastCheckId) {
          lastCheckId = c.id;
          Host.sendEvent({
            name: "CLIENT->MAIN::companion-history",
            payload: {
              type: "price-check",
              at: c.at,
              name: c.item.info.name,
              base: c.item.info.refName,
              rarity: c.item.rarity,
            },
          });
        }
      }
    },
    { deep: false },
  );

  // persist deaths
  let lastDeathAt = 0;
  watch(
    session.deathLog,
    (list) => {
      for (const d of [...list].reverse()) {
        if (d.at > lastDeathAt) {
          lastDeathAt = d.at;
          Host.sendEvent({
            name: "CLIENT->MAIN::companion-history",
            payload: { type: "death", at: d.at, zone: d.zone },
          });
        }
      }
    },
    { deep: false },
  );

  // persist level ups
  let lastLevelAt = 0;
  watch(
    session.levelLog,
    (list) => {
      for (const l of [...list].reverse()) {
        if (l.at > lastLevelAt) {
          lastLevelAt = l.at;
          Host.sendEvent({
            name: "CLIENT->MAIN::companion-history",
            payload: { type: "level", at: l.at, level: l.level },
          });
        }
      }
    },
    { deep: false },
  );
}
