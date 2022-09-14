<script setup lang="ts">
import Toolbar from "./components/Toolbar.vue";
import Debugger from "./components/Debugger.vue";
import Tabs from "./components/Tabs.vue";
import { api } from "@/api";
import { onMounted, ref } from "vue";
import type { DebuggerResponse, Session } from "@/api/api";

const sessions = ref<Session[]>([]);
const activeSession = ref<string | null>(null);
const debuggerResponse = ref<DebuggerResponse | null>(null);

async function exec(action: string) {
  if (activeSession.value === null) {
    return;
  }
  switch (action) {
    case 'step':
      debuggerResponse.value = await api.step(activeSession.value);
      break;
    case 'continue':
      debuggerResponse.value = await api.continue(activeSession.value);
      break;
    case 'abort':
      debuggerResponse.value = await api.abort(activeSession.value);
      break;
    case 'restart':
      debuggerResponse.value = await api.restart(activeSession.value);
      break;
  }
}

async function changeSession(sessionId: string) {
  if (activeSession.value === sessionId) {
    activeSession.value = null;
    debuggerResponse.value = null;
    return;
  }
  activeSession.value = sessionId;
  debuggerResponse.value = await api.refresh(sessionId);
}

onMounted(async () => {
  api.onSessionsUpdate(response => sessions.value = response);
  sessions.value = await api.sessions();
});
</script>

<template>
  <div class="container is-fluid">
    <div style="height: 10vh">
      <Toolbar :is-active="!!activeSession" @action="exec($event)"/>
      <Tabs :sessions="sessions" :active-session="activeSession" @onSessionChange="changeSession($event)"></Tabs>
    </div>
    <div style="height: 90vh">
      <Debugger :debugger-response="debuggerResponse"/>
    </div>
  </div>
</template>
