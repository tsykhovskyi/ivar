<script setup lang="ts">
import type { RedisRequest } from '@/api/traffic/traffic';
import Switch from '../ui/switch.vue'
import Code from '../ui/code.vue'
import { ref } from 'vue';

defineProps<{
  request: RedisRequest | null
}>();

const size = (payload: string): string => {
  const bytes = payload.length;
  return bytes > 1024 ? `${Math.round(bytes * 100 / 1024) / 100} kB` : `${bytes} byte`
}

const view = ref<'raw' | 'pretty' | 'grouped'>('pretty');

</script>

<template>
  <div class="box" v-if="request">
    <div class="block">
      <table class="table is-fullwidth">
        <thead>
        <tr>
          <th>Request time</th>
          <th>Debugger Port</th>
          <th>Redis Port</th>
        </tr>
        </thead>
        <tbody>

        <tr>
          <td>{{ new Date(request.time).toLocaleString() }} <i class="fa fa-clock" title="Pending"
                                                               v-if="!request.response"></i></td>
          <td>{{ request.proxy.src }}</td>
          <td>{{ request.proxy.dst }}</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="block">
      <Switch class="is-right" :options="['raw', 'pretty', 'grouped']" :selected="'pretty'" @change="view=$event"></Switch>
    </div>

    <div class="block" v-show="view==='raw'">
      <div class="field">Request ({{ size(request.plain) }})</div>
      <div class="field">
        <Code :code="request.plain"></Code>
      </div>
      <template v-if="request.response">
        <div class="field">Response ({{ size(request.response.plain) }})</div>
        <div class="field">
          <Code :code="request.response.plain"></Code>
        </div>
      </template>
    </div>

    <div class="block" v-show="view==='pretty'">
      <div class="field">Request ({{ size(request.plain) }})</div>
      <div class="field" v-for="r in request.value">
        <Code :code="r"></Code>
      </div>
      <template v-if="request.response">
        <div class="field">Response ({{ size(request.response.plain) }})</div>
        <div class="field" v-for="r in request.response.value">
          <Code :code="r"></Code>
        </div>
      </template>
    </div>

    <div class="block" v-show="view==='grouped'" v-for="(r, i) in request.value">
      <div class="field">
        <p class="is-size-7">Command ({{ `${ i + 1 }/${ request.value.length }` }})</p>
      </div>
      <div class="field">
        <Code :code="r"></Code>
      </div>

      <div v-if="request.response && request.response.value[i]">
        <div class="field">
          <Code :code="request.response.value[i]"></Code>
        </div>
      </div>

      <hr v-if="i !== request.value.length - 1">
    </div>
  </div>
</template>
