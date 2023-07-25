import "./styles/main.css";
import { createApp } from "vue";
import { createRouter } from "./router";
import { createPinia } from "./plugins/pinia";
import { createVuetify } from "./plugins/vuetify";
import { createValidator } from "./plugins/validator";
import App from "./App.vue";

function createVueApp() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  const router = createRouter();
  app.use(router);
  const vuetify = createVuetify();
  app.use(vuetify);
  const validator = createValidator();
  app.use(validator);

  return {
    app,
    router,
  };
}

const { app, router } = createVueApp();
// wait until router is ready before mounting to ensure hydration match
router.isReady().then(() => {
  app.mount("#app");
});
