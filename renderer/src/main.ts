import "./assets/tailwind.css";
// NOTE: these must be imported from JS (not via @import inside a SFC <style>),
// otherwise Vite inlines the CSS but never resolves the url() references and the
// font files are never emitted -> production builds fall back to system fonts.
import "@fortawesome/fontawesome-free/css/all.min.css";
import "animate.css/animate.css";
import "./assets/font.css";
import { createApp, watch } from "vue";
import App from "./web/App.vue";
import * as I18n from "./web/i18n";
import * as Data from "./assets/data";
import { initConfig, AppConfig } from "./web/Config";
import { Host } from "./web/background/IPC";
(async function () {
  await initConfig();
  const i18nPlugin = await I18n.init(AppConfig().language);
  await Data.init(AppConfig().language);
  await Host.init();

  watch(
    () => AppConfig().language,
    async () => {
      await Data.loadForLang(AppConfig().language);
      await I18n.loadLang(AppConfig().language);
    },
  );

  const app = createApp(App);
  app.use(i18nPlugin);
  app.mount("#app");
  if (import.meta.env.DEV) {
    app.config.performance = true;
    console.error("DEV MODE");
  }
})();
