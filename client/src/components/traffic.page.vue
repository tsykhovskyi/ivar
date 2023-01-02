<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import type { RedisRequest } from '@/api/traffic/traffic';
import Request from './traffic/request.vue'

const requests = ref<RedisRequest[]>([]);
const activeRequest = ref<RedisRequest|null>(null)

const sort = () => {
  requests.value.sort((a, b) => b.time - a.time);
}

const clear = async () => {
  // api.
}

onMounted(async () => {
  api.traffic.onTraffic(req => {
    requests.value.push(req);
    sort();
  });

  // @ts-ignore
  requests.value = await api.traffic.all();
  sort();
});

</script>

<template>
  <div class="container is-fluid">
    <div class="columns">
      <div class="column">
        <span>Requests: {{ requests.length }}</span>
      </div>
      <div class="column ">
        <button class="button is-pulled-right is-small">Clear</button>
      </div>
    </div>
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
  <div id="request-info" class="modal">
    <div class="modal-background"></div>
    <div class="modal-content">
      <Request :request="activeRequest"></Request>
    </div>
    <button class="modal-close is-large" aria-label="close"></button>
  </div>
</template>
