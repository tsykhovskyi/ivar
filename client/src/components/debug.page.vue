<script setup lang="ts">
import Toolbar from './../components/debugger/Toolbar.vue';
import Debugger from './../components/debugger/Debugger.vue';
import Tabs from './../components/debugger/Tabs.vue';
import { api } from '@/api';
import { onMounted, onUnmounted, ref } from 'vue';
import type { DebuggerResponse, Session } from '@/api/debugger/debugger';
import { DebuggerState } from '@/api/debugger/debugger';
import { $sessions } from '@/state/sessions';

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

async function setActiveSession(sessionIdSelected: string) {
  activeSession.value = sessionIdSelected;
  api.debugger.setSessionId(activeSession.value);

  debuggerResponse.value = await api.debugger.refresh();
}

async function closeSession(sessionId: string) {
  await api.debugger.finishSession(sessionId);
}

const updateSessions = async (_sessions: Session[]) => {
  $sessions.activeSessions = _sessions.filter(s => s.state === DebuggerState.Running).length;

  sessions.value = [..._sessions].sort(
      (a, b) => b.time.updated - a.time.updated
  );
  if (_sessions.length > 0) {
    const lastRunningSession = sessions.value[0];
    await setActiveSession(lastRunningSession.id);
  } else {
    activeSession.value = null;
  }
  console.log(activeSession.value);
};

const updateResponse = (response: DebuggerResponse) => debuggerResponse.value = response;

onMounted(async () => {
  api.debugger.onSessionsUpdate(updateSessions);
  api.debugger.onDebuggerResponse(updateResponse);
  updateSessions(await api.debugger.sessions());
});

onUnmounted(() => {
  api.debugger.removeSessionsUpdateListener(updateSessions);
  api.debugger.removeDebuggerResponseListener(updateResponse);
});
</script>

<template>
  <div class="container is-fluid" style="height: calc(100vh - 60px)">
    <div style="height: 150px">
      <Toolbar :is-active="isActiveSessionRunning()"/>
      <Tabs
          :sessions="sessions"
          :active-session="activeSession"
          @onSessionToggle="setActiveSession($event)"
          @onSessionClose="closeSession($event)"
      ></Tabs>
    </div>
    <div style="height: calc(100vh - 60px - 150px)">
      <Debugger :debugger-response="debuggerResponse"/>
    </div>
  </div>
</template>
