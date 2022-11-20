import { TcpClientDebugger } from "../../../ldb/tcp/tcp-client-debugger";
import { SessionRepository, sessionRepository } from "../../../session/sessionRepository";
import { Session } from "../../../session/session";
import { RedisClient } from '../../../redis-client/redis-client';
import { RedisValue } from '../../../redis-client/resp-converter';

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
    const client = new RedisClient({ ...request.redis });
    const session = new Session(new TcpClientDebugger(client));
    this.sessionsRepository.add(session);

    try {
      await session.start(this.mapToRedisCommand(request));

      const result = await session.finished();

      return result;
    } catch (error) {
      throw error;
    } finally {
      this.sessionsRepository.delete(session.id);
    }
  }

  private mapToRedisCommand(request: ExecuteScriptRequest): RedisValue {
    const toCliDebugArg = (arg: string | number | boolean | null): string => arg === null ? '' : arg.toString();

    return [
      'EVAL',
      request.lua,
      request.numberOfKeys.toString(),
      ...request.args.slice(0, request.numberOfKeys).map(toCliDebugArg),
      ...request.args.slice(request.numberOfKeys).map(toCliDebugArg),
    ]
  }
}

export const executeScript = new ExecuteScriptCommand(sessionRepository);