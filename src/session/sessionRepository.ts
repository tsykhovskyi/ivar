import { SessionInterface } from "./session.interface";
import EventEmitter from 'events';

export declare interface SessionRepository {
  on(event: 'change', handler: () => void): this;
}

export class SessionRepository extends EventEmitter {
  private sessions = new Map<string, SessionInterface>();

  add(session: SessionInterface): SessionInterface {
    this.sessions.set(session.id, session);
    this.emit('change');
    return session;
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.emit('change');
  }

  all(): SessionInterface[] {
    return [...this.sessions.values()];
  }

  first(): SessionInterface | null {
    const firstKey = [...this.sessions.keys()][0] ?? null;

    return this.sessions.get(firstKey) ?? null;
  }
}

export const sessionRepository = new SessionRepository();
