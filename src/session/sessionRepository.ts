import { SessionInterface } from "./session.interface";
import EventEmitter from 'events';

export declare interface SessionRepository {
  on(event: 'change', handler: () => void): this;
}

export class SessionRepository extends EventEmitter {
  private sessions = new Map<string, SessionInterface>();

  add(session: SessionInterface): SessionInterface {
    this.sessions.set(session.id, session);
    session.on('state-change', () => this.emit('change'));
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

  get(id: string): SessionInterface {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session with id = ${id} was not found`);
    }
    return session;
  }
}

export const sessionRepository = new SessionRepository();
