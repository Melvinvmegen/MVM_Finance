import { createI18n as _createI18n } from "vue-i18n";
// TODO : Lazy load language files https://kazupon.github.io/vue-i18n/guide/lazy-loading.html
import en from "../locales/en.json";

export function createI18n() {
  const i18n = _createI18n({
    legacy: false,
    locale: "en",
    fallbackLocale: "en",
    messages: { en },
    numberFormats: {
      en: {
        currency: {
          style: "currency",
          currency: "EUR",
          currencyDisplay: "symbol",
          maximumSignificantDigits: 10,
        },
        percent: {
          style: "percent",
          useGrouping: false,
        },
      },
    },
  });

  return i18n;
}
