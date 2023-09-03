import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify as _createVuetify } from "vuetify";
import { createVueI18nAdapter } from "vuetify/locale/adapters/vue-i18n";
import { useI18n } from "vue-i18n";
import { VDataTableServer } from "vuetify/labs/VDataTable";

export function createVuetify(i18n) {
  return _createVuetify({
    components: {
      VDataTableServer,
    },
    locale: {
      adapter: createVueI18nAdapter({ i18n, useI18n }),
    },
    theme: {
      defaultTheme: "dark",
      themes: {
        dark: {
          colors: {
            primary: "#000000",
            secondary: "#ffd966",
            accent: "#FC0B50",
            error: "#f44336",
            warning: "#ff8c00",
            info: "#03a9f4",
            success: "#4caf50",
          },
        },
      },
    },
    defaults: {
      VTextField: {
        density: "compact",
        variant: "outlined",
      },
      VFileInput: {
        density: "compact",
        variant: "outlined",
      },
      VSelect: {
        density: "compact",
        variant: "outlined",
      },
      VAutocomplete: {
        density: "compact",
        variant: "outlined",
      },
      VBtn: {
        color: "white",
        variant: "flat",
      },
      VCardActions: {
        VBtn: {
          color: "secondary",
          variant: "flat",
        },
      },
      VCard: {
        rounded: "lg",
      },
      VList: {
        density: "compact",
        lines: "one",
      },
      VIcon: {
        size: "large",
      },
    },
  });
}
