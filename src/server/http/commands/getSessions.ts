import { sessionRepository, SessionRepository } from "../../../session/sessionRepository";

class GetSessions {
  constructor(private sessions: SessionRepository) {
  }

  handle() {
    return this.sessions.all().map(session => ({
      id: session.id,
      state: session.state,
      time: session.time,
    }))
  }
}

export const getSessions = new GetSessions(sessionRepository);
