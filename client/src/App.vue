<script setup lang="ts">
import Toolbar from "./components/Toolbar.vue";
import Debugger from "./components/Debugger.vue";
import Tabs from "./components/Tabs.vue";
import { api } from "@/api";
import { onMounted, ref } from "vue";
import type { DebuggerResponse, Session } from "@/api/api";
import { DebuggerState } from '@/api/api';

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
    sessions.value = [..._sessions].sort((a, b) => b.time.started - a.time.started);
    if (_sessions.length > 0) {
      const lastRunningSession = [..._sessions]
          .filter(s => s.state === DebuggerState.Running)
          .sort((a, b) => b.time.updated - a.time.updated)[0];
      if (activeSession.value !== lastRunningSession.id) {
        toggleActiveSession(lastRunningSession.id);
      }
    } else {
      activeSession.value = null;
    }
  };
  api.onSessionsUpdate(updateSessions);
  api.onDebuggerResponse(response => debuggerResponse.value = response);
  updateSessions(await api.sessions());
});
</script>

<template>
  <div class="container is-fluid" style="height: 100vh">
    <div style="height: 150px">
      <Toolbar :is-active="!!activeSession"/>
      <Tabs
          :sessions="sessions"
          :active-session="activeSession"
          @onSessionToggle="toggleActiveSession($event)"
          @onSessionClose="closeSession($event)"
      ></Tabs>
    </div>
    <div style="height: calc(100vh - 150px)">
      <Debugger :debugger-response="debuggerResponse"/>
    </div>
  </div>
</template>
