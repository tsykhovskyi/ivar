import type { Http } from './http';
import type { Ws } from './ws';
import type { DebuggerResponse, Session } from '@/api/types/debugger';
import type { RedisRequest } from '@/api/types/traffic';

export interface ServerConfig {
  intercept: boolean;
  syncMode: boolean;
  scriptFilters: string[];
  server: {
    title: string;
    version: string;
  };
}

export class Api {
  private sessionsUpdateListeners: Array<(sessions: Session[]) => void> = [];
  private debuggerResponseListeners: Array<
    (response: DebuggerResponse) => void
  > = [];
  private trafficListeners: Array<(request: RedisRequest) => void> = [];

  private sessionId: string | null = null;

  constructor(private http: Http, private ws: Ws) {
    this.ws.onMessage((data) => {
      const { type, message } = JSON.parse(data);
      if (type === 'sessions') {
        this.sessionsUpdateListeners.forEach((listener) =>
          listener(message as Session[])
        );
      }
      if (type === 'request') {
        this.trafficListeners.forEach((listener) => {
          listener(message);
        });
      }
    });
  }

  async sessions(): Promise<Session[]> {
    return this.http.get('/sessions');
  }

  async traffic(): Promise<RedisRequest[]> {
    return this.http.get('/traffic');
  }

  async config(): Promise<ServerConfig> {
    return this.http.get('/config');
  }

  async updateConfig(config: ServerConfig) {
    await this.http.post('/config', config);
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

  onDebuggerResponse(listener: (response: DebuggerResponse) => void): void {
    this.debuggerResponseListeners.push(listener);
  }

  onTraffic(listener: (request: RedisRequest) => void): void {
    this.trafficListeners.push(listener);
  }

  private async debuggerCommand(
    cmd: string,
    value?: string
  ): Promise<DebuggerResponse> {
    if (this.sessionId === null) {
      throw new Error('no session defined');
    }
    const response = await this.sendCommand(this.sessionId, cmd, value);

    this.debuggerResponseListeners.forEach((listener) => listener(response));

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
