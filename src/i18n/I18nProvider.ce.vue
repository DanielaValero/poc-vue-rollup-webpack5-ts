<script lang="ts">
import { defineComponent, provide } from "vue";
import { I18nInjectionKey } from "vue-i18n";
import { i18n } from "./index";

export default defineComponent({
  setup() {
    /**
     * provide i18n instance with `I18nInjectionKey`
     * for other web components
     */
    provide(I18nInjectionKey, i18n);
    return {};
  },
});
</script>
<template>
  <slot />
</template>
