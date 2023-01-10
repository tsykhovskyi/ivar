<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import type { RedisRequest } from '@/api/traffic/traffic';
import Request from './traffic/request.vue'

const request = ref<RedisRequest | null>(null);
const loaded = ref(false);

onMounted(async () => {
  try {
    const hash = window.location.hash.split('/')?.[1];
    request.value = await api.traffic.find(hash);
  } catch (e) {
    console.error('Request was not found');
  } finally {
    loaded.value = true;
  }
});

</script>

<template>
  <Request v-if="loaded && request" :request="request"></Request>
  <div class="box has-background-warning-dark" v-if="loaded && !request"><p>Request not found</p></div>
</template>
