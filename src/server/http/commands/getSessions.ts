import { sessionRepository, SessionRepository } from "../../../session/sessionRepository";

class GetSessions {
  constructor(private sessions: SessionRepository) {
  }

  handle() {
    return this.sessions.all().map(session => ({
      id: session.id,
      state: session.state,
    }))
  }
}

export const getSessions = new GetSessions(sessionRepository);
