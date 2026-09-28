import "./assets/app.css";
import { createApp } from "vue";
import App from "./web/App.vue";
import { Host } from "./web/background/IPC";
import { initConfig } from "./web/settings";
import { setLanguage } from "./web/i18n";

/* Boot order matters: the websocket must be up before we ask for config. */
async function boot() {
  const app = createApp(App);
  app.mount("#app");

  try {
    await Host.init();
    await initConfig();
    setLanguage(navigator.language.split("-")[0] ?? "en");
  } catch (err) {
    // The shell is already mounted; onboarding will simply stay on screen.
    console.error("[beta] host init failed", err);
  }
}

void boot();
