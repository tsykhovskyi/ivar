<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api';

const requests = ref<unknown[]>([]);

const pretty = (msg: unknown) => JSON.stringify(msg, null, 4);

onMounted(async () => {
  requests.value = await api.traffic();
  api.onTraffic(req => requests.value.push(req));
});
</script>

<template>
  <div class="container is-fluid">
    <h3>Traffic</h3>
    <div class="box" v-for="request of requests">
      <pre>{{ pretty(request) }}</pre>
    </div>
  </div>
</template>
