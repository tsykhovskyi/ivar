<script setup lang="ts">
import Toolbar from './../components/debugger/Toolbar.vue';
import Debugger from './../components/debugger/Debugger.vue';
import Tabs from './../components/debugger/Tabs.vue';
import { DebuggerState } from '@/api/debugger/debugger';
import { $sessions, closeSession, setActiveSessionId } from '@/state/sessions';

</script>

<template>
  <div class="container is-fluid" style="height: calc(100vh - 60px)">
    <div style="height: 150px">
      <Toolbar :is-active="$sessions.activeDebugger()?.state === DebuggerState.Running"/>
      <Tabs
          :sessions="$sessions.sessions"
          :active-session="$sessions.activeSessionId"
          @onSessionToggle="setActiveSessionId($event)"
          @onSessionClose="closeSession($event)"
      ></Tabs>
    </div>
    <div style="height: calc(100vh - 60px - 150px)">
      <Debugger :debugger-response="$sessions.activeDebugger()"/>
    </div>
  </div>
</template>
