<template>
  <div class="home">
    <img alt="Vue logo" src="/assets/images/vue-logo.png" />
    <HelloWorld msg="Welcome to Your Vue3 Boilerplate" />
  </div>
</template>

<script lang="ts">
import HelloWorld from "../../components/hello-world.vue";

export default {
  name: "Home",
  components: {
    HelloWorld,
  },
};
</script>
