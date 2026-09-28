import { AppConfig } from "@/web/Config";

let lastSpokenAt = 0;

/** Speak a short line, if TTS is enabled and not spammed. */
export function speak(text: string) {
  try {
    if (AppConfig().enableTts === false) return;
    const now = Date.now();
    if (now - lastSpokenAt < 800) return;
    lastSpokenAt = now;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.volume = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* speech unavailable */
  }
}
