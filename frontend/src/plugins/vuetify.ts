import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { createVuetify as _createVuetify } from "vuetify";

export function createVuetify() {
  return _createVuetify({
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
      VBtn: {
        color: "secondary",
        variant: "flat",
        rounded: "xl",
      },
      VCardActions: {
        VBtn: {
          color: "secondary",
          variant: "flat",
          rounded: "xl",
        },
      },
      VCard: {
        rounded: "lg",
      },
      VList: {
        density: "compact",
        lines: "one",
      },
    },
  });
}
