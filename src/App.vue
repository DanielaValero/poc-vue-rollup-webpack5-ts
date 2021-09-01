<template>
    <div class="container mt-5">
        <div class="row">
            <div class="col text-center">

                <img src="assets/img/vue-logo.png" class="logo" />

                <HelloWorld msg="Vue 3 + Rollup + Bootstrap 5 + Livereload"></HelloWorld>

                <p class="mt-2">Test Variable: {{ test }}</p>

                <button class="btn btn-danger" @click="changeVariable">Change Variable</button>

            </div>
        </div>
    </div>
</template>

<script lang="ts">

import { defineComponent, ref } from "vue";
import HelloWorld from "./components/HelloWorld.vue";

export default defineComponent({
    name: "App",
    components: {
        HelloWorld
    },
    setup()
    {
        const test = ref("test variable");

        const changeVariable = () =>
        {
            test.value = "variable changed";
        };

        return {
            test,
            changeVariable
        };
    }
});

</script>

<style>
    .logo {
        max-width: 100px;
    }
</style>