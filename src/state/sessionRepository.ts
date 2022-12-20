import EventEmitter from 'events';
import { Session } from '../session/session';

export declare interface SessionRepository {
  on(event: 'change', handler: () => void): this;
}

export class SessionRepository extends EventEmitter {
  private sessions = new Map<string, Session>();

  add(session: Session): Session {
    this.sessions.set(session.id, session);
    session.on('state-change', () => this.emit('change'));
    this.emit('change');
    return session;
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.emit('change');
  }

  all(): Session[] {
    return [...this.sessions.values()];
  }

  get(id: string): Session {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session with id = ${id} was not found`);
    }
    return session;
  }
}

export const sessionRepository = new SessionRepository();
