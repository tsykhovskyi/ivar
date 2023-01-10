<script setup lang="ts">
import type { RedisRequest } from '@/api/traffic/traffic';
import Switch from '../ui/switch.vue'
import Code from '../ui/code.vue'
import { ref } from 'vue';

defineProps<{
  request: RedisRequest | null
}>();

// const reqView = ref<'raw' | 'pretty'>('pretty');
// const resView = ref<'raw' | 'pretty'>('pretty');

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
          <td>{{ new Date(request.time).toLocaleString() }} <i class="fa fa-clock" title="Pending" v-if="!request.response"></i></td>
          <td>{{ request.proxy.src }}</td>
          <td>{{ request.proxy.dst }}</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="block" v-for="(r, i) in request.value">
      <div class="field">
        <p class="is-size-7">Request
          {{ request.value.length > 1 ? `(${ i + 1 }/${ request.value.length })` : '' }}
        </p>
      </div>
      <div class="field">
        <Code :code="r"></Code>
      </div>

      <div v-if="request.response && request.response.value[i]">
        <div class="field">
          <p class="is-size-7">Response
            {{ request.response.value.length > 1 ? `(${ i + 1 }/${ request.response.value.length })` : '' }}
          </p>
        </div>
        <div class="field">
          <Code :code="request.response.value[i]"></Code>
        </div>
      </div>

      <hr v-if="i !== request.value.length - 1">
    </div>
  </div>
</template>
