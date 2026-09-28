import { AppConfig } from "@/web/Config";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

/** Short, soft two-tone chime (no asset needed). */
export function playPing() {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  const notes = [880, 1174.7];
  notes.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.09;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

/** Play the "nyaa" clip (used on overlay load). */
export function playNyaa() {
  const src = `${import.meta.env.BASE_URL}sounds/nyaa.mp3`;
  const audio = new Audio(src);
  audio.volume = 0.6;
  return audio.play();
}

export function notificationsEnabled() {
  try {
    return AppConfig().enableNotifications !== false;
  } catch {
    return true;
  }
}
