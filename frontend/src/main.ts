import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia';
import router from "./router";
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
// import * as Sentry from "@sentry/vue";
// import { BrowserTracing } from "@sentry/tracing";

loadFonts()
const pinia = createPinia()

const app = createApp(App)
            .use(pinia)
            .use(vuetify)
            .use(router)

// Sentry.init({
//   app,
//   dsn: "https://96a52900ae1044cab4980d79d68f6a24@o1172219.ingest.sentry.io/6267101",
//   integrations: [
//     new BrowserTracing({
//       routingInstrumentation: Sentry.vueRouterInstrumentation(router),
//       tracingOrigins: ["localhost", "https://mvmdb.netlify.app/", /^\//],
//     }),
//   ],
//   tracesSampleRate: 0.25,
// });

if (process.env.NODE_ENV === "development") {
  app.config.performance = true;
}

app.mount("#app");