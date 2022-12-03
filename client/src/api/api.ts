import type { Http } from "./http";
import type { Ws } from "./ws";

export interface ServerConfig {
  intercept: boolean;
  scriptFilters: string[];
}

export enum DebuggerState {
  Pending = 'pending',
  Running = 'running',
  Finished = 'finished',
  Error = 'error',
}

export interface Session {
  id: string;
  state: DebuggerState;
  time: {
    started: number;
    updated: number;
    finished?: number;
  }
}

export interface Line {
  content: string;
  number: number;
  isCurrent: boolean;
  isBreakpoint: boolean;
}

export interface DebuggerResponse {
  id: string;
  cmdResponse: string[];
  sourceCode: Line[];
  watch: {
    name: string;
    value: string | null;
  }[];
  variables: {
    name: string;
    value: string;
  }[];
  trace: string[];
}

export class Api {
  private sessionsUpdateListeners: Array<(sessions: Session[]) => void> = [];
  private debuggerResponseListeners: Array<(response: DebuggerResponse) => void> = [];

  private sessionId: string | null = null;

  constructor(private http: Http, private ws: Ws) {
    this.ws.onMessage((message => {
      const data = JSON.parse(message);
      this.sessionsUpdateListeners.forEach(listener => listener(data as Session[]));
    }));
  }

  async sessions(): Promise<Session[]> {
    return this.http.get('/sessions');
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

  private async debuggerCommand(cmd: string, value?: string): Promise<DebuggerResponse> {
    if (this.sessionId === null) {
      throw new Error('no session defined')
    }
    const response = await this.sendCommand(this.sessionId, cmd, value);

    this.debuggerResponseListeners.forEach(listener => listener(response));

    return response;
  }

  private async sendCommand(sessionId: string, command: string, argument?: string): Promise<DebuggerResponse> {
    return this.http.post<DebuggerResponse>('/cmd', {
      sessionId,
      action: command,
      value: argument ?? null,
    })
  }
}
