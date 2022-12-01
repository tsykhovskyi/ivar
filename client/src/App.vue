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

async function changeSession(sessionIdSelected: string) {
  activeSession.value = activeSession.value !== sessionIdSelected ? sessionIdSelected : null;
  api.setSessionId(activeSession.value);

  if (activeSession.value !== null) {
    debuggerResponse.value = await api.refresh();
  } else {
    debuggerResponse.value = null;
  }
}

async function closeSession(sessionId: string) {
  await api.finishSession(sessionId);
}

onMounted(async () => {
  api.onSessionsUpdate(response => sessions.value = response);
  api.onDebuggerResponse(response => debuggerResponse.value = response);
  sessions.value = await api.sessions();
});
</script>

<template>
  <div class="container is-fluid">
    <div style="height: 10vh">
      <Toolbar :is-active="!!activeSession"/>
      <Tabs
          :sessions="sessions"
          :active-session="activeSession"
          @onSessionToggle="changeSession($event)"
          @onSessionClose="closeSession($event)"
      ></Tabs>
    </div>
    <div style="height: 90vh">
      <Debugger :debugger-response="debuggerResponse"/>
    </div>
  </div>
</template>
