<template>
  <button>hola mundo</button>
  <HelloWorld msg="world" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
// import App from "@/app";
import HelloWorld from "@/components/HelloWorld.vue";

export default defineComponent({
  components: {
    HelloWorld,
  },
});
</script>
