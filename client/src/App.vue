<script setup lang="ts">
import DebugPage from './components/debug.page.vue';
import TrafficPage from './components/traffic.page.vue';
import { ref } from 'vue';

enum Page {
  debugger = 'debugger',
  traffic = 'traffic',
}

const page = ref<string>('traffic');

</script>

<template>
  <nav class="navbar is-transparent">
    <div class="navbar-menu">
      <div class="navbar-start">
        <a class="navbar-item" :class="{'is-active':page===Page.debugger}" @click="page=Page.debugger">Debugger</a>
        <a class="navbar-item" :class="{'is-active':page===Page.traffic}" @click="page=Page.traffic">Traffic</a>
      </div>
    </div>
  </nav>

  <DebugPage v-if="page===Page.debugger"></DebugPage>
  <TrafficPage v-if="page===Page.traffic"></TrafficPage>
</template>
