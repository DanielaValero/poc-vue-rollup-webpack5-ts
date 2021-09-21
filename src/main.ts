import { createApp } from "vue";
import App from "@/app";
import router from "@/router";
import store from "@/store";
import { i18n } from "@/i18n";
import { register } from "@/fragment";

register();

createApp(App).use(i18n).use(router).use(store).mount("#app");
