import type { Http } from "./http";
import type { Ws } from "./ws";

export enum DebuggerState {
  Pending = 'pending',
  Running = 'running',
  Finished = 'finished',
  Error = 'error',
}

export interface Session {
  id: string;
  state: DebuggerState;
}

export interface Line {
  content: string;
  number: number;
  isCurrent: boolean;
  isBreakpoint: boolean;
}

export interface Variable {
  name: string;
  value: string;
}

export interface DebuggerResponse {
  id: string;
  cmdResponse: string;
  sourceCode: Line[];
  watch: Variable[];
  variables: Variable[];
  trace: string;
}

export class Api {
  private sessionsUpdateListeners: ((sessions: Session[]) => void)[] = [];

  constructor(private http: Http, private ws: Ws) {
    this.ws.onMessage((message => {
      const data = JSON.parse(message);
      this.sessionsUpdateListeners.forEach(listener => listener(data as Session[]));
    }));
  }

  async sessions(): Promise<Session[]> {
    return this.http.sessions();
  }

  refresh(sessionId: string): Promise<DebuggerResponse> {
    return this.http.sendCommand('');
  }

  step(sessionId: string): Promise<DebuggerResponse> {
    return this.http.sendCommand('step');
  }

  continue(sessionId: string): Promise<DebuggerResponse> {
    return this.http.sendCommand('continue');
  }

  abort(sessionId: string): Promise<DebuggerResponse> {
    return this.http.sendCommand('abort');
  }

  restart(sessionId: string): Promise<DebuggerResponse> {
    return this.http.sendCommand('restart');
  }

  onSessionsUpdate(listener: (sessions: Session[]) => void): void {
    this.sessionsUpdateListeners.push(listener);
  }
}
