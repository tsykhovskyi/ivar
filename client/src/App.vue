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

async function toggleActiveSession(sessionIdSelected: string) {
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
  const updateSessions = (_sessions: Session[]) => {
    sessions.value = [..._sessions].sort((a, b) => a.time.started - b.time.started);
    if (_sessions.length > 0) {
      const lastSession = [..._sessions].sort((a, b) => b.time.updated - a.time.updated)[0];
      if (activeSession.value !== lastSession.id) {
        toggleActiveSession(lastSession.id);
      }
    }
  };
  api.onSessionsUpdate(updateSessions);
  api.onDebuggerResponse(response => debuggerResponse.value = response);
  updateSessions(await api.sessions());
});
</script>

<template>
  <div class="container is-fluid">
    <div style="height: 10vh">
      <Toolbar :is-active="!!activeSession"/>
      <Tabs
          :sessions="sessions"
          :active-session="activeSession"
          @onSessionToggle="toggleActiveSession($event)"
          @onSessionClose="closeSession($event)"
      ></Tabs>
    </div>
    <div style="height: 90vh">
      <Debugger :debugger-response="debuggerResponse"/>
    </div>
  </div>
</template>
