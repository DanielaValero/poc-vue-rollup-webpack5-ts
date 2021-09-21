<template>
  <div class="home">
    <img class="image" alt="Vue logo" src="/assets/vue-logo.png" />
    <HolaMundo msg="Welcome to Your Vue3 Boilerplate" />
  </div>
</template>

<script lang="ts">
import HolaMundo from "@/components/HolaMundo";
import { defineComponent } from "vue";

export default defineComponent({
  name: "Home",
  components: {
    HolaMundo,
  },
});
</script>

<style scoped>
.image {
  width: 40px;
}
</style>
