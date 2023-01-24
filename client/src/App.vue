<script setup lang="ts">
import DebugPage from './components/debug.page.vue';
import TrafficPage from './components/traffic.page.vue';
import RequestPage from './components/request.page.vue';
import CLIPage from './components/cli.page.vue';
import Config from './components/Config.vue';

import { computed, ref } from 'vue';
import { $sessions } from '@/state/sessions';

const routes: Record<string, any> = {
  '': TrafficPage,
  'd': DebugPage,
  'cli': CLIPage,
};

const currentPath = ref(window.location.hash);
window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash
})

const currentView = computed((): any => {
  const paths = currentPath.value.slice(1).split('/');
  if (paths.length > 1) {
    if (routes[paths[1]]) {
      return routes[paths[1]];
    }
    return RequestPage;
  }
  return TrafficPage;
});

</script>

<style>
/* latin-ext */
@font-face {
  font-family: 'Lato';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url(./fonts/S6u8w4BMUTPHjxsAUi-qNiXg7eU0.woff2) format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Lato';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url(./fonts/S6u8w4BMUTPHjxsAXC-qNiXg7Q.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* latin-ext */
@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(./fonts/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2) format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(./fonts/S6uyw4BMUTPHjx4wXiWtFCc.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* latin-ext */
@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(./fonts/S6u9w4BMUTPHh6UVSwaPGQ3q5d0N7w.woff2) format('woff2');
  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(./fonts/S6u9w4BMUTPHh6UVSwiPGQ3q5d0.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

</style>

<template>
  <nav class="navbar is-transparent">
    <div class="navbar-menu">
      <div class="navbar-start">
        <a href="#/d" class="navbar-item" :class="{'is-active':currentView===DebugPage}">
          <span v-if="$sessions.runningSessionsLength()"><b>Debugger ({{ $sessions.runningSessionsLength() }})</b></span>
          <span v-else>Debugger</span>
          <i class="fa"></i>
        </a>
        <a href="#/" class="navbar-item" :class="{'is-active':currentView===TrafficPage}">
          Traffic
        </a>
<!--        <a href="#/cli" class="navbar-item" :class="{'is-active':currentView===CLIPage}">-->
<!--          CLI-->
<!--        </a>-->
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
