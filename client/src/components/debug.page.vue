<script setup lang="ts">
import Toolbar from './../components/debugger/Toolbar.vue';
import Debugger from './../components/debugger/Debugger.vue';
import Tabs from './../components/debugger/Tabs.vue';
import { api } from '@/api';
import { onMounted, ref } from 'vue';
import type { DebuggerResponse, Session } from '@/api/types/debugger';
import { DebuggerState } from '@/api/types/debugger';

const sessions = ref<Session[]>([]);
const activeSession = ref<string | null>(null);
const debuggerResponse = ref<DebuggerResponse | null>(null);

const isActiveSessionRunning = () => {
  const session = sessions.value.find(s => s.id === activeSession.value);
  if (!session) {
    return false;
  }

  return session.state === DebuggerState.Running;
}

async function toggleActiveSession(sessionIdSelected: string) {
  activeSession.value =
      activeSession.value !== sessionIdSelected ? sessionIdSelected : null;
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
    sessions.value = [..._sessions].sort(
        (a, b) => b.time.updated - a.time.updated
    );
    if (_sessions.length > 0) {
      const lastRunningSession = sessions.value[0];
      if (activeSession.value !== lastRunningSession.id) {
        toggleActiveSession(lastRunningSession.id);
      }
    } else {
      activeSession.value = null;
    }
  };
  api.onSessionsUpdate(updateSessions);
  api.onDebuggerResponse((response) => (debuggerResponse.value = response));
  updateSessions(await api.sessions());
});
</script>

<template>
  <div class="container is-fluid" style="height: calc(100vh - 60px)">
    <div style="height: 150px">
      <Toolbar :is-active="isActiveSessionRunning()"/>
      <Tabs
          :sessions="sessions"
          :active-session="activeSession"
          @onSessionToggle="toggleActiveSession($event)"
          @onSessionClose="closeSession($event)"
      ></Tabs>
    </div>
    <div style="height: calc(100vh - 60px - 150px)">
      <Debugger :debugger-response="debuggerResponse"/>
    </div>
  </div>
</template>
