import { reactive } from 'vue';
import { api } from '@/api';
import type { DebuggerResponse, Session } from '@/api/debugger/debugger';
import { DebuggerState } from '@/api/debugger/debugger';

export const $sessions = reactive(<
  {
    debuggerResponses: Map<string, DebuggerResponse>;
    activeSessionId: string | null;
    sessions: Session[];
    runningSessionsLength(): number;
    activeDebugger(): DebuggerResponse | null;
  }
>{
  debuggerResponses: new Map(),
  activeSessionId: null,
  sessions: [],
  runningSessionsLength() {
    return this.sessions.filter((s) => s.state === DebuggerState.Running)
      .length;
  },
  activeDebugger(): DebuggerResponse | null {
    if (this.activeSessionId === null) {
      return null;
    }
    return this.debuggerResponses.get(this.activeSessionId) ?? null;
  },
});

export const setActiveSessionId = async (
  activeSessionId: string | null
): Promise<void> => {
  $sessions.activeSessionId = activeSessionId;
  api.debugger.setSessionId(activeSessionId);
  await api.debugger.refresh();
};

const updateSessions = async (sessions: Session[]) => {
  $sessions.sessions = [...sessions].sort(
    (a, b) => b.time.updated - a.time.updated
  );

  const activeSessionId = $sessions.sessions[0]?.id ?? null;

  await setActiveSessionId(activeSessionId);
};

export const closeSession = async (sessionId: string): Promise<void> => {
  await api.debugger.finishSession(sessionId);
  $sessions.debuggerResponses.delete(sessionId);
};

api.debugger.onSessionsUpdate(updateSessions);
api.debugger.onDebuggerResponse((response) => {
  $sessions.debuggerResponses.set(response.sessionId, response);
});
updateSessions(await api.debugger.sessions()).then(() => {});
