<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import type { RedisRequest } from '@/api/types/traffic';
import Request from './traffic/request.vue'

const requests = ref<RedisRequest[]>([]);
const activeRequest = ref<RedisRequest|null>(null)

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
    <table class="table is-fullwidth">
      <tr>
        <th>Time</th>
        <th>Request</th>
        <th>Show</th>
      </tr>
      <tr v-for="request of requests">
        <th>[{{  new Date(request.time).toLocaleString() }}]</th>
        <th>
          <p v-for="r in request.value">{{ r }}</p>
        </th>
        <th>
          <button class="button is-small is-primary js-modal-trigger"
                  data-target="request-info"
                  @click="activeRequest=request">Show</button>
        </th>
      </tr>
    </table>
  </div>
  <Request :request="activeRequest"></Request>
</template>
