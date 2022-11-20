import { SessionRepository, sessionRepository } from "../../../session/sessionRepository";
import { Action } from "../../../session/session.interface";

export interface DebuggerActionRequest {
  sessionId: string;
  action: Action;
  value: string | null;
}

class DebuggerAction {
  constructor(private sessions: SessionRepository) {
  }

  handle(request: DebuggerActionRequest) {
    const session = this.sessions.get(request.sessionId);
    if (!session) {
      throw new Error('Debugger is absent');
    }

    const values = request.value ? [request.value] : [];

    return session.execAction(request.action, values);
  }
}

export const debuggerAction = new DebuggerAction(sessionRepository);
