<script setup lang="ts">
import DebugPage from './components/debug.page.vue';
import { ref } from 'vue';

let page = ref<string>('debugger');
</script>

<template>
  <nav class="navbar is-transparent">
    <div class="navbar-menu">
      <div class="navbar-start">
        <a class="navbar-item" :class="{'is-active':page==='debugger'}" @click="page='debugger'">Debugger</a>
        <a class="navbar-item" :class="{'is-active':page==='logger'}" @click="page='logger'">Logger</a>
      </div>
    </div>
  </nav>

  <DebugPage v-if="page==='debugger'"></DebugPage>
</template>
