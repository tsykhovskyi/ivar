<script setup lang="ts">
import DebugPage from './components/debug.page.vue';
import TrafficPage from './components/traffic.page.vue';
import Config from './components/Config.vue';

import { computed, ref } from 'vue';

const routes: Record<string, any> = {
  '': TrafficPage,
  'd': DebugPage,
};

const currentPath = ref(window.location.hash);
window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash
})

const currentView = computed((): any => {
  const paths = currentPath.value.slice(1).split('/');
  if (paths.length > 1 && routes[paths[1]]) {
    return routes[paths[1]];
  }
  return TrafficPage;
});

</script>

<template>
  <nav class="navbar is-transparent">
    <div class="navbar-menu">
      <div class="navbar-start">
        <a href="#/d" class="navbar-item" :class="{'is-active':currentView===DebugPage}">Debugger</a>
        <a href="#/" class="navbar-item" :class="{'is-active':currentView===TrafficPage}">Traffic</a>
      </div>
      <div class="navbar-end">
        <div class="navbar-item">
          <Config></Config>
        </div>
      </div>
    </div>
  </nav>

  <component :is="currentView"></component>
</template>
