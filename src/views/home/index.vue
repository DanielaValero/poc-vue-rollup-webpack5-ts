<template>
  <div class="home">
    <img class="image" alt="Vue logo" src="/assets/vue-logo.png" />
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

<style scoped>
.image {
  width: 40px;
}
</style>
