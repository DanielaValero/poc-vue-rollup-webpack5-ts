import { defineCustomElement } from "vue";
import FragmentHelloWorld from "./FragmentHelloWorld.ce.vue";
import { I18nProvider } from "@/i18n";

const FragmentHelloWorldElement = defineCustomElement(FragmentHelloWorld);

function register() {
  window.customElements.define("i18n-provider", I18nProvider);
  window.customElements.define(
    "fragment-hello-world",
    FragmentHelloWorldElement
  );
}

export { register, FragmentHelloWorldElement };
