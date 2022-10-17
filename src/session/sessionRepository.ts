import { SessionInterface } from "./session.interface";

export class SessionRepository {
  private sessions = new Map<string, SessionInterface>();

  add(session: SessionInterface): SessionInterface {
    this.sessions.set(session.id, session);
    return session;
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
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
