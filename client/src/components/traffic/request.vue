<script setup lang="ts">
import type { RedisRequest } from '@/api/types/traffic';
import Switch from '../ui/switch.vue'
import { ref } from 'vue';

defineProps<{
  request: RedisRequest
}>();

const resOpened = ref<boolean>(false);

const reqView = ref<'raw' | 'pretty'>('pretty');
const resView = ref<'raw' | 'pretty'>('pretty');

const reqRender = (req: string[]) => {
  return req.map(token => token.indexOf(' ') !== -1 ? `"${token}"` : token).join(' ');
};

</script>

<template>
  <div class="box">
    <div class="block">
      <div class="field">
        [{{ new Date(request.time).toLocaleString() }}]
      </div>
      <div class="field is-grouped">
        <div class="control is-expanded">
          Request
        </div>
      </div>
      <div class="field" v-if="reqView === 'pretty'">
        <pre v-for="r in request.value">{{ reqRender(r) }}</pre>
      </div>

      <div class="field is-grouped">
        <div class="control is-expanded">
          Response
          <button class="button is-small" @click="resOpened=!resOpened">
            <i class="fas" :class="{'fa-plus': !resOpened, 'fa-minus': resOpened}"></i>
          </button>
        </div>
        <Switch v-if="resOpened" :options="['raw', 'pretty']" :selected="resView" @change="resView = $event"></Switch>
      </div>
      <div class="field" v-if="resOpened && resView === 'raw'">
        <pre>{{ request.response.plain }}</pre>
      </div>
      <div class="field" v-if="resOpened && resView === 'pretty'">
        <pre>{{ request.response.value }}</pre>
      </div>
    </div>
  </div>
</template>
