import { sessionRepository, SessionRepository } from '../../../session/sessionRepository';
import { Action } from '../../../session/session.interface';

class DeleteSession {
  constructor(private sessions: SessionRepository) {
  }

  async handle(sessionId: string) {
    const session = this.sessions.get(sessionId);
    await session.execAction(Action.Abort, []);
    this.sessions.delete(sessionId);
  }
}

export const deleteSession = new DeleteSession(sessionRepository);
