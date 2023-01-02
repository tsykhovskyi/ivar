<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import type { RedisRequest } from '@/api/traffic/traffic';
import Request from './traffic/request.vue'

const request = ref<RedisRequest | null>(null);
const activeRequest = ref<RedisRequest|null>(null)

onMounted(async () => {
  try {
    const hash = window.location.hash.split('/')?.[1];
    request.value = await api.traffic.find(hash);
  } catch (e) {
    console.error('Request was not found');
  }
});

</script>

<template>
  <Request v-if="request" :request="request"></Request>
  <div class="box" v-if="!request">Request not found</div>
</template>
