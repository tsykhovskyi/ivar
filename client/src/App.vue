<script setup lang="ts">
import Debugger from "./components/Debugger.vue";
import { onMounted } from "vue";
import { api } from "@/api";

onMounted(async () => {
  await api.sessions();

  const _ws = new WebSocket(`ws://${window.location.host}/ws`);
  _ws.onmessage = (message) => {
    console.log(message)
  };
  _ws.onopen = () => {
    setTimeout(() => _ws.send('hello'), 300)
  }
});
</script>

<template>
  <Debugger/>
</template>

<style scoped>

</style>
