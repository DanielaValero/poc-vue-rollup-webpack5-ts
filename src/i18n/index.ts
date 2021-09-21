import { createI18n } from "vue-i18n";

import { defineCustomElement } from "vue";
import I18nProviderComponent from "./I18nProvider.ce.vue";

const I18nProvider = defineCustomElement(I18nProviderComponent);

const i18n = createI18n<false>({
  legacy: false,
  locale: "en",
  messages: {
    en: {
      hello: "Hello!",
    },
    ja: {
      hello: "こんにちは！",
    },
  },
});

export { i18n, I18nProvider };
