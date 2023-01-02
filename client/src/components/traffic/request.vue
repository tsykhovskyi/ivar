<script setup lang="ts">
import type { RedisRequest } from '@/api/traffic/traffic';
import Switch from '../ui/switch.vue'
import Code from '../ui/code.vue'
import { ref } from 'vue';

defineProps<{
  request: RedisRequest | null
}>();

const reqView = ref<'raw' | 'pretty'>('pretty');
const resView = ref<'raw' | 'pretty'>('pretty');

</script>

<template>
  <div class="modal-content" v-if="request">
    <div class="box">
      <div class="block">
        <div class="field">
          {{ new Date(request.time).toLocaleString() }}
        </div>
        <div class="field is-grouped">
          <div class="control is-expanded">
            Request
          </div>
        </div>
        <div class="field" v-if="reqView === 'pretty'">
          <table class="table is-fullwidth">
            <tr v-for="r in request.value">
              <td><Code :code="r"></Code></td>
            </tr>
          </table>
        </div>

        <div class="field is-grouped">
          <div class="control is-expanded">
            Response
          </div>
          <Switch :options="['raw', 'pretty']" :selected="resView" @change="resView = $event"></Switch>
        </div>
        <div class="field" v-if="resView === 'raw'">
          <pre>{{ request.response.plain }}</pre>
        </div>
        <div class="field" v-if="resView === 'pretty'">
          <table class="table is-fullwidth">
            <tr v-for="res of request.response.value">
              <td><Code :code="res"></Code></td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
