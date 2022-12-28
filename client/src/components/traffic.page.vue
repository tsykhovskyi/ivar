<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import type { RedisRequest } from '@/api/types/traffic';

const requests = ref<RedisRequest[]>([]);

const pretty = (msg: unknown) => JSON.stringify(msg, null, 4);

onMounted(async () => {
  api.onTraffic(req => {
    requests.value.push(req);
  });

  // @ts-ignore
  requests.value = await api.traffic();
});
</script>

<template>
  <div class="container is-fluid">
    <h3>Traffic</h3>
    <div class="box" v-for="request of requests.reverse()">
      <pre>{{ pretty(request) }}</pre>
    </div>
  </div>
</template>
