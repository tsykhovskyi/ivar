<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import type { RedisRequest } from '@/api/traffic/traffic';
import Request from './traffic/request.vue'

const requests = ref<RedisRequest[]>([]);
const activeRequest = ref<RedisRequest | null>(null)

const sort = () => {
  requests.value.sort((a, b) => b.time - a.time);
}

const clear = async () => {
  await api.traffic.clear();
  requests.value = [];
};

const requestLimit = (request: string, limit = 1000) => request.length > limit ? `${request.substring(0, limit)}...` : request;

onMounted(async () => {
  api.traffic.onTraffic(req => {
    for (const index in requests.value) {
      if (requests.value[index].id === req.id) {
        requests.value[index] = req;
        return;
      }
    }
    requests.value.push(req);
    sort();
  });

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
      <div class="column">
        <button class="button is-pulled-right is-small" @click="clear">Clear</button>
      </div>
    </div>
    <table class="table is-fullwidth is-hoverable">
      <thead>
      <tr>
        <th>Time</th>
        <th>Port</th>
        <th>Request</th>
        <th>Show</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="request of requests">
        <td>
          [{{ new Date(request.time).toLocaleString() }}]
          <i class="fa fa-clock" title="Pending" v-show="!request.response"></i>
        </td>
        <td>{{ request.proxy.src }}</td>
        <td style="word-break: break-all">
          <p v-for="r in request.value.slice(0, 10)">
            {{ requestLimit(r) }}
          </p>
          <p v-if="request.value.length > 10" class=" has-text-weight-bold is-size-7">...{{ request.value.length - 10 }} more</p>
        </td>
        <td>
          <div class="buttons">
            <a
                class="button is-small is-primary js-modal-trigger"
                data-target="request-info"
                @click="activeRequest=request"
            >Open in modal</a>
            <a :href="`#/${ request.id }`" class="button is-small is-primary">Open</a>
          </div>
        </td>
      </tr>
      </tbody>
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
