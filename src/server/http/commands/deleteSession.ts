import { Action } from '../../../session/types';
import {
  SessionRepository,
  sessionRepository,
} from '../../../state/sessionRepository';

class DeleteSession {
  constructor(private sessions: SessionRepository) {}

  async handle(sessionId: string) {
    const session = this.sessions.get(sessionId);
    await session.execAction(Action.Abort, []);
    this.sessions.delete(sessionId);
  }
}

export const deleteSession = new DeleteSession(sessionRepository);
