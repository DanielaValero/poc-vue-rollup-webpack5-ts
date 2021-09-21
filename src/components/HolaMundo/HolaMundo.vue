<template>
  <div class="hello">
    <h1>{{ msg }} hola</h1>
     <p>{{ $t('hello') }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "HolaMundo",
    props: {
        msg: String,
        default: ""
    }
});

</script>