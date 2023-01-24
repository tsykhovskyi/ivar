import type { DebuggerResponse, Session } from '@/api/debugger/debugger';
import type { Http } from '@/api/http';
import type { Ws } from '@/api/ws';

export class DebuggerApi {
  private sessionsUpdateListeners: Array<(sessions: Session[]) => void> = [];
  private debuggerResponseListeners: Array<
    (response: DebuggerResponse) => void
  > = [];

  private sessionId: string | null = null;

  constructor(private http: Http, private ws: Ws) {
    this.ws.onMessage((data) => {
      const { type, message } = JSON.parse(data);
      if (type === 'sessions') {
        this.sessionsUpdateListeners.forEach((listener) =>
          listener(message as Session[])
        );
      }
    });
  }

  async sessions(): Promise<Session[]> {
    return this.http.get('/sessions');
  }

  async finishSession(sessionId: string): Promise<void> {
    await this.http.delete(`/sessions/${sessionId}`);
  }

  addWatch(watch: string): Promise<DebuggerResponse> {
    return this.debuggerCommand('add-watch', watch);
  }

  removeWatch(watch: string): Promise<DebuggerResponse> {
    return this.debuggerCommand('remove-watch', watch);
  }

  setSessionId(sessionId: string | null) {
    this.sessionId = sessionId;
  }

  refresh(): Promise<DebuggerResponse> {
    return this.debuggerCommand('');
  }

  step(): Promise<DebuggerResponse> {
    return this.debuggerCommand('step');
  }

  continue(): Promise<DebuggerResponse> {
    return this.debuggerCommand('continue');
  }

  abort(): Promise<DebuggerResponse> {
    return this.debuggerCommand('abort');
  }

  restart(): Promise<DebuggerResponse> {
    return this.debuggerCommand('restart');
  }

  addBreakpoint(line: number): Promise<DebuggerResponse> {
    return this.debuggerCommand('add-breakpoint', `${line}`);
  }

  removeBreakpoint(line: number): Promise<DebuggerResponse> {
    return this.debuggerCommand('remove-breakpoint', `${line}`);
  }

  onSessionsUpdate(listener: (sessions: Session[]) => void): void {
    this.sessionsUpdateListeners.push(listener);
  }

  removeSessionsUpdateListener(listener: (sessions: Session[]) => void): void {
    for (let i = 0; i < this.sessionsUpdateListeners.length; i += 1) {
      if (this.sessionsUpdateListeners[i] === listener) {
        this.sessionsUpdateListeners = this.sessionsUpdateListeners.splice(
          i,
          1
        );
      }
    }
  }

  onDebuggerResponse(listener: (response: DebuggerResponse) => void): void {
    this.debuggerResponseListeners.push(listener);
  }

  removeDebuggerResponseListener(
    listener: (response: DebuggerResponse) => void
  ): void {
    for (let i = 0; i < this.debuggerResponseListeners.length; i += 1) {
      if (this.debuggerResponseListeners[i] === listener) {
        this.debuggerResponseListeners = this.debuggerResponseListeners.splice(
          i,
          1
        );
      }
    }
  }

  private async debuggerCommand(
    cmd: string,
    value?: string
  ): Promise<DebuggerResponse> {
    if (this.sessionId === null) {
      throw new Error('no session defined');
    }
    const sessionId = this.sessionId;
    const response = await this.sendCommand(sessionId, cmd, value);

    this.debuggerResponseListeners.forEach((listener) =>
      listener({ ...response, sessionId })
    );

    return response;
  }

  private async sendCommand(
    sessionId: string,
    command: string,
    argument?: string
  ): Promise<DebuggerResponse> {
    return this.http.post<DebuggerResponse>('/cmd', {
      sessionId,
      action: command,
      value: argument ?? null,
    });
  }
}
