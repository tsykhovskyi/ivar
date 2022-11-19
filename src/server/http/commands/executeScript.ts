import { TcpClientDebugger } from "../../../ldb/tcp/tcp-client-debugger";
import { SessionRepository, sessionRepository } from "../../../session/sessionRepository";
import { Session } from "../../../session/session";

export interface ExecuteScriptRequest {
  lua: string;
  redis: { host: string; port: number };
  numberOfKeys: number;
  args: Array<string | number | boolean | null>;
}

export class ExecuteScriptCommand {
  constructor(private sessionsRepository: SessionRepository) {
  }

  async handle(request: ExecuteScriptRequest): Promise<unknown> {
    const session = new Session(new TcpClientDebugger(request), ['arg1', 't_members']);
    this.sessionsRepository.add(session);

    try {
      await session.init();

      const result = await session.finished();

      return result;
    } catch (error) {
      throw error;
    } finally {
      this.sessionsRepository.delete(session.id);
    }
  }
}

export const executeScript = new ExecuteScriptCommand(sessionRepository);
