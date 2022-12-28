<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import type { RedisRequest } from '@/api/types/traffic';
import Request from './traffic/request.vue'

const requests = ref<RedisRequest[]>([]);
const sort = () => {
  requests.value.sort((a, b) => b.time - a.time);
}

onMounted(async () => {
  api.onTraffic(req => {
    requests.value.push(req);
    sort();
  });

  // @ts-ignore
  requests.value = await api.traffic();
  sort();
});
</script>

<template>
  <div class="container is-fluid">
    <h3>Requests tracked: {{ requests.length }}</h3>
    <Request :request="request" v-for="request of requests"></Request>
  </div>
</template>
